// backend/db/db.js
// Conexión a PostgreSQL. Funciona en tu PC y en la nube (Reto 3):
//   * En la NUBE (Render): define DATABASE_URL con la "Internal Database URL".
//   * En tu PC: usa DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME como siempre.
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;

const conexion = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl,
    };

const pool = new Pool({
  ...conexion,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  // Corta consultas que se queden colgadas
  statement_timeout: 10_000,
});

pool.on('error', (err) => {
  console.error('Error inesperado en la conexión a PostgreSQL:', describirError(err));
});

// Algunos errores de red (ECONNREFUSED) llegan con message vacío: se arma un texto útil
export function describirError(err) {
  if (!err) return 'error desconocido';
  const internos = Array.isArray(err.errors) ? err.errors.map((e) => e.message).join(' | ') : '';
  return [err.code, err.message, internos].filter(Boolean).join(' - ') || String(err);
}

// A dónde intenta conectarse (sin mostrar usuario ni contraseña)
function destino() {
  if (process.env.DATABASE_URL) {
    try {
      const u = new URL(process.env.DATABASE_URL);
      return `DATABASE_URL -> host ${u.hostname}, base ${u.pathname.slice(1)}`;
    } catch {
      return 'DATABASE_URL con formato inválido (revisa que empiece con postgresql://)';
    }
  }
  return `DB_HOST=${process.env.DB_HOST || '(vacío: usará localhost)'}, base ${process.env.DB_NAME || '(vacía)'}`;
}

// Se llama al arrancar: deja en el log si la BD conecta o por qué no
export async function probarConexion() {
  try {
    await pool.query('SELECT 1');
    console.log(`PostgreSQL conectado (${destino()})`);
  } catch (err) {
    console.error(`PostgreSQL NO conecta (${destino()}): ${describirError(err)}`);
  }
}

export default pool;