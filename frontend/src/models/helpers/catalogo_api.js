// src/models/helpers/catalogo_api.js
// Catálogo público (sin token): lo usa la página /productos
import { peticion, query } from './api.js';

// -> { items: [{ id, nombre, marca, categoria, subcategoria, descripcion, imagen, precio,
//                requiere_receta, disponible, pocas_unidades }], total, pagina, paginas }
export const listarCatalogo = ({ q, categoria, subcategoria, pagina, limite = 12 }) =>
  peticion(`/api/productos${query({ q, categoria, subcategoria, pagina, limite })}`);