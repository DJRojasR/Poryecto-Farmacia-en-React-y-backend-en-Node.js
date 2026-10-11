// backend/scripts/escuchar_eventos.js
// ============================================================================
// CONSUMIDOR DE PRUEBA (Reto 1): demuestra que los eventos viajan por RabbitMQ.
// Ejecútalo en OTRA terminal:   node scripts/escuchar_eventos.js
// Luego haz/paga un pedido en la web y verás llegar el mensaje aquí.
// (En el Reto 4 este consumidor se convierte en el microservicio de notificaciones.)
// ============================================================================
import 'dotenv/config';
import amqp from 'amqplib';

const EXCHANGE = 'farmacia.eventos';
const COLA = 'demo.eventos-pedidos';

const conexion = await amqp.connect(process.env.RABBITMQ_URL);
const canal = await conexion.createChannel();

await canal.assertExchange(EXCHANGE, 'topic', { durable: true });
// Cola durable: si este consumidor está apagado, los mensajes se guardan y llegan al volver
await canal.assertQueue(COLA, { durable: true });
await canal.bindQueue(COLA, EXCHANGE, 'pedido.*'); // todos los eventos de pedidos
await canal.prefetch(1); // de uno en uno

console.log(`👂 Escuchando "pedido.*" en la cola "${COLA}"... (Ctrl+C para salir)\n`);

canal.consume(COLA, (msg) => {
  if (!msg) return;
  try {
    const evento = JSON.parse(msg.content.toString());
    const d = evento.datos;
    console.log(`📩 ${evento.tipo}  ·  ${d.codigo}  ·  ${d.cliente.nombre}  ·  S/ ${Number(d.total).toFixed(2)}`);
    console.log(`   ${d.items.map((i) => `${i.nombre} x${i.cantidad}`).join(', ')}`);
    console.log(`   id=${evento.id}  fecha=${evento.fecha}\n`);
    canal.ack(msg); // "procesado": RabbitMQ lo borra de la cola
  } catch (err) {
    console.error('Mensaje inválido, se descarta:', err.message);
    canal.nack(msg, false, false);
  }
});

process.on('SIGINT', async () => {
  await conexion.close();
  process.exit(0);
});