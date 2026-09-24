import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../models/context/AuthContext.jsx';
import { guardarJSON, leerJSON } from '../../../models/helpers/almacenamiento.js';

const CartContext = createContext(null);

export const formatoSoles = (n) => `S/ ${Number(n).toFixed(2)}`;

const totalDe = (items) => items.reduce((suma, i) => suma + i.precio * i.cantidad, 0);

// Compras de ejemplo para que "Mis compras" no salga vacío mientras se prueba.
// TODO (backend): reemplazar por GET /api/pedidos
const PEDIDOS_EJEMPLO = [
  {
    id: 'FSM-004821',
    fecha: '2026-09-02T12:00:00',
    estado: 'Entregado',
    items: [
      { id: 'ej-paracetamol', nombre: 'Paracetamol 500 mg x 20 tabletas', precio: 6.5, cantidad: 2 },
      { id: 'ej-vitamina-c', nombre: 'Vitamina C 1 g efervescente', precio: 18.9, cantidad: 1 },
    ],
  },
  {
    id: 'FSM-004377',
    fecha: '2026-08-14T12:00:00',
    estado: 'Entregado',
    items: [
      { id: 'ej-ibuprofeno', nombre: 'Ibuprofeno 400 mg x 10 tabletas', precio: 7.8, cantidad: 1 },
      { id: 'ej-alcohol-gel', nombre: 'Alcohol en gel 250 ml', precio: 9.5, cantidad: 2 },
    ],
  },
  {
    id: 'FSM-003950',
    fecha: '2026-07-03T12:00:00',
    estado: 'Entregado',
    items: [
      { id: 'ej-loratadina', nombre: 'Loratadina 10 mg x 10 tabletas', precio: 8.9, cantidad: 1 },
      { id: 'ej-suero', nombre: 'Suero oral sabor manzana 500 ml', precio: 5.2, cantidad: 3 },
    ],
  },
].map((pedido) => ({ ...pedido, total: totalDe(pedido.items) }));

export function CartProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = user?.email ?? null;

  const [dueno, setDueno] = useState(null);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [abierto, setAbierto] = useState(false);

  // Cuando entra o sale una persona, se cargan (o se vacían) su carrito y sus compras
  if (email !== dueno) {
    setDueno(email);
    setItems(email ? leerJSON(`fsm_carrito_${email}`, []) : []);
    setOrders(email ? leerJSON(`fsm_pedidos_${email}`, PEDIDOS_EJEMPLO) : []);
    setAbierto(false);
  }

  useEffect(() => {
    if (email && email === dueno) guardarJSON(`fsm_carrito_${email}`, items);
  }, [items, email, dueno]);

  useEffect(() => {
    if (email && email === dueno) guardarJSON(`fsm_pedidos_${email}`, orders);
  }, [orders, email, dueno]);

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
            i.id === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i
          );
        }
        return [
          ...actuales,
          {
            id: producto.id,
            nombre: producto.nombre,
            precio: Number(producto.precio),
            imagen: producto.imagen,
            cantidad,
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
        .map((i) => (i.id === id ? { ...i, cantidad: i.cantidad + delta } : i))
        .filter((i) => i.cantidad > 0)
    );
  }, []);

  const quitar = useCallback((id) => {
    setItems((actuales) => actuales.filter((i) => i.id !== id));
  }, []);

  const vaciar = useCallback(() => setItems([]), []);

  // TODO (backend): enviar el pedido con POST /api/pedidos
  const finalizarCompra = useCallback(() => {
    if (items.length === 0) return null;
    const pedido = {
      id: `FSM-${String(Date.now()).slice(-6)}`,
      fecha: new Date().toISOString(),
      estado: 'En preparación',
      items,
      total: totalDe(items),
    };
    setOrders((actuales) => [pedido, ...actuales]);
    setItems([]);
    return pedido;
  }, [items]);

  // Vuelve a poner en el carrito los productos de una compra anterior
  const volverAComprar = useCallback((itemsPedido) => {
    setItems((actuales) => {
      let resultado = [...actuales];
      itemsPedido.forEach((nuevo) => {
        const existe = resultado.some((i) => i.id === nuevo.id);
        resultado = existe
          ? resultado.map((i) =>
              i.id === nuevo.id ? { ...i, cantidad: i.cantidad + nuevo.cantidad } : i
            )
          : [...resultado, { ...nuevo }];
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
      volverAComprar,
    }),
    [
      items,
      orders,
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
      volverAComprar,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}