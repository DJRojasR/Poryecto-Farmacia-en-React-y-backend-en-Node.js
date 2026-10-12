// comprobantes/api/comprobante.js
// ============================================================================
// RETO 5 · SERVERLESS (Vercel Functions)
//
// Una sola función que hace una sola cosa: recibe los datos de un pedido pagado
// y devuelve su comprobante en PDF.
//   * No hay servidor encendido: Vercel la ejecuta solo cuando llega una petición
//     y la "apaga" al terminar (escala a cero; se paga/consume por uso).
//   * Si llegan muchas a la vez, Vercel lanza más instancias solo.
//   * No guarda nada: es "stateless" (todo lo que necesita viene en la petición).
//
//   Microservicio de notificaciones ──POST /api/comprobante──► [función] ──► PDF
//
//   GET  /api/comprobante  -> info / health
//   POST /api/comprobante  -> PDF   (cabecera x-api-key obligatoria)
// ============================================================================
import { timingSafeEqual } from 'node:crypto';
import { generarComprobante } from '../lib/generar_pdf.js';

const json = (status, cuerpo) => Response.json(cuerpo, { status });

function claveValida(request) {
  const esperada = process.env.COMPROBANTE_API_KEY || '';
  const recibida = request.headers.get('x-api-key') || '';
  if (esperada.length < 16 || recibida.length !== esperada.length) return false;
  return timingSafeEqual(Buffer.from(recibida), Buffer.from(esperada));
}

// Lo mínimo para no generar un PDF con basura
function validar(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return 'El cuerpo debe ser un objeto JSON.';
  if (typeof p.codigo !== 'string' || !/^[A-Z0-9-]{3,30}$/.test(p.codigo)) return 'Falta "codigo" (p. ej. FSM-000012).';
  if (!Number.isFinite(Number(p.total)) || Number(p.total) < 0) return 'Falta "total".';
  if (!Array.isArray(p.items) || p.items.length === 0 || p.items.length > 50) return '"items" debe tener entre 1 y 50 productos.';
  return null;
}

export default {
  async fetch(request) {
    if (request.method === 'GET') {
      return json(200, {
        ok: true,
        servicio: 'comprobantes',
        tipo: 'función serverless (Vercel)',
        uso: 'POST con los datos del pedido y la cabecera x-api-key -> devuelve un PDF',
      });
    }
    if (request.method !== 'POST') return json(405, { mensaje: 'Usa GET o POST.' });
    if (!claveValida(request)) return json(401, { mensaje: 'Falta la cabecera x-api-key o es incorrecta.' });

    const largo = Number(request.headers.get('content-length') || 0);
    if (largo > 50_000) return json(413, { mensaje: 'La solicitud es demasiado grande.' });

    let pedido;
    try {
      pedido = await request.json();
    } catch {
      return json(400, { mensaje: 'JSON inválido.' });
    }
    const error = validar(pedido);
    if (error) return json(400, { mensaje: error });

    try {
      const bytes = await generarComprobante(pedido);
      return new Response(bytes, {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `inline; filename="comprobante-${pedido.codigo}.pdf"`,
          'cache-control': 'no-store',
        },
      });
    } catch (err) {
      console.error('Error generando el PDF:', err);
      return json(500, { mensaje: 'No se pudo generar el comprobante.' });
    }
  },
};
