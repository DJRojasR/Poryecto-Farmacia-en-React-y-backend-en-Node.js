import { ProductoModel, ErrorNegocio } from '../models/models_productos.js';
import { CATEGORIAS, catalogoParaCliente } from '../helpers/categorias_productos.js';
import { borrarImagen } from '../middlewares/subir_imagen.js';

// ---------- Utilidades ----------

const tiene = (obj, k) => Object.prototype.hasOwnProperty.call(obj, k);

const entero = (valor, porDefecto, min, max) => {
  const n = Number.parseInt(valor, 10);
  if (!Number.isInteger(n)) return porDefecto;
  return Math.min(Math.max(n, min), max);
};

const idValido = (valor) => {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 && n <= 2_147_483_647 ? n : null;
};

const paginacion = (query) => {
  const limite = entero(query.limite, 12, 1, 50);
  const pagina = entero(query.pagina, 1, 1, 100_000);
  return { limite, pagina, offset: (pagina - 1) * limite };
};

const textoBusqueda = (v) => (typeof v === 'string' ? v.trim().slice(0, 100) : '');

// Envuelve cada handler: errores de negocio -> respuesta clara; el resto -> manejador final de Express
const manejar = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (err instanceof ErrorNegocio) return res.status(err.status).json({ mensaje: err.message });
    next(err);
  }
};

// Lo que ve el cliente: sin stock exacto, solo si hay o no
const paraPublico = (p) => ({
  id: p.id,
  nombre: p.nombre,
  marca: p.marca,
  categoria: p.categoria,
  subcategoria: p.subcategoria,
  descripcion: p.descripcion,
  imagen: p.imagen,
  precio: p.precio,
  requiere_receta: p.requiere_receta,
  disponible: p.stock > 0,
  pocas_unidades: p.stock > 0 && p.stock <= 5,
});

// ---------- Validación ----------

function validarProducto(body, { parcial = false } = {}) {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const errores = {};
  const datos = {};

  if (!parcial || tiene(b, 'nombre')) {
    const v = typeof b.nombre === 'string' ? b.nombre.trim() : '';
    if (v.length < 2 || v.length > 150) errores.nombre = 'El nombre debe tener entre 2 y 150 caracteres.';
    else datos.nombre = v;
  }

  if (tiene(b, 'marca')) {
    const v = b.marca == null ? '' : b.marca;
    if (typeof v !== 'string' || v.trim().length > 80) errores.marca = 'La marca no puede pasar de 80 caracteres.';
    else datos.marca = v.trim() || null;
  }

  if (!parcial || tiene(b, 'categoria')) {
    if (typeof b.categoria !== 'string' || !tiene(CATEGORIAS, b.categoria)) errores.categoria = 'Elige una categoría válida.';
    else datos.categoria = b.categoria;
  }

  if (tiene(b, 'subcategoria')) {
    const v = b.subcategoria == null || b.subcategoria === '' ? null : b.subcategoria;
    if (v !== null) {
      if (!datos.categoria) errores.subcategoria = 'Para cambiar la subcategoría envía también la categoría.';
      else if (!CATEGORIAS[datos.categoria].subcategorias.includes(v)) errores.subcategoria = 'La subcategoría no pertenece a esa categoría.';
      else datos.subcategoria = v;
    } else {
      datos.subcategoria = null;
    }
  } else if (parcial && datos.categoria) {
    // Cambió la categoría y no mandó subcategoría: se limpia para no dejar una incoherente
    datos.subcategoria = null;
  }

  if (!parcial || tiene(b, 'precio')) {
    const s = String(b.precio ?? '').trim();
    if (!/^\d{1,5}(\.\d{1,2})?$/.test(s) || Number(s) <= 0) errores.precio = 'Ingresa un precio válido (máx. 2 decimales).';
    else datos.precio = Number(s);
  }

  // El stock inicial solo se acepta al crear; después se usa PATCH /:id/stock
  if (!parcial) {
    const v = b.stock === undefined || b.stock === '' ? 0 : Number(b.stock);
    if (!Number.isInteger(v) || v < 0 || v > 100_000) errores.stock = 'Ingresa un stock válido (entero, 0 o más).';
    else datos.stock = v;
  }

  if (tiene(b, 'descripcion')) {
    const v = b.descripcion == null ? '' : b.descripcion;
    if (typeof v !== 'string' || v.trim().length > 2000) errores.descripcion = 'La descripción no puede pasar de 2000 caracteres.';
    else datos.descripcion = v.trim() || null;
  }

  // ⚠️ El bloque de 'imagen' fue eliminado: ahora la imagen llega como archivo
  // vía multer y se guarda en req.imagenNueva (middleware subir_imagen.js)

  if (tiene(b, 'requiere_receta')) {
    const v = b.requiere_receta;
    if (v === true || v === 'true') datos.requiere_receta = true;
    else if (v === false || v === 'false') datos.requiere_receta = false;
    else errores.requiere_receta = 'Valor inválido.';
  }

  return { errores, datos };
}

// ---------- Público ----------

export const categorias = (_req, res) => res.json(catalogoParaCliente());

export const listarPublicos = manejar(async (req, res) => {
  const { limite, pagina, offset } = paginacion(req.query);
  const categoria = tiene(CATEGORIAS, req.query.categoria) ? req.query.categoria : undefined;
  const { items, total } = await ProductoModel.listarPublicos({
    q: textoBusqueda(req.query.q),
    categoria,
    subcategoria: typeof req.query.subcategoria === 'string' ? req.query.subcategoria.slice(0, 80) : undefined,
    limite,
    offset,
  });
  res.json({ items: items.map(paraPublico), total, pagina, paginas: Math.ceil(total / limite) });
});

export const obtenerPublico = manejar(async (req, res) => {
  const id = idValido(req.params.id);
  const producto = id && (await ProductoModel.buscarPorId(id));
  if (!producto || !producto.activo) return res.status(404).json({ mensaje: 'Producto no encontrado.' });
  res.json(paraPublico(producto));
});

// ---------- Admin ----------

export const listarAdmin = manejar(async (req, res) => {
  const { limite, pagina, offset } = paginacion(req.query);
  const estado = ['activos', 'inactivos'].includes(req.query.estado) ? req.query.estado : 'todos';
  const categoria = tiene(CATEGORIAS, req.query.categoria) ? req.query.categoria : undefined;
  const { items, total } = await ProductoModel.listarAdmin({
    q: textoBusqueda(req.query.q),
    categoria,
    estado,
    agotados: req.query.agotados === 'true',
    limite,
    offset,
  });
  res.json({ items, total, pagina, paginas: Math.ceil(total / limite) });
});

export const obtenerAdmin = manejar(async (req, res) => {
  const id = idValido(req.params.id);
  const producto = id && (await ProductoModel.buscarPorId(id));
  if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado.' });
  res.json(producto);
});

export const crear = manejar(async (req, res) => {
  const { errores, datos } = validarProducto(req.body);
  if (Object.keys(errores).length) {
    await borrarImagen(req.imagenNueva);
    return res.status(400).json({ mensaje: 'Revisa los datos.', errores });
  }
  if (req.imagenNueva) datos.imagen = req.imagenNueva;
  try {
    const producto = await ProductoModel.crear(datos);
    res.status(201).json(producto);
  } catch (e) {
    await borrarImagen(req.imagenNueva);
    throw e;
  }
});

export const actualizar = manejar(async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) {
    await borrarImagen(req.imagenNueva);
    return res.status(404).json({ mensaje: 'Producto no encontrado.' });
  }
  const { errores, datos } = validarProducto(req.body, { parcial: true });
  if (Object.keys(errores).length) {
    await borrarImagen(req.imagenNueva);
    return res.status(400).json({ mensaje: 'Revisa los datos.', errores });
  }
  if (req.imagenNueva) datos.imagen = req.imagenNueva;
  try {
    const producto = await ProductoModel.actualizar(id, datos);
    if (!producto) {
      await borrarImagen(req.imagenNueva);
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }
    res.json(producto);
  } catch (e) {
    await borrarImagen(req.imagenNueva);
    throw e;
  }
});

export const ajustarStock = manejar(async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(404).json({ mensaje: 'Producto no encontrado.' });
  const ajuste = req.body?.ajuste;
  if (!Number.isInteger(ajuste) || ajuste === 0 || Math.abs(ajuste) > 100_000) {
    return res.status(400).json({ mensaje: 'El ajuste debe ser un entero distinto de 0 (positivo suma, negativo resta).' });
  }
  const producto = await ProductoModel.ajustarStock(id, ajuste);
  if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado.' });
  res.json(producto);
});

export const desactivar = manejar(async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(404).json({ mensaje: 'Producto no encontrado.' });
  const producto = await ProductoModel.desactivar(id);
  if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado.' });
  res.json({ mensaje: 'Producto eliminado del catálogo.', producto });
});

export const reactivar = manejar(async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(404).json({ mensaje: 'Producto no encontrado.' });
  const producto = await ProductoModel.reactivar(id);
  if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado.' });
  res.json(producto);
});