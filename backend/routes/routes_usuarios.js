import { Router } from 'express';
import { actualizarUsuario, listarUsuarios } from '../controller/controller_usuarios.js';
import { soloRoles, verificarToken } from '../middlewares/auth.js';

const router = Router();

// Todo lo de este archivo es solo para administradores
router.use(verificarToken, soloRoles('admin'));

router.get('/', listarUsuarios);
router.patch('/:id', actualizarUsuario);

export default router;