import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, PackageOpen, RotateCcw } from 'lucide-react';
import { formatoSoles, useCart } from '../Cart/CartContext.jsx';
import './Compras.css';

const ESTADOS = {
  Entregado: 'entregado',
  'En camino': 'camino',
  'En preparación': 'preparacion',
};

const fechaLarga = (iso) =>
  new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });

function Pedido({ pedido, abiertoInicial, onVolverAComprar }) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  const unidades = pedido.items.reduce((suma, i) => suma + i.cantidad, 0);

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
          <strong>{pedido.id}</strong>
          <span>{fechaLarga(pedido.fecha)}</span>
        </span>
        <span className={`pedido__estado pedido__estado--${ESTADOS[pedido.estado] ?? 'entregado'}`}>
          {pedido.estado}
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
            <ul className="pedido__items">
              {pedido.items.map((producto) => (
                <li key={producto.id}>
                  <span>
                    {producto.nombre}
                    <em> x{producto.cantidad}</em>
                  </span>
                  <span>{formatoSoles(producto.precio * producto.cantidad)}</span>
                </li>
              ))}
            </ul>

            <div className="pedido__pie">
              <span>
                {unidades} {unidades === 1 ? 'producto' : 'productos'}
              </span>
              <button type="button" className="btn btn--ghost" onClick={() => onVolverAComprar(pedido.items)}>
                <RotateCcw size={16} aria-hidden="true" />
                Volver a comprar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function MisCompras() {
  const { orders, volverAComprar } = useCart();

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

      {orders.length === 0 ? (
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
            <Pedido key={pedido.id} pedido={pedido} abiertoInicial={i === 0} onVolverAComprar={volverAComprar} />
          ))}
        </ul>
      )}
    </main>
  );
}