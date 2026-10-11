// backend/controller/controller_inventario.js
import { InventarioModel } from '../models/models_inventario.js';
import { ProductoModel } from '../models/models_productos.js';
import { ETIQUETAS, MOTIVOS, motivoManualValido } from '../helpers/motivos_inventario.js';
import { idValido, manejar, paginacion, textoBusqueda, usuarioId } from '../helpers/http.js';

const FILTROS = ['todos', 'bajo', 'agotado'];

export const motivos = (_req, res) => res.json({ ...MOTIVOS, etiquetas: ETIQUETAS });

export const resumen = manejar(async (_req, res) => {
  res.json(await InventarioModel.resumen());
});

export const listar = manejar(async (req, res) => {
  const { limite, pagina, offset } = paginacion(req.query, 15);
  const filtro = FILTROS.includes(req.query.filtro) ? req.query.filtro : 'todos';
  const { items, total } = await InventarioModel.listar({
    q: textoBusqueda(req.query.q),
    filtro,
    limite,
    offset,
  });
  res.json({ items, total, pagina, paginas: Math.max(1, Math.ceil(total / limite)) });
});

// GET /movimientos?tipo=entrada|salida&motivo=&q=&pagina=  -> kardex general
export const movimientos = manejar(async (req, res) => {
  const { limite, pagina, offset } = paginacion(req.query, 20);
  const tipo = ['entrada', 'salida'].includes(req.query.tipo) ? req.query.tipo : undefined;
  const motivo = typeof req.query.motivo === 'string' && Object.hasOwn(ETIQUETAS, req.query.motivo)
    ? req.query.motivo : undefined;
  const { items, total } = await InventarioModel.movimientos({
    tipo, motivo, q: textoBusqueda(req.query.q), limite, offset,
  });
  res.json({ items, total, pagina, paginas: Math.max(1, Math.ceil(total / limite)) });
});

// POST /movimientos  { productoId, tipo: 'entrada'|'salida', cantidad, motivo, nota? }
export const registrarMovimiento = manejar(async (req, res) => {
  const b = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const errores = {};

  const productoId = idValido(b.productoId);
  if (!productoId) errores.productoId = 'Producto inválido.';

  const { tipo } = b;
  if (tipo !== 'entrada' && tipo !== 'salida') errores.tipo = 'Elige entrada o salida.';

  const { cantidad } = b;
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 100_000) {
    errores.cantidad = 'La cantidad debe ser un entero entre 1 y 100 000.';
  }

  if (!errores.tipo && !motivoManualValido(tipo, b.motivo)) errores.motivo = 'Elige un motivo válido.';

  let nota = null;
  if (b.nota != null && b.nota !== '') {
    if (typeof b.nota !== 'string' || b.nota.trim().length > 200) {
      errores.nota = 'La nota no puede pasar de 200 caracteres.';
    } else {
      nota = b.nota.trim() || null;
    }
  }

  if (Object.keys(errores).length) return res.status(400).json({ mensaje: 'Revisa los datos.', errores });

  const resultado = await InventarioModel.registrarMovimiento({
    productoId,
    tipo,
    cantidad,
    motivo: b.motivo,
    nota,
    usuarioId: usuarioId(req),
  });
  if (!resultado) return res.status(404).json({ mensaje: 'Producto no encontrado.' });
  res.status(201).json(resultado);
});

// GET /:productoId/movimientos  -> kardex del producto (más reciente primero)
export const historial = manejar(async (req, res) => {
  const id = idValido(req.params.productoId);
  const producto = id && (await ProductoModel.buscarPorId(id));
  if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado.' });

  const { limite, pagina, offset } = paginacion(req.query, 20);
  const { items, total } = await InventarioModel.historial(id, { limite, offset });
  res.json({
    producto: { id: producto.id, nombre: producto.nombre, stock: producto.stock },
    items,
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / limite)),
  });
});