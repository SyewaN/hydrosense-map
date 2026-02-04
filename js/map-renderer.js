/**
 * Map Renderer Module
 * Leaflet.js kullanarak harita ve sensör noktalarını gösterir
 */

class MapRenderer {
    constructor(mapElementId = 'map') {
        this.mapElement = document.getElementById(mapElementId);
        this.map = null;
        this.markers = new Map(); // sensor ID -> marker
        this.heatmapLayer = null;
        this.init();
    }

    /**
     * Haritayı başlat
     */
    init() {
        // Türkiye merkez koordinatları
        const center = [39.0, 35.0];
        const zoom = 7;

        this.map = L.map(this.mapElement).setView(center, zoom);

        // OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            maxNativeZoom: 18
        }).addTo(this.map);

        // Basemap seçenekleri (opsiyonel)
        this.setupBasemapLayers();
    }

    /**
     * Basemap seçenekleri ekle
     */
    setupBasemapLayers() {
        const basemaps = {
            'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }),
            'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '© Esri'
            }),
            'Terrain': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenTopoMap'
            })
        };

        // Basemap control ekleme (opsiyonel olarak aktif edilebilir)
        // L.control.layers(basemaps).addTo(this.map);
    }

    /**
     * Sensör markerları göster
     */
    renderSensors(sensors) {
        // Önceki markerları temizle
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers.clear();

        // Yeni markerları ekle
        sensors.forEach(sensor => {
            this.addSensorMarker(sensor);
        });

        // Haritayı sensörlere uydur
        if (sensors.length > 0) {
            this.fitToSensors(sensors);
        }
    }

    /**
     * Tek bir sensör markeri ekle
     */
    addSensorMarker(sensor) {
        const color = this.getRiskColor(sensor.riskLevel);
        
        // Custom icon
        const icon = L.icon({
            iconUrl: this.createIconSVG(color),
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });

        const marker = L.marker([sensor.lat, sensor.lon], { icon })
            .bindPopup(this.createPopupHTML(sensor))
            .bindTooltip(sensor.name, { permanent: false, offset: [0, 0] })
            .addTo(this.map);

        this.markers.set(sensor.id, marker);

        // Marker tıklama olayı
        marker.on('click', () => {
            this.onSensorSelected(sensor);
        });
    }

    /**
     * Popup HTML'i oluştur
     */
    createPopupHTML(sensor) {
        const risk = sensor.riskScore || sensor.riskLevel;
        const explanation = sensor.riskExplanation || '';
        
        return `
            <div class="sensor-popup">
                <h4>${sensor.name}</h4>
                <p><strong>ID:</strong> ${sensor.id}</p>
                <p><strong>TDS:</strong> ${sensor.tds.toFixed(1)} ppm</p>
                <p><strong>Sıcaklık:</strong> ${sensor.temperature.toFixed(1)}°C</p>
                <p><strong>Risk Seviyesi:</strong> <span class="risk-${sensor.riskLevel}">${sensor.riskLevel.toUpperCase()}</span></p>
                ${explanation ? `<p><small>${explanation}</small></p>` : ''}
                <p><small>${new Date(sensor.timestamp).toLocaleString('tr-TR')}</small></p>
            </div>
        `;
    }

    /**
     * SVG icon oluştur
     */
    createIconSVG(color) {
        const svg = `
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
                <circle cx="16" cy="16" r="5" fill="white" opacity="0.7"/>
            </svg>
        `;
        return 'data:image/svg+xml;base64,' + btoa(svg);
    }

    /**
     * Risk seviyesine göre renk ver
     */
    getRiskColor(riskLevel) {
        const colors = {
            'low': '#4caf50',    // Yeşil
            'medium': '#ff9800',  // Turuncu
            'high': '#f44336'     // Kırmızı
        };
        return colors[riskLevel] || '#9e9e9e'; // Gri (bilinmeyen)
    }

    /**
     * Haritayı sensörlere uydur
     */
    fitToSensors(sensors) {
        const group = new L.featureGroup(Array.from(this.markers.values()));
        this.map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }

    /**
     * Sensörleri filtrele (risk seviyesine göre)
     */
    filterByRisk(sensors, riskLevels) {
        this.markers.forEach((marker, sensorId) => {
            const sensor = sensors.find(s => s.id === sensorId);
            if (sensor && riskLevels.includes(sensor.riskLevel)) {
                marker.setOpacity(1);
            } else {
                marker.setOpacity(0.3);
            }
        });
    }

    /**
     * Belirli bir sensörü vurgula
     */
    highlightSensor(sensorId) {
        this.markers.forEach((marker, id) => {
            if (id === sensorId) {
                marker.setOpacity(1);
                marker.openPopup();
            } else {
                marker.setOpacity(0.5);
            }
        });
    }

    /**
     * Sensör seçildiğinde callback
     */
    onSensorSelected(sensor) {
        // Bu metod dış sınıf tarafından override edilebilir
        console.log('Sensör seçildi:', sensor);
    }

    /**
     * Isı haritası ekle (opsiyonel, gelecek için)
     */
    addHeatmapLayer(sensors) {
        const heatData = sensors.map(s => [
            s.lat,
            s.lon,
            (s.tds / 4000) // TDS'yi 0-1 aralığına normalize et
        ]);

        if (this.heatmapLayer) {
            this.map.removeLayer(this.heatmapLayer);
        }

        // Heatmap plugin gerekir: https://leaflet.github.io/Leaflet.heat/
        if (typeof L.heatLayer !== 'undefined') {
            this.heatmapLayer = L.heatLayer(heatData, {
                radius: 40,
                blur: 25,
                maxZoom: 17,
                gradient: {
                    0.0: '#4caf50',
                    0.5: '#ff9800',
                    1.0: '#f44336'
                }
            }).addTo(this.map);
        }
    }

    /**
     * Harita yenile
     */
    invalidateSize() {
        setTimeout(() => {
            this.map.invalidateSize();
        }, 250);
    }
}

// Global instance
let mapRenderer = null;
