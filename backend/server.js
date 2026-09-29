import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pool from './db/db.js';
import { limiteGeneral } from './middlewares/rate_limit.js';
import authRoutes from './routes/auth_routes.js';
import usuariosRoutes from './routes/routes_usuarios.js';

if ((process.env.JWT_SECRET || '').length < 32) {
  console.error('JWT_SECRET falta o es muy corto (mínimo 32 caracteres). Revisa tu archivo .env');
  process.exit(1);
}

const app = express();

app.disable('x-powered-by');
// Solo si estás detrás de un proxy; si no, el rate limit vería siempre la IP del proxy
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));

// Cabeceras de seguridad (HSTS, nosniff, frameguard, CSP básica...)
app.use(helmet());

const origenesPermitidos = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origenesPermitidos,
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  })
);

app.use(limiteGeneral);
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);

app.use((_req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada.' }));

// Manejador final: nunca filtra detalles internos al cliente
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ mensaje: 'JSON inválido.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ mensaje: 'La solicitud es demasiado grande.' });
  console.error(err);
  res.status(500).json({ mensaje: 'Error interno del servidor.' });
});

const PUERTO = process.env.PORT || 4000;
app.listen(PUERTO, () => console.log(`API de Farmacia San Marcos en http://localhost:${PUERTO}`));