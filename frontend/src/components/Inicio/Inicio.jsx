// src/components/Inicio/Inicio.jsx
// Cambios: se quitó el buscador (ahora solo está en /productos), los "destacados"
// son productos reales que sube el admin, y "Agregar al carrito" abre el carrito.
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pill } from 'lucide-react';
import { urlImagen } from '../../models/helpers/productos.js';
import { listarCatalogo } from '../../models/helpers/catalogo_api.js';
import { useCart } from '../Auth/Cart/CartContext.jsx';
import './Inicio.css';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

// "categoria" = id real del catálogo: el enlace abre /productos ya filtrado
const accesosRapidos = [
  { id: '1', nombre: 'Medicamentos', icono: '💊', color: '#1e4066', categoria: 'med' },
  { id: '2', nombre: 'Cuidado personal', icono: '🧴', color: '#00897b', categoria: 'cuidado' },
  { id: '3', nombre: 'Dermocosmética', icono: '☀️', color: '#e65100', categoria: 'dermo' },
  { id: '4', nombre: 'Salud y bienestar', icono: '💪', color: '#2e7d32', categoria: 'salud' },
  { id: '5', nombre: 'Mamá y bebé', icono: '👶', color: '#0288d1', categoria: 'bebe' },
  { id: '6', nombre: 'Todo el catálogo', icono: '📖', color: '#5e35b1', categoria: '' },
];

const promociones = [
  {
    id: 'p1',
    etiqueta: 'SALUD Y BIENESTAR',
    titulo: 'Refuerza tus defensas',
    descripcion: 'Vitaminas y suplementos para toda la familia.',
    icono: '💪',
    categoria: 'salud',
  },
  {
    id: 'p2',
    etiqueta: 'DERMOCOSMÉTICA',
    titulo: 'Cuida tu piel del sol',
    descripcion: 'Protectores solares y cuidado facial de las mejores marcas.',
    icono: '🧴',
    categoria: 'dermo',
  },
  {
    id: 'p3',
    etiqueta: 'CUIDADO PERSONAL',
    titulo: 'Higiene para cada día',
    descripcion: 'Pastas, cepillos, jabones y champús.',
    icono: '🦷',
    categoria: 'cuidado',
  },
  {
    id: 'p4',
    etiqueta: 'MAMÁ Y BEBÉ',
    titulo: 'Todo para tu bebé',
    descripcion: 'Fórmulas, pañales y toallitas con la máxima suavidad.',
    icono: '🍼',
    categoria: 'bebe',
  },
];

const servicios = [
  { icono: '🚚', titulo: 'Delivery', desc: 'Recibe tu pedido en la puerta de tu casa.' },
  { icono: '💳', titulo: 'Pago con tarjeta', desc: 'Paga en línea de forma segura al hacer tu pedido.' },
  { icono: '📦', titulo: 'Recojo en tienda', desc: 'Haz tu pedido en línea y retíralo sin filas.' },
  { icono: '🩺', titulo: 'Atención profesional', desc: 'Orientación farmacéutica garantizada.' },
];

const enlaceCategoria = (categoria) => (categoria ? `/productos?categoria=${categoria}` : '/productos');

function PromoHeroCarousel() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const total = promociones.length;

  const goTo = useCallback(
    (nextIndex, dir) => {
      setDirection(dir);
      setIndex((nextIndex + total) % total);
    },
    [total]
  );

  const next = useCallback(() => goTo(index + 1, 1), [goTo, index]);
  const prev = () => goTo(index - 1, -1);

  useEffect(() => {
    const timer = setInterval(next, 5500);
    return () => clearInterval(timer);
  }, [next]);

  const promo = promociones[index];

  const slideVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 80 : -80 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -80 : 80 }),
  };

  return (
    <div className="home-banner-wrapper">
      <button className="home-banner__arrow home-banner__arrow--left" onClick={prev} aria-label="Anterior" type="button">
        <ChevronLeft size={24} />
      </button>

      <div className="home-banner-viewport">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={promo.id}
            className="home-banner-card"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="home-banner__icon-box">
              <span className="home-banner__icon">{promo.icono}</span>
            </div>

            <div className="home-banner__text">
              <span className="home-banner__badge">{promo.etiqueta}</span>
              <h2 className="home-banner__title">{promo.titulo}</h2>
              <p className="home-banner__description">{promo.descripcion}</p>
              <Link to={enlaceCategoria(promo.categoria)} className="btn btn--primary">
                Ver productos
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <button className="home-banner__arrow home-banner__arrow--right" onClick={next} aria-label="Siguiente" type="button">
        <ChevronRight size={24} />
      </button>

      <div className="home-banner__dots">
        {promociones.map((p, i) => (
          <button
            key={p.id}
            className={`home-banner__dot ${i === index ? 'home-banner__dot--active' : ''}`}
            onClick={() => goTo(i, i > index ? 1 : -1)}
            aria-label={`Promoción ${i + 1}`}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}

export default function Inicio() {
  const { agregar, abrirCarrito } = useCart();
  const [destacados, setDestacados] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Productos reales del catálogo (los que tienen stock salen primero)
  useEffect(() => {
    let vigente = true;
    listarCatalogo({ pagina: 1, limite: 8 })
      .then((r) => vigente && setDestacados(r.items.filter((p) => p.disponible).slice(0, 4)))
      .catch(() => vigente && setDestacados([]))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, []);

  const handleAddToCart = (producto) => {
    // Sin sesión, agregar() lleva al login y devuelve false
    if (agregar(producto)) abrirCarrito();
  };

  return (
    <div className="inicio-view">
      {/* 1. CINTA HORIZONTAL DE CATEGORÍAS */}
      <nav className="home-categories-ribbon" aria-label="Categorías">
        {accesosRapidos.map((cat) => (
          <Link key={cat.id} to={enlaceCategoria(cat.categoria)} className="ribbon-item">
            <span className="ribbon-item__icon">{cat.icono}</span>
            <span className="ribbon-item__name" style={{ color: cat.color }}>
              {cat.nombre}
            </span>
          </Link>
        ))}
      </nav>

      {/* 2. CARRUSEL PRINCIPAL */}
      <section className="home-hero-carousel-section">
        <PromoHeroCarousel />
      </section>

      {/* 3. PRODUCTOS DESTACADOS (reales) */}
      <section className="section">
        <div className="section__header">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Productos destacados
          </motion.h2>
          <Link to="/productos" className="section__link">
            Ver catálogo completo →
          </Link>
        </div>

        {!cargando && destacados.length === 0 ? (
          <p className="destacados__vacio">
            Pronto verás aquí nuestros productos. Mientras tanto, revisa el <Link to="/productos" className="section__link">catálogo</Link>.
          </p>
        ) : (
          <motion.div
            key={destacados.length}
            className="productos__grid"
            initial="hidden"
            animate="visible"
            variants={container}
          >
            {destacados.map((prod) => (
              <motion.div key={prod.id} className="producto-card-destacado" variants={fadeUp} whileHover={{ y: -6 }}>
                <div className="destacado__icono-box">
                  {prod.imagen
                    ? <img src={urlImagen(prod.imagen)} alt={prod.nombre} loading="lazy" />
                    : <Pill size={44} strokeWidth={1.5} aria-hidden="true" />}
                </div>
                {prod.marca && <span className="destacado__marca">{prod.marca}</span>}
                <p className="destacado__nombre">{prod.nombre}</p>
                <p className="destacado__precio">S/ {Number(prod.precio).toFixed(2)}</p>
                {prod.requiere_receta ? (
                  <>
                    <p className="destacado__aviso">Requiere receta · solo en tienda</p>
                    <Link to="/productos" className="btn btn--ghost btn--full">Ver en catálogo</Link>
                  </>
                ) : (
                  <button className="btn btn--primary btn--full" onClick={() => handleAddToCart(prod)} type="button">
                    Agregar al carrito
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* 4. SERVICIOS */}
      <section className="section section--alt">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Servicios de la farmacia
        </motion.h2>

        <motion.div
          className="servicios__grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
        >
          {servicios.map((serv) => (
            <motion.div key={serv.titulo} className="servicio-card" variants={fadeUp} whileHover={{ scale: 1.05 }}>
              <span className="servicio-card__icono">{serv.icono}</span>
              <h3>{serv.titulo}</h3>
              <p>{serv.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}