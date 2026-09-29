// src/components/Admin/Productos/Productos.jsx
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, Pill, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../../../models/context/AuthContext.jsx';
import {
  actualizarProducto,
  ajustarStock,
  crearProducto,
  eliminarProducto,
  listarProductos,
  obtenerCategorias,
  reactivarProducto,
  urlImagen,
} from '../../../models/helpers/productos.js';
import './Productos.css';

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024;

function FormularioProducto({ inicial, categorias, token, onGuardado, onRefrescar, onCancelar }) {
  const editando = Boolean(inicial);

  const [datos, setDatos] = useState(() =>
    inicial
      ? {
          nombre: inicial.nombre,
          marca: inicial.marca ?? '',
          categoria: inicial.categoria,
          subcategoria: inicial.subcategoria ?? '',
          precio: String(inicial.precio),
          stock: '',
          descripcion: inicial.descripcion ?? '',
          requiere_receta: inicial.requiere_receta,
        }
      : {
          nombre: '',
          marca: '',
          categoria: categorias[0].id,
          subcategoria: '',
          precio: '',
          stock: '',
          descripcion: '',
          requiere_receta: false,
        }
  );
  const [stockActual, setStockActual] = useState(inicial?.stock ?? 0);
  const [ajuste, setAjuste] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [vista, setVista] = useState(null);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  const subcategorias = categorias.find((c) => c.id === datos.categoria)?.subcategorias ?? [];

  // Vista previa local de la imagen elegida (se libera al cambiar o cerrar)
  useEffect(() => {
    if (!archivo) {
      setVista(null);
      return undefined;
    }
    const url = URL.createObjectURL(archivo);
    setVista(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  const cambiar = (campo) => (e) => setDatos((d) => ({ ...d, [campo]: e.target.value }));

  const cambiarCategoria = (e) =>
    setDatos((d) => ({ ...d, categoria: e.target.value, subcategoria: '' }));

  const elegirArchivo = (e) => {
    const f = e.target.files[0];
    setErrores((prev) => ({ ...prev, imagen: undefined }));
    if (!f) return setArchivo(null);
    // Solo comodidad: el servidor vuelve a validar y re-codifica la imagen
    if (!TIPOS_IMAGEN.includes(f.type)) {
      e.target.value = '';
      return setErrores((prev) => ({ ...prev, imagen: 'Solo JPG, PNG o WEBP.' }));
    }
    if (f.size > MAX_BYTES) {
      e.target.value = '';
      return setErrores((prev) => ({ ...prev, imagen: 'La imagen no puede pasar de 2 MB.' }));
    }
    setArchivo(f);
  };

  const validar = () => {
    const nuevos = {};
    if (datos.nombre.trim().length < 2) nuevos.nombre = 'Escribe el nombre del producto.';
    if (!/^\d{1,5}(\.\d{1,2})?$/.test(datos.precio.trim()) || Number(datos.precio) <= 0) {
      nuevos.precio = 'Ingresa un precio válido (máx. 2 decimales).';
    }
    if (!editando && (datos.stock === '' || !Number.isInteger(Number(datos.stock)) || Number(datos.stock) < 0)) {
      nuevos.stock = 'Ingresa un stock válido (entero, 0 o más).';
    }
    return nuevos;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorGeneral('');
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    const fd = new FormData();
    fd.append('nombre', datos.nombre.trim());
    fd.append('marca', datos.marca.trim());
    fd.append('categoria', datos.categoria);
    fd.append('subcategoria', datos.subcategoria);
    fd.append('precio', datos.precio.trim());
    fd.append('descripcion', datos.descripcion.trim());
    fd.append('requiere_receta', String(datos.requiere_receta));
    if (!editando) fd.append('stock', datos.stock);
    if (archivo) fd.append('imagen', archivo);

    setEnviando(true);
    try {
      if (editando) await actualizarProducto(token, inicial.id, fd);
      else await crearProducto(token, fd);
      onGuardado();
    } catch (err) {
      if (err.errores) setErrores(err.errores);
      setErrorGeneral(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const aplicarAjuste = async () => {
    const n = Number(ajuste);
    if (ajuste === '' || !Number.isInteger(n) || n === 0) {
      return setErrores((prev) => ({ ...prev, ajuste: 'Ingresa un entero distinto de 0 (ej. 10 o -3).' }));
    }
    try {
      const actualizado = await ajustarStock(token, inicial.id, n);
      setStockActual(actualizado.stock);
      setAjuste('');
      setErrores((prev) => ({ ...prev, ajuste: undefined }));
      onRefrescar();
    } catch (err) {
      setErrores((prev) => ({ ...prev, ajuste: err.message }));
    }
  };

  const imagenMostrada = vista || urlImagen(inicial?.imagen);

  return (
    <motion.div
      className="prod-admin__overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancelar}
    >
      <motion.form
        className="prod-admin__modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        noValidate
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.25 }}
      >
        <header className="prod-admin__modal-cabecera">
          <h2>{editando ? 'Editar producto' : 'Agregar producto'}</h2>
          <button type="button" onClick={onCancelar} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        {errorGeneral && <p className="prod-admin__error-general">{errorGeneral}</p>}

        <div className="prod-admin__campo">
          <label htmlFor="p-nombre">Nombre</label>
          <input
            id="p-nombre"
            value={datos.nombre}
            onChange={cambiar('nombre')}
            placeholder="Paracetamol 500 mg x 20 tabletas"
          />
          {errores.nombre && <span className="prod-admin__error">{errores.nombre}</span>}
        </div>

        <div className="prod-admin__campo">
          <label htmlFor="p-marca">Marca / laboratorio</label>
          <input id="p-marca" value={datos.marca} onChange={cambiar('marca')} placeholder="Genfar, Bayer…" />
          {errores.marca && <span className="prod-admin__error">{errores.marca}</span>}
        </div>

        <div className="prod-admin__fila">
          <div className="prod-admin__campo">
            <label htmlFor="p-categoria">Categoría</label>
            <select id="p-categoria" value={datos.categoria} onChange={cambiarCategoria}>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            {errores.categoria && <span className="prod-admin__error">{errores.categoria}</span>}
          </div>

          <div className="prod-admin__campo">
            <label htmlFor="p-subcategoria">Subcategoría</label>
            <select id="p-subcategoria" value={datos.subcategoria} onChange={cambiar('subcategoria')}>
              <option value="">Sin subcategoría</option>
              {subcategorias.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errores.subcategoria && <span className="prod-admin__error">{errores.subcategoria}</span>}
          </div>
        </div>

        <div className="prod-admin__fila">
          <div className="prod-admin__campo">
            <label htmlFor="p-precio">Precio (S/)</label>
            <input
              id="p-precio"
              inputMode="decimal"
              value={datos.precio}
              onChange={cambiar('precio')}
              placeholder="0.00"
            />
            {errores.precio && <span className="prod-admin__error">{errores.precio}</span>}
          </div>

          {!editando ? (
            <div className="prod-admin__campo">
              <label htmlFor="p-stock">Stock inicial</label>
              <input
                id="p-stock"
                type="number"
                min="0"
                value={datos.stock}
                onChange={cambiar('stock')}
                placeholder="0"
              />
              {errores.stock && <span className="prod-admin__error">{errores.stock}</span>}
            </div>
          ) : (
            <div className="prod-admin__campo">
              <label htmlFor="p-ajuste">Stock actual: {stockActual}</label>
              <div className="prod-admin__ajuste">
                <input
                  id="p-ajuste"
                  type="number"
                  value={ajuste}
                  onChange={(e) => setAjuste(e.target.value)}
                  placeholder="+10 / -3"
                />
                <button type="button" className="btn btn--ghost" onClick={aplicarAjuste}>
                  Aplicar
                </button>
              </div>
              {errores.ajuste && <span className="prod-admin__error">{errores.ajuste}</span>}
            </div>
          )}
        </div>

        <label className="prod-admin__check">
          <input
            type="checkbox"
            checked={datos.requiere_receta}
            onChange={(e) => setDatos((d) => ({ ...d, requiere_receta: e.target.checked }))}
          />
          Requiere receta médica
        </label>

        <div className="prod-admin__campo">
          <label htmlFor="p-imagen">Imagen (JPG, PNG o WEBP, máx. 2 MB)</label>
          <input id="p-imagen" type="file" accept="image/jpeg,image/png,image/webp" onChange={elegirArchivo} />
          {imagenMostrada && <img className="prod-admin__preview" src={imagenMostrada} alt="Vista previa" />}
          {errores.imagen && <span className="prod-admin__error">{errores.imagen}</span>}
        </div>

        <div className="prod-admin__campo">
          <label htmlFor="p-descripcion">Descripción</label>
          <textarea
            id="p-descripcion"
            rows={3}
            value={datos.descripcion}
            onChange={cambiar('descripcion')}
            placeholder="Presentación, indicaciones, advertencias…"
          />
          {errores.descripcion && <span className="prod-admin__error">{errores.descripcion}</span>}
        </div>

        <footer className="prod-admin__modal-pie">
          <button type="button" className="btn btn--ghost" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={enviando}>
            {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Agregar producto'}
          </button>
        </footer>
      </motion.form>
    </motion.div>
  );
}

export default function ProductosAdmin() {
  const { token } = useAuth();

  const [categorias, setCategorias] = useState([]);
  const [lista, setLista] = useState({ items: [], total: 0, paginas: 1 });
  const [q, setQ] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('activos');
  const [agotados, setAgotados] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [formulario, setFormulario] = useState(null); // null | 'nuevo' | producto a editar
  const [porEliminar, setPorEliminar] = useState(null);
  const [errorEliminar, setErrorEliminar] = useState('');

  const refrescar = () => setRecarga((n) => n + 1);

  useEffect(() => {
    obtenerCategorias()
      .then(setCategorias)
      .catch((e) => setError(e.message));
  }, []);

  // Debounce: espera 300 ms después de la última tecla antes de consultar
  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(q.trim());
      setPagina(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let vigente = true; // evita que una respuesta lenta pise a una más nueva
    setCargando(true);
    listarProductos(token, { q: busqueda, estado, agotados, pagina })
      .then((r) => {
        if (!vigente) return;
        setLista(r);
        setError('');
      })
      .catch((e) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [token, busqueda, estado, agotados, pagina, recarga]);

  const nombreCategoria = (id) => categorias.find((c) => c.id === id)?.nombre ?? id;

  const guardado = () => {
    setFormulario(null);
    refrescar();
  };

  const confirmarEliminar = async () => {
    setErrorEliminar('');
    try {
      await eliminarProducto(token, porEliminar.id);
      setPorEliminar(null);
      refrescar();
    } catch (err) {
      setErrorEliminar(err.message); // ej.: "hay clientes con este producto en pedidos pendientes"
    }
  };

  const reactivar = async (p) => {
    try {
      await reactivarProducto(token, p.id);
      refrescar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="prod-admin">
      <div className="prod-admin__cabecera">
        <div>
          <h1>Gestión de productos</h1>
          <p>{lista.total} {lista.total === 1 ? 'producto' : 'productos'}</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          disabled={categorias.length === 0}
          onClick={() => setFormulario('nuevo')}
        >
          <Plus size={18} />
          Agregar producto
        </button>
      </div>

      <div className="prod-admin__filtros">
        <div className="prod-admin__buscador">
          <Search size={18} />
          <input
            type="search"
            placeholder="Buscar por nombre o marca"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <select
          value={estado}
          onChange={(e) => { setEstado(e.target.value); setPagina(1); }}
          aria-label="Filtrar por estado"
        >
          <option value="activos">Activos</option>
          <option value="inactivos">Eliminados</option>
          <option value="todos">Todos</option>
        </select>

        <label className="prod-admin__check">
          <input
            type="checkbox"
            checked={agotados}
            onChange={(e) => { setAgotados(e.target.checked); setPagina(1); }}
          />
          Solo agotados
        </label>
      </div>

      {error && <p className="prod-admin__error-general">{error}</p>}

      <div className="prod-admin__tabla-wrap">
        <table className="prod-admin__tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lista.items.map((p) => (
              <tr key={p.id} className={p.activo ? '' : 'prod-admin__fila--inactiva'}>
                <td>
                  <div className="prod-admin__nombre-celda">
                    <span className="prod-admin__miniatura">
                      {p.imagen ? <img src={urlImagen(p.imagen)} alt="" loading="lazy" /> : <Pill size={18} />}
                    </span>
                    <span>
                      {p.nombre}
                      {p.marca && <small className="prod-admin__marca"> · {p.marca}</small>}
                      {p.requiere_receta && <span className="prod-admin__badge">Receta</span>}
                      {!p.activo && <span className="prod-admin__badge prod-admin__badge--off">Eliminado</span>}
                    </span>
                  </div>
                </td>
                <td>
                  {nombreCategoria(p.categoria)}
                  {p.subcategoria && <small className="prod-admin__marca"> · {p.subcategoria}</small>}
                </td>
                <td>S/ {Number(p.precio).toFixed(2)}</td>
                <td>
                  <span className={`prod-admin__stock${p.stock <= 5 ? ' prod-admin__stock--bajo' : ''}`}>
                    {p.stock === 0 ? 'Agotado' : p.stock}
                  </span>
                </td>
                <td className="prod-admin__acciones">
                  {p.activo ? (
                    <>
                      <button type="button" onClick={() => setFormulario(p)} aria-label={`Editar ${p.nombre}`}>
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="prod-admin__eliminar"
                        onClick={() => { setErrorEliminar(''); setPorEliminar(p); }}
                        aria-label={`Eliminar ${p.nombre}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => reactivar(p)} aria-label={`Reactivar ${p.nombre}`}>
                      <RotateCcw size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!cargando && lista.items.length === 0 && (
              <tr>
                <td colSpan={5} className="prod-admin__vacio">
                  No se encontraron productos con esos filtros.
                </td>
              </tr>
            )}
            {cargando && (
              <tr>
                <td colSpan={5} className="prod-admin__vacio">Cargando…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {lista.paginas > 1 && (
        <div className="prod-admin__paginacion">
          <button type="button" className="btn btn--ghost" disabled={pagina <= 1} onClick={() => setPagina((n) => n - 1)}>
            Anterior
          </button>
          <span>Página {pagina} de {lista.paginas}</span>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={pagina >= lista.paginas}
            onClick={() => setPagina((n) => n + 1)}
          >
            Siguiente
          </button>
        </div>
      )}

      <AnimatePresence>
        {formulario && (
          <FormularioProducto
            inicial={formulario === 'nuevo' ? null : formulario}
            categorias={categorias}
            token={token}
            onGuardado={guardado}
            onRefrescar={refrescar}
            onCancelar={() => setFormulario(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {porEliminar && (
          <motion.div
            className="prod-admin__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPorEliminar(null)}
          >
            <motion.div
              className="prod-admin__confirmar"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h3>¿Eliminar producto?</h3>
              <p>
                Vas a eliminar <strong>{porEliminar.nombre}</strong> del catálogo. Podrás reactivarlo después desde
                el filtro «Eliminados».
              </p>
              {errorEliminar && <p className="prod-admin__error-general">{errorEliminar}</p>}
              <div className="prod-admin__modal-pie">
                <button type="button" className="btn btn--ghost" onClick={() => setPorEliminar(null)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn--primary" onClick={confirmarEliminar}>
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}