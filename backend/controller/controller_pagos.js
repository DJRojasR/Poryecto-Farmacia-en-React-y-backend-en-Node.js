// backend/controller/controller_pagos.js
import { PagoModel } from '../models/models_pagos.js';
import { PedidoModel } from '../models/models_pedidos.js';
import { idValido, manejar, usuarioId } from '../helpers/http.js';

// POST /api/pedidos/:id/pago  -> { clientSecret }  o  { yaPagado: true, pedido }
export const iniciar = manejar(async (req, res) => {
  const id = idValido(req.params.id);
  const r = id && (await PagoModel.iniciar(id, usuarioId(req)));
  if (!r) return res.status(404).json({ mensaje: 'Pedido no encontrado.' });
  if (r.yaPagado) return res.json({ yaPagado: true, pedido: await PedidoModel.obtener(id) });
  res.set('Cache-Control', 'no-store');
  res.json({ clientSecret: r.clientSecret });
});

// POST /api/pedidos/:id/pago/confirmar  -> pedido actualizado (pago_estado: 'pagado')
export const confirmar = manejar(async (req, res) => {
  const id = idValido(req.params.id);
  const ok = id && (await PagoModel.confirmar(id, usuarioId(req)));
  if (!ok) return res.status(404).json({ mensaje: 'Pedido no encontrado.' });
  res.json(await PedidoModel.obtener(id));
});