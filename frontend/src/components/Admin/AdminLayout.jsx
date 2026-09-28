// src/components/Admin/AdminLayout.jsx
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, Boxes, ShoppingCart, ClipboardList,
  Users, Truck, BarChart3, LogOut,
} from 'lucide-react';
import { useAuth } from '../../models/context/AuthContext.jsx';
import './AdminLayout.css';

const MODULOS = [
  { to: '/Admin', fin: true, icono: LayoutDashboard, label: 'Dashboard' },
  { to: '/Admin/productos', icono: Package, label: 'Productos' },
  { to: '/Admin/inventario', icono: Boxes, label: 'Inventario' },
  { to: '/Admin/ventas', icono: ShoppingCart, label: 'Ventas' },
  { to: '/Admin/pedidos', icono: ClipboardList, label: 'Pedidos' },
  { to: '/Admin/usuarios', icono: Users, label: 'Usuarios' },
  { to: '/Admin/proveedores', icono: Truck, label: 'Proveedores' },
  { to: '/Admin/reportes', icono: BarChart3, label: 'Reportes' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <div className="admin__marca">Farmacia San Marcos</div>
        <span className="admin__submarca">Panel administrativo</span>

        <nav className="admin__nav">
          {MODULOS.map(({ to, fin, icono: Icono, label }) => (
            <NavLink
              key={to}
              to={to}
              end={fin}
              className={({ isActive }) => `admin__link${isActive ? ' admin__link--activo' : ''}`}
            >
              <Icono size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="admin__pie">
          <button type="button" className="admin__link admin__salir" onClick={logout}>
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="admin__contenido">
        <header className="admin__topbar">Hola, {user.nombre}</header>
        <Outlet />
      </main>
    </div>
  );
}