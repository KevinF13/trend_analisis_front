// src/App.js
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer'; // Asumo que tienes esto
import Home from './pages/Home';
import './App.css'; 

// IMPORTAMOS LO NUEVO
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const TrendAnalisis = lazy(() => import('./pages/TrendAnalisis'));
const ActualizacionDatosProducto = lazy(() => import('./pages/ActualizacionDatosProducto'));

function App() {
  return (
    // 1. Envolvemos todo en AuthProvider para que el estado sea global
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Header />
          <main className="main-content">
            <Suspense fallback={<div className="route-loading" role="status">Cargando módulo...</div>}>
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
            </Suspense>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
