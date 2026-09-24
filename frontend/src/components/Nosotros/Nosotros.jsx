import React from 'react';
import './Nosotros.css';

export default function Nosotros() {
  return (
    <section className="section nosotros-section">
      <div className="nosotros-header">
        <h2>Nosotros</h2>
        <p className="nosotros-lead">
          Comprometidos con la atención farmacéutica, la salud y el bienestar de nuestra comunidad universitaria y local.
        </p>
      </div>

      <div className="nosotros-grid">
        <div className="nosotros-card">
          <span className="nosotros-icon">🎯</span>
          <h3>Nuestra Misión</h3>
          <p>
            Brindar acceso oportuno y confiable a medicamentos y productos de cuidado personal, garantizando una atención profesional, segura y cercana.
          </p>
        </div>

        <div className="nosotros-card">
          <span className="nosotros-icon">👁️</span>
          <h3>Nuestra Visión</h3>
          <p>
            Ser el centro farmacéutico referente en confianza y modernidad, combinando calidez humana con herramientas digitales al servicio de tu salud.
          </p>
        </div>

        <div className="nosotros-card">
          <span className="nosotros-icon">⭐</span>
          <h3>Compromiso</h3>
          <p>
            Garantizamos la trazabilidad, calidad y correcta conservación de cada medicamento, velando siempre por tu bienestar.
          </p>
        </div>
      </div>
    </section>
  );
}