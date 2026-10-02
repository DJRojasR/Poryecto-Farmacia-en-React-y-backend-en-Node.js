// backend/helpers/stripe.js
// Cliente de Stripe. La clave secreta vive SOLO en el .env del backend (STRIPE_SECRET_KEY).
import Stripe from 'stripe';
import { ErrorNegocio } from './errores.js';

export const MONEDA = 'pen'; // soles

// Stripe trabaja en céntimos enteros: S/ 47.50 -> 4750
export const aCentimos = (total) => Math.round(Number(total) * 100);

let cliente = null;

export function stripe() {
  if (cliente) return cliente;
  const clave = process.env.STRIPE_SECRET_KEY || '';
  if (!clave) {
    throw new ErrorNegocio(503, 'El pago con tarjeta no está configurado (falta STRIPE_SECRET_KEY en el .env).');
  }
  // Seguro para el MVP: con una clave real (sk_live_) se cobraría dinero de verdad
  if (!clave.startsWith('sk_test_') && process.env.STRIPE_PERMITIR_LIVE !== 'true') {
    throw new ErrorNegocio(503, 'Solo se permite Stripe en modo de prueba: usa una clave sk_test_...');
  }
  cliente = new Stripe(clave);
  return cliente;
}

// Envuelve una llamada a Stripe: si falla, mensaje claro para el usuario y detalle en la consola
export async function conStripe(fn) {
  try {
    return await fn(stripe());
  } catch (err) {
    if (err instanceof ErrorNegocio) throw err;
    console.error('Stripe:', err.type || err.name, err.message);
    throw new ErrorNegocio(502, 'No pudimos comunicarnos con el procesador de pagos. Inténtalo de nuevo.');
  }
}