// src/components/Auth/Pago/PagoStripe.jsx
// Formulario de tarjeta de Stripe para pagar un pedido ya creado.
// La tarjeta la escribe el cliente dentro de un iframe de Stripe: el número nunca
// pasa por nuestro frontend ni por nuestro backend.
//
// Requiere:  npm i @stripe/stripe-js @stripe/react-stripe-js
// y en el .env del frontend:  VITE_STRIPE_PUBLIC_KEY=pk_test_...
import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { CreditCard, Lock } from 'lucide-react';
import { useAuth } from '../../../models/context/AuthContext.jsx';
import { confirmarPago, iniciarPago } from '../../../models/helpers/pedidos_api.js';
import './PagoStripe.css';

const CLAVE_PUBLICA = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const ES_PRUEBA = CLAVE_PUBLICA?.startsWith('pk_test_');
// Se carga una sola vez para toda la app
const stripePromise = CLAVE_PUBLICA ? loadStripe(CLAVE_PUBLICA) : null;

const APARIENCIA = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#1e4066',
    colorText: '#24262b',
    colorDanger: '#b91c1c',
    borderRadius: '10px',
    fontFamily: 'Inter, sans-serif',
  },
};

function Formulario({ pedido, token, onPagado }) {
  const stripe = useStripe();
  const elements = useElements();
  const [listo, setListo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const pagar = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || enviando) return;
    setEnviando(true);
    setError('');
    try {
      // 1. Stripe cobra la tarjeta (si pide verificación 3D Secure, la muestra aquí mismo)
      const { error: errorStripe, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/mis-compras` },
        redirect: 'if_required',
      });
      if (errorStripe) {
        setError(errorStripe.message || 'No se pudo procesar la tarjeta.');
        return;
      }
      if (paymentIntent?.status !== 'succeeded') {
        setError('El pago no se completó. Inténtalo de nuevo.');
        return;
      }
      // 2. Nuestro servidor lo verifica con Stripe y marca el pedido como pagado
      onPagado(await confirmarPago(token, pedido.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="pago__form" onSubmit={pagar}>
      <PaymentElement onReady={() => setListo(true)} />
      {error && <p className="pago__error" role="alert">{error}</p>}
      <button type="submit" className="btn btn--primary btn--full" disabled={!stripe || !listo || enviando}>
        <Lock size={16} aria-hidden="true" />
        {enviando ? 'Procesando pago…' : `Pagar S/ ${Number(pedido.total).toFixed(2)}`}
      </button>
    </form>
  );
}

/**
 * pedido: el pedido a pagar (necesita id y total)
 * onPagado(pedidoActualizado): se llama cuando el servidor confirmó el pago
 */
export default function PagoStripe({ pedido, onPagado }) {
  const { token } = useAuth();
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!CLAVE_PUBLICA) return undefined;
    let vigente = true;
    setError('');
    iniciarPago(token, pedido.id)
      .then((r) => {
        if (!vigente) return;
        if (r.yaPagado) onPagado(r.pedido);
        else setClientSecret(r.clientSecret);
      })
      .catch((e) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
    // onPagado no va en dependencias: cambia en cada render del padre y repetiría la llamada
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, pedido.id, intento]);

  if (!CLAVE_PUBLICA) {
    return (
      <p className="pago__error">
        El pago con tarjeta no está configurado: falta VITE_STRIPE_PUBLIC_KEY en el .env del frontend.
      </p>
    );
  }

  return (
    <div className="pago">
      <p className="pago__titulo">
        <CreditCard size={18} aria-hidden="true" /> Pago con tarjeta
      </p>

      {ES_PRUEBA && (
        <p className="pago__prueba">
          <strong>Modo de prueba:</strong> usa la tarjeta <code>4242 4242 4242 4242</code>, cualquier fecha
          futura y cualquier CVC. No se cobra dinero real.
        </p>
      )}

      {error ? (
        <>
          <p className="pago__error" role="alert">{error}</p>
          <button type="button" className="btn btn--ghost btn--full" onClick={() => setIntento((n) => n + 1)}>
            Reintentar
          </button>
        </>
      ) : !clientSecret ? (
        <p className="pago__cargando">Preparando el pago…</p>
      ) : (
        <Elements
          key={clientSecret}
          stripe={stripePromise}
          options={{ clientSecret, appearance: APARIENCIA, locale: 'es' }}
        >
          <Formulario pedido={pedido} token={token} onPagado={onPagado} />
        </Elements>
      )}
    </div>
  );
}