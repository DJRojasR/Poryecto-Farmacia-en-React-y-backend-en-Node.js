// src/components/Admin/Inventario/Inventario.jsx
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle, ArrowDownCircle, ArrowUpCircle, History, Pill, Search, X,
} from 'lucide-react';
import { obtenerProductos } from '../../../models/helpers/productos.js';
import {
  MOTIVOS,
  obtenerMovimientos,
  registrarMovimiento,
  resumenInventario,
} from '../../../models/helpers/inventario.js';
import './Inventario.css';

function ModalAjuste({ producto, onGuardar, onCancelar }) {
  const [tipo, setTipo] = useState('entrada');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState(MOTIVOS[0].valor);
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const cant = Number(cantidad);
    if (!cant || cant <= 0) {
      setError('Ingresa una cantidad válida.');
      return;
    }
    if (tipo === 'salida' && cant > producto.stock) {
      setError('No hay suficiente stock para esa salida.');
      return;
    }
    try {
      registrarMovimiento({ productoId: producto.id, tipo, cantidad: cant, motivo, nota });
      onGuardar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <motion.div
      className="inv-admin__overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancelar}
    >
      <motion.form
        className="inv-admin__modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.25 }}
      >
        <header className="inv-admin__modal-cabecera">
          <h2>Ajustar stock — {producto.nombre}</h2>
          <button type="button" onClick={onCancelar} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        <p className="inv-admin__stock-actual">Stock actual: <strong>{producto.stock}</strong></p>

        <div className="inv-admin__tipo-toggle">
          <button
            type="button"
            className={`inv-admin__tipo${tipo === 'entrada' ? ' inv-admin__tipo--activo' : ''}`}
            onClick={() => setTipo('entrada')}
          >
            <ArrowUpCircle size={16} /> Entrada
          </button>
          <button
            type="button"
            className={`inv-admin__tipo${tipo === 'salida' ? ' inv-admin__tipo--activo' : ''}`}
            onClick={() => setTipo('salida')}
          >
            <ArrowDownCircle size={16} /> Salida
          </button>
        </div>

        <div className="inv-admin__campo">
          <label htmlFor="i-cantidad">Cantidad</label>
          <input
            id="i-cantidad"
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="inv-admin__campo">
          <label htmlFor="i-motivo">Motivo</label>
          <select id="i-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            {MOTIVOS.map((m) => (
              <option key={m.valor} value={m.valor}>{m.etiqueta}</option>
            ))}
          </select>
        </div>

        <div className="inv-admin__campo">
          <label htmlFor="i-nota">Nota (opcional)</label>
          <input
            id="i-nota"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="N° de guía, referencia, etc."
          />
        </div>

        {error && <span className="inv-admin__error">{error}</span>}

        <footer className="inv-admin__modal-pie">
          <button type="button" className="btn btn--ghost" onClick={onCancelar}>Cancelar</button>
          <button type="submit" className="btn btn--primary">Registrar movimiento</button>
        </footer>
      </motion.form>
    </motion.div>
  );
}

function ModalHistorial({ producto, onCerrar }) {
  const movimientos = obtenerMovimientos(producto.id);
  return (
    <motion.div
      className="inv-admin__overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCerrar}
    >
      <motion.div
        className="inv-admin__modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
      >
        <header className="inv-admin__modal-cabecera">
          <h2>Historial — {producto.nombre}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        {movimientos.length === 0 ? (
          <p className="inv-admin__vacio-historial">Todavía no hay movimientos registrados.</p>
        ) : (
          <ul className="inv-admin__lista-mov">
            {movimientos.map((m) => (
              <li key={m.id} className={`inv-admin__mov inv-admin__mov--${m.tipo}`}>
                <span className="inv-admin__mov-icono">
                  {m.tipo === 'entrada' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                </span>
                <div>
                  <p>
                    {m.tipo === 'entrada' ? '+' : '−'}{m.cantidad} unidades — {MOTIVOS.find((x) => x.valor === m.motivo)?.etiqueta}
                  </p>
                  <small>{new Date(m.fecha).toLocaleString('es-PE')} · Stock resultante: {m.stockResultante}</small>
                  {m.nota && <small className="inv-admin__mov-nota">{m.nota}</small>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function Inventario() {
  const [productos, setProductos] = useState(() => obtenerProductos());
  const [busqueda, setBusqueda] = useState('');
  const [ajustando, setAjustando] = useState(null);
  const [verHistorial, setVerHistorial] = useState(null);

  const resumen = useMemo(() => resumenInventario(), [productos]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) => `${p.nombre} ${p.categoria}`.toLowerCase().includes(q));
  }, [productos, busqueda]);

  const refrescar = () => {
    setProductos(obtenerProductos());
    setAjustando(null);
  };

  return (
    <div className="inv-admin">
      <div className="inv-admin__cabecera">
        <div>
          <h1>Gestión de inventario</h1>
          <p>Controla el stock, registra movimientos y revisa el historial por producto.</p>
        </div>
      </div>

      <div className="inv-admin__tarjetas">
        <div className="inv-admin__tarjeta">
          <span className="inv-admin__tarjeta-num">{resumen.totalProductos}</span>
          <span className="inv-admin__tarjeta-label">Productos</span>
        </div>
        <div className="inv-admin__tarjeta">
          <span className="inv-admin__tarjeta-num">{resumen.unidadesTotales}</span>
          <span className="inv-admin__tarjeta-label">Unidades totales</span>
        </div>
        <div className="inv-admin__tarjeta inv-admin__tarjeta--alerta">
          <span className="inv-admin__tarjeta-num">{resumen.stockBajo}</span>
          <span className="inv-admin__tarjeta-label">Stock bajo</span>
        </div>
        <div className="inv-admin__tarjeta inv-admin__tarjeta--critico">
          <span className="inv-admin__tarjeta-num">{resumen.sinStock}</span>
          <span className="inv-admin__tarjeta-label">Sin stock</span>
        </div>
      </div>

      <div className="inv-admin__buscador">
        <Search size={18} />
        <input
          type="search"
          placeholder="Buscar por nombre o categoría"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="inv-admin__tabla-wrap">
        <table className="inv-admin__tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="inv-admin__nombre-celda">
                    <span className="inv-admin__miniatura">
                      {p.imagen ? <img src={p.imagen} alt="" /> : <Pill size={18} />}
                    </span>
                    {p.nombre}
                  </div>
                </td>
                <td>{p.categoria}</td>
                <td>
                  <span className={`inv-admin__stock${p.stock === 0 ? ' inv-admin__stock--critico' : p.stock <= 5 ? ' inv-admin__stock--bajo' : ''}`}>
                    {p.stock === 0 && <AlertTriangle size={13} />}
                    {p.stock}
                  </span>
                </td>
                <td className="inv-admin__acciones">
                  <button type="button" onClick={() => setAjustando(p)} className="btn btn--ghost btn--pequeno">
                    Ajustar stock
                  </button>
                  <button type="button" onClick={() => setVerHistorial(p)} aria-label={`Historial de ${p.nombre}`}>
                    <History size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={4} className="inv-admin__vacio">
                  {productos.length === 0
                    ? 'Todavía no hay productos registrados.'
                    : 'No se encontraron productos con esa búsqueda.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {ajustando && (
          <ModalAjuste producto={ajustando} onGuardar={refrescar} onCancelar={() => setAjustando(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {verHistorial && (
          <ModalHistorial producto={verHistorial} onCerrar={() => setVerHistorial(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}