// src/components/Admin/Ventas/Ventas.jsx
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Coins, Plus, Receipt, Search, Trash2, TrendingUp, X,
} from 'lucide-react';
import {
  METODOS_PAGO,
  eliminarVenta,
  obtenerVentas,
  registrarVenta,
  resumenVentas,
} from '../../../models/helpers/ventas.js';
import './Ventas.css';

const ITEM_VACIO = { nombre: '', cantidad: 1, precioUnitario: '' };

function ModalNuevaVenta({ onGuardar, onCancelar }) {
  const [cliente, setCliente] = useState('');
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0].valor);
  const [items, setItems] = useState([{ ...ITEM_VACIO }]);
  const [error, setError] = useState('');

  const total = items.reduce((s, it) => s + (Number(it.cantidad) || 0) * (Number(it.precioUnitario) || 0), 0);

  const actualizarItem = (indice, campo, valor) => {
    setItems((prev) => prev.map((it, i) => (i === indice ? { ...it, [campo]: valor } : it)));
  };

  const agregarItem = () => setItems((prev) => [...prev, { ...ITEM_VACIO }]);
  const quitarItem = (indice) => setItems((prev) => prev.filter((_, i) => i !== indice));

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const itemsLimpios = items
        .filter((it) => it.nombre.trim() && Number(it.cantidad) > 0 && Number(it.precioUnitario) >= 0)
        .map((it) => ({ nombre: it.nombre.trim(), cantidad: Number(it.cantidad), precioUnitario: Number(it.precioUnitario) }));

      if (itemsLimpios.length === 0) {
        setError('Agrega al menos un producto con cantidad y precio válidos.');
        return;
      }
      registrarVenta({ cliente, items: itemsLimpios, metodoPago });
      onGuardar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <motion.div
      className="ventas-admin__overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancelar}
    >
      <motion.form
        className="ventas-admin__modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.25 }}
      >
        <header className="ventas-admin__modal-cabecera">
          <h2>Nueva venta</h2>
          <button type="button" onClick={onCancelar} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        <div className="ventas-admin__campo">
          <label htmlFor="v-cliente">Cliente (opcional)</label>
          <input id="v-cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Cliente mostrador" />
        </div>

        <div className="ventas-admin__items-venta">
          {items.map((it, i) => (
            <div className="ventas-admin__fila-item" key={i}>
              <input
                placeholder="Producto"
                value={it.nombre}
                onChange={(e) => actualizarItem(i, 'nombre', e.target.value)}
              />
              <input
                type="number"
                min="1"
                placeholder="Cant."
                value={it.cantidad}
                onChange={(e) => actualizarItem(i, 'cantidad', e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Precio"
                value={it.precioUnitario}
                onChange={(e) => actualizarItem(i, 'precioUnitario', e.target.value)}
              />
              <button type="button" onClick={() => quitarItem(i)} aria-label="Quitar producto" disabled={items.length === 1}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button type="button" className="ventas-admin__btn-agregar" onClick={agregarItem}>
            <Plus size={14} /> Agregar producto
          </button>
        </div>

        <div className="ventas-admin__campo">
          <label htmlFor="v-metodo">Método de pago</label>
          <select id="v-metodo" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
            {METODOS_PAGO.map((m) => (
              <option key={m.valor} value={m.valor}>{m.etiqueta}</option>
            ))}
          </select>
        </div>

        <div className="ventas-admin__total-preview">
          <span>Total</span>
          <strong>S/ {total.toFixed(2)}</strong>
        </div>

        {error && <span className="ventas-admin__error">{error}</span>}

        <footer className="ventas-admin__modal-pie">
          <button type="button" className="btn btn--ghost" onClick={onCancelar}>Cancelar</button>
          <button type="submit" className="btn btn--primary">Registrar venta</button>
        </footer>
      </motion.form>
    </motion.div>
  );
}

export default function Ventas() {
  const [ventas, setVentas] = useState(() => obtenerVentas());
  const [busqueda, setBusqueda] = useState('');
  const [creando, setCreando] = useState(false);

  const resumen = useMemo(() => resumenVentas(), [ventas]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return ventas;
    return ventas.filter((v) => v.cliente.toLowerCase().includes(q)
      || v.items.some((it) => it.nombre.toLowerCase().includes(q)));
  }, [ventas, busqueda]);

  const refrescar = () => {
    setVentas(obtenerVentas());
    setCreando(false);
  };

  const handleEliminar = (venta) => {
    if (window.confirm(`¿Anular la venta de ${venta.cliente} por S/ ${venta.total.toFixed(2)}?`)) {
      eliminarVenta(venta.id);
      setVentas(obtenerVentas());
    }
  };

  return (
    <div className="ventas-admin">
      <div className="ventas-admin__cabecera">
        <div>
          <h1>Gestión de ventas</h1>
          <p>Registra ventas en el mostrador y revisa el historial diario.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setCreando(true)}>
          <Plus size={16} /> Nueva venta
        </button>
      </div>

      <div className="ventas-admin__tarjetas">
        <div className="ventas-admin__tarjeta">
          <span className="ventas-admin__tarjeta-num">{resumen.totalVentas}</span>
          <span className="ventas-admin__tarjeta-label">Ventas totales</span>
        </div>
        <div className="ventas-admin__tarjeta ventas-admin__tarjeta--exito">
          <span className="ventas-admin__tarjeta-num">S/ {resumen.ingresosHoy.toFixed(2)}</span>
          <span className="ventas-admin__tarjeta-label">Ingresos hoy</span>
        </div>
        <div className="ventas-admin__tarjeta">
          <span className="ventas-admin__tarjeta-num">S/ {resumen.ingresosMes.toFixed(2)}</span>
          <span className="ventas-admin__tarjeta-label">Ingresos del mes</span>
        </div>
        <div className="ventas-admin__tarjeta">
          <span className="ventas-admin__tarjeta-num">S/ {resumen.ticketPromedio.toFixed(2)}</span>
          <span className="ventas-admin__tarjeta-label">Ticket promedio</span>
        </div>
      </div>

      <div className="ventas-admin__buscador">
        <Search size={18} />
        <input
          type="search"
          placeholder="Buscar por cliente o producto"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="ventas-admin__tabla-wrap">
        <table className="ventas-admin__tabla">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Productos</th>
              <th>Pago</th>
              <th>Fecha</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((v) => (
              <tr key={v.id}>
                <td>
                  <div className="ventas-admin__nombre-celda">
                    <span className="ventas-admin__miniatura"><Receipt size={16} /></span>
                    {v.cliente}
                  </div>
                </td>
                <td>{v.items.map((it) => `${it.nombre} x${it.cantidad}`).join(', ')}</td>
                <td>{METODOS_PAGO.find((m) => m.valor === v.metodoPago)?.etiqueta}</td>
                <td>{new Date(v.fecha).toLocaleString('es-PE')}</td>
                <td><strong>S/ {v.total.toFixed(2)}</strong></td>
                <td className="ventas-admin__acciones">
                  <button type="button" onClick={() => handleEliminar(v)} aria-label={`Anular venta de ${v.cliente}`}>
                    <X size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={6} className="ventas-admin__vacio">
                  {ventas.length === 0
                    ? 'Todavía no hay ventas registradas.'
                    : 'No se encontraron ventas con esa búsqueda.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {creando && (
          <ModalNuevaVenta onGuardar={refrescar} onCancelar={() => setCreando(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}