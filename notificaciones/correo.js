// notificaciones/correo.js
// Envío de correos. Elige el modo según el .env (en este orden):
//  1. BREVO_API_KEY -> API HTTP de Brevo (correo REAL). Funciona en Render gratis,
//                      porque Render bloquea los puertos SMTP (25/465/587) en el plan Free.
//  2. SMTP_HOST     -> servidor SMTP (p. ej. Gmail). Correo REAL, pero solo funciona en tu PC.
//  3. (nada)        -> Ethereal: correo de PRUEBA, no llega a nadie; se ve en un enlace.
import nodemailer from 'nodemailer';

let transporte = null;
let modo = 'sin_iniciar';

// "Farmacia San Marcos <correo@x.com>" -> { name, email }
function remitente() {
  const texto = process.env.CORREO_REMITENTE || 'Farmacia San Marcos <no-responder@farmaciasanmarcos.pe>';
  const m = texto.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  return m ? { name: m[1].trim() || 'Farmacia San Marcos', email: m[2].trim() } : { name: 'Farmacia San Marcos', email: texto.trim() };
}

async function enviarPorBrevo({ para, asunto, html, texto }) {
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sender: remitente(), to: [{ email: para }], subject: asunto, htmlContent: html, textContent: texto }),
    signal: AbortSignal.timeout(15_000),
  });
  const cuerpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Brevo respondió ${r.status}: ${cuerpo.message || 'error'}`);
  return { messageId: cuerpo.messageId ?? null, vistaPrevia: null };
}

async function obtenerTransporte() {
  if (transporte) return transporte;

  if (process.env.SMTP_HOST) {
    const puerto = Number(process.env.SMTP_PORT) || 587;
    transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: puerto,
      secure: puerto === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    modo = 'smtp';
  } else {
    const cuenta = await nodemailer.createTestAccount();
    transporte = nodemailer.createTransport({
      host: cuenta.smtp.host,
      port: cuenta.smtp.port,
      secure: cuenta.smtp.secure,
      auth: { user: cuenta.user, pass: cuenta.pass },
    });
    modo = 'ethereal';
    console.log('✉️  Correo en modo PRUEBA (Ethereal): los correos no llegan a nadie real.');
  }
  return transporte;
}

export const modoCorreo = () => (process.env.BREVO_API_KEY ? 'brevo' : modo);

/** Envía el correo. Devuelve { messageId, vistaPrevia } (vistaPrevia solo en modo Ethereal). */
export async function enviarCorreo(correo) {
  if (process.env.BREVO_API_KEY) return enviarPorBrevo(correo);

  const { para, asunto, html, texto } = correo;
  const t = await obtenerTransporte();
  const r = remitente();
  const info = await t.sendMail({ from: { name: r.name, address: r.email }, to: para, subject: asunto, text: texto, html });
  return { messageId: info.messageId, vistaPrevia: nodemailer.getTestMessageUrl(info) || null };
}