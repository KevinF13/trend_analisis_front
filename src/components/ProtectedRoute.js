// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Si no está autenticado, lo mandamos al inicio (Replace evita que puedan volver atrás con el botón del navegador)
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Si tiene permiso, mostramos la página
  return children;
};

export default ProtectedRoute;