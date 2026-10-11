// src/components/Auth/Cart/Carrito.jsx
// Panel lateral: carrito -> datos de entrega -> pago con tarjeta (Stripe) -> confirmación.
// Debajo del carrito se ven los últimos pedidos del usuario.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Bike, CheckCircle2, Minus, Pill, Plus, ShoppingCart, Store, Trash2, X } from 'lucide-react';
import { urlImagen } from '../../../models/helpers/productos.js';
import { codigoPedido, estadoInfo, pagoInfo, sePuedePagar } from '../../../models/helpers/pedidos_api.js';
import PagoStripe from '../Pago/PagoStripe.jsx';
import { formatoSoles, useCart } from './CartContext.jsx';
import './Carrito.css';

const ENTREGA_VACIA = { entrega: 'recojo', direccion: '', telefono: '', nota: '' };

const TITULOS = {
  carrito: 'Tu carrito',
  entrega: 'Datos de entrega',
  pago: 'Pagar pedido',
  listo: 'Pedido confirmado',
};

// Últimos pedidos del usuario, dentro del panel del carrito
function PedidosRecientes({ orders, onPagar, onCerrar }) {
  if (orders.length === 0) return null;
  return (
    <section className="carrito__recientes" aria-label="Tus pedidos recientes">
      <div className="carrito__recientes-cabecera">
        <h3>Tus pedidos recientes</h3>
        <Link to="/mis-compras" onClick={onCerrar}>Ver todos</Link>
      </div>
      <ul>
        {orders.slice(0, 3).map((p) => {
          const info = sePuedePagar(p) ? pagoInfo(p) : estadoInfo(p.estado);
          return (
            <li key={p.id}>
              <span className="carrito__reciente-dato">
                <strong>{codigoPedido(p.id)}</strong>
                <small>
                  {new Date(p.creado_en).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })} ·{' '}
                  {formatoSoles(p.total)}
                </small>
              </span>
              {sePuedePagar(p) ? (
                <button type="button" className="btn btn--primary btn--pequeno" onClick={() => onPagar(p)}>
                  Pagar
                </button>
              ) : (
                <span className="carrito__badge" style={{ color: info.color, background: `${info.color}1a` }}>
                  {info.etiqueta}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function Carrito() {
  const {
    items, orders, total, abierto, cerrarCarrito, cambiarCantidad, quitar, finalizarCompra, actualizarPedido,
  } = useCart();
  const [paso, setPaso] = useState('carrito'); // 'carrito' | 'entrega' | 'pago' | 'listo'
  const [pedido, setPedido] = useState(null);
  const [entrega, setEntrega] = useState(ENTREGA_VACIA);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

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

  const cambiar = (campo) => (e) => setEntrega((d) => ({ ...d, [campo]: e.target.value }));

  // Paso 2 -> crea el pedido (reserva el stock) y pasa al pago
  const crearPedido = async (e) => {
    e.preventDefault();
    setError('');
    const nuevos = {};
    if (entrega.entrega === 'delivery') {
      if (entrega.direccion.trim().length < 5) nuevos.direccion = 'Escribe la dirección de entrega.';
      if (!/^[0-9+()\s-]{6,20}$/.test(entrega.telefono.trim())) nuevos.telefono = 'Escribe un teléfono válido.';
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    setEnviando(true);
    try {
      const datos = { entrega: entrega.entrega, nota: entrega.nota.trim() };
      if (entrega.entrega === 'delivery') {
        datos.direccion = entrega.direccion.trim();
        datos.telefono = entrega.telefono.trim();
      }
      const nuevo = await finalizarCompra(datos);
      if (nuevo) {
        setPedido(nuevo);
        setPaso('pago');
      }
    } catch (err) {
      // p. ej. "Stock insuficiente de ..." — el carrito se mantiene para que lo ajustes
      if (err.errores) setErrores(err.errores);
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const pagado = (actualizado) => {
    actualizarPedido(actualizado);
    setPedido(actualizado);
    setPaso('listo');
  };

  const pagarExistente = (p) => {
    setPedido(p);
    setPaso('pago');
  };

  const reiniciar = () => {
    setPedido(null);
    setPaso('carrito');
    setEntrega(ENTREGA_VACIA);
    setErrores({});
    setError('');
  };

  return (
    <AnimatePresence onExitComplete={reiniciar}>
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
            {paso === 'entrega' && (
              <button
                type="button"
                className="carrito__cerrar"
                onClick={() => { setPaso('carrito'); setError(''); }}
                aria-label="Volver al carrito"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 id="carrito-titulo">{TITULOS[paso]}</h2>
            <button type="button" className="carrito__cerrar" onClick={cerrarCarrito} aria-label="Cerrar carrito">
              <X size={20} />
            </button>
          </header>

          {paso === 'listo' && pedido ? (
            <motion.div className="carrito__estado" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} role="status">
              <CheckCircle2 size={56} strokeWidth={1.6} className="carrito__estado-icono" />
              <h3>¡Pago recibido!</h3>
              <p>
                Pedido {codigoPedido(pedido.id)} por {formatoSoles(pedido.total)}.{' '}
                {pedido.entrega === 'delivery'
                  ? 'Te avisaremos cuando salga a tu dirección.'
                  : 'Te avisaremos cuando esté listo para recoger en tienda.'}
              </p>
              <Link to="/mis-compras" className="btn btn--primary" onClick={cerrarCarrito}>
                Ver mis compras
              </Link>
            </motion.div>
          ) : paso === 'pago' && pedido ? (
            <div className="carrito__pago">
              <div className="carrito__pago-resumen">
                <span>Pedido {codigoPedido(pedido.id)}</span>
                <strong>{formatoSoles(pedido.total)}</strong>
              </div>
              <PagoStripe pedido={pedido} onPagado={pagado} />
              <p className="carrito__ayuda">
                Tu pedido ya está reservado. Si no lo pagas en 30 minutos se cancela solo.
                También puedes pagarlo luego desde Mis compras.
              </p>
            </div>
          ) : paso === 'entrega' && items.length > 0 ? (
            <form className="carrito__entrega" onSubmit={crearPedido} noValidate>
              <div className="carrito__opciones" role="radiogroup" aria-label="Tipo de entrega">
                <button
                  type="button"
                  role="radio"
                  aria-checked={entrega.entrega === 'recojo'}
                  className={`carrito__opcion${entrega.entrega === 'recojo' ? ' carrito__opcion--activa' : ''}`}
                  onClick={() => setEntrega((d) => ({ ...d, entrega: 'recojo' }))}
                >
                  <Store size={20} /> Recojo en tienda
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={entrega.entrega === 'delivery'}
                  className={`carrito__opcion${entrega.entrega === 'delivery' ? ' carrito__opcion--activa' : ''}`}
                  onClick={() => setEntrega((d) => ({ ...d, entrega: 'delivery' }))}
                >
                  <Bike size={20} /> Delivery
                </button>
              </div>

              {entrega.entrega === 'delivery' && (
                <>
                  <div className="carrito__campo">
                    <label htmlFor="c-direccion">Dirección</label>
                    <input id="c-direccion" value={entrega.direccion} onChange={cambiar('direccion')} placeholder="Av. Ejemplo 123, distrito" />
                    {errores.direccion && <span className="carrito__error">{errores.direccion}</span>}
                  </div>
                  <div className="carrito__campo">
                    <label htmlFor="c-telefono">Teléfono</label>
                    <input id="c-telefono" inputMode="tel" value={entrega.telefono} onChange={cambiar('telefono')} placeholder="987 654 321" />
                    {errores.telefono && <span className="carrito__error">{errores.telefono}</span>}
                  </div>
                </>
              )}

              <div className="carrito__campo">
                <label htmlFor="c-nota">Nota (opcional)</label>
                <input id="c-nota" maxLength={200} value={entrega.nota} onChange={cambiar('nota')} placeholder="Referencia, horario…" />
              </div>

              <footer className="carrito__pie">
                {error && <p className="carrito__error carrito__error--general">{error}</p>}
                <div className="carrito__total">
                  <span>Total</span>
                  <strong>{formatoSoles(total)}</strong>
                </div>
                <button type="submit" className="btn btn--primary btn--full" disabled={enviando}>
                  {enviando ? 'Creando pedido…' : 'Continuar al pago'}
                </button>
              </footer>
            </form>
          ) : items.length === 0 ? (
            <div className="carrito__cuerpo">
              <div className="carrito__estado carrito__estado--compacto">
                <ShoppingCart size={48} strokeWidth={1.5} className="carrito__estado-icono" />
                <h3>Tu carrito está vacío</h3>
                <p>Agrega productos desde el catálogo y aparecerán aquí.</p>
                <Link to="/productos" className="btn btn--primary" onClick={cerrarCarrito}>
                  Ver productos
                </Link>
              </div>
              <PedidosRecientes orders={orders} onPagar={pagarExistente} onCerrar={cerrarCarrito} />
            </div>
          ) : (
            <>
              <div className="carrito__cuerpo">
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
                          {producto.imagen ? <img src={urlImagen(producto.imagen)} alt="" /> : <Pill size={24} aria-hidden="true" />}
                        </div>

                        <div className="carrito__info">
                          <strong>{producto.nombre}</strong>
                          <span>{formatoSoles(producto.precio)} c/u</span>

                          <div className="carrito__cantidad">
                            <button type="button" onClick={() => cambiarCantidad(producto.id, -1)} aria-label={`Quitar una unidad de ${producto.nombre}`}>
                              <Minus size={14} />
                            </button>
                            <span aria-live="polite">{producto.cantidad}</span>
                            <button type="button" onClick={() => cambiarCantidad(producto.id, 1)} aria-label={`Agregar una unidad de ${producto.nombre}`}>
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="carrito__derecha">
                          <span className="carrito__subtotal">{formatoSoles(producto.precio * producto.cantidad)}</span>
                          <button type="button" className="carrito__quitar" onClick={() => quitar(producto.id)} aria-label={`Quitar ${producto.nombre} del carrito`}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <PedidosRecientes orders={orders} onPagar={pagarExistente} onCerrar={cerrarCarrito} />
              </div>

              <footer className="carrito__pie">
                <div className="carrito__total">
                  <span>Total</span>
                  <strong>{formatoSoles(total)}</strong>
                </div>
                <button type="button" className="btn btn--primary btn--full" onClick={() => setPaso('entrega')}>
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