import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

// A dónde va cada rol tras iniciar sesión
export const rutaInicioPorRol = (usuario) => (usuario?.rol === 'admin' ? '/admin' : '/');

function Verificando() {
  return (
    <div role="status" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      Verificando tu sesión…
    </div>
  );
}

/**
 * Ruta protegida genérica.
 * - Sin sesión → /login (recordando a dónde quería ir).
 * - Con sesión pero rol no permitido → a su vista de inicio.
 */
export function RutaProtegida({ roles }) {
  const { user, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return <Verificando />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.rol)) return <Navigate to={rutaInicioPorRol(user)} replace />;

  return <Outlet />;
}

// Vistas del administrador (/admin/...)
export const RutaAdmin = () => <RutaProtegida roles={['admin']} />;

// Vistas que requieren sesión de usuario normal (carrito, mis compras, perfil)
export const RutaCliente = () => <RutaProtegida roles={['cliente']} />;