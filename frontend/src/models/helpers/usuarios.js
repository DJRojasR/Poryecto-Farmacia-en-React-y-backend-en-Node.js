// src/components/models/helpers/usuarios.js

// Lee todos los perfiles guardados en localStorage (uno por cada persona que inició sesión).
// TODO (backend): reemplazar por GET /api/usuarios
export function obtenerUsuariosRegistrados() {
  const usuarios = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const clave = localStorage.key(i);
    if (clave?.startsWith('fsm_perfil_')) {
      try {
        usuarios.push(JSON.parse(localStorage.getItem(clave)));
      } catch {
        // clave corrupta, se ignora
      }
    }
  }
  return usuarios;
}