import { Router } from 'express';
import { verificarToken, soloRoles } from '../middlewares/auth.js'; // ajusta la ruta/nombre a tu middleware de JWT
import * as c from '../controller/controller_productos.js';
import { subirImagen } from '../middlewares/subir_imagen.js';

// ---------- Públicas: cualquiera puede ver el catálogo (solo lectura) ----------
export const rutasPublicas = Router();

rutasPublicas.get('/categorias', c.categorias); // antes de '/:id'
rutasPublicas.get('/', c.listarPublicos);
rutasPublicas.get('/:id', c.obtenerPublico);

// ---------- Admin: token válido + rol admin en TODAS las rutas ----------
export const rutasAdmin = Router();

rutasAdmin.use(verificarToken, soloRoles('admin'));

rutasAdmin.get('/', c.listarAdmin);
rutasAdmin.get('/:id', c.obtenerAdmin);
rutasAdmin.post('/', subirImagen, c.crear);            // ✅ solo con multer
rutasAdmin.patch('/:id', subirImagen, c.actualizar);    // ✅ solo con multer
rutasAdmin.patch('/:id/stock', c.ajustarStock);
rutasAdmin.patch('/:id/reactivar', c.reactivar);
rutasAdmin.delete('/:id', c.desactivar);