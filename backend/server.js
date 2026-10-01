import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pool from './db/db.js';
import { limiteGeneral } from './middlewares/rate_limit.js';
import authRoutes from './routes/auth_routes.js';
import usuariosRoutes from './routes/routes_usuarios.js';
import { rutasPublicas, rutasAdmin } from './routes/routes_productos.js';
import { DIR_UPLOADS } from './middlewares/subir_imagen.js';

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
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  })
);

app.use(limiteGeneral);
app.use(express.json({ limit: '10kb' }));

// ---------- Archivos estáticos: imágenes de productos ----------
// Sirve /uploads/* desde disco, sin ejecutar nada y con cabeceras restrictivas.
app.use(
  '/uploads',
  express.static(DIR_UPLOADS, {
    index: false,
    dotfiles: 'deny',
    maxAge: '7d',
    setHeaders: (res) => {
      // Permite que el frontend (otro origen) las muestre
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      // Aunque algo raro se colara, no se ejecuta nada
      res.set('Content-Security-Policy', "default-src 'none'");
    },
  })
);

// ---------- Health check ----------
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

// ---------- Rutas ----------
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/productos', rutasPublicas);
app.use('/api/admin/productos', rutasAdmin);

// ---------- 404 ----------
app.use((_req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada.' }));

// ---------- Manejador final de errores ----------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ mensaje: 'JSON inválido.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ mensaje: 'La solicitud es demasiado grande.' });
  console.error(err);
  res.status(500).json({ mensaje: 'Error interno del servidor.' });
});

const PUERTO = process.env.PORT;
app.listen(PUERTO, () =>
  console.log(`API de Farmacia San Marcos en http://localhost:${PUERTO}`)
);