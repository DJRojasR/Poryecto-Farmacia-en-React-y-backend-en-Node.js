// src/pages/Inicio/Inicio.jsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import fondo from '../../assets/fondo.png';
import './Inicio.css';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] },
  }),
};

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

// Categorías: hover de la tarjeta que se propaga al ícono
const categoriaVariants = {
  hover: {
    y: -6,
    scale: 1.06,
    transition: { type: 'spring', stiffness: 300, damping: 15 },
  },
};

const iconoVariants = {
  hover: {
    rotate: [0, -14, 14, -8, 8, 0],
    scale: 1.3,
    transition: { duration: 0.6 },
  },
};

// TODO: cuando tengas backend, reemplaza esto por datos reales (con imágenes)
const promociones = [
  {
    id: 'p1',
    etiqueta: 'Oferta de la semana',
    titulo: 'Hasta 30% dcto. en vitaminas',
    descripcion: 'Refuerza tus defensas con nuestra línea de suplementos.',
    icono: '💪',
  },
  {
    id: 'p2',
    etiqueta: 'Cuidado personal',
    titulo: '2x1 en protector solar',
    descripcion: 'Prepárate para el verano cuidando tu piel.',
    icono: '🧴',
  },
  {
    id: 'p3',
    etiqueta: 'Salud dental',
    titulo: '20% dcto. en cuidado bucal',
    descripcion: 'Cepillos, pastas y enjuagues en promoción.',
    icono: '🦷',
  },
  {
    id: 'p4',
    etiqueta: 'Bebés',
    titulo: '15% dcto. en línea de bebés',
    descripcion: 'Todo lo que necesitas para el cuidado de los más pequeños.',
    icono: '👶',
  },
];

const categorias = [
  { icono: '💊', nombre: 'Medicamentos' },
  { icono: '🧴', nombre: 'Cuidado personal' },
  { icono: '👶', nombre: 'Bebés' },
  { icono: '🩺', nombre: 'Equipos médicos' },
  { icono: '💪', nombre: 'Vitaminas' },
  { icono: '🦷', nombre: 'Cuidado dental' },
  { icono: '🧼', nombre: 'Higiene' },
];

const destacados = [
  { icono: '💊', nombre: 'Paracetamol 500mg', precio: 8.5, descuento: 15, rating: 4.7 },
  { icono: '🩹', nombre: 'Kit primeros auxilios', precio: 32.0, descuento: 0, rating: 4.9 },
  { icono: '🧴', nombre: 'Alcohol en gel 500ml', precio: 6.0, descuento: 10, rating: 4.5 },
  { icono: '💪', nombre: 'Multivitamínico x30', precio: 24.9, descuento: 20, rating: 4.8 },
];

const servicios = [
  { icono: '🚚', titulo: 'Delivery', desc: 'Recibe tus productos en menos de 60 minutos.' },
  { icono: '💳', titulo: 'Pago online', desc: 'Tarjeta, Yape o Plin, como prefieras.' },
  { icono: '📦', titulo: 'Recojo en tienda', desc: 'Pide en línea y recógelo cuando quieras.' },
  { icono: '🩺', titulo: 'Toma de presión', desc: 'Servicio gratuito en tienda física.' },
];

// ---------- STATS / CONTADOR ----------
const statsData = [
  { valor: 15, sufijo: '+', etiqueta: 'Años de experiencia' },
  { valor: 50, sufijo: 'k+', etiqueta: 'Clientes atendidos' },
  { valor: 24, sufijo: '', etiqueta: 'Sucursales en Lima' },
  { valor: 4.8, sufijo: '★', etiqueta: 'Calificación promedio', decimales: 1 },
];

function Contador({ valor, decimales = 0 }) {
  const [display, setDisplay] = useState(0);
  const [enVista, setEnVista] = useState(false);

  useEffect(() => {
    if (!enVista) return;
    const duracion = 1400;
    const inicio = performance.now();

    let frame;
    const tick = (ahora) => {
      const progreso = Math.min((ahora - inicio) / duracion, 1);
      const facilitado = 1 - Math.pow(1 - progreso, 3); // ease-out
      setDisplay(valor * facilitado);
      if (progreso < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [enVista, valor]);

  return (
    <motion.span onViewportEnter={() => setEnVista(true)} viewport={{ once: true }}>
      {display.toFixed(decimales)}
    </motion.span>
  );
}

function StatsStrip() {
  return (
    <motion.section
      className="stats-strip"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
    >
      {statsData.map((stat, i) => (
        <motion.div
          key={stat.etiqueta}
          className="stats-strip__item"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
        >
          <p className="stats-strip__valor">
            <Contador valor={stat.valor} decimales={stat.decimales} />
            {stat.sufijo}
          </p>
          <p className="stats-strip__etiqueta">{stat.etiqueta}</p>
        </motion.div>
      ))}
    </motion.section>
  );
}

// Placeholder: reemplaza esta función cuando tengas tu AuthContext real.
// Por ahora revisa una bandera simple en localStorage.
function useIsLoggedIn() {
  return localStorage.getItem('bsm_isLoggedIn') === 'true';
}

function PromoCarousel() {
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

  // Autoplay
  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const promo = promociones[index];

  const slideVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
  };

  return (
    <div className="promo-carousel">
      <button
        className="promo-carousel__arrow promo-carousel__arrow--left"
        onClick={prev}
        aria-label="Promoción anterior"
        type="button"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="promo-carousel__viewport">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={promo.id}
            className="promo-slide"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="promo-slide__icono">{promo.icono}</span>
            <div className="promo-slide__texto">
              <span className="promo-slide__etiqueta">{promo.etiqueta}</span>
              <h3 className="promo-slide__titulo">{promo.titulo}</h3>
              <p className="promo-slide__descripcion">{promo.descripcion}</p>
              <Link to="/productos" className="btn btn--primary">
                Ver promoción
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        className="promo-carousel__arrow promo-carousel__arrow--right"
        onClick={next}
        aria-label="Siguiente promoción"
        type="button"
      >
        <ChevronRight size={20} />
      </button>

      <div className="promo-carousel__dots">
        {promociones.map((p, i) => (
          <button
            key={p.id}
            className={`promo-carousel__dot ${i === index ? 'promo-carousel__dot--active' : ''}`}
            onClick={() => goTo(i, i > index ? 1 : -1)}
            aria-label={`Ir a la promoción ${i + 1}`}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}

export default function Inicio() {
  const navigate = useNavigate();
  const isLoggedIn = useIsLoggedIn();

  const handleAddToCart = (producto) => {
    if (!isLoggedIn) {
      // TODO: reemplazar por tu lógica real (modal de login, guardar redirect, etc.)
      navigate('/login');
      return;
    }
    // TODO: lógica real de agregar al carrito
    console.log('Agregado al carrito:', producto.nombre);
  };

  return (
    <div className="inicio">
      {/* HERO */}
      <section className="hero">
        <div className="hero__content">
          <motion.p
            className="hero__eyebrow"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            Farmacia San Marcos
          </motion.p>

          <motion.h1
            className="hero__title"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
          >
            Tus medicamentos, siempre a tiempo.
          </motion.h1>

          <motion.p
            className="hero__subtitle"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
          >
            Consulta disponibilidad y recibe alertas de tus tratamientos desde
            un solo lugar.
          </motion.p>

          <motion.div
            className="hero__actions"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
          >
            <Link to="/productos" className="btn btn--primary">
              Ver promociones
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="hero__media"
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            src={fondo}
            alt="Farmacia San Marcos"
            className="hero__image"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </section>

      {/* ← fin del hero */}

      {/* STATS STRIP */}
      <StatsStrip />

      {/* CARRUSEL DE PROMOCIONES */}
      <section className="section">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          🔥 Ofertas de la semana
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <PromoCarousel />
        </motion.div>
      </section>

      {/* CATEGORIAS (carrusel infinito) */}
      <section className="section section--alt">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          Categorías
        </motion.h2>

        <motion.div
          className="categorias__carrusel"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <div className="categorias__track">
            {/* la lista se duplica para que el bucle no tenga saltos */}
            {[...categorias, ...categorias].map((cat, i) => (
              <motion.div
                key={`${cat.nombre}-${i}`}
                className="categoria-card"
                variants={categoriaVariants}
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
                aria-hidden={i >= categorias.length}
              >
                <motion.span className="categoria-card__icono" variants={iconoVariants}>
                  {cat.icono}
                </motion.span>
                <span className="categoria-card__nombre">{cat.nombre}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* PRODUCTOS DESTACADOS */}
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
            Ver todos →
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
              className="producto-card"
              variants={fadeUp}
              whileHover={{
                y: -10,
                scale: 1.03,
                transition: { type: 'spring', stiffness: 300, damping: 18 },
              }}
              whileTap={{ scale: 0.98 }}
            >
              {prod.descuento > 0 && (
                <span className="producto-card__descuento">-{prod.descuento}%</span>
              )}
              <div className="producto-card__icono">{prod.icono}</div>
              <p className="producto-card__nombre">{prod.nombre}</p>
              <p className="producto-card__rating">⭐ {prod.rating}</p>
              <p className="producto-card__precio">S/ {prod.precio.toFixed(2)}</p>
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

      {/* SERVICIOS */}
      <section className="section section--alt section--servicios">
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
              whileHover={{
                scale: 1.07,
                transition: { type: 'spring', stiffness: 300, damping: 20 },
              }}
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