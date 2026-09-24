// src/models/helpers/pedidos.js

const CLAVE_PEDIDOS = 'bsm_pedidos';

export const ESTADOS_PEDIDO = [
  { valor: 'pendiente', etiqueta: 'Pendiente', color: '#b8860b' },
  { valor: 'preparando', etiqueta: 'Preparando', color: '#1e6fa8' },
  { valor: 'en_camino', etiqueta: 'En camino', color: '#6d4fc7' },
  { valor: 'entregado', etiqueta: 'Entregado', color: '#227a45' },
  { valor: 'cancelado', etiqueta: 'Cancelado', color: '#b3261e' },
];

const PEDIDOS_SEMILLA = [
  {
    id: 'ped-1',
    cliente: 'María Torres',
    correo: 'maria.torres@email.com',
    distrito: 'San Isidro',
    direccion: 'Av. Javier Prado 1234',
    items: [
      { nombre: 'Paracetamol 500mg', cantidad: 2 },
      { nombre: 'Vitamina C', cantidad: 1 },
    ],
    total: 45.9,
    metodoPago: 'tarjeta',
    estado: 'pendiente',
    fecha: new Date().toISOString(),
  },
  {
    id: 'ped-2',
    cliente: 'Luis Herrera',
    correo: 'luis.herrera@email.com',
    distrito: 'Miraflores',
    direccion: 'Calle Berlín 456',
    items: [{ nombre: 'Ibuprofeno 400mg', cantidad: 1 }],
    total: 18.5,
    metodoPago: 'efectivo',
    estado: 'en_camino',
    fecha: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
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
  if (!localStorage.getItem(CLAVE_PEDIDOS)) {
    guardarJSON(CLAVE_PEDIDOS, PEDIDOS_SEMILLA);
  }
}

function generarId() {
  return `ped-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function obtenerPedidos() {
  asegurarSemilla();
  return leerJSON(CLAVE_PEDIDOS, []).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

export function obtenerPedidoPorId(id) {
  return obtenerPedidos().find((p) => p.id === id) || null;
}

export function actualizarEstadoPedido(id, nuevoEstado) {
  const valido = ESTADOS_PEDIDO.some((e) => e.valor === nuevoEstado);
  if (!valido) throw new Error('Estado inválido.');
  const pedidos = leerJSON(CLAVE_PEDIDOS, []);
  const indice = pedidos.findIndex((p) => p.id === id);
  if (indice === -1) throw new Error('Pedido no encontrado.');
  pedidos[indice] = { ...pedidos[indice], estado: nuevoEstado };
  guardarJSON(CLAVE_PEDIDOS, pedidos);
  return pedidos[indice];
}

export function registrarPedido(datos) {
  if (!datos.cliente || !datos.cliente.trim()) {
    throw new Error('El nombre del cliente es obligatorio.');
  }
  if (!datos.items || datos.items.length === 0) {
    throw new Error('El pedido debe tener al menos un producto.');
  }
  const pedidos = leerJSON(CLAVE_PEDIDOS, []);
  const nuevo = {
    id: generarId(),
    cliente: datos.cliente.trim(),
    correo: datos.correo || '',
    distrito: datos.distrito || '',
    direccion: datos.direccion || '',
    items: datos.items,
    total: Number(datos.total) || 0,
    metodoPago: datos.metodoPago || 'efectivo',
    estado: 'pendiente',
    fecha: new Date().toISOString(),
  };
  guardarJSON(CLAVE_PEDIDOS, [...pedidos, nuevo]);
  return nuevo;
}

export function resumenPedidos() {
  const pedidos = obtenerPedidos();
  const inicioDeHoy = new Date();
  inicioDeHoy.setHours(0, 0, 0, 0);

  return {
    total: pedidos.length,
    pendientes: pedidos.filter((p) => p.estado === 'pendiente').length,
    enProceso: pedidos.filter((p) => ['preparando', 'en_camino'].includes(p.estado)).length,
    entregadosHoy: pedidos.filter((p) => p.estado === 'entregado' && new Date(p.fecha) >= inicioDeHoy).length,
  };
}