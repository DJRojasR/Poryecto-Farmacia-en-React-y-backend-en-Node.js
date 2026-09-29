import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;
const CLAVE = 'bsm_session';

const AuthContext = createContext(null);

function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE)) || null;
  } catch {
    return null;
  }
}

async function peticion(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new Error('No hay conexión con el servidor. Revisa que el backend esté encendido.');
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const error = new Error(datos.mensaje || 'Ocurrió un error. Inténtalo de nuevo.');
    error.campo = datos.campo;
    error.status = respuesta.status;
    throw error;
  }
  return datos;
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesion);
  // Si hay token guardado, se confirma con el servidor antes de dejar pasar a rutas protegidas
  const [cargando, setCargando] = useState(() => Boolean(leerSesion()?.token));

  const guardar = useCallback((nueva) => {
    if (nueva) localStorage.setItem(CLAVE, JSON.stringify(nueva));
    else localStorage.removeItem(CLAVE);
    setSesion(nueva);
  }, []);

  useEffect(() => {
    const guardada = leerSesion();
    if (!guardada?.token) return;
    peticion('/auth/me', { token: guardada.token })
      .then(({ usuario }) => guardar({ token: guardada.token, usuario }))
      .catch((err) => {
        // Solo se cierra la sesión si el servidor la rechaza (no si está apagado)
        if (err.status === 401 || err.status === 403) guardar(null);
      })
      .finally(() => setCargando(false));
  }, [guardar]);

  const login = useCallback(async (email, password) => {
    const { token, usuario } = await peticion('/auth/login', { metodo: 'POST', cuerpo: { email, password } });
    guardar({ token, usuario });
    return usuario;
  }, [guardar]);

  const registrar = useCallback(async (nombre, email, password) => {
    const { token, usuario } = await peticion('/auth/registro', { metodo: 'POST', cuerpo: { nombre, email, password } });
    guardar({ token, usuario });
    return usuario;
  }, [guardar]);

  const logout = useCallback(() => guardar(null), [guardar]);

  const valor = useMemo(
    () => ({
      user: sesion?.usuario || null,
      token: sesion?.token || null,
      cargando,
      login,
      registrar,
      logout,
    }),
    [sesion, cargando, login, registrar, logout]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return contexto;
}