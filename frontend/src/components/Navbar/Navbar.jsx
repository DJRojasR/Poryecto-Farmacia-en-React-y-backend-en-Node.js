import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, ShoppingCart, Menu, X } from 'lucide-react';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Medicamentos', to: '/medicamentos' },
  { label: 'Recetas', to: '/recetas' },
  { label: 'Nosotros', to: '/nosotros' },
  { label: 'Contacto', to: '/contacto' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const linkClassName = ({ isActive }) =>
    `navbar__link${isActive ? ' navbar__link--active' : ''}`;

  const mobileLinkClassName = ({ isActive }) =>
    `navbar__mobile-link${isActive ? ' navbar__mobile-link--active' : ''}`;

  return (
    <motion.header
      className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="navbar__inner">
        <NavLink to="/" className="navbar__brand">
          <span className="navbar__brand-icon">
            <Pill size={18} strokeWidth={2.5} />
          </span>
          <span className="navbar__brand-text">Botica San Marcos</span>
        </NavLink>

        <nav className="navbar__links" aria-label="Navegación principal">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={linkClassName}>
              {link.label}
              <span className="navbar__link-underline" />
            </NavLink>
          ))}
        </nav>

        <div className="navbar__actions">
          <button className="navbar__cta" type="button">
            <span className="navbar__cta-blob" aria-hidden="true" />
            <ShoppingCart size={17} strokeWidth={2.2} />
            <span>Comprar ahora</span>
          </button>

          <button
            className="navbar__toggle"
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
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
            <button className="navbar__cta navbar__cta--mobile" type="button">
              <span className="navbar__cta-blob" aria-hidden="true" />
              <ShoppingCart size={17} strokeWidth={2.2} />
              <span>Comprar ahora</span>
            </button>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}