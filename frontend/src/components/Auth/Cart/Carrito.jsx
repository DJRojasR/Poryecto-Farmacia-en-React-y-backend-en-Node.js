import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Minus, Pill, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { formatoSoles, useCart } from './CartContext.jsx';
import './Carrito.css';

export default function Carrito() {
  const { items, total, abierto, cerrarCarrito, cambiarCantidad, quitar, finalizarCompra } = useCart();
  const [pedido, setPedido] = useState(null);

  // Escape cierra el panel y se bloquea el scroll de la página mientras está abierto
  useEffect(() => {
    if (!abierto) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') cerrarCarrito();
    };
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto, cerrarCarrito]);

  const confirmar = () => {
    const nuevo = finalizarCompra();
    if (nuevo) setPedido(nuevo);
  };

  return (
    <AnimatePresence onExitComplete={() => setPedido(null)}>
      {abierto && (
        <motion.div
          key="overlay"
          className="carrito__overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={cerrarCarrito}
        />
      )}

      {abierto && (
        <motion.aside
          key="panel"
          className="carrito"
          role="dialog"
          aria-modal="true"
          aria-labelledby="carrito-titulo"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <header className="carrito__cabecera">
            <h2 id="carrito-titulo">{pedido ? 'Pedido registrado' : 'Tu carrito'}</h2>
            <button type="button" className="carrito__cerrar" onClick={cerrarCarrito} aria-label="Cerrar carrito">
              <X size={20} />
            </button>
          </header>

          {pedido ? (
            <motion.div
              className="carrito__estado"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              role="status"
            >
              <CheckCircle2 size={56} strokeWidth={1.6} className="carrito__estado-icono" />
              <h3>Pedido {pedido.id}</h3>
              <p>Quedó guardado en Mis compras. Ahí puedes ver el detalle cuando quieras.</p>
              <Link to="/mis-compras" className="btn btn--primary" onClick={cerrarCarrito}>
                Ver mis compras
              </Link>
            </motion.div>
          ) : items.length === 0 ? (
            <div className="carrito__estado">
              <ShoppingCart size={52} strokeWidth={1.5} className="carrito__estado-icono" />
              <h3>Tu carrito está vacío</h3>
              <p>Agrega productos desde el catálogo y aparecerán aquí.</p>
              <Link to="/productos" className="btn btn--primary" onClick={cerrarCarrito}>
                Ver productos
              </Link>
            </div>
          ) : (
            <>
              <ul className="carrito__lista">
                <AnimatePresence initial={false}>
                  {items.map((producto) => (
                    <motion.li
                      key={producto.id}
                      className="carrito__item"
                      layout
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="carrito__miniatura">
                        {producto.imagen ? (
                          <img src={producto.imagen} alt="" />
                        ) : (
                          <Pill size={24} aria-hidden="true" />
                        )}
                      </div>

                      <div className="carrito__info">
                        <strong>{producto.nombre}</strong>
                        <span>{formatoSoles(producto.precio)} c/u</span>

                        <div className="carrito__cantidad">
                          <button
                            type="button"
                            onClick={() => cambiarCantidad(producto.id, -1)}
                            aria-label={`Quitar una unidad de ${producto.nombre}`}
                          >
                            <Minus size={14} />
                          </button>
                          <span aria-live="polite">{producto.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => cambiarCantidad(producto.id, 1)}
                            aria-label={`Agregar una unidad de ${producto.nombre}`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="carrito__derecha">
                        <span className="carrito__subtotal">{formatoSoles(producto.precio * producto.cantidad)}</span>
                        <button
                          type="button"
                          className="carrito__quitar"
                          onClick={() => quitar(producto.id)}
                          aria-label={`Quitar ${producto.nombre} del carrito`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>

              <footer className="carrito__pie">
                <div className="carrito__total">
                  <span>Total</span>
                  <strong>{formatoSoles(total)}</strong>
                </div>
                <button type="button" className="btn btn--primary btn--full" onClick={confirmar}>
                  Finalizar compra
                </button>
                <button type="button" className="btn btn--ghost btn--full" onClick={cerrarCarrito}>
                  Seguir comprando
                </button>
              </footer>
            </>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}