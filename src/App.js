import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import TrendAnalisis from './pages/TrendAnalisis';
import ActualizacionDatosProducto from './pages/ActualizacionDatosProducto';
import './App.css'; // Estilos globales de la aplicación

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/trend_analisis" element={<TrendAnalisis />} />
            <Route path="actualizacion_datos" element={<ActualizacionDatosProducto />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;