// src/pages/Home.js
import React from 'react';
import './Home.css'; // Archivo de estilos para la página

const Home = () => {
  return (
    <div className="home-container">
      <h1 className="home-title">Bienvenido al Sistema de Calidad</h1>
      {/* <p className="home-subtitle">Tu portal para el análisis de tendencias de datos.</p> */}
      <div className="home-cta">
        {/* <a href="/trend_analisis" className="cta-button">
          Ir al Análisis
        </a>
        <a href="/ActualizacionDatosProducto" className="cta-button">
          Ir a Actualización de Datos
        </a> */}
      </div>
    </div>
  );
};

export default Home;