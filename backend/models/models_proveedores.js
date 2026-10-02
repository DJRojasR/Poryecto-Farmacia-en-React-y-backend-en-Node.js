// backend/models/models_proveedores.js
import pool from '../db/db.js';
import { ErrorNegocio } from '../helpers/errores.js';

const ZONA = 'America/Lima';

const COLS = `pv.id, pv.razon_social, pv.ruc, pv.categoria, pv.contacto, pv.telefono, pv.email,
  pv.direccion, pv.notas, pv.activo, pv.creado_en`;

const COLS_COMPRA = `c.id, c.proveedor_id, c.comprobante, c.total, c.estado, to_char(c.fecha, 'YYYY-MM-DD') AS fecha, c.nota, c.creado_en`;

// Lista blanca de campos editables (nunca se arma SQL con claves del cliente)
const EDITABLES = ['razon_social', 'ruc', 'categoria', 'contacto', 'telefono', 'email', 'direccion', 'notas'];

const escaparLike = (s) => s.replace(/[\\%_]/g, '\\$&');
const mapearCompra = (c) => (c ? { ...c, total: Number(c.total) } : null);

const rucDuplicado = (err) => {
  if (err.code === '23505') throw new ErrorNegocio(409, 'Ya existe un proveedor con ese RUC.');
  throw err;
};

export const ProveedorModel = {
  async resumen() {
    const { rows } = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM proveedores)::int                 AS total,
         (SELECT COUNT(*) FROM proveedores WHERE activo)::int    AS activos,
         (SELECT COALESCE(SUM(total), 0) FROM compras
           WHERE estado = 'registrada'
             AND fecha >= date_trunc('month', NOW() AT TIME ZONE $1::text)::date) AS gasto_mes`,
      [ZONA]
    );
    const r = rows[0];
    return {
      totalProveedores: r.total,
      activos: r.activos,
      inactivos: r.total - r.activos,
      gastoDelMes: Number(r.gasto_mes),
    };
  },

  async listar({ q, estado, limite, offset }) {
    const cond = [];
    const params = [];
    if (estado === 'activos') cond.push('pv.activo = TRUE');
    else if (estado === 'inactivos') cond.push('pv.activo = FALSE');
    if (q) {
      params.push(`%${escaparLike(q)}%`);
      const i = params.length;
      cond.push(`(pv.razon_social ILIKE $${i} OR pv.contacto ILIKE $${i} OR pv.ruc LIKE $${i})`);
    }
    params.push(limite, offset);
    const { rows } = await pool.query(
      `SELECT ${COLS},
              (SELECT to_char(MAX(fecha), 'YYYY-MM-DD') FROM compras c WHERE c.proveedor_id = pv.id AND c.estado = 'registrada') AS ultima_compra,
              COUNT(*) OVER() AS total_filas
         FROM proveedores pv
        ${cond.length ? `WHERE ${cond.join(' AND ')}` : ''}
        ORDER BY pv.activo DESC, pv.razon_social ASC, pv.id ASC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const total = rows[0] ? Number(rows[0].total_filas) : 0;
    return { items: rows.map(({ total_filas: _t, ...p }) => p), total };
  },

  async buscarPorId(id) {
    const { rows } = await pool.query(`SELECT ${COLS} FROM proveedores pv WHERE pv.id = $1`, [id]);
    return rows[0] ?? null;
  },

  async crear(d) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO proveedores AS pv (razon_social, ruc, categoria, contacto, telefono, email, direccion, notas)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING ${COLS}`,
        [d.razon_social, d.ruc, d.categoria, d.contacto ?? null, d.telefono ?? null,
          d.email ?? null, d.direccion ?? null, d.notas ?? null]
      );
      return rows[0];
    } catch (err) {
      return rucDuplicado(err);
    }
  },

  async actualizar(id, cambios) {
    const campos = EDITABLES.filter((k) => Object.prototype.hasOwnProperty.call(cambios, k));
    if (campos.length === 0) throw new ErrorNegocio(400, 'No hay cambios para guardar.');
    const sets = campos.map((k, i) => `${k} = $${i + 2}`);
    try {
      const { rows } = await pool.query(
        `UPDATE proveedores AS pv SET ${sets.join(', ')} WHERE pv.id = $1 RETURNING ${COLS}`,
        [id, ...campos.map((k) => cambios[k])]
      );
      return rows[0] ?? null;
    } catch (err) {
      return rucDuplicado(err);
    }
  },

  // No se borran proveedores (tienen compras): se desactivan
  async cambiarActivo(id, activo) {
    const { rows } = await pool.query(
      `UPDATE proveedores AS pv SET activo = $2 WHERE pv.id = $1 RETURNING ${COLS}`,
      [id, activo]
    );
    return rows[0] ?? null;
  },

  // ---------- Compras ----------

  async listarCompras(proveedorId, { limite, offset }) {
    const { rows } = await pool.query(
      `SELECT ${COLS_COMPRA}, u.nombre AS usuario, COUNT(*) OVER() AS total_filas
         FROM compras c
         LEFT JOIN usuarios u ON u.id = c.usuario_id
        WHERE c.proveedor_id = $1
        ORDER BY c.fecha DESC, c.id DESC
        LIMIT $2 OFFSET $3`,
      [proveedorId, limite, offset]
    );
    const total = rows[0] ? Number(rows[0].total_filas) : 0;
    return { items: rows.map(({ total_filas: _t, ...c }) => mapearCompra(c)), total };
  },

  async registrarCompra({ proveedorId, total, comprobante, nota, fecha, usuarioId }) {
    const prov = await this.buscarPorId(proveedorId);
    if (!prov) return null;
    if (!prov.activo) throw new ErrorNegocio(409, 'El proveedor está inactivo. Actívalo para registrar compras.');

    const { rows } = await pool.query(
      `INSERT INTO compras AS c (proveedor_id, total, comprobante, nota, fecha, usuario_id)
       VALUES ($1, $2, $3, $4, COALESCE($5::date, (NOW() AT TIME ZONE $7::text)::date), $6)
       RETURNING ${COLS_COMPRA}`,
      [proveedorId, total, comprobante, nota, fecha, usuarioId, ZONA]
    );
    return mapearCompra(rows[0]);
  },

  // Anular = deja de contar en el gasto, pero queda el registro
  async anularCompra(compraId) {
    const { rows } = await pool.query(
      `UPDATE compras AS c SET estado = 'anulada'
        WHERE c.id = $1 AND c.estado = 'registrada'
        RETURNING ${COLS_COMPRA}`,
      [compraId]
    );
    if (rows[0]) return mapearCompra(rows[0]);
    const { rows: existe } = await pool.query('SELECT 1 FROM compras WHERE id = $1', [compraId]);
    if (!existe[0]) return null;
    throw new ErrorNegocio(409, 'La compra ya estaba anulada.');
  },
};