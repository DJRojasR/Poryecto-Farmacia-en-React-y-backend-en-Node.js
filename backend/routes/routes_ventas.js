// backend/routes/routes_ventas.js
import { Router } from 'express';
import { verificarToken, soloRoles } from '../middlewares/auth.js'; // ajusta la ruta/nombre a tu middleware de JWT
import * as c from '../controller/controller_ventas.js';

// Montado en /api/admin/ventas
const router = Router();

router.use(verificarToken, soloRoles('admin'));
router.get('/metodos-pago', c.metodosPago);
router.get('/resumen', c.resumen);
router.get('/', c.listar);
router.post('/', c.crear);
router.patch('/:id/anular', c.anular);

export default router;