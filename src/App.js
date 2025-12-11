// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer'; // Asumo que tienes esto
import Home from './pages/Home';
import TrendAnalisis from './pages/TrendAnalisis';
import ActualizacionDatosProducto from './pages/ActualizacionDatosProducto';
import './App.css'; 

// IMPORTAMOS LO NUEVO
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    // 1. Envolvemos todo en AuthProvider para que el estado sea global
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/trend_analisis" element={<TrendAnalisis />} />
              
              {/* 2. PROTEGEMOS ESTA RUTA ESPECÍFICA */}
              <Route 
                path="/actualizacion_datos" 
                element={
                  <ProtectedRoute>
                    <ActualizacionDatosProducto />
                  </ProtectedRoute>
                } 
              />
              
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;