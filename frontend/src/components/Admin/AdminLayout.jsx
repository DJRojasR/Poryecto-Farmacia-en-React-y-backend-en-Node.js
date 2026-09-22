// src/components/admin/AdminLayout.jsx
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, Boxes, ShoppingCart, ClipboardList,
  Users, Truck, BarChart3, ArrowLeft, LogOut,
} from 'lucide-react';
import { useAuth } from '../../models/context/AuthContext.jsx';
import './AdminLayout.css';

const MODULOS = [
  { to: '/admin', fin: true, icono: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/productos', icono: Package, label: 'Productos' },
  { to: '/admin/inventario', icono: Boxes, label: 'Inventario' },
  { to: '/admin/ventas', icono: ShoppingCart, label: 'Ventas' },
  { to: '/admin/pedidos', icono: ClipboardList, label: 'Pedidos' },
  { to: '/admin/usuarios', icono: Users, label: 'Usuarios' },
  { to: '/admin/proveedores', icono: Truck, label: 'Proveedores' },
  { to: '/admin/reportes', icono: BarChart3, label: 'Reportes' },
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