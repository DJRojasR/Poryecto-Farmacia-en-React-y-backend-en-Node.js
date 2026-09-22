// src/models/helpers/proveedores.js

const CLAVE_PROVEEDORES = 'bsm_proveedores';
const CLAVE_COMPRAS = 'bsm_compras_proveedor';

export const CATEGORIAS_PROVEEDOR = [
  { valor: 'laboratorio', etiqueta: 'Laboratorio farmacéutico' },
  { valor: 'distribuidora', etiqueta: 'Distribuidora' },
  { valor: 'insumos', etiqueta: 'Insumos y materiales' },
  { valor: 'otro', etiqueta: 'Otro' },
];

const PROVEEDORES_SEMILLA = [
  {
    id: 'prov-1',
    nombre: 'Laboratorios Portugal',
    categoria: 'laboratorio',
    contacto: 'Rosa Medina',
    telefono: '01 619 9000',
    correo: 'ventas@labportugal.pe',
    ruc: '20100123456',
    direccion: 'Av. Argentina 3456, Lima',
    activo: true,
    notas: '',
  },
  {
    id: 'prov-2',
    nombre: 'Química Suiza',
    categoria: 'distribuidora',
    contacto: 'Jorge Salinas',
    telefono: '01 411 1000',
    correo: 'pedidos@quimicasuiza.com',
    ruc: '20100987654',
    direccion: 'Av. Elmer Faucett 3348, Callao',
    activo: true,
    notas: 'Entrega en 48h',
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
  const existentes = localStorage.getItem(CLAVE_PROVEEDORES);
  if (!existentes) {
    guardarJSON(CLAVE_PROVEEDORES, PROVEEDORES_SEMILLA);
  }
}

function generarId(prefijo) {
  return `${prefijo}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// ---------- Proveedores ----------

export function obtenerProveedores() {
  asegurarSemilla();
  return leerJSON(CLAVE_PROVEEDORES, []);
}

export function obtenerProveedorPorId(id) {
  return obtenerProveedores().find((p) => p.id === id) || null;
}

export function registrarProveedor(datos) {
  if (!datos.nombre || !datos.nombre.trim()) {
    throw new Error('El nombre del proveedor es obligatorio.');
  }
  const proveedores = obtenerProveedores();
  const nuevo = {
    id: generarId('prov'),
    nombre: datos.nombre.trim(),
    categoria: datos.categoria || CATEGORIAS_PROVEEDOR[0].valor,
    contacto: datos.contacto || '',
    telefono: datos.telefono || '',
    correo: datos.correo || '',
    ruc: datos.ruc || '',
    direccion: datos.direccion || '',
    activo: datos.activo ?? true,
    notas: datos.notas || '',
  };
  guardarJSON(CLAVE_PROVEEDORES, [...proveedores, nuevo]);
  return nuevo;
}

export function editarProveedor(id, cambios) {
  const proveedores = obtenerProveedores();
  const indice = proveedores.findIndex((p) => p.id === id);
  if (indice === -1) throw new Error('Proveedor no encontrado.');
  const actualizado = { ...proveedores[indice], ...cambios };
  proveedores[indice] = actualizado;
  guardarJSON(CLAVE_PROVEEDORES, proveedores);
  return actualizado;
}

export function alternarActivoProveedor(id) {
  const proveedor = obtenerProveedorPorId(id);
  if (!proveedor) throw new Error('Proveedor no encontrado.');
  return editarProveedor(id, { activo: !proveedor.activo });
}

export function eliminarProveedor(id) {
  const proveedores = obtenerProveedores().filter((p) => p.id !== id);
  guardarJSON(CLAVE_PROVEEDORES, proveedores);
}

// ---------- Compras (historial por proveedor) ----------

export function obtenerCompras(proveedorId) {
  const todas = leerJSON(CLAVE_COMPRAS, []);
  return todas
    .filter((c) => c.proveedorId === proveedorId)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

export function registrarCompra({ proveedorId, monto, numeroGuia, nota }) {
  const montoNum = Number(monto);
  if (!montoNum || montoNum <= 0) {
    throw new Error('Ingresa un monto válido.');
  }
  const todas = leerJSON(CLAVE_COMPRAS, []);
  const compra = {
    id: generarId('compra'),
    proveedorId,
    monto: montoNum,
    numeroGuia: numeroGuia || '',
    nota: nota || '',
    fecha: new Date().toISOString(),
  };
  guardarJSON(CLAVE_COMPRAS, [...todas, compra]);
  return compra;
}

// ---------- Resumen ----------

export function resumenProveedores() {
  const proveedores = obtenerProveedores();
  const todasLasCompras = leerJSON(CLAVE_COMPRAS, []);
  const inicioDeMes = new Date();
  inicioDeMes.setDate(1);
  inicioDeMes.setHours(0, 0, 0, 0);

  const comprasDelMes = todasLasCompras.filter((c) => new Date(c.fecha) >= inicioDeMes);

  return {
    totalProveedores: proveedores.length,
    activos: proveedores.filter((p) => p.activo).length,
    inactivos: proveedores.filter((p) => !p.activo).length,
    gastoDelMes: comprasDelMes.reduce((suma, c) => suma + c.monto, 0),
  };
}