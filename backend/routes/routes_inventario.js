// backend/routes/routes_inventario.js
import { Router } from 'express';
import { verificarToken, soloRoles } from '../middlewares/auth.js'; // ajusta la ruta/nombre a tu middleware de JWT
import * as c from '../controller/controller_inventario.js';

// Montado en /api/admin/inventario — token válido + rol admin en TODAS las rutas
const router = Router();

router.use(verificarToken, soloRoles('admin'));

router.get('/resumen', c.resumen);              // tarjetas: unidades, stock bajo, sin stock
router.get('/motivos', c.motivos);              // motivos de entrada/salida para el formulario
router.get('/', c.listar);                      // ?q=&filtro=todos|bajo|agotado&pagina=
router.get('/movimientos', c.movimientos);       // kardex general (todos los productos)
router.post('/movimientos', c.registrarMovimiento);
router.get('/:productoId/movimientos', c.historial); // kardex de un producto

export default router;