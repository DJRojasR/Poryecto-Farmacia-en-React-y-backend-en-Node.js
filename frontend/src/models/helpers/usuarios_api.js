// src/models/helpers/usuarios_api.js
import { peticion, query } from './api.js';

const BASE = '/api/admin/usuarios';

export const resumenUsuarios = (token) => peticion(`${BASE}/resumen`, { token });

export const listarUsuarios = (token, { q, rol, pagina }) =>
  peticion(`${BASE}${query({ q, rol, pagina })}`, { token });

export const cambiarRolUsuario = (token, id, rol) =>
  peticion(`${BASE}/${id}/rol`, { token, method: 'PATCH', body: { rol } });

export const cambiarActivoUsuario = (token, id, activo) =>
  peticion(`${BASE}/${id}/activo`, { token, method: 'PATCH', body: { activo } });