// src/models/helpers/inventario_api.js
import { peticion, query } from './api.js';

const BASE = '/api/admin/inventario';

export const obtenerResumenInventario = (token) => peticion(`${BASE}/resumen`, { token });

// -> { entrada: [{valor, etiqueta}], salida: [...], etiquetas: { valor: etiqueta } }
export const obtenerMotivos = (token) => peticion(`${BASE}/motivos`, { token });

export const listarInventario = (token, { q, filtro, pagina }) =>
  peticion(`${BASE}${query({ q, filtro: filtro === 'todos' ? undefined : filtro, pagina })}`, { token });

// Kardex general: movimientos de todos los productos
export const listarMovimientos = (token, { q, tipo, motivo, pagina }) =>
  peticion(`${BASE}/movimientos${query({ q, tipo, motivo, pagina })}`, { token });

// datos: { productoId, tipo: 'entrada'|'salida', cantidad (número), motivo, nota }
export const registrarMovimiento = (token, datos) =>
  peticion(`${BASE}/movimientos`, { token, method: 'POST', body: datos });

export const obtenerHistorial = (token, productoId, pagina = 1) =>
  peticion(`${BASE}/${productoId}/movimientos${query({ pagina })}`, { token });