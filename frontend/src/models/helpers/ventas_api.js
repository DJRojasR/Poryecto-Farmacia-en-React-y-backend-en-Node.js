// src/models/helpers/ventas_api.js
import { peticion, query } from './api.js';

const BASE = '/api/admin/ventas';

// Igual que METODOS_PAGO en el backend (helpers/constantes_negocio.js)
export const METODOS_PAGO = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta' },
  { valor: 'yape', etiqueta: 'Yape' },
  { valor: 'plin', etiqueta: 'Plin' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
];

export const resumenVentas = (token) => peticion(`${BASE}/resumen`, { token });

// canal: '' | 'web' | 'mostrador'   estado: '' | 'vigentes' | 'cancelado'
export const listarVentas = (token, { q, canal, estado, pagina }) =>
  peticion(`${BASE}${query({ q, canal, estado, pagina })}`, { token });

// datos: { cliente?, metodo_pago, items: [{productoId, cantidad}], receta_verificada?, nota? }
export const registrarVenta = (token, datos) => peticion(BASE, { token, method: 'POST', body: datos });

export const anularVenta = (token, id) => peticion(`${BASE}/${id}/anular`, { token, method: 'PATCH' });