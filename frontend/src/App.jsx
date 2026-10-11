// src/App.jsx
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer/Footer.jsx';
import Inicio from './components/Inicio/Inicio.jsx';
import Productos from './components/Productos/Productos.jsx';
import Nosotros from './components/Nosotros/Nosotros.jsx';
import Contacto from './components/Contacto/Contacto.jsx';
import Login from './components/Auth/Login.jsx';
import Registro from './components/Auth/Registro.jsx';
import ProtectedRoute from './models/routes/ProtectedRoute.jsx';
import AdminRoute from './models/routes/AdminRoute.jsx';
import MisCompras from './components/Auth/Compras/Compras.jsx';
import Carrito from './components/Auth/Cart/Carrito.jsx';
import { useAuth } from './models/context/AuthContext.jsx';
import AdminLayout from './components/Admin/AdminLayout.jsx';
import AdminRoutes from './components/Admin/AdminRoutes.jsx';

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

const InicioSegunRol = () => {
  const { user } = useAuth();
  return user?.rol === 'admin' ? <Navigate to="/admin" replace /> : <Inicio />;
};

const App = () => {
  return (
    <Routes>
      {/* Rutas con Navbar y Footer */}
      <Route element={<LayoutPrincipal />}>
        <Route path="/" element={<InicioSegunRol />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route
          path="/mis-compras"
          element={
            <ProtectedRoute>
              <MisCompras />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<h2 style={{ padding: '2rem' }}>Página no encontrada</h2>} />
      </Route>

      {/* Login y Registro: pantalla completa, sin Navbar ni Footer */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* Admin */}
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="*" element={<AdminRoutes />} />
      </Route>
    </Routes>
  );
};

export default App;