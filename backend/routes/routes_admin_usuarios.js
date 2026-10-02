// backend/routes/routes_admin_usuarios.js
// OJO: es distinto de tu routes_usuarios.js (/api/usuarios). Este es solo para el panel admin.
import { Router } from 'express';
import { verificarToken, soloRoles } from '../middlewares/auth.js'; // ajusta la ruta/nombre a tu middleware de JWT
import * as c from '../controller/controller_usuarios_admin.js';

// Montado en /api/admin/usuarios
const router = Router();

router.use(verificarToken, soloRoles('admin'));
router.get('/resumen', c.resumen);
router.get('/', c.listar);
router.patch('/:id/rol', c.cambiarRol);
router.patch('/:id/activo', c.cambiarActivo);

export default router;