// src/models/context/AuthContext.jsx
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { borrarClave, guardarJSON, leerJSON } from '../helpers/almacenamiento.js';

const AuthContext = createContext(null);

const CLAVE_SESION = 'fsm_sesion';
const clavePerfil = (email) => `fsm_perfil_${email}`;

// Prueba: cualquier correo de esta lista entra como administrador.
// TODO (backend): el rol debe venir del servidor, nunca decidirse en el cliente.
const CORREOS_ADMIN = ['admin@gmail.com'];

const nombreDesdeCorreo = (email) => {
  const base = email.split('@')[0].split(/[._-]/)[0] || 'Cliente';
  return base.charAt(0).toUpperCase() + base.slice(1);
};

const rolDesdeCorreo = (email) => (CORREOS_ADMIN.includes(email) ? 'admin' : 'cliente');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => leerJSON(CLAVE_SESION));

  const login = useCallback(async (email, password) => {
    await new Promise((resolver) => setTimeout(resolver, 900));

    const correo = email.trim().toLowerCase();
    if (!correo || !password) {
      throw new Error('Completa tu correo y tu contraseña.');
    }

    const existente = leerJSON(clavePerfil(correo));
    const usuario = existente
      ? { ...existente, rol: existente.rol ?? rolDesdeCorreo(correo) }
      : {
          nombre: nombreDesdeCorreo(correo),
          email: correo,
          telefono: '',
          direccion: '',
          distrito: '',
          rol: rolDesdeCorreo(correo),
        };

    guardarJSON(CLAVE_SESION, usuario);
    guardarJSON(clavePerfil(correo), usuario); // así queda registrado aunque nunca edite su perfil
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