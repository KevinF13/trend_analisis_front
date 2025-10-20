import React, { useState, useCallback } from 'react';
import './ActualizacionDatosProducto.css'; // Asegúrate de que este archivo exista

// --- 1. CONFIGURACIÓN DE DATOS DE ANÁLISIS ---

// Lista completa de campos de análisis disponibles
const ALL_ANALYSIS_FIELDS = [
  // Análisis de Materia Prima
  'AGUA DESTILADA', 'AGUA DE ENJUAGUE', 'AGUA DESMINERALIZADA',
  'HUMEDAD', 'IDENTIFICACION', 'CUANTIFICACION',
  // Análisis de Producto en Proceso
  'POLVO', 'DESINTEGRACION', 'NUCLEO', 'DESINTEGRACION DE BARRERA',
  'DISOLUCION', 'ACTIVO DE CUBIERTA', 'OBSERVACION MICROSCOPICA',
  'GRANEL', 'BIOBURDEN'
];

// Función simulada para obtener datos de la API
const fetchProductData = async (lote) => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulación de retardo

  if (lote.toUpperCase() === '25WB0603') {
    return {
      producto: 'BIOFIT FIBRA NATURAL',
      laboratorio: 'PHARMBRAND',
      control: 'PH0783-Y',
      fechaIngreso: '4/6/2025',
      // Datos de análisis cargados para este lote (solo se muestran los que tengan valor)
      analysis: {
        'AGUA DESTILADA': 'Cumple',
        'HUMEDAD': '3.5%',
        'POLVO': 'Aprobado',
        'DESINTEGRACION': '15:30 min (2025-06-04)', // Simula el formato de fecha de la imagen
        'DISOLUCION': '99.8%',
        'BIOBURDEN': 'Aprobado'
      }
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
  const [analysisData, setAnalysisData] = useState({});
  const [observaciones, setObservaciones] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [newAnalysisField, setNewAnalysisField] = useState('');
  const [newAnalysisValue, setNewAnalysisValue] = useState('');
  
  const handleSearch = useCallback(async () => {
    if (!lote.trim()) {
      setError('Por favor, ingresa un número de LOTE.');
      setData({ producto: '', laboratorio: '', control: '', fechaIngreso: '' });
      setAnalysisData({}); 
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisData({});
    setNewAnalysisField('');
    setNewAnalysisValue('');
    
    try {
      const result = await fetchProductData(lote.trim().toUpperCase());

      if (result) {
        setData(result);
        setAnalysisData(result.analysis || {}); 
      } else {
        setError(`⚠️ No se encontraron datos para el LOTE: ${lote}`);
        setData({ producto: '', laboratorio: '', control: '', fechaIngreso: '' });
        setAnalysisData({});
      }
    } catch (err) {
      setError('❌ Ocurrió un error de conexión al buscar los datos.');
      setData({ producto: '', laboratorio: '', control: '', fechaIngreso: '' });
      setAnalysisData({});
    } finally {
      setIsLoading(false);
    }
  }, [lote]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && lote.trim()) {
      handleSearch();
    }
  };

  // Usamos una función simple para mostrar mensajes, ya que 'alert' está restringido.
  const showMessage = (message) => {
    console.log(message); // En un entorno real, usarías un modal o toast.
  };

  const handleAddAnalysisData = () => {
    if (newAnalysisField && newAnalysisValue.trim()) {
      setAnalysisData(prevData => ({
        ...prevData,
        [newAnalysisField]: newAnalysisValue.trim()
      }));
      showMessage(`Dato de ${newAnalysisField} añadido con valor: ${newAnalysisValue.trim()}`);
      setNewAnalysisField('');
      setNewAnalysisValue('');
    } else {
      showMessage('¡Atención! Debes seleccionar un campo y escribir un valor para añadirlo.');
    }
  };

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

  const availableAnalysisFields = ALL_ANALYSIS_FIELDS.filter(field => !analysisData.hasOwnProperty(field));

  return (
    <div className="product-search-container">
      <header>
          <h1>Consulta y Actualización de Datos</h1>
      </header>
      
      {/* --- NUEVO CONTENEDOR DE DOBLE COLUMNA --- */}
      <div className="main-content-wrapper">

        {/* --- COLUMNA IZQUIERDA: BÚSQUEDA Y CONTROL --- */}
        <div className="form-panel">
          <h3>Datos de Búsqueda y Control</h3>

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
          
          <div className="data-display-section">
            <DataRow label="PRODUCTO" value={data.producto} isLote={true} />
            <DataRow label="LABORATORIO" value={data.laboratorio} />
            <DataRow label="CONTROL" value={data.control} />
            <DataRow label="FECHA DE INGRESO" value={data.fechaIngreso} />
          </div>

          {/* Campo de Observaciones (Editable) y Botón de Guardar */}
          {data.producto && (
            <>
              <DataRow
                label="OBSERVACIONES"
                value={observaciones}
                isEditable={true}
                onChange={(e) => setObservaciones(e.target.value)}
              />
              
              <button className="save-button" disabled={!data.producto}>
                  Guardar Cambios y Observaciones
              </button>
            </>
          )}
        </div>
        
        {/* --- COLUMNA DERECHA: DATOS DE ANÁLISIS --- */}
        {data.producto && (
          <div className="analysis-panel">
            <h3>Resultados de Análisis (Solo Campos Llenos)</h3>
            
            {/* Muestra solo los campos con datos */}
            <div className="analysis-results">
              {Object.entries(analysisData).length > 0 ? (
                  Object.entries(analysisData).map(([key, value]) => (
                      <div key={key} className="analysis-row">
                          <span className="analysis-label">{key}:</span>
                          <span className="analysis-value">{value}</span>
                      </div>
                  ))
              ) : (
                  <p className="no-data-message">No hay resultados de análisis registrados para este lote.</p>
              )}
            </div>

            <hr className="divider" /> 

            {/* Selector para Ingresar Nuevo Dato */}
            <div className="new-analysis-group">
              <h4>➕ Ingresar Nuevo Dato</h4>
              <div className="input-group-inline">
                  <select
                      className="select-field"
                      value={newAnalysisField}
                      onChange={(e) => setNewAnalysisField(e.target.value)}
                      disabled={availableAnalysisFields.length === 0}
                  >
                      <option value="">-- Seleccionar Campo --</option>
                      {availableAnalysisFields.map(field => (
                          <option key={field} value={field}>{field}</option>
                      ))}
                  </select>
                  <input
                      type="text"
                      className="input-field"
                      value={newAnalysisValue}
                      onChange={(e) => setNewAnalysisValue(e.target.value)}
                      placeholder="Valor / Resultado"
                      disabled={!newAnalysisField}
                  />
                  <button 
                      className="add-button" 
                      onClick={handleAddAnalysisData}
                      disabled={!newAnalysisField || !newAnalysisValue.trim()}
                  >
                      Añadir
                  </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default ActualizacionDatosProducto;
