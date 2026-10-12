// notificaciones/consumidor.js
// Se suscribe a los eventos "pedido.*" que publica la API y envía un correo por cada uno.
//
//   API ──► [exchange farmacia.eventos] ──► cola "notificaciones.pedidos" ──► ESTE microservicio ──► correo
//                                                     │ (si falla 3 veces)
//                                                     └──► cola "notificaciones.fallidos" (para revisar)
//
// La cola es durable: si este servicio está apagado (p. ej. Render lo durmió),
// los mensajes esperan en RabbitMQ y se procesan cuando vuelve. La API nunca se entera.
import amqp from 'amqplib';
import { armarCorreo, tiposSoportados } from './plantillas.js';
import { enviarCorreo } from './correo.js';
import { pedirComprobante } from './comprobante.js';
import { contar, liberar, ocultarEmail, registrar, reservar } from './almacen.js';

const EXCHANGE = 'farmacia.eventos';
const COLA = 'notificaciones.pedidos';
const COLA_FALLIDOS = 'notificaciones.fallidos';
const INTENTOS = 3;

let estado = 'desconectado';
let conexion = null;
let cerrando = false;
export const estadoRabbit = () => estado;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function enviarConReintentos(correo) {
  let ultimoError;
  for (let intento = 1; intento <= INTENTOS; intento += 1) {
    try {
      return await enviarCorreo(correo);
    } catch (err) {
      ultimoError = err;
      console.warn(`   intento ${intento}/${INTENTOS} falló: ${err.message}`);
      if (intento < INTENTOS) await esperar(2000 * intento); // 2s, 4s
    }
  }
  throw ultimoError;
}

async function procesar(canal, msg) {
  let evento;
  try {
    evento = JSON.parse(msg.content.toString());
  } catch {
    console.error('Mensaje que no es JSON: se manda a fallidos.');
    contar('fallidos');
    return canal.nack(msg, false, false);
  }

  const { id, tipo, datos } = evento;
  contar('recibidos');
  console.log(`📩 ${tipo} · ${datos?.codigo ?? '-'}`);

  // Idempotencia: RabbitMQ puede entregar el mismo mensaje dos veces
  if (!reservar(id)) {
    contar('duplicados');
    console.log('   duplicado, se ignora');
    return canal.ack(msg);
  }

  const base = {
    eventoId: id,
    tipo,
    pedido: datos?.codigo ?? null,
    para: ocultarEmail(datos?.cliente?.email),
  };

  if (!tiposSoportados.includes(tipo) || !datos) {
    registrar({ ...base, estado: 'omitido', motivo: 'tipo de evento sin plantilla' });
    return canal.ack(msg);
  }
  if (!datos.cliente?.email) {
    registrar({ ...base, estado: 'omitido', motivo: 'el pedido no tiene correo (venta de mostrador)' });
    return canal.ack(msg);
  }

  try {
    // Reto 5: si el pedido se pagó, se pide el comprobante PDF a la función serverless
    const comprobante = tipo === 'pedido.pagado' ? await pedirComprobante(datos) : null;
    const correo = armarCorreo(tipo, datos, { conComprobante: Boolean(comprobante) });
    const r = await enviarConReintentos({
      para: datos.cliente.email,
      ...correo,
      adjuntos: comprobante ? [comprobante] : [],
    });
    contar('enviados');
    registrar({
      ...base,
      estado: 'enviado',
      asunto: correo.asunto,
      comprobante: Boolean(comprobante),
      vistaPrevia: r.vistaPrevia,
    });
    console.log(`   ✅ correo enviado a ${base.para}${r.vistaPrevia ? `\n   👀 ver: ${r.vistaPrevia}` : ''}`);
    canal.ack(msg); // procesado: RabbitMQ lo borra de la cola
  } catch (err) {
    liberar(id);
    contar('fallidos');
    registrar({ ...base, estado: 'fallido', motivo: err.message });
    console.error(`   ❌ no se pudo enviar tras ${INTENTOS} intentos; va a "${COLA_FALLIDOS}"`);
    canal.nack(msg, false, false); // sin reencolar: se va a la cola de fallidos (dead-letter)
  }
}

export async function iniciarConsumidor() {
  const url = process.env.RABBITMQ_URL;
  if (!url) {
    estado = 'no_configurado';
    console.error('Falta RABBITMQ_URL: el microservicio no puede escuchar eventos.');
    return;
  }

  try {
    estado = 'conectando';
    conexion = await amqp.connect(url);
    const canal = await conexion.createChannel();

    await canal.assertExchange(EXCHANGE, 'topic', { durable: true });
    await canal.assertQueue(COLA_FALLIDOS, { durable: true });
    await canal.assertQueue(COLA, {
      durable: true,
      // Lo que se rechaza sin reencolar termina en la cola de fallidos
      arguments: { 'x-dead-letter-exchange': '', 'x-dead-letter-routing-key': COLA_FALLIDOS },
    });
    await canal.bindQueue(COLA, EXCHANGE, 'pedido.*');
    await canal.prefetch(5);

    conexion.on('error', (err) => console.error('RabbitMQ error:', err.message));
    conexion.on('close', () => {
      if (cerrando) return;
      estado = 'reconectando';
      console.warn('RabbitMQ: conexión cerrada, reintento en 5 s...');
      setTimeout(iniciarConsumidor, 5000);
    });

    await canal.consume(COLA, (msg) => msg && procesar(canal, msg).catch((e) => console.error(e)));
    estado = 'ok';
    console.log(`👂 Escuchando "pedido.*" en la cola "${COLA}"`);
  } catch (err) {
    estado = 'caido';
    console.error('No se pudo conectar a RabbitMQ:', err.message, '(reintento en 10 s)');
    setTimeout(iniciarConsumidor, 10000);
  }
}

export async function detenerConsumidor() {
  cerrando = true;
  try { await conexion?.close(); } catch { /* ya estaba cerrada */ }
}
