// backend/helpers/validar_pedido.js
// Validación de items y datos de entrega: la usan pedidos web y ventas de mostrador.
import { idValido } from './http.js';
import { MAX_ITEMS_PEDIDO, MAX_UNIDADES_ITEM } from './constantes_negocio.js';

// [{ productoId, cantidad }] -> agrupa repetidos. Devuelve { items } o { error }
export function validarItems(items) {
  if (!Array.isArray(items) || items.length === 0) return { error: 'Agrega al menos un producto.' };
  if (items.length > MAX_ITEMS_PEDIDO) return { error: `Máximo ${MAX_ITEMS_PEDIDO} productos distintos por pedido.` };

  const agrupados = new Map();
  for (const it of items) {
    const productoId = idValido(it?.productoId);
    const cantidad = it?.cantidad;
    if (!productoId) return { error: 'Hay un producto inválido en el pedido.' };
    if (!Number.isInteger(cantidad) || cantidad < 1) return { error: 'Cada cantidad debe ser un entero mayor a 0.' };
    const suma = (agrupados.get(productoId) || 0) + cantidad;
    if (suma > MAX_UNIDADES_ITEM) return { error: `Máximo ${MAX_UNIDADES_ITEM} unidades por producto.` };
    agrupados.set(productoId, suma);
  }
  return { items: [...agrupados].map(([productoId, cantidad]) => ({ productoId, cantidad })) };
}

// Texto opcional: '' / null -> null; si no es string o es muy largo -> error
export function textoOpcional(valor, max) {
  if (valor == null || valor === '') return { valor: null };
  if (typeof valor !== 'string' || valor.trim().length > max) return { error: true };
  return { valor: valor.trim() || null };
}