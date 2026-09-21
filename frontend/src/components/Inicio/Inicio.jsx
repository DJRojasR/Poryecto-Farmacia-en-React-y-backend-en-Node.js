import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
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

const beneficios = [
  { icono: '🤝', titulo: 'Atención personalizada' },
  { icono: '✅', titulo: 'Productos de calidad' },
  { icono: '⚡', titulo: 'Delivery rápido' },
  { icono: '🔒', titulo: 'Compra segura' },
  { icono: '🧑‍⚕️', titulo: 'Personal especializado' },
];

export default function Inicio() {
  return (
    <div className="inicio">
      {/* HERO */}
      <section className="hero">
        <motion.p
          className="hero__eyebrow"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
        >
          Botica San Marcos
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
          Consulta disponibilidad, valida tus recetas y recibe alertas de tus
          tratamientos desde un solo lugar.
        </motion.p>

        <motion.div
          className="hero__actions"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
        >
          <Link to="/medicamentos" className="btn btn--primary">
            Ver promociones
          </Link>
          <Link to="/recetas" className="btn btn--ghost">
            Validar receta
          </Link>
        </motion.div>

        <motion.div
          className="hero__badge"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Hasta <strong>30% dcto.</strong> en productos seleccionados
        </motion.div>
      </section>

      {/* CATEGORIAS */}
      <section className="section">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          Categorías
        </motion.h2>

        <motion.div
          className="categorias__grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
        >
          {categorias.map((cat) => (
            <motion.div
              key={cat.nombre}
              className="categoria-card"
              variants={fadeUp}
              whileHover={{ y: -4 }}
            >
              <span className="categoria-card__icono">{cat.icono}</span>
              <span className="categoria-card__nombre">{cat.nombre}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section className="section section--alt">
        <div className="section__header">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Productos destacados
          </motion.h2>
          <Link to="/medicamentos" className="section__link">
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
            <motion.div key={prod.nombre} className="producto-card" variants={fadeUp}>
              {prod.descuento > 0 && (
                <span className="producto-card__descuento">-{prod.descuento}%</span>
              )}
              <div className="producto-card__icono">{prod.icono}</div>
              <p className="producto-card__nombre">{prod.nombre}</p>
              <p className="producto-card__rating">⭐ {prod.rating}</p>
              <p className="producto-card__precio">S/ {prod.precio.toFixed(2)}</p>
              <button className="btn btn--primary btn--full">Agregar al carrito</button>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* SERVICIOS */}
      <section className="section">
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
            <motion.div key={serv.titulo} className="servicio-card" variants={fadeUp}>
              <span className="servicio-card__icono">{serv.icono}</span>
              <h3>{serv.titulo}</h3>
              <p>{serv.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* POR QUE ELEGIRNOS */}
      <section className="section section--alt beneficios">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          ¿Por qué elegirnos?
        </motion.h2>

        <motion.div
          className="beneficios__grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={container}
        >
          {beneficios.map((b) => (
            <motion.div key={b.titulo} className="beneficio-item" variants={fadeUp}>
              <span>{b.icono}</span>
              <p>{b.titulo}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* UBICACION Y CONTACTO */}
      <section className="section ubicacion">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Visítanos</h2>
          <p>Av. San Marcos 245, San Isidro, Lima</p>
          <p>Lun a Dom · 8:00 a.m. – 10:00 p.m.</p>
          <p>Tel: (01) 234-5678</p>
          <a
            href="https://wa.me/51999999999"
            target="_blank"
            rel="noreferrer"
            className="btn btn--whatsapp"
          >
            💬 Escríbenos por WhatsApp
          </a>
        </motion.div>

        <motion.div
          className="ubicacion__mapa"
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Mapa aquí
        </motion.div>
      </section>
    </div>
  );
}