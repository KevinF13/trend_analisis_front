import React, { useState, useCallback, useMemo } from 'react';
import './ActualizacionDatosProducto.css';

const API_BASE_URL = 'http://192.168.20.4:6001';

// ==============================================================================
// 1. CONSTANTES Y CONFIGURACIÓN
// ==============================================================================

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
const INITIAL_PACKED_ROW = { wadoco: '', recepcion: '', unidStd: '', unidReal: '', rendimiento: '', presentacion: '', orden: '', isNew: true };

// ==============================================================================
// 2. UTILIDADES (Helpers puros)
// ==============================================================================

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
    }
    if (dateString.includes('-')) {
        return dateString.split(' ')[0]; // Asume ISO
    }
    return dateString;
};

const formatDateForAPI = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[1]}/${parts[2]}/${parts[0]}`; // MM/DD/YYYY para Oracle
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

// ==============================================================================
// 3. LÓGICA DE MAPEO DE DATOS
// ==============================================================================

const mapApiDataToState = (apiData, detalleRows) => {
    if (!apiData || !apiData.LOTE) return null;

    // 1. Mapeo de Análisis
    const analysis = {};
    Object.keys(ANALYSIS_FIELD_MAP_REVERSE).forEach(reactKey => {
        const apiKey = ANALYSIS_FIELD_MAP_REVERSE[reactKey];
        const value = apiData[apiKey];
        if (value != null && value !== '') {
            analysis[reactKey] = String(value);
        }
    });

    // 2. Procesamiento de filas (Record vs Empacado)
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
            originalWadoco: doco,
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

    // 3. Estructura de Trazabilidad
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
        defaultWalotn: apiData.LOTE
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

// ==============================================================================
// 4. SUB-COMPONENTES DE UI
// ==============================================================================

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

// --------------------------------------------------------
// MODAL: SELECCIÓN DE PRODUCTO (Multiples encontrados)
// --------------------------------------------------------
const ProductSelectorModal = ({ products, onSelect, onCancel }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>⚠️ Múltiples productos encontrados</h3>
                <p>El lote ingresado contiene más de un producto. Seleccione:</p>
                <div className="product-list">
                    {products.map((p, idx) => (
                        <div key={idx} className="product-option-card" onClick={() => onSelect(p)}>
                            <strong>{p.PRODUCTO}</strong>
                            <br />
                            <small>Lab: {p.LABORATORIO} | Control: {p.CONTROL}</small>
                        </div>
                    ))}
                </div>
                <button className="cancel-button" onClick={onCancel}>Cancelar</button>
            </div>
        </div>
    );
};

// --------------------------------------------------------
// MODAL: AGREGAR LOTE MANUALMENTE (NUEVO)
// --------------------------------------------------------
const AddLoteModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        lote: '',
        producto: '',
        laboratorio: '',
        control: '',
        fecha_ingreso: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!formData.lote || !formData.producto || !formData.fecha_ingreso) {
            setError('Lote, Producto y Fecha son obligatorios.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // LLAMADA AL ENDPOINT ACTUALIZADO EN PYTHON
            const response = await fetch(`${API_BASE_URL}/agregar_manual_cabecera`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                onSave(formData.lote); // Pasamos el nuevo lote al padre
                onClose();
            } else {
                setError(result.error || 'Error al guardar.');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content modal-form">
                <h3>➕ Agregar Lote Manual</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Lote *</label>
                        <input name="lote" value={formData.lote} onChange={handleChange} placeholder="Ej: 25X..." />
                    </div>
                    <div className="form-group">
                        <label>Producto *</label>
                        <input name="producto" value={formData.producto} onChange={handleChange} placeholder="Nombre del producto" />
                    </div>
                    <div className="form-group">
                        <label>Laboratorio</label>
                        <input name="laboratorio" value={formData.laboratorio} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Control</label>
                        <input name="control" value={formData.control} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Fecha Ingreso *</label>
                        <input type="date" name="fecha_ingreso" value={formData.fecha_ingreso} onChange={handleChange} />
                    </div>
                </div>
                
                {error && <p className="error-text">{error}</p>}

                <div className="modal-actions">
                    <button className="cancel-button" onClick={onClose} disabled={loading}>Cancelar</button>
                    <button className="confirm-button" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const TrazabilidadSection = ({ trazabilidad, onUpdateField, onUpdateRecord, onUpdatePacked, onAddRecord, onAddPacked }) => {
    if (!trazabilidad) return null;
    const recordLotes = trazabilidad.recordProduccion.lotes || [];
    const packedRegistros = trazabilidad.productoEmpacado.registros || [];
    const semiElab = trazabilidad.analisisSemiElaborado;

    return (
        <div className="trazability-panel">
            <h3 className="trazability-title">📜 Registro Histórico y Trazabilidad</h3>
            <div className="trazability-content-grid">
                {/* SEMI ELABORADO */}
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

                {/* EMPACADO CABECERA */}
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

                {/* TIEMPOS DE CONTROL */}
                <div className="trazability-card half-width time-control-group">
                    <p className="card-title">Tiempos de Control y Liberación</p>
                    <div className="time-control-grid">
                        <div className="time-control-item editable-item"><span className="record-label-mini">CONTROL (HORAS)</span><input type="text" className="record-value-input time-value" value={trazabilidad.tiemposControl.controlProceso || ''} onChange={(e) => onUpdateField('tiemposControl', 'controlProceso', e.target.value)} /></div>
                        <div className="time-control-item editable-item"><span className="record-label-mini">REVISIÓN (HORAS)</span><input type="text" className="record-value-input time-value" value={trazabilidad.tiemposControl.revisionRecord || ''} onChange={(e) => onUpdateField('tiemposControl', 'revisionRecord', e.target.value)} /></div>
                        <div className="time-control-item editable-item"><span className="record-label-mini">LIBERACIÓN</span><input type="date" className="record-value-input time-value release-date-value date-input" value={trazabilidad.tiemposControl.liberacionProducto || ''} onChange={(e) => onUpdateField('tiemposControl', 'liberacionProducto', e.target.value)} /></div>
                        <div className="final-observations-section">
                            <label className="final-observations-label">OBSERVACIONES</label>
                            <textarea className="input-field final-observations-textarea" value={trazabilidad.tiemposControl.observacionesFinal || ''} onChange={(e) => onUpdateField('tiemposControl', 'observacionesFinal', e.target.value)} placeholder="Observaciones finales..." />
                        </div>
                    </div>
                </div>

                {/* RECORD PRODUCCION (DETALLE) */}
                <div className="trazability-card full-width">
                    <p className="card-title">Record de Producción (FECHA INGRESO:
                        <input type="date" className="highlight-text-input date-input" value={trazabilidad.recordProduccion.fechaRecepcion || ''} onChange={(e) => onUpdateField('recordProduccion', 'fechaRecepcion', e.target.value)} />
                        )
                    </p>
                    <div className="production-block-grid production-grid">
                        <span className="header-cell"># ORDEN</span>
                        <span className="header-cell">UNID. STD.</span>
                        <span className="header-cell">UNID. REAL.</span>
                        <span className="header-cell">% REND.</span>

                        {recordLotes.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center' }}>Sin registros.</div>}

                        {recordLotes.map((item, idx) => (
                            <div key={`record-${idx}`} style={{ display: 'contents' }}>
                                <input type="text" className="data-cell input-cell" value={item.orden || ''} onChange={(e) => onUpdateRecord(idx, 'orden', e.target.value)} placeholder="Orden #" />
                                <input type="number" className="data-cell input-cell" value={item.unidStd || ''} onChange={(e) => onUpdateRecord(idx, 'unidStd', e.target.value)} />
                                <input type="number" className="data-cell input-cell" value={item.unidReal || ''} onChange={(e) => onUpdateRecord(idx, 'unidReal', e.target.value)} />
                                <input type="text" className={`data-cell input-cell ${getStatusClass(item.rendimiento)}`} value={item.rendimiento || ''} readOnly />
                            </div>
                        ))}
                    </div>
                    <button className="add-row-button" onClick={onAddRecord}>➕ Agregar Fila Record</button>
                </div>

                {/* PRODUCTO EMPACADO (DETALLE) */}
                <div className="trazability-card full-width">
                    <p className="card-title">Producto Empacado - Registros</p>
                    <div className="production-block-grid packed-grid">
                        <span className="header-cell">FECHA INGRESO</span>
                        <span className="header-cell"># ORDEN</span>
                        <span className="header-cell">UNID. STD.</span>
                        <span className="header-cell">UNID. REAL.</span>
                        <span className="header-cell">% REND.</span>

                        {packedRegistros.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center' }}>Sin registros.</div>}

                        {packedRegistros.map((item, idx) => (
                            <div key={`packed-${idx}`} style={{ display: 'contents' }}>
                                <input type="date" className="data-cell input-cell" value={item.recepcion || ''} onChange={(e) => onUpdatePacked(idx, 'recepcion', e.target.value)} />
                                <input type="text" className="data-cell input-cell" value={item.orden || ''} onChange={(e) => onUpdatePacked(idx, 'orden', e.target.value)} placeholder="Orden #" />
                                <input type="number" className="data-cell input-cell" value={item.unidStd || ''} onChange={(e) => onUpdatePacked(idx, 'unidStd', e.target.value)} />
                                <input type="number" className="data-cell input-cell" value={item.unidReal || ''} onChange={(e) => onUpdatePacked(idx, 'unidReal', e.target.value)} />
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

// ==============================================================================
// 5. COMPONENTE PRINCIPAL (CONTROLADOR)
// ==============================================================================

const ActualizacionDatosProducto = () => {
    const [lote, setLote] = useState('');
    const [data, setData] = useState({
        producto: '', laboratorio: '', control: '', fechaIngreso: '',
        trazabilidad: {
            analisisSemiElaborado: { noImpresos_areaQuimica: '', noImpresos_areaBiologica: '', impresos_areaQuimica: '', impresos_areaBiologica: '' },
            analisisEmpacado: { areaQuimica: '', areaBiologica: '' },
            recordProduccion: { fechaRecepcion: '', lotes: [] },
            productoEmpacado: { registros: [] },
            tiemposControl: { observacionesFinal: '', controlProceso: '', revisionRecord: '', liberacionProducto: '' }
        },
        defaultWalitm: null,
        defaultWalotn: null
    });
    
    // Estados para lógica de UI
    const [analysisData, setAnalysisData] = useState({});
    const [observaciones, setObservaciones] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    
    // Estados para campos nuevos dinámicos
    const [newAnalysisField, setNewAnalysisField] = useState('');
    const [newAnalysisValue, setNewAnalysisValue] = useState('');

    // Estados para Selección de Producto Múltiple y Manual
    const [multipleProducts, setMultipleProducts] = useState([]);
    const [showProductSelector, setShowProductSelector] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // --------------------------------------------------------------------------
    // LÓGICA DE BÚSQUEDA Y SELECCIÓN
    // --------------------------------------------------------------------------

    const loadDetailsForProduct = useCallback(async (headerData, loteUpper) => {
        let detalleRows = [];
        try {
            const consultarDetalleUrl = `${API_BASE_URL}/consultar_detalle?lote=${loteUpper}`;
            const detalleResponse = await fetch(consultarDetalleUrl);
            if (detalleResponse.ok) {
                const detalleJson = await detalleResponse.json();
                detalleRows = detalleJson.resultado || [];
            }
        } catch (e) {
            console.error("Error fetching details", e);
        }

        const mappedState = mapApiDataToState(headerData, detalleRows);
        if (mappedState) {
            const { analysis, observaciones: fetchedObs, trazabilidad, defaultWalitm, defaultWalotn, ...prodData } = mappedState;
            setData({ ...prodData, trazabilidad, defaultWalitm, defaultWalotn });
            setAnalysisData(analysis || {});
            setObservaciones(fetchedObs || '');
        }
    }, []);

    const processSingleProduct = useCallback(async (productData, loteUpper) => {
        try {
            // 1. Insertar Cabecera (validando en backend)
            const insertarUrl = `${API_BASE_URL}/insertar`;
            const resp = await fetch(insertarUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lote: productData.LOTE,
                    PRODUCTO: productData.PRODUCTO || '',
                    LABORATORIO: productData.LABORATORIO || '',
                    CONTROL: productData.CONTROL || '',
                    FECHA_INGRESO: productData.FECHA_INGRESO || '',
                }),
            });

            // Si devuelve 409 o 200 con mensaje, el backend ya manejó si existe o no
            // Continuamos insertando detalle

            // 2. Insertar Detalle desde RAW
            const insertarDetalleUrl = `${API_BASE_URL}/insertar_detalle`;
            await fetch(insertarDetalleUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lote: loteUpper })
            });

            // 3. Cargar datos finales desde local
            const detailUrl = `${API_BASE_URL}/detalle_lote/${loteUpper}`;
            const newHeaderResponse = await fetch(detailUrl);
            if (newHeaderResponse.ok) {
                const finalData = await newHeaderResponse.json();
                await loadDetailsForProduct(finalData, loteUpper);
            }
        } catch (e) {
            console.error("Error procesando producto:", e);
            setError("Error al procesar la selección.");
        }
    }, [loadDetailsForProduct]);

    const handleSearch = useCallback(async (loteToSearch = null) => {
        const currentLote = loteToSearch || lote;

        if (!currentLote.trim()) { setError('Ingresa LOTE.'); return; }
        setIsLoading(true);
        setError(null);
        setAnalysisData({});
        setObservaciones('');
        setData(prev => ({ ...prev, producto: '' })); 

        try {
            const loteUpper = currentLote.trim().toUpperCase();
            
            // 1. Verificar si ya existe en la BD Local
            const detailUrl = `${API_BASE_URL}/detalle_lote/${loteUpper}`;
            const responseLocal = await fetch(detailUrl);
            
            if (responseLocal.ok) {
                // Existe en local, cargamos directo
                const localData = await responseLocal.json();
                await loadDetailsForProduct(localData, loteUpper);
            } else {
                // 2. Buscar en RAW (Oracle F4108)
                const consultaUrl = `${API_BASE_URL}/consulta`;
                const responseRaw = await fetch(consultaUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lote: loteUpper }),
                });

                if (responseRaw.ok) {
                    const rawResult = await responseRaw.json();
                    
                    if (Array.isArray(rawResult) && rawResult.length > 1) {
                        setMultipleProducts(rawResult);
                        setShowProductSelector(true);
                    } else {
                        const singleProduct = Array.isArray(rawResult) ? rawResult[0] : rawResult;
                        await processSingleProduct(singleProduct, loteUpper);
                    }
                } else {
                    // No encontrado en Raw, sugerimos manual
                    const errJson = await responseRaw.json();
                    setError(errJson.mensaje || 'No se encontraron datos. Puedes agregarlo manualmente.');
                }
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión.');
        } finally {
            setIsLoading(false);
        }
    }, [lote, processSingleProduct, loadDetailsForProduct]);

    const handleProductSelect = (selectedProduct) => {
        setShowProductSelector(false);
        setIsLoading(true);
        processSingleProduct(selectedProduct, lote.trim().toUpperCase())
            .finally(() => setIsLoading(false));
    };

    const handleManualSaveSuccess = (newLote) => {
        setLote(newLote);
        handleSearch(newLote); // Cargamos automáticamente el lote recién creado
    };

    const handleKeyDown = (e) => { if (e.key === 'Enter' && lote.trim()) handleSearch(); };

    // --------------------------------------------------------------------------
    // LÓGICA DE ACTUALIZACIÓN DE ESTADO
    // --------------------------------------------------------------------------

    const handleUpdateAnalysis = (f, v) => setAnalysisData(prev => ({ ...prev, [f]: v }));
    const handleRemoveAnalysis = (f) => { if (window.confirm(`¿Borrar ${f}?`)) setAnalysisData(p => { const n = { ...p }; delete n[f]; return n; }) };
    const handleAddAnalysisData = () => { if (newAnalysisField && newAnalysisValue) { setAnalysisData(p => ({ ...p, [newAnalysisField]: newAnalysisValue })); setNewAnalysisField(''); setNewAnalysisValue(''); } };
    const handleUpdateDataField = (f, v) => setData(p => ({ ...p, [f]: v }));
    const handleUpdateTrazabilidadField = (s, f, v) => setData(p => ({ ...p, trazabilidad: { ...p.trazabilidad, [s]: { ...p.trazabilidad[s], [f]: v } } }));

    const updateRowCell = (section, idx, k, v) => {
        setData(prev => {
            const listName = section === 'recordProduccion' ? 'lotes' : 'registros';
            const list = [...prev.trazabilidad[section][listName]];
            let row = { ...list[idx], [k]: v };
            if (k === 'unidStd' || k === 'unidReal') {
                row.rendimiento = calculateRendimiento(k === 'unidStd' ? v : row.unidStd, k === 'unidReal' ? v : row.unidReal);
            }
            list[idx] = row;
            return {
                ...prev,
                trazabilidad: {
                    ...prev.trazabilidad,
                    [section]: { ...prev.trazabilidad[section], [listName]: list }
                }
            };
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

    // --------------------------------------------------------------------------
    // LÓGICA DE GUARDADO (Backend Sync)
    // --------------------------------------------------------------------------

    const handleSaveData = async () => {
        if (!lote.trim() || !data.producto) { alert("Lote no válido."); return; }
        setIsSaving(true); setError(null);

        try {
            const headerBody = mapStateToApiDataHeader(data, analysisData, observaciones, lote);
            const respHeader = await fetch(`${API_BASE_URL}/actualizar/${lote.toUpperCase()}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(headerBody),
            });
            if (!respHeader.ok) throw new Error("Error guardando cabecera");

            const recordRows = data.trazabilidad.recordProduccion.lotes || [];
            const packedRows = data.trazabilidad.productoEmpacado.registros || [];
            const recordDate = data.trazabilidad.recordProduccion.fechaRecepcion;

            const allPromises = [];

            const processRow = (row, sectionType, defaultDate) => {
                const dateToUse = sectionType === 'EMP' ? row.recepcion : defaultDate;
                const newWadoco = row.orden || '';
                if (!newWadoco) return;

                const fechaFormatted = formatDateForAPI(dateToUse);
                const payloadBase = {
                    PRODUCTO: data.producto,
                    CONTROL: data.control,
                    WAUORG: parseFloat(row.unidStd) || 0,
                    WASOQS: parseFloat(row.unidReal) || 0
                };

                if (row.isNew) {
                    const insertBody = {
                        ...payloadBase,
                        LOTE: lote.toUpperCase(),
                        LABORATORIO: data.laboratorio || null,
                        FECHA_INGRESO: fechaFormatted,
                        WALOTN: data.defaultWalotn || lote.toUpperCase(),
                        WAWR02: sectionType === 'EMP' ? 'EMP' : 'NES',
                        WADOCO: parseInt(newWadoco) || 0,
                        WALITM: data.defaultWalitm
                    };
                    allPromises.push(fetch(`${API_BASE_URL}/insertar_detalle_manual`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(insertBody)
                    }));
                } else {
                    const idParaUrl = row.originalWadoco;
                    const updateBody = {
                        ...payloadBase,
                        WADOCO: parseInt(newWadoco) || 0,
                        FECHA_INGRESO: fechaFormatted
                    };
                    if (idParaUrl) {
                        allPromises.push(fetch(`${API_BASE_URL}/actualizar_manual/${lote.toUpperCase()}/${idParaUrl}`, {
                            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateBody)
                        }));
                    }
                }
            };

            recordRows.forEach(row => processRow(row, 'RECORD', recordDate));
            packedRows.forEach(row => processRow(row, 'EMP', null));

            await Promise.all(allPromises);

            alert('✅ ¡Guardado Completo!');
            const detailUrl = `${API_BASE_URL}/detalle_lote/${lote.toUpperCase()}`;
            const refreshHeader = await fetch(detailUrl);
            if (refreshHeader.ok) {
                const head = await refreshHeader.json();
                await loadDetailsForProduct(head, lote.toUpperCase());
            }

        } catch (err) {
            console.error(err); alert('❌ Error guardando datos.');
        } finally { setIsSaving(false); }
    };

    // --------------------------------------------------------------------------
    // RENDERIZADO
    // --------------------------------------------------------------------------

    return (
        <main className="app-main-container">
            <header><h1 className="header-title">Consulta y Actualización de Datos de Lote</h1></header>
            
            {showProductSelector && (
                <ProductSelectorModal 
                    products={multipleProducts} 
                    onSelect={handleProductSelect} 
                    onCancel={() => setShowProductSelector(false)} 
                />
            )}

            <AddLoteModal 
                isOpen={showAddModal} 
                onClose={() => setShowAddModal(false)} 
                onSave={handleManualSaveSuccess} 
            />

            <div className={data.producto ? "main-content-wrapper" : "main-content-wrapper single-column-mode"}>
                <div className="top-sections-grid">
                    <div className="form-panel">
                        <h3>Datos de Búsqueda</h3>
                        <div className="search-group">
                            <div className="input-group">
                                <label>LOTE</label>
                                <input type="text" value={lote} onChange={e => setLote(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ej: 25WB0603" />
                            </div>
                            <button className="search-button" onClick={() => handleSearch()} disabled={isLoading}>{isLoading ? '...' : 'Buscar'}</button>
                            <button className="add-manual-button" onClick={() => setShowAddModal(true)} title="Agregar lote manualmente">➕ Nuevo</button>
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
                                    if (fields.length === 0) return null;
                                    return <div key={grp} className="analysis-group"><h4 className="analysis-group-title">{grp}</h4><div className="analysis-results-grid editable-grid">{fields.map(f => <div key={f} className="analysis-row editable-row"><span className="analysis-label">{f}:</span><input className={`analysis-value-input ${getStatusClass(analysisData[f])}`} value={analysisData[f] || ''} onChange={e => handleUpdateAnalysis(f, e.target.value)} /><button className="remove-button" onClick={() => handleRemoveAnalysis(f)}>🗑️</button></div>)}</div></div>
                                })}
                            </div>
                            <hr className="divider" />
                            <div className="new-analysis-group">
                                <div className="input-group-inline">
                                    <select className="select-field" value={newAnalysisField} onChange={e => setNewAnalysisField(e.target.value)}><option value="">-- Campo --</option>{availableAnalysisFields.map(f => <option key={f} value={f}>{f}</option>)}</select>
                                    <input className="input-field" value={newAnalysisValue} onChange={e => setNewAnalysisValue(e.target.value)} placeholder="Valor" />
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