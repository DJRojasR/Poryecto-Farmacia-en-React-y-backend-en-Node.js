// Motivos de movimientos de inventario.
// Mantener sincronizado con el CHECK de movimientos_inventario.motivo en la BD.
 
// Umbral de "stock bajo" (mismo que usa el catálogo público para "pocas unidades")
export const STOCK_BAJO = 5;
 
// Los que el admin puede elegir a mano en el módulo de Inventario
export const MOTIVOS = {
  entrada: [
    { valor: 'compra', etiqueta: 'Compra a proveedor' },
    { valor: 'devolucion_cliente', etiqueta: 'Devolución de cliente' },
    { valor: 'ajuste', etiqueta: 'Ajuste por conteo físico' },
  ],
  salida: [
    { valor: 'vencimiento', etiqueta: 'Producto vencido' },
    { valor: 'merma', etiqueta: 'Dañado / merma' },
    { valor: 'devolucion_proveedor', etiqueta: 'Devolución a proveedor' },
    { valor: 'ajuste', etiqueta: 'Ajuste por conteo físico' },
  ],
};
 
// Los registra el sistema (crear producto, ventas, cancelaciones), nunca el admin a mano
export const MOTIVOS_SISTEMA = {
  stock_inicial: 'Stock inicial',
  venta: 'Venta',
  cancelacion_pedido: 'Pedido cancelado (devolución de stock)',
};
 
// valor -> etiqueta, para mostrar el historial
export const ETIQUETAS = Object.fromEntries([
  ...MOTIVOS.entrada.map((m) => [m.valor, m.etiqueta]),
  ...MOTIVOS.salida.map((m) => [m.valor, m.etiqueta]),
  ...Object.entries(MOTIVOS_SISTEMA),
]);
 
export const motivoManualValido = (tipo, motivo) =>
  (tipo === 'entrada' || tipo === 'salida') && MOTIVOS[tipo].some((m) => m.valor === motivo);
 