import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
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

const accesosRapidos = [
  { id: '1', nombre: 'Farmacia Prime', icono: '⭐', color: '#e0a03c' },
  { id: '2', nombre: 'Zona Depor', icono: '🏃', color: '#e65100' },
  { id: '3', nombre: 'Cuidado del bebé', icono: '👶', color: '#0288d1' },
  { id: '4', nombre: 'Cuidado personal', icono: '🧴', color: '#00897b' },
  { id: '5', nombre: 'Packs del Ahorro', icono: '🏷️', color: '#c2185b' },
  { id: '6', nombre: 'Monedero San Marcos', icono: '💳', color: '#5e35b1' },
  { id: '7', nombre: 'Catálogos', icono: '📖', color: '#2e7d32' },
];

const promociones = [
  {
    id: 'p1',
    etiqueta: 'OFERTA DE LA SEMANA',
    titulo: 'Hasta 30% dcto. en vitaminas',
    descripcion: 'Refuerza tus defensas con nuestra línea de suplementos.',
    icono: '💪',
  },
  {
    id: 'p2',
    etiqueta: 'CUIDADO PERSONAL',
    titulo: '2x1 en protector solar',
    descripcion: 'Prepárate para cuidar tu piel con las mejores marcas.',
    icono: '🧴',
  },
  {
    id: 'p3',
    etiqueta: 'SALUD DENTAL',
    titulo: '20% dcto. en higiene bucal',
    descripcion: 'Pastas, cepillos y enjuagues recomendados por especialistas.',
    icono: '🦷',
  },
  {
    id: 'p4',
    etiqueta: 'MAMÁ Y BEBÉ',
    titulo: '15% dcto. en línea infantil',
    descripcion: 'Fórmulas, pañales y toallitas con la máxima suavidad.',
    icono: '🍼',
  },
];

const destacados = [
  { icono: '💊', nombre: 'Paracetamol 500mg (Caja 20 tab)', marca: 'Panadol', precio: 12.5, descuento: 15, rating: 4.8 },
  { icono: '🧴', nombre: 'Champú 2 en 1 Hidratación', marca: 'Head & Shoulders', precio: 55.9, descuento: 0, rating: 4.7 },
  { icono: '☀️', nombre: 'Protector Solar FPS 50+ Facial', marca: 'La Roche-Posay', precio: 98.0, descuento: 10, rating: 4.9 },
  { icono: '✨', nombre: 'Multivitamínico Gomitas Adulto', marca: 'Centrum', precio: 64.9, descuento: 20, rating: 4.8 },
];

const servicios = [
  { icono: '🚚', titulo: 'Delivery Express', desc: 'Llega en menos de 60 minutos hasta tu puerta.' },
  { icono: '💳', titulo: 'Pagos Flexibles', desc: 'Aceptamos transferencias, Yape, Plin y tarjetas.' },
  { icono: '📦', titulo: 'Recojo en Sede', desc: 'Haz tu pedido en línea y retíralo sin filas.' },
  { icono: '🩺', titulo: 'Atención Profesional', desc: 'Orientación farmacéutica garantizada.' },
];

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
      <button
        className="home-banner__arrow home-banner__arrow--left"
        onClick={prev}
        aria-label="Anterior"
        type="button"
      >
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
              <Link to="/productos" className="btn btn--primary">
                Ver promoción
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        className="home-banner__arrow home-banner__arrow--right"
        onClick={next}
        aria-label="Siguiente"
        type="button"
      >
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
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/productos?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/productos');
    }
  };

  const handleAddToCart = (producto) => {
    console.log('Agregado al carrito:', producto.nombre);
  };

  return (
    <div className="inicio-view">
      {/* 1. BARRA SUPERIOR DE BÚSQUEDA */}
      <div className="home-search-section">
        <form onSubmit={handleSearch} className="home-search-bar">
          <input
            type="text"
            placeholder="Busca una marca o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" aria-label="Buscar producto">
            <Search size={18} />
          </button>
        </form>
      </div>

      {/* 2. CINTA HORIZONTAL DE CATEGORÍAS */}
      <nav className="home-categories-ribbon" aria-label="Accesos rápidos">
        {accesosRapidos.map((cat) => (
          <Link key={cat.id} to="/productos" className="ribbon-item">
            <span className="ribbon-item__icon">{cat.icono}</span>
            <span className="ribbon-item__name" style={{ color: cat.color }}>
              {cat.nombre}
            </span>
          </Link>
        ))}
      </nav>

      {/* 3. CARRUSEL PRINCIPAL DE PROMOCIONES */}
      <section className="home-hero-carousel-section">
        <PromoHeroCarousel />
      </section>

      {/* 4. PRODUCTOS DESTACADOS */}
      <section className="section">
        <div className="section__header">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            🔥 Ofertas y productos destacados
          </motion.h2>
          <Link to="/productos" className="section__link">
            Ver catálogo completo →
          </Link>
        </div>

        <motion.div
          className="productos__grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={container}
        >
          {destacados.map((prod) => (
            <motion.div
              key={prod.nombre}
              className="producto-card-destacado"
              variants={fadeUp}
              whileHover={{ y: -6 }}
            >
              {prod.descuento > 0 && (
                <span className="destacado__badge-descuento">-{prod.descuento}%</span>
              )}
              <div className="destacado__icono-box">{prod.icono}</div>
              <span className="destacado__marca">{prod.marca}</span>
              <p className="destacado__nombre">{prod.nombre}</p>
              <p className="destacado__rating">⭐ {prod.rating}</p>
              <p className="destacado__precio">S/ {prod.precio.toFixed(2)}</p>
              <button
                className="btn btn--primary btn--full"
                onClick={() => handleAddToCart(prod)}
                type="button"
              >
                Agregar al carrito
              </button>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 5. SERVICIOS INSTITUCIONALES */}
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
            <motion.div
              key={serv.titulo}
              className="servicio-card"
              variants={fadeUp}
              whileHover={{ scale: 1.05 }}
            >
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