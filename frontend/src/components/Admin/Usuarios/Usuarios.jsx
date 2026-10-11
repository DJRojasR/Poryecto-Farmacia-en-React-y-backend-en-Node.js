// src/components/Admin/Usuarios/Usuarios.jsx
// Cuentas reales desde el backend. No puedes cambiar tu propio rol ni desactivarte,
// y siempre queda al menos un administrador activo (lo valida el servidor).
import { useEffect, useState } from 'react';
import { Mail, Search, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../../models/context/AuthContext.jsx';
import {
  cambiarActivoUsuario, cambiarRolUsuario, listarUsuarios, resumenUsuarios,
} from '../../../models/helpers/usuarios_api.js';
import './Usuarios.css';

export default function Usuarios() {
  const { user: actual, token } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [lista, setLista] = useState({ items: [], total: 0, paginas: 1 });
  const [q, setQ] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [rol, setRol] = useState('');
  const [pagina, setPagina] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(null); // id del usuario que se está guardando

  useEffect(() => {
    const t = setTimeout(() => { setBusqueda(q.trim()); setPagina(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    resumenUsuarios(token).then(setResumen).catch((e) => setError(e.message));
  }, [token, recarga]);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    listarUsuarios(token, { q: busqueda, rol, pagina })
      .then((r) => { if (vigente) { setLista(r); setError(''); } })
      .catch((e) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [token, busqueda, rol, pagina, recarga]);

  const ejecutar = async (id, accion) => {
    setGuardando(id);
    setError('');
    try {
      await accion();
      setRecarga((n) => n + 1);
    } catch (err) {
      setError(err.message); // p. ej. "Debe quedar al menos un administrador activo."
    } finally {
      setGuardando(null);
    }
  };

  return (
    <div className="usr-admin">
      <div className="usr-admin__cabecera">
        <div>
          <h1>Gestión de usuarios</h1>
          <p>Consulta las cuentas registradas y administra sus permisos.</p>
        </div>
      </div>

      <div className="usr-admin__tarjetas">
        <div className="usr-admin__tarjeta">
          <span className="usr-admin__tarjeta-num">{resumen?.total ?? '—'}</span>
          <span className="usr-admin__tarjeta-label">Usuarios totales</span>
        </div>
        <div className="usr-admin__tarjeta">
          <span className="usr-admin__tarjeta-num">{resumen?.administradores ?? '—'}</span>
          <span className="usr-admin__tarjeta-label">Administradores</span>
        </div>
        <div className="usr-admin__tarjeta">
          <span className="usr-admin__tarjeta-num">{resumen?.clientes ?? '—'}</span>
          <span className="usr-admin__tarjeta-label">Clientes</span>
        </div>
        <div className="usr-admin__tarjeta usr-admin__tarjeta--exito">
          <span className="usr-admin__tarjeta-num">{resumen?.nuevosEsteMes ?? '—'}</span>
          <span className="usr-admin__tarjeta-label">Nuevos este mes</span>
        </div>
      </div>

      <div className="usr-admin__filtros">
        <div className="usr-admin__buscador">
          <Search size={18} />
          <input
            type="search"
            placeholder="Buscar por nombre o correo"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select value={rol} onChange={(e) => { setRol(e.target.value); setPagina(1); }} aria-label="Filtrar por rol">
          <option value="">Todos los roles</option>
          <option value="admin">Administradores</option>
          <option value="cliente">Clientes</option>
        </select>
      </div>

      {error && <p className="usr-admin__error-general">{error}</p>}

      <div className="usr-admin__tabla-wrap">
        <table className="usr-admin__tabla">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Registro</th>
              <th>Pedidos</th>
              <th>Rol</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {lista.items.map((u) => {
              const soyYo = u.email === actual?.email;
              const ocupado = guardando === u.id;
              return (
                <tr key={u.id} className={u.activo ? '' : 'usr-admin__fila--inactiva'}>
                  <td>
                    <div className="usr-admin__nombre-celda">
                      <span className="usr-admin__miniatura"><User size={16} /></span>
                      <div>
                        <span className="usr-admin__nombre-texto">
                          {u.nombre}{soyYo && <small className="usr-admin__tu"> (tú)</small>}
                        </span>
                        <small><Mail size={11} /> {u.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>{new Date(u.creado_en).toLocaleDateString('es-PE')}</td>
                  <td>{u.pedidos}</td>
                  <td>
                    {soyYo ? (
                      <span className="usr-admin__rol usr-admin__rol--admin">
                        <ShieldCheck size={12} /> Administrador
                      </span>
                    ) : (
                      <select
                        className={`usr-admin__select-rol${u.rol === 'admin' ? ' usr-admin__select-rol--admin' : ''}`}
                        value={u.rol}
                        disabled={ocupado}
                        onChange={(e) => {
                          const nuevo = e.target.value;
                          ejecutar(u.id, () => cambiarRolUsuario(token, u.id, nuevo));
                        }}
                        aria-label={`Rol de ${u.nombre}`}
                      >
                        <option value="cliente">Cliente</option>
                        <option value="admin">Administrador</option>
                      </select>
                    )}
                  </td>
                  <td>
                    <label className={`usr-admin__switch${soyYo ? ' usr-admin__switch--bloqueado' : ''}`}>
                      <input
                        type="checkbox"
                        checked={u.activo}
                        disabled={soyYo || ocupado}
                        onChange={(e) => {
                          const activo = e.target.checked;
                          ejecutar(u.id, () => cambiarActivoUsuario(token, u.id, activo));
                        }}
                      />
                      <span className={`usr-admin__estado${u.activo ? ' usr-admin__estado--activo' : ''}`}>
                        {u.activo ? 'Activo' : 'Desactivado'}
                      </span>
                    </label>
                  </td>
                </tr>
              );
            })}
            {!cargando && lista.items.length === 0 && (
              <tr>
                <td colSpan={5} className="usr-admin__vacio">No se encontraron usuarios.</td>
              </tr>
            )}
            {cargando && lista.items.length === 0 && (
              <tr><td colSpan={5} className="usr-admin__vacio">Cargando…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {lista.paginas > 1 && (
        <div className="usr-admin__paginacion">
          <button type="button" className="btn btn--ghost" disabled={pagina <= 1} onClick={() => setPagina((n) => n - 1)}>Anterior</button>
          <span>Página {pagina} de {lista.paginas}</span>
          <button type="button" className="btn btn--ghost" disabled={pagina >= lista.paginas} onClick={() => setPagina((n) => n + 1)}>Siguiente</button>
        </div>
      )}

      <p className="usr-admin__ayuda">
        Los cambios de rol se aplican cuando la persona vuelve a iniciar sesión.
      </p>
    </div>
  );
}