// src/components/Admin/Proveedores/Proveedores.jsx
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2, History, Mail, Phone, Plus, Power, Search, ShoppingBag, X,
} from 'lucide-react';
import {
  CATEGORIAS_PROVEEDOR,
  alternarActivoProveedor,
  editarProveedor,
  eliminarProveedor,
  obtenerCompras,
  obtenerProveedores,
  registrarCompra,
  registrarProveedor,
  resumenProveedores,
} from '../../../models/helpers/proveedores.js';
import './Proveedores.css';

const PROVEEDOR_VACIO = {
  nombre: '',
  categoria: CATEGORIAS_PROVEEDOR[0].valor,
  contacto: '',
  telefono: '',
  correo: '',
  ruc: '',
  direccion: '',
  notas: '',
};

function ModalProveedor({ proveedor, onGuardar, onCancelar }) {
  const esEdicion = Boolean(proveedor);
  const [form, setForm] = useState(proveedor ? { ...proveedor } : { ...PROVEEDOR_VACIO });
  const [error, setError] = useState('');

  const actualizarCampo = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      if (esEdicion) {
        editarProveedor(proveedor.id, form);
      } else {
        registrarProveedor(form);
      }
      onGuardar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <motion.div
      className="prov-admin__overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancelar}
    >
      <motion.form
        className="prov-admin__modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.25 }}
      >
        <header className="prov-admin__modal-cabecera">
          <h2>{esEdicion ? `Editar — ${proveedor.nombre}` : 'Nuevo proveedor'}</h2>
          <button type="button" onClick={onCancelar} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        <div className="prov-admin__grid-campos">
          <div className="prov-admin__campo prov-admin__campo--ancho">
            <label htmlFor="p-nombre">Nombre / Razón social</label>
            <input id="p-nombre" value={form.nombre} onChange={actualizarCampo('nombre')} placeholder="Ej. Química Suiza" />
          </div>

          <div className="prov-admin__campo">
            <label htmlFor="p-categoria">Categoría</label>
            <select id="p-categoria" value={form.categoria} onChange={actualizarCampo('categoria')}>
              {CATEGORIAS_PROVEEDOR.map((c) => (
                <option key={c.valor} value={c.valor}>{c.etiqueta}</option>
              ))}
            </select>
          </div>

          <div className="prov-admin__campo">
            <label htmlFor="p-ruc">RUC</label>
            <input id="p-ruc" value={form.ruc} onChange={actualizarCampo('ruc')} placeholder="20100123456" />
          </div>

          <div className="prov-admin__campo">
            <label htmlFor="p-contacto">Persona de contacto</label>
            <input id="p-contacto" value={form.contacto} onChange={actualizarCampo('contacto')} placeholder="Nombre y apellido" />
          </div>

          <div className="prov-admin__campo">
            <label htmlFor="p-telefono">Teléfono</label>
            <input id="p-telefono" value={form.telefono} onChange={actualizarCampo('telefono')} placeholder="01 000 0000" />
          </div>

          <div className="prov-admin__campo prov-admin__campo--ancho">
            <label htmlFor="p-correo">Correo</label>
            <input id="p-correo" type="email" value={form.correo} onChange={actualizarCampo('correo')} placeholder="ventas@proveedor.com" />
          </div>

          <div className="prov-admin__campo prov-admin__campo--ancho">
            <label htmlFor="p-direccion">Dirección</label>
            <input id="p-direccion" value={form.direccion} onChange={actualizarCampo('direccion')} placeholder="Av. Ejemplo 123, Lima" />
          </div>

          <div className="prov-admin__campo prov-admin__campo--ancho">
            <label htmlFor="p-notas">Notas</label>
            <input id="p-notas" value={form.notas} onChange={actualizarCampo('notas')} placeholder="Condiciones de entrega, credito, etc." />
          </div>
        </div>

        {error && <span className="prov-admin__error">{error}</span>}

        <footer className="prov-admin__modal-pie">
          <button type="button" className="btn btn--ghost" onClick={onCancelar}>Cancelar</button>
          <button type="submit" className="btn btn--primary">
            {esEdicion ? 'Guardar cambios' : 'Registrar proveedor'}
          </button>
        </footer>
      </motion.form>
    </motion.div>
  );
}

function ModalCompras({ proveedor, onCerrar, onRegistrar }) {
  const [compras, setCompras] = useState(() => obtenerCompras(proveedor.id));
  const [monto, setMonto] = useState('');
  const [numeroGuia, setNumeroGuia] = useState('');
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');

  const handleRegistrar = (e) => {
    e.preventDefault();
    try {
      registrarCompra({ proveedorId: proveedor.id, monto, numeroGuia, nota });
      setCompras(obtenerCompras(proveedor.id));
      setMonto('');
      setNumeroGuia('');
      setNota('');
      setError('');
      onRegistrar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <motion.div
      className="prov-admin__overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCerrar}
    >
      <motion.div
        className="prov-admin__modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
      >
        <header className="prov-admin__modal-cabecera">
          <h2>Compras — {proveedor.nombre}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        <form className="prov-admin__form-compra" onSubmit={handleRegistrar}>
          <div className="prov-admin__campo">
            <label htmlFor="c-monto">Monto (S/)</label>
            <input id="c-monto" type="number" min="1" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" />
          </div>
          <div className="prov-admin__campo">
            <label htmlFor="c-guia">N° de guía / factura</label>
            <input id="c-guia" value={numeroGuia} onChange={(e) => setNumeroGuia(e.target.value)} placeholder="F001-0001" />
          </div>
          <div className="prov-admin__campo prov-admin__campo--ancho">
            <label htmlFor="c-nota">Nota (opcional)</label>
            <input id="c-nota" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Detalle del pedido" />
          </div>
          {error && <span className="prov-admin__error">{error}</span>}
          <button type="submit" className="btn btn--primary prov-admin__btn-compra">
            <Plus size={16} /> Registrar compra
          </button>
        </form>

        {compras.length === 0 ? (
          <p className="prov-admin__vacio-historial">Todavía no hay compras registradas.</p>
        ) : (
          <ul className="prov-admin__lista-compras">
            {compras.map((c) => (
              <li key={c.id} className="prov-admin__compra">
                <span className="prov-admin__compra-icono"><ShoppingBag size={16} /></span>
                <div>
                  <p>S/ {c.monto.toFixed(2)} {c.numeroGuia && `— ${c.numeroGuia}`}</p>
                  <small>{new Date(c.fecha).toLocaleString('es-PE')}</small>
                  {c.nota && <small className="prov-admin__compra-nota">{c.nota}</small>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function Proveedores() {
  const [proveedores, setProveedores] = useState(() => obtenerProveedores());
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(null);
  const [creando, setCreando] = useState(false);
  const [verCompras, setVerCompras] = useState(null);

  const resumen = useMemo(() => resumenProveedores(), [proveedores]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return proveedores;
    return proveedores.filter((p) => `${p.nombre} ${p.contacto} ${p.ruc}`.toLowerCase().includes(q));
  }, [proveedores, busqueda]);

  const refrescar = () => {
    setProveedores(obtenerProveedores());
    setEditando(null);
    setCreando(false);
  };

  const handleAlternarActivo = (id) => {
    alternarActivoProveedor(id);
    setProveedores(obtenerProveedores());
  };

  const handleEliminar = (proveedor) => {
    if (window.confirm(`¿Eliminar a ${proveedor.nombre}? Esta acción no se puede deshacer.`)) {
      eliminarProveedor(proveedor.id);
      setProveedores(obtenerProveedores());
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
          <span className="prov-admin__tarjeta-num">{resumen.totalProveedores}</span>
          <span className="prov-admin__tarjeta-label">Proveedores</span>
        </div>
        <div className="prov-admin__tarjeta">
          <span className="prov-admin__tarjeta-num">{resumen.activos}</span>
          <span className="prov-admin__tarjeta-label">Activos</span>
        </div>
        <div className="prov-admin__tarjeta prov-admin__tarjeta--alerta">
          <span className="prov-admin__tarjeta-num">{resumen.inactivos}</span>
          <span className="prov-admin__tarjeta-label">Inactivos</span>
        </div>
        <div className="prov-admin__tarjeta">
          <span className="prov-admin__tarjeta-num">S/ {resumen.gastoDelMes.toFixed(2)}</span>
          <span className="prov-admin__tarjeta-label">Gasto del mes</span>
        </div>
      </div>

      <div className="prov-admin__buscador">
        <Search size={18} />
        <input
          type="search"
          placeholder="Buscar por nombre, contacto o RUC"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="prov-admin__tabla-wrap">
        <table className="prov-admin__tabla">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Categoría</th>
              <th>Contacto</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id} className={!p.activo ? 'prov-admin__fila--inactiva' : ''}>
                <td>
                  <div className="prov-admin__nombre-celda">
                    <span className="prov-admin__miniatura"><Building2 size={18} /></span>
                    <div>
                      <span className="prov-admin__nombre-texto">{p.nombre}</span>
                      {p.ruc && <small className="prov-admin__ruc">RUC {p.ruc}</small>}
                    </div>
                  </div>
                </td>
                <td>{CATEGORIAS_PROVEEDOR.find((c) => c.valor === p.categoria)?.etiqueta}</td>
                <td>
                  <div className="prov-admin__contacto-celda">
                    {p.contacto && <span>{p.contacto}</span>}
                    {p.telefono && <small><Phone size={12} /> {p.telefono}</small>}
                    {p.correo && <small><Mail size={12} /> {p.correo}</small>}
                  </div>
                </td>
                <td>
                  <span className={`prov-admin__estado${p.activo ? '' : ' prov-admin__estado--inactivo'}`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="prov-admin__acciones">
                  <button type="button" onClick={() => setEditando(p)} className="btn btn--ghost btn--pequeno">
                    Editar
                  </button>
                  <button type="button" onClick={() => setVerCompras(p)} aria-label={`Compras de ${p.nombre}`}>
                    <History size={16} />
                  </button>
                  <button type="button" onClick={() => handleAlternarActivo(p.id)} aria-label={p.activo ? 'Desactivar' : 'Activar'}>
                    <Power size={16} />
                  </button>
                  <button type="button" onClick={() => handleEliminar(p)} aria-label={`Eliminar ${p.nombre}`} className="prov-admin__btn-eliminar">
                    <X size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="prov-admin__vacio">
                  {proveedores.length === 0
                    ? 'Todavía no hay proveedores registrados.'
                    : 'No se encontraron proveedores con esa búsqueda.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {creando && (
          <ModalProveedor onGuardar={refrescar} onCancelar={() => setCreando(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editando && (
          <ModalProveedor proveedor={editando} onGuardar={refrescar} onCancelar={() => setEditando(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {verCompras && (
          <ModalCompras proveedor={verCompras} onCerrar={() => setVerCompras(null)} onRegistrar={refrescar} />
        )}
      </AnimatePresence>
    </div>
  );
}