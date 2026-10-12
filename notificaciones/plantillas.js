// notificaciones/plantillas.js
// Arma el asunto y el cuerpo (HTML + texto) del correo según el tipo de evento.

// Los datos vienen de otro servicio: se escapan antes de meterlos en HTML
const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const soles = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

const TEXTOS = {
  'pedido.creado': {
    asunto: (d) => `Recibimos tu pedido ${d.codigo}`,
    titulo: 'Recibimos tu pedido',
    mensaje: 'Tu pedido está reservado. Completa el pago en los próximos 30 minutos para confirmarlo; si no, se cancelará solo y los productos volverán a estar disponibles.',
    color: '#0ea5e9',
  },
  'pedido.pagado': {
    asunto: (d) => `Pago confirmado - pedido ${d.codigo}`,
    titulo: '¡Pago confirmado!',
    mensaje: 'Gracias por tu compra. Ya estamos preparando tu pedido.',
    color: '#16a34a',
  },
  'pedido.cancelado': {
    asunto: (d) => `Pedido ${d.codigo} cancelado`,
    titulo: 'Tu pedido fue cancelado',
    mensaje: 'Si ya habías pagado, el reembolso se procesa automáticamente a tu tarjeta.',
    color: '#dc2626',
  },
};

export const tiposSoportados = Object.keys(TEXTOS);

export function armarCorreo(tipo, d, { conComprobante = false } = {}) {
  const t = TEXTOS[tipo];
  if (!t) return null;
  const mensaje = conComprobante ? `${t.mensaje} Adjuntamos tu comprobante en PDF.` : t.mensaje;

  const items = Array.isArray(d.items) ? d.items : [];
  const entrega = d.entrega === 'delivery' ? `Delivery a: ${d.direccion ?? '-'}` : 'Recojo en tienda';

  const filas = items
    .map(
      (i) => `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${esc(i.nombre)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${esc(i.cantidad)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${esc(soles(i.subtotal))}</td>
      </tr>`
    )
    .join('');

  const html = `<!doctype html>
<html lang="es"><body style="margin:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:10px;overflow:hidden">
    <div style="background:${t.color};color:#fff;padding:18px 24px">
      <div style="font-size:13px;opacity:.9">Farmacia San Marcos</div>
      <div style="font-size:22px;font-weight:bold">${esc(t.titulo)}</div>
    </div>
    <div style="padding:20px 24px">
      <p>Hola ${esc(d.cliente?.nombre || 'cliente')},</p>
      <p>${esc(mensaje)}</p>
      <p style="margin:16px 0 8px"><b>Pedido:</b> ${esc(d.codigo)}<br><b>Entrega:</b> ${esc(entrega)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead><tr style="background:#f3f4f6">
          <th style="padding:6px 8px;text-align:left">Producto</th>
          <th style="padding:6px 8px">Cant.</th>
          <th style="padding:6px 8px;text-align:right">Subtotal</th>
        </tr></thead>
        <tbody>${filas}</tbody>
        <tfoot><tr>
          <td colspan="2" style="padding:8px;text-align:right"><b>Total</b></td>
          <td style="padding:8px;text-align:right"><b>${esc(soles(d.total))}</b></td>
        </tr></tfoot>
      </table>
    </div>
    <div style="padding:12px 24px;background:#f9fafb;font-size:12px;color:#6b7280">
      Correo automático enviado por el microservicio de notificaciones. No respondas a este mensaje.
    </div>
  </div>
</body></html>`;

  const texto = [
    `Farmacia San Marcos - ${t.titulo}`,
    `Hola ${d.cliente?.nombre || 'cliente'},`,
    mensaje,
    `Pedido: ${d.codigo}`,
    `Entrega: ${entrega}`,
    ...items.map((i) => `- ${i.nombre} x${i.cantidad}: ${soles(i.subtotal)}`),
    `Total: ${soles(d.total)}`,
  ].join('\n');

  return { asunto: t.asunto(d), html, texto };
}
