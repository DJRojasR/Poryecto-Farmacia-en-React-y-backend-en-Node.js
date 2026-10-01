import pool from '../db/db.js';

const PUBLICO = 'id, nombre, email, rol, activo, creado_en';

// Errores esperados de negocio (no son fallos del servidor)
export class ErrorNegocio extends Error {
  constructor(codigo) {
    super(codigo);
    this.codigo = codigo;
  }
}

export const UsuarioModel = {
  // El correo debe llegar ya en minúsculas
  async buscarPorEmail(email) {
    const { rows } = await pool.query(
      'SELECT id, nombre, email, password_hash, rol, activo FROM usuarios WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  async buscarPorId(id) {
    const { rows } = await pool.query(`SELECT ${PUBLICO} FROM usuarios WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  async crear({ nombre, email, passwordHash, rol = 'cliente' }) {
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, $4)
       RETURNING ${PUBLICO}`,
      [nombre, email, passwordHash, rol]
    );
    return rows[0];
  },

  async listar({ limite = 50, pagina = 1 } = {}) {
    const { rows } = await pool.query(
      `SELECT ${PUBLICO} FROM usuarios ORDER BY id ASC LIMIT $1 OFFSET $2`,
      [limite, (pagina - 1) * limite]
    );
    return rows;
  },

  // Cambia rol y/o estado. Nunca deja al sistema sin un administrador activo.
  async actualizar(id, { rol, activo }) {
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');

      // Bloquea a los admins activos (siempre en el mismo orden) para que dos cambios
      // simultáneos no puedan dejar el sistema sin administradores.
      const { rows: admins } = await cliente.query(
        `SELECT id FROM usuarios WHERE rol = 'admin' AND activo = TRUE ORDER BY id FOR UPDATE`
      );
      const { rows: filas } = await cliente.query(
        'SELECT id, rol, activo FROM usuarios WHERE id = $1 FOR UPDATE',
        [id]
      );
      const actual = filas[0];
      if (!actual) {
        await cliente.query('ROLLBACK');
        return null;
      }

      const nuevoRol = rol ?? actual.rol;
      const nuevoActivo = activo ?? actual.activo;

      const eraAdminActivo = actual.rol === 'admin' && actual.activo;
      const seguiraAdminActivo = nuevoRol === 'admin' && nuevoActivo;
      if (eraAdminActivo && !seguiraAdminActivo && admins.length <= 1) {
        throw new ErrorNegocio('ULTIMO_ADMIN');
      }

      const { rows } = await cliente.query(
        `UPDATE usuarios SET rol = $2, activo = $3 WHERE id = $1 RETURNING ${PUBLICO}`,
        [id, nuevoRol, nuevoActivo]
      );
      await cliente.query('COMMIT');
      return rows[0];
    } catch (err) {
      await cliente.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      cliente.release();
    }
  },
};