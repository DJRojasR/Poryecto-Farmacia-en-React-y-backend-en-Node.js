// notificaciones/comprobante.js
// Reto 5: pide el comprobante PDF a la función SERVERLESS (Vercel).
// Si la función falla o no está configurada, el correo se envía igual, sin el PDF
// (degradación elegante: un componente caído no tumba a los demás).

export async function pedirComprobante(datos) {
  const url = process.env.COMPROBANTE_URL;
  const clave = process.env.COMPROBANTE_API_KEY;
  if (!url || !clave) return null;

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': clave },
      body: JSON.stringify({ ...datos, pagadoEn: datos.pagadoEn ?? new Date().toISOString() }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) throw new Error(`la función respondió ${r.status}`);
    if (!String(r.headers.get('content-type')).includes('application/pdf')) throw new Error('la respuesta no es un PDF');

    const contenido = Buffer.from(await r.arrayBuffer());
    console.log(`   🧾 comprobante generado por la función serverless (${Math.round(contenido.length / 1024)} KB)`);
    return { nombre: `comprobante-${datos.codigo}.pdf`, contenido };
  } catch (err) {
    console.warn(`   ⚠️ comprobante no disponible (${err.message}); el correo sale sin PDF`);
    return null;
  }
}
