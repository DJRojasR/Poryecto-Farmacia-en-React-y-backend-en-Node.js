// src/components/Admin/Pedidos/Pedidos.jsx
// Pedidos web: el admin los confirma, despacha, entrega o cancela (cancelar devuelve el stock).
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bike, ChevronDown, CreditCard, MapPin, Phone, Search, Store } from 'lucide-react';
import { useAuth } from '../../../models/context/AuthContext.jsx';
import {
  ESTADOS_PEDIDO, SIGUIENTES, cambiarEstadoPedido, codigoPedido, estadoInfo,
  listarPedidosAdmin, pagoInfo, resumenPedidosAdmin,
} from '../../../models/helpers/pedidos_api.js';
import './Pedidos.css';

const soles = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

// Texto del botón para pasar a cada estado
const ACCION = {
  confirmado: 'Confirmar',
  en_camino: 'Enviar (en camino)',
  entregado: 'Marcar entregado',
  cancelado: 'Cancelar',
};

function TarjetaPedido({ pedido, token, onCambio }) {
  const [abierto, setAbierto] = useState(pedido.estado === 'pendiente');
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const info = estadoInfo(pedido.estado);

  const pago = pagoInfo(pedido);
  const pagadoOk = pedido.pago_estado === 'pagado';

  const siguientes = SIGUIENTES[pedido.estado].filter(
    (e) =>
      // "En camino" solo tiene sentido para delivery
      !(e === 'en_camino' && pedido.entrega !== 'delivery')
      // Sin pago solo se puede cancelar (el servidor también lo impide)
      && (pagadoOk || e === 'cancelado')
  );

  const pasarA = async (estado) => {
    setEnviando(true);
    setError('');
    try {
      await cambiarEstadoPedido(token, pedido.id, estado);
      setConfirmarCancelar(false);
      onCambio();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <li className={`ped-admin__pedido ped-admin__pedido--${pedido.estado}`}>
      <button
        type="button"
        className="ped-admin__resumen"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
      >
        <span className="ped-admin__codigo">
          <strong>{codigoPedido(pedido.id)}</strong>
          <small>{new Date(pedido.creado_en).toLocaleString('es-PE')}</small>
        </span>
        <span className="ped-admin__cliente">{pedido.cliente_nombre}</span>
        <span className="ped-admin__entrega-icono" title={pedido.entrega === 'delivery' ? 'Delivery' : 'Recojo en tienda'}>
          {pedido.entrega === 'delivery' ? <Bike size={16} /> : <Store size={16} />}
        </span>
        <span className="ped-admin__total">{soles(pedido.total)}</span>
        <span className="ped-admin__badge" style={{ color: info.color, background: `${info.color}1a` }}>
          {info.etiqueta}
        </span>
        <ChevronDown size={18} className={`ped-admin__flecha${abierto ? ' ped-admin__flecha--abierta' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
            className="ped-admin__detalle"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="ped-admin__datos">
              {pedido.entrega === 'delivery' ? (
                <>
                  <span><MapPin size={14} /> {pedido.direccion}</span>
                  <span><Phone size={14} /> {pedido.telefono}</span>
                </>
              ) : (
                <span><Store size={14} /> Recojo en tienda</span>
              )}
              <span style={{ color: pago.color, fontWeight: 600 }}>
                <CreditCard size={14} /> {pago.etiqueta}
              </span>
              {pedido.nota && <span className="ped-admin__nota">“{pedido.nota}”</span>}
            </div>

            <ul className="ped-admin__items">
              {pedido.items.map((it) => (
                <li key={it.producto_id}>
                  <span>{it.nombre} <em>x{it.cantidad}</em></span>
                  <span>{soles(it.subtotal)}</span>
                </li>
              ))}
            </ul>

            {error && <p className="ped-admin__error">{error}</p>}

            {siguientes.length > 0 && (
              <div className="ped-admin__acciones">
                {confirmarCancelar ? (
                  <>
                    <span>
                      ¿Cancelar el pedido? Las unidades vuelven al stock
                      {pagadoOk ? ' y se devuelve el pago a la tarjeta.' : '.'}
                    </span>
                    <button type="button" className="btn btn--ghost" onClick={() => setConfirmarCancelar(false)} disabled={enviando}>
                      No
                    </button>
                    <button type="button" className="btn btn--peligro" onClick={() => pasarA('cancelado')} disabled={enviando}>
                      Sí, cancelar
                    </button>
                  </>
                ) : (
                  siguientes.map((e) => (
                    <button
                      key={e}
                      type="button"
                      className={`btn ${e === 'cancelado' ? 'btn--ghost' : 'btn--primary'} btn--pequeno`}
                      onClick={() => (e === 'cancelado' ? setConfirmarCancelar(true) : pasarA(e))}
                      disabled={enviando}
                    >
                      {ACCION[e]}
                    </button>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function Pedidos() {
  const { token } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [lista, setLista] = useState({ items: [], total: 0, paginas: 1 });
  const [estado, setEstado] = useState('pendiente');
  const [q, setQ] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setBusqueda(q.trim()); setPagina(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    resumenPedidosAdmin(token).then(setResumen).catch((e) => setError(e.message));
  }, [token, recarga]);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    listarPedidosAdmin(token, { q: busqueda, estado, pagina })
      .then((r) => { if (vigente) { setLista(r); setError(''); } })
      .catch((e) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [token, busqueda, estado, pagina, recarga]);

  const elegirEstado = (e) => {
    setEstado((actual) => (actual === e ? '' : e));
    setPagina(1);
  };

  return (
    <div className="ped-admin">
      <div className="ped-admin__cabecera">
        <div>
          <h1>Pedidos web</h1>
          <p>Confirma, despacha y entrega los pedidos de la tienda online.</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={() => setRecarga((n) => n + 1)}>
          Actualizar
        </button>
      </div>

      <div className="ped-admin__tarjetas">
        {ESTADOS_PEDIDO.map((e) => (
          <button
            key={e.valor}
            type="button"
            className={`ped-admin__tarjeta${estado === e.valor ? ' ped-admin__tarjeta--activa' : ''}`}
            style={{ '--color-estado': e.color }}
            onClick={() => elegirEstado(e.valor)}
            aria-pressed={estado === e.valor}
          >
            <span className="ped-admin__tarjeta-num">{resumen?.[e.valor] ?? '—'}</span>
            <span className="ped-admin__tarjeta-label">{e.etiqueta}</span>
          </button>
        ))}
      </div>

      <div className="ped-admin__buscador">
        <Search size={18} />
        <input
          type="search"
          placeholder="Buscar por cliente, producto o N° de pedido"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error && <p className="ped-admin__error">{error}</p>}

      <p className="ped-admin__conteo">
        {estado ? `${estadoInfo(estado).etiqueta}: ` : 'Todos: '}
        {lista.total} {lista.total === 1 ? 'pedido' : 'pedidos'}
        {estado && (
          <button type="button" className="ped-admin__ver-todos" onClick={() => elegirEstado(estado)}>
            Ver todos
          </button>
        )}
      </p>

      {cargando && lista.items.length === 0 ? (
        <p className="ped-admin__vacio">Cargando…</p>
      ) : lista.items.length === 0 ? (
        <p className="ped-admin__vacio">No hay pedidos con estos filtros.</p>
      ) : (
        <ul className="ped-admin__lista">
          {lista.items.map((p) => (
            <TarjetaPedido key={`${p.id}-${p.estado}`} pedido={p} token={token} onCambio={() => setRecarga((n) => n + 1)} />
          ))}
        </ul>
      )}

      {lista.paginas > 1 && (
        <div className="ped-admin__paginacion">
          <button type="button" className="btn btn--ghost" disabled={pagina <= 1} onClick={() => setPagina((n) => n - 1)}>Anterior</button>
          <span>Página {pagina} de {lista.paginas}</span>
          <button type="button" className="btn btn--ghost" disabled={pagina >= lista.paginas} onClick={() => setPagina((n) => n + 1)}>Siguiente</button>
        </div>
      )}
    </div>
  );
}