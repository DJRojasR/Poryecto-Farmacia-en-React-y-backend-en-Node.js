// src/components/admin/Reportes/Reportes.jsx
import { NavLink, Outlet } from 'react-router-dom';

const REPORTES = [
  { to: 'ventas', label: 'Ventas' },
  { to: 'stock', label: 'Stock' },
  { to: 'mas-vendidos', label: 'Más vendidos' },
  { to: 'proximos-vencer', label: 'Próximos a vencer' },
  { to: 'compras', label: 'Compras' },
  { to: 'ingresos', label: 'Ingresos' },
];

export default function ReportesLayout() {
  return (
    <div>
      <h1>Reportes</h1>
      <nav style={{ display: 'flex', gap: 12, margin: '12px 0 20px' }}>
        {REPORTES.map((r) => (
          <NavLink
            key={r.to}
            to={r.to}
            style={({ isActive }) => ({ fontWeight: isActive ? 700 : 400 })}
          >
            {r.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}