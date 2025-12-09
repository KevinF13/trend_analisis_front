import React, { useState, useCallback, useMemo } from 'react';
import './ActualizacionDatosProducto.css';

// --- CONFIGURACIÓN DE API ---
const API_BASE_URL = 'http://127.0.0.1:5000';

// Mapeo de campos de respuesta de la API (snake_case) a las claves de análisis de React
const ANALYSIS_FIELD_MAP_REVERSE = {
    'AGUA DESTILADA': 'AGUA_DESTILADA',
    'AGUA DE ENJUAGUE': 'AGUA_ENJUAGE',
    'AGUA DESMINERALIZADA': 'AGUA_DESMINERALIZADA',
    'HUMEDAD': 'HUMEDAD',
    'IDENTIFICACION': 'IDENTIFICACION',
    'CUANTIFICACION': 'CUANTICA',
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

// --- UTILIDADES DE FECHA ---

// 1. De API (MM/DD/YYYY) a Input HTML (YYYY-MM-DD) para visualizar
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    // Caso 1: Viene como MM/DD/YYYY (Oracle/Python GET)
    if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
    }
    // Caso 2: Viene como YYYY-MM-DD (ISO)
    if (dateString.includes('-')) {
        return dateString.split(' ')[0]; 
    }
    return dateString;
};

// 2. De Input HTML (YYYY-MM-DD) a API (MM/DD/YYYY)
// NOTA: Tu backend usa TO_DATE(:FECHA, 'MM/DD/YYYY') tanto para INSERT como UPDATE manual.
const formatDateForAPI = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('-'); // input date devuelve YYYY-MM-DD
    if (parts.length === 3) {
        return `${parts[1]}/${parts[2]}/${parts[0]}`; // Convertir a MM/DD/YYYY
    }
    return dateString;
};

const getStatusClass = (status) => {
    const upperStatus = (status || '').toUpperCase();
    if (upperStatus === 'APR' || upperStatus === 'APROBADO' || upperStatus.includes('CUMPLE') || upperStatus.includes('100')) {
        return 'status-approved';
    } else if (upperStatus === 'NO APR' || upperStatus === 'RECHAZADO') {
        return 'status-rejected';
    }
    return 'status-neutral';
};

const calculateRendimiento = (unidStd, unidReal) => {
    const std = parseFloat(unidStd) || 0;
    const real = parseFloat(unidReal) || 0;
    if (std > 0) {
        return ((real / std) * 100).toFixed(2);
    }
    return '';
};

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

const ALL_ANALYSIS_FIELDS = [
    ...ANALYSIS_FIELDS_MAP['ANALISIS DE MATERIA PRIMA'],
    ...ANALYSIS_FIELDS_MAP['ANALISIS DE PRODUCTO EN PROCESO'],
];

const INITIAL_RECORD_ROW = { wadoco: '', orden: '', unidStd: '', unidReal: '', rendimiento: '', recepcion: '', isNew: true };
const INITIAL_PACKED_ROW = { wadoco: '', recepcion: '', unidStd: '', unidReal: '', rendimiento: '', presentacion: '', isNew: true };

// --- LOGICA DE BÚSQUEDA Y MAPEO ---

const fetchAndMapData = async (lote) => {
    const loteUpper = lote.toUpperCase();
    const detailUrl = `${API_BASE_URL}/detalle_lote/${loteUpper}`;
    const consultaUrl = `${API_BASE_URL}/consulta`;
    const insertarDetalleUrl = `${API_BASE_URL}/insertar_detalle`;
    const consultarDetalleUrl = `${API_BASE_URL}/consultar_detalle?lote=${loteUpper}`;

    let mainData = null;

    // 1. OBTENER CABECERA (F554108)
    try {
        const response = await fetch(detailUrl);
        if (response.ok) {
            mainData = await response.json();
        } else {
            const responseConsulta = await fetch(consultaUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lote: loteUpper }),
            });

            if (responseConsulta.ok) {
                const dataConsulta = await responseConsulta.json();
                if (dataConsulta && dataConsulta.LOTE) {
                    await fetch(`${API_BASE_URL}/insertar`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            lote: dataConsulta.LOTE,
                            PRODUCTO: dataConsulta.PRODUCTO || '',
                            LABORATORIO: dataConsulta.LABORATORIO || '',
                            CONTROL: dataConsulta.CONTROL || '',
                            FECHA_INGRESO: dataConsulta.FECHA_INGRESO || '',
                        }),
                    });
                    const newDetailResponse = await fetch(detailUrl);
                    if (newDetailResponse.ok) {
                        mainData = await newDetailResponse.json();
                    }
                }
            }
        }
    } catch (e) {
        console.error("Error en flujo de cabecera:", e);
    }

    if (!mainData || !mainData.LOTE) return null;

    // 2. OBTENER DETALLES (F554108_DETALLE)
    let detalleRows = [];
    try {
        await fetch(insertarDetalleUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lote: loteUpper })
        });
        const detalleResponse = await fetch(consultarDetalleUrl);
        if (detalleResponse.ok) {
            const detalleJson = await detalleResponse.json();
            detalleRows = detalleJson.resultado || []; 
        }
    } catch (e) {
        console.error("Error obteniendo detalles del lote:", e);
    }

    return mapApiDataToState(mainData, detalleRows);
};

const mapApiDataToState = (apiData, detalleRows) => {
    if (!apiData || !apiData.LOTE) return null;

    const analysis = {};
    Object.keys(ANALYSIS_FIELD_MAP_REVERSE).forEach(reactKey => {
        const apiKey = ANALYSIS_FIELD_MAP_REVERSE[reactKey];
        const value = apiData[apiKey];
        if (value !== null && value !== undefined && value !== '') {
            analysis[reactKey] = String(value);
        }
    });

    // --- Procesamiento de Filas de Detalle ---
    const recordLotes = [];
    const packedRegistros = [];
    let fechaRecordEncontrada = ''; 

    detalleRows.forEach(row => {
        const tipo = (row.WAWR02 || '').trim();
        const unidStd = row.WAUORG !== null ? String(row.WAUORG) : '';
        const unidReal = row.WASOQS !== null ? String(row.WASOQS) : '';
        const doco = row.WADOCO ? String(row.WADOCO) : ''; 
        
        const fechaDetalle = formatDateForInput(row.FECHA_INGRESO); 

        const rend = calculateRendimiento(unidStd, unidReal);
        const rowData = {
            wadoco: doco, 
            orden: doco,  
            recepcion: fechaDetalle, 
            unidStd: unidStd,
            unidReal: unidReal,
            rendimiento: rend,
            walitm: row.WALITM, 
            walotn: row.WALOTN, 
            isNew: false
        };

        if (tipo === 'EMP') {
            packedRegistros.push({ ...rowData, presentacion: '' });
        } else {
            if (!fechaRecordEncontrada && fechaDetalle) {
                fechaRecordEncontrada = fechaDetalle;
            }
            recordLotes.push(rowData);
        }
    });

    const finalFechaRecord = fechaRecordEncontrada || formatDateForInput(apiData.FECHA_INGRESO);

    const trazabilidad = {
        analisisSemiElaborado: {
            noImpresos_areaQuimica: apiData.AREA_QUIMICA_SEMI_P || '',
            noImpresos_areaBiologica: apiData.AREA_BIOLOGICA_SEMI_P || '',
            impresos_areaQuimica: apiData.AREA_QUIMICA_SEMI_Q || '',
            impresos_areaBiologica: apiData.AREA_BIOLOGICA_SEMI_Q || '',
        },
        analisisEmpacado: {
            areaQuimica: apiData.AREA_QUIMICA_EMP || '',
            areaBiologica: apiData.AREA_BIOLOGICA_EMP || '',
        },
        recordProduccion: {
            fechaRecepcion: finalFechaRecord, 
            lotes: recordLotes,
        },
        productoEmpacado: {
            registros: packedRegistros,
        },
        tiemposControl: {
            controlProceso: apiData.TIM_CONT_PROCESO !== null ? String(apiData.TIM_CONT_PROCESO) : '',
            revisionRecord: apiData.TIM_REV_RECORD !== null ? String(apiData.TIM_REV_RECORD) : '',
            liberacionProducto: formatDateForInput(apiData.FECHA_LIBERACION_PROD),
            observacionesFinal: apiData.OBSERVACIONES_FINAL || '',
        }
    };

    return {
        producto: apiData.PRODUCTO || '',
        laboratorio: apiData.LABORATORIO || '',
        control: apiData.CONTROL || '',
        fechaIngreso: formatDateForInput(apiData.FECHA_INGRESO),
        observaciones: apiData.OBSERVACIONES || '',
        analysis,
        trazabilidad,
        defaultWalitm: detalleRows.length > 0 ? detalleRows[0].WALITM : null,
        defaultWalotn: detalleRows.length > 0 ? detalleRows[0].WALOTN : null
    };
};

const mapStateToApiDataHeader = (data, analysisData, observaciones, lote) => {
    const apiBody = {};
    Object.keys(ANALYSIS_FIELD_MAP_REVERSE).forEach(reactKey => {
        const apiKey = ANALYSIS_FIELD_MAP_REVERSE[reactKey];
        const value = analysisData[reactKey];
        if (apiKey) {
            apiBody[apiKey.toLowerCase()] = value && String(value).trim() !== '' ? String(value).trim() : null;
        }
    });
    apiBody.observaciones = observaciones ? String(observaciones).trim() : null;
    apiBody.fecha_ingreso = formatDateForAPI(data.fechaIngreso);
    
    if (data.trazabilidad) {
        const t = data.trazabilidad;
        apiBody.area_quimica_semi_p = t.analisisSemiElaborado.noImpresos_areaQuimica || null;
        apiBody.area_biologica_semi_p = t.analisisSemiElaborado.noImpresos_areaBiologica || null;
        apiBody.area_quimica_semi_q = t.analisisSemiElaborado.impresos_areaQuimica || null;
        apiBody.area_biologica_semi_q = t.analisisSemiElaborado.impresos_areaBiologica || null;
        apiBody.area_quimica_emp = t.analisisEmpacado.areaQuimica || null;
        apiBody.area_biologica_emp = t.analisisEmpacado.areaBiologica || null;
        
        const tc = t.tiemposControl;
        apiBody.tim_cont_proceso = tc.controlProceso || null;
        apiBody.tim_rev_record = tc.revisionRecord || null;
        apiBody.fecha_liberacion_prod = formatDateForAPI(tc.liberacionProducto);
        apiBody.observaciones_final = tc.observacionesFinal ? String(tc.observacionesFinal).trim() : null;
    }
    return apiBody;
};

// =============================================================================
// COMPONENTES UI
// =============================================================================

const DataRow = ({ label, value, isEditable = false, onChange = () => { }, isLote = false, dateType = false, field = null, onDateChange, isProductLoaded }) => (
    <div className={`data-row ${isEditable ? 'editable' : ''}`}>
        <div className={`data-label ${isEditable ? 'label-accent' : ''}`}>{label}</div>
        <div className="data-value-wrapper">
            {isEditable ? (
                <textarea className="input-field editable-textarea" value={value} onChange={onChange} placeholder="Observaciones..." rows="3" />
            ) : dateType ? (
                <input type="date" className="input-field editable-date-input" value={value || ''} onChange={(e) => field && onDateChange && onDateChange(field, e.target.value)} disabled={!field || !isProductLoaded} />
            ) : (
                <div className={`input-field display-value ${isLote ? 'lote-value' : ''}`}>{value || 'N/A'}</div>
            )}
        </div>
    </div>
);

const TrazabilidadSection = ({ trazabilidad, onUpdateField, onUpdateRecord, onUpdatePacked, onAddRecord, onAddPacked }) => {
    if (!trazabilidad) return null;

    const recordLotes = trazabilidad.recordProduccion.lotes || [];
    const packedRegistros = trazabilidad.productoEmpacado.registros || [];
    const semiElab = trazabilidad.analisisSemiElaborado;

    return (
        <div className="trazability-panel">
            <h3 className="trazability-title">📜 Registro Histórico y Trazabilidad</h3>
            <div className="trazability-content-grid">
                
                {/* 1. Análisis Semi-Elaborado */}
                <div className="trazability-card full-width">
                    <p className="card-title">Análisis de Producto Semi-Elaborado (Áreas)</p>
                    <div className="semi-elaborado-grid">
                        <div className="grid-header-row">
                            <span className="header-cell">Tipo</span>
                            <span className="header-cell">Área Química (P)</span>
                            <span className="header-cell">Área Biológica (P)</span>
                        </div>
                        <div className="grid-data-row-short">
                            <span className="data-cell label-cell">NO IMPRESOS</span>
                            <div className="input-cell"><input type="text" className={`input-inside-cell ${getStatusClass(semiElab.noImpresos_areaQuimica)}`} value={semiElab.noImpresos_areaQuimica || ''} onChange={(e) => onUpdateField('analisisSemiElaborado', 'noImpresos_areaQuimica', e.target.value)} /></div>
                            <div className="input-cell"><input type="text" className={`input-inside-cell ${getStatusClass(semiElab.noImpresos_areaBiologica)}`} value={semiElab.noImpresos_areaBiologica || ''} onChange={(e) => onUpdateField('analisisSemiElaborado', 'noImpresos_areaBiologica', e.target.value)} /></div>
                        </div>
                        <div className="grid-data-row-short">
                            <span className="data-cell label-cell">IMPRESOS</span>
                            <div className="input-cell"><input type="text" className={`input-inside-cell ${getStatusClass(semiElab.impresos_areaQuimica)}`} value={semiElab.impresos_areaQuimica || ''} onChange={(e) => onUpdateField('analisisSemiElaborado', 'impresos_areaQuimica', e.target.value)} /></div>
                            <div className="input-cell"><input type="text" className={`input-inside-cell ${getStatusClass(semiElab.impresos_areaBiologica)}`} value={semiElab.impresos_areaBiologica || ''} onChange={(e) => onUpdateField('analisisSemiElaborado', 'impresos_areaBiologica', e.target.value)} /></div>
                        </div>
                    </div>
                </div>

                {/* 2. Análisis Empacado */}
                <div className="trazability-card half-width">
                    <p className="card-title">Análisis de Producto Empacado</p>
                    <div className="record-row-display editable-row">
                        <span className="record-label-mini">ÁREA QUÍMICA (R)</span>
                        <input type="text" className={`record-value-input ${getStatusClass(trazabilidad.analisisEmpacado.areaQuimica)}`} value={trazabilidad.analisisEmpacado.areaQuimica || ''} onChange={(e) => onUpdateField('analisisEmpacado', 'areaQuimica', e.target.value)} />
                    </div>
                    <div className="record-row-display editable-row">
                        <span className="record-label-mini">ÁREA BIOLÓGICA (R)</span>
                        <input type="text" className={`record-value-input ${getStatusClass(trazabilidad.analisisEmpacado.areaBiologica)}`} value={trazabilidad.analisisEmpacado.areaBiologica || ''} onChange={(e) => onUpdateField('analisisEmpacado', 'areaBiologica', e.target.value)} />
                    </div>
                </div>

                {/* 3. Tiempos de Control */}
                <div className="trazability-card half-width time-control-group">
                    <p className="card-title">Tiempos de Control y Liberación</p>
                    <div className="time-control-grid">
                        <div className="time-control-item editable-item"><span className="record-label-mini">CONTROL (DÍAS)</span><input type="text" className="record-value-input time-value" value={trazabilidad.tiemposControl.controlProceso || ''} onChange={(e) => onUpdateField('tiemposControl', 'controlProceso', e.target.value)} /></div>
                        <div className="time-control-item editable-item"><span className="record-label-mini">REVISIÓN (DÍAS)</span><input type="text" className="record-value-input time-value" value={trazabilidad.tiemposControl.revisionRecord || ''} onChange={(e) => onUpdateField('tiemposControl', 'revisionRecord', e.target.value)} /></div>
                        <div className="time-control-item editable-item"><span className="record-label-mini">LIBERACIÓN</span><input type="date" className="record-value-input time-value release-date-value date-input" value={trazabilidad.tiemposControl.liberacionProducto || ''} onChange={(e) => onUpdateField('tiemposControl', 'liberacionProducto', e.target.value)} /></div>
                        <div className="final-observations-section">
                            <label className="final-observations-label">OBSERVACIONES</label>
                            <textarea className="input-field final-observations-textarea" value={trazabilidad.tiemposControl.observacionesFinal || ''} onChange={(e) => onUpdateField('tiemposControl', 'observacionesFinal', e.target.value)} placeholder="Observaciones finales..." />
                        </div>
                    </div>
                </div>

                {/* 4. Record de Producción (AQUI SE USA FECHA_INGRESO GLOBAL DE RECORD) */}
                <div className="trazability-card full-width">
                    <p className="card-title">Record de Producción (FECHA INGRESO: 
                        <input
                            type="date"
                            className="highlight-text-input date-input"
                            value={trazabilidad.recordProduccion.fechaRecepcion || ''}
                            onChange={(e) => onUpdateField('recordProduccion', 'fechaRecepcion', e.target.value)}
                        />
                        )
                    </p>
                    <div className="production-block-grid production-grid">
                        <span className="header-cell"># ORDEN (WADOCO)</span>
                        <span className="header-cell">UNID. STD.</span>
                        <span className="header-cell">UNID. REAL.</span>
                        <span className="header-cell">% REND.</span>

                        {recordLotes.length === 0 && <div style={{gridColumn: '1 / -1', textAlign: 'center'}}>Sin registros.</div>}

                        {recordLotes.map((item, idx) => (
                            <div key={`record-${idx}`} style={{ display: 'contents' }}>
                                {/* WADOCO editable visualmente */}
                                <input type="text" className="data-cell input-cell" value={item.orden || ''} onChange={(e) => onUpdateRecord(idx, 'orden', e.target.value)} placeholder="Orden #" />
                                <input type="text" className="data-cell input-cell" value={item.unidStd || ''} onChange={(e) => onUpdateRecord(idx, 'unidStd', e.target.value)} />
                                <input type="text" className="data-cell input-cell" value={item.unidReal || ''} onChange={(e) => onUpdateRecord(idx, 'unidReal', e.target.value)} />
                                <input type="text" className={`data-cell input-cell ${getStatusClass(item.rendimiento)}`} value={item.rendimiento || ''} readOnly />
                            </div>
                        ))}
                    </div>
                    <button className="add-row-button" onClick={onAddRecord}>➕ Agregar Fila Record</button>
                </div>

                {/* 5. Producto Empacado (AQUI SE USA FECHA_INGRESO INDIVIDUAL) */}
                <div className="trazability-card full-width">
                    <p className="card-title">Producto Empacado - Registros</p>
                    <div className="production-block-grid packed-grid">
                        <span className="header-cell">FECHA INGRESO</span>
                        <span className="header-cell"># ORDEN (WADOCO)</span>
                        <span className="header-cell">UNID. STD.</span>
                        <span className="header-cell">UNID. REAL.</span>
                        <span className="header-cell">% REND.</span>

                        {packedRegistros.length === 0 && <div style={{gridColumn: '1 / -1', textAlign: 'center'}}>Sin registros.</div>}

                        {packedRegistros.map((item, idx) => (
                            <div key={`packed-${idx}`} style={{ display: 'contents' }}>
                                {/* FECHA_INGRESO INDIVIDUAL POR FILA */}
                                <input 
                                    type="date" 
                                    className="data-cell input-cell" 
                                    value={item.recepcion || ''} 
                                    onChange={(e) => onUpdatePacked(idx, 'recepcion', e.target.value)} 
                                />
                                <input type="text" className="data-cell input-cell" value={item.orden || item.wadoco || ''} onChange={(e) => onUpdatePacked(idx, 'orden', e.target.value)} placeholder="Orden #" />
                                <input type="text" className="data-cell input-cell" value={item.unidStd || ''} onChange={(e) => onUpdatePacked(idx, 'unidStd', e.target.value)} />
                                <input type="text" className="data-cell input-cell" value={item.unidReal || ''} onChange={(e) => onUpdatePacked(idx, 'unidReal', e.target.value)} />
                                <input type="text" className={`data-cell input-cell ${getStatusClass(item.rendimiento)}`} value={item.rendimiento || ''} readOnly />
                            </div>
                        ))}
                    </div>
                    <button className="add-row-button" onClick={onAddPacked}>➕ Agregar Fila Empacado</button>
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================
const ActualizacionDatosProducto = () => {
    const [lote, setLote] = useState('');
    const [data, setData] = useState({
        producto: '', laboratorio: '', control: '', fechaIngreso: '',
        trazabilidad: {
            analisisSemiElaborado: { noImpresos_areaQuimica: '', noImpresos_areaBiologica: '', impresos_areaQuimica: '', impresos_areaBiologica: '' },
            analisisEmpacado: {},
            recordProduccion: { fechaRecepcion: '', lotes: [] },
            productoEmpacado: { registros: [] },
            tiemposControl: { observacionesFinal: '' }
        },
        defaultWalitm: null, 
        defaultWalotn: null
    });
    const [analysisData, setAnalysisData] = useState({});
    const [observaciones, setObservaciones] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [newAnalysisField, setNewAnalysisField] = useState('');
    const [newAnalysisValue, setNewAnalysisValue] = useState('');

    const handleSearch = useCallback(async () => {
        if (!lote.trim()) { setError('Ingresa LOTE.'); return; }
        setIsLoading(true); setError(null); setAnalysisData({}); setObservaciones('');
        try {
            const result = await fetchAndMapData(lote.trim());
            if (result) {
                const { analysis, observaciones: fetchedObs, trazabilidad, defaultWalitm, defaultWalotn, ...prodData } = result;
                setData({ ...prodData, trazabilidad, defaultWalitm, defaultWalotn });
                setAnalysisData(analysis || {});
                setObservaciones(fetchedObs || '');
            } else {
                setError(`No se encontraron datos para: ${lote}`);
                setData(prev => ({ ...prev, producto: '' }));
            }
        } catch (err) { console.error(err); setError('Error de conexión.'); } 
        finally { setIsLoading(false); }
    }, [lote]);

    const handleKeyDown = (e) => { if (e.key === 'Enter' && lote.trim()) handleSearch(); };

    // --- GUARDADO GENERAL ---
    const handleSaveData = async () => {
        if (!lote.trim() || !data.producto) { alert("Lote no válido."); return; }
        setIsSaving(true); setError(null);

        try {
            // 1. Guardar Cabecera
            const headerBody = mapStateToApiDataHeader(data, analysisData, observaciones, lote);
            const respHeader = await fetch(`${API_BASE_URL}/actualizar/${lote.toUpperCase()}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(headerBody),
            });
            if (!respHeader.ok) throw new Error("Error guardando cabecera");

            // 2. Procesar Detalles
            const recordRows = data.trazabilidad.recordProduccion.lotes || [];
            const packedRows = data.trazabilidad.productoEmpacado.registros || [];
            
            // Fecha general que se usará para todas las filas de RECORD
            const recordDate = data.trazabilidad.recordProduccion.fechaRecepcion;

            const allPromises = [];

            const processRow = (row, sectionType, defaultDate) => {
                // Para Packed usa row.recepcion, para Record usa la fecha general
                const dateToUse = sectionType === 'EMP' ? row.recepcion : defaultDate;
                const wadocoToUse = row.orden || row.wadoco; 

                if (!wadocoToUse) return; 

                // CORRECCION: Siempre usar formato MM/DD/YYYY para la API
                const fechaFormatted = formatDateForAPI(dateToUse);

                const payloadBase = {
                    PRODUCTO: data.producto,
                    CONTROL: data.control,
                    WAUORG: parseFloat(row.unidStd) || 0,
                    WASOQS: parseFloat(row.unidReal) || 0
                };

                if (row.isNew || !row.wadoco) {
                    // === INSERT (POST) ===
                    const insertBody = {
                        ...payloadBase,
                        LOTE: lote.toUpperCase(),
                        LABORATORIO: data.laboratorio || null,
                        FECHA_INGRESO: fechaFormatted, // MM/DD/YYYY
                        WALOTN: data.defaultWalotn || lote.toUpperCase(),
                        WAWR02: sectionType === 'EMP' ? 'EMP' : ' ', 
                        WADOCO: parseInt(wadocoToUse),
                        WALITM: data.defaultWalitm
                    };
                    allPromises.push(fetch(`${API_BASE_URL}/insertar_detalle_manual`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(insertBody)
                    }));
                } else {
                    // === UPDATE (PUT) ===
                    const updateBody = {
                        ...payloadBase,
                        WADOCO: parseInt(wadocoToUse),
                        FECHA_INGRESO: fechaFormatted // MM/DD/YYYY
                    };
                    allPromises.push(fetch(`${API_BASE_URL}/actualizar_manual/${lote.toUpperCase()}/${row.wadoco}`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateBody)
                    }));
                }
            };

            // Ejecutar proceso para Records y Empacado
            recordRows.forEach(row => processRow(row, 'RECORD', recordDate));
            packedRows.forEach(row => processRow(row, 'EMP', null));

            await Promise.all(allPromises);

            alert('✅ ¡Guardado Completo!');
            handleSearch(); // Recargar

        } catch (err) {
            console.error(err); alert('❌ Error guardando datos.');
        } finally { setIsSaving(false); }
    };

    // --- MANEJADORES UI ---
    const handleUpdateAnalysis = (f, v) => setAnalysisData(prev => ({ ...prev, [f]: v }));
    const handleRemoveAnalysis = (f) => { if(window.confirm(`¿Borrar ${f}?`)) setAnalysisData(p => { const n={...p}; delete n[f]; return n; })};
    const handleAddAnalysisData = () => { if(newAnalysisField && newAnalysisValue) { setAnalysisData(p => ({...p, [newAnalysisField]: newAnalysisValue})); setNewAnalysisField(''); setNewAnalysisValue(''); }};
    const handleUpdateDataField = (f, v) => setData(p => ({ ...p, [f]: v }));
    const handleUpdateTrazabilidadField = (s, f, v) => setData(p => ({ ...p, trazabilidad: { ...p.trazabilidad, [s]: { ...p.trazabilidad[s], [f]: v } } }));

    const updateRowCell = (section, idx, k, v) => {
        setData(prev => {
            const list = [...prev.trazabilidad[section][section === 'recordProduccion' ? 'lotes' : 'registros']];
            let row = { ...list[idx], [k]: v };
            if (k === 'unidStd' || k === 'unidReal') {
                row.rendimiento = calculateRendimiento(k==='unidStd'?v:row.unidStd, k==='unidReal'?v:row.unidReal);
            }
            list[idx] = row;
            return { ...prev, trazabilidad: { ...prev.trazabilidad, [section]: { ...prev.trazabilidad[section], [section === 'recordProduccion' ? 'lotes' : 'registros']: list } } };
        });
    };

    const handleUpdateRecordCell = (i, k, v) => updateRowCell('recordProduccion', i, k, v);
    const handleUpdatePackedCell = (i, k, v) => updateRowCell('productoEmpacado', i, k, v);
    
    const addRow = (section, initial) => setData(p => ({ 
        ...p, 
        trazabilidad: { 
            ...p.trazabilidad, 
            [section]: { 
                ...p.trazabilidad[section], 
                [section === 'recordProduccion' ? 'lotes' : 'registros']: [
                    ...p.trazabilidad[section][section === 'recordProduccion' ? 'lotes' : 'registros'], 
                    { ...initial, isNew: true } 
                ] 
            } 
        } 
    }));
    
    const handleAddNewRecordRow = () => addRow('recordProduccion', INITIAL_RECORD_ROW);
    const handleAddNewPackedRow = () => addRow('productoEmpacado', INITIAL_PACKED_ROW);

    const availableAnalysisFields = useMemo(() => ALL_ANALYSIS_FIELDS.filter(f => !analysisData.hasOwnProperty(f)), [analysisData]);

    return (
        <main className="app-main-container">
            <header><h1 className="header-title">Consulta y Actualización de Datos de Lote</h1></header>
            <div className={data.producto ? "main-content-wrapper" : "main-content-wrapper single-column-mode"}>
                <div className="top-sections-grid">
                    <div className="form-panel">
                        <h3>Datos de Búsqueda</h3>
                        <div className="search-group">
                            <div className="input-group">
                                <label>LOTE</label>
                                <input type="text" value={lote} onChange={e => setLote(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ej: 25WB0603" />
                            </div>
                            <button className="search-button" onClick={handleSearch} disabled={isLoading || !lote.trim()}>{isLoading ? '...' : 'Buscar'}</button>
                        </div>
                        {error && <p className="error-message">{error}</p>}
                        <div className="data-display-section">
                            <DataRow label="PRODUCTO" value={data.producto} isLote={true} />
                            <DataRow label="LABORATORIO" value={data.laboratorio} />
                            <DataRow label="CONTROL" value={data.control} />
                            <DataRow label="FECHA INGRESO" value={data.fechaIngreso} dateType={true} field="fechaIngreso" onDateChange={handleUpdateDataField} isProductLoaded={!!data.producto} />
                        </div>
                        {data.producto && (
                            <>
                                <DataRow label="OBSERVACIONES" value={observaciones} isEditable={true} onChange={e => setObservaciones(e.target.value)} />
                                <button className="save-button" onClick={handleSaveData} disabled={isSaving}>{isSaving ? '💾 Guardando...' : '💾 Guardar Todo'}</button>
                            </>
                        )}
                    </div>

                    {data.producto && (
                        <div className="analysis-panel">
                            <h3>Resultados de Análisis</h3>
                            <div className="analysis-results">
                                {['ANALISIS DE MATERIA PRIMA', 'ANALISIS DE PRODUCTO EN PROCESO'].map(grp => {
                                    const fields = [...new Set([...ANALYSIS_FIELDS_MAP[grp].filter(f => analysisData.hasOwnProperty(f)), ...Object.keys(analysisData).filter(f => !ALL_ANALYSIS_FIELDS.includes(f) && (grp === 'ANALISIS DE MATERIA PRIMA' ? f.includes('MATERIA') : true))])];
                                    if(fields.length === 0) return null;
                                    return <div key={grp} className="analysis-group"><h4 className="analysis-group-title">{grp}</h4><div className="analysis-results-grid editable-grid">{fields.map(f => <div key={f} className="analysis-row editable-row"><span className="analysis-label">{f}:</span><input className={`analysis-value-input ${getStatusClass(analysisData[f])}`} value={analysisData[f]||''} onChange={e=>handleUpdateAnalysis(f,e.target.value)} /><button className="remove-button" onClick={()=>handleRemoveAnalysis(f)}>🗑️</button></div>)}</div></div>
                                })}
                            </div>
                            <hr className="divider" />
                            <div className="new-analysis-group">
                                <div className="input-group-inline">
                                    <select className="select-field" value={newAnalysisField} onChange={e=>setNewAnalysisField(e.target.value)}><option value="">-- Campo --</option>{availableAnalysisFields.map(f=><option key={f} value={f}>{f}</option>)}</select>
                                    <input className="input-field" value={newAnalysisValue} onChange={e=>setNewAnalysisValue(e.target.value)} placeholder="Valor" />
                                    <button className="add-button" onClick={handleAddAnalysisData} disabled={!newAnalysisField}>Añadir</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {data.producto && data.trazabilidad && (
                    <TrazabilidadSection
                        trazabilidad={data.trazabilidad}
                        onUpdateField={handleUpdateTrazabilidadField}
                        onUpdateRecord={handleUpdateRecordCell}
                        onUpdatePacked={handleUpdatePackedCell}
                        onAddRecord={handleAddNewRecordRow}
                        onAddPacked={handleAddNewPackedRow}
                    />
                )}
            </div>
        </main>
    );
};

export default ActualizacionDatosProducto;