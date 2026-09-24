import { Link } from 'react-router-dom';
import farmacia from '../../assets/farmacia.png';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="footer__brand-icon">
            <img src={farmacia} alt="Logo Botica San Marcos" />
          </span>
          <span>Farmacia San Marcos</span>
        </div>

        <nav className="footer__links" aria-label="Enlaces de pie de página">
          <Link to="/">Inicio</Link>
          <Link to="/productos">Productos</Link>
          <Link to="/nosotros">Nosotros</Link>
          <Link to="/contacto">Contacto</Link>
        </nav>

        <p className="footer__copy">
          © {new Date().getFullYear()} Farmacia San Marcos. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}