// backend/models/models_pedidos.js
// Pedidos web y ventas de mostrador viven en la misma tabla (pedidos.canal).
// Todo cambio de stock pasa por aplicarMovimiento(): bloquea la fila y deja kardex.
import pool from '../db/db.js';
import { ErrorNegocio } from '../helpers/errores.js';
import { TRANSICIONES } from '../helpers/constantes_negocio.js';
import { aplicarMovimiento } from './models_inventario.js';

const ZONA = 'America/Lima';

const COLS = `p.id, p.usuario_id, p.cliente_nombre, p.canal, p.estado, p.total, p.metodo_pago,
  p.entrega, p.direccion, p.telefono, p.nota, p.creado_en, p.actualizado_en,
  p.entregado_en, p.cancelado_en, p.pago_estado, p.pagado_en`;

// Items del pedido como JSON (numeric -> número en JSON)
const ITEMS = `COALESCE((
  SELECT json_agg(json_build_object(
           'producto_id', pi.producto_id, 'nombre', pi.nombre_producto,
           'precio', pi.precio_unitario, 'cantidad', pi.cantidad,
           'subtotal', pi.subtotal, 'imagen', pr.imagen) ORDER BY pi.id)
    FROM pedido_items pi
    JOIN productos pr ON pr.id = pi.producto_id
   WHERE pi.pedido_id = p.id), '[]'::json) AS items`;

const mapear = (f) => (f ? { ...f, total: Number(f.total) } : null);

const escaparLike = (s) => s.replace(/[\\%_]/g, '\\$&');

async function conTransaccion(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await fn(client);
    await client.query('COMMIT');
    return r;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function obtener(db, id) {
  const { rows } = await db.query(`SELECT ${COLS}, ${ITEMS} FROM pedidos p WHERE p.id = $1`, [id]);
  return mapear(rows[0]);
}

export const PedidoModel = {
  obtener: (id) => obtener(pool, id),

  /**
   * Crea un pedido web o una venta de mostrador, en UNA transacción:
   * cabecera -> por cada item (ordenados por id, evita deadlocks): valida, descuenta stock,
   * guarda el item con el precio de la BD (nunca el del cliente) -> total.
   * Si un producto no alcanza, se deshace TODO.
   */
  async crear({
    canal, usuarioId = null, clienteNombre, metodoPago = null, entrega = 'recojo',
    direccion = null, telefono = null, nota = null, items, registradoPor = null, permitirReceta = false,
  }) {
    return conTransaccion(async (client) => {
      const entregadoYa = canal === 'mostrador';
      const { rows } = await client.query(
        `INSERT INTO pedidos
           (usuario_id, cliente_nombre, canal, estado, metodo_pago, entrega, direccion, telefono, nota,
            registrado_por, entregado_en, pago_estado, pagado_en)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                 CASE WHEN $11::boolean THEN NOW() END,
                 CASE WHEN $11::boolean THEN 'pagado' ELSE 'pendiente' END,  -- en mostrador se cobra al instante
                 CASE WHEN $11::boolean THEN NOW() END)
         RETURNING id`,
        [usuarioId, clienteNombre, canal, entregadoYa ? 'entregado' : 'pendiente', metodoPago,
          entrega, direccion, telefono, nota, registradoPor, entregadoYa]
      );
      const pedidoId = rows[0].id;

      const ordenados = [...items].sort((a, b) => a.productoId - b.productoId);
      for (const { productoId, cantidad } of ordenados) {
        const { rows: pr } = await client.query(
          'SELECT id, nombre, precio, activo, requiere_receta FROM productos WHERE id = $1 FOR UPDATE',
          [productoId]
        );
        const prod = pr[0];
        if (!prod || !prod.activo) {
          throw new ErrorNegocio(409, 'Uno de los productos ya no está disponible. Actualiza tu carrito.');
        }
        if (prod.requiere_receta && !permitirReceta) {
          throw new ErrorNegocio(
            409,
            canal === 'web'
              ? `"${prod.nombre}" requiere receta médica: cómpralo en la farmacia presentando tu receta.`
              : `"${prod.nombre}" requiere receta: confirma que la verificaste.`
          );
        }
        // Lanza 409 "Stock insuficiente de ..." si no alcanza
        await aplicarMovimiento(client, {
          productoId, tipo: 'salida', cantidad, motivo: 'venta',
          usuarioId: registradoPor ?? usuarioId, pedidoId,
        });
        await client.query(
          `INSERT INTO pedido_items (pedido_id, producto_id, nombre_producto, precio_unitario, cantidad)
           VALUES ($1,$2,$3,$4,$5)`,
          [pedidoId, productoId, prod.nombre, prod.precio, cantidad]
        );
      }

      await client.query(
        `UPDATE pedidos
            SET total = (SELECT COALESCE(SUM(subtotal), 0) FROM pedido_items WHERE pedido_id = $1)
          WHERE id = $1`,
        [pedidoId]
      );
      return obtener(client, pedidoId);
    });
  },

  /**
   * Cambia el estado respetando TRANSICIONES. Si pasa a 'cancelado', devuelve el stock.
   * Opciones: duenoId -> solo si el pedido es de ese usuario; desde -> estados de origen permitidos;
   *           canal -> el pedido debe ser de ese canal.
   */
  async cambiarEstado(id, nuevo, { usuarioId = null, duenoId = null, desde = null, canal = null } = {}) {
    return conTransaccion(async (client) => {
      const { rows } = await client.query(
        'SELECT id, usuario_id, canal, estado, pago_estado FROM pedidos WHERE id = $1 FOR UPDATE',
        [id]
      );
      const p = rows[0];
      if (!p || (duenoId !== null && p.usuario_id !== duenoId) || (canal && p.canal !== canal)) return null;

      if (desde && !desde.includes(p.estado)) {
        throw new ErrorNegocio(409, 'Este pedido ya no se puede cancelar: comunícate con la farmacia.');
      }
      if (!TRANSICIONES[p.canal][p.estado].includes(nuevo)) {
        throw new ErrorNegocio(409, `No se puede pasar de "${p.estado}" a "${nuevo}".`);
      }

      // Un pedido web no avanza si el cliente todavía no pagó
      if (p.canal === 'web' && nuevo !== 'cancelado' && p.pago_estado !== 'pagado') {
        throw new ErrorNegocio(409, 'El pedido aún no está pagado.');
      }

      if (nuevo === 'cancelado') {
        const { rows: items } = await client.query(
          'SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = $1 ORDER BY producto_id',
          [id]
        );
        for (const it of items) {
          await aplicarMovimiento(client, {
            productoId: it.producto_id, tipo: 'entrada', cantidad: it.cantidad,
            motivo: 'cancelacion_pedido', usuarioId, pedidoId: id,
          });
        }
      }

      await client.query(
        `UPDATE pedidos
            SET estado = $2::varchar,
                actualizado_en = NOW(),
                entregado_en = CASE WHEN $2::varchar = 'entregado' THEN NOW() ELSE entregado_en END,
                cancelado_en = CASE WHEN $2::varchar = 'cancelado' THEN NOW() ELSE cancelado_en END
          WHERE id = $1`,
        [id, nuevo]
      );
      return obtener(client, id);
    });
  },

  // ---------- Pago (lo usa models_pagos.js) ----------

  // Datos internos del pago. OJO: incluye el id de Stripe, no enviarlo tal cual al cliente.
  async datosPago(id) {
    const { rows } = await pool.query(
      `SELECT id, usuario_id, canal, estado, total, pago_estado, stripe_payment_intent_id
         FROM pedidos WHERE id = $1`,
      [id]
    );
    return rows[0] ? { ...rows[0], total: Number(rows[0].total) } : null;
  },

  async guardarPaymentIntent(id, paymentIntentId) {
    await pool.query('UPDATE pedidos SET stripe_payment_intent_id = $2 WHERE id = $1', [id, paymentIntentId]);
  },

  // Solo pasa de 'pendiente' a 'pagado' (si ya estaba pagado no hace nada)
  async marcarPagado(id) {
    await pool.query(
      `UPDATE pedidos
          SET pago_estado = 'pagado', pagado_en = NOW(), metodo_pago = 'tarjeta', actualizado_en = NOW()
        WHERE id = $1 AND pago_estado = 'pendiente'`,
      [id]
    );
  },

  async marcarReembolsado(id) {
    await pool.query(
      `UPDATE pedidos SET pago_estado = 'reembolsado', actualizado_en = NOW() WHERE id = $1`,
      [id]
    );
  },

  // Pedidos web sin pagar con más de X minutos: están reteniendo stock
  async impagosVencidos(minutos) {
    const { rows } = await pool.query(
      `SELECT id FROM pedidos
        WHERE canal = 'web' AND estado = 'pendiente' AND pago_estado = 'pendiente'
          AND creado_en < NOW() - make_interval(mins => $1::int)
        ORDER BY id LIMIT 50`,
      [minutos]
    );
    return rows.map((r) => r.id);
  },

  // Listado con items. Filtros: canal, estado, usuarioId, q (cliente, N° o producto)
  // soloVentas: mostrador + pedidos web ya cobrados.  noCancelados: excluye anulados.
  async listar({ canal, estado, usuarioId, q, limite, offset, soloVentas = false, noCancelados = false }) {
    const cond = [];
    const params = [];
    const add = (sql, v) => { params.push(v); cond.push(sql.replace('?', `$${params.length}`)); };

    if (soloVentas) cond.push("(p.canal = 'mostrador' OR p.pago_estado <> 'pendiente')");
    if (noCancelados) cond.push("p.estado <> 'cancelado'");
    if (canal) add('p.canal = ?', canal);
    if (estado) add('p.estado = ?', estado);
    if (usuarioId) add('p.usuario_id = ?', usuarioId);
    if (q) {
      const n = Number(q.replace(/^#/, ''));
      if (Number.isInteger(n) && n > 0 && n < 2_147_483_647) add('p.id = ?', n);
      else {
        params.push(`%${escaparLike(q)}%`);
        const i = params.length;
        cond.push(`(p.cliente_nombre ILIKE $${i} OR EXISTS (
          SELECT 1 FROM pedido_items x WHERE x.pedido_id = p.id AND x.nombre_producto ILIKE $${i}))`);
      }
    }
    params.push(limite, offset);

    const { rows } = await pool.query(
      `SELECT ${COLS}, ${ITEMS}, u.nombre AS registrado_por_nombre, COUNT(*) OVER() AS total_filas
         FROM pedidos p
         LEFT JOIN usuarios u ON u.id = p.registrado_por
        ${cond.length ? `WHERE ${cond.join(' AND ')}` : ''}
        ORDER BY p.creado_en DESC, p.id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const total = rows[0] ? Number(rows[0].total_filas) : 0;
    return { items: rows.map(({ total_filas: _t, ...f }) => mapear(f)), total };
  },

  // Conteo por estado de los pedidos web (tarjetas del módulo Pedidos)
  async resumenEstados() {
    const { rows } = await pool.query(
      `SELECT estado, COUNT(*)::int AS n FROM pedidos WHERE canal = 'web' GROUP BY estado`
    );
    const r = { pendiente: 0, confirmado: 0, en_camino: 0, entregado: 0, cancelado: 0 };
    rows.forEach((f) => { r[f.estado] = f.n; });
    return r;
  },

  // Ingresos = pedidos PAGADOS y no cancelados (web + mostrador), con la hora de Perú.
  // Un pedido web cuenta desde que se paga con tarjeta, aunque todavía no se entregue.
  async resumenVentas() {
    const { rows } = await pool.query(
      `WITH t AS (
         SELECT date_trunc('day',   NOW() AT TIME ZONE $1::text) AT TIME ZONE $1::text AS dia,
                date_trunc('month', NOW() AT TIME ZONE $1::text) AT TIME ZONE $1::text AS mes
       )
       SELECT
         COUNT(*) FILTER (WHERE p.pago_estado = 'pagado' AND p.estado <> 'cancelado')                                                   AS total_ventas,
         COALESCE(SUM(p.total) FILTER (WHERE p.pago_estado = 'pagado' AND p.estado <> 'cancelado' AND p.pagado_en >= t.dia), 0) AS ingresos_hoy,
         COUNT(*)              FILTER (WHERE p.pago_estado = 'pagado' AND p.estado <> 'cancelado' AND p.pagado_en >= t.dia)     AS ventas_hoy,
         COALESCE(SUM(p.total) FILTER (WHERE p.pago_estado = 'pagado' AND p.estado <> 'cancelado' AND p.pagado_en >= t.mes), 0) AS ingresos_mes,
         COUNT(*)              FILTER (WHERE p.pago_estado = 'pagado' AND p.estado <> 'cancelado' AND p.pagado_en >= t.mes)     AS ventas_mes
       FROM pedidos p, t`,
      [ZONA]
    );
    const k = rows[0];
    const ingresosMes = Number(k.ingresos_mes);
    const ventasMes = Number(k.ventas_mes);
    return {
      totalVentas: Number(k.total_ventas),
      ventasHoy: Number(k.ventas_hoy),
      ingresosHoy: Number(k.ingresos_hoy),
      ingresosMes,
      ventasMes,
      ticketPromedio: ventasMes ? Math.round((ingresosMes / ventasMes) * 100) / 100 : 0,
    };
  },
};