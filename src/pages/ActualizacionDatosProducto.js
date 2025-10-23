import React, { useState, useCallback, useMemo } from 'react';
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

// Fila inicial de registro de producción (para agregar)
const INITIAL_RECORD_ROW = { orden: '', unidStd: '', unidReal: '', rendimiento: '' };
// Fila inicial de producto empacado (para agregar)
const INITIAL_PACKED_ROW = { recepcion: '', unidStd: '', unidReal: '', rendimiento: '', presentacion: '' };


// --- 2. FUNCIÓN SIMULADA PARA OBTENER DATOS DE LA API ---
const fetchProductData = async (lote) => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulación de retardo

  if (lote.toUpperCase() === '25WB0603') {
    return {
      producto: 'BIOFIT FIBRA NATURAL',
      laboratorio: 'PHARMBRAND',
      control: 'PH0783-Y',
      fechaIngreso: '2025-06-04', // Formato YYYY-MM-DD para input type="date"
      
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
          fechaRecepcion: '2030-02-02', // Formato YYYY-MM-DD para input type="date"
          lotes: [
            { orden: 34, unidStd: 34, unidReal: 3, rendimiento: '8.82%' },
            { orden: 35, unidStd: 50, unidReal: 48, rendimiento: '96.00%' },
          ]
        },
        productoEmpacado: {
          registros: [
            { recepcion: '2020-12-12', unidStd: 12, unidReal: 12, rendimiento: '100%', presentacion: 123 },
            { recepcion: '2020-12-15', unidStd: 20, unidReal: 18, rendimiento: '90%', presentacion: 456 },
          ]
        },
        tiemposControl: {
          controlProceso: 12,
          revisionRecord: 12,
          liberacionProducto: '2025-10-08' // Formato YYYY-MM-DD para input type="date"
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
      setObservaciones('');
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
        setData({ 
          ...productData, 
          // Aseguramos que los valores sean strings para evitar warnings en inputs controlados.
          // Además, es mejor si la API devuelve fechas en formato ISO (YYYY-MM-DD)
          trazabilidad: trazabilidad || null 
        });
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
    console.log('Datos a guardar (Simulado):', {
      lote,
      data,
      analysisData,
      observaciones
    });
  };
  
  // --- LÓGICA DE ACTUALIZACIÓN DEL CAMPO DE ANÁLISIS ---
  const handleUpdateAnalysis = (field, value) => {
    setAnalysisData(prevData => ({
      ...prevData,
      [field]: value // Esto ya funciona correctamente
    }));
  };

  // --- LÓGICA DE ELIMINACIÓN DEL CAMPO DE ANÁLISIS ---
  const handleRemoveAnalysis = (field) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el campo de análisis "${field}"?`)) {
      setAnalysisData(prevData => {
        const newData = { ...prevData };
        delete newData[field];
        return newData;
      });
      showMessage(`Análisis "${field}" eliminado.`);
    }
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

  // ** CORRECCIÓN: Manejador de actualización para campos simples del panel principal (como fechaIngreso) **
  const handleUpdateDataField = (field, value) => {
    setData(prevData => ({
      ...prevData,
      [field]: value,
    }));
  };

  // --- LÓGICA DE EDICIÓN DE TRAZABILIDAD (CAMPOS SIMPLES) ---
  const handleUpdateTrazabilidadField = (section, field, value) => {
    setData(prevData => ({
      ...prevData,
      trazabilidad: {
        ...prevData.trazabilidad,
        [section]: {
          ...prevData.trazabilidad[section],
          [field]: value
        }
      }
    }));
  };

  // --- LÓGICA DE EDICIÓN DE TABLA DE RECORD DE PRODUCCIÓN ---
  const handleUpdateRecordCell = (rowIndex, key, value) => {
    setData(prevData => {
      const newLotes = [...prevData.trazabilidad.recordProduccion.lotes];
      newLotes[rowIndex] = {
        ...newLotes[rowIndex],
        [key]: value,
      };
      return {
        ...prevData,
        trazabilidad: {
          ...prevData.trazabilidad,
          recordProduccion: {
            ...prevData.trazabilidad.recordProduccion,
            lotes: newLotes,
          }
        }
      };
    });
  };

  // --- LÓGICA PARA AGREGAR FILA EN RECORD DE PRODUCCIÓN ---
  const handleAddNewRecordRow = () => {
    setData(prevData => ({
      ...prevData,
      trazabilidad: {
        ...prevData.trazabilidad,
        recordProduccion: {
          ...prevData.trazabilidad.recordProduccion,
          lotes: [...prevData.trazabilidad.recordProduccion.lotes, { ...INITIAL_RECORD_ROW }],
        }
      }
    }));
  };

  // --- LÓGICA DE EDICIÓN DE TABLA DE PRODUCTO EMPACADO ---
  const handleUpdatePackedCell = (rowIndex, key, value) => {
    setData(prevData => {
      const newRegistros = [...prevData.trazabilidad.productoEmpacado.registros];
      newRegistros[rowIndex] = {
        ...newRegistros[rowIndex],
        [key]: value,
      };
      return {
        ...prevData,
        trazabilidad: {
          ...prevData.trazabilidad,
          productoEmpacado: {
            ...prevData.trazabilidad.productoEmpacado,
            registros: newRegistros,
          }
        }
      };
    });
  };

  // --- LÓGICA PARA AGREGAR FILA EN PRODUCTO EMPACADO ---
  const handleAddNewPackedRow = () => {
    setData(prevData => ({
      ...prevData,
      trazabilidad: {
        ...prevData.trazabilidad,
        productoEmpacado: {
          ...prevData.trazabilidad.productoEmpacado,
          registros: [...prevData.trazabilidad.productoEmpacado.registros, { ...INITIAL_PACKED_ROW }],
        }
      }
    }));
  };
  
  // --- COMPONENTES AUXILIARES DE RENDERIZADO ---

  // Componente modificado para aceptar dateType
  const DataRow = ({ label, value, isEditable = false, onChange = () => {}, isLote = false, dateType = false, field = null }) => (
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
        ) : dateType ? ( // Usamos input type="date" para los campos de fecha
          <input 
            type="date"
            className="input-field editable-date-input"
            value={value}
            onChange={(e) => field && handleUpdateDataField(field, e.target.value)}
            disabled={!field} // Deshabilitar si no es editable
          />
        ) : (
          <div className={`input-field display-value ${isLote ? 'lote-value' : ''}`}>
            {value || 'N/A'}
          </div>
        )}
      </div>
    </div>
  );

  // --- RENDERIZADO DE ANÁLISIS ---
  const renderAnalysisGroup = (groupTitle, fields) => {
    // Filtramos solo los campos que están en analysisData para que solo se muestren los "registrados"
    const currentFields = fields.filter(field => analysisData.hasOwnProperty(field));
    
    // Filtramos los análisis personalizados que no estén en la lista predefinida
    const customFields = Object.keys(analysisData).filter(field => 
        !ALL_ANALYSIS_FIELDS.includes(field) && 
        (groupTitle === 'ANALISIS DE MATERIA PRIMA' ? field.toUpperCase().includes('MATERIA') : field.toUpperCase().includes('PROCESO') || true) // Asignación simple para el ejemplo
    );
    
    // Concatenamos para mostrar los campos existentes y personalizados.
    // En un sistema real, necesitarías una forma más robusta de categorizar campos personalizados.
    const fieldsToRender = [...new Set([...currentFields, ...customFields])];

    if (fieldsToRender.length === 0) return null;

    return (
      <div key={groupTitle} className="analysis-group">
        <h4 className="analysis-group-title">{groupTitle}</h4>
        <div className="analysis-results-grid editable-grid">
          {fieldsToRender.map(field => (
            <div key={field} className="analysis-row editable-row">
              <span className="analysis-label">{field}:</span>
              <input
                type="text"
                className={`analysis-value-input ${getStatusClass(analysisData[field])}`}
                value={analysisData[field] || ''} // Aseguramos que sea string, ya que analysisData[field] puede ser undefined si es un campo custom recién agregado
                onChange={(e) => handleUpdateAnalysis(field, e.target.value)}
                placeholder="Valor de análisis"
              />
              <button 
                className="remove-button" 
                onClick={() => handleRemoveAnalysis(field)}
                title="Eliminar este análisis"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // --- COMPONENTE DE TRAZABILIDAD (MODIFICADO PARA USAR type="date") ---
  const TrazabilidadSection = ({ trazabilidad }) => {
    if (!trazabilidad) return null;

    return (
      <div className="trazability-panel"> 
        <h3 className="trazability-title">📜 Registro Histórico y Trazabilidad</h3>
        
        <div className="trazability-content-grid">
          
          {/* 1. Análisis Semi-Elaborado (EDITABLE) */}
          <div className="trazability-card half-width">
            <p className="card-title">Análisis de Producto Semi-Elaborado</p>
            {/* NO IMPRESOS */}
            <div className="record-row-display editable-row">
              <span className="record-label-mini">NO IMPRESOS (P)</span>
              <input 
                type="text" 
                className="record-value-input" 
                value={trazabilidad.analisisSemiElaborado.noImpresos || ''}
                onChange={(e) => handleUpdateTrazabilidadField('analisisSemiElaborado', 'noImpresos', e.target.value)}
              />
            </div>
            {/* IMPRESOS */}
            <div className="record-row-display editable-row">
              <span className="record-label-mini">IMPRESOS (Q)</span>
              <input 
                type="text" 
                className="record-value-input" 
                value={trazabilidad.analisisSemiElaborado.impresos || ''}
                onChange={(e) => handleUpdateTrazabilidadField('analisisSemiElaborado', 'impresos', e.target.value)}
              />
            </div>
            {/* ÁREA QUÍMICA */}
            <div className="record-row-display editable-row">
              <span className="record-label-mini">ÁREA QUÍMICA</span>
              <input 
                type="text" 
                className={`record-value-input ${getStatusClass(trazabilidad.analisisSemiElaborado.areaQuimica)}`}
                value={trazabilidad.analisisSemiElaborado.areaQuimica || ''}
                onChange={(e) => handleUpdateTrazabilidadField('analisisSemiElaborado', 'areaQuimica', e.target.value)}
              />
            </div>
            {/* ÁREA BIOLÓGICA */}
            <div className="record-row-display editable-row">
              <span className="record-label-mini">ÁREA BIOLÓGICA</span>
              <input 
                type="text" 
                className={`record-value-input ${getStatusClass(trazabilidad.analisisSemiElaborado.areaBiologica)}`}
                value={trazabilidad.analisisSemiElaborado.areaBiologica || ''}
                onChange={(e) => handleUpdateTrazabilidadField('analisisSemiElaborado', 'areaBiologica', e.target.value)}
              />
            </div>
          </div>
          
          {/* 2. Análisis Empacado (EDITABLE) */}
          <div className="trazability-card half-width">
            <p className="card-title">Análisis de Producto Empacado</p>
            {/* ÁREA QUÍMICA */}
            <div className="record-row-display editable-row">
              <span className="record-label-mini">ÁREA QUÍMICA (R)</span>
              <input 
                type="text" 
                className={`record-value-input ${getStatusClass(trazabilidad.analisisEmpacado.areaQuimica)}`}
                value={trazabilidad.analisisEmpacado.areaQuimica || ''}
                onChange={(e) => handleUpdateTrazabilidadField('analisisEmpacado', 'areaQuimica', e.target.value)}
              />
            </div>
            {/* ÁREA BIOLÓGICA */}
            <div className="record-row-display editable-row">
              <span className="record-label-mini">ÁREA BIOLÓGICA (R)</span>
              <input 
                type="text" 
                className={`record-value-input ${getStatusClass(trazabilidad.analisisEmpacado.areaBiologica)}`}
                value={trazabilidad.analisisEmpacado.areaBiologica || ''}
                onChange={(e) => handleUpdateTrazabilidadField('analisisEmpacado', 'areaBiologica', e.target.value)}
              />
            </div>
          </div>

          {/* 3. Record de Producción (EDITABLE Y CON BOTÓN AGREGAR) */}
          <div className="trazability-card full-width">
            <p className="card-title">Record de Producción (Recepción: 
              {/* CAMPO DE FECHA DE RECEPCIÓN: Ahora con type="date" */}
              <input 
                type="date" 
                className="highlight-text-input date-input" 
                value={trazabilidad.recordProduccion.fechaRecepcion || ''}
                onChange={(e) => handleUpdateTrazabilidadField('recordProduccion', 'fechaRecepcion', e.target.value)}
              />
            )</p>
            <div className="production-block-grid production-grid">
              <span className="header-cell"># ORDEN</span>
              <span className="header-cell">UNID. STD.</span>
              <span className="header-cell">UNID. REAL.</span>
              <span className="header-cell">% REND.</span>
              {trazabilidad.recordProduccion.lotes.map((lote, index) => (
                <React.Fragment key={index}>
                  {/* # ORDEN */}
                  <input 
                    type="text" 
                    className="data-cell input-cell" 
                    value={lote.orden || ''}
                    onChange={(e) => handleUpdateRecordCell(index, 'orden', e.target.value)}
                  />
                  {/* UNID. STD. */}
                  <input 
                    type="text" 
                    className="data-cell input-cell" 
                    value={lote.unidStd || ''}
                    onChange={(e) => handleUpdateRecordCell(index, 'unidStd', e.target.value)}
                  />
                  {/* UNID. REAL. */}
                  <input 
                    type="text" 
                    className="data-cell input-cell" 
                    value={lote.unidReal || ''}
                    onChange={(e) => handleUpdateRecordCell(index, 'unidReal', e.target.value)}
                  />
                  {/* % REND. */}
                  <input 
                    type="text" 
                    className={`data-cell input-cell ${getStatusClass(lote.rendimiento)}`}
                    value={lote.rendimiento || ''}
                    onChange={(e) => handleUpdateRecordCell(index, 'rendimiento', e.target.value)}
                  />
                </React.Fragment>
              ))}
            </div>
            <button className="add-row-button" onClick={handleAddNewRecordRow}>
              ➕ Agregar Fila (Record de Producción)
            </button>
          </div>

          {/* 4. Producto Empacado (EDITABLE Y CON BOTÓN AGREGAR) */}
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
                  {/* RECEPCIÓN: Ahora con type="date" */}
                  <input 
                    type="date" 
                    className="data-cell input-cell" 
                    value={reg.recepcion || ''}
                    onChange={(e) => handleUpdatePackedCell(index, 'recepcion', e.target.value)}
                  />
                  {/* UNID. STD. */}
                  <input 
                    type="text" 
                    className="data-cell input-cell" 
                    value={reg.unidStd || ''}
                    onChange={(e) => handleUpdatePackedCell(index, 'unidStd', e.target.value)}
                  />
                  {/* UNID. REAL. */}
                  <input 
                    type="text" 
                    className="data-cell input-cell" 
                    value={reg.unidReal || ''}
                    onChange={(e) => handleUpdatePackedCell(index, 'unidReal', e.target.value)}
                  />
                  {/* % REND. */}
                  <input 
                    type="text" 
                    className={`data-cell input-cell ${getStatusClass(reg.rendimiento)}`}
                    value={reg.rendimiento || ''}
                    onChange={(e) => handleUpdatePackedCell(index, 'rendimiento', e.target.value)}
                  />
                  {/* PRESENTACIÓN */}
                  <input 
                    type="text" 
                    className="data-cell input-cell" 
                    value={reg.presentacion || ''}
                    onChange={(e) => handleUpdatePackedCell(index, 'presentacion', e.target.value)}
                  />
                </React.Fragment>
              ))}
            </div>
            <button className="add-row-button" onClick={handleAddNewPackedRow}>
              ➕ Agregar Fila (Producto Empacado)
            </button>
          </div>

          {/* 5. Tiempos de Control (EDITABLE) */}
          <div className="trazability-card full-width time-control-group">
            <p className="card-title">Tiempos de Control y Liberación</p>
            <div className="time-control-grid">
              {/* CONTROL EN PROCESO */}
              <div className="time-control-item editable-item">
                <span className="record-label-mini">CONTROL EN PROCESO (DÍAS)</span>
                <input 
                  type="text" 
                  className="record-value-input time-value" 
                  value={trazabilidad.tiemposControl.controlProceso || ''}
                  onChange={(e) => handleUpdateTrazabilidadField('tiemposControl', 'controlProceso', e.target.value)}
                />
              </div>
              {/* REVISIÓN DEL RECORD */}
              <div className="time-control-item editable-item">
                <span className="record-label-mini">REVISIÓN DEL RECORD (DÍAS)</span>
                <input 
                  type="text" 
                  className="record-value-input time-value" 
                  value={trazabilidad.tiemposControl.revisionRecord || ''}
                  onChange={(e) => handleUpdateTrazabilidadField('tiemposControl', 'revisionRecord', e.target.value)}
                />
              </div>
              {/* FECHA DE LIBERACIÓN: Ahora con type="date" */}
              <div className="time-control-item editable-item">
                <span className="record-label-mini">FECHA DE LIBERACIÓN</span>
                <input 
                  type="date" 
                  className="record-value-input time-value release-date-value date-input" 
                  value={trazabilidad.tiemposControl.liberacionProducto || ''}
                  onChange={(e) => handleUpdateTrazabilidadField('tiemposControl', 'liberacionProducto', e.target.value)}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };
  
  const availableAnalysisFields = useMemo(() => 
    ALL_ANALYSIS_FIELDS.filter(field => !analysisData.hasOwnProperty(field)), 
    [analysisData]
  );

  const wrapperClassName = data.producto 
    ? "main-content-wrapper" 
    : "main-content-wrapper single-column-mode";

  // Verificamos si la búsqueda del lote fue exitosa
  const isLoteFound = !!data.producto;

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
                {/* CAMPO NO EDITABLE (DISPLAY) */}
                <DataRow label="PRODUCTO" value={data.producto} isLote={true} />
                <DataRow label="LABORATORIO" value={data.laboratorio} />
                <DataRow label="CONTROL" value={data.control} />
                {/* CAMPO DE FECHA DE INGRESO: Ahora con selector de fecha */}
                <DataRow 
                  label="FECHA DE INGRESO" 
                  value={data.fechaIngreso} 
                  dateType={true} 
                  field="fechaIngreso"
                />
              </div>

              {/* Campo de Observaciones (Editable) y Botón de Guardar Local */}
              {isLoteFound && (
                <>
                  <DataRow
                    label="OBSERVACIONES"
                    value={observaciones}
                    isEditable={true}
                    onChange={(e) => setObservaciones(e.target.value)}
                  />
                  
                  <button 
                    className="save-button" 
                    onClick={() => showMessage('¡Guardado de Observaciones simulado!')} 
                    disabled={!isLoteFound}
                  >
                    Guardar Cambios y Observaciones
                  </button>
                </>
              )}
            </div>
            
            {/* --- COLUMNA DERECHA: DATOS DE ANÁLISIS (AHORA EDITABLE) --- */}
            {isLoteFound && (
              <div className="analysis-panel">
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
        
        {/* --- TERCER BLOQUE: TRAZABILIDAD --- */}
        {isLoteFound && <TrazabilidadSection trazabilidad={data.trazabilidad} />}
        
        {/* BOTÓN REQUERIDO: Aparece solo después de una búsqueda exitosa */}
        {isLoteFound && (
          <button 
            className="save-button full-width-save" 
            onClick={() => showMessage('¡Guardado General Simulado!')} 
          >
            💾 Guardar **Todos** los Cambios de la Página
          </button>
        )}
      </div>
    </main>
  );
};

export default ActualizacionDatosProducto;