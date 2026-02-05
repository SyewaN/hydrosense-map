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

            const baseTds = props.tds || 0;
            const dataPoints = props.data_points && props.data_points.length > 0
                ? props.data_points
                : this.generateTimeSeries(baseTds, 14);

            return {
                id: props.sensor_id || props.id,
                name: props.name || `Sensor ${props.sensor_id}`,
                lat: lat,
                lon: lon,
                tds: dataPoints.length ? dataPoints[dataPoints.length - 1].tds : (props.tds || 0),
                temperature: props.temperature || 0,
                riskLevel: this.calculateRisk(dataPoints.length ? dataPoints[dataPoints.length - 1].tds : (props.tds || 0)),
                timestamp: props.timestamp || new Date().toISOString(),
                dataPoints: dataPoints
            };
        });
    }

    calculateRisk(tds) {
        if (tds < 1500) return 'low';
        if (tds < 3000) return 'medium';
        return 'high';
    }

    loadSampleData() {
        // Build a tighter demo cluster: 3 field sensors very close together (Karapınar area)
        this.sensors = [
            ...[{
                id: 'S001', name: 'Karapınar - Tarla 1', lat: 37.6000, lon: 33.2000, base: 2200
            }, {
                id: 'S002', name: 'Karapınar - Tarla 2', lat: 37.6006, lon: 33.2008, base: 2300
            }, {
                id: 'S003', name: 'Karapınar - Tarla 3', lat: 37.5994, lon: 33.1992, base: 2100
            }].map(s => {
                const dataPoints = this.generateTimeSeries(s.base, 14);
                const last = dataPoints[dataPoints.length - 1];
                return {
                    id: s.id,
                    name: s.name,
                    lat: s.lat,
                    lon: s.lon,
                    tds: last.tds,
                    temperature: (12 + Math.random() * 4).toFixed(1),
                    riskLevel: this.calculateRisk(last.tds),
                    timestamp: last.timestamp,
                    dataPoints: dataPoints
                };
            })
        ];
    }

    /**
     * Generate synthetic time series for demo purposes
     * @param {number} baseTds - base TDS value
     * @param {number} days - number of days to generate
     */
    generateTimeSeries(baseTds = 1000, days = 14) {
        const now = new Date();
        const series = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            // small trend + noise
            const trend = (days - i) * (Math.random() * 5 - 2); // small drift
            const noise = (Math.random() - 0.5) * 80;
            const tds = Math.max(100, Math.round(baseTds + trend + noise));
            series.push({ timestamp: d.toISOString().split('T')[0], tds: tds });
        }
        return series;
    }

    getAllSensors() {
        return [...this.sensors];
    }

    getSensor(id) {
        return this.sensors.find(s => s.id === id);
    }
}

const dataLoader = new DataLoader();
