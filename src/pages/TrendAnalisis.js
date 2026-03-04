import React, { useState, useRef, useEffect } from 'react';
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
import autoTable from 'jspdf-autotable';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import './TrendAnalisis.css';
import Swal from 'sweetalert2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels
);

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
};

const TrendAnalisis = () => {

    const [isChartExpanded, setIsChartExpanded] = useState(false);

    const handleExpandChart = () => {
        setIsChartExpanded(prev => !prev);
        document.body.classList.toggle('no-scroll');
    };

    useEffect(() => {
        if (isChartExpanded) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
        return () => {
            document.body.classList.remove('no-scroll');
        };
    }, [isChartExpanded]);

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
    const [testUnit, setTestUnit] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [searchTestTerm, setSearchTestTerm] = useState('');
    const [searchCantRealTerm, setSearchCantRealTerm] = useState('');

    const [average, setAverage] = useState(null);
    const [standardDeviation, setStandardDeviation] = useState(null);
    const [oneStdDev, setOneStdDev] = useState([null, null]);
    const [twoStdDev, setTwoStdDev] = useState([null, null]);
    const [threeStdDev, setThreeStdDev] = useState([null, null]);

    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5;

    const lineChartRef = useRef(null);
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

        const apiEndpoint = 'http://192.168.20.4:5000/valor';
        const requestBody = {
            bodega: uniNeg,
            fecha_inicio: formatDate(fechaPrueba),
            fecha_fin: formatDate(fechaFinTest),
        };

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errText}`);
            }

            const apiResponse = await response.json();
            setProductOptions(apiResponse.resultados || []);
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
        setAverage(null);
        setStandardDeviation(null);
        setOneStdDev([null, null]);
        setTwoStdDev([null, null]);
        setThreeStdDev([null, null]);

        const cantRealToSend = selectedCantRealTest || selectedTest;

        const apiEndpoint = 'http://192.168.20.4:5000/consulta';
        const requestBody = {
            prueba: selectedTest,
            cant_real: cantRealToSend,
            bodega: uniNeg,
            numero: selectedProduct,
            fecha_inicio: formatDate(fechaPrueba),
            fecha_fin: formatDate(fechaFinTest),
        };

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errText}`);
            }

            const apiResponse = await response.json();

            const formattedData = apiResponse.resultados.map(item => ({
                'Número Lote/Serie': item.LOTE,
                'Resultado Prueba': item.RESULTADO_PRUEBA,
                'Valor Mínimo Permitido': item.MIN,
                'Valor Máximo Permitido': item.MAX,
                'Unidad Medida': item.UNIDAD_PRUEBA,
                'Cantidad Real': item.CANTIDAD_REAL,
                'Unidad Cantidad Real': item.UNIDAD_CANTIDAD,
                'DESC_PRUEBA': item.DESC_PRUEBA,
                'CAMPO_ADICIONAL': item.CAMPO_ADICIONAL
            }));

            setData(formattedData);
            if (formattedData.length > 0) {
                setTestUnit(formattedData[0]['Unidad Medida']);
            } else {
                setTestUnit('');
            }
            setCurrentPage(0);
        } catch (e) {
            setError(e.message);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStatistics = (dataArray) => {
        if (!dataArray || dataArray.length === 0) {
            setAverage(null);
            setStandardDeviation(null);
            setOneStdDev([null, null]);
            setTwoStdDev([null, null]);
            setThreeStdDev([null, null]);
            return;
        }

        const values = dataArray.map(item => parseFloat(item['Resultado Prueba'])).filter(val => !isNaN(val));
        const n = values.length;

        if (n === 0) {
            setAverage(null);
            setStandardDeviation(null);
            setOneStdDev([null, null]);
            setTwoStdDev([null, null]);
            setThreeStdDev([null, null]);
            return;
        }

        const avg = values.reduce((sum, val) => sum + val, 0) / n;
        setAverage(avg);

        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / n;
        const stdDev = Math.sqrt(variance);
        setStandardDeviation(stdDev);

        setOneStdDev([avg - stdDev, avg + stdDev]);
        setTwoStdDev([avg - 2 * stdDev, avg + 2 * stdDev]);
        setThreeStdDev([avg - 3 * stdDev, avg + 3 * stdDev]);
    };

    useEffect(() => {
        calculateStatistics(data);
    }, [data]);

    const handleDownloadWithPrompt = async () => {
        const { value: nombre } = await Swal.fire({
            title: 'Ingresa tu Nombre',
            input: 'text',
            inputLabel: 'Nombre y Apellido:',
            inputPlaceholder: 'Ingresa tu nombre para el reporte',
            showCancelButton: true,
            confirmButtonText: 'Confirmar y Descargar',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value) {
                    return '¡Debes ingresar tu nombre!';
                }
            }
        });

        if (nombre) {
            handleDownloadPDF(nombre.trim());
        }
    };

    const BRANDS = {
        '01PD01': { title: 'FARMACID S.A.', logo: '/images/LOGO_FARMACID_SIN_FONDO.png' },
        '04PD01': { title: 'GENA S.A.', logo: '/images/LOGO_GENA-removebg-preview.png' },
        '03PD01': { title: 'BLENASTOR S.A.', logo: '/images/LOGO_BLENASTOR-removebg-preview.png' },
        default: { title: 'GENA S.A.', logo: '/images/LOGO_FARMACID_SIN_FONDO.png' },
    };

    const loadImage = (src) =>
        new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
            img.src = src;
        });

    const handleDownloadPDF = async (realizadoPorNombre) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const chartWidth = 190;
        const chartHeight = 110;
        const headerHeightFirstPage = 60;
        const headerHeightOtherPages = 25;

        doc.setFont("times", "normal");
        const brand = BRANDS[uniNeg] || BRANDS.default;
        const logoImg = await loadImage(brand.logo);
        const imgFormat = brand.logo.toLowerCase().endsWith('.jpg') || brand.logo.toLowerCase().endsWith('.jpeg')
            ? 'JPEG'
            : 'PNG';

        const drawHeader = (doc, isFirstPage = false) => {
            const logoX = 14, logoY = 10, logoWidth = 35, logoHeight = 15;

            doc.addImage(logoImg, imgFormat, logoX, logoY, logoWidth, logoHeight);

            doc.setFontSize(12);
            const title1Width = doc.getTextWidth(brand.title);
            doc.text(brand.title, ((pageWidth - title1Width) / 2) + 15, 15);

            doc.setFontSize(11)

            const title2 = 'TREND DE ANALISIS DE PRODUCTO TERMINADO';
            const title2Width = doc.getTextWidth(title2);
            doc.text(title2, ((pageWidth - title2Width) / 2) + 15, 23);

            const selectedProductDetails = productOptions.find(p => p && p.IMLITM && p.IMLITM.trim() === selectedProduct);
            const productDescription = selectedProductDetails ? selectedProductDetails.IMDSC1 : 'N/A';
            const testDetails = data.length > 0 ? data[0] : {};
            const testDescription = testDetails.DESC_PRUEBA || 'N/A';
            const additionalField = testDetails.CAMPO_ADICIONAL || 'N/A';

            // const fechaInicioFormato = formatDate(fechaPrueba) || 'N/A';
            // const fechaFinFormato = formatDate(fechaFinTest) || 'N/A';
            const fechaInicioFormato = new Date(fechaPrueba)
            .toISOString()
            .split('T')[0];

            const fechaFinFormato = new Date(fechaFinTest)
            .toISOString()
            .split('T')[0];

            if (isFirstPage) {
                doc.setFontSize(10);
                doc.setFont("times", "bold");
                doc.text(`PRODUCTO:`, 14, 40);
                doc.text(`CÓDIGO PRODUCTO:`, 14, 45);
                doc.text(`CÓDIGO:`, 14, 50);
                doc.text(`RANGO DE FECHAS:`, 14, 55);
                doc.text(`PROCESO:`, 110, 50);
                doc.setFont("times", "normal");
                doc.text(productDescription, 40, 40);
                doc.text(selectedProduct, 55, 45);
                doc.text(additionalField, 35, 50);
                doc.text(`Desde:${fechaInicioFormato} hasta ${fechaFinFormato}`, 55, 55);
                doc.text('TERMINADO', 135, 50);

                doc.setFont("times", "bold");
                doc.text(`LABORATORIO:`, 110, 40);
                doc.text(`TEST:`, 110, 45);

                doc.setFont("times", "normal");
                doc.text(`PHARMABRAND S.A.`, 145, 40);
                doc.text(testDescription, 125, 45);
            }
        };

        const headers = [['LOTE', 'MÍNIMO', 'MÁXIMO', 'RESULTADO DE LA PRUEBA', 'PORCENTAJE']];
        const tableData = data.map(item => [
            item['Número Lote/Serie'],
            item['Valor Mínimo Permitido'],
            item['Valor Máximo Permitido'],
            `${item['Resultado Prueba']} ${item['Unidad Medida']}`,
            `${item['Cantidad Real']} ${item['Unidad Cantidad Real']}`
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
            styles: { cellPadding: 0.7, lineWidth: 0.1, lineColor: '#bdc3c7', font: 'times' },
            columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },

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

        doc.addPage();
        drawHeader(doc, false);
        currentY = headerHeightOtherPages + 10;

        if (average !== null && standardDeviation !== null && testUnit) {

            if (currentY + 60 > pageHeight) {
                doc.addPage();
                drawHeader(doc, false);
                currentY = headerHeightOtherPages + 10;
            }

            doc.setFontSize(12);
            doc.setFont("times", "bold");
            doc.text('ANÁLISIS ESTADÍSTICO', doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
            currentY += 8;

            doc.setFontSize(10);
            doc.setFont("times", "normal");
            doc.text(`Promedio: ${average.toFixed(2)} ${testUnit}`, 14, currentY + 5);
            doc.text(`Desviación Estándar: ${standardDeviation.toFixed(2)}`, 14, currentY + 10);
            doc.text(`Promedio +/- 1 Desviación Estándar: ${oneStdDev[0].toFixed(2)} a ${oneStdDev[1].toFixed(2)} ${testUnit}`, 14, currentY + 15);
            doc.text(`Promedio +/- 2 Desviación Estándar: ${twoStdDev[0].toFixed(2)} a ${twoStdDev[1].toFixed(2)} ${testUnit}`, 14, currentY + 20);
            doc.text(`Promedio +/- 3 Desviación Estándar: ${threeStdDev[0].toFixed(2)} a ${threeStdDev[1].toFixed(2)} ${testUnit}`, 14, currentY + 25);
            currentY += 35;
        }

        const charts = [{ canvas: lineChartRef.current.canvas, title: 'Gráfico de Análisis de Tendencia' }];

        charts.forEach(chart => {
            if (chart.canvas) {
                const chartImage = chart.canvas.toDataURL('image/png', 1.0);

                if (currentY + chartHeight + 20 > pageHeight) {
                    doc.addPage();
                    drawHeader(doc, false);
                    currentY = headerHeightOtherPages + 10;
                }

                doc.setFontSize(10);
                doc.setFont("times", "bold");
                doc.text(chart.title, doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
                currentY += 5;

                doc.addImage(chartImage, 'PNG', (pageWidth - chartWidth) / 2, currentY, chartWidth, chartHeight);
                currentY += chartHeight + 15;
            }
        });

        if (currentY + 30 > pageHeight) {
            doc.addPage();
            drawHeader(doc, false);
            currentY = headerHeightOtherPages + 10;
        }

        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text(`Realizado por: ${realizadoPorNombre}`, 14, currentY + 20);
        doc.text(`Fecha: ${formattedDate}`, 14, currentY + 25);
        doc.text(`Revisado por: _________________`, 120, currentY + 20);
        doc.text(`Fecha: _________________`, 120, currentY + 25);

        const safeProductName = selectedProduct ? selectedProduct.replace(/\s+/g, '_') : 'General';
        doc.save(`Reporte_Analisis_${safeProductName}_${formattedDate}.pdf`);
    };

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    const fechaInicioFormato = `${year}-${month}-${day}`;


    const chartData = {
        labels: data.map(item => item['Número Lote/Serie']),
        datasets: [
            {
                label: 'Resultado Prueba',
                data: data.map(item => item['Resultado Prueba']),
                borderColor: 'rgba(52, 152, 219, 1)',
                backgroundColor: 'rgba(80, 219, 52, 0.2)',
                borderWidth: 1,
                fill: true,
                tension: 0.4,
                pointRadius: 1,
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
            },
            {
                label: 'Promedio',
                data: data.map(() => average),
                borderColor: 'rgba(255, 159, 64, 1)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [10, 5],
                pointRadius: 0,
                type: 'line',
            },
            {
                label: '+1σ',
                data: data.map(() => oneStdDev[1]),
                borderColor: 'rgba(255, 205, 86, 0.5)',
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderDash: [2, 2],
                pointRadius: 0,
                type: 'line',
            },
            {
                label: '-1σ',
                data: data.map(() => oneStdDev[0]),
                borderColor: 'rgba(255, 205, 86, 0.5)',
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderDash: [2, 2],
                pointRadius: 0,
                type: 'line',
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: { size: 10 }
                }
            },
            title: {
                display: true,
                color: '#000000ff',
                text: 'Comparación de Resultados de Prueba vs. Límites',
                font: { size: 12, weight: 'bold' },
                padding: { top: 0, bottom: 5 }
            },
            datalabels: {
                display: context => context.datasetIndex === 0,
                color: '#000000ff',
                anchor: 'end',
                align: 'top',
                offset: 1,
                font: { weight: 'normal', size: 6 },
                formatter: value => value
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Número Lote/Serie',
                    font: { size: 8, weight: 'bold' }
                },
                ticks: { maxRotation: 45, minRotation: 90, autoSkip: false, font: { size: 7 } }
            },
            y: {
                title: {
                    display: true,
                    text: `Valor (${testUnit})`,
                    font: { size: 8, weight: 'bold' }
                },
                ticks: {
                    font: { size: 8 }
                },
                beginAtZero: false,
                min: ctx => {
                    let allValues = ctx.chart.data.datasets.flatMap(ds => ds.data);
                    const filteredValues = allValues.filter(v => v !== null);
                    return filteredValues.length === 0 ? 0 : Math.min(...filteredValues) - 2;
                },
                max: ctx => {
                    let allValues = ctx.chart.data.datasets.flatMap(ds => ds.data);
                    const filteredValues = allValues.filter(v => v !== null);
                    return filteredValues.length === 0 ? 10 : Math.max(...filteredValues) + 2;
                }
            }
        }
    };

    const uniqueProducts = Array.from(new Set(productOptions
        .filter(p => p && p.IMLITM)
        .map(p => p.IMLITM)))
        .map(litm => {
            const firstItem = productOptions.find(p => p && p.IMLITM === litm);
            return { IMLITM: firstItem.IMLITM, IMDSC1: firstItem.IMDSC1 };
        });

    const filteredProductOptions = uniqueProducts.filter(product => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return (
            (product.IMLITM && product.IMLITM.toLowerCase().includes(lowerCaseSearchTerm)) ||
            (product.IMDSC1 && product.IMDSC1.toLowerCase().includes(lowerCaseSearchTerm))
        );
    });

    const normalize = (s = '') =>
        s.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const matchesTerm = (term, ...fields) => {
        const nt = normalize(term);
        return fields.some(f => normalize(f).includes(nt));
    };

    const associatedTestObjs = Array.from(
        new Map(
            productOptions
                .filter(p => p && p.IMLITM === selectedProduct && p.TRQTST)
                .map(p => [p.TRQTST, { test: p.TRQTST, desc: p.QADSC1 ?? '' }])
        ).values()
    );

    const filteredTests = associatedTestObjs.filter(t =>
        matchesTerm(searchTestTerm, t.test, t.desc)
    );

    const cantRealTestObjs = Array.from(
        new Map(
            productOptions
                .filter(
                    p =>
                        p &&
                        p.IMLITM === selectedProduct &&
                        p.TRQTST &&
                        p.TRQTST !== selectedTest
                )
                .map(p => [p.TRQTST, { test: p.TRQTST, desc: p.QADSC1 ?? '' }])
        ).values()
    );

    const filteredCantRealTests = cantRealTestObjs.filter(t =>
        matchesTerm(searchCantRealTerm, t.test, t.desc)
    );

    useEffect(() => {
        setSearchTestTerm('');
        setSelectedTest('');
        setSearchCantRealTerm('');
        setSelectedCantRealTest('');
        setIsCantRealActive(false);
    }, [selectedProduct]);

    useEffect(() => {
        if (!isCantRealActive) setSelectedCantRealTest('');
    }, [isCantRealActive]);

    const handleProductSelect = (product) => {
        setSelectedProduct(product.IMLITM);
        setSearchTerm(`${product.IMLITM} - ${product.IMDSC1}`);
        if (productListRef.current) productListRef.current.style.display = 'none';
    };

    const handleTestSelect = (test) => {
        setSelectedTest(test);
        const desc = getTestDesc(selectedProduct, test);
        setSearchTestTerm(`${test}${desc ? ` - ${desc}` : ''}`);
        if (testListRef.current) testListRef.current.style.display = 'none';
    };

    const handleCantRealSelect = (test) => {
        setSelectedCantRealTest(test);
        const desc = getTestDesc(selectedProduct, test);
        setSearchCantRealTerm(`${test}${desc ? ` - ${desc}` : ''}`);
        if (cantRealListRef.current) cantRealListRef.current.style.display = 'none';
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

    const getTestDesc = (product, test) =>
        productOptions.find(p => p.IMLITM === product && p.TRQTST === test)?.QADSC1 ?? '';

    const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

    return (
        <div className="trend-analisis-container">
            <h1>Análisis de Tendencias</h1>

            <div className="form-wrapper">

                <div className="form-panel">
                    <h3>Filtros Principales</h3>
                    <div className="input-group">
                        <label>UniNeg</label>
                        <select value={uniNeg} onChange={e => setUniNeg(e.target.value)}>
                            <option value="">Seleccione una opción</option>
                            <option value="01PD01">01PD01 - FARMACID S.A.</option>
                            <option value="04PD01">04PD01 - GENA S.A.</option>
                        </select>
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
                        <h3>Selección de Producto</h3>

                        <div className="input-group searchable-select">
                            <label>Seleccionar Producto</label>
                            <input
                                type="text"
                                placeholder="Escribe para filtrar..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onFocus={() => productListRef.current && (productListRef.current.style.display = 'block')}
                                onClick={handleClearProduct}
                            />

                            <ul ref={productListRef} className="custom-dropdown">
                                {[...filteredProductOptions]
                                    .sort((a, b) => collator.compare(a.IMDSC1 ?? '', b.IMDSC1 ?? ''))
                                    .map((item, index) => (
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
                                    placeholder="Escribe para filtrar por código o descripción..."
                                    value={searchTestTerm}
                                    onChange={e => setSearchTestTerm(e.target.value)}
                                    onFocus={() => testListRef.current && (testListRef.current.style.display = 'block')}
                                    onClick={handleClearTest}
                                />

                                <ul ref={testListRef} className="custom-dropdown">
                                    {[...filteredTests]
                                        .sort((a, b) => {
                                            const byDesc = collator.compare(a.desc ?? '', b.desc ?? '');
                                            return byDesc !== 0 ? byDesc : collator.compare(a.test ?? '', b.test ?? '');
                                        })
                                        .map((item, index) => (
                                            <li key={index} onClick={() => handleTestSelect(item.test)}>
                                                {item.test} - {item.desc}
                                            </li>
                                        ))}
                                </ul>

                            </div>
                        )}

                        <div className="cant-real-group">
                            <div className="cant-real-input-and-button">
                                <button
                                    className="interactive-btn"
                                    onClick={handleCantRealBtnClick}
                                    aria-label={isCantRealActive ? 'Quitar filtro de Cantidad Real' : 'Agregar filtro de Cantidad Real'}
                                >
                                    {isCantRealActive ? '❌' : '➕'}
                                </button>

                                {isCantRealActive && (
                                    <div className="input-group searchable-select">
                                        <label>Cant. Real</label>
                                        <input
                                            type="text"
                                            placeholder="Escribe para filtrar por código o descripción..."
                                            value={searchCantRealTerm}
                                            onChange={e => setSearchCantRealTerm(e.target.value)}
                                            onFocus={() =>
                                                cantRealListRef.current && (cantRealListRef.current.style.display = 'block')
                                            }
                                            onClick={handleClearCantReal}
                                        />

                                        <ul ref={cantRealListRef} className="custom-dropdown">
                                            {[...filteredCantRealTests]
                                                .sort((a, b) => {
                                                    const byDesc = collator.compare(a.desc ?? '', b.desc ?? '');
                                                    return byDesc !== 0 ? byDesc : collator.compare(a.test ?? '', b.test ?? '');
                                                })
                                                .map((item, index) => (
                                                    <li key={index} onClick={() => handleCantRealSelect(item.test)}>
                                                        {item.test} - {item.desc}
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
                        <button className="download-pdf-button" onClick={handleDownloadWithPrompt}>Descargar PDF</button>
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Número Lote/Serie</th>
                                    <th>Valor Mínimo Permitido</th>
                                    <th>Valor Máximo Permitido</th>
                                    <th>Resultado Prueba</th>
                                    <th>Porcentaje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentData.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item['Número Lote/Serie']}</td>
                                        <td>{item['Valor Mínimo Permitido']}</td>
                                        <td>{item['Valor Máximo Permitido']}</td>
                                        <td>{item['Resultado Prueba']} {item['Unidad Medida']}</td>
                                        <td>{item['Cantidad Real']} {item['Unidad Cantidad Real']}</td>
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

                    <div className="analysis-summary-wrapper">

                        {average !== null && standardDeviation !== null && (
                            <div className="statistical-analysis-panel">
                                <h3>Análisis Estadístico</h3>
                                <ul className="stats-list">
                                    <li><strong>Promedio:</strong> {average.toFixed(2)} {testUnit}</li>
                                    <li><strong>Desviación Estándar (σ):</strong> {standardDeviation.toFixed(2)}</li>
                                    <li><strong>Promedio ± 1σ:</strong> {oneStdDev[0].toFixed(2)} a {oneStdDev[1].toFixed(2)} {testUnit}</li>
                                    <li><strong>Promedio ± 2σ:</strong> {twoStdDev[0].toFixed(2)} a {twoStdDev[1].toFixed(2)} {testUnit}</li>
                                    <li><strong>Promedio ± 3σ:</strong> {threeStdDev[0].toFixed(2)} a {threeStdDev[1].toFixed(2)} {testUnit}</li>
                                </ul>
                            </div>
                        )}

                        <div className={`single-chart-container ${isChartExpanded ? 'chart-expanded' : ''}`}>
                            <div className="chart-container">
                                <button
                                    className="expand-chart-btn"
                                    onClick={handleExpandChart}
                                    aria-label={isChartExpanded ? 'Minimizar gráfico' : 'Expandir gráfico en pantalla completa'}
                                >
                                    {isChartExpanded ? 'X' : '⤡'}
                                </button>
                                <Line ref={lineChartRef} data={chartData} options={chartOptions} />
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default TrendAnalisis;