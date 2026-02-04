/**
 * Data Loader - GeoJSON and sensor data
 */

class DataLoader {
    constructor() {
        this.sensors = [];
    }

    async loadFromGeoJSON(filepath) {
        try {
            const response = await fetch(filepath);
            const geojson = await response.json();
            this.parseSensors(geojson);
            return this.sensors;
        } catch (error) {
            console.warn('Could not load GeoJSON, using sample data');
            this.loadSampleData();
            return this.sensors;
        }
    }

    parseSensors(geojson) {
        this.sensors = geojson.features.map(feature => {
            const props = feature.properties;
            const [lon, lat] = feature.geometry.coordinates;

            return {
                id: props.sensor_id || props.id,
                name: props.name || `Sensor ${props.sensor_id}`,
                lat: lat,
                lon: lon,
                tds: props.tds || 0,
                temperature: props.temperature || 0,
                riskLevel: this.calculateRisk(props.tds || 0),
                timestamp: props.timestamp || new Date().toISOString()
            };
        });
    }

    calculateRisk(tds) {
        if (tds < 1500) return 'low';
        if (tds < 3000) return 'medium';
        return 'high';
    }

    loadSampleData() {
        this.sensors = [
            {
                id: 'S001',
                name: 'Çankırı Merkez',
                lat: 40.6043,
                lon: 33.6190,
                tds: 2100,
                temperature: 12.5,
                riskLevel: 'medium',
                timestamp: new Date().toISOString()
            },
            {
                id: 'S002',
                name: 'Saraycık',
                lat: 40.5500,
                lon: 33.6800,
                tds: 3200,
                temperature: 11.8,
                riskLevel: 'high',
                timestamp: new Date().toISOString()
            },
            {
                id: 'S003',
                name: 'Keskin',
                lat: 40.4800,
                lon: 33.8200,
                tds: 1200,
                temperature: 13.2,
                riskLevel: 'low',
                timestamp: new Date().toISOString()
            },
            {
                id: 'S004',
                name: 'Orta Alan',
                lat: 40.5500,
                lon: 33.7500,
                tds: 1800,
                temperature: 12.0,
                riskLevel: 'medium',
                timestamp: new Date().toISOString()
            },
            {
                id: 'S005',
                name: 'Kuzey Bölge',
                lat: 40.7200,
                lon: 33.5500,
                tds: 2800,
                temperature: 11.2,
                riskLevel: 'medium',
                timestamp: new Date().toISOString()
            }
        ];
    }

    getAllSensors() {
        return [...this.sensors];
    }

    getSensor(id) {
        return this.sensors.find(s => s.id === id);
    }
}

const dataLoader = new DataLoader();
