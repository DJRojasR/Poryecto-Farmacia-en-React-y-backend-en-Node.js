import { Router } from 'express';
import { verificarToken, soloRoles } from '../middlewares/auth.js'; // ajusta la ruta/nombre a tu middleware de JWT
import * as c from '../controller/controller_dashboard.js';
 
// Montado en /api/admin/dashboard
const router = Router();
 
router.use(verificarToken, soloRoles('admin'));
router.get('/', c.resumen);
 
export default router;
 