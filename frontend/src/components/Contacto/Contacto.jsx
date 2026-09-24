import React from 'react';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import './Contacto.css';

export default function Contacto() {
  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <section className="section contacto-section">
      <div className="contacto-header">
        <h2>Contacto</h2>
        <p className="contacto-lead">
          Escríbenos o visita nuestra sede más cercana. Estamos aquí para atender tus consultas de salud y medicamentos.
        </p>
      </div>

      <div className="contacto-layout">
        {/* Lado izquierdo: Datos informativos y WhatsApp */}
        <div className="contacto-info-card">
          <h3>Información de Atención</h3>
          <p className="contacto-info-sub">
            Puedes comunicarte con nuestros farmacéuticos de turno a través de cualquiera de nuestros canales.
          </p>

          <div className="contacto-item">
            <div className="contacto-icon-box">
              <MapPin size={20} />
            </div>
            <div>
              <strong>Ubicación</strong>
              <span>Av. Universitaria / Puerta Principal UNMSM, Lima</span>
            </div>
          </div>

          <div className="contacto-item">
            <div className="contacto-icon-box">
              <Phone size={20} />
            </div>
            <div>
              <strong>Teléfono</strong>
              <span>(01) 619-7000 Anexo 1234</span>
            </div>
          </div>

          <div className="contacto-item">
            <div className="contacto-icon-box">
              <Mail size={20} />
            </div>
            <div>
              <strong>Correo Electrónico</strong>
              <span>consultas@farmaciasanmarcos.edu.pe</span>
            </div>
          </div>

          <div className="contacto-item">
            <div className="contacto-icon-box">
              <Clock size={20} />
            </div>
            <div>
              <strong>Horario</strong>
              <span>Lunes a Sábado: 7:30 AM - 10:00 PM</span>
            </div>
          </div>

          <a
            href="https://wa.me/51999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--whatsapp btn--full"
          >
            <MessageCircle size={20} />
            Atención rápida por WhatsApp
          </a>
        </div>

        {/* Lado derecho: Formulario visual de consulta */}
        <div className="contacto-form-card">
          <h3>Envíanos un Mensaje</h3>
          <form onSubmit={handleSubmit} className="contacto-form">
            <div className="form-group">
              <label htmlFor="nombre">Nombre completo</label>
              <input type="text" id="nombre" placeholder="Ej. Juan Pérez" />
            </div>

            <div className="form-group">
              <label htmlFor="correo">Correo electrónico</label>
              <input type="email" id="correo" placeholder="correo@ejemplo.com" />
            </div>

            <div className="form-group">
              <label htmlFor="asunto">Asunto</label>
              <select id="asunto" defaultValue="consulta">
                <option value="consulta">Consulta sobre medicamentos</option>
                <option value="stock">Disponibilidad de stock</option>
                <option value="receta">Validación de receta médica</option>
                <option value="otro">Otro motivo</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="mensaje">Mensaje o consulta</label>
              <textarea
                id="mensaje"
                rows="4"
                placeholder="Escribe aquí tu consulta o el producto que necesitas consultar..."
              ></textarea>
            </div>

            <button type="submit" className="btn btn--primary btn--full">
              Enviar Mensaje
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}