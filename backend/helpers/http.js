// backend/helpers/http.js
// Utilidades compartidas por todos los controllers
import { ErrorNegocio } from './errores.js';

export const tiene = (obj, k) => Object.prototype.hasOwnProperty.call(obj, k);

export const entero = (valor, porDefecto, min, max) => {
  const n = Number.parseInt(valor, 10);
  if (!Number.isInteger(n)) return porDefecto;
  return Math.min(Math.max(n, min), max);
};

export const idValido = (valor) => {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 && n <= 2_147_483_647 ? n : null;
};

export const paginacion = (query, limitePorDefecto = 12) => {
  const limite = entero(query.limite, limitePorDefecto, 1, 50);
  const pagina = entero(query.pagina, 1, 1, 100_000);
  return { limite, pagina, offset: (pagina - 1) * limite };
};

export const textoBusqueda = (v) => (typeof v === 'string' ? v.trim().slice(0, 100) : '');

// Id del usuario que dejó tu middleware verificarToken (ajusta si lo guardas con otro nombre).
// Se convierte a número: en el JWT a veces viaja como string.
export const usuarioId = (req) => idValido(req.usuario?.id ?? req.user?.id);

// Envuelve cada handler: errores de negocio -> respuesta clara; el resto -> manejador final de Express
export const manejar = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (err instanceof ErrorNegocio) return res.status(err.status).json({ mensaje: err.message });
    next(err);
  }
};