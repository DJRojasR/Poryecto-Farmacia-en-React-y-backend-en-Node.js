// src/components/Admin/Ventas/Ventas.jsx
// Todas las ventas: las de mostrador (se registran aquí) y los pedidos web ya pagados con tarjeta.
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Minus, Pill, Plus, Receipt, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../../../models/context/AuthContext.jsx';
import { listarProductos } from '../../../models/helpers/productos.js';
import { codigoPedido, estadoInfo } from '../../../models/helpers/pedidos_api.js';
import {
  METODOS_PAGO, anularVenta, listarVentas, registrarVenta, resumenVentas,
} from '../../../models/helpers/ventas_api.js';
import './Ventas.css';

const soles = (n) => `S/ ${Number(n || 0).toFixed(2)}`;
const anim = {
  overlay: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  modal: {
    initial: { opacity: 0, y: 20, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 12, scale: 0.97 },
    transition: { duration: 0.25 },
  },
};

// ---------- Modal: nueva venta ----------

function ModalNuevaVenta({ token, onGuardar, onCancelar }) {
  const [cliente, setCliente] = useState('');
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0].valor);
  const [items, setItems] = useState([]); // { productoId, nombre, precio, stock, requiere_receta, cantidad }
  const [recetaVerificada, setRecetaVerificada] = useState(false);
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Buscador de productos activos (debounce 300 ms)
  useEffect(() => {
    const texto = q.trim();
    if (texto.length < 2) {
      setResultados([]);
      return undefined;
    }
    let vigente = true;
    const t = setTimeout(() => {
      setBuscando(true);
      listarProductos(token, { q: texto, estado: 'activos', pagina: 1 })
        .then((r) => vigente && setResultados(r.items))
        .catch(() => vigente && setResultados([]))
        .finally(() => vigente && setBuscando(false));
    }, 300);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
  }, [q, token]);

  const total = items.reduce((s, it) => s + it.precio * it.cantidad, 0);
  const necesitaReceta = items.some((it) => it.requiere_receta);

  const agregar = (p) => {
    if (p.stock <= 0) return;
    setItems((prev) => {
      const existe = prev.find((it) => it.productoId === p.id);
      if (existe) {
        return prev.map((it) =>
          it.productoId === p.id ? { ...it, cantidad: Math.min(it.cantidad + 1, it.stock) } : it
        );
      }
      return [...prev, {
        productoId: p.id, nombre: p.nombre, precio: Number(p.precio), stock: p.stock,
        requiere_receta: p.requiere_receta, cantidad: 1,
      }];
    });
    setQ('');
    setResultados([]);
  };

  const cambiarCantidad = (id, valor) =>
    setItems((prev) => prev.map((it) => {
      if (it.productoId !== id) return it;
      const n = Math.max(1, Math.min(Number.parseInt(valor, 10) || 1, it.stock, 99));
      return { ...it, cantidad: n };
    }));

  const quitar = (id) => setItems((prev) => prev.filter((it) => it.productoId !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (items.length === 0) return setError('Agrega al menos un producto.');
    if (necesitaReceta && !recetaVerificada) return setError('Confirma que verificaste la receta médica.');

    setEnviando(true);
    try {
      await registrarVenta(token, {
        cliente: cliente.trim(),
        metodo_pago: metodoPago,
        receta_verificada: recetaVerificada,
        items: items.map(({ productoId, cantidad }) => ({ productoId, cantidad })),
      });
      onGuardar();
    } catch (err) {
      setError(err.message); // p. ej. stock insuficiente: lo descontó otra venta
      setEnviando(false);
    }
  };

  return (
    <motion.div className="ventas-admin__overlay" {...anim.overlay} onClick={onCancelar}>
      <motion.form
        className="ventas-admin__modal ventas-admin__modal--ancho"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        noValidate
        {...anim.modal}
      >
        <header className="ventas-admin__modal-cabecera">
          <h2>Nueva venta</h2>
          <button type="button" onClick={onCancelar} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        <div className="ventas-admin__buscar-producto">
          <div className="ventas-admin__buscador">
            <Search size={18} />
            <input
              placeholder="Buscar producto por nombre o marca…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
          </div>
          {(resultados.length > 0 || buscando) && (
            <ul className="ventas-admin__resultados">
              {buscando && resultados.length === 0 && <li className="ventas-admin__resultado-vacio">Buscando…</li>}
              {resultados.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => agregar(p)} disabled={p.stock <= 0}>
                    <span>
                      <strong>{p.nombre}</strong>
                      {p.marca && <small> · {p.marca}</small>}
                      {p.requiere_receta && <span className="ventas-admin__badge-receta">Receta</span>}
                    </span>
                    <span className="ventas-admin__resultado-dato">
                      {p.stock > 0 ? `${p.stock} en stock` : 'Agotado'} · {soles(p.precio)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length === 0 ? (
          <p className="ventas-admin__nota">Busca y agrega los productos de la venta.</p>
        ) : (
          <ul className="ventas-admin__items-venta">
            {items.map((it) => (
              <li className="ventas-admin__fila-item" key={it.productoId}>
                <span className="ventas-admin__item-nombre">
                  <Pill size={14} /> {it.nombre}
                  {it.requiere_receta && <FileText size={13} aria-label="Requiere receta" />}
                </span>
                <div className="ventas-admin__cantidad">
                  <button type="button" onClick={() => cambiarCantidad(it.productoId, it.cantidad - 1)} aria-label="Una menos">
                    <Minus size={13} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={it.stock}
                    value={it.cantidad}
                    onChange={(e) => cambiarCantidad(it.productoId, e.target.value)}
                    aria-label={`Cantidad de ${it.nombre}`}
                  />
                  <button type="button" onClick={() => cambiarCantidad(it.productoId, it.cantidad + 1)} aria-label="Una más">
                    <Plus size={13} />
                  </button>
                </div>
                <span className="ventas-admin__item-subtotal">{soles(it.precio * it.cantidad)}</span>
                <button type="button" onClick={() => quitar(it.productoId)} aria-label={`Quitar ${it.nombre}`}>
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="ventas-admin__fila-campos">
          <div className="ventas-admin__campo">
            <label htmlFor="v-cliente">Cliente (opcional)</label>
            <input id="v-cliente" maxLength={100} value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Cliente mostrador" />
          </div>
          <div className="ventas-admin__campo">
            <label htmlFor="v-metodo">Método de pago</label>
            <select id="v-metodo" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
              {METODOS_PAGO.map((m) => (
                <option key={m.valor} value={m.valor}>{m.etiqueta}</option>
              ))}
            </select>
          </div>
        </div>

        {necesitaReceta && (
          <label className="ventas-admin__check">
            <input type="checkbox" checked={recetaVerificada} onChange={(e) => setRecetaVerificada(e.target.checked)} />
            Verifiqué la receta médica de los productos que la requieren
          </label>
        )}

        <div className="ventas-admin__total-preview">
          <span>Total</span>
          <strong>{soles(total)}</strong>
        </div>

        {error && <span className="ventas-admin__error">{error}</span>}

        <footer className="ventas-admin__modal-pie">
          <button type="button" className="btn btn--ghost" onClick={onCancelar}>Cancelar</button>
          <button type="submit" className="btn btn--primary" disabled={enviando || items.length === 0}>
            {enviando ? 'Registrando…' : 'Registrar venta'}
          </button>
        </footer>
      </motion.form>
    </motion.div>
  );
}

// ---------- Página ----------

export default function Ventas() {
  const { token } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [lista, setLista] = useState({ items: [], total: 0, paginas: 1 });
  const [q, setQ] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const [canal, setCanal] = useState('');
  const [pagina, setPagina] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);
  const [porAnular, setPorAnular] = useState(null);
  const [errorAnular, setErrorAnular] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setBusqueda(q.trim()); setPagina(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    resumenVentas(token).then(setResumen).catch((e) => setError(e.message));
  }, [token, recarga]);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    listarVentas(token, { q: busqueda, canal, estado, pagina })
      .then((r) => { if (vigente) { setLista(r); setError(''); } })
      .catch((e) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [token, busqueda, canal, estado, pagina, recarga]);

  const refrescar = () => {
    setCreando(false);
    setRecarga((n) => n + 1);
  };

  const confirmarAnular = async () => {
    setErrorAnular('');
    try {
      await anularVenta(token, porAnular.id);
      setPorAnular(null);
      refrescar();
    } catch (err) {
      setErrorAnular(err.message);
    }
  };

  return (
    <div className="ventas-admin">
      <div className="ventas-admin__cabecera">
        <div>
          <h1>Gestión de ventas</h1>
          <p>Ventas de mostrador y pedidos web pagados con tarjeta. El stock se descuenta al instante.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setCreando(true)}>
          <Plus size={16} /> Nueva venta
        </button>
      </div>

      <div className="ventas-admin__tarjetas">
        <div className="ventas-admin__tarjeta">
          <span className="ventas-admin__tarjeta-num">{resumen?.totalVentas ?? '—'}</span>
          <span className="ventas-admin__tarjeta-label">Ventas totales (web + mostrador)</span>
        </div>
        <div className="ventas-admin__tarjeta ventas-admin__tarjeta--exito">
          <span className="ventas-admin__tarjeta-num">{resumen ? soles(resumen.ingresosHoy) : '—'}</span>
          <span className="ventas-admin__tarjeta-label">Ingresos hoy ({resumen?.ventasHoy ?? 0} ventas)</span>
        </div>
        <div className="ventas-admin__tarjeta">
          <span className="ventas-admin__tarjeta-num">{resumen ? soles(resumen.ingresosMes) : '—'}</span>
          <span className="ventas-admin__tarjeta-label">Ingresos del mes</span>
        </div>
        <div className="ventas-admin__tarjeta">
          <span className="ventas-admin__tarjeta-num">{resumen ? soles(resumen.ticketPromedio) : '—'}</span>
          <span className="ventas-admin__tarjeta-label">Ticket promedio (mes)</span>
        </div>
      </div>

      <div className="ventas-admin__filtros">
        <div className="ventas-admin__buscador">
          <Search size={18} />
          <input
            type="search"
            placeholder="Buscar por cliente, producto o N° de venta"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select value={estado} onChange={(e) => { setEstado(e.target.value); setPagina(1); }} aria-label="Filtrar por estado">
          <option value="">Todas</option>
          <option value="vigentes">Vigentes</option>
          <option value="cancelado">Anuladas / canceladas</option>
        </select>
        <select value={canal} onChange={(e) => { setCanal(e.target.value); setPagina(1); }} aria-label="Filtrar por canal">
          <option value="">Web y mostrador</option>
          <option value="web">Solo web</option>
          <option value="mostrador">Solo mostrador</option>
        </select>
      </div>

      {error && <p className="ventas-admin__error-general">{error}</p>}

      <div className="ventas-admin__tabla-wrap">
        <table className="ventas-admin__tabla">
          <thead>
            <tr>
              <th>Venta</th>
              <th>Productos</th>
              <th>Pago</th>
              <th>Fecha</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lista.items.map((v) => {
              const anulada = v.estado === 'cancelado';
              return (
                <tr key={v.id} className={anulada ? 'ventas-admin__fila--anulada' : ''}>
                  <td>
                    <div className="ventas-admin__nombre-celda">
                      <span className="ventas-admin__miniatura"><Receipt size={16} /></span>
                      <span>
                        {v.cliente_nombre}
                        <small className="ventas-admin__sub">
                          {codigoPedido(v.id)} · {v.canal === 'web' ? 'Web' : 'Mostrador'}
                          {v.registrado_por_nombre && ` · ${v.registrado_por_nombre}`}
                          {v.canal === 'web' && !anulada && ` · ${estadoInfo(v.estado).etiqueta}`}
                        </small>
                      </span>
                    </div>
                  </td>
                  <td>{v.items.map((it) => `${it.nombre} x${it.cantidad}`).join(', ')}</td>
                  <td>{METODOS_PAGO.find((m) => m.valor === v.metodo_pago)?.etiqueta ?? '—'}</td>
                  <td>{new Date(v.creado_en).toLocaleString('es-PE')}</td>
                  <td>
                    <strong>{soles(v.total)}</strong>
                    {anulada && (
                      <span className="ventas-admin__badge-anulada">
                        {v.pago_estado === 'reembolsado' ? 'Reembolsada' : 'Anulada'}
                      </span>
                    )}
                  </td>
                  <td className="ventas-admin__acciones">
                    {/* Los pedidos web se cancelan desde el módulo Pedidos (ahí se hace el reembolso) */}
                    {!anulada && v.canal === 'mostrador' && (
                      <button
                        type="button"
                        onClick={() => { setErrorAnular(''); setPorAnular(v); }}
                        aria-label={`Anular venta ${codigoPedido(v.id)}`}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!cargando && lista.items.length === 0 && (
              <tr>
                <td colSpan={6} className="ventas-admin__vacio">
                  {busqueda || estado ? 'No se encontraron ventas con esos filtros.' : 'Todavía no hay ventas registradas.'}
                </td>
              </tr>
            )}
            {cargando && lista.items.length === 0 && (
              <tr><td colSpan={6} className="ventas-admin__vacio">Cargando…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {lista.paginas > 1 && (
        <div className="ventas-admin__paginacion">
          <button type="button" className="btn btn--ghost" disabled={pagina <= 1} onClick={() => setPagina((n) => n - 1)}>Anterior</button>
          <span>Página {pagina} de {lista.paginas}</span>
          <button type="button" className="btn btn--ghost" disabled={pagina >= lista.paginas} onClick={() => setPagina((n) => n + 1)}>Siguiente</button>
        </div>
      )}

      <AnimatePresence>
        {creando && <ModalNuevaVenta token={token} onGuardar={refrescar} onCancelar={() => setCreando(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {porAnular && (
          <motion.div className="ventas-admin__overlay" {...anim.overlay} onClick={() => setPorAnular(null)}>
            <motion.div className="ventas-admin__modal ventas-admin__confirmar" onClick={(e) => e.stopPropagation()} {...anim.modal}>
              <h3>¿Anular venta {codigoPedido(porAnular.id)}?</h3>
              <p>
                Venta de <strong>{porAnular.cliente_nombre}</strong> por <strong>{soles(porAnular.total)}</strong>.
                Las unidades vuelven al stock y deja de contar en los ingresos. No se puede deshacer.
              </p>
              {errorAnular && <span className="ventas-admin__error">{errorAnular}</span>}
              <footer className="ventas-admin__modal-pie">
                <button type="button" className="btn btn--ghost" onClick={() => setPorAnular(null)}>Cancelar</button>
                <button type="button" className="btn btn--peligro" onClick={confirmarAnular}>Anular venta</button>
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}