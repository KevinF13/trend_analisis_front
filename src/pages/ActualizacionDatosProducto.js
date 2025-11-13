import React, { useState, useCallback, useMemo } from 'react';
import './ActualizacionDatosProducto.css';

// --- NUEVA CONFIGURACIÓN DE API ---
const API_BASE_URL = 'http://127.0.0.1:5000';

// Mapeo de campos de respuesta de la API (snake_case) a las claves de análisis de React
const ANALYSIS_FIELD_MAP_REVERSE = {
    'AGUA DESTILADA': 'AGUA_DESTILADA',
    'AGUA DE ENJUAGUE': 'AGUA_ENJUAGE',
    'AGUA DESMINERALIZADA': 'AGUA_DESMINERALIZADA',
    'HUMEDAD': 'HUMEDAD',
    'IDENTIFICACION': 'IDENTIFICACION',
    'CUANTIFICACION': 'CUANTICA', // Se ajusta a la clave de la API
    'POLVO': 'POLVO',
    'DESINTEGRACION': 'DESINTEGRACION',
    'NUCLEO': 'NUCLEO',
    'DESINTEGRACION DE BARRERA': 'DESINTEGRACION_BARRERA',
    'DISOLUCION': 'DISOLUCION',
    'ACTIVO DE CUBIERTA': 'ACTIVO_CUBIERTA',
    'OBSERVACION MICROSCOPICA': 'OBSERVACION_MICROSCOPICA',
    'GRANEL': 'GRANEL',
    'BIOBURDEN': 'BIOBURDEN',
};

// Función auxiliar para reformatear la fecha de DD/MM/YYYY a YYYY-MM-DD
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateString;
};

// Función auxiliar para reformatear la fecha de YYYY-MM-DD a DD/MM/YYYY para la API
const formatDateForAPI = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
};

// Función auxiliar para determinar la clase de color basada en el estado
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


// --- 2. FUNCIÓN PARA OBTENER DATOS DE LA API (REEMPLAZO DE SIMULACIÓN) ---

const fetchAndMapData = async (lote) => {
    // **SE MANTIENE LA CONVERSIÓN A MAYÚSCULAS AQUÍ (LÓGICA DE BÚSQUEDA)**
    const loteUpper = lote.toUpperCase();
    const detailUrl = `${API_BASE_URL}/detalle_lote/${loteUpper}`;
    const consultaUrl = `${API_BASE_URL}/consulta`;

    // 1. Intento de GET /detalle_lote/:lote
    try {
        const response = await fetch(detailUrl);
        if (response.ok) {
            const data = await response.json();
            // Si el lote existe en la tabla de detalles, se mapean todos los campos.
            if (data && data.LOTE) {
                return mapApiDataToState(data);
            }
        }
    } catch (e) {
        console.error("Error en GET /detalle_lote:", e);
        // Continúa al siguiente paso si falla la conexión o no se encuentra el recurso
    }

    // 2. Intento de POST /consulta
    try {
        const response = await fetch(consultaUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lote: loteUpper }),
        });

        if (response.ok) {
            const data = await response.json();

            if (data && data.LOTE) {
                // 3. Si se encuentra en /consulta, se debe insertar en la tabla de detalles.
                const insertUrl = `${API_BASE_URL}/insertar`;
                const insertBody = {
                    lote: data.LOTE,
                    PRODUCTO: data.PRODUCTO || '',
                    LABORATORIO: data.LABORATORIO || '',
                    CONTROL: data.CONTROL || '',
                    FECHA_INGRESO: data.FECHA_INGRESO || '',
                };

                const insertResponse = await fetch(insertUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(insertBody),
                });

                if (insertResponse.ok) {
                    // Después de la inserción exitosa, volvemos a intentar el GET detalle_lote 
                    // para obtener la estructura completa (aunque los campos de análisis estén en NULL)
                    const newDetailResponse = await fetch(detailUrl);
                    if (newDetailResponse.ok) {
                        const newData = await newDetailResponse.json();
                        return mapApiDataToState(newData);
                    }
                } else {
                    console.error("Error al insertar el lote:", insertResponse.statusText);
                }
            }
        }
    } catch (e) {
        console.error("Error en POST /consulta o re-GET /detalle_lote:", e);
    }

    // Si no se encuentra en ningún lado.
    return null;
};


// Función para transformar los datos de la API (JSON en snake_case y DD/MM/YYYY) al estado de React
const mapApiDataToState = (apiData) => {
    if (!apiData || !apiData.LOTE) return null;

    // --- Mapeo de Análisis (snake_case a CamelCase) ---
    const analysis = {};
    Object.keys(ANALYSIS_FIELD_MAP_REVERSE).forEach(reactKey => {
        const apiKey = ANALYSIS_FIELD_MAP_REVERSE[reactKey];
        const value = apiData[apiKey];
        if (value !== null && value !== undefined && value !== '') {
            analysis[reactKey] = String(value);
        }
    });

    // --- Mapeo de Trazabilidad ---
    const trazabilidad = {
        analisisSemiElaborado: {
            noImpresos: apiData.NUM_ORDEN !== null ? String(apiData.NUM_ORDEN) : '',
            impresos: apiData.PRESENTACION_PROD !== null ? String(apiData.PRESENTACION_PROD) : '',
            areaQuimica: apiData.AREA_QUIMICA_SEMI_P || '',
            areaBiologica: apiData.AREA_BIOLOGICA_SEMI_P || '',
        },
        analisisEmpacado: {
            areaQuimica: apiData.AREA_QUIMICA_EMP || '',
            areaBiologica: apiData.AREA_BIOLOGICA_EMP || '',
        },
        // Inicialización básica para evitar errores
        recordProduccion: {
            fechaRecepcion: formatDateForInput(apiData.RECEPCION),
            lotes: [], 
        },
        productoEmpacado: {
            registros: [], 
        },
        tiemposControl: {
            controlProceso: apiData.TIM_CONT_PROCESO !== null ? String(apiData.TIM_CONT_PROCESO) : '',
            revisionRecord: apiData.TIM_REV_RECORD !== null ? String(apiData.TIM_REV_RECORD) : '',
            liberacionProducto: formatDateForInput(apiData.FECHA_LIBERACION_PROD),
        }
    };

    // Reconstrucción del primer registro de Record de Producción (si existe)
    if (apiData.NUM_ORDEN || apiData.UNIDAD_STD_RECORD || apiData.UNIDAD_REAL_RECORD || apiData.REND_RECORD) {
        trazabilidad.recordProduccion.lotes.push({
            orden: apiData.NUM_ORDEN || '',
            unidStd: apiData.UNIDAD_STD_RECORD || '',
            unidReal: apiData.UNIDAD_REAL_RECORD || '',
            rendimiento: apiData.REND_RECORD || '',
        });
    }

    // Reconstrucción del primer registro de Producto Empacado (si existe)
    if (apiData.RECEPCION_PROD || apiData.UNIDAD_STD_PROD || apiData.UNIDAD_REAL_PROD || apiData.REND_PROD || apiData.PRESENTACION_PROD) {
        trazabilidad.productoEmpacado.registros.push({
            recepcion: formatDateForInput(apiData.RECEPCION_PROD),
            unidStd: apiData.UNIDAD_STD_PROD || '',
            unidReal: apiData.UNIDAD_REAL_PROD || '',
            rendimiento: apiData.REND_PROD || '',
            presentacion: apiData.PRESENTACION_PROD || '',
        });
    }

    // Retornamos los datos del panel principal
    return {
        producto: apiData.PRODUCTO || '',
        laboratorio: apiData.LABORATORIO || '',
        control: apiData.CONTROL || '',
        fechaIngreso: formatDateForInput(apiData.FECHA_INGRESO),
        observaciones: apiData.OBSERVACIONES_FINAL || '', // Usamos OBSERVACIONES_FINAL para el textarea principal
        analysis,
        trazabilidad,
    };
};

// Función para transformar el estado de React a los datos de la API para UPDATE
const mapStateToApiData = (data, analysisData, observaciones, lote) => {
    const apiBody = {};

    // Mapeo de Análisis (solo si tienen valor)
    Object.keys(analysisData).forEach(reactKey => {
        const apiKey = ANALYSIS_FIELD_MAP_REVERSE[reactKey];
        const value = analysisData[reactKey];
        if (apiKey) {
            // **SE MANTIENE EL trim() SOLO AQUÍ PARA LIMPIAR ANTES DE ENVIAR A LA API**
            apiBody[apiKey.toLowerCase()] = value && String(value).trim() !== '' ? String(value).trim() : null;
        }
    });

    // Mapeo de datos principales y trazabilidad
    // **SE MANTIENE EL trim() SOLO AQUÍ PARA LIMPIAR ANTES DE ENVIAR A LA API**
    apiBody.observaciones_final = observaciones ? String(observaciones).trim() : null;
    apiBody.fecha_ingreso = formatDateForAPI(data.fechaIngreso);

    if (data.trazabilidad) {
        const t = data.trazabilidad;
        // Análisis Semi-Elaborado
        apiBody.num_orden = t.analisisSemiElaborado.noImpresos || null;
        // **ATENCIÓN: PRESENTACION_PROD en la API se usa para Semi-Elaborado (impresos) Y Producto Empacado (presentacion). Esto es un problema de diseño de API, pero mantenemos el mapeo como está en tu código para 'impresos'.**
        // apiBody.presentacion_prod = t.analisisSemiElaborado.impresos || null; // <--- Comentado para evitar colisión, lo manejaremos en la sección de empaque si es necesario.
        apiBody.area_quimica_semi_p = t.analisisSemiElaborado.areaQuimica || null;
        apiBody.area_biologica_semi_p = t.analisisSemiElaborado.areaBiologica || null;

        // Análisis Empacado
        apiBody.area_quimica_emp = t.analisisEmpacado.areaQuimica || null;
        apiBody.area_biologica_emp = t.analisisEmpacado.areaBiologica || null;

        // Record de Producción (Asumiendo que solo se actualiza la primera fila por la limitación de la tabla de la API)
        const rec = t.recordProduccion;
        apiBody.recepcion = formatDateForAPI(rec.fechaRecepcion);
        if (rec.lotes.length > 0) {
            const firstLote = rec.lotes[0];
            apiBody.unidad_std_record = firstLote.unidStd || null;
            apiBody.unidad_real_record = firstLote.unidReal || null;
            apiBody.rend_record = firstLote.rendimiento || null;
        }

        // Producto Empacado (Asumiendo que solo se actualiza la primera fila por la limitación de la tabla de la API)
        const pack = t.productoEmpacado;
        if (pack.registros.length > 0) {
            const firstReg = pack.registros[0];
            apiBody.recepcion_prod = formatDateForAPI(firstReg.recepcion);
            apiBody.unidad_std_prod = firstReg.unidStd || null;
            apiBody.unidad_real_prod = firstReg.unidReal || null;
            apiBody.rend_prod = firstReg.rendimiento || null;
            // ATENCIÓN: Esta clave sobrescribe la de Semi-Elaborado. Mantenemos el mapeo para empaquetado ya que es más explícito en el nombre de la columna.
            apiBody.presentacion_prod = firstReg.presentacion || null; 
        }

        // Tiempos de Control
        const tc = t.tiemposControl;
        apiBody.tim_cont_proceso = tc.controlProceso || null;
        apiBody.tim_rev_record = tc.revisionRecord || null;
        apiBody.fecha_liberacion_prod = formatDateForAPI(tc.liberacionProducto);
    }

    return apiBody;
};


// =============================================================================
// 1. COMPONENTE DataRow (MOVIDO AFUERA)
// =============================================================================
// Necesitamos pasarle 'onDateChange' y 'isProductLoaded' como props extras
const DataRow = ({ 
    label, 
    value, 
    isEditable = false, 
    onChange = () => { }, 
    isLote = false, 
    dateType = false, 
    field = null,
    // Nuevas props recibidas desde el padre
    onDateChange, 
    isProductLoaded 
}) => (
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
                    id="observaciones-final"
                    name="observaciones_final"
                />
            ) : dateType ? (
                <input
                    type="date"
                    className="input-field editable-date-input"
                    value={value || ''}
                    // Usamos la prop onDateChange
                    onChange={(e) => field && onDateChange && onDateChange(field, e.target.value)}
                    disabled={!field || !isProductLoaded}
                    id={field}
                    name={field}
                />
            ) : (
                <div className={`input-field display-value ${isLote ? 'lote-value' : ''}`}>
                    {value || 'N/A'}
                </div>
            )}
        </div>
    </div>
);

// =============================================================================
// 2. COMPONENTE TrazabilidadSection (MOVIDO AFUERA)
// =============================================================================
// Recibimos todas las funciones handle como props
const TrazabilidadSection = ({ 
    trazabilidad, 
    onUpdateField,      // handleUpdateTrazabilidadField
    onUpdateRecord,     // handleUpdateRecordCell
    onUpdatePacked,     // handleUpdatePackedCell
    onAddRecord,        // handleAddNewRecordRow
    onAddPacked         // handleAddNewPackedRow
}) => {
    if (!trazabilidad) return null;

    const recordLotes = trazabilidad.recordProduccion.lotes;
    const packedRegistros = trazabilidad.productoEmpacado.registros;

    const firstRecordLote = recordLotes.length > 0 ? recordLotes[0] : {};
    const firstPackedRegistro = packedRegistros.length > 0 ? packedRegistros[0] : {};

    return (
        <div className="trazability-panel">
            <h3 className="trazability-title">📜 Registro Histórico y Trazabilidad</h3>

            <div className="trazability-content-grid">
                {/* 1. Análisis Semi-Elaborado */}
                <div className="trazability-card half-width">
                    <p className="card-title">Análisis de Producto Semi-Elaborado</p>
                    {/* NO IMPRESOS */}
                    <div className="record-row-display editable-row">
                        <span className="record-label-mini">NO IMPRESOS (P)</span>
                        <input
                            type="text"
                            className="record-value-input"
                            value={trazabilidad.analisisSemiElaborado.noImpresos || ''}
                            onChange={(e) => onUpdateField('analisisSemiElaborado', 'noImpresos', e.target.value)}
                            id="semi-elaborado-noImpresos"
                            name="semi_elaborado_noImpresos"
                        />
                    </div>
                    {/* IMPRESOS */}
                    <div className="record-row-display editable-row">
                        <span className="record-label-mini">IMPRESOS (Q)</span>
                        <input
                            type="text"
                            className="record-value-input"
                            value={trazabilidad.analisisSemiElaborado.impresos || ''}
                            onChange={(e) => onUpdateField('analisisSemiElaborado', 'impresos', e.target.value)}
                            id="semi-elaborado-impresos"
                            name="semi_elaborado_impresos"
                        />
                    </div>
                    {/* ÁREA QUÍMICA */}
                    <div className="record-row-display editable-row">
                        <span className="record-label-mini">ÁREA QUÍMICA</span>
                        <input
                            type="text"
                            className={`record-value-input ${getStatusClass(trazabilidad.analisisSemiElaborado.areaQuimica || '')}`}
                            value={trazabilidad.analisisSemiElaborado.areaQuimica || ''}
                            onChange={(e) => onUpdateField('analisisSemiElaborado', 'areaQuimica', e.target.value)}
                            id="semi-elaborado-areaQuimica"
                            name="area_quimica_semi_p"
                        />
                    </div>
                    {/* ÁREA BIOLÓGICA */}
                    <div className="record-row-display editable-row">
                        <span className="record-label-mini">ÁREA BIOLÓGICA</span>
                        <input
                            type="text"
                            className={`record-value-input ${getStatusClass(trazabilidad.analisisSemiElaborado.areaBiologica || '')}`}
                            value={trazabilidad.analisisSemiElaborado.areaBiologica || ''}
                            onChange={(e) => onUpdateField('analisisSemiElaborado', 'areaBiologica', e.target.value)}
                            id="semi-elaborado-areaBiologica"
                            name="area_biologica_semi_p"
                        />
                    </div>
                </div>

                {/* 2. Análisis Empacado */}
                <div className="trazability-card half-width">
                    <p className="card-title">Análisis de Producto Empacado</p>
                    {/* ÁREA QUÍMICA */}
                    <div className="record-row-display editable-row">
                        <span className="record-label-mini">ÁREA QUÍMICA (R)</span>
                        <input
                            type="text"
                            className={`record-value-input ${getStatusClass(trazabilidad.analisisEmpacado.areaQuimica || '')}`}
                            value={trazabilidad.analisisEmpacado.areaQuimica || ''}
                            onChange={(e) => onUpdateField('analisisEmpacado', 'areaQuimica', e.target.value)}
                            id="empacado-areaQuimica"
                            name="area_quimica_emp"
                        />
                    </div>
                    {/* ÁREA BIOLÓGICA */}
                    <div className="record-row-display editable-row">
                        <span className="record-label-mini">ÁREA BIOLÓGICA (R)</span>
                        <input
                            type="text"
                            className={`record-value-input ${getStatusClass(trazabilidad.analisisEmpacado.areaBiologica || '')}`}
                            value={trazabilidad.analisisEmpacado.areaBiologica || ''}
                            onChange={(e) => onUpdateField('analisisEmpacado', 'areaBiologica', e.target.value)}
                            id="empacado-areaBiologica"
                            name="area_biologica_emp"
                        />
                    </div>
                </div>

                {/* 3. Record de Producción */}
                <div className="trazability-card full-width">
                    <p className="card-title">Record de Producción (Recepción:
                        <input
                            type="date"
                            className="highlight-text-input date-input"
                            value={trazabilidad.recordProduccion.fechaRecepcion || ''}
                            onChange={(e) => onUpdateField('recordProduccion', 'fechaRecepcion', e.target.value)}
                            id="record-fechaRecepcion"
                            name="recepcion"
                        />
                        )</p>
                    <div className="production-block-grid production-grid">
                        <span className="header-cell"># ORDEN</span>
                        <span className="header-cell">UNID. STD.</span>
                        <span className="header-cell">UNID. REAL.</span>
                        <span className="header-cell">% REND.</span>
                        
                        <div key="first-row-record" style={{ display: 'contents' }}>
                            <input
                                type="text"
                                className="data-cell input-cell"
                                value={firstRecordLote.orden || ''}
                                onChange={(e) => onUpdateRecord(0, 'orden', e.target.value)}
                                id={`record-orden-0`}
                                name={`record_orden_0`}
                            />
                            <input
                                type="text"
                                className="data-cell input-cell"
                                value={firstRecordLote.unidStd || ''}
                                onChange={(e) => onUpdateRecord(0, 'unidStd', e.target.value)}
                                id={`record-unidStd-0`}
                                name={`record_unid_std_0`}
                            />
                            <input
                                type="text"
                                className="data-cell input-cell"
                                value={firstRecordLote.unidReal || ''}
                                onChange={(e) => onUpdateRecord(0, 'unidReal', e.target.value)}
                                id={`record-unidReal-0`}
                                name={`record_unid_real_0`}
                            />
                            <input
                                type="text"
                                className={`data-cell input-cell ${getStatusClass(firstRecordLote.rendimiento)}`}
                                value={firstRecordLote.rendimiento || ''}
                                onChange={(e) => onUpdateRecord(0, 'rendimiento', e.target.value)}
                                id={`record-rendimiento-0`}
                                name={`record_rendimiento_0`}
                            />
                        </div>
                    </div>
                    <button className="add-row-button" onClick={onAddRecord}>
                        ➕ Agregar/Editar Fila (Record de Producción - 1er Registro)
                    </button>
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
                        
                        <div key="first-row-packed" style={{ display: 'contents' }}>
                            <input
                                type="date"
                                className="data-cell input-cell"
                                value={firstPackedRegistro.recepcion || ''}
                                onChange={(e) => onUpdatePacked(0, 'recepcion', e.target.value)}
                                id={`packed-recepcion-0`}
                                name={`packed_recepcion_0`}
                            />
                            <input
                                type="text"
                                className="data-cell input-cell"
                                value={firstPackedRegistro.unidStd || ''}
                                onChange={(e) => onUpdatePacked(0, 'unidStd', e.target.value)}
                                id={`packed-unidStd-0`}
                                name={`packed_unid_std_0`}
                            />
                            <input
                                type="text"
                                className="data-cell input-cell"
                                value={firstPackedRegistro.unidReal || ''}
                                onChange={(e) => onUpdatePacked(0, 'unidReal', e.target.value)}
                                id={`packed-unidReal-0`}
                                name={`packed_unid_real_0`}
                            />
                            <input
                                type="text"
                                className={`data-cell input-cell ${getStatusClass(firstPackedRegistro.rendimiento)}`}
                                value={firstPackedRegistro.rendimiento || ''}
                                onChange={(e) => onUpdatePacked(0, 'rendimiento', e.target.value)}
                                id={`packed-rendimiento-0`}
                                name={`packed_rendimiento_0`}
                            />
                            <input
                                type="text"
                                className="data-cell input-cell"
                                value={firstPackedRegistro.presentacion || ''}
                                onChange={(e) => onUpdatePacked(0, 'presentacion', e.target.value)}
                                id={`packed-presentacion-0`}
                                name={`packed_presentacion_0`}
                            />
                        </div>
                    </div>
                    <button className="add-row-button" onClick={onAddPacked}>
                        ➕ Agregar/Editar Fila (Producto Empacado - 1er Registro)
                    </button>
                </div>

                {/* 5. Tiempos de Control */}
                <div className="trazability-card full-width time-control-group">
                    <p className="card-title">Tiempos de Control y Liberación</p>
                    <div className="time-control-grid">
                        <div className="time-control-item editable-item">
                            <span className="record-label-mini">CONTROL EN PROCESO (DÍAS)</span>
                            <input
                                type="text"
                                className="record-value-input time-value"
                                value={trazabilidad.tiemposControl.controlProceso || ''}
                                onChange={(e) => onUpdateField('tiemposControl', 'controlProceso', e.target.value)}
                                id="tim-controlProceso"
                                name="tim_cont_proceso"
                            />
                        </div>
                        <div className="time-control-item editable-item">
                            <span className="record-label-mini">REVISIÓN DEL RECORD (DÍAS)</span>
                            <input
                                type="text"
                                className="record-value-input time-value"
                                value={trazabilidad.tiemposControl.revisionRecord || ''}
                                onChange={(e) => onUpdateField('tiemposControl', 'revisionRecord', e.target.value)}
                                id="tim-revisionRecord"
                                name="tim_rev_record"
                            />
                        </div>
                        <div className="time-control-item editable-item">
                            <span className="record-label-mini">FECHA DE LIBERACIÓN</span>
                            <input
                                type="date"
                                className="record-value-input time-value release-date-value date-input"
                                value={trazabilidad.tiemposControl.liberacionProducto || ''}
                                onChange={(e) => onUpdateField('tiemposControl', 'liberacionProducto', e.target.value)}
                                id="tim-liberacionProducto"
                                name="fecha_liberacion_prod"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// =============================================================================
// COMPONENTE PRINCIPAL (LIMPIO DE DEFINICIONES INTERNAS)
// =============================================================================
const ActualizacionDatosProducto = () => {
    const [lote, setLote] = useState('');
    const [data, setData] = useState({
        producto: '',
        laboratorio: '',
        control: '',
        fechaIngreso: '',
        // FIX: Inicializar trazabilidad con la estructura necesaria, no con null
        trazabilidad: {
            analisisSemiElaborado: {},
            analisisEmpacado: {},
            recordProduccion: {
                fechaRecepcion: '',
                lotes: []
            },
            productoEmpacado: {
                registros: []
            },
            tiemposControl: {}
        },
    });
    const [analysisData, setAnalysisData] = useState({});
    const [observaciones, setObservaciones] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    const [newAnalysisField, setNewAnalysisField] = useState('');
    const [newAnalysisValue, setNewAnalysisValue] = useState('');

    // --- LÓGICA DE BÚSQUEDA DEL LOTE (useCallback) ---
    const handleSearch = useCallback(async () => {
        if (!lote.trim()) {
            setError('Por favor, ingresa un número de LOTE.');
            // Usar la inicialización limpia en caso de error
            setData(prev => ({
                ...prev,
                producto: '',
                laboratorio: '',
                control: '',
                fechaIngreso: '',
                trazabilidad: {
                    analisisSemiElaborado: {},
                    analisisEmpacado: {},
                    recordProduccion: { fechaRecepcion: '', lotes: [] },
                    productoEmpacado: { registros: [] },
                    tiemposControl: {}
                }
            }));
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
            // **SE MANTIENE EL trim() Y toUpperCase() AQUÍ (LÓGICA DE BÚSQUEDA)**
            const result = await fetchAndMapData(lote.trim().toUpperCase());

            if (result) {
                const { analysis, observaciones: fetchedObservaciones, trazabilidad, ...productData } = result;
                setData({
                    ...productData,
                    // Asegurarse de que trazabilidad siempre tenga un valor para evitar null/undefined
                    trazabilidad: trazabilidad || {
                        analisisSemiElaborado: {},
                        analisisEmpacado: {},
                        recordProduccion: { fechaRecepcion: '', lotes: [] },
                        productoEmpacado: { registros: [] },
                        tiemposControl: {}
                    }
                });
                setAnalysisData(analysis || {});
                setObservaciones(fetchedObservaciones || ''); // Cargar observaciones
            } else {
                setError(`⚠️ No se encontraron datos para el LOTE: ${lote}.`);
                setData(prev => ({
                    ...prev,
                    producto: '',
                    laboratorio: '',
                    control: '',
                    fechaIngreso: '',
                    trazabilidad: {
                        analisisSemiElaborado: {},
                        analisisEmpacado: {},
                        recordProduccion: { fechaRecepcion: '', lotes: [] },
                        productoEmpacado: { registros: [] },
                        tiemposControl: {}
                    }
                }));
                setAnalysisData({});
            }
        } catch (err) {
            console.error(err);
            setError('❌ Ocurrió un error de conexión al buscar los datos.');
            setData(prev => ({
                ...prev,
                producto: '',
                laboratorio: '',
                control: '',
                fechaIngreso: '',
                trazabilidad: {
                    analisisSemiElaborado: {},
                    analisisEmpacado: {},
                    recordProduccion: { fechaRecepcion: '', lotes: [] },
                    productoEmpacado: { registros: [] },
                    tiemposControl: {}
                }
            }));
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

    // --- LÓGICA DE GUARDADO EN LA API (UPDATE) ---
    const handleSaveData = async () => {
        if (!lote.trim() || !data.producto) {
            alert("No hay un lote válido para guardar.");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const apiBody = mapStateToApiData(data, analysisData, observaciones, lote);

            // **SE MANTIENE LA CONVERSIÓN A MAYÚSCULAS AQUÍ (LÓGICA DE UPDATE)**
            const updateUrl = `${API_BASE_URL}/actualizar/${lote.toUpperCase()}`;

            const response = await fetch(updateUrl, {
                method: 'POST', // O PUT, dependiendo de la configuración de tu API
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiBody),
            });

            if (response.ok) {
                alert('✅ ¡Guardado General Exitoso! Los cambios han sido actualizados.');
            } else {
                const errorText = await response.text();
                alert(`❌ Error al guardar los datos: ${response.status} - ${errorText}`);
            }
        } catch (err) {
            console.error("Error al guardar:", err);
            alert('❌ Ocurrió un error de conexión al intentar guardar los datos.');
        } finally {
            setIsSaving(false);
        }
    };

    // --- LÓGICA DE ACTUALIZACIÓN DEL CAMPO DE ANÁLISIS ---
    const handleUpdateAnalysis = (field, value) => {
        // **CORRECCIÓN 1: Asegurar que el input de análisis se mantenga controlado sin pérdida de foco.**
        // Se mantiene el valor exacto para permitir la edición.
        setAnalysisData(prevData => ({
            ...prevData,
            [field]: value
        }));
    };

    // --- LÓGICA DE ELIMINACIÓN DEL CAMPO DE ANÁLISIS ---
    const handleRemoveAnalysis = (field) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar el campo de análisis "${field}"? El valor se establecerá a NULL en la base de datos.`)) {
            // En el estado, se elimina para que no se muestre
            setAnalysisData(prevData => {
                const newData = { ...prevData };
                delete newData[field];
                return newData;
            });
            // Al guardar (handleSaveData), los campos que faltan se consideran null en la API.
            alert(`Análisis "${field}" marcado para ser borrado (NULL) al guardar.`);
        }
    };

    const handleAddAnalysisData = () => {
        // **SIMPLIFICADO: SE QUITA .trim() del valor en newAnalysisValue**
        if (newAnalysisField && newAnalysisValue) {
            setAnalysisData(prevData => ({
                ...prevData,
                [newAnalysisField]: newAnalysisValue
            }));
            alert(`Dato de ${newAnalysisField} añadido con valor: ${newAnalysisValue}`);
            setNewAnalysisField('');
            setNewAnalysisValue('');
        } else {
            alert('¡Atención! Debes seleccionar un campo y escribir un valor para añadirlo.');
        }
    };

    // ** Manejador de actualización para campos simples del panel principal (como fechaIngreso) **
    const handleUpdateDataField = (field, value) => {
        // **SIMPLIFICADO: NO HAY MANIPULACIÓN DE TEXTO**
        setData(prevData => ({
            ...prevData,
            [field]: value,
        }));
    };

    // --- LÓGICA DE EDICIÓN DE TRAZABILIDAD (CAMPOS SIMPLES) ---
    const handleUpdateTrazabilidadField = (section, field, value) => {
        // **SIMPLIFICADO: NO HAY MANIPULACIÓN DE TEXTO**
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

    // --- LÓGICA DE EDICIÓN DE TABLA DE RECORD DE PRODUCCIÓN (Simplificada a la primera fila) ---
    const handleUpdateRecordCell = useCallback((rowIndex, key, value) => {
        // **CORRECCIÓN 2: Uso de useCallback y estructura inmutable más robusta.**
        if (rowIndex !== 0) return;

        setData(prevData => {
            // Aseguramos que siempre haya una fila para evitar un estado indefinido.
            const currentLotes = prevData.trazabilidad.recordProduccion.lotes.length === 0
                ? [{ ...INITIAL_RECORD_ROW }]
                : prevData.trazabilidad.recordProduccion.lotes;

            // Creamos una copia inmutable del array y del objeto en la posición 0
            const newLotes = [...currentLotes];
            newLotes[0] = {
                ...newLotes[0],
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
    }, []); // Dependencias vacías, solo usa `setData`

    // --- LÓGICA PARA AGREGAR FILA EN RECORD DE PRODUCCIÓN (Solo agrega/edita la primera fila) ---
    const handleAddNewRecordRow = () => {
        // Solo creamos/editamos la primera fila para alinearnos a la API plana
        if (data.trazabilidad.recordProduccion.lotes.length === 0) {
            setData(prevData => ({
                ...prevData,
                trazabilidad: {
                    ...prevData.trazabilidad,
                    recordProduccion: {
                        ...prevData.trazabilidad.recordProduccion,
                        lotes: [{ ...INITIAL_RECORD_ROW }],
                    }
                }
            }));
        } else {
            alert("Solo se admite la edición del primer registro debido a la estructura de la API.");
        }
    };

    // --- LÓGICA DE EDICIÓN DE TABLA DE PRODUCTO EMPACADO (Simplificada a la primera fila) ---
    const handleUpdatePackedCell = useCallback((rowIndex, key, value) => {
        // **CORRECCIÓN 3: Uso de useCallback y estructura inmutable más robusta.**
        if (rowIndex !== 0) return;

        setData(prevData => {
            // Aseguramos que siempre haya una fila para evitar un estado indefinido.
            const currentRegistros = prevData.trazabilidad.productoEmpacado.registros.length === 0
                ? [{ ...INITIAL_PACKED_ROW }]
                : prevData.trazabilidad.productoEmpacado.registros;

            // Creamos una copia inmutable del array y del objeto en la posición 0
            const newRegistros = [...currentRegistros];
            newRegistros[0] = {
                ...newRegistros[0],
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
    }, []); // Dependencias vacías, solo usa `setData`

    // --- LÓGICA PARA AGREGAR FILA EN PRODUCTO EMPACADO (Solo agrega/edita la primera fila) ---
    const handleAddNewPackedRow = () => {
        // Solo creamos/editamos la primera fila para alinearnos a la API plana
        if (data.trazabilidad.productoEmpacado.registros.length === 0) {
            setData(prevData => ({
                ...prevData,
                trazabilidad: {
                    ...prevData.trazabilidad,
                    productoEmpacado: {
                        ...prevData.trazabilidad.productoEmpacado,
                        registros: [{ ...INITIAL_PACKED_ROW }],
                    }
                }
            }));
        } else {
            alert("Solo se admite la edición del primer registro debido a la estructura de la API.");
        }
    };

    // --- RENDERIZADO DE ANÁLISIS ---
    // Esta función puede quedarse dentro ya que no es un <Componente/>, 
    // sino una función que retorna JSX. No causa el mismo problema de foco.
    const renderAnalysisGroup = (groupTitle, fields) => {
        // Filtramos solo los campos que están en analysisData para que solo se muestren los "registrados"
        const currentFields = fields.filter(field => analysisData.hasOwnProperty(field));

        // Filtramos los análisis personalizados que no estén en la lista predefinida
        const customFields = Object.keys(analysisData).filter(field =>
            !ALL_ANALYSIS_FIELDS.includes(field) &&
            (groupTitle === 'ANALISIS DE MATERIA PRIMA' ? field.toUpperCase().includes('MATERIA') : field.toUpperCase().includes('PROCESO') || true) // Asignación simple para el ejemplo
        );

        // Concatenamos para mostrar los campos existentes y personalizados.
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
                                // FIX: Usar 'analysisData[field] || ""' para asegurar que siempre sea una cadena
                                value={analysisData[field] || ''}
                                // Corregido el handler para que use el campo correcto y el valor del evento
                                onChange={(e) => handleUpdateAnalysis(field, e.target.value)}
                                placeholder="Valor de análisis"
                                id={`analysis-${field}`}
                                name={`analysis-${field}`}
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
                                    name="lote_input" // FIX: Añadir Name
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
                                disabled={isLoading || !lote.trim() || isSaving}
                            >
                                {isLoading ? '🔎 Buscando...' : 'Buscar Lote'}
                            </button>
                        </div>

                        {error && <p className="error-message">{error}</p>}

                        <div className="data-display-section">
                            {/* Los DataRow internos ya fueron corregidos arriba */}
                            <DataRow label="PRODUCTO" value={data.producto} isLote={true} />
                            <DataRow label="LABORATORIO" value={data.laboratorio} />
                            <DataRow label="CONTROL" value={data.control} />
                            {/* CAMPO DE FECHA DE INGRESO: Ahora con selector de fecha */}
                            <DataRow
                                label="FECHA DE INGRESO"
                                value={data.fechaIngreso}
                                dateType={true}
                                field="fechaIngreso"
                                onDateChange={handleUpdateDataField} // PASAMOS LA PROP
                                isProductLoaded={!!data.producto}    // PASAMOS LA PROP
                            />
                        </div>

                        {/* Campo de Observaciones (Editable) y Botón de Guardar Local */}
                        {isLoteFound && (
                            <>
                                {/* Aquí DataRow usa la prop 'value' correctamente enlazada a 'observaciones' */}
                                <DataRow
                                    label="OBSERVACIONES"
                                    value={observaciones}
                                    isEditable={true}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                />

                                <button
                                    className="save-button"
                                    onClick={handleSaveData} // Usa la función de guardado general
                                    disabled={!isLoteFound || isSaving || isLoading}
                                >
                                    {isSaving ? '💾 Guardando...' : 'Guardar Cambios y Observaciones'}
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
                                        id="new-analysis-field" // FIX: Añadir ID
                                        name="new_analysis_field" // FIX: Añadir Name
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
                                        id="new-analysis-value" // FIX: Añadir ID
                                        name="new_analysis_value" // FIX: Añadir Name
                                    />
                                    <button
                                        className="add-button"
                                        onClick={handleAddAnalysisData}
                                        disabled={!newAnalysisField || !newAnalysisValue}
                                    >
                                        Añadir
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- TERCER BLOQUE: TRAZABILIDAD --- */}
                {/* PASAMOS TODAS LAS FUNCIONES HANDLE COMO PROPS */}
                {isLoteFound && data.trazabilidad && (
                    <TrazabilidadSection 
                        trazabilidad={data.trazabilidad} 
                        onUpdateField={handleUpdateTrazabilidadField}
                        onUpdateRecord={handleUpdateRecordCell}
                        onUpdatePacked={handleUpdatePackedCell}
                        onAddRecord={handleAddNewRecordRow}
                        onAddPacked={handleAddNewPackedRow}
                    />
                )}

                {/* BOTÓN REQUERIDO: Aparece solo después de una búsqueda exitosa */}
                {isLoteFound && (
                    <button
                        className="save-button full-width-save"
                        onClick={handleSaveData}
                        disabled={isSaving || isLoading}
                    >
                        {isSaving ? '💾 Guardando TODO...' : '💾 Guardar los Cambios de la Página'}
                    </button>
                )}
            </div>
        </main>
    );
};

export default ActualizacionDatosProducto;