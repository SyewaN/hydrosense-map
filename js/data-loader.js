/**
 * Data Loader Module
 * Sensör verilerini GeoJSON formatında yükler ve yönetir
 */

class DataLoader {
    constructor() {
        this.sensors = [];
        this.timeSeriesData = {};
        this.lastLoadTime = null;
    }

    /**
     * GeoJSON dosyasından verileri yükle
     */
    async loadFromGeoJSON(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const geojson = await response.json();
            this.parseGeoJSON(geojson);
            this.lastLoadTime = new Date();
            console.log(`✓ ${this.sensors.length} sensör yüklendi`);
            return this.sensors;
        } catch (error) {
            console.error('GeoJSON yükleme hatası:', error);
            // Hata durumunda örnek veri kullan
            this.loadSampleData();
            return this.sensors;
        }
    }

    /**
     * GeoJSON'ı parse et ve sensor array'i oluştur
     */
    parseGeoJSON(geojson) {
        if (geojson.type !== 'FeatureCollection') {
            console.error('Geçersiz GeoJSON format');
            return;
        }

        this.sensors = geojson.features.map(feature => {
            const props = feature.properties;
            const [lon, lat] = feature.geometry.coordinates;

            return {
                id: props.sensor_id,
                name: props.name || `Sensör ${props.sensor_id}`,
                lat: lat,
                lon: lon,
                tds: props.tds || 0,
                salinity: props.salinity || 0,
                temperature: props.temperature || 0,
                timestamp: props.timestamp || new Date().toISOString(),
                riskLevel: props.risk_level || 'unknown',
                dataPoints: props.data_points || [] // Zaman serisi için
            };
        });
    }

    /**
     * Örnek veri (test amaçlı)
     */
    loadSampleData() {
        console.log('⚠ Örnek veri kullanılıyor...');
        
        this.sensors = [
            {
                id: 'S001',
                name: 'Sensör - Çankırı Merkez',
                lat: 40.6043,
                lon: 33.6190,
                tds: 2100,
                salinity: 1.34,
                temperature: 12.5,
                timestamp: new Date().toISOString(),
                riskLevel: 'medium',
                dataPoints: this.generateTimeSeries(2100, 50)
            },
            {
                id: 'S002',
                name: 'Sensör - Saraycık',
                lat: 40.5500,
                lon: 33.6800,
                tds: 3200,
                salinity: 2.05,
                temperature: 11.8,
                timestamp: new Date().toISOString(),
                riskLevel: 'high',
                dataPoints: this.generateTimeSeries(3200, 120)
            },
            {
                id: 'S003',
                name: 'Sensör - Keskin',
                lat: 40.4800,
                lon: 33.8200,
                tds: 1200,
                salinity: 0.77,
                temperature: 13.2,
                timestamp: new Date().toISOString(),
                riskLevel: 'low',
                dataPoints: this.generateTimeSeries(1200, 30)
            },
            {
                id: 'S004',
                name: 'Sensör - Orta Alan',
                lat: 40.5500,
                lon: 33.7500,
                tds: 1800,
                salinity: 1.15,
                temperature: 12.0,
                timestamp: new Date().toISOString(),
                riskLevel: 'medium',
                dataPoints: this.generateTimeSeries(1800, 45)
            }
        ];
    }

    /**
     * Sensör için simüle edilmiş zaman serisi veri oluştur
     */
    generateTimeSeries(baseTds, variance, points = 30) {
        const data = [];
        const now = new Date();
        
        for (let i = points - 1; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)); // Günlük veri
            const noise = (Math.random() - 0.5) * variance;
            const tds = Math.max(baseTds + noise, 100);
            
            data.push({
                timestamp: timestamp.toISOString().split('T')[0],
                tds: parseFloat(tds.toFixed(2)),
                temperature: 12 + Math.random() * 2
            });
        }
        
        return data;
    }

    /**
     * Tüm sensör verilerini GeoJSON olarak dönür
     */
    toGeoJSON() {
        return {
            type: 'FeatureCollection',
            features: this.sensors.map(sensor => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [sensor.lon, sensor.lat]
                },
                properties: {
                    sensor_id: sensor.id,
                    name: sensor.name,
                    tds: sensor.tds,
                    salinity: sensor.salinity,
                    temperature: sensor.temperature,
                    timestamp: sensor.timestamp,
                    risk_level: sensor.riskLevel,
                    data_points: sensor.dataPoints
                }
            }))
        };
    }

    /**
     * Belirli bir sensörün verilerini getir
     */
    getSensor(sensorId) {
        return this.sensors.find(s => s.id === sensorId);
    }

    /**
     * Tüm sensörleri getir
     */
    getAllSensors() {
        return [...this.sensors];
    }

    /**
     * Veri istatistiklerini hesapla
     */
    getStatistics() {
        if (this.sensors.length === 0) return null;

        const tdsValues = this.sensors.map(s => s.tds);
        const tempValues = this.sensors.map(s => s.temperature);

        return {
            totalSensors: this.sensors.length,
            avgTds: (tdsValues.reduce((a, b) => a + b) / tdsValues.length).toFixed(2),
            maxTds: Math.max(...tdsValues),
            minTds: Math.min(...tdsValues),
            avgTemperature: (tempValues.reduce((a, b) => a + b) / tempValues.length).toFixed(2),
            maxTemperature: Math.max(...tempValues),
            minTemperature: Math.min(...tempValues),
            highRiskCount: this.sensors.filter(s => s.riskLevel === 'high').length,
            mediumRiskCount: this.sensors.filter(s => s.riskLevel === 'medium').length,
            lowRiskCount: this.sensors.filter(s => s.riskLevel === 'low').length
        };
    }
}

// Global instance
const dataLoader = new DataLoader();
