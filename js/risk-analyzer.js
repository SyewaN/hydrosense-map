/**
 * Risk Analyzer Module
 * TDS ve diğer parametrelerden risk indeksi hesaplar
 * 
 * Risk Hesaplama Metodolojisi:
 * - TDS değeri temel parametre
 * - Zaman içinde değişim oranı dikkate alınır
 * - Bölgesel ortalamanın sapması ağırlıklandırılır
 */

class RiskAnalyzer {
    constructor() {
        // Risk eşikleri (ppm)
        this.thresholds = {
            low: { min: 0, max: 1500 },
            medium: { min: 1500, max: 3000 },
            high: { min: 3000, max: Infinity }
        };

        // Tercih edilen TDS değerleri (su kalitesi standartları)
        this.optimalTDS = {
            drinking: 500,    // İçme suyu
            irrigation: 1000, // Sulama
            general: 1500     // Genel standart
        };
    }

    /**
     * Tek bir sensör için risk seviyesi hesapla
     * @param {Object} sensor - Sensör nesnesi
     * @returns {String} risk seviyesi: 'low', 'medium', 'high'
     */
    calculateRiskLevel(sensor) {
        const tds = sensor.tds;

        if (tds <= this.thresholds.low.max) {
            return 'low';
        } else if (tds <= this.thresholds.medium.max) {
            return 'medium';
        } else {
            return 'high';
        }
    }

    /**
     * Risk skoru hesapla (0-100, açıklanabilir)
     * @param {Object} sensor - Sensör nesnesi
     * @param {Array} allSensors - Tüm sensörler (bölgesel karşılaştırma için)
     * @returns {Object} { score, explanation }
     */
    calculateRiskScore(sensor, allSensors = []) {
        let score = 0;
        const factors = {};

        // 1. TDS tabanlı puan (0-50)
        const tdsFactor = this.calculateTDSFactor(sensor.tds);
        factors.tds = tdsFactor;
        score += tdsFactor * 0.5;

        // 2. Değişim hızı (0-30) - eğer zaman serisi verisi varsa
        if (sensor.dataPoints && sensor.dataPoints.length > 1) {
            const changeFactor = this.calculateChangeRate(sensor.dataPoints);
            factors.changeRate = changeFactor;
            score += changeFactor * 0.3;
        }

        // 3. Bölgesel sapma (0-20) - komşu sensörlerle karşılaştırma
        if (allSensors.length > 1) {
            const anomalyFactor = this.calculateAnomaly(sensor, allSensors);
            factors.anomaly = anomalyFactor;
            score += anomalyFactor * 0.2;
        }

        const explanation = this.explainRisk(factors, sensor);

        return {
            score: Math.min(100, Math.round(score)),
            factors: factors,
            explanation: explanation
        };
    }

    /**
     * TDS değerinden risk faktörü hesapla (0-50)
     */
    calculateTDSFactor(tds) {
        // Linear mapping
        if (tds <= 1500) {
            return (tds / 1500) * 20; // 0-20
        } else if (tds <= 3000) {
            return 20 + ((tds - 1500) / 1500) * 20; // 20-40
        } else {
            return 40 + Math.min((tds - 3000) / 2000, 1) * 10; // 40-50
        }
    }

    /**
     * Zaman içinde değişim oranını hesapla (0-30)
     */
    calculateChangeRate(dataPoints) {
        if (dataPoints.length < 2) return 0;

        const recent = dataPoints.slice(-7); // Son 7 gün
        const tdsDifference = recent[recent.length - 1].tds - recent[0].tds;
        const daysElapsed = recent.length - 1;
        const changePerDay = daysElapsed > 0 ? tdsDifference / daysElapsed : 0;

        // Eğer artış hızlı ise daha yüksek risk
        if (changePerDay > 50) {
            return 30; // Maksimum
        } else if (changePerDay > 10) {
            return 15;
        } else if (changePerDay < -10) {
            return 5; // Azalma iyiye işaret
        } else {
            return Math.abs(changePerDay) / 50 * 10;
        }
    }

    /**
     * Bölgesel anomaliyi hesapla (0-20)
     */
    calculateAnomaly(sensor, allSensors) {
        if (allSensors.length < 2) return 0;

        const avgTds = allSensors.reduce((sum, s) => sum + s.tds, 0) / allSensors.length;
        const stdDev = Math.sqrt(
            allSensors.reduce((sum, s) => sum + Math.pow(s.tds - avgTds, 2), 0) / allSensors.length
        );

        const deviation = Math.abs(sensor.tds - avgTds);
        const zScore = stdDev > 0 ? deviation / stdDev : 0;

        if (zScore > 2) return 20; // İstatistiksel olarak anormal
        if (zScore > 1) return 10;
        return zScore * 5;
    }

    /**
     * Risk faktörlerini yazılı açıklama olarak sun
     */
    explainRisk(factors, sensor) {
        const explanations = [];

        if (factors.tds) {
            if (sensor.tds > 3000) {
                explanations.push('Yüksek tuzluluk (TDS > 3000 ppm)');
            } else if (sensor.tds > 1500) {
                explanations.push('Orta tuzluluk (1500-3000 ppm)');
            } else {
                explanations.push('Kabul edilebilir tuzluluk');
            }
        }

        if (factors.changeRate && factors.changeRate > 10) {
            explanations.push('Hızlı artışlı tuzlanma trendı');
        } else if (factors.changeRate && factors.changeRate < 5) {
            explanations.push('Stabil veya azalan tuzluluk');
        }

        if (factors.anomaly && factors.anomaly > 15) {
            explanations.push('Bölgeye göre anormalde yüksek değerler');
        }

        return explanations.length > 0 
            ? explanations.join(' • ') 
            : 'Veri yetersiz';
    }

    /**
     * Tüm sensörlere risk skoru ata
     */
    analyzeAllSensors(sensors) {
        return sensors.map(sensor => {
            const riskLevel = this.calculateRiskLevel(sensor);
            const riskScore = this.calculateRiskScore(sensor, sensors);
            
            return {
                ...sensor,
                riskLevel: riskLevel,
                riskScore: riskScore.score,
                riskExplanation: riskScore.explanation
            };
        });
    }

    /**
     * Obruk riski tahmini (çok basit model)
     * Yeraltı suyu tuzlanması → porozitede değişim → obruk riski
     */
    estimateSubsidenceRisk(sensor) {
        // Basit heuristic: TDS ile doğru orantılı
        const riskPercentage = Math.min(
            (sensor.tds / 3000) * 100,
            100
        );

        return {
            riskPercentage: riskPercentage.toFixed(1),
            description: riskPercentage > 70 
                ? 'Obruk oluşma olasılığı yüksek'
                : riskPercentage > 40
                ? 'Obruk riski orta seviyelerde'
                : 'Obruk riski düşük'
        };
    }
}

// Global instance
const riskAnalyzer = new RiskAnalyzer();
