import { ErrorNegocio, UsuarioModel } from '../models/models_usuarios.js';

const ROLES = ['admin', 'cliente'];
const ID_MAXIMO = 2_147_483_647; // límite del tipo INTEGER de PostgreSQL

const enteroPositivo = (valor, maximo) => {
  const n = Number(valor);
  return Number.isSafeInteger(n) && n > 0 && n <= maximo ? n : null;
};

export async function listarUsuarios(req, res) {
  try {
    const limite = enteroPositivo(req.query.limite ?? 50, 100);
    const pagina = enteroPositivo(req.query.pagina ?? 1, 100_000);
    if (!limite || !pagina) return res.status(400).json({ mensaje: 'Paginación inválida.' });

    res.json({ usuarios: await UsuarioModel.listar({ limite, pagina }), pagina, limite });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'No pudimos cargar los usuarios.' });
  }
}

export async function actualizarUsuario(req, res) {
  try {
    const id = enteroPositivo(req.params.id, ID_MAXIMO);
    const { rol, activo } = req.body ?? {};

    if (!id) return res.status(400).json({ mensaje: 'Usuario inválido.' });
    if (rol === undefined && activo === undefined) {
      return res.status(400).json({ mensaje: 'No hay cambios que guardar.' });
    }
    if (rol !== undefined && !ROLES.includes(rol)) return res.status(400).json({ mensaje: 'Rol inválido.' });
    if (activo !== undefined && typeof activo !== 'boolean') return res.status(400).json({ mensaje: 'Estado inválido.' });

    // Evita que un admin se quite su propio acceso por error
    if (id === req.usuario.id && (rol === 'cliente' || activo === false)) {
      return res.status(400).json({ mensaje: 'No puedes quitarte tu propio acceso de administrador.' });
    }

    const usuario = await UsuarioModel.actualizar(id, { rol, activo });
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    res.json({ usuario });
  } catch (err) {
    if (err instanceof ErrorNegocio && err.codigo === 'ULTIMO_ADMIN') {
      return res.status(409).json({ mensaje: 'Debe quedar al menos un administrador activo.' });
    }
    console.error(err);
    res.status(500).json({ mensaje: 'No pudimos actualizar el usuario.' });
  }
}