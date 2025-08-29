import React, { useState, useEffect } from 'react';
import './TrendAnalisis.css'; // Estilos para la página

const TrendAnalisis = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Aquí debes reemplazar esta URL con la URL de tu API
        const response = await fetch('https://api.example.com/trends');
        if (!response.ok) {
          throw new Error(`Error en la red: ${response.statusText}`);
        }
        const apiData = await response.json();
        setData(apiData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // El array vacío asegura que se ejecute solo una vez al montar el componente

  if (loading) {
    return <div className="loading-state">Cargando datos...</div>;
  }

  if (error) {
    return <div className="error-state">Error: {error}</div>;
  }

  return (
    <div className="trend-container">
      <h1>Análisis de Tendencias</h1>
      {/* Aquí renderizas los datos que trajiste de la API */}
      <ul className="trend-list">
        {data.map((item, index) => (
          <li key={index} className="trend-item">
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </li>
        ))}
      </ul>
      {data.length === 0 && <p className="no-data">No se encontraron datos de tendencias.</p>}
    </div>
  );
};

export default TrendAnalisis;