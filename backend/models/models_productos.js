import pool from '../db/db.js';

// Error "esperado" (regla de negocio): el controller lo convierte en respuesta HTTP
export class ErrorNegocio extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

// Pedidos que todavía NO se entregaron ni se cancelaron: bloquean la eliminación.
// Ajusta estos nombres a los estados reales de tu tabla pedidos.
const ESTADOS_CERRADOS = ['entregado', 'cancelado'];

const COLUMNAS = `id, nombre, marca, categoria, subcategoria, descripcion, imagen,
  precio, stock, requiere_receta, activo, creado_en, actualizado_en`;

// NUMERIC llega como string desde pg
const mapear = (f) => (f ? { ...f, precio: Number(f.precio) } : null);

// Escapa % _ \ para que la búsqueda no sea un comodín accidental
const escaparLike = (s) => s.replace(/[\\%_]/g, '\\$&');

// Campos que se pueden modificar con actualizar() (lista blanca: nunca se arma SQL con claves del cliente)
const EDITABLES = ['nombre', 'marca', 'categoria', 'subcategoria', 'descripcion', 'imagen', 'precio', 'requiere_receta'];

function construirFiltros({ q, categoria, subcategoria, estado }) {
  const cond = [];
  const params = [];

  if (estado === 'activos') cond.push('activo = TRUE');
  else if (estado === 'inactivos') cond.push('activo = FALSE');

  if (categoria) {
    params.push(categoria);
    cond.push(`categoria = $${params.length}`);
  }
  if (subcategoria) {
    params.push(subcategoria);
    cond.push(`subcategoria = $${params.length}`);
  }
  if (q) {
    params.push(`%${escaparLike(q)}%`);
    cond.push(`(nombre ILIKE $${params.length} OR marca ILIKE $${params.length})`);
  }
  return { where: cond.length ? `WHERE ${cond.join(' AND ')}` : '', params };
}

async function tienePedidosAbiertos(client, productoId) {
  // Si aún no creaste pedidos/pedido_items, no hay nada que revisar (y la consulta no falla)
  const { rows: existe } = await client.query(
    `SELECT to_regclass('public.pedidos') IS NOT NULL
        AND to_regclass('public.pedido_items') IS NOT NULL AS ok`
  );
  if (!existe[0].ok) return false;

  const { rows } = await client.query(
    `SELECT EXISTS (
       SELECT 1
         FROM pedido_items pi
         JOIN pedidos p ON p.id = pi.pedido_id
        WHERE pi.producto_id = $1
          AND p.estado <> ALL($2::text[])
     ) AS abierto`,
    [productoId, ESTADOS_CERRADOS]
  );
  return rows[0].abierto;
}

export const ProductoModel = {
  // ---------- Lectura ----------

  // Catálogo público: solo activos; los agotados van al final pero se siguen mostrando
  async listarPublicos({ q, categoria, subcategoria, limite, offset }) {
    const { where, params } = construirFiltros({ q, categoria, subcategoria, estado: 'activos' });
    params.push(limite, offset);
    const { rows } = await pool.query(
      `SELECT ${COLUMNAS}, COUNT(*) OVER() AS total
         FROM productos
         ${where}
        ORDER BY (stock > 0) DESC, nombre ASC, id ASC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return { items: rows.map(mapear), total: rows[0] ? Number(rows[0].total) : 0 };
  },

  async listarAdmin({ q, categoria, estado, agotados, limite, offset }) {
    const { where, params } = construirFiltros({ q, categoria, estado });
    const extra = agotados ? `${where ? ' AND' : 'WHERE'} stock = 0` : '';
    params.push(limite, offset);
    const { rows } = await pool.query(
      `SELECT ${COLUMNAS}, COUNT(*) OVER() AS total
         FROM productos
         ${where}${extra}
        ORDER BY id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return { items: rows.map(mapear), total: rows[0] ? Number(rows[0].total) : 0 };
  },

  async buscarPorId(id) {
    const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM productos WHERE id = $1`, [id]);
    return mapear(rows[0]);
  },

  // ---------- Escritura (admin) ----------

  async crear(d) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO productos
           (nombre, marca, categoria, subcategoria, descripcion, imagen, precio, stock, requiere_receta)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING ${COLUMNAS}`,
        [
          d.nombre, d.marca ?? null, d.categoria, d.subcategoria ?? null,
          d.descripcion ?? null, d.imagen ?? null, d.precio, d.stock ?? 0,
          d.requiere_receta ?? false,
        ]
      );
      return mapear(rows[0]);
    } catch (err) {
      if (err.code === '23505') {
        throw new ErrorNegocio(409, 'Ya existe un producto con ese nombre y marca (puede estar desactivado).');
      }
      throw err;
    }
  },

  // El stock NO se edita aquí: se cambia con ajustarStock (evita pisar ventas simultáneas)
  async actualizar(id, cambios) {
    const campos = EDITABLES.filter((k) => Object.prototype.hasOwnProperty.call(cambios, k));
    if (campos.length === 0) throw new ErrorNegocio(400, 'No hay cambios para guardar.');

    const sets = campos.map((k, i) => `${k} = $${i + 2}`);
    const valores = campos.map((k) => cambios[k]);

    try {
      const { rows } = await pool.query(
        `UPDATE productos
            SET ${sets.join(', ')}, actualizado_en = NOW()
          WHERE id = $1
          RETURNING ${COLUMNAS}`,
        [id, ...valores]
      );
      return mapear(rows[0]);
    } catch (err) {
      if (err.code === '23505') {
        throw new ErrorNegocio(409, 'Ya existe un producto con ese nombre y marca (puede estar desactivado).');
      }
      throw err;
    }
  },

  // Suma o resta unidades de forma atómica. Nunca deja el stock por debajo de 0.
  async ajustarStock(id, ajuste) {
    const { rows } = await pool.query(
      `UPDATE productos
          SET stock = stock + $2, actualizado_en = NOW()
        WHERE id = $1 AND stock + $2 >= 0
        RETURNING ${COLUMNAS}`,
      [id, ajuste]
    );
    if (rows[0]) return mapear(rows[0]);

    const existente = await this.buscarPorId(id);
    if (!existente) return null;
    throw new ErrorNegocio(409, `No se puede restar ${Math.abs(ajuste)}: solo hay ${existente.stock} en stock.`);
  },

  // "Eliminar" = desactivar. Se bloquea si algún cliente tiene el producto en un pedido sin entregar.
  async desactivar(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Bloquea la fila: un checkout simultáneo espera aquí y luego ve activo = FALSE
      const { rows } = await client.query('SELECT id FROM productos WHERE id = $1 FOR UPDATE', [id]);
      if (!rows[0]) {
        await client.query('ROLLBACK');
        return null;
      }
      if (await tienePedidosAbiertos(client, id)) {
        throw new ErrorNegocio(
          409,
          'No se puede eliminar: hay clientes con este producto en pedidos pendientes de entrega.'
        );
      }
      const { rows: r } = await client.query(
        `UPDATE productos SET activo = FALSE, actualizado_en = NOW() WHERE id = $1 RETURNING ${COLUMNAS}`,
        [id]
      );
      await client.query('COMMIT');
      return mapear(r[0]);
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  },

  async reactivar(id) {
    const { rows } = await pool.query(
      `UPDATE productos SET activo = TRUE, actualizado_en = NOW() WHERE id = $1 RETURNING ${COLUMNAS}`,
      [id]
    );
    return mapear(rows[0]);
  },

  // ---------- Para el checkout (usar DENTRO de tu transacción de compra) ----------

  // Descuento atómico: si dos clientes compran la última unidad, solo uno lo logra.
  async descontarStock(client, productoId, cantidad) {
    const { rows } = await client.query(
      `UPDATE productos
          SET stock = stock - $2, actualizado_en = NOW()
        WHERE id = $1 AND activo = TRUE AND stock >= $2
        RETURNING id, nombre, precio, stock`,
      [productoId, cantidad]
    );
    if (!rows[0]) throw new ErrorNegocio(409, 'Uno de los productos está agotado o no tiene stock suficiente.');
    return mapear(rows[0]);
  },

  // Al cancelar un pedido, devuelve las unidades
  async reponerStock(client, productoId, cantidad) {
    await client.query(
      'UPDATE productos SET stock = stock + $2, actualizado_en = NOW() WHERE id = $1',
      [productoId, cantidad]
    );
  },
};