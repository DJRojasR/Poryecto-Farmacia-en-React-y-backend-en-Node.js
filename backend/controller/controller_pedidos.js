// backend/controller/controller_pedidos.js
// Pedidos web: lo que hace el cliente (checkout, mis compras, cancelar)
// y lo que hace el admin (listar, cambiar estado).
import { PedidoModel } from '../models/models_pedidos.js';
import { PagoModel } from '../models/models_pagos.js';
import { UsuarioAdminModel } from '../models/models_usuarios_admin.js';
import { ESTADOS_PEDIDO } from '../helpers/constantes_negocio.js';
import { idValido, manejar, paginacion, textoBusqueda, usuarioId } from '../helpers/http.js';
import { textoOpcional, validarItems } from '../helpers/validar_pedido.js';

const cuerpo = (req) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {});

// ---------- Cliente ----------

// POST /api/pedidos  { items: [{productoId, cantidad}], entrega: 'recojo'|'delivery', direccion?, telefono?, nota? }
export const crear = manejar(async (req, res) => {
  const uid = usuarioId(req);
  const usuario = uid && (await UsuarioAdminModel.buscarPorId(uid));
  if (!usuario || !usuario.activo) return res.status(403).json({ mensaje: 'Tu cuenta no está activa.' });

  const b = cuerpo(req);
  const errores = {};

  const { items, error: errorItems } = validarItems(b.items);
  if (errorItems) errores.items = errorItems;

  const entrega = b.entrega === 'delivery' ? 'delivery' : 'recojo';
  let direccion = null;
  let telefono = null;
  if (entrega === 'delivery') {
    direccion = typeof b.direccion === 'string' ? b.direccion.trim() : '';
    telefono = typeof b.telefono === 'string' ? b.telefono.trim() : '';
    if (direccion.length < 5 || direccion.length > 200) errores.direccion = 'Escribe la dirección de entrega.';
    if (!/^[0-9+()\s-]{6,20}$/.test(telefono)) errores.telefono = 'Escribe un teléfono válido.';
  }
  const nota = textoOpcional(b.nota, 200);
  if (nota.error) errores.nota = 'La nota no puede pasar de 200 caracteres.';

  if (Object.keys(errores).length) {
    return res.status(400).json({ mensaje: Object.values(errores)[0], errores });
  }

  const pedido = await PedidoModel.crear({
    canal: 'web',
    usuarioId: uid,
    clienteNombre: usuario.nombre,
    entrega,
    direccion,
    telefono,
    nota: nota.valor,
    items,
  });
  res.status(201).json(pedido);
});

// GET /api/pedidos/mios?pagina=
export const mios = manejar(async (req, res) => {
  const { limite, pagina, offset } = paginacion(req.query, 10);
  const { items, total } = await PedidoModel.listar({ usuarioId: usuarioId(req), limite, offset });
  res.json({ items, total, pagina, paginas: Math.max(1, Math.ceil(total / limite)) });
});

// PATCH /api/pedidos/:id/cancelar  -> solo el dueño y solo si sigue 'pendiente'
export const cancelarPropio = manejar(async (req, res) => {
  const id = idValido(req.params.id);
  const uid = usuarioId(req);
  const pedido = id && (await PedidoModel.cambiarEstado(id, 'cancelado', {
    usuarioId: uid, duenoId: uid, desde: ['pendiente'], canal: 'web',
  }));
  if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado.' });
  await PagoModel.alCancelar(id); // si ya había pagado, se le devuelve el dinero
  res.json(await PedidoModel.obtener(id));
});

// ---------- Admin ----------

export const resumenAdmin = manejar(async (_req, res) => {
  res.json(await PedidoModel.resumenEstados());
});

// GET /api/admin/pedidos?estado=&q=&pagina=
export const listarAdmin = manejar(async (req, res) => {
  const { limite, pagina, offset } = paginacion(req.query, 15);
  const estado = ESTADOS_PEDIDO.includes(req.query.estado) ? req.query.estado : undefined;
  const { items, total } = await PedidoModel.listar({
    canal: 'web', estado, q: textoBusqueda(req.query.q), limite, offset,
  });
  res.json({ items, total, pagina, paginas: Math.max(1, Math.ceil(total / limite)) });
});

// PATCH /api/admin/pedidos/:id/estado  { estado }
export const cambiarEstado = manejar(async (req, res) => {
  const id = idValido(req.params.id);
  const { estado } = cuerpo(req);
  if (!ESTADOS_PEDIDO.includes(estado)) return res.status(400).json({ mensaje: 'Estado inválido.' });
  const pedido = id && (await PedidoModel.cambiarEstado(id, estado, { usuarioId: usuarioId(req), canal: 'web' }));
  if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado.' });
  if (estado === 'cancelado') {
    await PagoModel.alCancelar(id); // reembolso automático si estaba pagado
    return res.json(await PedidoModel.obtener(id));
  }
  res.json(pedido);
});