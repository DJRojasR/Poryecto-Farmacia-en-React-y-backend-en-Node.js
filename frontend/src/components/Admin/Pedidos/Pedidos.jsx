// src/components/Admin/Pedidos/Pedidos.jsx
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Clock, MapPin, Package, Search, ShoppingBag, User, X,
} from 'lucide-react';
import {
  ESTADOS_PEDIDO,
  actualizarEstadoPedido,
  obtenerPedidos,
  resumenPedidos,
} from '../../../models/helpers/pedidos.js';
import './Pedidos.css';

function estadoInfo(valor) {
  return ESTADOS_PEDIDO.find((e) => e.valor === valor) || ESTADOS_PEDIDO[0];
}

function ModalDetallePedido({ pedido, onCerrar, onCambiarEstado }) {
  return (
    <motion.div
      className="ped-admin__overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCerrar}
    >
      <motion.div
        className="ped-admin__modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
      >
        <header className="ped-admin__modal-cabecera">
          <h2>Pedido #{pedido.id.slice(-6)}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        <div className="ped-admin__detalle-cliente">
          <p><User size={14} /> {pedido.cliente}</p>
          {pedido.correo && <p className="ped-admin__detalle-sub">{pedido.correo}</p>}
          <p><MapPin size={14} /> {pedido.direccion}{pedido.distrito ? `, ${pedido.distrito}` : ''}</p>
          <p><Clock size={14} /> {new Date(pedido.fecha).toLocaleString('es-PE')}</p>
        </div>

        <ul className="ped-admin__items">
          {pedido.items.map((it, i) => (
            <li key={i}>
              <span>{it.nombre}</span>
              <span>x{it.cantidad}</span>
            </li>
          ))}
        </ul>

        <div className="ped-admin__totales">
          <span>Método de pago: {pedido.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Efectivo'}</span>
          <strong>Total: S/ {pedido.total.toFixed(2)}</strong>
        </div>

        <div className="ped-admin__campo">
          <label htmlFor="ped-estado">Estado del pedido</label>
          <select
            id="ped-estado"
            value={pedido.estado}
            onChange={(e) => onCambiarEstado(pedido.id, e.target.value)}
          >
            {ESTADOS_PEDIDO.map((e) => (
              <option key={e.valor} value={e.valor}>{e.etiqueta}</option>
            ))}
          </select>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState(() => obtenerPedidos());
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [seleccionado, setSeleccionado] = useState(null);

  const resumen = useMemo(() => resumenPedidos(), [pedidos]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return pedidos.filter((p) => {
      const coincideTexto = !q || `${p.cliente} ${p.distrito}`.toLowerCase().includes(q);
      const coincideEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
      return coincideTexto && coincideEstado;
    });
  }, [pedidos, busqueda, filtroEstado]);

  const cambiarEstado = (id, nuevoEstado) => {
    const actualizado = actualizarEstadoPedido(id, nuevoEstado);
    setPedidos(obtenerPedidos());
    setSeleccionado(actualizado);
  };

  return (
    <div className="ped-admin">
      <div className="ped-admin__cabecera">
        <div>
          <h1>Gestión de pedidos</h1>
          <p>Sigue el estado de cada pedido, desde recibido hasta entregado.</p>
        </div>
      </div>

      <div className="ped-admin__tarjetas">
        <div className="ped-admin__tarjeta">
          <span className="ped-admin__tarjeta-num">{resumen.total}</span>
          <span className="ped-admin__tarjeta-label">Pedidos totales</span>
        </div>
        <div className="ped-admin__tarjeta ped-admin__tarjeta--alerta">
          <span className="ped-admin__tarjeta-num">{resumen.pendientes}</span>
          <span className="ped-admin__tarjeta-label">Pendientes</span>
        </div>
        <div className="ped-admin__tarjeta">
          <span className="ped-admin__tarjeta-num">{resumen.enProceso}</span>
          <span className="ped-admin__tarjeta-label">En proceso</span>
        </div>
        <div className="ped-admin__tarjeta ped-admin__tarjeta--exito">
          <span className="ped-admin__tarjeta-num">{resumen.entregadosHoy}</span>
          <span className="ped-admin__tarjeta-label">Entregados hoy</span>
        </div>
      </div>

      <div className="ped-admin__filtros">
        <div className="ped-admin__buscador">
          <Search size={18} />
          <input
            type="search"
            placeholder="Buscar por cliente o distrito"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="ped-admin__chips">
          <button
            type="button"
            className={`ped-admin__chip${filtroEstado === 'todos' ? ' ped-admin__chip--activo' : ''}`}
            onClick={() => setFiltroEstado('todos')}
          >
            Todos
          </button>
          {ESTADOS_PEDIDO.map((e) => (
            <button
              key={e.valor}
              type="button"
              className={`ped-admin__chip${filtroEstado === e.valor ? ' ped-admin__chip--activo' : ''}`}
              onClick={() => setFiltroEstado(e.valor)}
            >
              {e.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="ped-admin__lista">
        {filtrados.map((p) => {
          const info = estadoInfo(p.estado);
          return (
            <button
              type="button"
              key={p.id}
              className="ped-admin__tarjeta-pedido"
              onClick={() => setSeleccionado(p)}
            >
              <span className="ped-admin__icono-pedido"><Package size={18} /></span>
              <div className="ped-admin__pedido-info">
                <strong>{p.cliente}</strong>
                <small>{p.distrito || 'Sin distrito'} · {new Date(p.fecha).toLocaleString('es-PE')}</small>
              </div>
              <span className="ped-admin__pedido-items">
                <ShoppingBag size={14} /> {p.items.reduce((s, it) => s + it.cantidad, 0)}
              </span>
              <strong className="ped-admin__pedido-total">S/ {p.total.toFixed(2)}</strong>
              <span className="ped-admin__estado" style={{ color: info.color, background: `${info.color}1a` }}>
                {info.etiqueta}
              </span>
            </button>
          );
        })}
        {filtrados.length === 0 && (
          <p className="ped-admin__vacio">No se encontraron pedidos con esos filtros.</p>
        )}
      </div>

      <AnimatePresence>
        {seleccionado && (
          <ModalDetallePedido
            pedido={seleccionado}
            onCerrar={() => setSeleccionado(null)}
            onCambiarEstado={cambiarEstado}
          />
        )}
      </AnimatePresence>
    </div>
  );
}