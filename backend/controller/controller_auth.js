import bcrypt from 'bcryptjs';
import { firmarToken } from '../middlewares/auth.js';
import { UsuarioModel } from '../models/models_usuarios.js';

const COSTO_BCRYPT = 12;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Solo letras (con tildes), espacios, apóstrofo, punto y guion: bloquea <, >, comillas, etc.
const NOMBRE_RE = /^[\p{L}\p{M}][\p{L}\p{M}' .-]{1,99}$/u;

// Hash de relleno: si el correo no existe, igual se ejecuta bcrypt para que la respuesta
// tarde lo mismo y no se pueda averiguar qué correos están registrados por el tiempo.
const HASH_FALSO = bcrypt.hashSync('relleno-para-igualar-tiempos', COSTO_BCRYPT);

const esTexto = (v) => typeof v === 'string';
const datosPublicos = ({ id, nombre, email, rol }) => ({ id, nombre, email, rol });

export async function registrar(req, res) {
  try {
    const { nombre, email, password } = req.body ?? {};

    if (![nombre, email, password].every(esTexto)) {
      return res.status(400).json({ mensaje: 'Datos inválidos.' });
    }

    const nombreLimpio = nombre.trim().replace(/\s+/g, ' ');
    const emailLimpio = email.trim().toLowerCase();

    if (!NOMBRE_RE.test(nombreLimpio)) {
      return res.status(400).json({ campo: 'nombre', mensaje: 'Escribe tu nombre usando solo letras.' });
    }
    if (emailLimpio.length > 150 || !EMAIL_RE.test(emailLimpio)) {
      return res.status(400).json({ campo: 'email', mensaje: 'Revisa el correo: falta el @ o el dominio.' });
    }
    // bcrypt solo procesa 72 bytes: se rechaza más largo en vez de truncar en silencio
    if (
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      return res.status(400).json({
        campo: 'password',
        mensaje: 'La contraseña debe tener entre 8 y 72 caracteres, con letras y números.',
      });
    }

    const passwordHash = await bcrypt.hash(password, COSTO_BCRYPT);
    // El rol NO viene del cliente: todo registro público es "cliente".
    const usuario = await UsuarioModel.crear({
      nombre: nombreLimpio,
      email: emailLimpio,
      passwordHash,
      rol: 'cliente',
    });

    res.status(201).json({ token: firmarToken(usuario), usuario: datosPublicos(usuario) });
  } catch (err) {
    // 23505 = correo duplicado (también cubre dos registros simultáneos con el mismo correo)
    if (err.code === '23505') {
      return res.status(409).json({ campo: 'email', mensaje: 'Ese correo ya está registrado. Inicia sesión.' });
    }
    console.error(err);
    res.status(500).json({ mensaje: 'No pudimos crear tu cuenta. Inténtalo de nuevo.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};
    const generico = { mensaje: 'Correo o contraseña incorrectos.' };

    if (!esTexto(email) || !esTexto(password)) {
      return res.status(400).json({ mensaje: 'Escribe tu correo y tu contraseña.' });
    }

    const emailLimpio = email.trim().toLowerCase();
    if (!emailLimpio || !password || emailLimpio.length > 150 || password.length > 128) {
      return res.status(401).json(generico);
    }

    const usuario = await UsuarioModel.buscarPorEmail(emailLimpio);
    const coincide = await bcrypt.compare(password, usuario?.password_hash ?? HASH_FALSO);

    // Mismo mensaje y mismo tiempo si el correo no existe o la contraseña falla
    if (!usuario || !coincide) return res.status(401).json(generico);

    if (!usuario.activo) {
      return res.status(403).json({ mensaje: 'Tu cuenta está desactivada. Contacta a la farmacia.' });
    }

    res.json({ token: firmarToken(usuario), usuario: datosPublicos(usuario) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'No pudimos iniciar sesión. Inténtalo de nuevo.' });
  }
}

// verificarToken ya comprobó en la BD que el usuario existe y está activo
export async function perfil(req, res) {
  try {
    const usuario = await UsuarioModel.buscarPorId(req.usuario.id);
    res.json({ usuario: datosPublicos(usuario) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'No pudimos cargar tu perfil.' });
  }
}