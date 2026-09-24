import { Routes, Route, Outlet } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer/Footer.jsx';
import Inicio from './components/Inicio/Inicio.jsx';
import Productos from './components/Productos/Productos.jsx';
import Nosotros from './components/Nosotros/Nosotros.jsx';
import Contacto from './components/Contacto/Contacto.jsx';
import Login from './components/Auth/Login.jsx';
import ProtectedRoute from './models/routes/ProtectedRoute.jsx';
import AdminRoute from './models/routes/AdminRoute.jsx';
import MisCompras from './components/Auth/Compras/Compras.jsx';
import Carrito from './components/Auth/Cart/Carrito.jsx';
import { useAuth } from './models/context/AuthContext.jsx';
import AdminLayout from './components/Admin/AdminLayout.jsx';
import Dashboard from './components/Admin/Dashboard/Dashboard.jsx';
import ProductosAdmin from './components/Admin/Productos/Productos.jsx';
import Inventario from './components/Admin/Inventario/Inventario.jsx';
import Ventas from './components/Admin/Ventas/Ventas.jsx';
import Pedidos from './components/Admin/Pedidos/Pedidos.jsx';
import Usuarios from './components/Admin/Usuarios/Usuarios.jsx';
import Proveedores from './components/Admin/Proveedores/Proveedores.jsx';
import Reportes from './components/Admin/Reportes/Reportes.jsx';
import ReporteVentas from './components/Admin/Reportes/Ventas/Ventas.jsx';
import Stock from './components/Admin/Reportes/Stock/Stock.jsx';
import MasVendidos from './components/Admin/Reportes/MasVendidos/MasVendidos.jsx';
import ProximosVencer from './components/Admin/Reportes/ProximosVencer/ProximosVencer.jsx';
import Compras from './components/Admin/Reportes/Compras/Compras.jsx';
import Ingresos from './components/Admin/Reportes/Ingresos/Ingresos.jsx';
import Resumen from './components/Admin/Reportes/Resumen/Resumen.jsx';


const LayoutPrincipal = () => {
  const { user } = useAuth();

  return (
    <div className="app">
      <Navbar />
      <Outlet />
      <Footer />
      {user && <Carrito />}
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      {/* Rutas con Navbar y Footer */}
      <Route element={<LayoutPrincipal />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/mis-compras" element={ <ProtectedRoute> <MisCompras /></ProtectedRoute>}/>
        <Route path="*" element={<h2 style={{ padding: '2rem' }}>Página no encontrada</h2>} />
      </Route>

      {/* Login: pantalla completa, sin Navbar ni Footer */}
      <Route path="/login" element={<Login />} />

      {/* Panel de administración: su propio layout, sin Navbar ni Footer públicos */}
      <Route path="/Admin" element={ <AdminRoute> <AdminLayout /> </AdminRoute>}>
        <Route index element={<Dashboard />} />
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
      </Route>
    </Routes>
  );
};


export default App;