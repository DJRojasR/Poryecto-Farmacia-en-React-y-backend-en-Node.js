// backend/docs/openapi.js
// ============================================================================
// RETO 2 · SERVICIO WEB / API REST — contrato OpenAPI 3 del proceso crítico
// "Compra en línea: pedido + pago". Se muestra en http://localhost:4000/api/docs
// ============================================================================

const Error = {
  type: 'object',
  properties: { mensaje: { type: 'string', example: 'Stock insuficiente de "Paracetamol": solo quedan 3.' } },
};

const Item = {
  type: 'object',
  properties: {
    producto_id: { type: 'integer', example: 1 },
    nombre: { type: 'string', example: 'Paracetamol 500 mg x 20 tabletas' },
    precio: { type: 'number', example: 2.5 },
    cantidad: { type: 'integer', example: 2 },
    subtotal: { type: 'number', example: 5 },
    imagen: { type: 'string', nullable: true },
  },
};

const Pedido = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 12 },
    cliente_nombre: { type: 'string', example: 'Ana Pérez' },
    canal: { type: 'string', enum: ['web', 'mostrador'], example: 'web' },
    estado: { type: 'string', enum: ['pendiente', 'confirmado', 'en_camino', 'entregado', 'cancelado'] },
    pago_estado: { type: 'string', enum: ['pendiente', 'pagado', 'reembolsado'] },
    total: { type: 'number', example: 5 },
    metodo_pago: { type: 'string', nullable: true, example: 'tarjeta' },
    entrega: { type: 'string', enum: ['recojo', 'delivery'] },
    direccion: { type: 'string', nullable: true },
    telefono: { type: 'string', nullable: true },
    nota: { type: 'string', nullable: true },
    creado_en: { type: 'string', format: 'date-time' },
    pagado_en: { type: 'string', format: 'date-time', nullable: true },
    items: { type: 'array', items: { $ref: '#/components/schemas/Item' } },
  },
};

const respuesta = (descripcion, schema) => ({
  description: descripcion,
  content: { 'application/json': { schema } },
});
const err = (descripcion) => respuesta(descripcion, { $ref: '#/components/schemas/Error' });
const idParam = {
  name: 'id', in: 'path', required: true, description: 'Número del pedido', schema: { type: 'integer', example: 12 },
};

export const especificacion = {
  openapi: '3.0.3',
  info: {
    title: 'API Farmacia San Marcos — Proceso: compra en línea',
    version: '1.0.0',
    description: [
      'Servicio web REST del proceso crítico **pedido + pago**.',
      '',
      '**Flujo de la operación:**',
      '1. `POST /auth/login` → copia el token y pégalo en **Authorize**',
      '2. `GET /productos` → elige un producto',
      '3. `POST /pedidos` → reserva el stock y publica `pedido.creado` en RabbitMQ',
      '4. `POST /pedidos/{id}/pago` → prepara el cobro en Stripe',
      '5. `POST /pedidos/{id}/pago/confirmar` → el servidor verifica el pago y publica `pedido.pagado`',
      '',
      'Formato: JSON · Autenticación: JWT Bearer · Errores: `{ "mensaje": "..." }` con el código HTTP correspondiente.',
    ].join('\n'),
  },
  servers: [{ url: '/api', description: 'Este servidor' }],
  tags: [
    { name: 'Autenticación' },
    { name: 'Catálogo', description: 'Público, sin token' },
    { name: 'Pedidos', description: 'Requiere token de cliente' },
    { name: 'Pago', description: 'Stripe en modo de prueba' },
    { name: 'Sistema' },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: { Error, Item, Pedido },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Estado del servicio, la base de datos y el middleware (RabbitMQ)',
        responses: {
          200: respuesta('Todo operativo', {
            type: 'object',
            example: { ok: true, baseDeDatos: 'ok', mensajeria: 'ok' },
          }),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión y obtener el token JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'cliente@correo.com' },
                  password: { type: 'string', example: 'MiClave123' },
                },
              },
            },
          },
        },
        responses: {
          200: respuesta('Sesión iniciada', {
            type: 'object',
            example: { token: 'eyJhbGciOi...', usuario: { id: 2, nombre: 'Ana', email: 'cliente@correo.com', rol: 'cliente' } },
          }),
          401: err('Correo o contraseña incorrectos'),
          403: err('Cuenta desactivada'),
        },
      },
    },
    '/productos': {
      get: {
        tags: ['Catálogo'],
        summary: 'Listar productos disponibles (paginado)',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Buscar por nombre o marca' },
          { name: 'categoria', in: 'query', schema: { type: 'string', enum: ['med', 'cuidado', 'dermo', 'salud', 'bebe'] } },
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limite', in: 'query', schema: { type: 'integer', default: 12, maximum: 50 } },
        ],
        responses: {
          200: respuesta('Página de productos', {
            type: 'object',
            example: {
              items: [{ id: 1, nombre: 'Paracetamol 500 mg', marca: 'Genfar', precio: 2.5, disponible: true, requiere_receta: false }],
              total: 1, pagina: 1, paginas: 1,
            },
          }),
        },
      },
    },
    '/pedidos': {
      post: {
        tags: ['Pedidos'],
        summary: 'Crear pedido (operación principal del proceso)',
        description: 'Valida precios y stock en el servidor, descuenta stock en una transacción (todo o nada), '
          + 'deja registro en el kardex y publica el evento `pedido.creado` en RabbitMQ.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['items'],
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['productoId', 'cantidad'],
                      properties: { productoId: { type: 'integer' }, cantidad: { type: 'integer', minimum: 1, maximum: 99 } },
                    },
                  },
                  entrega: { type: 'string', enum: ['recojo', 'delivery'], default: 'recojo' },
                  direccion: { type: 'string', description: 'Obligatoria si entrega = delivery' },
                  telefono: { type: 'string', description: 'Obligatorio si entrega = delivery' },
                  nota: { type: 'string', maxLength: 200 },
                },
              },
              example: { items: [{ productoId: 1, cantidad: 2 }], entrega: 'recojo' },
            },
          },
        },
        responses: {
          201: respuesta('Pedido creado (pago pendiente)', { $ref: '#/components/schemas/Pedido' }),
          400: err('Datos inválidos'),
          401: err('Falta el token o expiró'),
          409: err('Stock insuficiente, producto no disponible o requiere receta'),
        },
      },
    },
    '/pedidos/mios': {
      get: {
        tags: ['Pedidos'],
        summary: 'Listar mis pedidos',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } }],
        responses: {
          200: respuesta('Mis pedidos', {
            type: 'object',
            properties: {
              items: { type: 'array', items: { $ref: '#/components/schemas/Pedido' } },
              total: { type: 'integer' }, pagina: { type: 'integer' }, paginas: { type: 'integer' },
            },
          }),
          401: err('Falta el token'),
        },
      },
    },
    '/pedidos/{id}/cancelar': {
      patch: {
        tags: ['Pedidos'],
        summary: 'Cancelar mi pedido (solo si está pendiente)',
        description: 'Devuelve el stock, reembolsa si ya estaba pagado y publica `pedido.cancelado`.',
        security: [{ bearerAuth: [] }],
        parameters: [idParam],
        responses: {
          200: respuesta('Pedido cancelado', { $ref: '#/components/schemas/Pedido' }),
          404: err('No existe o no es tuyo'),
          409: err('Ya no se puede cancelar'),
        },
      },
    },
    '/pedidos/{id}/pago': {
      post: {
        tags: ['Pago'],
        summary: 'Iniciar el pago con tarjeta (Stripe)',
        description: 'Crea el cobro en Stripe por el monto guardado en la BD y devuelve el `clientSecret` '
          + 'que el navegador usa para mostrar el formulario de tarjeta.',
        security: [{ bearerAuth: [] }],
        parameters: [idParam],
        responses: {
          200: respuesta('Cobro preparado', { type: 'object', example: { clientSecret: 'pi_3Q..._secret_...' } }),
          404: err('No existe o no es tuyo'),
          409: err('El pedido ya no se puede pagar'),
          502: err('No se pudo contactar a Stripe'),
        },
      },
    },
    '/pedidos/{id}/pago/confirmar': {
      post: {
        tags: ['Pago'],
        summary: 'Confirmar el pago (el servidor lo verifica con Stripe)',
        description: 'Nunca se confía en el navegador: el servidor consulta a Stripe. Si está pagado, '
          + 'marca el pedido y publica `pedido.pagado` en RabbitMQ.',
        security: [{ bearerAuth: [] }],
        parameters: [idParam],
        responses: {
          200: respuesta('Pedido pagado', { $ref: '#/components/schemas/Pedido' }),
          402: err('El pago todavía no se completó'),
          404: err('No existe o no es tuyo'),
        },
      },
    },
  },
};