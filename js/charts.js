/**
 * Charts Module
 * Chart.js kullanarak veri grafiklerini gösterir
 */

class ChartManager {
    constructor() {
        this.charts = {};
        this.chartConfigs = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        };
    }

    /**
     * Tuzluluk zaman serisi grafiği
     */
    createSalinityChart(sensors, selectedSensorId = null) {
        const ctx = document.getElementById('salinityChart')?.getContext('2d');
        if (!ctx) return;

        // Desteklenmesi gereken sensörler
        const sensorsToPlot = selectedSensorId 
            ? sensors.filter(s => s.id === selectedSensorId)
            : sensors.slice(0, 3); // İlk 3 sensör

        const datasets = sensorsToPlot.map((sensor, index) => {
            const color = this.getColorForIndex(index);
            const dataPoints = sensor.dataPoints || [];
            
            return {
                label: sensor.name,
                data: dataPoints.map(dp => dp.tds),
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            };
        });

        const labels = sensorsToPlot[0]?.dataPoints?.map(dp => dp.timestamp) || [];

        if (this.charts.salinity) {
            this.charts.salinity.destroy();
        }

        this.charts.salinity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                ...this.chartConfigs,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'TDS (ppm)'
                        }
                    }
                },
                plugins: {
                    ...this.chartConfigs.plugins,
                    title: {
                        display: true,
                        text: 'Tuzluluk Zaman Serileri'
                    }
                }
            }
        });
    }

    /**
     * Risk dağılımı pasta grafiği
     */
    createRiskChart(sensors) {
        const ctx = document.getElementById('riskChart')?.getContext('2d');
        if (!ctx) return;

        const riskCounts = {
            low: sensors.filter(s => s.riskLevel === 'low').length,
            medium: sensors.filter(s => s.riskLevel === 'medium').length,
            high: sensors.filter(s => s.riskLevel === 'high').length
        };

        if (this.charts.risk) {
            this.charts.risk.destroy();
        }

        this.charts.risk = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Düşük', 'Orta', 'Yüksek'],
                datasets: [{
                    data: [riskCounts.low, riskCounts.medium, riskCounts.high],
                    backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
                    borderColor: ['#fff', '#fff', '#fff'],
                    borderWidth: 2
                }]
            },
            options: {
                ...this.chartConfigs,
                plugins: {
                    ...this.chartConfigs.plugins,
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Sensör özet grafiği (çubuk)
     */
    createSummaryChart(sensors) {
        const ctx = document.getElementById('summaryChart')?.getContext('2d');
        if (!ctx) return;

        // İlk 5 sensörü göster
        const sensorsToShow = sensors.slice(0, 5);
        const labels = sensorsToShow.map(s => s.id);
        const tdsData = sensorsToShow.map(s => s.tds);
        const tempData = sensorsToShow.map(s => s.temperature * 50); // Ölçeği ayarla

        if (this.charts.summary) {
            this.charts.summary.destroy();
        }

        this.charts.summary = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'TDS (ppm)',
                        data: tdsData,
                        backgroundColor: '#1e88e5',
                        borderColor: '#1565c0',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Sıcaklık (°C × 50)',
                        data: tempData,
                        backgroundColor: '#ff9800',
                        borderColor: '#f57c00',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                ...this.chartConfigs,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'TDS (ppm)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Sıcaklık'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                plugins: {
                    ...this.chartConfigs.plugins,
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    }

    /**
     * Grafiklerini güncelle
     */
    updateCharts(sensors, selectedSensorId = null) {
        this.createSalinityChart(sensors, selectedSensorId);
        this.createRiskChart(sensors);
        this.createSummaryChart(sensors);
    }

    /**
     * Index'e göre renk ver
     */
    getColorForIndex(index) {
        const colors = [
            '#1e88e5',
            '#f44336',
            '#4caf50',
            '#ff9800',
            '#9c27b0',
            '#00bcd4',
            '#e91e63'
        ];
        return colors[index % colors.length];
    }

    /**
     * Grafikleri sil
     */
    destroyAllCharts() {
        Object.keys(this.charts).forEach(key => {
            if (this.charts[key]) {
                this.charts[key].destroy();
            }
        });
        this.charts = {};
    }
}

// Global instance
const chartManager = new ChartManager();
