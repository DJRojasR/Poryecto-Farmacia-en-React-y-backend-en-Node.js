// src/components/admin/Reportes/Reportes.jsx
import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  Star,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  Download,
} from 'lucide-react';
import './Reportes.css';
const REPORTES = [
  { to: '.', label: 'Resumen', icono: LayoutDashboard, end: true },
  { to: 'ventas', label: 'Ventas', icono: TrendingUp },
  { to: 'stock', label: 'Stock', icono: Package },
  { to: 'mas-vendidos', label: 'Más vendidos', icono: Star },
  { to: 'proximos-vencer', label: 'Próximos a vencer', icono: AlertTriangle },
  { to: 'compras', label: 'Compras', icono: ShoppingCart },
  { to: 'ingresos', label: 'Ingresos', icono: DollarSign },
];

export default function ReportesLayout() {
  return (
    <div className="reportes">
      <div className="reportes__header">
        <div>
          <h1 className="reportes__titulo">Reportes</h1>
          <p className="reportes__subtitulo">
            Resumen del desempeño de la farmacia por categoría.
          </p>
        </div>

        <button className="reportes__exportar" type="button">
          <Download size={16} strokeWidth={2.2} />
          Exportar
        </button>
      </div>

      <nav className="reportes__tabs" aria-label="Categorías de reportes">
        {REPORTES.map((r) => {
          const Icono = r.icono;
          return (
            <NavLink
              key={r.to}
              to={r.to}
              end={r.end}
              className={({ isActive }) =>
                `reportes__tab${isActive ? ' reportes__tab--active' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icono size={16} strokeWidth={2.2} />
                  <span>{r.label}</span>
                  {isActive && (
                    <motion.span
                      className="reportes__tab-indicador"
                      layoutId="reportes-tab-indicador"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <motion.div
        className="reportes__contenido"
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <Outlet />
      </motion.div>
    </div>
  );
}