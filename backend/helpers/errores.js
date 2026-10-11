// backend/helpers/errores.js
// Error "esperado" (regla de negocio): el controller lo convierte en respuesta HTTP
export class ErrorNegocio extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}
 