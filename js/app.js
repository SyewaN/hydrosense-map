/**
 * HydroSense Monitor - Main Application
 * Demo version with minimal functionality
 */

class App {
    constructor() {
        this.sensors = [];
        this.filteredSensors = [];
        this.activeRisks = ['low', 'medium', 'high'];
        this.selectedSensor = null;
        this.init();
    }

    async init() {
        console.log('🚀 Initializing HydroSense Monitor...');
        
        // Load data
        await dataLoader.loadFromGeoJSON('data/sensors.geojson');
        this.sensors = dataLoader.getAllSensors();
        
        // Initialize map
        mapRenderer = new MapRenderer('map', this.sensors);
        
        // Setup controls
        this.setupControls();
        
        // Initial render
        this.updateStats();
        this.render();
        
        // Update timestamp
        this.updateTimestamp();
        
        console.log(`✓ Loaded ${this.sensors.length} sensors`);
    }

    setupControls() {
        // Theme toggle
        const themeBtn = document.getElementById('themeToggle');
        themeBtn.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            themeBtn.textContent = isLight ? '☀️ Açık' : '🌙 Koyu';
        });

        // Risk filters
        document.querySelectorAll('input[data-risk]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.onRiskFilterChange());
        });

        // Sensor select
        document.getElementById('sensorSelect').addEventListener('change', (e) => {
            this.selectedSensor = e.target.value || null;
            mapRenderer.highlightSensor(this.selectedSensor);
        });

        // Load saved theme
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.add('light-theme');
            document.getElementById('themeToggle').textContent = '☀️ Açık';
        }
    }

    onRiskFilterChange() {
        this.activeRisks = [];
        document.querySelectorAll('input[data-risk]:checked').forEach(checkbox => {
            this.activeRisks.push(checkbox.dataset.risk);
        });
        this.render();
    }

    render() {
        // Filter sensors
        this.filteredSensors = this.sensors.filter(s => this.activeRisks.includes(s.riskLevel));
        
        // Update map
        mapRenderer.filterByRisk(this.filteredSensors);
        
        // Update sensor list
        this.updateSensorSelect();
        
        // Update stats
        this.updateStats();
    }

    updateSensorSelect() {
        const select = document.getElementById('sensorSelect');
        const options = select.querySelectorAll('option');
        
        // Remove old options (keep first)
        for (let i = options.length - 1; i > 0; i--) {
            options[i].remove();
        }
        
        // Add sensors
        this.filteredSensors.forEach(sensor => {
            const option = document.createElement('option');
            option.value = sensor.id;
            option.textContent = `${sensor.name} (${sensor.tds.toFixed(0)} ppm)`;
            select.appendChild(option);
        });
    }

    updateStats() {
        const count = this.filteredSensors.length;
        const avgTds = count > 0 
            ? (this.filteredSensors.reduce((sum, s) => sum + s.tds, 0) / count).toFixed(0)
            : '-';
        
        document.getElementById('sensorCount').textContent = count;
        document.getElementById('avgTds').textContent = avgTds;
    }

    updateTimestamp() {
        const now = new Date();
        const time = now.toLocaleString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('lastUpdate').textContent = time;
    }
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
