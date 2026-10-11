// src/components/Admin/Proveedores/Proveedores.jsx
// Proveedores y compras conectados al backend. Los proveedores no se borran (tienen compras):
// se desactivan. Las compras no se borran: se anulan.
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2, History, Mail, Phone, Plus, Power, Search, ShoppingBag, X,
} from 'lucide-react';
import { useAuth } from '../../../models/context/AuthContext.jsx';
import {
  CATEGORIAS_PROVEEDOR,
  anularCompra,
  cambiarActivoProveedor,
  crearProveedor,
  editarProveedor,
  listarCompras,
  listarProveedores,
  registrarCompra,
  resumenProveedores,
} from '../../../models/helpers/proveedores_api.js';
import './Proveedores.css';

const soles = (n) => `S/ ${Number(n || 0).toFixed(2)}`;
const fechaCorta = (yyyyMmDd) => (yyyyMmDd ? new Date(`${yyyyMmDd}T12:00:00`).toLocaleDateString('es-PE') : '—');
const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

const anim = {
  overlay: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  modal: {
    initial: { opacity: 0, y: 20, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 12, scale: 0.97 },
    transition: { duration: 0.25 },
  },
};

const PROVEEDOR_VACIO = {
  razon_social: '',
  categoria: CATEGORIAS_PROVEEDOR[0].valor,
  contacto: '',
  telefono: '',
  email: '',
  ruc: '',
  direccion: '',
  notas: '',
};

// ---------- Modal: crear / editar ----------

function ModalProveedor({ proveedor, token, onGuardar, onCancelar }) {
  const esEdicion = Boolean(proveedor);
  const [form, setForm] = useState(() =>
    proveedor
      ? Object.fromEntries(Object.keys(PROVEEDOR_VACIO).map((k) => [k, proveedor[k] ?? '']))
      : { ...PROVEEDOR_VACIO }
  );
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const campo = (k) => ({
    value: form[k],
    onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const nuevos = {};
    if (form.razon_social.trim().length < 2) nuevos.razon_social = 'Escribe la razón social.';
    if (!/^\d{11}$/.test(form.ruc.trim())) nuevos.ruc = 'El RUC debe tener 11 dígitos.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    const datos = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
    setEnviando(true);
    try {
      if (esEdicion) await editarProveedor(token, proveedor.id, datos);
      else await crearProveedor(token, datos);
      onGuardar();
    } catch (err) {
      if (err.errores) setErrores(err.errores);
      setError(err.message);
      setEnviando(false);
    }
  };

  const ErrorCampo = ({ k }) => (errores[k] ? <span className="prov-admin__error">{errores[k]}</span> : null);

  return (
    <motion.div className="prov-admin__overlay" {...anim.overlay} onClick={onCancelar}>
      <motion.form className="prov-admin__modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} noValidate {...anim.modal}>
        <header className="prov-admin__modal-cabecera">
          <h2>{esEdicion ? `Editar — ${proveedor.razon_social}` : 'Nuevo proveedor'}</h2>
          <button type="button" onClick={onCancelar} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        <div className="prov-admin__grid-campos">
          <div className="prov-admin__campo prov-admin__campo--ancho">
            <label htmlFor="p-nombre">Razón social</label>
            <input id="p-nombre" maxLength={150} {...campo('razon_social')} placeholder="Ej. Química Suiza S.A." />
            <ErrorCampo k="razon_social" />
          </div>

          <div className="prov-admin__campo">
            <label htmlFor="p-categoria">Categoría</label>
            <select id="p-categoria" {...campo('categoria')}>
              {CATEGORIAS_PROVEEDOR.map((c) => (
                <option key={c.valor} value={c.valor}>{c.etiqueta}</option>
              ))}
            </select>
            <ErrorCampo k="categoria" />
          </div>

          <div className="prov-admin__campo">
            <label htmlFor="p-ruc">RUC</label>
            <input id="p-ruc" inputMode="numeric" maxLength={11} {...campo('ruc')} placeholder="20100123456" />
            <ErrorCampo k="ruc" />
          </div>

          <div className="prov-admin__campo">
            <label htmlFor="p-contacto">Persona de contacto</label>
            <input id="p-contacto" maxLength={100} {...campo('contacto')} placeholder="Nombre y apellido" />
            <ErrorCampo k="contacto" />
          </div>

          <div className="prov-admin__campo">
            <label htmlFor="p-telefono">Teléfono</label>
            <input id="p-telefono" inputMode="tel" maxLength={20} {...campo('telefono')} placeholder="01 000 0000" />
            <ErrorCampo k="telefono" />
          </div>

          <div className="prov-admin__campo prov-admin__campo--ancho">
            <label htmlFor="p-correo">Correo</label>
            <input id="p-correo" type="email" maxLength={150} {...campo('email')} placeholder="ventas@proveedor.com" />
            <ErrorCampo k="email" />
          </div>

          <div className="prov-admin__campo prov-admin__campo--ancho">
            <label htmlFor="p-direccion">Dirección</label>
            <input id="p-direccion" maxLength={200} {...campo('direccion')} placeholder="Av. Ejemplo 123, Lima" />
            <ErrorCampo k="direccion" />
          </div>

          <div className="prov-admin__campo prov-admin__campo--ancho">
            <label htmlFor="p-notas">Notas</label>
            <input id="p-notas" maxLength={500} {...campo('notas')} placeholder="Condiciones de entrega, crédito, etc." />
            <ErrorCampo k="notas" />
          </div>
        </div>

        {error && <span className="prov-admin__error">{error}</span>}

        <footer className="prov-admin__modal-pie">
          <button type="button" className="btn btn--ghost" onClick={onCancelar}>Cancelar</button>
          <button type="submit" className="btn btn--primary" disabled={enviando}>
            {enviando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Registrar proveedor'}
          </button>
        </footer>
      </motion.form>
    </motion.div>
  );
}

// ---------- Modal: compras del proveedor ----------

function ModalCompras({ proveedor, token, onCerrar, onCambio }) {
  const [compras, setCompras] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState({ total: '', comprobante: '', fecha: hoy(), nota: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [porAnular, setPorAnular] = useState(null);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    listarCompras(token, proveedor.id, pagina)
      .then((r) => {
        if (!vigente) return;
        setCompras((prev) => (pagina === 1 ? r.items : [...prev, ...r.items]));
        setPaginas(r.paginas);
      })
      .catch((e) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [token, proveedor.id, pagina, recarga]);

  const recargar = () => {
    setPagina(1);
    setRecarga((n) => n + 1);
    onCambio();
  };

  const cambiar = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleRegistrar = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(form.total.trim()) || Number(form.total) <= 0) {
      return setError('Ingresa un monto válido (máx. 2 decimales).');
    }
    setEnviando(true);
    try {
      await registrarCompra(token, proveedor.id, {
        total: form.total.trim(),
        comprobante: form.comprobante.trim(),
        fecha: form.fecha,
        nota: form.nota.trim(),
      });
      setForm({ total: '', comprobante: '', fecha: hoy(), nota: '' });
      recargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const confirmarAnular = async () => {
    try {
      await anularCompra(token, porAnular);
      setPorAnular(null);
      recargar();
    } catch (err) {
      setError(err.message);
      setPorAnular(null);
    }
  };

  return (
    <motion.div className="prov-admin__overlay" {...anim.overlay} onClick={onCerrar}>
      <motion.div className="prov-admin__modal" onClick={(e) => e.stopPropagation()} {...anim.modal}>
        <header className="prov-admin__modal-cabecera">
          <h2>Compras — {proveedor.razon_social}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        {proveedor.activo ? (
          <form className="prov-admin__form-compra" onSubmit={handleRegistrar} noValidate>
            <div className="prov-admin__campo">
              <label htmlFor="c-monto">Monto (S/)</label>
              <input id="c-monto" inputMode="decimal" value={form.total} onChange={cambiar('total')} placeholder="0.00" />
            </div>
            <div className="prov-admin__campo">
              <label htmlFor="c-guia">N° de guía / factura</label>
              <input id="c-guia" maxLength={30} value={form.comprobante} onChange={cambiar('comprobante')} placeholder="F001-0001" />
            </div>
            <div className="prov-admin__campo">
              <label htmlFor="c-fecha">Fecha</label>
              <input id="c-fecha" type="date" max={hoy()} value={form.fecha} onChange={cambiar('fecha')} />
            </div>
            <div className="prov-admin__campo">
              <label htmlFor="c-nota">Nota (opcional)</label>
              <input id="c-nota" maxLength={200} value={form.nota} onChange={cambiar('nota')} placeholder="Detalle del pedido" />
            </div>
            {error && <span className="prov-admin__error prov-admin__campo--ancho">{error}</span>}
            <button type="submit" className="btn btn--primary prov-admin__btn-compra" disabled={enviando}>
              <Plus size={16} /> {enviando ? 'Registrando…' : 'Registrar compra'}
            </button>
            <p className="prov-admin__ayuda prov-admin__campo--ancho">
              Esto registra el gasto. Para sumar las unidades al stock usa Inventario → Entrada → “Compra a proveedor”.
            </p>
          </form>
        ) : (
          <p className="prov-admin__ayuda">Este proveedor está inactivo. Actívalo para registrar nuevas compras.</p>
        )}

        {!cargando && compras.length === 0 ? (
          <p className="prov-admin__vacio-historial">Todavía no hay compras registradas.</p>
        ) : (
          <ul className="prov-admin__lista-compras">
            {compras.map((c) => (
              <li key={c.id} className={`prov-admin__compra${c.estado === 'anulada' ? ' prov-admin__compra--anulada' : ''}`}>
                <span className="prov-admin__compra-icono"><ShoppingBag size={16} /></span>
                <div>
                  <p>
                    {soles(c.total)} {c.comprobante && `— ${c.comprobante}`}
                    {c.estado === 'anulada' && <span className="prov-admin__badge-anulada">Anulada</span>}
                  </p>
                  <small>{fechaCorta(c.fecha)}{c.usuario && ` · ${c.usuario}`}</small>
                  {c.nota && <small className="prov-admin__compra-nota">{c.nota}</small>}
                </div>
                {c.estado === 'registrada' && (
                  porAnular === c.id ? (
                    <span className="prov-admin__confirmar-inline">
                      <button type="button" className="btn btn--ghost btn--pequeno" onClick={() => setPorAnular(null)}>No</button>
                      <button type="button" className="btn btn--peligro btn--pequeno" onClick={confirmarAnular}>Anular</button>
                    </span>
                  ) : (
                    <button type="button" className="prov-admin__btn-anular" onClick={() => setPorAnular(c.id)} aria-label="Anular compra">
                      <X size={15} />
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
        {cargando && <p className="prov-admin__vacio-historial">Cargando…</p>}
        {!cargando && pagina < paginas && (
          <button type="button" className="btn btn--ghost prov-admin__cargar-mas" onClick={() => setPagina((n) => n + 1)}>
            Ver compras anteriores
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

// ---------- Página ----------

export default function Proveedores() {
  const { token } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [lista, setLista] = useState({ items: [], total: 0, paginas: 1 });
  const [q, setQ] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const [pagina, setPagina] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [editando, setEditando] = useState(null);
  const [creando, setCreando] = useState(false);
  const [verCompras, setVerCompras] = useState(null);

  const refrescar = () => setRecarga((n) => n + 1);

  useEffect(() => {
    const t = setTimeout(() => { setBusqueda(q.trim()); setPagina(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    resumenProveedores(token).then(setResumen).catch((e) => setError(e.message));
  }, [token, recarga]);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    listarProveedores(token, { q: busqueda, estado, pagina })
      .then((r) => { if (vigente) { setLista(r); setError(''); } })
      .catch((e) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [token, busqueda, estado, pagina, recarga]);

  const guardado = () => {
    setEditando(null);
    setCreando(false);
    refrescar();
  };

  const alternarActivo = async (p) => {
    try {
      await cambiarActivoProveedor(token, p.id, !p.activo);
      refrescar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="prov-admin">
      <div className="prov-admin__cabecera">
        <div>
          <h1>Proveedores y compras</h1>
          <p>Administra tus proveedores, datos de contacto y el historial de compras.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setCreando(true)}>
          <Plus size={16} /> Nuevo proveedor
        </button>
      </div>

      <div className="prov-admin__tarjetas">
        <div className="prov-admin__tarjeta">
          <span className="prov-admin__tarjeta-num">{resumen?.totalProveedores ?? '—'}</span>
          <span className="prov-admin__tarjeta-label">Proveedores</span>
        </div>
        <div className="prov-admin__tarjeta">
          <span className="prov-admin__tarjeta-num">{resumen?.activos ?? '—'}</span>
          <span className="prov-admin__tarjeta-label">Activos</span>
        </div>
        <div className="prov-admin__tarjeta prov-admin__tarjeta--alerta">
          <span className="prov-admin__tarjeta-num">{resumen?.inactivos ?? '—'}</span>
          <span className="prov-admin__tarjeta-label">Inactivos</span>
        </div>
        <div className="prov-admin__tarjeta">
          <span className="prov-admin__tarjeta-num">{resumen ? soles(resumen.gastoDelMes) : '—'}</span>
          <span className="prov-admin__tarjeta-label">Gasto del mes</span>
        </div>
      </div>

      <div className="prov-admin__filtros">
        <div className="prov-admin__buscador">
          <Search size={18} />
          <input
            type="search"
            placeholder="Buscar por razón social, contacto o RUC"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select value={estado} onChange={(e) => { setEstado(e.target.value); setPagina(1); }} aria-label="Filtrar por estado">
          <option value="">Todos</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </select>
      </div>

      {error && <p className="prov-admin__error-general">{error}</p>}

      <div className="prov-admin__tabla-wrap">
        <table className="prov-admin__tabla">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Categoría</th>
              <th>Contacto</th>
              <th>Última compra</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lista.items.map((p) => (
              <tr key={p.id} className={!p.activo ? 'prov-admin__fila--inactiva' : ''}>
                <td>
                  <div className="prov-admin__nombre-celda">
                    <span className="prov-admin__miniatura"><Building2 size={18} /></span>
                    <div>
                      <span className="prov-admin__nombre-texto">{p.razon_social}</span>
                      <small className="prov-admin__ruc">RUC {p.ruc}</small>
                    </div>
                  </div>
                </td>
                <td>{CATEGORIAS_PROVEEDOR.find((c) => c.valor === p.categoria)?.etiqueta ?? p.categoria}</td>
                <td>
                  <div className="prov-admin__contacto-celda">
                    {p.contacto && <span>{p.contacto}</span>}
                    {p.telefono && <small><Phone size={12} /> {p.telefono}</small>}
                    {p.email && <small><Mail size={12} /> {p.email}</small>}
                  </div>
                </td>
                <td>{fechaCorta(p.ultima_compra)}</td>
                <td>
                  <span className={`prov-admin__estado${p.activo ? '' : ' prov-admin__estado--inactivo'}`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="prov-admin__acciones">
                  <button type="button" onClick={() => setEditando(p)} className="btn btn--ghost btn--pequeno">
                    Editar
                  </button>
                  <button type="button" onClick={() => setVerCompras(p)} aria-label={`Compras de ${p.razon_social}`}>
                    <History size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => alternarActivo(p)}
                    aria-label={p.activo ? `Desactivar ${p.razon_social}` : `Activar ${p.razon_social}`}
                    title={p.activo ? 'Desactivar' : 'Activar'}
                  >
                    <Power size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {!cargando && lista.items.length === 0 && (
              <tr>
                <td colSpan={6} className="prov-admin__vacio">
                  {busqueda || estado ? 'No se encontraron proveedores con esos filtros.' : 'Todavía no hay proveedores registrados.'}
                </td>
              </tr>
            )}
            {cargando && lista.items.length === 0 && (
              <tr><td colSpan={6} className="prov-admin__vacio">Cargando…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {lista.paginas > 1 && (
        <div className="prov-admin__paginacion">
          <button type="button" className="btn btn--ghost" disabled={pagina <= 1} onClick={() => setPagina((n) => n - 1)}>Anterior</button>
          <span>Página {pagina} de {lista.paginas}</span>
          <button type="button" className="btn btn--ghost" disabled={pagina >= lista.paginas} onClick={() => setPagina((n) => n + 1)}>Siguiente</button>
        </div>
      )}

      <AnimatePresence>
        {(creando || editando) && (
          <ModalProveedor
            proveedor={editando}
            token={token}
            onGuardar={guardado}
            onCancelar={() => { setCreando(false); setEditando(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {verCompras && (
          <ModalCompras proveedor={verCompras} token={token} onCerrar={() => setVerCompras(null)} onCambio={refrescar} />
        )}
      </AnimatePresence>
    </div>
  );
}