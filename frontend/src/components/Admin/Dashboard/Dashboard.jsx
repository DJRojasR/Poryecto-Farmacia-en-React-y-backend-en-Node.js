// src/components/admin/Dashboard/Dashboard.jsx
import { useMemo } from 'react';
import { Users, Package, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../../models/context/AuthContext.jsx';
import { obtenerUsuariosRegistrados } from '../../../models/helpers/usuarios.js';

export default function Dashboard() {
  const { user } = useAuth();
  const usuarios = useMemo(() => obtenerUsuariosRegistrados(), []);

  return (
    <div className="dashboard">
      <h1>Hola, {user.nombre}</h1>
      <p>Resumen general de la farmacia.</p>

      <div style={{ display: 'flex', gap: 16, margin: '20px 0' }}>
        <div className="admin__link" style={{ background: '#fff', color: '#142c47' }}>
          <Users size={20} />
          <strong style={{ marginLeft: 8 }}>{usuarios.length}</strong>&nbsp;usuarios registrados
        </div>
        <div className="admin__link" style={{ background: '#fff', color: '#142c47' }}>
          <Package size={20} /> Productos: — (pendiente)
        </div>
        <div className="admin__link" style={{ background: '#fff', color: '#142c47' }}>
          <ShoppingCart size={20} /> Pedidos del mes: — (pendiente)
        </div>
      </div>

      <h2>Usuarios activos (ejemplo)</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Nombre</th>
            <th align="left">Correo</th>
            <th align="left">Rol</th>
            <th align="left">Estado</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.email}>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td>{u.rol === 'admin' ? 'Administrador' : 'Cliente'}</td>
              <td>{u.email === user.email ? 'En línea' : 'Registrado'}</td>
            </tr>
          ))}
          {usuarios.length === 0 && (
            <tr><td colSpan={4}>Todavía no hay usuarios registrados.</td></tr>
          )}
        </tbody>
      </table>
      <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>
        Ejemplo de prueba: lee los perfiles guardados en este navegador. Con backend real, "en línea" saldría de una sesión en el servidor.
      </p>
    </div>
  );
}