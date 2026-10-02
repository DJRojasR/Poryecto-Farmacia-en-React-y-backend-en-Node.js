// backend/routes/routes_pedidos.js
import { Router } from 'express';
import { verificarToken, soloRoles } from '../middlewares/auth.js'; // ajusta la ruta/nombre a tu middleware de JWT
import * as c from '../controller/controller_pedidos.js';
import * as pago from '../controller/controller_pagos.js';

// ---------- Cliente: montado en /api/pedidos (cualquier usuario con sesión) ----------
export const rutasCliente = Router();

rutasCliente.use(verificarToken);
rutasCliente.post('/', c.crear);                    // checkout del carrito
rutasCliente.get('/mios', c.mios);                  // "Mis compras"
rutasCliente.patch('/:id/cancelar', c.cancelarPropio);
rutasCliente.post('/:id/pago', pago.iniciar);             // prepara el cobro en Stripe
rutasCliente.post('/:id/pago/confirmar', pago.confirmar); // el servidor verifica el pago

// ---------- Admin: montado en /api/admin/pedidos ----------
export const rutasAdmin = Router();

rutasAdmin.use(verificarToken, soloRoles('admin'));
rutasAdmin.get('/resumen', c.resumenAdmin);
rutasAdmin.get('/', c.listarAdmin);
rutasAdmin.patch('/:id/estado', c.cambiarEstado);