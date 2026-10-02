// backend/controller/controller_ventas.js
// Ventas de mostrador: se guardan como pedidos canal 'mostrador', ya entregados.
import { PedidoModel } from '../models/models_pedidos.js';
import { METODOS_PAGO, esValorDe } from '../helpers/constantes_negocio.js';
import { idValido, manejar, paginacion, textoBusqueda, usuarioId } from '../helpers/http.js';
import { textoOpcional, validarItems } from '../helpers/validar_pedido.js';

export const metodosPago = (_req, res) => res.json(METODOS_PAGO);

export const resumen = manejar(async (_req, res) => {
  res.json(await PedidoModel.resumenVentas());
});

// GET /api/admin/ventas?q=&canal=web|mostrador&estado=vigentes|cancelado&pagina=
// Lista TODAS las ventas: mostrador + pedidos web ya pagados con tarjeta.
export const listar = manejar(async (req, res) => {
  const { limite, pagina, offset } = paginacion(req.query, 15);
  const canal = ['web', 'mostrador'].includes(req.query.canal) ? req.query.canal : undefined;
  const { items, total } = await PedidoModel.listar({
    soloVentas: true,
    canal,
    estado: req.query.estado === 'cancelado' ? 'cancelado' : undefined,
    noCancelados: req.query.estado === 'vigentes',
    q: textoBusqueda(req.query.q),
    limite,
    offset,
  });
  res.json({ items, total, pagina, paginas: Math.max(1, Math.ceil(total / limite)) });
});

// POST /api/admin/ventas
// { cliente?, metodo_pago, items: [{productoId, cantidad}], receta_verificada?, nota? }
export const crear = manejar(async (req, res) => {
  const b = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const errores = {};

  const cliente = textoOpcional(b.cliente, 100);
  if (cliente.error) errores.cliente = 'El nombre del cliente no puede pasar de 100 caracteres.';

  if (!esValorDe(METODOS_PAGO, b.metodo_pago)) errores.metodo_pago = 'Elige un método de pago.';

  const { items, error: errorItems } = validarItems(b.items);
  if (errorItems) errores.items = errorItems;

  const nota = textoOpcional(b.nota, 200);
  if (nota.error) errores.nota = 'La nota no puede pasar de 200 caracteres.';

  if (Object.keys(errores).length) {
    return res.status(400).json({ mensaje: Object.values(errores)[0], errores });
  }

  const venta = await PedidoModel.crear({
    canal: 'mostrador',
    clienteNombre: cliente.valor || 'Cliente mostrador',
    metodoPago: b.metodo_pago,
    nota: nota.valor,
    items,
    registradoPor: usuarioId(req),
    permitirReceta: b.receta_verificada === true,
  });
  res.status(201).json(venta);
});

// PATCH /api/admin/ventas/:id/anular  -> devuelve el stock
export const anular = manejar(async (req, res) => {
  const id = idValido(req.params.id);
  const venta = id && (await PedidoModel.cambiarEstado(id, 'cancelado', {
    usuarioId: usuarioId(req), canal: 'mostrador',
  }));
  if (!venta) return res.status(404).json({ mensaje: 'Venta no encontrada.' });
  res.json(venta);
});