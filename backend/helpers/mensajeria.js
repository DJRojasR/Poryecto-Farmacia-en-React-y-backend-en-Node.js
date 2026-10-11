// backend/helpers/mensajeria.js
// ============================================================================
// RETO 1 · MIDDLEWARE ORIENTADO A MENSAJES (RabbitMQ)
//
// La API ya no "llama" a los demás componentes: publica un EVENTO en RabbitMQ
// ("pedido.creado", "pedido.pagado", "pedido.cancelado") y se olvida.
// Quien necesite enterarse (notificaciones, reportes, facturación...) se suscribe.
//
//   API pedidos ──publica──► [exchange "farmacia.eventos"] ──► cola ──► consumidor(es)
//
// Por qué: si el servicio de correo se cae, el cobro NO falla; el mensaje espera
// en la cola hasta que el consumidor vuelva (desacoplamiento + tolerancia a fallos).
//
// Requiere:  npm i amqplib      y en .env:  RABBITMQ_URL=amqp://usuario:clave@host/vhost
// ============================================================================
import amqp from 'amqplib';
import { randomUUID } from 'node:crypto';

export const EXCHANGE = 'farmacia.eventos'; // tipo "topic": se enruta por la clave (pedido.pagado...)

let conexion = null;
let canal = null;
let conectando = null;

async function conectar() {
  const url = process.env.RABBITMQ_URL;
  if (!url) throw new Error('Falta RABBITMQ_URL en el .env');

  conexion = await amqp.connect(url);
  // Canal con "confirmaciones": RabbitMQ avisa cuando el mensaje quedó guardado
  canal = await conexion.createConfirmChannel();
  await canal.assertExchange(EXCHANGE, 'topic', { durable: true });

  conexion.on('error', (err) => console.error('RabbitMQ error:', err.message));
  conexion.on('close', () => {
    console.warn('RabbitMQ: conexión cerrada; se reconectará en el próximo evento.');
    conexion = null;
    canal = null;
  });
  console.log('RabbitMQ conectado (exchange "%s")', EXCHANGE);
  return canal;
}

// Una sola conexión compartida (si dos eventos llegan a la vez, esperan la misma)
async function obtenerCanal() {
  if (canal) return canal;
  if (!conectando) conectando = conectar().finally(() => { conectando = null; });
  return conectando;
}

/**
 * Publica un evento. NUNCA lanza error: si RabbitMQ no está disponible se registra
 * en consola y la operación de negocio (crear/pagar pedido) sigue normal.
 * Devuelve true si RabbitMQ confirmó que guardó el mensaje.
 */
export async function publicarEvento(tipo, datos) {
  const mensaje = {
    id: randomUUID(),               // permite al consumidor ignorar duplicados
    tipo,                           // p. ej. "pedido.pagado"
    fecha: new Date().toISOString(),
    origen: 'api-pedidos',
    datos,
  };
  try {
    const ch = await obtenerCanal();
    ch.publish(EXCHANGE, tipo, Buffer.from(JSON.stringify(mensaje)), {
      persistent: true,             // sobrevive a un reinicio de RabbitMQ
      contentType: 'application/json',
      messageId: mensaje.id,
      type: tipo,
      timestamp: Math.floor(Date.now() / 1000),
    });
    await ch.waitForConfirms();
    console.log(`📨 Evento publicado: ${tipo} (pedido ${datos?.pedidoId ?? '-'})`);
    return true;
  } catch (err) {
    console.error(`No se pudo publicar "${tipo}" en RabbitMQ:`, err.message);
    return false;
  }
}

// Para /api/health: ¿el middleware está disponible?
export async function estadoMensajeria() {
  if (!process.env.RABBITMQ_URL) return 'no_configurado';
  try {
    await obtenerCanal();
    return 'ok';
  } catch {
    return 'caido';
  }
}

export async function cerrarMensajeria() {
  try { await conexion?.close(); } catch { /* ya estaba cerrada */ }
}