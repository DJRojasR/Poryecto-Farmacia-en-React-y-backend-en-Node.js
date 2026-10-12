// comprobantes/lib/generar_pdf.js
// Dibuja el comprobante del pedido en un PDF de una página (A4) con pdf-lib.
// pdf-lib es JavaScript puro: no necesita navegador ni programas instalados,
// por eso funciona dentro de una función serverless.
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const VERDE = rgb(0.086, 0.639, 0.29);
const GRIS = rgb(0.42, 0.45, 0.5);
const NEGRO = rgb(0.12, 0.16, 0.22);
const LINEA = rgb(0.9, 0.91, 0.92);

// Las fuentes estándar del PDF solo tienen caracteres "occidentales" (tildes y ñ sí).
// Cualquier otro carácter (emojis, etc.) se reemplaza para que el PDF no falle.
const limpiar = (v, max = 80) =>
  String(v ?? '')
    .replace(/[^\x20-\x7E -ÿ]/g, '?')
    .slice(0, max);

const soles = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

function fechaLima(iso) {
  const d = iso ? new Date(iso) : new Date();
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  }).format(Number.isNaN(d.getTime()) ? new Date() : d);
}

/** Devuelve los bytes (Uint8Array) del PDF. `p` son los datos del evento pedido.pagado. */
export async function generarComprobante(p) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Comprobante ${limpiar(p.codigo)}`);
  pdf.setAuthor('Farmacia San Marcos');
  pdf.setCreator('Función serverless de comprobantes');

  const pagina = pdf.addPage([595.28, 841.89]); // A4
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width } = pagina.getSize();
  const margen = 50;
  let y = 790;

  const texto = (t, x, yy, { tam = 10, fuente = normal, color = NEGRO } = {}) =>
    pagina.drawText(limpiar(t, 120), { x, y: yy, size: tam, font: fuente, color });
  const derecha = (t, xDer, yy, opts = {}) => {
    const fuente = opts.fuente ?? normal;
    const tam = opts.tam ?? 10;
    texto(t, xDer - fuente.widthOfTextAtSize(limpiar(t, 120), tam), yy, opts);
  };

  // ---------- Encabezado ----------
  pagina.drawRectangle({ x: 0, y: 760, width, height: 82, color: VERDE });
  texto('Farmacia San Marcos', margen, 805, { tam: 20, fuente: negrita, color: rgb(1, 1, 1) });
  texto('Comprobante de pago (documento de prueba, sin valor tributario)', margen, 785, { tam: 9, color: rgb(1, 1, 1) });
  derecha(p.codigo, width - margen, 805, { tam: 14, fuente: negrita, color: rgb(1, 1, 1) });

  // ---------- Datos del pedido ----------
  y = 725;
  const entrega = p.entrega === 'delivery' ? `Delivery: ${p.direccion ?? '-'}` : 'Recojo en tienda';
  const filasDatos = [
    ['Cliente', p.cliente?.nombre || 'Cliente'],
    ['Correo', p.cliente?.email || '-'],
    ['Fecha de pago', fechaLima(p.pagadoEn)],
    ['Entrega', entrega],
    ['Estado', 'PAGADO'],
  ];
  for (const [etiqueta, valor] of filasDatos) {
    texto(etiqueta, margen, y, { fuente: negrita, color: GRIS });
    texto(valor, margen + 110, y);
    y -= 18;
  }

  // ---------- Tabla de productos ----------
  y -= 14;
  const colCant = 360;
  const colPrecio = 450;
  const colSub = width - margen;
  pagina.drawRectangle({ x: margen - 6, y: y - 6, width: width - 2 * margen + 12, height: 22, color: rgb(0.95, 0.96, 0.97) });
  texto('Producto', margen, y, { fuente: negrita });
  derecha('Cant.', colCant, y, { fuente: negrita });
  derecha('P. unit.', colPrecio, y, { fuente: negrita });
  derecha('Subtotal', colSub, y, { fuente: negrita });
  y -= 24;

  const items = (Array.isArray(p.items) ? p.items : []).slice(0, 25);
  for (const i of items) {
    texto(limpiar(i.nombre, 55), margen, y);
    derecha(String(i.cantidad ?? ''), colCant, y);
    derecha(soles(i.precio), colPrecio, y);
    derecha(soles(i.subtotal), colSub, y);
    pagina.drawLine({ start: { x: margen, y: y - 7 }, end: { x: width - margen, y: y - 7 }, thickness: 0.5, color: LINEA });
    y -= 20;
  }

  // ---------- Total ----------
  y -= 8;
  derecha('TOTAL', colPrecio, y, { tam: 12, fuente: negrita });
  derecha(soles(p.total), colSub, y, { tam: 12, fuente: negrita, color: VERDE });

  // ---------- Pie ----------
  texto('Gracias por tu compra. Pago procesado con Stripe (modo de prueba).', margen, 70, { tam: 9, color: GRIS });
  texto(`Generado por una función serverless el ${fechaLima()}`, margen, 56, { tam: 8, color: GRIS });

  return pdf.save();
}
