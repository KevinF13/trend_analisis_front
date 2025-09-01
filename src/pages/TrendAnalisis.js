import React, { useState, useRef } from 'react';
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

// Registrar componentes de Chart.js
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

    // Crear referencias para cada uno de los gráficos
    const lineChartRef = useRef(null);
    const barChartRef = useRef(null);
    const scatterChartRef = useRef(null);

    const offset = currentPage * itemsPerPage;
    const currentData = data.slice(offset, offset + itemsPerPage);
    const pageCount = Math.ceil(data.length / itemsPerPage);

    const handlePageClick = (event) => {
        setCurrentPage(event.selected);
    };

    const handleFetchData = async () => {
        setLoading(true);
        setError(null);

        setTimeout(() => {
            const apiResponse = [
                { 'Número Lote/Serie': 'Lote001', 'Resultado Prueba': 15, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 150, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote002', 'Resultado Prueba': 22, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 220, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote003', 'Resultado Prueba': 18, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 180, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote004', 'Resultado Prueba': 28, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 280, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote005', 'Resultado Prueba': 12, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 120, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote006', 'Resultado Prueba': 19, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 190, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote007', 'Resultado Prueba': 25, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 250, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote008', 'Resultado Prueba': 16, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 160, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote009', 'Resultado Prueba': 23, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 230, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote010', 'Resultado Prueba': 17, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 170, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote001', 'Resultado Prueba': 15, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 150, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote002', 'Resultado Prueba': 22, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 220, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote003', 'Resultado Prueba': 18, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 180, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote004', 'Resultado Prueba': 28, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 280, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote005', 'Resultado Prueba': 12, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 120, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote006', 'Resultado Prueba': 19, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 190, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote007', 'Resultado Prueba': 25, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 250, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote008', 'Resultado Prueba': 16, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 160, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote009', 'Resultado Prueba': 23, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 230, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote010', 'Resultado Prueba': 17, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 170, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote001', 'Resultado Prueba': 15, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 150, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote002', 'Resultado Prueba': 22, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 220, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote003', 'Resultado Prueba': 18, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 180, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote004', 'Resultado Prueba': 28, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 280, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote005', 'Resultado Prueba': 12, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 120, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote006', 'Resultado Prueba': 19, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 190, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote007', 'Resultado Prueba': 25, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 250, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote008', 'Resultado Prueba': 16, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 160, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote009', 'Resultado Prueba': 23, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 230, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote010', 'Resultado Prueba': 17, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 170, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote001', 'Resultado Prueba': 15, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 150, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote002', 'Resultado Prueba': 22, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 220, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote003', 'Resultado Prueba': 18, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 180, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote004', 'Resultado Prueba': 28, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 280, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote005', 'Resultado Prueba': 12, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 120, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote006', 'Resultado Prueba': 19, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 190, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote007', 'Resultado Prueba': 25, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 250, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote008', 'Resultado Prueba': 16, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 160, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote009', 'Resultado Prueba': 23, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 230, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote010', 'Resultado Prueba': 17, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 170, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote001', 'Resultado Prueba': 15, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 150, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote002', 'Resultado Prueba': 22, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 220, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote003', 'Resultado Prueba': 18, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 180, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote004', 'Resultado Prueba': 28, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 280, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote005', 'Resultado Prueba': 12, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 120, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote006', 'Resultado Prueba': 19, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 190, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote007', 'Resultado Prueba': 25, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 250, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote008', 'Resultado Prueba': 16, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 160, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote009', 'Resultado Prueba': 23, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 230, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote010', 'Resultado Prueba': 17, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 170, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote001', 'Resultado Prueba': 15, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 150, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote002', 'Resultado Prueba': 22, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 220, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote003', 'Resultado Prueba': 18, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 180, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote004', 'Resultado Prueba': 28, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 280, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote005', 'Resultado Prueba': 12, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 120, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote006', 'Resultado Prueba': 19, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 190, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote007', 'Resultado Prueba': 25, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 250, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote008', 'Resultado Prueba': 16, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 160, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote009', 'Resultado Prueba': 23, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 230, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote010', 'Resultado Prueba': 17, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 170, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote001', 'Resultado Prueba': 15, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 150, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote002', 'Resultado Prueba': 22, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 220, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote003', 'Resultado Prueba': 18, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 180, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote004', 'Resultado Prueba': 28, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 280, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote005', 'Resultado Prueba': 12, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 120, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote006', 'Resultado Prueba': 19, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 190, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote007', 'Resultado Prueba': 25, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 250, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote008', 'Resultado Prueba': 16, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 160, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote009', 'Resultado Prueba': 23, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 230, 'Unidad Medida': 'ml' },
                { 'Número Lote/Serie': 'Lote010', 'Resultado Prueba': 17, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 170, 'Unidad Medida': 'g' },
                { 'Número Lote/Serie': 'Lote001', 'Resultado Prueba': 15, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 150, 'Unidad Medida': 'mg' },
                { 'Número Lote/Serie': 'Lote002', 'Resultado Prueba': 22, 'Valor Mínimo Permitido': 10, 'Valor Máximo Permitido': 30, 'Cantidad Real': 220, 'Unidad Medida': 'ml' },
            ];
            setData(apiResponse);
            setLoading(false);
            setCurrentPage(0);
        }, 1000);
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

            if (isFirstPage) {
                doc.setFontSize(10);
                doc.setFont("times", "bold");
                doc.text(`PRODUCTO:`, 14, 40);
                doc.text(`CODIGO:`, 14, 45);
                doc.text(`PROCESO:`, 14, 50);
                doc.setFont("times", "normal");
                doc.text(`ARADOS HCT TAB 100MG/25MG CAJA X30`, 40, 40);
                doc.text(`FB`, 40, 45);
                doc.text(`TERMINADO`, 40, 50);

                doc.setFont("times", "bold");
                doc.text(`LABORATORIO:`, 110, 40);
                doc.text(`TEST:`, 110, 50);
                doc.setFont("times", "normal");
                doc.text(`PHARMABRAND S.A.`, 145, 40);
                doc.text(`ENSAYO LOSARTÁN POTÁSICO`, 130, 50);
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
            startY: headerHeightFirstPage + 20, // Ajustamos un poco para dejar espacio al título
            margin: { top: headerHeightOtherPages + 10 }, // Para páginas nuevas
            headStyles: { fillColor: '#808080', textColor: '#ffffff', fontStyle: 'bold', halign: 'center', font: 'times' },
            bodyStyles: { fillColor: '#f5f5f5', textColor: '#333333', fontSize: 10, font: 'times' },
            alternateRowStyles: { fillColor: '#ffffff' },
            theme: 'striped',
            styles: { cellPadding: 3, lineWidth: 0.1, lineColor: '#bdc3c7', font: 'times' },
            columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' } },

            didDrawPage: (data) => {
                const isFirstPage = data.pageNumber === 1;
                drawHeader(doc, isFirstPage);

                // Agregamos título "TABLA DE DATOS" solo en la primera página
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
            x: { title: { display: true, text: 'Número Lote/Serie' } },
            y: { title: { display: true, text: 'Valor' }, beginAtZero: true }
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
                    <div className="multi-chart-container" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <div className="chart-container" style={{ flex: '1 1 300px' }}>
                            <Line ref={lineChartRef} data={chartData} options={chartOptions} />
                        </div>
                        <div className="chart-container" style={{ flex: '1 1 300px' }}>
                            <Bar ref={barChartRef} data={barChartData} options={barChartOptions} />
                        </div>
                        <div className="chart-container" style={{ flex: '1 1 300px' }}>
                            <Scatter ref={scatterChartRef} data={scatterChartData} options={scatterChartOptions} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrendAnalisis;
