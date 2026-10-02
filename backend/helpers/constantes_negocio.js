// backend/helpers/constantes_negocio.js
// Listas que también existen como CHECK en la BD (sql/03_ventas_pedidos_proveedores.sql).
// Si agregas una opción aquí, agrégala también en el CHECK.

export const ESTADOS_PEDIDO = ['pendiente', 'confirmado', 'en_camino', 'entregado', 'cancelado'];

// A qué estado puede pasar un pedido desde su estado actual
export const TRANSICIONES = {
  web: {
    pendiente: ['confirmado', 'cancelado'],
    confirmado: ['en_camino', 'entregado', 'cancelado'], // 'entregado' directo = recojo en tienda
    en_camino: ['entregado', 'cancelado'],
    entregado: [],
    cancelado: [],
  },
  // La venta de mostrador nace entregada; lo único posible es anularla
  mostrador: {
    pendiente: [],
    confirmado: [],
    en_camino: [],
    entregado: ['cancelado'],
    cancelado: [],
  },
};

export const METODOS_PAGO = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta' },
  { valor: 'yape', etiqueta: 'Yape' },
  { valor: 'plin', etiqueta: 'Plin' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
];

export const CATEGORIAS_PROVEEDOR = [
  { valor: 'laboratorio', etiqueta: 'Laboratorio' },
  { valor: 'drogueria', etiqueta: 'Droguería / distribuidora' },
  { valor: 'cuidado_personal', etiqueta: 'Cuidado personal' },
  { valor: 'insumos', etiqueta: 'Insumos médicos' },
  { valor: 'otros', etiqueta: 'Otros' },
];

export const esValorDe = (lista, v) => lista.some((x) => x.valor === v);

// Límites de un pedido
export const MAX_ITEMS_PEDIDO = 30;
export const MAX_UNIDADES_ITEM = 99;