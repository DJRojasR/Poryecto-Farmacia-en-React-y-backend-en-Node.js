// src/models/helpers/productos.js
import { guardarJSON, leerJSON } from './almacenamiento.js';

const CLAVE_PRODUCTOS = 'fsm_productos';

export const CATEGORIAS = [
  'Medicamentos',
  'Cuidado personal',
  'Vitaminas y suplementos',
  'Primeros auxilios',
  'Cuidado del bebé',
  'Otros',
];

// TODO (backend): reemplazar por GET /api/productos
export function obtenerProductos() {
  return leerJSON(CLAVE_PRODUCTOS, []);
}

// TODO (backend): reemplazar por POST /api/productos
export function guardarProductos(productos) {
  guardarJSON(CLAVE_PRODUCTOS, productos);
}

export function crearProducto(datos) {
  const productos = obtenerProductos();
  const nuevo = {
    id: `PROD-${Date.now()}`,
    ...datos,
  };
  guardarProductos([nuevo, ...productos]);
  return nuevo;
}

export function actualizarProducto(id, cambios) {
  const productos = obtenerProductos().map((p) => (p.id === id ? { ...p, ...cambios } : p));
  guardarProductos(productos);
}

export function eliminarProducto(id) {
  const productos = obtenerProductos().filter((p) => p.id !== id);
  guardarProductos(productos);
}