import jwt from 'jsonwebtoken';
import { UsuarioModel } from '../models/models_usuarios.js';

const OPCIONES = { algorithm: 'HS256', issuer: 'farmacia-san-marcos', audience: 'farmacia-web' };

// El token solo lleva el id (sub). El rol y el estado se leen SIEMPRE de la base de datos.
export const firmarToken = (usuario) =>
  jwt.sign({}, process.env.JWT_SECRET, {
    ...OPCIONES,
    subject: String(usuario.id),
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

export async function verificarToken(req, res, next) {
  const [esquema, token] = (req.headers.authorization || '').split(' ');
  if (esquema !== 'Bearer' || !token) {
    return res.status(401).json({ mensaje: 'Inicia sesión para continuar.' });
  }

  let datos;
  try {
    datos = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: [OPCIONES.algorithm],
      issuer: OPCIONES.issuer,
      audience: OPCIONES.audience,
    });
  } catch {
    return res.status(401).json({ mensaje: 'Tu sesión expiró. Vuelve a iniciar sesión.' });
  }

  try {
    const usuario = await UsuarioModel.buscarPorId(Number(datos.sub));
    // Si lo desactivaron o le cambiaron el rol, el efecto es inmediato (no espera a que venza el token)
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ mensaje: 'Tu sesión ya no es válida.' });
    }
    req.usuario = { id: usuario.id, rol: usuario.rol };
    next();
  } catch (err) {
    next(err);
  }
}

export const soloRoles = (...roles) => (req, res, next) => {
  if (!req.usuario || !roles.includes(req.usuario.rol)) {
    return res.status(403).json({ mensaje: 'No tienes permiso para esta acción.' });
  }
  next();
};