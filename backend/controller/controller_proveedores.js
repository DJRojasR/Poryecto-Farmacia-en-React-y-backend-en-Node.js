// backend/controller/controller_proveedores.js
import { ProveedorModel } from '../models/models_proveedores.js';
import { CATEGORIAS_PROVEEDOR, esValorDe } from '../helpers/constantes_negocio.js';
import { idValido, manejar, paginacion, textoBusqueda, tiene, usuarioId } from '../helpers/http.js';
import { textoOpcional } from '../helpers/validar_pedido.js';

const cuerpo = (req) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {});

// Fecha de hoy en Perú, 'YYYY-MM-DD'
const hoyLima = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

function validarProveedor(b, { parcial = false } = {}) {
  const errores = {};
  const datos = {};

  if (!parcial || tiene(b, 'razon_social')) {
    const v = typeof b.razon_social === 'string' ? b.razon_social.trim() : '';
    if (v.length < 2 || v.length > 150) errores.razon_social = 'Escribe la razón social (2 a 150 caracteres).';
    else datos.razon_social = v;
  }
  if (!parcial || tiene(b, 'ruc')) {
    const v = typeof b.ruc === 'string' ? b.ruc.trim() : '';
    if (!/^\d{11}$/.test(v)) errores.ruc = 'El RUC debe tener 11 dígitos.';
    else datos.ruc = v;
  }
  if (!parcial || tiene(b, 'categoria')) {
    if (!esValorDe(CATEGORIAS_PROVEEDOR, b.categoria)) errores.categoria = 'Elige una categoría válida.';
    else datos.categoria = b.categoria;
  }
  if (tiene(b, 'telefono')) {
    const v = textoOpcional(b.telefono, 20);
    if (v.error || (v.valor && !/^[0-9+()\s-]{6,20}$/.test(v.valor))) errores.telefono = 'Teléfono inválido.';
    else datos.telefono = v.valor;
  }
  if (tiene(b, 'email')) {
    const v = textoOpcional(b.email, 150);
    if (v.error || (v.valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.valor))) errores.email = 'Correo inválido.';
    else datos.email = v.valor ? v.valor.toLowerCase() : null;
  }
  // Textos libres opcionales
  [['contacto', 100], ['direccion', 200], ['notas', 500]].forEach(([campo, max]) => {
    if (!tiene(b, campo)) return;
    const v = textoOpcional(b[campo], max);
    if (v.error) errores[campo] = `No puede pasar de ${max} caracteres.`;
    else datos[campo] = v.valor;
  });

  return { errores, datos };
}

const conErrores = (res, errores) =>
  res.status(400).json({ mensaje: Object.values(errores)[0], errores });

export const categorias = (_req, res) => res.json(CATEGORIAS_PROVEEDOR);

export const resumen = manejar(async (_req, res) => {
  res.json(await ProveedorModel.resumen());
});

// GET /api/admin/proveedores?q=&estado=activos|inactivos&pagina=
export const listar = manejar(async (req, res) => {
  const { limite, pagina, offset } = paginacion(req.query, 15);
  const estado = ['activos', 'inactivos'].includes(req.query.estado) ? req.query.estado : undefined;
  const { items, total } = await ProveedorModel.listar({ q: textoBusqueda(req.query.q), estado, limite, offset });
  res.json({ items, total, pagina, paginas: Math.max(1, Math.ceil(total / limite)) });
});

export const crear = manejar(async (req, res) => {
  const { errores, datos } = validarProveedor(cuerpo(req));
  if (Object.keys(errores).length) return conErrores(res, errores);
  res.status(201).json(await ProveedorModel.crear(datos));
});

export const actualizar = manejar(async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(404).json({ mensaje: 'Proveedor no encontrado.' });
  const { errores, datos } = validarProveedor(cuerpo(req), { parcial: true });
  if (Object.keys(errores).length) return conErrores(res, errores);
  const prov = await ProveedorModel.actualizar(id, datos);
  if (!prov) return res.status(404).json({ mensaje: 'Proveedor no encontrado.' });
  res.json(prov);
});

// PATCH /:id/activo  { activo: true|false }
export const cambiarActivo = manejar(async (req, res) => {
  const id = idValido(req.params.id);
  const { activo } = cuerpo(req);
  if (typeof activo !== 'boolean') return res.status(400).json({ mensaje: 'Valor inválido.' });
  const prov = id && (await ProveedorModel.cambiarActivo(id, activo));
  if (!prov) return res.status(404).json({ mensaje: 'Proveedor no encontrado.' });
  res.json(prov);
});

// ---------- Compras ----------

export const listarCompras = manejar(async (req, res) => {
  const id = idValido(req.params.id);
  const prov = id && (await ProveedorModel.buscarPorId(id));
  if (!prov) return res.status(404).json({ mensaje: 'Proveedor no encontrado.' });
  const { limite, pagina, offset } = paginacion(req.query, 20);
  const { items, total } = await ProveedorModel.listarCompras(id, { limite, offset });
  res.json({ items, total, pagina, paginas: Math.max(1, Math.ceil(total / limite)) });
});

// POST /:id/compras  { total, comprobante?, nota?, fecha? 'YYYY-MM-DD' }
export const registrarCompra = manejar(async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(404).json({ mensaje: 'Proveedor no encontrado.' });
  const b = cuerpo(req);
  const errores = {};

  const s = String(b.total ?? '').trim();
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(s) || Number(s) <= 0) errores.total = 'Ingresa un monto válido (máx. 2 decimales).';

  const comprobante = textoOpcional(b.comprobante, 30);
  if (comprobante.error) errores.comprobante = 'El comprobante no puede pasar de 30 caracteres.';
  const nota = textoOpcional(b.nota, 200);
  if (nota.error) errores.nota = 'La nota no puede pasar de 200 caracteres.';

  let fecha = null;
  if (b.fecha != null && b.fecha !== '') {
    const valida = typeof b.fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.fecha)
      && !Number.isNaN(Date.parse(`${b.fecha}T00:00:00Z`));
    if (!valida) errores.fecha = 'Fecha inválida.';
    else if (b.fecha > hoyLima()) errores.fecha = 'La fecha no puede ser futura.';
    else fecha = b.fecha;
  }

  if (Object.keys(errores).length) return conErrores(res, errores);

  const compra = await ProveedorModel.registrarCompra({
    proveedorId: id, total: s, comprobante: comprobante.valor, nota: nota.valor, fecha, usuarioId: usuarioId(req),
  });
  if (!compra) return res.status(404).json({ mensaje: 'Proveedor no encontrado.' });
  res.status(201).json(compra);
});

export const anularCompra = manejar(async (req, res) => {
  const id = idValido(req.params.compraId);
  const compra = id && (await ProveedorModel.anularCompra(id));
  if (!compra) return res.status(404).json({ mensaje: 'Compra no encontrada.' });
  res.json(compra);
});