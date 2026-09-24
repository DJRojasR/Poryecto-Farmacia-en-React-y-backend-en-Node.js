// src/components/Admin/Productos/Productos.jsx
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, Pill, Plus, Search, Trash2, X } from 'lucide-react';
import {
  CATEGORIAS,
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  obtenerProductos,
} from '../../../models/helpers/productos.js';
import './Productos.css';

const VACIO = {
  nombre: '',
  categoria: CATEGORIAS[0],
  precio: '',
  stock: '',
  imagen: '',
  descripcion: '',
};

function FormularioProducto({ inicial, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState(inicial ?? VACIO);
  const [errores, setErrores] = useState({});

  const cambiar = (campo) => (e) => setDatos((d) => ({ ...d, [campo]: e.target.value }));

  const validar = () => {
    const nuevos = {};
    if (!datos.nombre.trim()) nuevos.nombre = 'Escribe el nombre del producto.';
    if (!datos.categoria) nuevos.categoria = 'Elige una categoría.';
    if (!datos.precio || Number(datos.precio) <= 0) nuevos.precio = 'Ingresa un precio válido.';
    if (datos.stock === '' || Number(datos.stock) < 0) nuevos.stock = 'Ingresa un stock válido.';
    return nuevos;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    onGuardar({
      ...datos,
      precio: Number(datos.precio),
      stock: Number(datos.stock),
    });
  };

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
          <h2>{inicial ? 'Editar producto' : 'Agregar producto'}</h2>
          <button type="button" onClick={onCancelar} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

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

        <div className="prod-admin__fila">
          <div className="prod-admin__campo">
            <label htmlFor="p-categoria">Categoría</label>
            <select id="p-categoria" value={datos.categoria} onChange={cambiar('categoria')}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errores.categoria && <span className="prod-admin__error">{errores.categoria}</span>}
          </div>

          <div className="prod-admin__campo">
            <label htmlFor="p-precio">Precio (S/)</label>
            <input
              id="p-precio"
              type="number"
              min="0"
              step="0.10"
              value={datos.precio}
              onChange={cambiar('precio')}
              placeholder="0.00"
            />
            {errores.precio && <span className="prod-admin__error">{errores.precio}</span>}
          </div>

          <div className="prod-admin__campo">
            <label htmlFor="p-stock">Stock</label>
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
        </div>

        <div className="prod-admin__campo">
          <label htmlFor="p-imagen">Imagen (URL)</label>
          <input
            id="p-imagen"
            value={datos.imagen}
            onChange={cambiar('imagen')}
            placeholder="https://…"
          />
        </div>

        <div className="prod-admin__campo">
          <label htmlFor="p-descripcion">Descripción</label>
          <textarea
            id="p-descripcion"
            rows={3}
            value={datos.descripcion}
            onChange={cambiar('descripcion')}
            placeholder="Detalles del producto, presentación, indicaciones…"
          />
        </div>

        <footer className="prod-admin__modal-pie">
          <button type="button" className="btn btn--ghost" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary">
            {inicial ? 'Guardar cambios' : 'Agregar producto'}
          </button>
        </footer>
      </motion.form>
    </motion.div>
  );
}

export default function ProductosAdmin() {
  const [productos, setProductos] = useState(() => obtenerProductos());
  const [busqueda, setBusqueda] = useState('');
  const [formulario, setFormulario] = useState(null); // null | 'nuevo' | producto a editar
  const [porEliminar, setPorEliminar] = useState(null);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) =>
      `${p.nombre} ${p.categoria}`.toLowerCase().includes(q)
    );
  }, [productos, busqueda]);

  const guardar = (datos) => {
    if (formulario === 'nuevo') {
      crearProducto(datos);
    } else {
      actualizarProducto(formulario.id, datos);
    }
    setProductos(obtenerProductos());
    setFormulario(null);
  };

  const confirmarEliminar = () => {
    eliminarProducto(porEliminar.id);
    setProductos(obtenerProductos());
    setPorEliminar(null);
  };

  return (
    <div className="prod-admin">
      <div className="prod-admin__cabecera">
        <div>
          <h1>Gestión de productos</h1>
          <p>{productos.length} {productos.length === 1 ? 'producto registrado' : 'productos registrados'}</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setFormulario('nuevo')}>
          <Plus size={18} />
          Agregar producto
        </button>
      </div>

      <div className="prod-admin__buscador">
        <Search size={18} />
        <input
          type="search"
          placeholder="Buscar por nombre o categoría"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

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
            {filtrados.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="prod-admin__nombre-celda">
                    <span className="prod-admin__miniatura">
                      {p.imagen ? <img src={p.imagen} alt="" /> : <Pill size={18} />}
                    </span>
                    {p.nombre}
                  </div>
                </td>
                <td>{p.categoria}</td>
                <td>S/ {Number(p.precio).toFixed(2)}</td>
                <td>
                  <span className={`prod-admin__stock${p.stock <= 5 ? ' prod-admin__stock--bajo' : ''}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="prod-admin__acciones">
                  <button type="button" onClick={() => setFormulario(p)} aria-label={`Editar ${p.nombre}`}>
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="prod-admin__eliminar"
                    onClick={() => setPorEliminar(p)}
                    aria-label={`Eliminar ${p.nombre}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="prod-admin__vacio">
                  {productos.length === 0
                    ? 'Todavía no hay productos. Agrega el primero.'
                    : 'No se encontraron productos con esa búsqueda.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {formulario && (
          <FormularioProducto
            inicial={formulario === 'nuevo' ? null : formulario}
            onGuardar={guardar}
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
                Vas a eliminar <strong>{porEliminar.nombre}</strong>. Esta acción no se puede deshacer.
              </p>
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