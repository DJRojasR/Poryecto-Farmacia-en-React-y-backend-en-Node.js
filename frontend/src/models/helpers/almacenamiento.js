// Lectura y escritura segura en localStorage (no rompe si el navegador lo bloquea)

export const leerJSON = (clave, respaldo = null) => {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? JSON.parse(crudo) : respaldo;
  } catch {
    return respaldo;
  }
};

export const guardarJSON = (clave, valor) => {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Sin almacenamiento disponible: los datos duran solo mientras la pestaña esté abierta
  }
};

export const borrarClave = (clave) => {
  try {
    localStorage.removeItem(clave);
  } catch {
    // Nada que hacer
  }
};