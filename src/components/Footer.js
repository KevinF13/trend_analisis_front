import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-section footer-logo">
          <img
            src="/images/LOGO_GRUPO_CID-removebg-preview.png"
            alt="Grupo Corporativo CID"
            width="745"
            height="335"
            loading="lazy"
            decoding="async"
            className="logo-img"
          />
          <div>
            <span className="footer-badge">Portal de calidad</span>
            <p className="description">Análisis y datos confiables para mejores decisiones.</p>
          </div>
        </div>

        <div className="footer-section footer-links">
          <span className="footer-link-label">Grupo Corporativo CID</span>
          <a
            href="https://ec.linkedin.com/company/grupo-corporativo-cid"
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
          >
            LinkedIn
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Trend Análisis Calidad.</p>
        <p>
          Front End:{' '}
          <a href="https://ec.linkedin.com/in/kevin-fajardo-17b934194" target="_blank" rel="noopener noreferrer">
            Ing. Kevin Fajardo
          </a>
        </p>
        <p>
          Back End:{' '}
          <a href="https://ec.linkedin.com/in/carlosandradevalencia" target="_blank" rel="noopener noreferrer">
            Ing. Carlos Andrade
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
