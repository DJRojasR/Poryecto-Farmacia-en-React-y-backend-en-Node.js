// src/models/helpers/proveedores_api.js
import { peticion, query } from './api.js';

const BASE = '/api/admin/proveedores';

// Igual que CATEGORIAS_PROVEEDOR en el backend (helpers/constantes_negocio.js)
export const CATEGORIAS_PROVEEDOR = [
  { valor: 'laboratorio', etiqueta: 'Laboratorio' },
  { valor: 'drogueria', etiqueta: 'Droguería / distribuidora' },
  { valor: 'cuidado_personal', etiqueta: 'Cuidado personal' },
  { valor: 'insumos', etiqueta: 'Insumos médicos' },
  { valor: 'otros', etiqueta: 'Otros' },
];

export const resumenProveedores = (token) => peticion(`${BASE}/resumen`, { token });

export const listarProveedores = (token, { q, estado, pagina }) =>
  peticion(`${BASE}${query({ q, estado, pagina })}`, { token });

// datos: { razon_social, ruc, categoria, contacto, telefono, email, direccion, notas }
export const crearProveedor = (token, datos) => peticion(BASE, { token, method: 'POST', body: datos });

export const editarProveedor = (token, id, datos) =>
  peticion(`${BASE}/${id}`, { token, method: 'PATCH', body: datos });

export const cambiarActivoProveedor = (token, id, activo) =>
  peticion(`${BASE}/${id}/activo`, { token, method: 'PATCH', body: { activo } });

export const listarCompras = (token, proveedorId, pagina = 1) =>
  peticion(`${BASE}/${proveedorId}/compras${query({ pagina })}`, { token });

// datos: { total, comprobante?, nota?, fecha? 'YYYY-MM-DD' }
export const registrarCompra = (token, proveedorId, datos) =>
  peticion(`${BASE}/${proveedorId}/compras`, { token, method: 'POST', body: datos });

export const anularCompra = (token, compraId) =>
  peticion(`${BASE}/compras/${compraId}/anular`, { token, method: 'PATCH' });