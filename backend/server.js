// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pool from './db/db.js';
import { limiteGeneral } from './middlewares/rate_limit.js';
import authRoutes from './routes/auth_routes.js';
import usuariosRoutes from './routes/routes_usuarios.js';
import { rutasPublicas, rutasAdmin } from './routes/routes_productos.js';
import inventarioRoutes from './routes/routes_inventario.js';
import dashboardRoutes from './routes/routes_dashboard.js';
import { rutasCliente as pedidosCliente, rutasAdmin as pedidosAdmin } from './routes/routes_pedidos.js'; // 🆕
import ventasRoutes from './routes/routes_ventas.js';               // 🆕
import proveedoresRoutes from './routes/routes_proveedores.js';     // 🆕
import adminUsuariosRoutes from './routes/routes_admin_usuarios.js'; // 🆕
import { DIR_UPLOADS } from './middlewares/subir_imagen.js';
import { PagoModel } from './models/models_pagos.js';                // 🆕

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
app.use(
  '/uploads',
  express.static(DIR_UPLOADS, {
    index: false,
    dotfiles: 'deny',
    maxAge: '7d',
    setHeaders: (res) => {
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
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
app.use('/api/pedidos', pedidosCliente);                  // 🆕 checkout y Mis compras
app.use('/api/admin/inventario', inventarioRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/pedidos', pedidosAdmin);              // 🆕
app.use('/api/admin/ventas', ventasRoutes);               // 🆕
app.use('/api/admin/proveedores', proveedoresRoutes);     // 🆕
app.use('/api/admin/usuarios', adminUsuariosRoutes);      // 🆕

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

// ---------- Pedidos web sin pagar: se cancelan solos y devuelven el stock ----------
const MINUTOS_PARA_PAGAR = Number(process.env.PEDIDO_MINUTOS_PAGO) || 30;
setInterval(() => {
  PagoModel.cancelarImpagosVencidos(MINUTOS_PARA_PAGAR)
    .then((n) => n && console.log(`Pedidos sin pagar cancelados: ${n}`))
    .catch((err) => console.error('Error liberando pedidos impagos:', err.message));
}, 5 * 60 * 1000).unref();

const PUERTO = Number(process.env.PORT) || 3000;
app.listen(PUERTO, () =>
  console.log(`API de Farmacia San Marcos en http://localhost:${PUERTO}`)
);