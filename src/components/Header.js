// src/components/Header.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <--- IMPORTAR ESTO
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // <--- OBTENER LA FUNCIÓN LOGIN
  
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const PASSWORD_CORRECTA = "AFISICA"; 

  const handleValidation = (e) => {
    e.preventDefault();
    if (password === PASSWORD_CORRECTA) {
      // 1. Autorizamos al usuario globalmente
      login(); 
      
      setShowModal(false);
      setPassword('');
      setError('');
      
      // 2. Ahora sí navegamos (el ProtectedRoute nos dejará pasar)
      navigate('/actualizacion_datos');
    } else {
      setError('Contraseña incorrecta');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setPassword('');
    setError('');
  };

  return (
    <>
      <header className="main-header">
        <nav className="header-nav">
          <Link to="/" className="logo">
            {/* <span className="sr-only">Trend de Análisis</span> */}
          </Link>

          <ul className="nav-links">
            <li>
              <Link to="/">Inicio</Link>
            </li>
            <li>
              <Link to="/trend_analisis">Análisis de Tendencias</Link>
            </li>
            <li>
              <button 
                className="nav-btn-link" 
                onClick={() => setShowModal(true)}
              >
                Actualización Datos
              </button>
            </li>
          </ul>
        </nav>
      </header>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Acceso Restringido</h3>
            <p>Por favor ingrese la contraseña de administrador.</p>
            
            <form onSubmit={handleValidation}>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="password-input"
              />
              {error && <p className="error-msg">{error}</p>}
              
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