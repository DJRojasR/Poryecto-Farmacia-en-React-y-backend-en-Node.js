// src/components/Admin/Inventario/Inventario.jsx
// Productos = el catálogo (qué se vende, precio, foto). Inventario = las existencias:
// cuánto hay, cuánto vale, y el kardex con cada entrada y salida.
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle, ArrowDownCircle, ArrowUpCircle, Boxes, History, ListOrdered, Pill, Search, X,
} from 'lucide-react';
import { useAuth } from '../../../models/context/AuthContext.jsx';
import { obtenerCategorias, urlImagen } from '../../../models/helpers/productos.js';
import {
  listarInventario,
  listarMovimientos,
  obtenerHistorial,
  obtenerMotivos,
  obtenerResumenInventario,
  registrarMovimiento,
} from '../../../models/helpers/inventario_api.js';
import './Inventario.css';

const animOverlay = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
const animModal = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 12, scale: 0.97 },
  transition: { duration: 0.25 },
};

// ---------- Modal: registrar entrada / salida ----------

function ModalAjuste({ producto, motivos, token, onGuardar, onCancelar }) {
  const [tipo, setTipo] = useState('entrada');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState(motivos.entrada[0]?.valor ?? '');
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiarTipo = (t) => {
    setTipo(t);
    setMotivo(motivos[t][0]?.valor ?? '');
    setError('');
  };

  const cant = Number(cantidad);
  const cantidadValida = cantidad !== '' && Number.isInteger(cant) && cant > 0;
  const resultante = cantidadValida ? producto.stock + (tipo === 'entrada' ? cant : -cant) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!cantidadValida) return setError('Ingresa una cantidad entera mayor a 0.');
    if (resultante < 0) return setError(`No hay suficiente stock: solo quedan ${producto.stock}.`);

    setEnviando(true);
    try {
      await registrarMovimiento(token, {
        productoId: producto.id,
        tipo,
        cantidad: cant,
        motivo,
        nota: nota.trim(),
      });
      onGuardar();
    } catch (err) {
      // El servidor vuelve a validar (y bloquea la fila): su mensaje manda
      setError(Object.values(err.errores || {})[0] || err.message);
      setEnviando(false);
    }
  };

  return (
    <motion.div className="inv-admin__overlay" {...animOverlay} onClick={onCancelar}>
      <motion.form
        className="inv-admin__modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        noValidate
        {...animModal}
      >
        <header className="inv-admin__modal-cabecera">
          <h2>Ajustar stock — {producto.nombre}</h2>
          <button type="button" onClick={onCancelar} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        <p className="inv-admin__stock-actual">
          Stock actual: <strong>{producto.stock}</strong>
          {resultante !== null && (
            <>
              {' '}→ quedará en{' '}
              <strong className={resultante < 0 ? 'inv-admin__negativo' : ''}>{resultante}</strong>
            </>
          )}
        </p>

        <div className="inv-admin__tipo-toggle">
          <button
            type="button"
            className={`inv-admin__tipo${tipo === 'entrada' ? ' inv-admin__tipo--activo' : ''}`}
            onClick={() => cambiarTipo('entrada')}
          >
            <ArrowUpCircle size={16} /> Entrada
          </button>
          <button
            type="button"
            className={`inv-admin__tipo${tipo === 'salida' ? ' inv-admin__tipo--activo' : ''}`}
            onClick={() => cambiarTipo('salida')}
          >
            <ArrowDownCircle size={16} /> Salida
          </button>
        </div>

        <div className="inv-admin__campo">
          <label htmlFor="i-cantidad">Cantidad</label>
          <input
            id="i-cantidad"
            type="number"
            min="1"
            step="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder="0"
            autoFocus
          />
        </div>

        <div className="inv-admin__campo">
          <label htmlFor="i-motivo">Motivo</label>
          <select id="i-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            {motivos[tipo].map((m) => (
              <option key={m.valor} value={m.valor}>{m.etiqueta}</option>
            ))}
          </select>
        </div>

        <div className="inv-admin__campo">
          <label htmlFor="i-nota">Nota (opcional)</label>
          <input
            id="i-nota"
            maxLength={200}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="N° de guía, lote, referencia…"
          />
        </div>

        {error && <span className="inv-admin__error">{error}</span>}

        <footer className="inv-admin__modal-pie">
          <button type="button" className="btn btn--ghost" onClick={onCancelar}>Cancelar</button>
          <button type="submit" className="btn btn--primary" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Registrar movimiento'}
          </button>
        </footer>
      </motion.form>
    </motion.div>
  );
}

// ---------- Modal: kardex del producto ----------

function ModalHistorial({ producto, etiquetas, token, onCerrar }) {
  const [items, setItems] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    obtenerHistorial(token, producto.id, pagina)
      .then((r) => {
        if (!vigente) return;
        setItems((prev) => (pagina === 1 ? r.items : [...prev, ...r.items]));
        setPaginas(r.paginas);
        setError('');
      })
      .catch((e) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [token, producto.id, pagina]);

  return (
    <motion.div className="inv-admin__overlay" {...animOverlay} onClick={onCerrar}>
      <motion.div className="inv-admin__modal" onClick={(e) => e.stopPropagation()} {...animModal}>
        <header className="inv-admin__modal-cabecera">
          <h2>Historial — {producto.nombre}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        {error && <p className="inv-admin__error">{error}</p>}

        {!cargando && !error && items.length === 0 ? (
          <p className="inv-admin__vacio-historial">Todavía no hay movimientos registrados.</p>
        ) : (
          <ul className="inv-admin__lista-mov">
            {items.map((m) => (
              <li key={m.id} className={`inv-admin__mov inv-admin__mov--${m.tipo}`}>
                <span className="inv-admin__mov-icono">
                  {m.tipo === 'entrada' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                </span>
                <div>
                  <p>
                    {m.tipo === 'entrada' ? '+' : '−'}{m.cantidad} unidades — {etiquetas[m.motivo] ?? m.motivo}
                    {m.pedido_id && ` (pedido #${m.pedido_id})`}
                  </p>
                  <small>
                    {new Date(m.creado_en).toLocaleString('es-PE')} · {m.stock_anterior} → {m.stock_resultante}
                    {m.usuario && ` · ${m.usuario}`}
                  </small>
                  {m.nota && <small className="inv-admin__mov-nota">{m.nota}</small>}
                </div>
              </li>
            ))}
          </ul>
        )}

        {cargando && <p className="inv-admin__vacio-historial">Cargando…</p>}

        {!cargando && pagina < paginas && (
          <button type="button" className="btn btn--ghost inv-admin__cargar-mas" onClick={() => setPagina((n) => n + 1)}>
            Ver movimientos anteriores
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

// ---------- Pestaña "Movimientos": kardex general de todos los productos ----------

function Movimientos({ token, motivos, recarga }) {
  const [lista, setLista] = useState({ items: [], total: 0, paginas: 1 });
  const [q, setQ] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('');
  const [motivo, setMotivo] = useState('');
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const etiquetas = motivos?.etiquetas ?? {};

  useEffect(() => {
    const t = setTimeout(() => { setBusqueda(q.trim()); setPagina(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    listarMovimientos(token, { q: busqueda, tipo, motivo, pagina })
      .then((r) => { if (vigente) { setLista(r); setError(''); } })
      .catch((e) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [token, busqueda, tipo, motivo, pagina, recarga]);

  return (
    <>
      <div className="inv-admin__filtros">
        <div className="inv-admin__buscador">
          <Search size={18} />
          <input type="search" placeholder="Buscar por producto" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select value={tipo} onChange={(e) => { setTipo(e.target.value); setPagina(1); }} aria-label="Filtrar por tipo">
          <option value="">Entradas y salidas</option>
          <option value="entrada">Solo entradas</option>
          <option value="salida">Solo salidas</option>
        </select>
        <select value={motivo} onChange={(e) => { setMotivo(e.target.value); setPagina(1); }} aria-label="Filtrar por motivo">
          <option value="">Todos los motivos</option>
          {Object.entries(etiquetas).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>{etiqueta}</option>
          ))}
        </select>
      </div>

      {error && <p className="inv-admin__error-general">{error}</p>}

      <div className="inv-admin__tabla-wrap">
        <table className="inv-admin__tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Movimiento</th>
              <th>Motivo</th>
              <th>Stock</th>
              <th>Responsable</th>
            </tr>
          </thead>
          <tbody>
            {lista.items.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.creado_en).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td>
                  {m.producto}
                  {m.marca && <small className="inv-admin__marca"> · {m.marca}</small>}
                </td>
                <td>
                  <span className={`inv-admin__mov-cant inv-admin__mov-cant--${m.tipo}`}>
                    {m.tipo === 'entrada' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                    {m.tipo === 'entrada' ? '+' : '−'}{m.cantidad}
                  </span>
                </td>
                <td>
                  {etiquetas[m.motivo] ?? m.motivo}
                  {m.pedido_id && <small className="inv-admin__marca"> · pedido #{m.pedido_id}</small>}
                  {m.nota && <small className="inv-admin__mov-nota">{m.nota}</small>}
                </td>
                <td>{m.stock_anterior} → <strong>{m.stock_resultante}</strong></td>
                <td>{m.usuario ?? 'Sistema'}</td>
              </tr>
            ))}
            {!cargando && lista.items.length === 0 && (
              <tr><td colSpan={6} className="inv-admin__vacio">No hay movimientos con esos filtros.</td></tr>
            )}
            {cargando && lista.items.length === 0 && (
              <tr><td colSpan={6} className="inv-admin__vacio">Cargando…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {lista.paginas > 1 && (
        <div className="inv-admin__paginacion">
          <button type="button" className="btn btn--ghost" disabled={pagina <= 1} onClick={() => setPagina((n) => n - 1)}>Anterior</button>
          <span>Página {pagina} de {lista.paginas}</span>
          <button type="button" className="btn btn--ghost" disabled={pagina >= lista.paginas} onClick={() => setPagina((n) => n + 1)}>Siguiente</button>
        </div>
      )}
    </>
  );
}

// ---------- Página ----------

export default function Inventario() {
  const { token } = useAuth();

  const [resumen, setResumen] = useState(null);
  const [lista, setLista] = useState({ items: [], total: 0, paginas: 1 });
  const [motivos, setMotivos] = useState(null);
  const [categorias, setCategorias] = useState([]);

  const [q, setQ] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [vista, setVista] = useState('stock'); // 'stock' | 'movimientos'
  const [ajustando, setAjustando] = useState(null);
  const [verHistorial, setVerHistorial] = useState(null);

  // Datos que casi no cambian: una sola vez
  useEffect(() => {
    obtenerMotivos(token).then(setMotivos).catch((e) => setError(e.message));
    obtenerCategorias().then(setCategorias).catch(() => {});
  }, [token]);

  // Debounce de la búsqueda
  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(q.trim());
      setPagina(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  // Tarjetas: se recalculan tras cada movimiento
  useEffect(() => {
    obtenerResumenInventario(token).then(setResumen).catch((e) => setError(e.message));
  }, [token, recarga]);

  // Tabla
  useEffect(() => {
    let vigente = true;
    setCargando(true);
    listarInventario(token, { q: busqueda, filtro, pagina })
      .then((r) => {
        if (!vigente) return;
        setLista(r);
        setError('');
      })
      .catch((e) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [token, busqueda, filtro, pagina, recarga]);

  const elegirFiltro = (f) => {
    setFiltro((actual) => (actual === f ? 'todos' : f)); // clic de nuevo = quitar filtro
    setVista('stock');
    setPagina(1);
  };

  const guardado = () => {
    setAjustando(null);
    setRecarga((n) => n + 1);
  };

  const nombreCategoria = (id) => categorias.find((c) => c.id === id)?.nombre ?? id;

  const Tarjeta = ({ valor, label, tono, f }) => {
    const clase = `inv-admin__tarjeta${tono ? ` inv-admin__tarjeta--${tono}` : ''}${
      f ? ' inv-admin__tarjeta--clic' : ''}${f && filtro === f ? ' inv-admin__tarjeta--seleccionada' : ''}`;
    const contenido = (
      <>
        <span className="inv-admin__tarjeta-num">{valor ?? '—'}</span>
        <span className="inv-admin__tarjeta-label">{label}</span>
      </>
    );
    return f ? (
      <button type="button" className={clase} onClick={() => elegirFiltro(f)} aria-pressed={filtro === f}>
        {contenido}
      </button>
    ) : (
      <div className={clase}>{contenido}</div>
    );
  };

  return (
    <div className="inv-admin">
      <div className="inv-admin__cabecera">
        <div>
          <h1>Gestión de inventario</h1>
          <p>Existencias, valor del stock y kardex: cada entrada y salida queda registrada.</p>
        </div>
      </div>

      <div className="inv-admin__tarjetas">
        <Tarjeta
          valor={resumen ? `S/ ${resumen.valorInventario.toFixed(2)}` : undefined}
          label={`Valor del inventario · ${resumen?.unidadesTotales ?? 0} unidades`}
        />
        <Tarjeta
          valor={resumen ? `+${resumen.entradasHoy} / −${resumen.salidasHoy}` : undefined}
          label="Entradas / salidas de hoy (unidades)"
        />
        <Tarjeta valor={resumen?.stockBajo} label={`Stock bajo (≤ ${resumen?.umbralStockBajo ?? 5})`} tono="alerta" f="bajo" />
        <Tarjeta valor={resumen?.sinStock} label="Sin stock" tono="critico" f="agotado" />
      </div>

      <div className="inv-admin__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={vista === 'stock'}
          className={`inv-admin__tab${vista === 'stock' ? ' inv-admin__tab--activa' : ''}`}
          onClick={() => setVista('stock')}
        >
          <Boxes size={16} /> Existencias
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={vista === 'movimientos'}
          className={`inv-admin__tab${vista === 'movimientos' ? ' inv-admin__tab--activa' : ''}`}
          onClick={() => setVista('movimientos')}
        >
          <ListOrdered size={16} /> Movimientos (kardex)
        </button>
      </div>

      {vista === 'movimientos' ? (
        <Movimientos token={token} motivos={motivos} recarga={recarga} />
      ) : (
      <>
      <div className="inv-admin__filtros">
        <div className="inv-admin__buscador">
          <Search size={18} />
          <input
            type="search"
            placeholder="Buscar por nombre o marca"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          value={filtro}
          onChange={(e) => { setFiltro(e.target.value); setPagina(1); }}
          aria-label="Filtrar por stock"
        >
          <option value="todos">Todo el stock</option>
          <option value="bajo">Stock bajo</option>
          <option value="agotado">Agotados</option>
        </select>
      </div>

      {error && <p className="inv-admin__error-general">{error}</p>}

      <div className="inv-admin__tabla-wrap">
        <table className="inv-admin__tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Valor</th>
              <th>Último movimiento</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lista.items.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="inv-admin__nombre-celda">
                    <span className="inv-admin__miniatura">
                      {p.imagen ? <img src={urlImagen(p.imagen)} alt="" loading="lazy" /> : <Pill size={18} />}
                    </span>
                    <span>
                      {p.nombre}
                      {p.marca && <small className="inv-admin__marca"> · {p.marca}</small>}
                    </span>
                  </div>
                </td>
                <td>{nombreCategoria(p.categoria)}</td>
                <td>
                  <span
                    className={`inv-admin__stock${
                      p.stock === 0 ? ' inv-admin__stock--critico' : p.stock_bajo ? ' inv-admin__stock--bajo' : ''}`}
                  >
                    {p.stock === 0 && <AlertTriangle size={13} />}
                    {p.stock}
                  </span>
                </td>
                <td>S/ {Number(p.valor).toFixed(2)}</td>
                <td>{p.ultimo_movimiento ? new Date(p.ultimo_movimiento).toLocaleDateString('es-PE') : '—'}</td>
                <td className="inv-admin__acciones">
                  <button
                    type="button"
                    onClick={() => setAjustando(p)}
                    className="btn btn--ghost btn--pequeno"
                    disabled={!motivos}
                  >
                    Ajustar stock
                  </button>
                  <button type="button" onClick={() => setVerHistorial(p)} aria-label={`Historial de ${p.nombre}`}>
                    <History size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {!cargando && lista.items.length === 0 && (
              <tr>
                <td colSpan={6} className="inv-admin__vacio">
                  {busqueda || filtro !== 'todos'
                    ? 'No se encontraron productos con esos filtros.'
                    : 'Todavía no hay productos registrados.'}
                </td>
              </tr>
            )}
            {cargando && lista.items.length === 0 && (
              <tr>
                <td colSpan={6} className="inv-admin__vacio">Cargando…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {lista.paginas > 1 && (
        <div className="inv-admin__paginacion">
          <button type="button" className="btn btn--ghost" disabled={pagina <= 1} onClick={() => setPagina((n) => n - 1)}>
            Anterior
          </button>
          <span>Página {pagina} de {lista.paginas}</span>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={pagina >= lista.paginas}
            onClick={() => setPagina((n) => n + 1)}
          >
            Siguiente
          </button>
        </div>
      )}

      </>
      )}

      <AnimatePresence>
        {ajustando && motivos && (
          <ModalAjuste
            producto={ajustando}
            motivos={motivos}
            token={token}
            onGuardar={guardado}
            onCancelar={() => setAjustando(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {verHistorial && (
          <ModalHistorial
            producto={verHistorial}
            etiquetas={motivos?.etiquetas ?? {}}
            token={token}
            onCerrar={() => setVerHistorial(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}