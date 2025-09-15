// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css'; // Asegúrate de crear este archivo para los estilos

const Header = () => {
  return (
    <header className="main-header">
      <nav className="header-nav">
        <Link to="/" className="logo">🧑‍🔬​​ Trend de Análisis</Link>
        <ul className="nav-links">
          <li>
            <Link to="/">Inicio</Link>
          </li>
          <li>
            <Link to="/trend_analisis">Análisis de Tendencias</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;