// backend/models/models_pagos.js
// Pago de pedidos web con Stripe (PaymentIntents).
// Regla de oro: el pedido se marca "pagado" SOLO cuando el SERVIDOR le pregunta a Stripe
// y Stripe responde 'succeeded' por el monto exacto. Nunca porque el navegador lo diga.
import { ErrorNegocio } from '../helpers/errores.js';
import { MONEDA, aCentimos, conStripe } from '../helpers/stripe.js';
import { PedidoModel } from './models_pedidos.js';

// El cobro en Stripe debe ser exactamente el de este pedido
const corresponde = (pi, p) =>
  pi.metadata?.pedido_id === String(p.id) && pi.amount === aCentimos(p.total) && pi.currency === MONEDA;

async function reembolsar(p) {
  await conStripe((s) =>
    s.refunds.create({ payment_intent: p.stripe_payment_intent_id }, { idempotencyKey: `reembolso-pedido-${p.id}` })
  );
  await PedidoModel.marcarReembolsado(p.id);
}

export const PagoModel = {
  /**
   * Prepara el cobro. Devuelve { clientSecret } para que el navegador muestre el
   * formulario de tarjeta de Stripe, o { yaPagado: true } si ya estaba cobrado.
   * null = el pedido no existe o no es de este usuario.
   */
  async iniciar(pedidoId, usuarioId) {
    const p = await PedidoModel.datosPago(pedidoId);
    if (!p || p.usuario_id !== usuarioId || p.canal !== 'web') return null;
    if (p.pago_estado === 'pagado') return { yaPagado: true };
    if (p.estado !== 'pendiente' || p.pago_estado !== 'pendiente') {
      throw new ErrorNegocio(409, 'Este pedido ya no se puede pagar.');
    }

    let pi = null;
    if (p.stripe_payment_intent_id) {
      pi = await conStripe((s) => s.paymentIntents.retrieve(p.stripe_payment_intent_id));
      if (pi.status === 'succeeded' && corresponde(pi, p)) {
        // Pagó pero cerró la pestaña antes de confirmar: se pone al día
        await PedidoModel.marcarPagado(p.id);
        return { yaPagado: true };
      }
      if (pi.status === 'canceled' || !corresponde(pi, p)) pi = null;
    }

    if (!pi) {
      pi = await conStripe((s) =>
        s.paymentIntents.create(
          {
            amount: aCentimos(p.total), // el monto sale de la BD, no del cliente
            currency: MONEDA,
            automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
            description: `Farmacia San Marcos - pedido ${p.id}`,
            metadata: { pedido_id: String(p.id) },
          },
          // Si llegan dos solicitudes a la vez, Stripe crea un solo cobro
          { idempotencyKey: `pedido-${p.id}-${p.stripe_payment_intent_id ?? 'nuevo'}` }
        )
      );
      await PedidoModel.guardarPaymentIntent(p.id, pi.id);
    }
    return { clientSecret: pi.client_secret };
  },

  /**
   * El navegador avisa "ya pagué": el servidor lo VERIFICA con Stripe.
   * Devuelve true si quedó pagado; null si el pedido no es del usuario.
   */
  async confirmar(pedidoId, usuarioId) {
    const p = await PedidoModel.datosPago(pedidoId);
    if (!p || p.usuario_id !== usuarioId || p.canal !== 'web') return null;
    if (p.pago_estado === 'pagado') return true;
    if (!p.stripe_payment_intent_id) throw new ErrorNegocio(409, 'Este pedido no tiene un pago iniciado.');

    const pi = await conStripe((s) => s.paymentIntents.retrieve(p.stripe_payment_intent_id));
    if (!corresponde(pi, p)) throw new ErrorNegocio(409, 'El pago no corresponde a este pedido.');
    if (pi.status !== 'succeeded') throw new ErrorNegocio(402, 'El pago todavía no se completó.');

    if (p.estado === 'cancelado') {
      // Caso raro: pagó justo cuando el pedido venció. Se le devuelve el dinero.
      if (p.pago_estado !== 'reembolsado') await reembolsar(p);
      throw new ErrorNegocio(409, 'El pedido se había cancelado por falta de pago. Te devolvimos el cobro; vuelve a hacer el pedido.');
    }

    await PedidoModel.marcarPagado(p.id);
    return true;
  },

  /**
   * Llamar DESPUÉS de cancelar un pedido: devuelve el dinero si estaba pagado,
   * o anula el cobro pendiente para que ya no se pueda pagar.
   * No lanza errores: el pedido ya está cancelado; si Stripe falla queda en el log
   * y el pedido se ve como "cancelado + pagado" (reembolso pendiente).
   */
  async alCancelar(pedidoId) {
    try {
      const p = await PedidoModel.datosPago(pedidoId);
      if (!p?.stripe_payment_intent_id) return;

      if (p.pago_estado === 'pagado') return await reembolsar(p);
      if (p.pago_estado !== 'pendiente') return;

      const pi = await conStripe((s) => s.paymentIntents.retrieve(p.stripe_payment_intent_id));
      if (pi.status === 'succeeded') return await reembolsar(p); // pagó en el último segundo
      if (pi.status !== 'canceled') {
        await conStripe((s) => s.paymentIntents.cancel(p.stripe_payment_intent_id));
      }
    } catch (err) {
      console.error(`Pedido ${pedidoId} cancelado, pero falló el reembolso/anulación en Stripe:`, err.message);
    }
  },

  /**
   * Tarea periódica: los pedidos web sin pagar retienen stock. Pasados X minutos se cancelan
   * (el stock vuelve). Antes se revisa en Stripe por si el cliente sí pagó y no avisó.
   */
  async cancelarImpagosVencidos(minutos) {
    const ids = await PedidoModel.impagosVencidos(minutos);
    let cancelados = 0;
    for (const id of ids) {
      try {
        const p = await PedidoModel.datosPago(id);
        if (p.stripe_payment_intent_id) {
          const pi = await conStripe((s) => s.paymentIntents.retrieve(p.stripe_payment_intent_id));
          if (pi.status === 'succeeded' && corresponde(pi, p)) {
            await PedidoModel.marcarPagado(id);
            continue;
          }
        }
        await PedidoModel.cambiarEstado(id, 'cancelado', { canal: 'web', desde: ['pendiente'] });
        await this.alCancelar(id);
        cancelados += 1;
      } catch (err) {
        console.error(`No se pudo liberar el pedido impago ${id}:`, err.message);
      }
    }
    return cancelados;
  },
};