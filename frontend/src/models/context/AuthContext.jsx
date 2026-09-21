import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { borrarClave, guardarJSON, leerJSON } from '../helpers/almacenamiento.js';

const AuthContext = createContext(null);

const CLAVE_SESION = 'fsm_sesion';
const clavePerfil = (email) => `fsm_perfil_${email}`;

const nombreDesdeCorreo = (email) => {
  const base = email.split('@')[0].split(/[._-]/)[0] || 'Cliente';
  return base.charAt(0).toUpperCase() + base.slice(1);
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => leerJSON(CLAVE_SESION));

  // LOGIN DE PRUEBA: acepta cualquier correo y cualquier contraseña.
  // TODO (backend): reemplazar el cuerpo por la llamada real, por ejemplo
  // const res = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  const login = useCallback(async (email, password) => {
    await new Promise((resolver) => setTimeout(resolver, 900)); // simula la espera del servidor

    const correo = email.trim().toLowerCase();
    if (!correo || !password) {
      throw new Error('Completa tu correo y tu contraseña.');
    }

    const usuario = leerJSON(clavePerfil(correo)) ?? {
      nombre: nombreDesdeCorreo(correo),
      email: correo,
      telefono: '',
      direccion: '',
      distrito: '',
    };

    guardarJSON(CLAVE_SESION, usuario);
    setUser(usuario);
    return usuario;
  }, []);

  const logout = useCallback(() => {
    borrarClave(CLAVE_SESION);
    setUser(null);
  }, []);

  const actualizarPerfil = useCallback((cambios) => {
    setUser((actual) => {
      if (!actual) return actual;
      const nuevo = { ...actual, ...cambios };
      guardarJSON(CLAVE_SESION, nuevo);
      guardarJSON(clavePerfil(nuevo.email), nuevo);
      return nuevo;
    });
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, actualizarPerfil }),
    [user, login, logout, actualizarPerfil]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}