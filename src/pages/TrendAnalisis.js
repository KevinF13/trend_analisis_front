// Importación de librerías y hooks de React
import React, { useState, useRef, useEffect } from 'react';
import ReactPaginate from 'react-paginate'; // Para paginación de tablas
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'; // Librería para gráficos
import { Line } from 'react-chartjs-2'; // Componente de gráficos de línea para React
import jsPDF from 'jspdf'; // Para generar PDF
import autoTable from 'jspdf-autotable'; // Para generar tablas en PDF
import ChartDataLabels from 'chartjs-plugin-datalabels'; // Para mostrar valores en los gráficos
import './TrendAnalisis.css'; // Importa estilos específicos

import Swal from 'sweetalert2';

// Registro de los componentes necesarios de Chart.js y plugins
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

// Función auxiliar para formatear fechas de 'YYYY-MM-DD' a 'DD-MM-YYYY'
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
};

const TrendAnalisis = () => {

    const [isChartExpanded, setIsChartExpanded] = useState(false);

    const handleExpandChart = () => {
        setIsChartExpanded(prev => !prev);
        // Nota: Eliminamos la manipulación directa de document.body de aquí
        document.body.classList.toggle('no-scroll');
    };

    // --- Control del scroll en el body ---
    useEffect(() => {
        if (isChartExpanded) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
        // Función de limpieza para asegurar que la clase se quite al desmontar el componente
        return () => {
            document.body.classList.remove('no-scroll');
        };
    }, [isChartExpanded]); // Se ejecuta cada vez que el estado cambia


    // ... resto del código
    // Estados principales
    const [data, setData] = useState([]); // Datos que vienen del API
    const [loading, setLoading] = useState(false); // Estado de carga
    const [error, setError] = useState(null); // Estado de error

    // Estados de filtros
    const [uniNeg, setUniNeg] = useState(''); // Unidad de negocio (bodega)
    const [fechaPrueba, setFechaPrueba] = useState(''); // Fecha inicio
    const [fechaFinTest, setFechaFinTest] = useState(''); // Fecha fin

    // Estados para selección de Cantidad Real
    const [selectedCantRealTest, setSelectedCantRealTest] = useState('');
    const [isCantRealActive, setIsCantRealActive] = useState(false); // Controla si se activa campo opcional

    // Estados para productos y pruebas
    const [productOptions, setProductOptions] = useState([]); // Lista completa de productos desde API
    const [selectedProduct, setSelectedProduct] = useState(''); // Producto seleccionado
    const [selectedTest, setSelectedTest] = useState(''); // Prueba seleccionada
    const [testUnit, setTestUnit] = useState(''); // Unidad de medida de la prueba

    // Estados para búsqueda en inputs
    const [searchTerm, setSearchTerm] = useState(''); // Búsqueda de producto
    const [searchTestTerm, setSearchTestTerm] = useState(''); // Búsqueda de prueba
    const [searchCantRealTerm, setSearchCantRealTerm] = useState(''); // Búsqueda de Cantidad Real

    // --- Estados para análisis estadístico ---
    const [average, setAverage] = useState(null); // Promedio
    const [standardDeviation, setStandardDeviation] = useState(null); // Desviación estándar
    const [oneStdDev, setOneStdDev] = useState([null, null]); // ±1σ
    const [twoStdDev, setTwoStdDev] = useState([null, null]); // ±2σ
    const [threeStdDev, setThreeStdDev] = useState([null, null]); // ±3σ

    // --- Estados para paginación ---
    const [currentPage, setCurrentPage] = useState(0); // Página actual
    const itemsPerPage = 5; // Items por página

    // --- Referencias a elementos del DOM ---
    const lineChartRef = useRef(null); // Ref para gráfico
    const productListRef = useRef(null); // Ref para dropdown de productos
    const testListRef = useRef(null); // Ref para dropdown de pruebas
    const cantRealListRef = useRef(null); // Ref para dropdown de Cantidad Real

    // --- Cálculo de datos de la página actual ---
    const offset = currentPage * itemsPerPage;
    const currentData = data.slice(offset, offset + itemsPerPage);
    const pageCount = Math.ceil(data.length / itemsPerPage);

    // --- Manejo de cambio de página ---
    const handlePageClick = (event) => {
        setCurrentPage(event.selected);
    };



    // --- Función para obtener lista de productos desde API ---
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

        const apiEndpoint = 'http://127.0.0.1:5000/valor';
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

            // 🔹 Aquí imprimimos los resultados en consola
            console.log('Resultados de la API /valor:', apiResponse.resultados);

            setProductOptions(apiResponse.resultados || []);
        } catch (e) {
            setError(e.message);
            setProductOptions([]);
        } finally {
            setLoading(false);
        }
    };

    // --- Función para obtener datos de tendencias según selección ---
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

        // Si no hay Cantidad Real opcional seleccionada, enviar prueba principal
        const cantRealToSend = selectedCantRealTest || selectedTest;

        const apiEndpoint = 'http://127.0.0.1:5000/consulta';
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errText}`);
            }

            const apiResponse = await response.json();

            // Mapear datos del API a formato legible para la tabla
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
                setTestUnit(formattedData[0]['Unidad Medida']); // Guardar unidad de medida
            } else {
                setTestUnit('');
            }
            setCurrentPage(0); // Reset de la paginación
        } catch (e) {
            setError(e.message);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    // --- Función para calcular estadísticas ---
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

    // --- Recalcular estadísticas cada vez que cambian los datos ---
    useEffect(() => {
        calculateStatistics(data);
    }, [data]);

    // Función Wrapper para la descarga
    const handleDownloadWithPrompt = async () => {
        // Pide el nombre del usuario
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
            // Llama a la función principal de descarga con el nombre
            handleDownloadPDF(nombre.trim());
        }
    };

    // Mapa centralizado de marcas por UniNeg
    const BRANDS = {
        '01PD01': { title: 'FARMACID S.A.', logo: '/images/LOGO_FARMACID_SIN_FONDO.png' },
        '04PD01': { title: 'GENA S.A.', logo: '/images/LOGO_GENA-removebg-preview.png' },
        '03PD01': { title: 'BLENASTOR S.A.', logo: '/images/LOGO_BLENASTOR-removebg-preview.png' },
        default: { title: 'GENA S.A.', logo: '/images/LOGO_FARMACID_SIN_FONDO.png' }, // fallback
    };
    // Utilidad para cargar imágenes de forma segura
    const loadImage = (src) =>
        new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
            img.src = src;
        });

    // --- Función para descargar PDF ---
    const handleDownloadPDF = async (realizadoPorNombre) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const chartWidth = 190;
        const chartHeight = 130;
        const headerHeightFirstPage = 60;
        const headerHeightOtherPages = 25;

        doc.setFont("times", "normal");
        const brand = BRANDS[uniNeg] || BRANDS.default;
        const logoImg = await loadImage(brand.logo);
        const imgFormat = brand.logo.toLowerCase().endsWith('.jpg') || brand.logo.toLowerCase().endsWith('.jpeg')
            ? 'JPEG'
            : 'PNG';

        // // Función para dibujar el header en cada página
        // const drawHeader = (doc, isFirstPage = false) => {
        //     const logoX = 14, logoY = 10, logoWidth = 30, logoHeight = 15;
        //     doc.addImage('/images/LOGO GENA.png', 'PNG', logoX, logoY, logoWidth, logoHeight);
        //     doc.setFontSize(18);
        //     const title1 = 'GENA S.A.';
        //     const title1Width = doc.getTextWidth(title1);
        //     doc.text(title1, (pageWidth - title1Width) / 2, 15);

        //     doc.setFontSize(14);

        // 3) Header con logo/título dinámicos
        const drawHeader = (doc, isFirstPage = false) => {
            const logoX = 14, logoY = 10, logoWidth = 35, logoHeight = 15;

            doc.addImage(logoImg, imgFormat, logoX, logoY, logoWidth, logoHeight);

            doc.setFontSize(18);
            const title1Width = doc.getTextWidth(brand.title);
            doc.text(brand.title, ((pageWidth - title1Width) / 2) + 15, 15);

            doc.setFontSize(14)

            const title2 = 'TREND DE ANALISIS DE PRODUCTO TERMINADO';
            const title2Width = doc.getTextWidth(title2);
            doc.text(title2, ((pageWidth - title2Width) / 2) + 15, 23);

            const selectedProductDetails = productOptions.find(p => p && p.IMLITM && p.IMLITM.trim() === selectedProduct);
            const productDescription = selectedProductDetails ? selectedProductDetails.IMDSC1 : 'N/A';
            const testDetails = data.length > 0 ? data[0] : {};
            const testDescription = testDetails.DESC_PRUEBA || 'N/A';
            const additionalField = testDetails.CAMPO_ADICIONAL || 'N/A';

            if (isFirstPage) {
                doc.setFontSize(10);
                doc.setFont("times", "bold");
                doc.text(`PRODUCTO:`, 14, 40);
                doc.text(`CÓDIGO PRODUCTO:`, 14, 45);
                doc.text(`CÓDIGO:`, 14, 50);
                doc.text(`PROCESO:`, 110, 50);
                doc.setFont("times", "normal");
                doc.text(productDescription, 40, 40);
                doc.text(selectedProduct, 55, 45);
                doc.text(additionalField, 35, 50);
                doc.text('TERMINADO', 135, 50);

                doc.setFont("times", "bold");
                doc.text(`LABORATORIO:`, 110, 40);
                doc.text(`TEST:`, 110, 45);

                doc.setFont("times", "normal");
                doc.text(`PHARMABRAND S.A.`, 145, 40);
                doc.text(testDescription, 125, 45);
            }
        };

        // Configuración de tabla
        const headers = [['LOTE', 'RESULTADO PRUEBA', 'MÍNIMO', 'MÁXIMO', 'CANTIDAD REAL']];
        const tableData = data.map(item => [
            item['Número Lote/Serie'],
            `${item['Resultado Prueba']} ${item['Unidad Medida']}`,
            item['Valor Mínimo Permitido'],
            item['Valor Máximo Permitido'],
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
            styles: { cellPadding: 3, lineWidth: 0.1, lineColor: '#bdc3c7', font: 'times' },
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

        // --- Sección de análisis estadístico en PDF ---
        if (average !== null && testUnit) {
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

        // --- Insertar gráficos ---
        const charts = [{ canvas: lineChartRef.current.canvas, title: 'Gráfico' }];

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

        // --- LÍNEAS MODIFICADAS: Usar el nombre recibido ---
        if (currentY + 15 > pageHeight) {
            doc.addPage();
            drawHeader(doc, false);
            currentY = headerHeightOtherPages + 10;
        }

        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text(`Realizado por: ${realizadoPorNombre}`, 14, currentY + 5);
        doc.text(`Fecha: ${formattedDate}`, 14, currentY + 15);
        // ---------------------------------------------------
        doc.text(`Revisado por: Nelly Rocha`, 130, currentY + 5);
        doc.text(`Fecha: 2025-10-08`, 130, currentY + 15);

        doc.save('reporte_analisis_tendencias.pdf'); // Descargar PDF
    };
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    console.log(formattedDate); // 2025-10-10

    // --- Datos y configuración del gráfico ---
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
            },
            // --- Líneas estadísticas ---
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

    // --- Configuración de opciones del gráfico ---
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: {
                display: true,
                color: '#000000ff',
                text: 'Comparación de Resultados de Prueba vs. Límites',
                font: { size: 20, weight: 'bold' },
                padding: { top: 0, bottom: 15 }
            },
            datalabels: {
                display: context => context.datasetIndex === 0,
                color: '#000000ff',
                anchor: 'end',
                align: 'top',
                offset: 1,
                font: { weight: 'normal', size: 11 },
                formatter: value => value
            }
        },
        scales: {
            x: {
                title: { display: true, text: 'Número Lote/Serie', font: { size: 14, weight: 'bold' } },
                ticks: { maxRotation: 45, minRotation: 45, autoSkip: false, font: { size: 11 } }
            },
            y: {
                title: { display: true, text: `Valor (${testUnit})`, font: { size: 14, weight: 'bold' } },
                beginAtZero: false,
                min: ctx => {
                    let allValues = ctx.chart.data.datasets.flatMap(ds => ds.data);
                    const filteredValues = allValues.filter(v => v !== null);
                    return filteredValues.length === 0 ? 0 : Math.min(...filteredValues) - 5;
                },
                max: ctx => {
                    let allValues = ctx.chart.data.datasets.flatMap(ds => ds.data);
                    const filteredValues = allValues.filter(v => v !== null);
                    return filteredValues.length === 0 ? 10 : Math.max(...filteredValues) + 5;
                }
            }
        }
    };

    // --- Filtrado de productos únicos ---
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


    // ---- Utilidades ----
    const normalize = (s = '') =>
        s.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const matchesTerm = (term, ...fields) => {
        const nt = normalize(term);
        return fields.some(f => normalize(f).includes(nt));
    };

    // ---- Construye objetos únicos { test, desc } para el producto ----
    const associatedTestObjs = Array.from(
        new Map(
            productOptions
                .filter(p => p && p.IMLITM === selectedProduct && p.TRQTST)
                .map(p => [p.TRQTST, { test: p.TRQTST, desc: p.QADSC1 ?? '' }])
        ).values()
    );

    // ---- Filtra por test o desc ----
    const filteredTests = associatedTestObjs.filter(t =>
        matchesTerm(searchTestTerm, t.test, t.desc)
    );

    // ---- Cantidad Real: mismos objetos, excluyendo el test seleccionado ----
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



    // // --- Filtrado de pruebas asociadas al producto seleccionado ---
    // const associatedTests = productOptions
    //     .filter(p => p && p.IMLITM && p.TRQTST && p.IMLITM === selectedProduct)
    //     .map(p => p.TRQTST);

    // const filteredTests = associatedTests.filter(test => test.toLowerCase().includes(searchTestTerm.toLowerCase()));

    // // --- Filtrado de Cantidad Real opcional ---
    // const cantRealTestOptions = productOptions
    //     .filter(p => p && p.IMLITM && p.TRQTST && p.IMLITM === selectedProduct && p.TRQTST !== selectedTest)
    //     .map(p => p.TRQTST);

    // const filteredCantRealTests = cantRealTestOptions.filter(test => test.toLowerCase().includes(searchCantRealTerm.toLowerCase()));

    // --- Reset de filtros de prueba y Cantidad Real cuando cambia el producto ---
    useEffect(() => {
        setSearchTestTerm('');
        setSelectedTest('');
        setSearchCantRealTerm('');
        setSelectedCantRealTest('');
        setIsCantRealActive(false);
    }, [selectedProduct]);

    // --- Reset de Cantidad Real cuando se desactiva ---
    useEffect(() => {
        if (!isCantRealActive) setSelectedCantRealTest('');
    }, [isCantRealActive]);

    // --- Manejo de selección de producto ---
    const handleProductSelect = (product) => {
        setSelectedProduct(product.IMLITM);
        setSearchTerm(`${product.IMLITM} - ${product.IMDSC1}`);
        if (productListRef.current) productListRef.current.style.display = 'none';
    };


    const handleTestSelect = (test) => {
        setSelectedTest(test);
        const desc = getTestDesc(selectedProduct, test);
        setSearchTestTerm(`${test}${desc ? ` - ${desc}` : ''}`); // muestra las dos variables
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

    // --- Render del componente ---
    return (
        <div className="trend-analisis-container">
            <h1>Análisis de Tendencias</h1>

            {/* FORMULARIOS: Contenedor Flexbox para los 2 paneles (LADO A LADO) */}
            <div className="form-wrapper">

                {/* Panel 1: Filtros de Fecha/UniNeg */}
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

                {/* Panel 2: Selección de Producto y Prueba (Aparece si hay opciones) */}
                {productOptions.length > 0 && (
                    <div className="form-panel">
                        <h3>Selección de Producto</h3>

                        {/* Producto */}
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
                                {filteredProductOptions.map((item, index) => (
                                    <li key={index} onClick={() => handleProductSelect(item)}>
                                        {`${item.IMLITM} - ${item.IMDSC1}`}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Prueba */}
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
                                    {filteredTests.map((item, index) => (
                                        <li key={index} onClick={() => handleTestSelect(item.test)}>
                                            {item.test} - {item.desc}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Cantidad Real opcional */}
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
                                            {filteredCantRealTests.map((item, index) => (
                                                <li key={index} onClick={() => handleCantRealSelect(item.test)}>
                                                    {item.test} - {item.desc}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Botón para generar análisis */}
                        <button className="search-button" onClick={handleFetchTrendData} disabled={loading || !selectedProduct || !selectedTest}>
                            {loading ? 'Cargando Datos...' : 'Generar Análisis'}
                        </button>
                    </div>
                )}
            </div> {/* <--- CIERRE CORRECTO del form-wrapper */}

            {/* Mensajes de estado */}
            {loading && <div className="loading-state">Cargando datos...</div>}
            {error && <div className="error-state">Error: {error}</div>}

            {/* RESULTADOS: Contenedor principal de Resultados (HERMANO del form-wrapper) */}
            {data.length > 0 && (
                <div className="results-container">

                    {/* Encabezado */}
                    <div className="results-header">
                        <h2>Resultados de la Búsqueda</h2>
                        {/* CAMBIO CLAVE: Llama a la nueva función wrapper */}
                        <button className="download-pdf-button" onClick={handleDownloadWithPrompt}>Descargar PDF</button>
                    </div>

                    {/* Tabla de Datos */}
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Número Lote/Serie</th>
                                    <th>Resultado Prueba</th>
                                    <th>Valor Mínimo Permitido</th>
                                    <th>Valor Máximo Permitido</th>
                                    <th>Cantidad Real</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentData.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item['Número Lote/Serie']}</td>
                                        <td>{item['Resultado Prueba']} {item['Unidad Medida']}</td>
                                        <td>{item['Valor Mínimo Permitido']}</td>
                                        <td>{item['Valor Máximo Permitido']}</td>
                                        <td>{item['Cantidad Real']} {item['Unidad Cantidad Real']}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
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

                    {/* GRÁFICO y ANÁLISIS ESTADÍSTICO (LADO A LADO) */}
                    <div className="analysis-summary-wrapper">

                        {/* 1. Panel de Análisis Estadístico */}
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

                        {/* 2. Gráfico */}
                        <div className={`single-chart-container ${isChartExpanded ? 'chart-expanded' : ''}`}>
                            <div className="chart-container">
                                {/* ASIGNACIÓN DE LA FUNCIÓN onClick */}
                                <button
                                    className="expand-chart-btn"
                                    onClick={handleExpandChart} // 👈 Función de clic
                                    aria-label={isChartExpanded ? 'Minimizar gráfico' : 'Expandir gráfico en pantalla completa'}
                                >
                                    {/* CAMBIA EL ICONO O TEXTO BASADO EN EL ESTADO */}
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
