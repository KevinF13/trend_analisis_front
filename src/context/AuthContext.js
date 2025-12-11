// src/context/AuthContext.js
import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 1. Leemos de sessionStorage (Solo vive en esta pestaña)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('trend_auth') === 'true';
  });

  const login = () => {
    // 2. Guardamos en sessionStorage
    sessionStorage.setItem('trend_auth', 'true');
    setIsAuthenticated(true);
  };

  const logout = () => {
    // 3. Borramos de sessionStorage
    sessionStorage.removeItem('trend_auth');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);