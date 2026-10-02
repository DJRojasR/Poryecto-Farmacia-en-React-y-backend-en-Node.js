// backend/routes/routes_proveedores.js
import { Router } from 'express';
import { verificarToken, soloRoles } from '../middlewares/auth.js'; // ajusta la ruta/nombre a tu middleware de JWT
import * as c from '../controller/controller_proveedores.js';

// Montado en /api/admin/proveedores
const router = Router();

router.use(verificarToken, soloRoles('admin'));

router.get('/categorias', c.categorias);
router.get('/resumen', c.resumen);
router.get('/', c.listar);
router.post('/', c.crear);
router.patch('/compras/:compraId/anular', c.anularCompra); // antes de '/:id'
router.patch('/:id', c.actualizar);
router.patch('/:id/activo', c.cambiarActivo);
router.get('/:id/compras', c.listarCompras);
router.post('/:id/compras', c.registrarCompra);

export default router;