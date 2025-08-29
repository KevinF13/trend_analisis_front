// src/components/Footer.js
import React from 'react';
import './Footer.css'; // Archivo CSS para el footer

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-section footer-logo">
          <img src="./images/LOGO FARMACID.png" alt="Logo" className="logo-img" />
          <p className="description">Análisis y datos de alta calidad.</p>
        </div>
        
        <div className="footer-section footer-links">
          <h4>Síguenos</h4>
          <div className="social-links">
            {/* <a href="https://twitomter.c" target="_blank" rel="noopener noreferrer" className="social-link">Twitter</a> */}
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link">LinkedIn</a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
  <p>&copy; {new Date().getFullYear()} Trend Análisis Calidad. Todos los derechos reservados.</p>
  <p>
    Desarrollador Front End:{' '}
    <a
      href="https://ec.linkedin.com/in/kevin-fajardo-17b934194"
      target="_blank"
      rel="noopener noreferrer"
    >
      Kevin Fajardo
    </a>
  </p>
  <p>
    Desarrollador Back End:{' '}
    <a
      href="https://ec.linkedin.com/in/carlosandradevalencia"
      target="_blank"
      rel="noopener noreferrer"
    >
      Carlos Andrade
    </a>
  </p>
</div>

    </footer>
  );
};

export default Footer;