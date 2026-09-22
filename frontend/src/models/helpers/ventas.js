// src/models/helpers/ventas.js

const CLAVE_VENTAS = 'bsm_ventas';

export const METODOS_PAGO = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta' },
  { valor: 'yape_plin', etiqueta: 'Yape / Plin' },
];

const VENTAS_SEMILLA = [
  {
    id: 'venta-1',
    cliente: 'Cliente mostrador',
    items: [
      { nombre: 'Paracetamol 500mg', cantidad: 2, precioUnitario: 5.5 },
      { nombre: 'Alcohol en gel', cantidad: 1, precioUnitario: 8.9 },
    ],
    total: 19.9,
    metodoPago: 'efectivo',
    fecha: new Date().toISOString(),
  },
  {
    id: 'venta-2',
    cliente: 'Ana Ríos',
    items: [{ nombre: 'Vitamina C', cantidad: 3, precioUnitario: 12.0 }],
    total: 36.0,
    metodoPago: 'tarjeta',
    fecha: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
  },
];

function leerJSON(clave, porDefecto) {
  try {
    const crudo = localStorage.getItem(clave);
    if (!crudo) return porDefecto;
    return JSON.parse(crudo);
  } catch {
    return porDefecto;
  }
}

function guardarJSON(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor));
}

function asegurarSemilla() {
  if (!localStorage.getItem(CLAVE_VENTAS)) {
    guardarJSON(CLAVE_VENTAS, VENTAS_SEMILLA);
  }
}

function generarId() {
  return `venta-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function obtenerVentas() {
  asegurarSemilla();
  return leerJSON(CLAVE_VENTAS, []).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

export function registrarVenta({ cliente, items, metodoPago }) {
  if (!items || items.length === 0) {
    throw new Error('La venta debe tener al menos un producto.');
  }
  const total = items.reduce((suma, it) => suma + it.cantidad * it.precioUnitario, 0);
  const ventas = leerJSON(CLAVE_VENTAS, []);
  const nueva = {
    id: generarId(),
    cliente: cliente?.trim() || 'Cliente mostrador',
    items,
    total,
    metodoPago: metodoPago || 'efectivo',
    fecha: new Date().toISOString(),
  };
  guardarJSON(CLAVE_VENTAS, [...ventas, nueva]);
  return nueva;
}

export function eliminarVenta(id) {
  const ventas = leerJSON(CLAVE_VENTAS, []).filter((v) => v.id !== id);
  guardarJSON(CLAVE_VENTAS, ventas);
}

export function resumenVentas() {
  const ventas = obtenerVentas();
  const inicioDeHoy = new Date();
  inicioDeHoy.setHours(0, 0, 0, 0);
  const inicioDeMes = new Date();
  inicioDeMes.setDate(1);
  inicioDeMes.setHours(0, 0, 0, 0);

  const ventasHoy = ventas.filter((v) => new Date(v.fecha) >= inicioDeHoy);
  const ventasMes = ventas.filter((v) => new Date(v.fecha) >= inicioDeMes);

  return {
    totalVentas: ventas.length,
    ingresosHoy: ventasHoy.reduce((s, v) => s + v.total, 0),
    ingresosMes: ventasMes.reduce((s, v) => s + v.total, 0),
    ticketPromedio: ventas.length ? ventas.reduce((s, v) => s + v.total, 0) / ventas.length : 0,
  };
}