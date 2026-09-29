// src/models/helpers/productos.js
const API_URL = import.meta.env.VITE_API_URL; 
const ORIGEN_API = API_URL.replace(/\/api\/?$/, '');

// La BD guarda solo "/uploads/xxx.webp"; aquí se arma la URL completa
export const urlImagen = (ruta) => (ruta ? `${ORIGEN_API}${ruta}` : null);

async function pedir(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  const esForm = cuerpo instanceof FormData;
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: {
        ...(cuerpo && !esForm ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: !cuerpo ? undefined : esForm ? cuerpo : JSON.stringify(cuerpo),
    });
  } catch {
    throw new Error('No hay conexión con el servidor. Revisa que el backend esté encendido.');
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const error = new Error(datos.mensaje || 'Ocurrió un error. Inténtalo de nuevo.');
    error.status = respuesta.status;
    error.errores = datos.errores; // errores por campo, si el backend los manda
    throw error;
  }
  return datos;
}

export const obtenerCategorias = () => pedir('/productos/categorias');

export function listarProductos(token, { q, estado, agotados, pagina, limite = 10 } = {}) {
  const params = new URLSearchParams({ estado: estado || 'todos', pagina: pagina || 1, limite });
  if (q) params.set('q', q);
  if (agotados) params.set('agotados', 'true');
  return pedir(`/admin/productos?${params}`, { token });
}

// crear y actualizar reciben un FormData (por la imagen)
export const crearProducto = (token, formData) =>
  pedir('/admin/productos', { metodo: 'POST', cuerpo: formData, token });

export const actualizarProducto = (token, id, formData) =>
  pedir(`/admin/productos/${id}`, { metodo: 'PATCH', cuerpo: formData, token });

export const ajustarStock = (token, id, ajuste) =>
  pedir(`/admin/productos/${id}/stock`, { metodo: 'PATCH', cuerpo: { ajuste }, token });

export const eliminarProducto = (token, id) =>
  pedir(`/admin/productos/${id}`, { metodo: 'DELETE', token });

export const reactivarProducto = (token, id) =>
  pedir(`/admin/productos/${id}/reactivar`, { metodo: 'PATCH', token });