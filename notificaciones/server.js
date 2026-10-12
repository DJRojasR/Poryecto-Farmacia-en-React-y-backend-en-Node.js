// notificaciones/server.js
// ============================================================================
// RETO 4 · MICROSERVICIO DE NOTIFICACIONES
//
// Servicio independiente de la API de la farmacia:
//   * Su propio código, su propio package.json y su propio despliegue en Render.
//   * No comparte base de datos: solo se entera de lo que pasa por los EVENTOS de RabbitMQ.
//   * Una sola responsabilidad: avisar al cliente por correo (pedido creado/pagado/cancelado).
//   * Si se cae, la API sigue vendiendo; los eventos esperan en la cola.
//
// Endpoints:
//   GET /health          -> estado del servicio, RabbitMQ y contadores
//   GET /notificaciones  -> últimas notificaciones (cabecera x-api-key)
// ============================================================================
import 'dotenv/config';
import express from 'express';
import { timingSafeEqual } from 'node:crypto';
import { detenerConsumidor, estadoRabbit, iniciarConsumidor } from './consumidor.js';
import { estadisticas, listar } from './almacen.js';
import { modoCorreo } from './correo.js';

const app = express();
app.disable('x-powered-by');

app.get('/', (_req, res) => {
  res.json({ servicio: 'notificaciones', descripcion: 'Microservicio de notificaciones de Farmacia San Marcos', health: '/health' });
});

app.get('/health', (_req, res) => {
  const rabbit = estadoRabbit();
  res.status(rabbit === 'ok' ? 200 : 503).json({
    ok: rabbit === 'ok',
    servicio: 'notificaciones',
    rabbitmq: rabbit,
    correo: modoCorreo(),
    ...estadisticas(),
  });
});

// Protegido con una clave: la lista incluye datos de clientes
function claveValida(req) {
  const esperada = process.env.NOTIF_API_KEY || '';
  const recibida = String(req.get('x-api-key') || '');
  if (esperada.length < 16 || recibida.length !== esperada.length) return false;
  return timingSafeEqual(Buffer.from(recibida), Buffer.from(esperada));
}

app.get('/notificaciones', (req, res) => {
  if (!claveValida(req)) return res.status(401).json({ mensaje: 'Falta la cabecera x-api-key o es incorrecta.' });
  const limite = Math.min(Math.max(Number(req.query.limite) || 50, 1), 100);
  res.json({ items: listar(limite), ...estadisticas() });
});

app.use((_req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada.' }));

const PUERTO = Number(process.env.PORT) || 5000;
const servidor = app.listen(PUERTO, () => {
  console.log(`🔔 Microservicio de notificaciones en http://localhost:${PUERTO}`);
  void iniciarConsumidor();
});

async function apagar() {
  console.log('Cerrando microservicio...');
  await detenerConsumidor();
  servidor.close(() => process.exit(0));
}
process.on('SIGINT', apagar);
process.on('SIGTERM', apagar);
