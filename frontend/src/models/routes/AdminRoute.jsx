// src/models/routes/AdminRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Sin sesión -> al login. Con sesión pero sin rol admin -> al inicio.
export default function AdminRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (user.rol !== 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}