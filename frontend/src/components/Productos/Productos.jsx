// src/components/Productos/Productos.jsx
// Catálogo público conectado al backend (GET /api/productos y /api/productos/categorias)
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, ChevronDown, ChevronUp, FileText, Pill, Search, ShoppingCart } from 'lucide-react';
import { obtenerCategorias, urlImagen } from '../../models/helpers/productos.js';
import { listarCatalogo } from '../../models/helpers/catalogo_api.js';
import { useCart } from '../Auth/Cart/CartContext.jsx';
import './Productos.css';

export default function Productos() {
  const { agregar, abrirCarrito } = useCart();
  // Permite enlaces como /productos?categoria=bebe o /productos?q=paracetamol
  const [params] = useSearchParams();

  const [categorias, setCategorias] = useState([]);
  const [abiertos, setAbiertos] = useState({});
  const [q, setQ] = useState(() => params.get('q') ?? '');
  const [busqueda, setBusqueda] = useState(() => (params.get('q') ?? '').trim());
  const [filtro, setFiltro] = useState(() => ({ categoria: params.get('categoria') ?? '', subcategoria: '' }));
  const [pagina, setPagina] = useState(1);
  const [lista, setLista] = useState({ items: [], total: 0, paginas: 1 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [agregado, setAgregado] = useState(null); // id del último producto agregado (feedback)

  useEffect(() => {
    obtenerCategorias()
      .then((cats) => {
        setCategorias(cats);
        // En escritorio se ven desplegadas; en móvil cerradas para que los productos queden arriba
        const desplegar = window.matchMedia('(min-width: 901px)').matches;
        setAbiertos(Object.fromEntries(cats.map((c) => [c.id, desplegar])));
      })
      .catch(() => {});
  }, []);

  // Debounce: busca 300 ms después de la última tecla
  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(q.trim());
      setPagina(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    listarCatalogo({ q: busqueda, ...filtro, pagina })
      .then((r) => {
        if (!vigente) return;
        setLista(r);
        setError('');
      })
      .catch((e) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [busqueda, filtro, pagina]);

  const elegir = (categoria, subcategoria = '') => {
    setFiltro({ categoria, subcategoria });
    setPagina(1);
  };

  const toggleCategoria = (id) => setAbiertos((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleAgregar = (prod) => {
    if (!agregar(prod)) return; // sin sesión: te lleva al login
    abrirCarrito(); // se abre el carrito con el producto ya dentro
    setAgregado(prod.id);
    setTimeout(() => setAgregado((actual) => (actual === prod.id ? null : actual)), 1500);
  };

  const tituloActual = filtro.subcategoria
    || categorias.find((c) => c.id === filtro.categoria)?.nombre
    || 'Todos los productos';

  return (
    <div className="productos-page">
      {/* 1. Barra de búsqueda */}
      <div className="search-bar-container">
        <form
          className="search-bar"
          role="search"
          onSubmit={(e) => { e.preventDefault(); setBusqueda(q.trim()); setPagina(1); }}
        >
          <input
            type="search"
            placeholder="Busca una marca o producto..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar productos"
          />
          <button type="submit" aria-label="Buscar">
            <Search size={18} />
          </button>
        </form>
      </div>

      <div className="productos-layout">
        {/* 2. Categorías */}
        <aside className="sidebar-categorias">
          <div className="sidebar-header">
            <h3>PRODUCTOS</h3>
          </div>

          <nav>
            <button
              type="button"
              className={`category-todos${!filtro.categoria ? ' category-todos--activa' : ''}`}
              onClick={() => elegir('')}
            >
              Todos los productos
            </button>

            {categorias.map((cat) => (
              <div key={cat.id} className="category-group">
                <div className={`category-header${filtro.categoria === cat.id ? ' category-header--activa' : ''}`}>
                  <button type="button" className="category-nombre" onClick={() => elegir(cat.id)}>
                    {cat.nombre}
                  </button>
                  <button
                    type="button"
                    className="category-flecha"
                    onClick={() => toggleCategoria(cat.id)}
                    aria-label={abiertos[cat.id] ? `Ocultar ${cat.nombre}` : `Mostrar ${cat.nombre}`}
                    aria-expanded={Boolean(abiertos[cat.id])}
                  >
                    {abiertos[cat.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {abiertos[cat.id] && (
                  <ul className="subcategories-list">
                    {cat.subcategorias.map((sub) => (
                      <li key={sub}>
                        <button
                          type="button"
                          className={`subcategory-item${filtro.subcategoria === sub ? ' subcategory-item--activa' : ''}`}
                          onClick={() => elegir(cat.id, sub)}
                        >
                          {sub}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* 3. Grilla */}
        <section className="productos-contenido">
          <div className="productos-titulo">
            <h2>{tituloActual}</h2>
            <span>{lista.total} {lista.total === 1 ? 'producto' : 'productos'}</span>
          </div>

          {error && <p className="productos-mensaje productos-mensaje--error">{error}</p>}

          {!error && !cargando && lista.items.length === 0 && (
            <p className="productos-mensaje">No encontramos productos con esa búsqueda.</p>
          )}

          <div className={`productos-grid${cargando ? ' productos-grid--cargando' : ''}`}>
            {lista.items.map((prod) => {
              const bloqueado = !prod.disponible || prod.requiere_receta;
              return (
                <div key={prod.id} className={`producto-card${!prod.disponible ? ' producto-card--agotado' : ''}`}>
                  <div className="card-top">
                    <div className="card-image-box">
                      {prod.imagen
                        ? <img src={urlImagen(prod.imagen)} alt={prod.nombre} loading="lazy" />
                        : <Pill size={40} strokeWidth={1.5} aria-hidden="true" />}
                      {!prod.disponible && <span className="card-badge card-badge--agotado">Agotado</span>}
                      {prod.disponible && prod.pocas_unidades && (
                        <span className="card-badge card-badge--pocas">Últimas unidades</span>
                      )}
                    </div>
                    <div className="card-info">
                      {prod.marca && <span className="card-brand">{prod.marca}</span>}
                      <h4 className="card-title">{prod.nombre}</h4>
                      <p className="card-price">S/ {Number(prod.precio).toFixed(2)}</p>
                      {prod.requiere_receta && (
                        <span className="card-receta"><FileText size={13} /> Requiere receta · solo en tienda</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`btn-add-cart${agregado === prod.id ? ' btn-add-cart--ok' : ''}`}
                    onClick={() => handleAgregar(prod)}
                    disabled={bloqueado}
                  >
                    {agregado === prod.id ? <Check size={18} /> : <ShoppingCart size={18} />}
                    {agregado === prod.id
                      ? 'Agregado'
                      : !prod.disponible ? 'Sin stock' : prod.requiere_receta ? 'Cómpralo en tienda' : 'Agregar al carrito'}
                  </button>
                </div>
              );
            })}
          </div>

          {lista.paginas > 1 && (
            <div className="productos-paginacion">
              <button type="button" className="btn btn--ghost" disabled={pagina <= 1} onClick={() => setPagina((n) => n - 1)}>
                Anterior
              </button>
              <span>Página {pagina} de {lista.paginas}</span>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={pagina >= lista.paginas}
                onClick={() => setPagina((n) => n + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}