import React, { useState, useRef, useEffect } from 'react';
import ReactPaginate from 'react-paginate';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './TrendAnalisis.css';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// Helper function to format date from 'YYYY-MM-DD' to 'DD-MM-YYYY'
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
};

const TrendAnalisis = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [uniNeg, setUniNeg] = useState('');
    const [fechaPrueba, setFechaPrueba] = useState('');
    const [fechaFinTest, setFechaFinTest] = useState('');

    const [selectedCantRealTest, setSelectedCantRealTest] = useState('');
    const [isCantRealActive, setIsCantRealActive] = useState(false);

    const [productOptions, setProductOptions] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedTest, setSelectedTest] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [searchTestTerm, setSearchTestTerm] = useState('');
    const [searchCantRealTerm, setSearchCantRealTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5;

    const lineChartRef = useRef(null);
    const barChartRef = useRef(null);
    const scatterChartRef = useRef(null);
    const productListRef = useRef(null);
    const testListRef = useRef(null);
    const cantRealListRef = useRef(null);

    const offset = currentPage * itemsPerPage;
    const currentData = data.slice(offset, offset + itemsPerPage);
    const pageCount = Math.ceil(data.length / itemsPerPage);

    const handlePageClick = (event) => {
        setCurrentPage(event.selected);
    };

    const handleFetchProductList = async () => {
        setLoading(true);
        setError(null);
        setData([]);
        setProductOptions([]);
        setSelectedProduct('');
        setSelectedTest('');
        setSearchTerm('');
        setSelectedCantRealTest('');
        setIsCantRealActive(false);

        const apiEndpoint = 'http://172.16.2.25:5000/valor';
        const requestBody = {
            bodega: '01PD01',
            fecha_inicio: formatDate(fechaPrueba),
            fecha_fin: formatDate(fechaFinTest),
        };

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errText}`);
            }

            const apiResponse = await response.json();
            setProductOptions(apiResponse.resultados || []);
            setUniNeg('01PD01');
        } catch (e) {
            setError(e.message);
            setProductOptions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFetchTrendData = async () => {
        if (!selectedProduct || !selectedTest) {
            alert("Por favor, selecciona un producto y una prueba.");
            return;
        }

        setLoading(true);
        setError(null);
        setData([]);

        const cantRealToSend = isCantRealActive ? selectedCantRealTest : '';

        const apiEndpoint = 'http://172.16.2.25:5000/consulta';
        const requestBody = {
            prueba: selectedTest,
            cant_real: cantRealToSend,
            bodega: uniNeg,
            numero: selectedProduct,
            fecha_inicio: formatDate(fechaPrueba),
            fecha_fin: formatDate(fechaFinTest),
        };

        console.log('Datos que se están enviando a la API:', requestBody);

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errText}`);
            }

            const apiResponse = await response.json();
            const formattedData = apiResponse.resultados.map(item => ({
                'Número Lote/Serie': item.TRLOTN,
                'Resultado Prueba': item.RESULTADO_PRUEBA,
                'Valor Mínimo Permitido': item.MIN,
                'Valor Máximo Permitido': item.MAX,
                'Unidad Medida': item.UNIDAD_PRUEBA,
                'Cantidad Real': item.CANTIDAD_REAL,
            }));

            setData(formattedData);
            setCurrentPage(0);
        } catch (e) {
            setError(e.message);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const chartWidth = 180;
        const chartHeight = 90;

        const headerHeightFirstPage = 60;
        const headerHeightOtherPages = 25;

        doc.setFont("times", "normal");

        const drawHeader = (doc, isFirstPage = false) => {
            const logoX = 14;
            const logoY = 10;
            const logoWidth = 30;
            const logoHeight = 15;

            doc.addImage('/images/LOGO_FARMACID_SIN_FONDO.png', 'PNG', logoX, logoY, logoWidth, logoHeight);

            doc.setFontSize(18);
            const title1 = 'FARMACID S.A.';
            const title1Width = doc.getTextWidth(title1);
            doc.text(title1, (pageWidth - title1Width) / 2, 15);

            doc.setFontSize(14);
            const title2 = 'TREND DE ANALISIS DE PRODUCTO TERMINADO';
            const title2Width = doc.getTextWidth(title2);
            doc.text(title2, (pageWidth - title2Width) / 2, 23);

            const selectedProductDetails = productOptions.find(p => p && p.IMLITM && p.IMLITM.trim() === selectedProduct);
            const productDescription = selectedProductDetails ? selectedProductDetails.IMDSC1 : 'N/A';
            const testDescription = selectedTest || 'N/A';

            if (isFirstPage) {
                doc.setFontSize(10);
                doc.setFont("times", "bold");
                doc.text(`PRODUCTO:`, 14, 40);
                doc.text(`CODIGO:`, 14, 45);
                doc.text(`PROCESO:`, 14, 50);
                doc.setFont("times", "normal");
                doc.text(productDescription, 40, 40);
                doc.text(selectedProduct, 40, 45);
                doc.text('TERMINADO', 40, 50);

                doc.setFont("times", "bold");
                doc.text(`LABORATORIO:`, 110, 40);
                doc.text(`TEST:`, 110, 50);
                doc.setFont("times", "normal");
                doc.text(`PHARMABRAND S.A.`, 145, 40);
                doc.text(testDescription, 130, 50);
            }
        };

        const headers = [['LOTE', 'RESULTADO DE PRUEBA', 'MÁXIMO', 'MÍNIMO', 'CANTIDAD REAL', 'UM']];
        const tableData = data.map(item => [
            item['Número Lote/Serie'],
            item['Resultado Prueba'],
            item['Valor Mínimo Permitido'],
            item['Valor Máximo Permitido'],
            item['Cantidad Real'],
            item['Unidad Medida']
        ]);

        autoTable(doc, {
            head: headers,
            body: tableData,
            startY: headerHeightFirstPage + 20,
            margin: { top: headerHeightOtherPages + 10 },
            headStyles: { fillColor: '#808080', textColor: '#ffffff', fontStyle: 'bold', halign: 'center', font: 'times' },
            bodyStyles: { fillColor: '#f5f5f5', textColor: '#333333', fontSize: 10, font: 'times' },
            alternateRowStyles: { fillColor: '#ffffff' },
            theme: 'striped',
            styles: { cellPadding: 3, lineWidth: 0.1, lineColor: '#bdc3c7', font: 'times' },
            columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' } },

            didDrawPage: (data) => {
                const isFirstPage = data.pageNumber === 1;
                drawHeader(doc, isFirstPage);

                if (isFirstPage) {
                    doc.setFontSize(12);
                    doc.setFont("times", "bold");
                    doc.text('TABLA DE DATOS', doc.internal.pageSize.getWidth() / 2, headerHeightFirstPage + 15, { align: 'center' });
                }
            }
        });

        let currentY = doc.lastAutoTable.finalY + 20;

        const charts = [
            { canvas: lineChartRef.current.canvas, title: 'Trend de Análisis' },
            { canvas: barChartRef.current.canvas, title: 'Histograma de Resultados' },
            { canvas: scatterChartRef.current.canvas, title: 'Dispersión por Lote' }
        ];

        charts.forEach(chart => {
            if (chart.canvas) {
                const chartImage = chart.canvas.toDataURL('image/png', 1.0);
                if (currentY + chartHeight + 20 > pageHeight) {
                    doc.addPage();
                    drawHeader(doc, false);
                    currentY = headerHeightOtherPages + 10;
                }
                doc.setFontSize(10);
                doc.setFont("times", "normal");
                doc.text(chart.title, (pageWidth - chartWidth) / 2, currentY);
                doc.addImage(chartImage, 'PNG', (pageWidth - chartWidth) / 2, currentY + 5, chartWidth, chartHeight);
                currentY += chartHeight + 15;
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
            x: {
                title: { display: true, text: 'Número Lote/Serie' }
            },
            y: {
                title: { display: true, text: 'Valor (mg/Tab.)' },
                beginAtZero: false,
                min: (ctx) => {
                    let allValues = ctx.chart.data.datasets.flatMap(ds => ds.data);
                    return Math.min(...allValues) - 5;
                },
                max: (ctx) => {
                    let allValues = ctx.chart.data.datasets.flatMap(ds => ds.data);
                    return Math.max(...allValues) + 5;
                }
            }
        }
    };

    const barChartData = {
        labels: data.map(item => item['Número Lote/Serie']),
        datasets: [{
            label: 'Resultado Prueba',
            data: data.map(item => item['Resultado Prueba']),
            backgroundColor: 'rgba(52, 152, 219, 0.8)',
            borderColor: 'rgba(52, 152, 219, 1)',
            borderWidth: 1,
        }]
    };

    const barChartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Histograma de Resultados por Lote',
            }
        },
        scales: {
            x: {
                title: { display: true, text: 'Lote' }
            },
            y: {
                title: { display: true, text: 'Resultado' },
                beginAtZero: true
            }
        }
    };

    const scatterChartData = {
        labels: data.map(item => item['Número Lote/Serie']),
        datasets: [{
            label: 'Dispersión',
            data: data.map(item => ({ x: item['Cantidad Real'], y: item['Resultado Prueba'] })),
            backgroundColor: 'rgba(155, 89, 182, 0.8)',
            pointRadius: 6,
            pointHoverRadius: 8
        }]
    };

    const scatterChartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Relación entre Cantidad Real y Resultado Prueba',
            }
        },
        scales: {
            x: {
                title: { display: true, text: 'Cantidad Real' },
                beginAtZero: true
            },
            y: {
                title: { display: true, text: 'Resultado Prueba' },
                beginAtZero: true
            }
        }
    };

    const uniqueProducts = Array.from(new Set(productOptions
        .filter(p => p && p.IMLITM)
        .map(p => p.IMLITM)))
        .map(litm => {
            const firstItem = productOptions.find(p => p && p.IMLITM === litm);
            return {
                IMLITM: firstItem.IMLITM,
                IMDSC1: firstItem.IMDSC1
            };
        });

    const filteredProductOptions = uniqueProducts.filter(product => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return (
            (product.IMLITM && product.IMLITM.toLowerCase().includes(lowerCaseSearchTerm)) ||
            (product.IMDSC1 && product.IMDSC1.toLowerCase().includes(lowerCaseSearchTerm))
        );
    });

    const associatedTests = productOptions
        .filter(p => p && p.IMLITM && p.TRQTST && p.IMLITM === selectedProduct)
        .map(p => p.TRQTST);

    const filteredTests = associatedTests.filter(test => test.toLowerCase().includes(searchTestTerm.toLowerCase()));

    const cantRealTestOptions = productOptions
        .filter(p => p && p.IMLITM && p.TRQTST && p.IMLITM === selectedProduct && p.TRQTST !== selectedTest)
        .map(p => p.TRQTST);

    const filteredCantRealTests = cantRealTestOptions.filter(test => test.toLowerCase().includes(searchCantRealTerm.toLowerCase()));

    // Reset test and cant_real selections when product changes
    useEffect(() => {
        setSearchTestTerm('');
        setSelectedTest('');
        setSearchCantRealTerm('');
        setSelectedCantRealTest('');
        setIsCantRealActive(false);
    }, [selectedProduct]);

    useEffect(() => {
        if (!isCantRealActive) {
            setSelectedCantRealTest('');
        }
    }, [isCantRealActive]);

    const handleProductSelect = (product) => {
        setSelectedProduct(product.IMLITM);
        setSearchTerm(`${product.IMLITM} - ${product.IMDSC1}`);
        if(productListRef.current) productListRef.current.style.display = 'none';
    };

    const handleTestSelect = (test) => {
        setSelectedTest(test);
        setSearchTestTerm(test);
        if(testListRef.current) testListRef.current.style.display = 'none';
    };

    const handleCantRealSelect = (test) => {
        setSelectedCantRealTest(test);
        setSearchCantRealTerm(test);
        if(cantRealListRef.current) cantRealListRef.current.style.display = 'none';
    };

    const handleCantRealBtnClick = () => {
      const newState = !isCantRealActive;
      setIsCantRealActive(newState);
      if (newState) {
        if (cantRealListRef.current) cantRealListRef.current.style.display = 'block';
      } else {
        setSearchCantRealTerm('');
        setSelectedCantRealTest('');
        if (cantRealListRef.current) cantRealListRef.current.style.display = 'none';
      }
    };
    
    // Handlers to clear selections
    const handleClearProduct = () => {
        setSelectedProduct('');
        setSearchTerm('');
        setSelectedTest('');
        setSearchTestTerm('');
        setSelectedCantRealTest('');
        setSearchCantRealTerm('');
        setIsCantRealActive(false);
    };

    const handleClearTest = () => {
        setSelectedTest('');
        setSearchTestTerm('');
    };

    const handleClearCantReal = () => {
        setSelectedCantRealTest('');
        setSearchCantRealTerm('');
    };

    return (
        <div className="trend-analisis-container">
            <h1>Análisis de Tendencias</h1>

            <div className="form-wrapper">
                <div className="form-panel">
                    <div className="input-group">
                        <label>UniNeg</label>
                        <input
                            type="text"
                            value={uniNeg}
                            onChange={e => setUniNeg(e.target.value)}
                            readOnly
                        />
                    </div>
                    <div className="input-group">
                        <label>Fecha Prueba</label>
                        <input type="date" value={fechaPrueba} onChange={e => setFechaPrueba(e.target.value)} />
                    </div>
                    <div className="input-group">
                        <label>Fecha Fin Test</label>
                        <input type="date" value={fechaFinTest} onChange={e => setFechaFinTest(e.target.value)} />
                    </div>
                    <button className="search-button" onClick={handleFetchProductList} disabled={loading}>
                        {loading ? 'Buscando Productos...' : 'Buscar Productos'}
                    </button>
                </div>

                {productOptions.length > 0 && (
                    <div className="form-panel">
                        <div className="input-group searchable-select">
                            <label>Seleccionar Producto</label>
                            <input
                                type="text"
                                placeholder="Escribe para filtrar..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onFocus={() => {
                                    if(productListRef.current) productListRef.current.style.display = 'block';
                                }}
                                onClick={handleClearProduct}
                            />
                            <ul ref={productListRef} className="custom-dropdown">
                                {filteredProductOptions.map((item, index) => (
                                    <li key={index} onClick={() => handleProductSelect(item)}>
                                        {`${item.IMLITM} - ${item.IMDSC1}`}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {selectedProduct && (
                            <div className="input-group searchable-select">
                                <label>Seleccionar Prueba</label>
                                <input
                                    type="text"
                                    placeholder="Escribe para filtrar..."
                                    value={searchTestTerm}
                                    onChange={e => setSearchTestTerm(e.target.value)}
                                    onFocus={() => {
                                        if(testListRef.current) testListRef.current.style.display = 'block';
                                    }}
                                    onClick={handleClearTest}
                                />
                                <ul ref={testListRef} className="custom-dropdown">
                                    {filteredTests.map((test, index) => (
                                        <li key={index} onClick={() => handleTestSelect(test)}>
                                            {test}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="cant-real-group">
                            <div className="cant-real-input-and-button">
                                <button className="interactive-btn" onClick={handleCantRealBtnClick}>
                                    {isCantRealActive ? '❌' : '➕'}
                                </button>
                                {isCantRealActive && (
                                    <div className="input-group searchable-select">
                                        <label>Cant. Real</label>
                                        <input
                                            type="text"
                                            placeholder="Prueba opcional"
                                            value={searchCantRealTerm}
                                            onChange={e => setSearchCantRealTerm(e.target.value)}
                                            onFocus={() => {
                                                if(cantRealListRef.current) cantRealListRef.current.style.display = 'block';
                                            }}
                                            onClick={handleClearCantReal}
                                        />
                                        <ul ref={cantRealListRef} className="custom-dropdown">
                                            {filteredCantRealTests.map((test, index) => (
                                                <li key={index} onClick={() => handleCantRealSelect(test)}>
                                                    {test}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button className="search-button" onClick={handleFetchTrendData} disabled={loading || !selectedProduct || !selectedTest}>
                            {loading ? 'Cargando Datos...' : 'Generar Análisis'}
                        </button>
                    </div>
                )}
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
                    <div className="multi-chart-container">
                        <div className="chart-container">
                            <Line ref={lineChartRef} data={chartData} options={chartOptions} />
                        </div>
                        <div className="chart-container">
                            <Bar ref={barChartRef} data={barChartData} options={barChartOptions} />
                        </div>
                        <div className="chart-container">
                            <Scatter ref={scatterChartRef} data={scatterChartData} options={scatterChartOptions} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrendAnalisis;