// Verifica se é um dispositivo móvel
function isMobile() {
    return window.innerWidth <= 768;
}

// Função para criar o gráfico mobile
function createMobileChart(canvasId, xLabels, yValues) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Destruir gráfico existente se houver
    if (window.mobileChartInstance) {
        window.mobileChartInstance.destroy();
    }

    // Limpar o canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Gradiente para a linha
    const gradientLine = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
    gradientLine.addColorStop(0, 'rgba(0, 122, 255, 1)');
    gradientLine.addColorStop(1, 'rgba(0, 180, 216, 1)');

    // Calcular os índices do primeiro ponto de cada ano
    const primeirosAnos = {};
    xLabels.forEach((label, i) => {
        if (typeof label === 'string' && label.includes('/')) {
            const [,, year] = label.split('/');
            if (!(year in primeirosAnos)) {
                primeirosAnos[year] = i;
            }
        }
    });

    const chartData = {
        labels: xLabels,
        datasets: [{
            label: 'Momento de Mercado',
            data: yValues,
            fill: false,
            borderColor: gradientLine,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.35,
            spanGaps: true
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 800,
            easing: 'easeOutQuart'
        },
        scales: {
            y: {
                beginAtZero: false,
                min: 0,
                max: 100,
                grid: { 
                    display: true,
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawBorder: false 
                },
                ticks: { 
                    color: '#666', 
                    font: { family: 'Poppins', size: 10 },
                    maxTicksLimit: 5
                }
            },
            x: {
                grid: { 
                    display: true,
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawBorder: false 
                },
                ticks: {
                    color: '#666',
                    font: { family: 'Poppins', size: 12 },
                    maxTicksLimit: 10,
                    autoSkip: false,
                    callback: function(value, index, values) {
                        // Mostrar apenas o ano, uma vez por ano
                        try {
                            const label = this.getLabelForValue(value);
                            if (typeof label === 'string' && label.includes('/')) {
                                const [,, year] = label.split('/');
                                if (primeirosAnos[year] === index) {
                                    return year;
                                }
                            }
                            return '';
                        } catch (error) {
                            return '';
                        }
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: 'rgba(33, 150, 243, 0.8)',
                borderWidth: 1,
                titleColor: '#333',
                bodyColor: '#666',
                bodyFont: { family: 'Poppins', size: 11 },
                padding: 8,
                cornerRadius: 6,
                displayColors: false,
                callbacks: {
                    title: function(tooltipItems) {
                        const label = tooltipItems[0].label;
                        if (typeof label === 'string' && label.includes('/')) {
                            const [day, month, year] = label.split('/');
                            const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                            return `${day} de ${meses[parseInt(month) - 1]} de ${year}`;
                        }
                        return label;
                    }
                }
            }
        }
    };

    // Criar o gráfico
    window.mobileChartInstance = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: options,
        plugins: [{
            id: 'backgroundZones',
            beforeDraw: function(chart) {
                if (!chart.chartArea) return;
                const { ctx, chartArea, scales } = chart;
                const { top, bottom, left, right } = chartArea;
                
                // Verificar o período selecionado
                const periodSelect = document.getElementById('periodSelectMobile');
                const periodValue = periodSelect ? periodSelect.value : '21';
                
                // Definir limites baseado no período
                let greenLimit = 20;
                let redLimit = 80;
                if (periodValue === '21') {
                    greenLimit = 15;
                    redLimit = 85;
                }
                
                // Calcular posição dos valores no eixo Y
                const y0 = scales.y.getPixelForValue(0);
                const yGreen = scales.y.getPixelForValue(greenLimit);
                const yRed = scales.y.getPixelForValue(redLimit);
                const y100 = scales.y.getPixelForValue(100);
                
                // Desenhar zona verde (0-greenLimit)
                ctx.fillStyle = 'rgba(75, 192, 75, 0.15)';
                ctx.fillRect(left, yGreen, right - left, y0 - yGreen);
                ctx.strokeStyle = 'rgba(75, 192, 75, 0.6)';
                ctx.lineWidth = 1;
                ctx.strokeRect(left, yGreen, right - left, y0 - yGreen);
                
                // Desenhar zona vermelha (redLimit-100)
                ctx.fillStyle = 'rgba(255, 99, 132, 0.15)';
                ctx.fillRect(left, y100, right - left, yRed - y100);
                ctx.strokeStyle = 'rgba(255, 99, 132, 0.6)';
                ctx.lineWidth = 1;
                ctx.strokeRect(left, y100, right - left, yRed - y100);
                
                // Linhas de demarcação
                ctx.strokeStyle = 'rgba(75, 192, 75, 0.6)';
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(left, yGreen);
                ctx.lineTo(right, yGreen);
                ctx.stroke();
                
                ctx.strokeStyle = 'rgba(255, 99, 132, 0.6)';
                ctx.beginPath();
                ctx.moveTo(left, yRed);
                ctx.lineTo(right, yRed);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }]
    });
}

// Função para atualizar o gráfico mobile
function updateMobileChart(csvData, periodColName) {
    if (!csvData || !periodColName) return;

    const yValues = [];
    const xLabels = [];
    
    // Aplicar filtro de data se a função existir (definida no HTML principal)
    let dataToUse = csvData;
    if (typeof filterDataByDate === 'function' && typeof currentFilter !== 'undefined') {
        dataToUse = filterDataByDate(csvData, currentFilter, customStartDate, customEndDate);
        console.log('Mobile: Dados filtrados:', dataToUse.length, 'de', csvData.length);
    } else {
        // Se não houver filtro, pegar os últimos 365 dias como padrão
        dataToUse = csvData.slice(-365);
        console.log('Mobile: Usando últimos 365 dias:', dataToUse.length, 'registros');
    }
    
    // Validar se há dados suficientes
    if (dataToUse.length === 0) {
        console.warn('Mobile: Nenhum dado disponível para o período selecionado, usando todos os dados');
        dataToUse = csvData;
    }
    
    dataToUse.forEach((row) => {
        const yVal = row[periodColName];
        const dateVal = row['Date'] || row['date'] || row['DATA'] || row['data'];
        if (yVal !== undefined && yVal !== null && yVal !== "" && !isNaN(parseFloat(yVal))) {
            yValues.push(parseFloat(yVal));
            let formattedDate = dateVal;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
                const [yyyy, mm, dd] = dateVal.split('-');
                formattedDate = `${dd}/${mm}/${yyyy}`;
            } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateVal)) {
                const [mm, dd, yyyy] = dateVal.split('/');
                formattedDate = `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`;
            }
            xLabels.push(formattedDate);
        }
    });

    createMobileChart('chartPeriodPreviewMobile', xLabels, yValues);
}

// Função para inicializar o gráfico mobile
function initMobileChart() {
    if (!isMobile()) return;

    const periodSelect = document.getElementById('periodSelectMobile');
    if (!periodSelect) return;

    // Carregar dados do CSV
    Papa.parse('data/market-tracker.csv', {
        download: true,
        header: true,
        complete: function(results) {
            const csvData = results.data;
            
            // Atualizar gráfico quando o período mudar
            periodSelect.addEventListener('change', function() {
                updateMobileChart(csvData, this.value);
            });
            
            // Sincronizar com filtros de data se existirem
            if (typeof initializeFilterListeners === 'function') {
                // Usar setTimeout para garantir que os elementos existam
                setTimeout(() => {
                    const mobileFilterBtns = document.querySelectorAll('.filter-btn-mobile');
                    mobileFilterBtns.forEach(btn => {
                        btn.addEventListener('click', function() {
                            // Aguardar um pouco para que a variável currentFilter seja atualizada
                            setTimeout(() => {
                                updateMobileChart(csvData, periodSelect.value);
                            }, 10);
                        });
                    });
                }, 100);
            }

            // Atualizar gráfico inicial
            updateMobileChart(csvData, periodSelect.value);
        },
        error: function(err) {
            console.error('Erro ao carregar CSV para mobile:', err);
        }
    });
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    if (isMobile()) {
        initMobileChart();
    }
});

// Atualizar quando a janela for redimensionada
window.addEventListener('resize', function() {
    if (isMobile()) {
        initMobileChart();
    }
}); 