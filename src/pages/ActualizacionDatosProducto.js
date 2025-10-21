import React, { useState, useCallback } from 'react';
import './ActualizacionDatosProducto.css';

// Componente auxiliar para determinar la clase de color basada en el estado
const getStatusClass = (status) => {
  const upperStatus = (status || '').toUpperCase();
  if (upperStatus === 'APR' || upperStatus === 'APROBADO' || upperStatus.includes('CUMPLE') || upperStatus.includes('100')) {
    return 'status-approved';
  } else if (upperStatus === 'NO APR' || upperStatus === 'RECHAZADO') {
    return 'status-rejected';
  }
  return 'status-neutral';
};

// --- 1. CONFIGURACIÓN DE DATOS DE ANÁLISIS Y CLASIFICACIÓN ---

// Lista completa de campos de análisis disponibles
const ANALYSIS_FIELDS_MAP = {
  'ANALISIS DE MATERIA PRIMA': [
    'AGUA DESTILADA', 'AGUA DE ENJUAGUE', 'AGUA DESMINERALIZADA',
    'HUMEDAD', 'IDENTIFICACION', 'CUANTIFICACION',
  ],
  'ANALISIS DE PRODUCTO EN PROCESO': [
    'POLVO', 'DESINTEGRACION', 'NUCLEO', 'DESINTEGRACION DE BARRERA',
    'DISOLUCION', 'ACTIVO DE CUBIERTA', 'OBSERVACION MICROSCOPICA',
    'GRANEL', 'BIOBURDEN'
  ]
};

// Aplanamos la lista para referencia general
const ALL_ANALYSIS_FIELDS = [
  ...ANALYSIS_FIELDS_MAP['ANALISIS DE MATERIA PRIMA'],
  ...ANALYSIS_FIELDS_MAP['ANALISIS DE PRODUCTO EN PROCESO'],
];


// --- 2. FUNCIÓN SIMULADA PARA OBTENER DATOS DE LA API ---
const fetchProductData = async (lote) => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulación de retardo

  if (lote.toUpperCase() === '25WB0603') {
    return {
      producto: 'BIOFIT FIBRA NATURAL',
      laboratorio: 'PHARMBRAND',
      control: 'PH0783-Y',
      fechaIngreso: '4/6/2025',
      
      // Datos de análisis existentes
      analysis: {
        'AGUA DESTILADA': 'Cumple',
        'HUMEDAD': '3.5%',
        'POLVO': 'Aprobado',
        'DESINTEGRACION': '15:30 min (2025-06-04)', 
        'DISOLUCION': '99.8%',
        'BIOBURDEN': 'Aprobado'
      },

      // --- DATOS DE TRAZABILIDAD ---
      trazabilidad: {
        analisisSemiElaborado: {
          noImpresos: 'P0101',
          impresos: 'Q0505',
          areaQuimica: 'APR', 
          areaBiologica: 'APR'
        },
        analisisEmpacado: {
          areaQuimica: 'APR',
          areaBiologica: 'NO APR' 
        },
        recordProduccion: {
          fechaRecepcion: '02-feb-2030',
          lotes: [
            { orden: 34, unidStd: 34, unidReal: 3, rendimiento: '8.82%' },
            { orden: 35, unidStd: 50, unidReal: 48, rendimiento: '96.00%' },
          ]
        },
        productoEmpacado: {
          registros: [
            { recepcion: '12-dic-20', unidStd: 12, unidReal: 12, rendimiento: '100%', presentacion: 123 },
            { recepcion: '15-dic-20', unidStd: 20, unidReal: 18, rendimiento: '90%', presentacion: 456 },
          ]
        },
        tiemposControl: {
          controlProceso: 12,
          revisionRecord: 12,
          liberacionProducto: '08-oct-25'
        }
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
    fechaIngreso: '',
    trazabilidad: null, 
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
      setData({ producto: '', laboratorio: '', control: '', fechaIngreso: '', trazabilidad: null });
      setAnalysisData({}); 
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisData({});
    setObservaciones('');
    setNewAnalysisField('');
    setNewAnalysisValue('');
    
    try {
      const result = await fetchProductData(lote.trim().toUpperCase());

      if (result) {
        const { analysis, trazabilidad, ...productData } = result;
        setData({ ...productData, trazabilidad: trazabilidad || null });
        setAnalysisData(analysis || {}); 
      } else {
        setError(`⚠️ No se encontraron datos para el LOTE: ${lote}`);
        setData({ producto: '', laboratorio: '', control: '', fechaIngreso: '', trazabilidad: null });
        setAnalysisData({});
      }
    } catch (err) {
      setError('❌ Ocurrió un error de conexión al buscar los datos.');
      setData({ producto: '', laboratorio: '', control: '', fechaIngreso: '', trazabilidad: null });
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

  const showMessage = (message) => {
    alert(message);
    console.log(message);
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
            value={observaciones}
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

  const renderAnalysisGroup = (groupTitle, fields) => {
    const filledFields = fields.filter(field => analysisData.hasOwnProperty(field));
    
    if (filledFields.length === 0) return null;

    return (
      <div key={groupTitle} className="analysis-group">
        <h4 className="analysis-group-title">{groupTitle}</h4>
        <div className="analysis-results-grid">
          {filledFields.map(field => (
            <div key={field} className="analysis-row">
              <span className="analysis-label">{field}:</span>
              <span className={`analysis-value ${getStatusClass(analysisData[field])}`}>{analysisData[field]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // --- COMPONENTE DE TRAZABILIDAD (Mantenido el contenido, se mueve su ubicación) ---
  const TrazabilidadSection = ({ trazabilidad }) => {
    if (!trazabilidad) return null;

    return (
      // CLASE AHORA ES UN PANEL GRANDE SEPARADO
      <div className="trazability-panel"> 
        <h3 className="trazability-title">📜 Registro Histórico y Trazabilidad</h3>
        
        <div className="trazability-content-grid">
          
          {/* 1. Análisis Semi-Elaborado */}
          <div className="trazability-card half-width">
            <p className="card-title">Análisis de Producto Semi-Elaborado</p>
            <div className="record-row-display">
              <span className="record-label-mini">NO IMPRESOS (P)</span>
              <span className="record-value-bold">{trazabilidad.analisisSemiElaborado.noImpresos}</span>
            </div>
            <div className="record-row-display">
              <span className="record-label-mini">IMPRESOS (Q)</span>
              <span className="record-value-bold">{trazabilidad.analisisSemiElaborado.impresos}</span>
            </div>
            <div className="record-row-display">
              <span className="record-label-mini">ÁREA QUÍMICA</span>
              <span className={`record-value-bold ${getStatusClass(trazabilidad.analisisSemiElaborado.areaQuimica)}`}>{trazabilidad.analisisSemiElaborado.areaQuimica}</span>
            </div>
            <div className="record-row-display">
              <span className="record-label-mini">ÁREA BIOLÓGICA</span>
              <span className={`record-value-bold ${getStatusClass(trazabilidad.analisisSemiElaborado.areaBiologica)}`}>{trazabilidad.analisisSemiElaborado.areaBiologica}</span>
            </div>
          </div>
          
          {/* 2. Análisis Empacado */}
          <div className="trazability-card half-width">
            <p className="card-title">Análisis de Producto Empacado</p>
            <div className="record-row-display">
              <span className="record-label-mini">ÁREA QUÍMICA (R)</span>
              <span className={`record-value-bold ${getStatusClass(trazabilidad.analisisEmpacado.areaQuimica)}`}>{trazabilidad.analisisEmpacado.areaQuimica}</span>
            </div>
            <div className="record-row-display">
              <span className="record-label-mini">ÁREA BIOLÓGICA (R)</span>
              <span className={`record-value-bold ${getStatusClass(trazabilidad.analisisEmpacado.areaBiologica)}`}>{trazabilidad.analisisEmpacado.areaBiologica}</span>
            </div>
          </div>

          {/* 3. Record de Producción */}
          <div className="trazability-card full-width">
            <p className="card-title">Record de Producción (Recepción: <span className="highlight-text">{trazabilidad.recordProduccion.fechaRecepcion}</span>)</p>
            <div className="production-block-grid production-grid">
              <span className="header-cell"># ORDEN</span>
              <span className="header-cell">UNID. STD.</span>
              <span className="header-cell">UNID. REAL.</span>
              <span className="header-cell">% REND.</span>
              {trazabilidad.recordProduccion.lotes.map((lote, index) => (
                <React.Fragment key={index}>
                  <span className="data-cell">{lote.orden}</span>
                  <span className="data-cell">{lote.unidStd}</span>
                  <span className="data-cell">{lote.unidReal}</span>
                  <span className={`data-cell ${getStatusClass(lote.rendimiento)}`}>{lote.rendimiento}</span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 4. Producto Empacado */}
          <div className="trazability-card full-width">
            <p className="card-title">Producto Empacado - Registros</p>
            <div className="production-block-grid packed-grid">
              <span className="header-cell">RECEPCIÓN</span>
              <span className="header-cell">UNID. STD.</span>
              <span className="header-cell">UNID. REAL.</span>
              <span className="header-cell">% REND.</span>
              <span className="header-cell">PRESENTACIÓN</span>
              {trazabilidad.productoEmpacado.registros.map((reg, index) => (
                <React.Fragment key={index}>
                  <span className="data-cell">{reg.recepcion}</span>
                  <span className="data-cell">{reg.unidStd}</span>
                  <span className="data-cell">{reg.unidReal}</span>
                  <span className={`data-cell ${getStatusClass(reg.rendimiento)}`}>{reg.rendimiento}</span>
                  <span className="data-cell">{reg.presentacion}</span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 5. Tiempos de Control */}
          <div className="trazability-card full-width time-control-group">
            <p className="card-title">Tiempos de Control y Liberación</p>
            <div className="time-control-grid">
              <div className="time-control-item">
                <span className="record-label-mini">CONTROL EN PROCESO (DÍAS)</span>
                <span className="record-value-bold time-value">{trazabilidad.tiemposControl.controlProceso}</span>
              </div>
              <div className="time-control-item">
                <span className="record-label-mini">REVISIÓN DEL RECORD (DÍAS)</span>
                <span className="record-value-bold time-value">{trazabilidad.tiemposControl.revisionRecord}</span>
              </div>
              <div className="time-control-item">
                <span className="record-label-mini">FECHA DE LIBERACIÓN</span>
                <span className="record-value-bold time-value release-date-value">{trazabilidad.tiemposControl.liberacionProducto}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };
  
  const availableAnalysisFields = ALL_ANALYSIS_FIELDS.filter(field => !analysisData.hasOwnProperty(field));

  // ... código anterior (imports y lógica) ...

  const wrapperClassName = data.producto 
    ? "main-content-wrapper" 
    : "main-content-wrapper single-column-mode";

  // 🎯 CAMBIO CLAVE: Cambiamos el div.product-search-container por main.app-main-container
  return (
    <main className="app-main-container"> 
      <header>
        <h1 className="header-title">Consulta y Actualización de Datos de Lote</h1>
      </header>
      
      <div className={wrapperClassName}>
        
        {/* --- CONTENEDOR DE COLUMNAS SUPERIORES (FILA 1) --- */}
        <div className="top-sections-grid">

            {/* --- COLUMNA IZQUIERDA: BÚSQUEDA Y CONTROL --- */}
            <div className="form-panel">
              {/* ... (Contenido del form-panel) ... */}
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
                  
                  <button className="save-button" onClick={() => showMessage('¡Guardado simulado!')} disabled={!data.producto}>
                    Guardar Cambios y Observaciones
                  </button>
                </>
              )}
            </div>
            
            {/* --- COLUMNA DERECHA: DATOS DE ANÁLISIS --- */}
            {data.producto && (
              <div className="analysis-panel">
                {/* ... (Contenido del analysis-panel) ... */}
                <h3>Resultados de Análisis</h3>
                
                <div className="analysis-results">
                  {renderAnalysisGroup('ANALISIS DE MATERIA PRIMA', ANALYSIS_FIELDS_MAP['ANALISIS DE MATERIA PRIMA'])}
                  {renderAnalysisGroup('ANALISIS DE PRODUCTO EN PROCESO', ANALYSIS_FIELDS_MAP['ANALISIS DE PRODUCTO EN PROCESO'])}
                  
                  {Object.entries(analysisData).length === 0 && (
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
        
        {/* --- TERCER BLOQUE: TRAZABILIDAD (ANCHO COMPLETO - FILA 2) --- */}
        {data.producto && <TrazabilidadSection trazabilidad={data.trazabilidad} />}
        
      </div>
    </main>
  );
};

export default ActualizacionDatosProducto;