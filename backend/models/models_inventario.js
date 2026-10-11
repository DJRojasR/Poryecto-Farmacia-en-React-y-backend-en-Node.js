// backend/models/models_inventario.js
import pool from '../db/db.js';
import { ErrorNegocio } from '../helpers/errores.js';
import { STOCK_BAJO } from '../helpers/motivos_inventario.js';

const COLS_MOV = `m.id, m.producto_id, m.tipo, m.cantidad, m.motivo, m.nota,
  m.stock_anterior, m.stock_resultante, m.pedido_id, m.creado_en`;

// Escapa % _ \ para que la búsqueda no sea un comodín accidental
const escaparLike = (s) => s.replace(/[\\%_]/g, '\\$&');

/**
 * Aplica un movimiento de stock DENTRO de una transacción ya abierta (client).
 * Es la ÚNICA forma de cambiar el stock: bloquea la fila, valida, actualiza y deja el kardex.
 *
 * Úsala también en el checkout (motivo 'venta', con pedidoId) y al cancelar
 * (motivo 'cancelacion_pedido'). En pedidos con varios productos, recorre los
 * items ordenados por producto_id para evitar deadlocks entre compras simultáneas.
 */
export async function aplicarMovimiento(
  client,
  { productoId, tipo, cantidad, motivo, nota = null, usuarioId = null, pedidoId = null }
) {
  const { rows } = await client.query(
    'SELECT id, nombre, stock, activo FROM productos WHERE id = $1 FOR UPDATE',
    [productoId]
  );
  const p = rows[0];
  if (!p) return null;

  // Un producto eliminado no se mueve, salvo para devolver stock de un pedido cancelado
  if (!p.activo && motivo !== 'cancelacion_pedido') {
    throw new ErrorNegocio(409, `"${p.nombre}" está eliminado del catálogo. Reactívalo primero.`);
  }

  const nuevoStock = p.stock + (tipo === 'entrada' ? cantidad : -cantidad);
  if (nuevoStock < 0) {
    throw new ErrorNegocio(409, `Stock insuficiente de "${p.nombre}": solo quedan ${p.stock}.`);
  }

  const { rows: prod } = await client.query(
    `UPDATE productos SET stock = $2, actualizado_en = NOW()
      WHERE id = $1
      RETURNING id, nombre, marca, categoria, imagen, stock, activo`,
    [productoId, nuevoStock]
  );

  const { rows: mov } = await client.query(
    `INSERT INTO movimientos_inventario AS m
       (producto_id, tipo, cantidad, motivo, nota, stock_anterior, stock_resultante, usuario_id, pedido_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING ${COLS_MOV}`,
    [productoId, tipo, cantidad, motivo, nota, p.stock, nuevoStock, usuarioId, pedidoId]
  );

  return { producto: prod[0], movimiento: mov[0] };
}

export const InventarioModel = {
  async resumen() {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int                                          AS total_productos,
              COALESCE(SUM(stock), 0)::int                           AS unidades_totales,
              COUNT(*) FILTER (WHERE stock > 0 AND stock <= $1)::int AS stock_bajo,
              COUNT(*) FILTER (WHERE stock = 0)::int                 AS sin_stock,
              COALESCE(SUM(stock * precio), 0)                       AS valor_inventario,
              (SELECT COALESCE(SUM(cantidad) FILTER (WHERE tipo = 'entrada'), 0)::int
                 FROM movimientos_inventario
                WHERE creado_en >= date_trunc('day', NOW() AT TIME ZONE 'America/Lima') AT TIME ZONE 'America/Lima') AS entradas_hoy,
              (SELECT COALESCE(SUM(cantidad) FILTER (WHERE tipo = 'salida'), 0)::int
                 FROM movimientos_inventario
                WHERE creado_en >= date_trunc('day', NOW() AT TIME ZONE 'America/Lima') AT TIME ZONE 'America/Lima') AS salidas_hoy
         FROM productos
        WHERE activo = TRUE`,
      [STOCK_BAJO]
    );
    const r = rows[0];
    return {
      totalProductos: r.total_productos,
      unidadesTotales: r.unidades_totales,
      stockBajo: r.stock_bajo,
      sinStock: r.sin_stock,
      valorInventario: Number(r.valor_inventario), // unidades x precio de venta
      entradasHoy: r.entradas_hoy,
      salidasHoy: r.salidas_hoy,
      umbralStockBajo: STOCK_BAJO,
    };
  },

  // Solo productos activos. Los de menor stock primero: lo urgente arriba.
  async listar({ q, filtro, limite, offset }) {
    const params = [STOCK_BAJO];
    const cond = ['activo = TRUE'];
    if (filtro === 'bajo') cond.push('stock > 0 AND stock <= $1');
    else if (filtro === 'agotado') cond.push('stock = 0');
    if (q) {
      params.push(`%${escaparLike(q)}%`);
      cond.push(`(nombre ILIKE $${params.length} OR marca ILIKE $${params.length})`);
    }
    params.push(limite, offset);

    const { rows } = await pool.query(
      `SELECT id, nombre, marca, categoria, subcategoria, imagen, stock, precio,
              (stock * precio) AS valor,
              (SELECT MAX(m.creado_en) FROM movimientos_inventario m WHERE m.producto_id = productos.id) AS ultimo_movimiento,
              (stock > 0 AND stock <= $1) AS stock_bajo,
              COUNT(*) OVER() AS total
         FROM productos
        WHERE ${cond.join(' AND ')}
        ORDER BY stock ASC, nombre ASC, id ASC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const total = rows[0] ? Number(rows[0].total) : 0;
    return {
      items: rows.map(({ total: _t, ...p }) => ({ ...p, precio: Number(p.precio), valor: Number(p.valor) })),
      total,
    };
  },

  // Movimiento manual del admin, en su propia transacción
  async registrarMovimiento(datos) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const resultado = await aplicarMovimiento(client, datos);
      if (!resultado) {
        await client.query('ROLLBACK');
        return null;
      }
      await client.query('COMMIT');
      return resultado;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  },

  // Kardex general: movimientos de TODOS los productos, del más reciente al más antiguo
  async movimientos({ tipo, motivo, q, limite, offset }) {
    const cond = [];
    const params = [];
    if (tipo) { params.push(tipo); cond.push(`m.tipo = $${params.length}`); }
    if (motivo) { params.push(motivo); cond.push(`m.motivo = $${params.length}`); }
    if (q) {
      params.push(`%${escaparLike(q)}%`);
      cond.push(`(pr.nombre ILIKE $${params.length} OR pr.marca ILIKE $${params.length})`);
    }
    params.push(limite, offset);
    const { rows } = await pool.query(
      `SELECT ${COLS_MOV}, pr.nombre AS producto, pr.marca, u.nombre AS usuario, COUNT(*) OVER() AS total
         FROM movimientos_inventario m
         JOIN productos pr ON pr.id = m.producto_id
         LEFT JOIN usuarios u ON u.id = m.usuario_id
        ${cond.length ? `WHERE ${cond.join(' AND ')}` : ''}
        ORDER BY m.id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const total = rows[0] ? Number(rows[0].total) : 0;
    return { items: rows.map(({ total: _t, ...m }) => m), total };
  },

  async historial(productoId, { limite, offset }) {
    const { rows } = await pool.query(
      `SELECT ${COLS_MOV}, u.nombre AS usuario, COUNT(*) OVER() AS total
         FROM movimientos_inventario m
         LEFT JOIN usuarios u ON u.id = m.usuario_id
        WHERE m.producto_id = $1
        ORDER BY m.id DESC
        LIMIT $2 OFFSET $3`,
      [productoId, limite, offset]
    );
    const total = rows[0] ? Number(rows[0].total) : 0;
    return { items: rows.map(({ total: _t, ...m }) => m), total };
  },
};