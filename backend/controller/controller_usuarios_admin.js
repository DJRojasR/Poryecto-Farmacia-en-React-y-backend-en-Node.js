// backend/controller/controller_usuarios_admin.js
import { UsuarioAdminModel } from '../models/models_usuarios_admin.js';
import { idValido, manejar, paginacion, textoBusqueda, usuarioId } from '../helpers/http.js';

export const resumen = manejar(async (_req, res) => {
  res.json(await UsuarioAdminModel.resumen());
});

// GET /api/admin/usuarios?q=&rol=admin|cliente&pagina=
export const listar = manejar(async (req, res) => {
  const { limite, pagina, offset } = paginacion(req.query, 15);
  const rol = ['admin', 'cliente'].includes(req.query.rol) ? req.query.rol : undefined;
  const { items, total } = await UsuarioAdminModel.listar({ q: textoBusqueda(req.query.q), rol, limite, offset });
  res.json({ items, total, pagina, paginas: Math.max(1, Math.ceil(total / limite)) });
});

// PATCH /:id/rol  { rol: 'admin'|'cliente' }
export const cambiarRol = manejar(async (req, res) => {
  const id = idValido(req.params.id);
  const rol = req.body?.rol;
  if (!['admin', 'cliente'].includes(rol)) return res.status(400).json({ mensaje: 'Rol inválido.' });
  const u = id && (await UsuarioAdminModel.cambiarRol(id, rol, usuarioId(req)));
  if (!u) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
  res.json(u);
});

// PATCH /:id/activo  { activo: true|false }
export const cambiarActivo = manejar(async (req, res) => {
  const id = idValido(req.params.id);
  const activo = req.body?.activo;
  if (typeof activo !== 'boolean') return res.status(400).json({ mensaje: 'Valor inválido.' });
  const u = id && (await UsuarioAdminModel.cambiarActivo(id, activo, usuarioId(req)));
  if (!u) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
  res.json(u);
});