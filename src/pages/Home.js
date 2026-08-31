import React, { useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 19V5M4 19h16" />
    <path d="m7 15 4-4 3 2 5-6" />
  </svg>
);

const DataIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
    <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3 5 6v5c0 4.6 2.8 8.3 7 10 4.2-1.7 7-5.4 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const Home = () => {
  const { isAuthenticated } = useAuth();

  useLayoutEffect(() => {
    document.body.classList.add('home-page-active');

    return () => document.body.classList.remove('home-page-active');
  }, []);

  const requestDataAccess = () => {
    document.querySelector('.nav-btn-link')?.click();
  };

  return (
    <div className="home-page">
      <div className="home-workspace" aria-labelledby="home-title">
        <section className="home-intro">
          <img
            className="home-intro__image"
            src="/images/laboratorio.jpg"
            alt=""
            aria-hidden="true"
          />
          <div className="home-intro__overlay" />

          <div className="home-intro__content">
            <div>
              <p className="home-eyebrow">
                <span aria-hidden="true" />
                Portal interno de calidad
              </p>
              <h1 id="home-title">Control de calidad, todo en un mismo lugar.</h1>
              <p className="home-subtitle">
                Consulta tendencias y mantén actualizada la información de cada lote
                con un flujo claro, rápido y confiable.
              </p>
              <Link to="/trend_analisis" className="home-primary-action">
                Comenzar análisis
                <ArrowIcon />
              </Link>
            </div>

            <div className="home-process" aria-label="Flujo del análisis">
              <div className="home-process__title">
                <ChartIcon />
                <span><strong>Un proceso claro</strong>De la consulta al reporte</span>
              </div>
              <ol>
                <li><span>01</span>Selecciona</li>
                <li><span>02</span>Analiza</li>
                <li><span>03</span>Documenta</li>
              </ol>
            </div>
          </div>
        </section>

        <section className="home-tools" aria-labelledby="tools-title">
          <header className="home-tools__header">
            <div>
              <p>Accesos rápidos</p>
              <h2 id="tools-title">¿Qué necesitas hacer hoy?</h2>
            </div>
            <span>2 herramientas</span>
          </header>

          <article className="tool-card">
            <div className="tool-card__visual">
              <img
                src="/images/trendanalisi.jpg"
                alt="Muestras utilizadas en control de calidad"
              />
              <span>Consulta</span>
            </div>
            <div className="tool-card__content">
              <span className="tool-card__icon"><ChartIcon /></span>
              <div>
                <h3>Análisis de tendencias</h3>
                <p>
                  Filtra resultados, identifica variaciones y revisa el comportamiento
                  de los controles en el tiempo.
                </p>
                <p className="tool-card__features">Gráficos · Límites · Exportación PDF</p>
              </div>
              <Link to="/trend_analisis" className="tool-card__action">
                Abrir análisis
                <ArrowIcon />
              </Link>
            </div>
          </article>

          <article className="tool-card">
            <div className="tool-card__visual">
              <img
                src="/images/act_datos.jpg"
                alt="Profesionales revisando información de productos"
              />
              <span className="tool-card__restricted"><ShieldIcon /> Acceso restringido</span>
            </div>
            <div className="tool-card__content">
              <span className="tool-card__icon"><DataIcon /></span>
              <div>
                <h3>Actualización de datos</h3>
                <p>
                  Consulta lotes, completa resultados y actualiza la trazabilidad
                  del producto.
                </p>
                <p className="tool-card__features">Lotes · Resultados · Trazabilidad</p>
              </div>
              {isAuthenticated ? (
                <Link to="/actualizacion_datos" className="tool-card__action">
                  Abrir módulo
                  <ArrowIcon />
                </Link>
              ) : (
                <button type="button" className="tool-card__action" onClick={requestDataAccess}>
                  Validar acceso
                  <ArrowIcon />
                </button>
              )}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

export default Home;
