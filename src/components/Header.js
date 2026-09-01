import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const PASSWORD_CORRECTA = 'AFISICA';

  const handleValidation = (event) => {
    event.preventDefault();

    if (password === PASSWORD_CORRECTA) {
      login();
      setShowModal(false);
      setPassword('');
      setError('');
      navigate('/actualizacion_datos');
      return;
    }

    setError('Contraseña incorrecta');
  };

  const closeModal = () => {
    setShowModal(false);
    setPassword('');
    setError('');
  };

  const handleDataAccess = () => {
    if (isAuthenticated) {
      navigate('/actualizacion_datos');
      return;
    }

    setShowModal(true);
  };

  return (
    <>
      <header className="main-header">
        <nav className="header-nav" aria-label="Navegación principal">
          <NavLink to="/" end className="logo" aria-label="Grupo CID — Inicio">
            <span className="sr-only">Grupo CID</span>
          </NavLink>

          <ul className="nav-links">
            <li>
              <NavLink to="/" end>Inicio</NavLink>
            </li>
            <li>
              <NavLink to="/trend_analisis">Análisis de Tendencias</NavLink>
            </li>
            <li>
              <button
                type="button"
                className={`nav-btn-link ${location.pathname === '/actualizacion_datos' ? 'active' : ''}`}
                onClick={handleDataAccess}
              >
                Actualización Datos
              </button>
            </li>
          </ul>
        </nav>
      </header>

      {showModal && (
        <div
          className="modal-overlay header-access-modal"
          onMouseDown={(event) => event.target === event.currentTarget && closeModal()}
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="access-modal-title"
          >
            <p className="modal-eyebrow">Área administrativa</p>
            <h3 id="access-modal-title">Acceso restringido</h3>
            <p>Ingresa la contraseña de administrador para continuar.</p>

            <form onSubmit={handleValidation}>
              <label className="password-label" htmlFor="admin-password">Contraseña</label>
              <input
                id="admin-password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                autoFocus
                className="password-input"
              />
              {error && <p className="error-msg" role="alert">{error}</p>}

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-cancel">
                  Cancelar
                </button>
                <button type="submit" className="btn-confirm">
                  Ingresar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
