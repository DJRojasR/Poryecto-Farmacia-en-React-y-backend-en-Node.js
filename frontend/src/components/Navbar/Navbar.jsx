import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut, ShoppingCart, ClipboardList } from 'lucide-react';
import logo from '../../assets/logo.png';
import { useAuth } from '../../models/context/AuthContext.jsx';
import { useCart } from '../Auth/Cart/CartContext.jsx';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Productos', to: '/productos' },
  { label: 'Nosotros', to: '/nosotros' },
  { label: 'Contacto', to: '/contacto' },
];

const linksContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.3 },
  },
};

const linkItem = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { user, logout } = useAuth();
  const { cantidad, abrirCarrito } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cierra el menú móvil si la ventana crece a escritorio
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 860) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const cerrarSesion = () => {
    logout(); // CartProvider vacía carrito y pedidos al detectar que ya no hay email
    setMenuOpen(false);
    navigate('/');
  };

  const abrirCarritoMovil = () => {
    setMenuOpen(false);
    abrirCarrito();
  };

  const linkClassName = ({ isActive }) =>
    `navbar__link${isActive ? ' navbar__link--active' : ''}`;

  const mobileLinkClassName = ({ isActive }) =>
    `navbar__mobile-link${isActive ? ' navbar__mobile-link--active' : ''}`;

  // Los links móviles extra dependen de la sesión, así que el retraso de la animación se calcula sobre la marcha
  const retraso = (indice) => (NAV_LINKS.length + indice) * 0.05;

  return (
    <motion.header
      className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="navbar__inner">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <NavLink to="/" className="navbar__brand">
            <img src={logo} alt="Logo Farmacia San Marcos" className="navbar__brand-icon" />
            <span className="navbar__brand-text">Farmacia San Marcos</span>
          </NavLink>
        </motion.div>

        <motion.nav
          className="navbar__links"
          aria-label="Navegación principal"
          initial="hidden"
          animate="visible"
          variants={linksContainer}
        >
          {NAV_LINKS.map((link) => (
            <motion.div
              key={link.to}
              variants={linkItem}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
            >
              <NavLink to={link.to} end={link.to === '/'} className={linkClassName}>
                {link.label}
                <span className="navbar__link-underline" />
              </NavLink>
            </motion.div>
          ))}
        </motion.nav>

        <motion.div
          className="navbar__actions"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          {user ? (
            <>
              <NavLink
                to="/mis-compras"
                className="navbar__icon-link navbar__icon-link--desktop"
                aria-label="Mis compras"
                title="Mis compras"
              >
                <ClipboardList size={20} />
              </NavLink>

              <button
                type="button"
                className="navbar__icon-link navbar__cart"
                onClick={abrirCarrito}
                aria-label={`Carrito, ${cantidad} ${cantidad === 1 ? 'producto' : 'productos'}`}
                title="Carrito"
              >
                <ShoppingCart size={20} />
                {cantidad > 0 && <span className="navbar__badge">{cantidad}</span>}
              </button>

              <button
                className="navbar__login navbar__login--desktop"
                type="button"
                onClick={cerrarSesion}
              >
                <span className="navbar__login-shine" aria-hidden="true" />
                <LogOut size={17} strokeWidth={2.2} />
                <span>Cerrar sesión</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="navbar__login navbar__login--desktop">
              <span className="navbar__login-shine" aria-hidden="true" />
              <User size={17} strokeWidth={2.2} />
              <span>Iniciar sesión</span>
            </Link>
          )}

          <button
            className="navbar__toggle"
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            className="navbar__mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            aria-label="Navegación móvil"
          >
            {NAV_LINKS.map((link, i) => (
              <motion.div
                key={link.to}
                initial={{ x: -16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={mobileLinkClassName}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              </motion.div>
            ))}

            {user ? (
              <>
                <motion.div
                  initial={{ x: -16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: retraso(0) }}
                >
                  <NavLink
                    to="/mis-compras"
                    className={mobileLinkClassName}
                    onClick={() => setMenuOpen(false)}
                  >
                    Mis compras
                  </NavLink>
                </motion.div>

                <motion.div
                  initial={{ x: -16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: retraso(1) }}
                >
                  <button
                    type="button"
                    className="navbar__mobile-link navbar__mobile-cart"
                    onClick={abrirCarritoMovil}
                  >
                    <ShoppingCart size={18} />
                    Carrito{cantidad > 0 ? ` (${cantidad})` : ''}
                  </button>
                </motion.div>

                <motion.button
                  className="navbar__login navbar__login--mobile"
                  type="button"
                  onClick={cerrarSesion}
                  initial={{ x: -16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: retraso(2) }}
                >
                  <span className="navbar__login-shine" aria-hidden="true" />
                  <LogOut size={17} strokeWidth={2.2} />
                  <span>Cerrar sesión</span>
                </motion.button>
              </>
            ) : (
              <motion.div
                initial={{ x: -16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: retraso(0) }}
              >
                <Link
                  to="/login"
                  className="navbar__login navbar__login--mobile"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="navbar__login-shine" aria-hidden="true" />
                  <User size={17} strokeWidth={2.2} />
                  <span>Iniciar sesión</span>
                </Link>
              </motion.div>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}