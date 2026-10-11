// src/models/helpers/pedidos_api.js
import { peticion, query } from './api.js';
import { ESTADOS_PEDIDO } from './dashboard_api.js';

export { ESTADOS_PEDIDO };

export const estadoInfo = (valor) => ESTADOS_PEDIDO.find((e) => e.valor === valor) || ESTADOS_PEDIDO[0];

// "N° 000123" — el número que ve el cliente
export const codigoPedido = (id) => `FSM-${String(id).padStart(6, '0')}`;

// ---------- Cliente ----------

// datos: { items: [{productoId, cantidad}], entrega: 'recojo'|'delivery', direccion?, telefono?, nota? }
export const crearPedido = (token, datos) => peticion('/api/pedidos', { token, method: 'POST', body: datos });

export const misPedidos = (token, pagina = 1) => peticion(`/api/pedidos/mios${query({ pagina })}`, { token });

export const cancelarMiPedido = (token, id) =>
  peticion(`/api/pedidos/${id}/cancelar`, { token, method: 'PATCH' });

// ---------- Pago con tarjeta (Stripe) ----------

// -> { clientSecret }  o  { yaPagado: true, pedido }
export const iniciarPago = (token, id) => peticion(`/api/pedidos/${id}/pago`, { token, method: 'POST' });

// El servidor verifica con Stripe y devuelve el pedido con pago_estado: 'pagado'
export const confirmarPago = (token, id) =>
  peticion(`/api/pedidos/${id}/pago/confirmar`, { token, method: 'POST' });

// Texto y color del estado de pago de un pedido
export function pagoInfo(pedido) {
  if (pedido.pago_estado === 'pagado' && pedido.estado === 'cancelado') {
    return { etiqueta: 'Reembolso en proceso', color: '#d97706' };
  }
  if (pedido.pago_estado === 'pagado') return { etiqueta: 'Pagado', color: '#16a34a' };
  if (pedido.pago_estado === 'reembolsado') return { etiqueta: 'Reembolsado', color: '#6b7280' };
  if (pedido.estado === 'cancelado') return { etiqueta: 'Sin cobro', color: '#6b7280' };
  return { etiqueta: 'Pago pendiente', color: '#d97706' };
}

// Se puede pagar: pedido web pendiente que aún no se cobró
export const sePuedePagar = (pedido) => pedido.estado === 'pendiente' && pedido.pago_estado === 'pendiente';

// ---------- Admin ----------

export const resumenPedidosAdmin = (token) => peticion('/api/admin/pedidos/resumen', { token });

export const listarPedidosAdmin = (token, { q, estado, pagina }) =>
  peticion(`/api/admin/pedidos${query({ q, estado, pagina })}`, { token });

export const cambiarEstadoPedido = (token, id, estado) =>
  peticion(`/api/admin/pedidos/${id}/estado`, { token, method: 'PATCH', body: { estado } });

// Siguientes estados posibles (igual que TRANSICIONES.web en el backend)
export const SIGUIENTES = {
  pendiente: ['confirmado', 'cancelado'],
  confirmado: ['en_camino', 'entregado', 'cancelado'],
  en_camino: ['entregado', 'cancelado'],
  entregado: [],
  cancelado: [],
};