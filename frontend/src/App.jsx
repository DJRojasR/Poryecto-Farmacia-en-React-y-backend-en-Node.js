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
import MisCompras from './components/Auth/Compras/Compras.jsx';
import Carrito from './components/Auth/Cart/Carrito.jsx';
import { useAuth} from './models/context/AuthContext.jsx';

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

      {/* Rutas de pantalla completa, sin Navbar ni Footer */}
      <Route path="/login" element={<Login />} />
    </Routes>
  );
};

export default App;