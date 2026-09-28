// src/components/Admin/AdminRoutes.jsx
import { Routes, Route } from 'react-router-dom';

import Dashboard from './Dashboard/Dashboard.jsx';
import ProductosAdmin from './Productos/Productos.jsx';
import Inventario from './Inventario/Inventario.jsx';
import Ventas from './Ventas/Ventas.jsx';
import Pedidos from './Pedidos/Pedidos.jsx';
import Usuarios from './Usuarios/Usuarios.jsx';
import Proveedores from './Proveedores/Proveedores.jsx';
import Reportes from './Reportes/Reportes.jsx';
import ReporteVentas from './Reportes/Ventas/Ventas.jsx';
import Stock from './Reportes/Stock/Stock.jsx';
import MasVendidos from './Reportes/MasVendidos/MasVendidos.jsx';
import ProximosVencer from './Reportes/ProximosVencer/ProximosVencer.jsx';
import Compras from './Reportes/Compras/Compras.jsx';
import Ingresos from './Reportes/Ingresos/Ingresos.jsx';
import Resumen from './Reportes/Resumen/Resumen.jsx';

export default function AdminRoutes() {
  return (
    <Routes>
      {/* /Admin  y  /Admin/dashboard  → Dashboard */}
      <Route index element={<Dashboard />} />
      <Route path="dashboard" element={<Dashboard />} />

      <Route path="productos" element={<ProductosAdmin />} />
      <Route path="inventario" element={<Inventario />} />
      <Route path="ventas" element={<Ventas />} />
      <Route path="pedidos" element={<Pedidos />} />
      <Route path="usuarios" element={<Usuarios />} />
      <Route path="proveedores" element={<Proveedores />} />

      <Route path="reportes" element={<Reportes />}>
        <Route index element={<Resumen />} />
        <Route path="ventas" element={<ReporteVentas />} />
        <Route path="stock" element={<Stock />} />
        <Route path="mas-vendidos" element={<MasVendidos />} />
        <Route path="proximos-vencer" element={<ProximosVencer />} />
        <Route path="compras" element={<Compras />} />
        <Route path="ingresos" element={<Ingresos />} />
      </Route>
    </Routes>
  );
}