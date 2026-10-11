// backend/models/models_eventos.js
// Arma el contenido de los eventos del pedido y los publica en el middleware (RabbitMQ).
// Se llama DESPUÉS de que la operación quedó guardada en la BD (no se publica algo que no pasó).
import pool from '../db/db.js';
import { publicarEvento } from '../helpers/mensajeria.js';
import { PedidoModel } from './models_pedidos.js';

// Lo que viaja en el mensaje: lo justo para que otro servicio actúe sin consultar nuestra BD
async function datosPedido(pedidoId) {
  const p = await PedidoModel.obtener(pedidoId);
  if (!p) return null;
  let email = null;
  if (p.usuario_id) {
    const { rows } = await pool.query('SELECT email FROM usuarios WHERE id = $1', [p.usuario_id]);
    email = rows[0]?.email ?? null;
  }
  return {
    pedidoId: p.id,
    codigo: `FSM-${String(p.id).padStart(6, '0')}`,
    cliente: { nombre: p.cliente_nombre, email },
    total: p.total,
    moneda: 'PEN',
    estado: p.estado,
    pagoEstado: p.pago_estado,
    entrega: p.entrega,
    direccion: p.direccion,
    items: p.items.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad, precio: i.precio, subtotal: i.subtotal })),
  };
}

/** tipo: 'pedido.creado' | 'pedido.pagado' | 'pedido.cancelado'. No lanza errores. */
export async function publicarEventoPedido(tipo, pedidoId) {
  try {
    const datos = await datosPedido(pedidoId);
    if (datos) await publicarEvento(tipo, datos);
  } catch (err) {
    console.error(`Evento ${tipo} del pedido ${pedidoId} no publicado:`, err.message);
  }
}