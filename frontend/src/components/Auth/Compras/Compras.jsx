// src/components/Auth/Compras/Compras.jsx
// "Mis compras": pedidos del usuario desde GET /api/pedidos/mios
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bike, ChevronDown, CreditCard, PackageOpen, RotateCcw, Store, X, XCircle } from 'lucide-react';
import { codigoPedido, estadoInfo, pagoInfo, sePuedePagar } from '../../../models/helpers/pedidos_api.js';
import PagoStripe from '../Pago/PagoStripe.jsx';
import { formatoSoles, useCart } from '../Cart/CartContext.jsx';
import './Compras.css';

// estado del backend -> clase CSS que ya tenías
const CLASE_ESTADO = {
  pendiente: 'preparacion',
  confirmado: 'preparacion',
  en_camino: 'camino',
  entregado: 'entregado',
  cancelado: 'cancelado',
};

const fechaLarga = (iso) =>
  new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });

function Pedido({ pedido, abiertoInicial, onVolverAComprar, onCancelar, onPagar }) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState('');
  const [cancelando, setCancelando] = useState(false);
  const unidades = pedido.items.reduce((suma, i) => suma + i.cantidad, 0);
  const info = estadoInfo(pedido.estado);
  const pago = pagoInfo(pedido);
  const porPagar = sePuedePagar(pedido);

  const cancelar = async () => {
    setCancelando(true);
    setError('');
    try {
      await onCancelar(pedido.id);
      setConfirmando(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelando(false);
    }
  };

  return (
    <li className="pedido">
      <button
        type="button"
        className="pedido__resumen"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls={`detalle-${pedido.id}`}
      >
        <span className="pedido__principal">
          <strong>{codigoPedido(pedido.id)}</strong>
          <span>{fechaLarga(pedido.creado_en)}</span>
        </span>
        <span className={`pedido__estado pedido__estado--${porPagar ? 'porpagar' : CLASE_ESTADO[pedido.estado] ?? 'preparacion'}`}>
          {porPagar ? 'Pago pendiente' : info.etiqueta}
        </span>
        <span className="pedido__total">{formatoSoles(pedido.total)}</span>
        <ChevronDown size={18} className={`pedido__flecha${abierto ? ' pedido__flecha--abierta' : ''}`} aria-hidden="true" />
      </button>

      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
            id={`detalle-${pedido.id}`}
            className="pedido__detalle"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <p className="pedido__entrega">
              {pedido.entrega === 'delivery'
                ? <><Bike size={15} aria-hidden="true" /> Delivery a {pedido.direccion}</>
                : <><Store size={15} aria-hidden="true" /> Recojo en tienda</>}
            </p>

            <p className="pedido__entrega" style={{ color: pago.color }}>
              <CreditCard size={15} aria-hidden="true" /> {pago.etiqueta}
              {porPagar && ' · se cancela solo si no se paga en 30 minutos'}
            </p>

            <ul className="pedido__items">
              {pedido.items.map((producto) => (
                <li key={producto.producto_id}>
                  <span>
                    {producto.nombre}
                    <em> x{producto.cantidad}</em>
                  </span>
                  <span>{formatoSoles(producto.subtotal)}</span>
                </li>
              ))}
            </ul>

            {error && <p className="pedido__error">{error}</p>}

            <div className="pedido__pie">
              <span>
                {unidades} {unidades === 1 ? 'producto' : 'productos'}
              </span>
              <div className="pedido__acciones">
                {pedido.estado === 'pendiente' && (
                  confirmando ? (
                    <>
                      <span className="pedido__pregunta">¿Cancelar este pedido?</span>
                      <button type="button" className="btn btn--ghost" onClick={() => setConfirmando(false)} disabled={cancelando}>
                        No
                      </button>
                      <button type="button" className="btn btn--peligro" onClick={cancelar} disabled={cancelando}>
                        {cancelando ? 'Cancelando…' : 'Sí, cancelar'}
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn--ghost" onClick={() => setConfirmando(true)}>
                      <XCircle size={16} aria-hidden="true" /> Cancelar pedido
                    </button>
                  )
                )}
                {porPagar && !confirmando && (
                  <button type="button" className="btn btn--primary" onClick={() => onPagar(pedido)}>
                    <CreditCard size={16} aria-hidden="true" /> Pagar ahora
                  </button>
                )}
                {!confirmando && (
                  <button type="button" className="btn btn--ghost" onClick={() => onVolverAComprar(pedido.items)}>
                    <RotateCcw size={16} aria-hidden="true" />
                    Volver a comprar
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function MisCompras() {
  const {
    orders, cargandoPedidos, errorPedidos, volverAComprar, cancelarPedido, actualizarPedido, recargarPedidos,
  } = useCart();
  const [pagando, setPagando] = useState(null); // pedido que se está pagando

  return (
    <main className="compras">
      <motion.div
        className="compras__cabecera"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1>Mis compras</h1>
        <p>{orders.length === 1 ? '1 pedido realizado' : `${orders.length} pedidos realizados`}</p>
      </motion.div>

      {errorPedidos ? (
        <div className="compras__vacio">
          <h2>No pudimos cargar tus compras</h2>
          <p>{errorPedidos}</p>
          <button type="button" className="btn btn--primary" onClick={recargarPedidos}>Reintentar</button>
        </div>
      ) : cargandoPedidos && orders.length === 0 ? (
        <p className="compras__cargando">Cargando tus compras…</p>
      ) : orders.length === 0 ? (
        <div className="compras__vacio">
          <PackageOpen size={52} strokeWidth={1.5} aria-hidden="true" />
          <h2>Todavía no tienes compras</h2>
          <p>Cuando finalices un pedido, lo verás aquí.</p>
          <Link to="/productos" className="btn btn--primary">
            Ver productos
          </Link>
        </div>
      ) : (
        <ul className="compras__lista">
          {orders.map((pedido, i) => (
            <Pedido
              key={pedido.id}
              pedido={pedido}
              abiertoInicial={i === 0}
              onVolverAComprar={volverAComprar}
              onCancelar={cancelarPedido}
              onPagar={setPagando}
            />
          ))}
        </ul>
      )}

      <AnimatePresence>
        {pagando && (
          <motion.div
            className="pago-modal__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPagando(null)}
          >
            <motion.div
              className="pago-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`Pagar pedido ${codigoPedido(pagando.id)}`}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
            >
              <div className="pago-modal__cabecera">
                <h2>Pedido {codigoPedido(pagando.id)}</h2>
                <button type="button" onClick={() => setPagando(null)} aria-label="Cerrar">
                  <X size={20} />
                </button>
              </div>
              <PagoStripe
                pedido={pagando}
                onPagado={(actualizado) => {
                  actualizarPedido(actualizado);
                  setPagando(null);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}