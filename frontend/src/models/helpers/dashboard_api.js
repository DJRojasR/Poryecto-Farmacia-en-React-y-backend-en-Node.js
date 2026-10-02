// src/models/helpers/dashboard_api.js
import { peticion } from './api.js';

export const obtenerDashboard = (token) => peticion('/api/admin/dashboard', { token });

// Mismos estados que el CHECK de pedidos.estado en la BD
export const ESTADOS_PEDIDO = [
  { valor: 'pendiente', etiqueta: 'Pendiente', color: '#d97706' },
  { valor: 'confirmado', etiqueta: 'Confirmado', color: '#2563eb' },
  { valor: 'en_camino', etiqueta: 'En camino', color: '#7c3aed' },
  { valor: 'entregado', etiqueta: 'Entregado', color: '#16a34a' },
  { valor: 'cancelado', etiqueta: 'Cancelado', color: '#dc2626' },
];