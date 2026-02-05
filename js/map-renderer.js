/**
 * Map Renderer - Leaflet integration
 */

class MapRenderer {
    constructor(elementId, sensors) {
        this.sensors = sensors;
        this.markers = new Map();
        this.visibleMarkers = [];
        this.initMap(elementId);
    }

    initMap(elementId) {
        // Center on Turkey
        const center = [39.0, 35.0];
        this.map = L.map(elementId, { 
            zoomControl: true,
            attributionControl: true 
        }).setView(center, 7);

        // Add basemap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);

        // Render sensors
        this.renderSensors(this.sensors);
        
        // Invalidate size when first shown
        setTimeout(() => {
            if (this.map) {
                this.map.invalidateSize();
            }
        }, 100);
    }

    renderSensors(sensors) {
        // Clear existing
        this.markers.forEach(m => this.map.removeLayer(m));
        this.markers.clear();
        this.visibleMarkers = [];

        // Add new
        sensors.forEach(sensor => {
            this.addMarker(sensor);
        });

        // Fit bounds
        if (this.visibleMarkers.length > 0) {
            this.map.fitBounds(
                L.featureGroup(this.visibleMarkers).getBounds(),
                { padding: [50, 50] }
            );
        }
    }

    addMarker(sensor) {
        const color = this.getRiskColor(sensor.riskLevel);
        
        const marker = L.circleMarker([sensor.lat, sensor.lon], {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        });

        marker.bindPopup(this.createPopup(sensor));
        marker.bindTooltip(sensor.name, { sticky: false });
        marker.addTo(this.map);

        this.markers.set(sensor.id, marker);
        this.visibleMarkers.push(marker);
    }

    createPopup(sensor) {
        const last = (sensor.dataPoints && sensor.dataPoints.length)
            ? sensor.dataPoints[sensor.dataPoints.length - 1]
            : { tds: sensor.tds, timestamp: sensor.timestamp };
        // prepare small trend (last 7 values)
        const trend = (sensor.dataPoints || []).slice(-7).map(dp => dp.tds);

        // simple rule-based comment
        let comment = 'Veri yetersiz.';
        if (trend.length >= 3) {
            const recent = trend;
            const avgPrev = recent.slice(0, -1).reduce((a,b)=>a+b,0)/(recent.length-1 || 1);
            const lastVal = recent[recent.length-1];
            const pctChange = ((lastVal - avgPrev) / (avgPrev || 1)) * 100;
            if (pctChange > 8 && lastVal > 1500) {
                comment = 'TDS artışı ve yüksek seviye gözleniyor; izlenmesi önerilir.';
            } else if (pctChange > 8) {
                comment = 'TDS artış eğilimi var; kısa vadede takip önerilir.';
            } else if (pctChange < -8) {
                comment = 'TDS düşüş eğilimi var; olumlu yön.';
            } else {
                comment = 'TDS genel olarak stabil.';
            }
        }

        const riskClass = (sensor.riskLevel || 'unknown').toUpperCase();
        const riskSymbol = { 'LOW': '🟢', 'MEDIUM': '🟡', 'HIGH': '🔴' }[riskClass] || '';

        // build sparkline bars (simple inline bars) normalized to last range
        let sparkHtml = '';
        if (trend.length) {
            const max = Math.max(...trend);
            const min = Math.min(...trend);
            const range = Math.max(1, max - min);
            sparkHtml = '<div class="popup-sparkline">';
            trend.forEach(v => {
                const h = Math.round(((v - min) / range) * 40) + 6; // px height
                sparkHtml += `<span class="spark-bar" style="height:${h}px" title="${v} ppm"></span>`;
            });
            sparkHtml += `</div><div class="popup-spark-label">Son: ${last.tds} ppm (${last.timestamp || ''})</div>`;
        }

        // risk badge color
        const badgeColor = {
            'LOW': 'var(--color-risk-low)',
            'MEDIUM': 'var(--color-risk-medium)',
            'HIGH': 'var(--color-risk-high)'
        }[riskClass] || 'var(--color-accent)';

        return `
            <div class="popup-card">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                    <div class="popup-title">${sensor.name}</div>
                    <div class="risk-badge" style="background:${badgeColor}">${riskSymbol}</div>
                </div>
                <div class="popup-body">
                    ${sparkHtml}
                    <div class="popup-comment"><strong>Kısa Yorum:</strong> ${comment}</div>
                    <div class="popup-risk"><strong>Risk:</strong> ${riskClass}</div>
                </div>
            </div>
        `;
    }

    getRiskColor(riskLevel) {
        const colors = {
            'low': '#a3be8c',     // Nord 14 - Green
            'medium': '#d08770',  // Nord 12 - Orange
            'high': '#bf616a'     // Nord 11 - Red
        };
        return colors[riskLevel] || '#81a1c1';
    }

    filterByRisk(sensors) {
        this.markers.forEach((marker, sensorId) => {
            const hasSensor = sensors.some(s => s.id === sensorId);
            if (hasSensor) {
                marker.setStyle({ opacity: 1, fillOpacity: 0.9 });
            } else {
                marker.setStyle({ opacity: 0.3, fillOpacity: 0.3 });
            }
        });
    }

    highlightSensor(sensorId) {
        this.markers.forEach((marker, id) => {
            if (id === sensorId) {
                marker.setStyle({ radius: 10, weight: 3 });
                marker.openPopup();
            } else {
                marker.setStyle({ radius: 8, weight: 2 });
            }
        });
    }

    toggleMarkers(visible) {
        this.markers.forEach((marker) => {
            if (visible) {
                marker.setStyle({ opacity: 1, fillOpacity: 0.9 });
            } else {
                marker.setStyle({ opacity: 0.2, fillOpacity: 0.1 });
            }
        });
    }

    toggleSatelliteView(useSatellite) {
        // Remove existing layer
        this.map.eachLayer(layer => {
            if (layer instanceof L.TileLayer) {
                this.map.removeLayer(layer);
            }
        });
        
        // Add appropriate layer
        let tileUrl, attribution;
        
        if (useSatellite) {
            // Esri World Imagery
            tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
            attribution = '© Esri';
        } else {
            // Standard OpenStreetMap
            tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            attribution = '© OpenStreetMap contributors';
        }
        
        L.tileLayer(tileUrl, {
            attribution: attribution,
            maxZoom: 18
        }).addTo(this.map);
    }

    setMapType(type) {
        // Remove existing layer
        this.map.eachLayer(layer => {
            if (layer instanceof L.TileLayer) {
                this.map.removeLayer(layer);
            }
        });
        
        let tileUrl, attribution;
        
        switch(type) {
            case 'satellite':
                // Esri World Imagery
                tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
                attribution = '© Esri';
                break;
            case 'nasa-water':
                // Placeholder - NASA layer will be added manually
                tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                attribution = '© OpenStreetMap contributors | NASA layer bekleniyor...';
                break;
            case 'normal':
            default:
                // Standard OpenStreetMap
                tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                attribution = '© OpenStreetMap contributors';
        }
        
        L.tileLayer(tileUrl, {
            attribution: attribution,
            maxZoom: 18
        }).addTo(this.map);
    }
}


