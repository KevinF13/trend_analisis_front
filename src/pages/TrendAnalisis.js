// src/pages/TrendAnalisis.js
import React, { useState } from 'react';
import ReactPaginate from 'react-paginate';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // ✅ IMPORTACIÓN CORRECTA
import './TrendAnalisis.css';

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const TrendAnalisis = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [uniNeg, setUniNeg] = useState('');
    const [numArticulo, setNumArticulo] = useState('');
    const [prueba, setPrueba] = useState('');
    const [cantReal, setCantReal] = useState('');
    const [fechaPrueba, setFechaPrueba] = useState('');
    const [fechaFinTest, setFechaFinTest] = useState('');

    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5;

    const offset = currentPage * itemsPerPage;
    const currentData = data.slice(offset, offset + itemsPerPage);
    const pageCount = Math.ceil(data.length / itemsPerPage); // ✅ Corrección aquí

    const handlePageClick = (event) => {
        setCurrentPage(event.selected);
    };

    const handleFetchData = async () => {
        setLoading(true);
        setError(null);

        setTimeout(() => {
            const apiResponse = [
                { 'Número Lote/Serie': 'Lote001', 'Resultado Prueba': 15, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 20, 'Cantidad Real': 150, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote002', 'Resultado Prueba': 22, 'Valor Mínimo Permitido': 20, 'Valor Máximo Permitido': 30, 'Cantidad Real': 220, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote003', 'Resultado Prueba': 18, 'Valor Mínimo Permitido': 15, 'Valor Máximo Permitido': 25, 'Cantidad Real': 180, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote004', 'Resultado Prueba': 28, 'Valor Mínimo Permitido': 25, 'Valor Máximo Permitido': 35, 'Cantidad Real': 280, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote005', 'Resultado Prueba': 12, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 15, 'Cantidad Real': 120, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote006', 'Resultado Prueba': 19, 'Valor Mínimo Permitido': 15, 'Valor Máximo Permitido': 25, 'Cantidad Real': 190, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote007', 'Resultado Prueba': 25, 'Valor Mínimo Permitido': 20, 'Valor Máximo Permitido': 30, 'Cantidad Real': 250, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote008', 'Resultado Prueba': 16, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 20, 'Cantidad Real': 160, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote009', 'Resultado Prueba': 23, 'Valor Mínimo Permitido': 20, 'Valor Máximo Permitido': 30, 'Cantidad Real': 230, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote010', 'Resultado Prueba': 17, 'Valor Mínimo Permitido': 15, 'Valor Máximo Permitido': 25, 'Cantidad Real': 170, 'Unidad Medida': 'g' },
            ];
            setData(apiResponse);
            setLoading(false);
            setCurrentPage(0);
        }, 1000);
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Reporte de Análisis de Tendencias', 14, 20);

        const headers = [['Número Lote/Serie', 'Resultado Prueba', 'Valor Mínimo Permitido', 'Valor Máximo Permitido', 'Cantidad Real', 'Unidad Medida']];
        const tableData = data.map(item => [
            item['Número Lote/Serie'],
            item['Resultado Prueba'],
            item['Valor Mínimo Permitido'],
            item['Valor Máximo Permitido'],
            item['Cantidad Real'],
            item['Unidad Medida']
        ]);

        doc.autoTable({
            head: headers,
            body: tableData,
            startY: 30,
            headStyles: {
                fillColor: '#2c3e50',
                textColor: '#ecf0f1',
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fillColor: '#ffffff',
                textColor: '#333333',
                fontSize: 10,
            },
            alternateRowStyles: {
                fillColor: '#f5f5f5'
            },
            theme: 'striped',
            styles: {
                cellPadding: 3,
                lineWidth: 0.1,
                lineColor: '#bdc3c7'
            },
            columnStyles: {
                0: { halign: 'center' },
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'center' },
                5: { halign: 'center' }
            }
        });

        doc.save('reporte_analisis_tendencias.pdf');
    };

    const chartData = {
        labels: data.map(item => item['Número Lote/Serie']),
        datasets: [
            {
                label: 'Resultado Prueba',
                data: data.map(item => item['Resultado Prueba']),
                borderColor: 'rgba(52, 152, 219, 1)',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
            },
            {
                label: 'Valor Mínimo Permitido',
                data: data.map(item => item['Valor Mínimo Permitido']),
                borderColor: 'rgba(46, 204, 113, 1)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                type: 'line',
            },
            {
                label: 'Valor Máximo Permitido',
                data: data.map(item => item['Valor Máximo Permitido']),
                borderColor: 'rgba(231, 76, 60, 1)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                type: 'line',
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: {
                display: true,
                text: 'Comparación de Resultados de Prueba vs. Límites',
            },
        },
        scales: {
            x: { title: { display: true, text: 'Número Lote/Serie' } },
            y: { title: { display: true, text: 'Valor' }, beginAtZero: true }
        }
    };

    return (
        <div className="trend-analisis-container">
            <h1>Análisis de Tendencias</h1>

            <div className="form-container">
                <div className="input-group"><label>UniNeg</label><input type="text" value={uniNeg} onChange={e => setUniNeg(e.target.value)} /></div>
                <div className="input-group"><label>2° N° Artículo</label><input type="text" value={numArticulo} onChange={e => setNumArticulo(e.target.value)} /></div>
                <div className="input-group"><label>Prueba</label><input type="text" value={prueba} onChange={e => setPrueba(e.target.value)} /></div>
                <div className="input-group-cant-real">
                    <label>Cant. Real</label>
                    <input type="text" value={cantReal} onChange={e => setCantReal(e.target.value)} />
                    <button className="interactive-btn" onClick={() => alert('Botón interactivo de Cant. Real')}>ℹ️</button>
                </div>
                <div className="input-group"><label>Fecha Prueba</label><input type="date" value={fechaPrueba} onChange={e => setFechaPrueba(e.target.value)} /></div>
                <div className="input-group"><label>Fecha Fin Test</label><input type="date" value={fechaFinTest} onChange={e => setFechaFinTest(e.target.value)} /></div>
                <button className="search-button" onClick={handleFetchData} disabled={loading}>
                    {loading ? 'Buscando...' : 'Buscar Datos'}
                </button>
            </div>

            {loading && <div className="loading-state">Cargando datos...</div>}
            {error && <div className="error-state">Error: {error}</div>}

            {data.length > 0 && (
                <div className="results-container">
                    <div className="results-header">
                        <h2>Resultados de la Búsqueda</h2>
                        <button className="download-pdf-button" onClick={handleDownloadPDF}>Descargar PDF</button>
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Número Lote/Serie</th>
                                    <th>Resultado Prueba</th>
                                    <th>Valor Mínimo Permitido</th>
                                    <th>Valor Máximo Permitido</th>
                                    <th>Cantidad Real</th>
                                    <th>Unidad Medida</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentData.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item['Número Lote/Serie']}</td>
                                        <td>{item['Resultado Prueba']}</td>
                                        <td>{item['Valor Mínimo Permitido']}</td>
                                        <td>{item['Valor Máximo Permitido']}</td>
                                        <td>{item['Cantidad Real']}</td>
                                        <td>{item['Unidad Medida']}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <ReactPaginate
                        previousLabel={'Anterior'}
                        nextLabel={'Siguiente'}
                        breakLabel={'...'}
                        pageCount={pageCount}
                        marginPagesDisplayed={2}
                        pageRangeDisplayed={3}
                        onPageChange={handlePageClick}
                        containerClassName={'pagination'}
                        activeClassName={'active'}
                    />

                    <div className="chart-container">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrendAnalisis;
