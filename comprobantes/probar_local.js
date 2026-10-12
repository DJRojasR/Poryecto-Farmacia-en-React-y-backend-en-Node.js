// comprobantes/probar_local.js
// Prueba la función SIN Vercel: la llama como lo haría Vercel y guarda el PDF.
//   npm install
//   npm run probar        -> crea comprobante-prueba.pdf en esta carpeta
import { writeFile } from 'node:fs/promises';
import funcion from './api/comprobante.js';

process.env.COMPROBANTE_API_KEY ||= 'clave-de-prueba-local-1234';

const pedido = {
  pedidoId: 12,
  codigo: 'FSM-000012',
  cliente: { nombre: 'Ana Pérez', email: 'ana@correo.com' },
  total: 7.5,
  moneda: 'PEN',
  entrega: 'recojo',
  pagadoEn: new Date().toISOString(),
  items: [
    { nombre: 'Paracetamol 500 mg x 20 tabletas', cantidad: 2, precio: 2.5, subtotal: 5 },
    { nombre: 'Alcohol en gel 250 ml', cantidad: 1, precio: 2.5, subtotal: 2.5 },
  ],
};

const respuesta = await funcion.fetch(
  new Request('http://localhost/api/comprobante', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.COMPROBANTE_API_KEY },
    body: JSON.stringify(pedido),
  })
);

if (!respuesta.ok) {
  console.error('Error', respuesta.status, await respuesta.text());
  process.exit(1);
}
await writeFile('comprobante-prueba.pdf', Buffer.from(await respuesta.arrayBuffer()));
console.log('✅ Listo: abre comprobante-prueba.pdf');
