// src/components/Auth/Cart/CartContext.jsx
// El carrito se guarda en el navegador (por usuario); los pedidos ya vienen del backend.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../models/context/AuthContext.jsx';
import { guardarJSON, leerJSON } from '../../../models/helpers/almacenamiento.js';
import { cancelarMiPedido, crearPedido, misPedidos } from '../../../models/helpers/pedidos_api.js';

const CartContext = createContext(null);

export const formatoSoles = (n) => `S/ ${Number(n).toFixed(2)}`;

const totalDe = (items) => items.reduce((suma, i) => suma + i.precio * i.cantidad, 0);

const MAX_UNIDADES = 99; // mismo límite que el backend

// Solo productos reales del catálogo (descarta los de ejemplo que guardaba la versión anterior)
const carritoValido = (items) =>
  Array.isArray(items) ? items.filter((i) => Number.isInteger(i?.id) && i.cantidad > 0) : [];

export function CartProvider({ children }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = user?.email ?? null;

  const [dueno, setDueno] = useState(null);
  const [items, setItems] = useState([]);
  const [abierto, setAbierto] = useState(false);

  const [orders, setOrders] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  const [errorPedidos, setErrorPedidos] = useState('');
  const [recargaPedidos, setRecargaPedidos] = useState(0);

  // Cuando entra o sale una persona, se carga (o se vacía) su carrito
  if (email !== dueno) {
    setDueno(email);
    setItems(email ? carritoValido(leerJSON(`fsm_carrito_${email}`, [])) : []);
    setOrders([]);
    setAbierto(false);
  }

  useEffect(() => {
    if (email && email === dueno) guardarJSON(`fsm_carrito_${email}`, items);
  }, [items, email, dueno]);

  // Pedidos del usuario desde el backend (GET /api/pedidos/mios)
  useEffect(() => {
    if (!token) return undefined;
    let vigente = true;
    setCargandoPedidos(true);
    misPedidos(token)
      .then((r) => {
        if (!vigente) return;
        setOrders(r.items);
        setErrorPedidos('');
      })
      .catch((e) => vigente && setErrorPedidos(e.message))
      .finally(() => vigente && setCargandoPedidos(false));
    return () => {
      vigente = false;
    };
  }, [token, recargaPedidos]);

  const recargarPedidos = useCallback(() => setRecargaPedidos((n) => n + 1), []);

  const abrirCarrito = useCallback(() => setAbierto(true), []);
  const cerrarCarrito = useCallback(() => setAbierto(false), []);

  // Si no hay sesión, manda al login y, al entrar, vuelve a la página donde estaba
  const agregar = useCallback(
    (producto, cantidad = 1) => {
      if (!email) {
        navigate('/login', { state: { from: location } });
        return false;
      }
      setItems((actuales) => {
        const existe = actuales.some((i) => i.id === producto.id);
        if (existe) {
          return actuales.map((i) =>
            i.id === producto.id ? { ...i, cantidad: Math.min(i.cantidad + cantidad, MAX_UNIDADES) } : i
          );
        }
        return [
          ...actuales,
          {
            id: producto.id,
            nombre: producto.nombre,
            precio: Number(producto.precio),
            imagen: producto.imagen,
            cantidad: Math.min(cantidad, MAX_UNIDADES),
          },
        ];
      });
      return true;
    },
    [email, navigate, location]
  );

  const cambiarCantidad = useCallback((id, delta) => {
    setItems((actuales) =>
      actuales
        .map((i) => (i.id === id ? { ...i, cantidad: Math.min(i.cantidad + delta, MAX_UNIDADES) } : i))
        .filter((i) => i.cantidad > 0)
    );
  }, []);

  const quitar = useCallback((id) => {
    setItems((actuales) => actuales.filter((i) => i.id !== id));
  }, []);

  const vaciar = useCallback(() => setItems([]), []);

  /**
   * Crea el pedido en el backend (queda "pago pendiente": luego se paga con PagoStripe).
   * El servidor usa SUS precios y SU stock: si algo cambió, responde con un mensaje
   * y el carrito queda intacto.
   * entrega: { entrega: 'recojo'|'delivery', direccion?, telefono?, nota? }
   * Devuelve el pedido creado; si falla, lanza el error (con .errores por campo).
   */
  const finalizarCompra = useCallback(
    async (entrega = { entrega: 'recojo' }) => {
      if (items.length === 0) return null;
      const pedido = await crearPedido(token, {
        ...entrega,
        items: items.map((i) => ({ productoId: i.id, cantidad: i.cantidad })),
      });
      setOrders((actuales) => [pedido, ...actuales]);
      setItems([]);
      return pedido;
    },
    [items, token]
  );

  const cancelarPedido = useCallback(
    async (id) => {
      const actualizado = await cancelarMiPedido(token, id);
      setOrders((actuales) => actuales.map((p) => (p.id === id ? actualizado : p)));
      return actualizado;
    },
    [token]
  );

  // Reemplaza un pedido de la lista (p. ej. cuando el servidor confirma el pago)
  const actualizarPedido = useCallback((pedido) => {
    setOrders((actuales) => actuales.map((p) => (p.id === pedido.id ? pedido : p)));
  }, []);

  // Vuelve a poner en el carrito los productos de una compra anterior
  // (items del backend: { producto_id, nombre, precio, cantidad, imagen })
  const volverAComprar = useCallback((itemsPedido) => {
    setItems((actuales) => {
      let resultado = [...actuales];
      itemsPedido.forEach((it) => {
        const nuevo = { id: it.producto_id, nombre: it.nombre, precio: Number(it.precio), imagen: it.imagen, cantidad: it.cantidad };
        const existe = resultado.some((i) => i.id === nuevo.id);
        resultado = existe
          ? resultado.map((i) =>
              i.id === nuevo.id ? { ...i, cantidad: Math.min(i.cantidad + nuevo.cantidad, MAX_UNIDADES) } : i
            )
          : [...resultado, nuevo];
      });
      return resultado;
    });
    setAbierto(true);
  }, []);

  const total = useMemo(() => totalDe(items), [items]);
  const cantidad = useMemo(() => items.reduce((suma, i) => suma + i.cantidad, 0), [items]);

  const value = useMemo(
    () => ({
      items,
      orders,
      cargandoPedidos,
      errorPedidos,
      total,
      cantidad,
      abierto,
      abrirCarrito,
      cerrarCarrito,
      agregar,
      cambiarCantidad,
      quitar,
      vaciar,
      finalizarCompra,
      cancelarPedido,
      actualizarPedido,
      volverAComprar,
      recargarPedidos,
    }),
    [
      items, orders, cargandoPedidos, errorPedidos, total, cantidad, abierto, abrirCarrito, cerrarCarrito,
      agregar, cambiarCantidad, quitar, vaciar, finalizarCompra, cancelarPedido, actualizarPedido, volverAComprar, recargarPedidos,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}