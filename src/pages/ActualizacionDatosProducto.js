import React, { useState, useCallback } from 'react';
import './ActualizacionDatosProducto.css'; // Importa el archivo CSS
// Función simulada para obtener datos de la API
// En un caso real, harías una llamada 'fetch' o 'axios' aquí
// Función simulada para obtener datos de la API
const fetchProductData = async (lote) => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulación de retardo

  if (lote.toUpperCase() === '25WB0603') {
    return {
      producto: 'BIOFIT FIBRA NATURAL',
      laboratorio: 'PHARMBRAND',
      control: 'PH0783-Y',
      fechaIngreso: '4/6/2025'
    };
  } else {
    return null;
  }
};

const ActualizacionDatosProducto = () => {
  const [lote, setLote] = useState('');
  const [data, setData] = useState({
    producto: '',
    laboratorio: '',
    control: '',
    fechaIngreso: ''
  });
  const [observaciones, setObservaciones] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para manejar la búsqueda de datos
  const handleSearch = useCallback(async () => {
    if (!lote.trim()) {
      setError('Por favor, ingresa un número de LOTE.');
      setData({ producto: '', laboratorio: '', control: '', fechaIngreso: '' });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchProductData(lote.trim().toUpperCase());

      if (result) {
        setData(result);
      } else {
        setError(`⚠️ No se encontraron datos para el LOTE: ${lote}`);
        setData({ producto: '', laboratorio: '', control: '', fechaIngreso: '' });
      }
    } catch (err) {
      setError('❌ Ocurrió un error de conexión al buscar los datos.');
      setData({ producto: '', laboratorio: '', control: '', fechaIngreso: '' });
    } finally {
      setIsLoading(false);
    }
  }, [lote]);

  // Ejecuta la búsqueda si se presiona "Enter" en el campo LOTE
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && lote.trim()) {
      handleSearch();
    }
  };

  // Componente auxiliar para las filas de datos
  const DataRow = ({ label, value, isEditable = false, onChange = () => {}, isLote = false }) => (
    <div className={`data-row ${isEditable ? 'editable' : ''}`}>
      <div className={`data-label ${isEditable ? 'label-accent' : ''}`}>{label}</div>
      <div className="data-value-wrapper">
        {isEditable ? (
          <textarea
            className="input-field editable-textarea"
            value={value}
            onChange={onChange}
            placeholder="Escribe aquí las observaciones..."
            rows="3"
          />
        ) : (
          <div className={`input-field display-value ${isLote ? 'lote-value' : ''}`}>
            {value || 'N/A'}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="product-search-container">
      <header>
        <h1>Consulta y Actualización de Datos</h1>
      </header>

      <div className="form-panel">
        <h3>Datos de Búsqueda y Control</h3>

        {/* Campo de LOTE y Botón de Búsqueda */}
        <div className="search-group">
          <div className="input-group">
            <label htmlFor="lote-input">LOTE</label>
            <input
              id="lote-input"
              type="text"
              value={lote}
              onChange={(e) => setLote(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ej: 25WB0603"
            />
          </div>
          <button 
            className="search-button"
            onClick={handleSearch} 
            disabled={isLoading || !lote.trim()}
          >
            {isLoading ? '🔎 Buscando...' : 'Buscar Lote'}
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}
        
        {/* Sección de Datos Autocompletados */}
        <div className="data-display-section">
          <DataRow label="PRODUCTO" value={data.producto} isLote={true} />
          <DataRow label="LABORATORIO" value={data.laboratorio} />
          <DataRow label="CONTROL" value={data.control} />
          <DataRow label="FECHA DE INGRESO" value={data.fechaIngreso} />
        </div>

        {/* Campo de Observaciones (Editable) */}
        <DataRow
          label="OBSERVACIONES"
          value={observaciones}
          isEditable={true}
          onChange={(e) => setObservaciones(e.target.value)}
        />
        
        {/* Botón de Guardar Observaciones (Opcional, si tu app guarda esto) */}
        <button className="save-button" disabled={!data.producto}>
            Guardar Observaciones
        </button> 
      </div>

    </div>
  );
};

export default ActualizacionDatosProducto;