import rateLimit from 'express-rate-limit';

const base = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
};

// Tope general para toda la API
export const limiteGeneral = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: { mensaje: 'Demasiadas solicitudes. Espera unos minutos e inténtalo de nuevo.' },
});

// Login: 10 intentos FALLIDOS cada 15 min por IP (los exitosos no cuentan)
export const limiteLogin = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: { mensaje: 'Demasiados intentos de inicio de sesión. Espera 15 minutos.' },
});

// Registro: 5 cuentas por hora por IP
export const limiteRegistro = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: { mensaje: 'Demasiados registros desde tu conexión. Inténtalo más tarde.' },
});