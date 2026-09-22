// src/models/helpers/usuarios.js

const CLAVE_USUARIOS = 'bsm_usuarios_registrados';

const USUARIOS_SEMILLA = [
  {
    email: 'admin@farmaciasanmarcos.pe',
    nombre: 'Administrador',
    distrito: 'San Isidro',
    rol: 'admin',
    fechaRegistro: new Date(Date.now() - 86400000 * 90).toISOString(),
  },
  {
    email: 'maria.torres@email.com',
    nombre: 'María Torres',
    distrito: 'San Isidro',
    rol: 'cliente',
    fechaRegistro: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    email: 'luis.herrera@email.com',
    nombre: 'Luis Herrera',
    distrito: 'Miraflores',
    rol: 'cliente',
    fechaRegistro: new Date(Date.now() - 86400000 * 5).toISOString(),
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
  if (!localStorage.getItem(CLAVE_USUARIOS)) {
    guardarJSON(CLAVE_USUARIOS, USUARIOS_SEMILLA);
  }
}

export function obtenerUsuariosRegistrados() {
  asegurarSemilla();
  return leerJSON(CLAVE_USUARIOS, []).sort(
    (a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro),
  );
}

export function cambiarRolUsuario(email, nuevoRol) {
  const usuarios = leerJSON(CLAVE_USUARIOS, []);
  const indice = usuarios.findIndex((u) => u.email === email);
  if (indice === -1) throw new Error('Usuario no encontrado.');
  usuarios[indice] = { ...usuarios[indice], rol: nuevoRol };
  guardarJSON(CLAVE_USUARIOS, usuarios);
  return usuarios[indice];
}

export function resumenUsuarios() {
  const usuarios = obtenerUsuariosRegistrados();
  const inicioDeMes = new Date();
  inicioDeMes.setDate(1);
  inicioDeMes.setHours(0, 0, 0, 0);

  return {
    total: usuarios.length,
    administradores: usuarios.filter((u) => u.rol === 'admin').length,
    clientes: usuarios.filter((u) => u.rol === 'cliente').length,
    nuevosEsteMes: usuarios.filter((u) => new Date(u.fechaRegistro) >= inicioDeMes).length,
  };
}