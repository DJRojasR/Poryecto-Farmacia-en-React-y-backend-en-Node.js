// backend/models/models_usuarios_admin.js
// Gestión de cuentas desde el panel (listar, cambiar rol, activar/desactivar).
// No toca el registro/login: eso sigue en tus archivos de auth.
import pool from '../db/db.js';
import { ErrorNegocio } from '../helpers/errores.js';

const ZONA = 'America/Lima';
const COLS = 'u.id, u.nombre, u.email, u.rol, u.activo, u.creado_en';

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

// Nunca dejar la farmacia sin un administrador activo
async function asegurarOtroAdmin(client, id) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS n FROM usuarios WHERE rol = 'admin' AND activo AND id <> $1`,
    [id]
  );
  if (rows[0].n === 0) throw new ErrorNegocio(409, 'Debe quedar al menos un administrador activo.');
}

export const UsuarioAdminModel = {
  async resumen() {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int                                       AS total,
              COUNT(*) FILTER (WHERE rol = 'admin')::int          AS administradores,
              COUNT(*) FILTER (WHERE rol = 'cliente')::int        AS clientes,
              COUNT(*) FILTER (WHERE NOT activo)::int             AS inactivos,
              COUNT(*) FILTER (WHERE creado_en >=
                date_trunc('month', NOW() AT TIME ZONE $1::text) AT TIME ZONE $1::text)::int AS nuevos_mes
         FROM usuarios`,
      [ZONA]
    );
    const r = rows[0];
    return {
      total: r.total,
      administradores: r.administradores,
      clientes: r.clientes,
      inactivos: r.inactivos,
      nuevosEsteMes: r.nuevos_mes,
    };
  },

  async listar({ q, rol, limite, offset }) {
    const cond = [];
    const params = [];
    if (rol) {
      params.push(rol);
      cond.push(`u.rol = $${params.length}`);
    }
    if (q) {
      params.push(`%${escaparLike(q)}%`);
      cond.push(`(u.nombre ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }
    params.push(limite, offset);
    const { rows } = await pool.query(
      `SELECT ${COLS},
              (SELECT COUNT(*) FROM pedidos p WHERE p.usuario_id = u.id)::int AS pedidos,
              COUNT(*) OVER() AS total_filas
         FROM usuarios u
        ${cond.length ? `WHERE ${cond.join(' AND ')}` : ''}
        ORDER BY u.creado_en DESC, u.id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const total = rows[0] ? Number(rows[0].total_filas) : 0;
    return { items: rows.map(({ total_filas: _t, ...u }) => u), total };
  },

  async cambiarRol(id, rol, actorId) {
    if (id === actorId) throw new ErrorNegocio(409, 'No puedes cambiar tu propio rol.');
    return conTransaccion(async (client) => {
      const { rows } = await client.query(`SELECT ${COLS} FROM usuarios u WHERE u.id = $1 FOR UPDATE`, [id]);
      const u = rows[0];
      if (!u) return null;
      if (u.rol === rol) return u;
      if (u.rol === 'admin') await asegurarOtroAdmin(client, id);
      const { rows: r } = await client.query(
        `UPDATE usuarios u SET rol = $2 WHERE u.id = $1 RETURNING ${COLS}`,
        [id, rol]
      );
      return r[0];
    });
  },

  async cambiarActivo(id, activo, actorId) {
    if (id === actorId) throw new ErrorNegocio(409, 'No puedes desactivar tu propia cuenta.');
    return conTransaccion(async (client) => {
      const { rows } = await client.query(`SELECT ${COLS} FROM usuarios u WHERE u.id = $1 FOR UPDATE`, [id]);
      const u = rows[0];
      if (!u) return null;
      if (!activo && u.rol === 'admin') await asegurarOtroAdmin(client, id);
      const { rows: r } = await client.query(
        `UPDATE usuarios u SET activo = $2 WHERE u.id = $1 RETURNING ${COLS}`,
        [id, activo]
      );
      return r[0];
    });
  },

  async buscarPorId(id) {
    const { rows } = await pool.query(`SELECT ${COLS} FROM usuarios u WHERE u.id = $1`, [id]);
    return rows[0] ?? null;
  },
};