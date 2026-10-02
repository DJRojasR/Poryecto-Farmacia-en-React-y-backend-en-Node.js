// src/models/helpers/api.js
// Cliente HTTP común para el panel admin. Si en productos.js ya tienes una URL base,
// usa la misma variable de entorno (VITE_API_URL en tu .env del frontend).
// Acepta VITE_API_URL con o sin "/api" al final (http://localhost:4000  o  http://localhost:4000/api):
// las rutas de este archivo ya empiezan con /api, así que se quita para no terminar en /api/api/...
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000')
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '');

export async function peticion(ruta, { token, method = 'GET', body, signal } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_URL}${ruta}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new Error('No se pudo conectar con el servidor.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      res.status === 401 ? 'Tu sesión expiró. Vuelve a iniciar sesión.' : data.mensaje || 'Ocurrió un error inesperado.'
    );
    err.status = res.status;
    err.errores = data.errores;
    throw err;
  }
  return data;
}

// { q: 'para', pagina: 2, vacio: '' } -> '?q=para&pagina=2'
export function query(obj) {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== false) p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : '';
}