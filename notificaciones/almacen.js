// notificaciones/almacen.js
// Datos PROPIOS del microservicio (no toca la base de datos de la API).
// Guarda en memoria las últimas notificaciones y los IDs de eventos ya procesados.
// Es suficiente para la demo; en producción iría en su propia BD (p. ej. Redis o Postgres aparte).

const MAX_NOTIFICACIONES = 100;
const MAX_IDS = 1000;

const notificaciones = [];       // más reciente primero
const idsProcesados = new Set(); // para no enviar dos veces el mismo evento (idempotencia)
const contadores = { recibidos: 0, enviados: 0, fallidos: 0, duplicados: 0 };

/**
 * Reserva el ID del evento ANTES de procesarlo. Devuelve false si ya se procesó
 * o se está procesando (se reciben varios mensajes a la vez, así que se reserva primero).
 */
export function reservar(eventoId) {
  if (!eventoId) return true;
  if (idsProcesados.has(eventoId)) return false;
  idsProcesados.add(eventoId);
  if (idsProcesados.size > MAX_IDS) {
    // borra el más antiguo (los Set mantienen el orden de inserción)
    idsProcesados.delete(idsProcesados.values().next().value);
  }
  return true;
}

// Si el envío falló, se libera el ID para que un reintento futuro sí lo procese
export function liberar(eventoId) {
  if (eventoId) idsProcesados.delete(eventoId);
}

export function contar(campo) {
  contadores[campo] += 1;
}

export function registrar(notificacion) {
  notificaciones.unshift({ ...notificacion, registradoEn: new Date().toISOString() });
  if (notificaciones.length > MAX_NOTIFICACIONES) notificaciones.pop();
}

// El correo se muestra a medias: ana***@correo.com
export function ocultarEmail(email) {
  if (!email || !email.includes('@')) return email ?? null;
  const [usuario, dominio] = email.split('@');
  return `${usuario.slice(0, 3)}***@${dominio}`;
}

export function listar(limite = 50) {
  return notificaciones.slice(0, limite);
}

export function estadisticas() {
  return { ...contadores, enMemoria: notificaciones.length };
}
