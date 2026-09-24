// src/models/helpers/inventario.js
import { obtenerProductos, actualizarProducto } from './productos.js';

const CLAVE_MOVIMIENTOS = 'fsm_movimientos_stock';

export const MOTIVOS = [
  { valor: 'compra', etiqueta: 'Compra a proveedor' },
  { valor: 'venta', etiqueta: 'Venta' },
  { valor: 'merma', etiqueta: 'Merma / vencimiento' },
  { valor: 'correccion', etiqueta: 'Corrección de inventario' },
];

function leerMovimientos() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_MOVIMIENTOS)) ?? [];
  } catch {
    return [];
  }
}

function guardarMovimientos(movs) {
  localStorage.setItem(CLAVE_MOVIMIENTOS, JSON.stringify(movs));
}

export function obtenerMovimientos(productoId) {
  const movs = leerMovimientos();
  return productoId ? movs.filter((m) => m.productoId === productoId) : movs;
}

// tipo: 'entrada' | 'salida'
export function registrarMovimiento({ productoId, tipo, cantidad, motivo, nota = '' }) {
  const productos = obtenerProductos();
  const producto = productos.find((p) => p.id === productoId);
  if (!producto) throw new Error('Producto no encontrado');

  const delta = tipo === 'entrada' ? cantidad : -cantidad;
  const nuevoStock = producto.stock + delta;
  if (nuevoStock < 0) throw new Error('El stock no puede quedar en negativo');

  actualizarProducto(productoId, { ...producto, stock: nuevoStock });

  const movimiento = {
    id: crypto.randomUUID(),
    productoId,
    productoNombre: producto.nombre,
    tipo,
    cantidad,
    motivo,
    nota,
    stockResultante: nuevoStock,
    fecha: new Date().toISOString(),
  };
  guardarMovimientos([movimiento, ...leerMovimientos()]);
  return movimiento;
}

export function resumenInventario() {
  const productos = obtenerProductos();
  return {
    totalProductos: productos.length,
    unidadesTotales: productos.reduce((acc, p) => acc + p.stock, 0),
    stockBajo: productos.filter((p) => p.stock > 0 && p.stock <= 5).length,
    sinStock: productos.filter((p) => p.stock === 0).length,
  };
}