// src/components/Admin/Usuarios/Usuarios.jsx
import { useMemo, useState } from 'react';
import { Mail, MapPin, Search, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../../models/context/AuthContext.jsx';
import {
  cambiarRolUsuario,
  obtenerUsuariosRegistrados,
  resumenUsuarios,
} from '../../../models/helpers/usuarios.js';
import './Usuarios.css';

export default function Usuarios() {
  const { user: actual } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const [usuarios, setUsuarios] = useState(() => obtenerUsuariosRegistrados());

  const resumen = useMemo(() => resumenUsuarios(), [usuarios]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) => `${u.nombre} ${u.email} ${u.distrito || ''}`.toLowerCase().includes(q));
  }, [usuarios, busqueda]);

  const handleCambiarRol = (email, nuevoRol) => {
    cambiarRolUsuario(email, nuevoRol);
    setUsuarios(obtenerUsuariosRegistrados());
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
          <span className="usr-admin__tarjeta-num">{resumen.total}</span>
          <span className="usr-admin__tarjeta-label">Usuarios totales</span>
        </div>
        <div className="usr-admin__tarjeta">
          <span className="usr-admin__tarjeta-num">{resumen.administradores}</span>
          <span className="usr-admin__tarjeta-label">Administradores</span>
        </div>
        <div className="usr-admin__tarjeta">
          <span className="usr-admin__tarjeta-num">{resumen.clientes}</span>
          <span className="usr-admin__tarjeta-label">Clientes</span>
        </div>
        <div className="usr-admin__tarjeta usr-admin__tarjeta--exito">
          <span className="usr-admin__tarjeta-num">{resumen.nuevosEsteMes}</span>
          <span className="usr-admin__tarjeta-label">Nuevos este mes</span>
        </div>
      </div>

      <div className="usr-admin__buscador">
        <Search size={18} />
        <input
          type="search"
          placeholder="Buscar por nombre, correo o distrito"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="usr-admin__tabla-wrap">
        <table className="usr-admin__tabla">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Distrito</th>
              <th>Rol</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u) => (
              <tr key={u.email}>
                <td>
                  <div className="usr-admin__nombre-celda">
                    <span className="usr-admin__miniatura"><User size={16} /></span>
                    <div>
                      <span className="usr-admin__nombre-texto">{u.nombre}</span>
                      <small><Mail size={11} /> {u.email}</small>
                    </div>
                  </div>
                </td>
                <td>
                  {u.distrito ? (
                    <span className="usr-admin__distrito"><MapPin size={12} /> {u.distrito}</span>
                  ) : '—'}
                </td>
                <td>
                  <span className={`usr-admin__rol${u.rol === 'admin' ? ' usr-admin__rol--admin' : ''}`}>
                    {u.rol === 'admin' && <ShieldCheck size={12} />}
                    {u.rol === 'admin' ? 'Administrador' : 'Cliente'}
                  </span>
                </td>
                <td>
                  <span className={`usr-admin__estado${u.email === actual?.email ? ' usr-admin__estado--activo' : ''}`}>
                    {u.email === actual?.email ? 'En línea' : 'Registrado'}
                  </span>
                </td>
                <td className="usr-admin__acciones">
                  <select
                    value={u.rol}
                    onChange={(e) => handleCambiarRol(u.email, e.target.value)}
                    disabled={u.email === actual?.email}
                  >
                    <option value="cliente">Cliente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="usr-admin__vacio">No se encontraron usuarios.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}