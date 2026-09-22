// src/components/admin/Usuarios/Usuarios.jsx
import { useMemo, useState } from 'react';
import { useAuth } from '../../../models/context/AuthContext.jsx';
import { obtenerUsuariosRegistrados } from '../../../models/helpers/usuarios.js';

export default function Usuarios() {
  const { user: actual } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const usuarios = useMemo(() => obtenerUsuariosRegistrados(), []);

  const filtrados = usuarios.filter((u) =>
    `${u.nombre} ${u.email}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>Gestión de usuarios</h1>
        <input
          type="search"
          placeholder="Buscar por nombre o correo"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Nombre</th>
            <th align="left">Correo</th>
            <th align="left">Distrito</th>
            <th align="left">Rol</th>
            <th align="left">Estado</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((u) => (
            <tr key={u.email}>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td>{u.distrito || '—'}</td>
              <td>{u.rol === 'admin' ? 'Administrador' : 'Cliente'}</td>
              <td>{u.email === actual.email ? 'En línea' : 'Registrado'}</td>
            </tr>
          ))}
          {filtrados.length === 0 && (
            <tr><td colSpan={5}>No se encontraron usuarios.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}