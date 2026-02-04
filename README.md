# 🌊 Yeraltı Suyu Tuzlanması ve Obruk Risk Monitoring Sistemi

**Sweden Junior Water Prize 2026** - Türkiye DSİ Yarışması
*Açık Bilim & Açık Veri Projesi*

---

## 📋 Proje Özeti

Bu sistem, yeraltı suyu tuzlanması (salinite) ve dolayısıyla obruk (çökme) riskini izlemek, analiz etmek ve karar destek sağlamak amacıyla geliştirilmiştir.

### **⚠️ Önemli Not**
Bu sistem bir **çevresel karar destek prototipidir**. Kesin tahminler sunmaz, eğilim ve risk göstergeleri sağlar.

---

## 🏗️ Mimari Yapı

```
obruk/
├── index.html              # Ana sayfa
├── css/
│   └── style.css          # Stil dosyası
├── js/
│   ├── app.js             # Ana kontroller
│   ├── data-loader.js     # Veri yükleme (GeoJSON)
│   ├── risk-analyzer.js   # Risk analiz motorunun
│   ├── map-renderer.js    # Harita (Leaflet.js)
│   └── charts.js          # Grafikler (Chart.js)
├── data/
│   └── sensors.geojson    # Örnek sensör verileri
└── README.md              # Dokümantasyon
```

### **Modüller & Sorumlulukları**

| Modül | Amaç | Teknoloji |
|-------|------|-----------|
| **data-loader.js** | GeoJSON veri yükleme | Vanilla JS |
| **risk-analyzer.js** | TDS → Risk skoru hesaplama | Python-benzeri JS |
| **map-renderer.js** | Harita & sensör gösterimi | Leaflet.js |
| **charts.js** | Zaman serisi & istatistik | Chart.js |
| **app.js** | Koordinasyon & event handling | Vanilla JS |

---

## 📊 Veri Formatı

### GeoJSON Sensör Şeması

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [lon, lat]
  },
  "properties": {
    "sensor_id": "S001",
    "name": "Sensör İsmi",
    "tds": 2100,              // Toplam Çözünmüş Katılar (ppm)
    "salinity": 1.34,         // Tuzluluk (g/kg)
    "temperature": 12.5,      // Sıcaklık (°C)
    "timestamp": "ISO 8601",
    "risk_level": "medium",
    "data_points": [...]      // Zaman serisi
  }
}
```

---

## ⚙️ Risk Analiz Metodolojisi

### **Risk Seviyeleri**

| Seviye | TDS Aralığı | Açıklama |
|--------|------------|----------|
| **Low** | < 1500 ppm | İçme ve sulama suyu standartlarına uygun |
| **Medium** | 1500-3000 ppm | Kontrol altında, izleme gerekli |
| **High** | > 3000 ppm | Yeraltı suyu kalitesi ciddi düşük, obruk riski yüksek |

### **Risk Skoru Hesaplaması**

```
Toplam Risk = (TDS Faktörü × 0.5) + (Değişim Hızı × 0.3) + (Bölgesel Anomali × 0.2)

TDS Faktörü (0-50):
  - TDS ≤ 1500 ppm:   (TDS / 1500) × 20
  - TDS 1500-3000:    20 + ((TDS - 1500) / 1500) × 20
  - TDS > 3000:       40 + ((TDS - 3000) / 2000) × 10

Değişim Hızı (0-30):
  - > 50 ppm/gün:     30 (maksimum uyarı)
  - 10-50 ppm/gün:    15
  - Azalış:           5 (iyiye işaret)

Bölgesel Anomali (0-20):
  - Z-score > 2:      20 (istatistiksel olarak anormal)
  - Z-score > 1:      10
  - Diğer:            Z-score × 5
```

---

## 🎨 Arayüz Bileşenleri

### **Sol Panel - Kontroller**
- ⏱️ Zaman seçimi (slider)
- 🎯 Risk filtresi (Düşük/Orta/Yüksek)
- 📋 Sensör seçimi
- 📊 İstatistikler (Aktif sensör, Ort. Tuzluluk, Max Risk)
- 🗺️ Risk efsanesi
- ℹ️ Bilgilendirme kutusu

### **Merkez Bölge**
- **Harita** (Leaflet.js)
  - Sensör noktaları (renkli işaretçiler)
  - Basemap seçenekleri (OSM, Satellite, Terrain)
  - Popup bilgileri
  - Etkileşimli zoom/pan

- **Grafikler** (Chart.js)
  1. **Tuzluluk Zaman Serileri**: Seçili sensörlerin TDS trendi
  2. **Risk Dağılımı**: Pasta grafik (Low/Medium/High oranları)
  3. **Sensör Özeti**: Çubuk grafik (TDS & Sıcaklık karşılaştırması)

- **Veri Tablosu**: Tüm aktif sensörlerin detayları

---

## 🚀 Kurulum & Çalıştırma

### **Gereksinimler**
- Modern web tarayıcısı (Chrome, Firefox, Safari, Edge)
- İnternet bağlantısı (CDN'lerden kütüphane yükleme için)
- GitHub Pages için: GitHub hesabı

### **Yerel Çalıştırma**

```bash
# 1. Python simple server (Python 3)
python -m http.server 8000

# 2. Node.js http-server
npx http-server

# 3. VS Code Live Server extension
# Sağ tıkla → Open with Live Server
```

Tarayıcıda açın: `http://localhost:8000`

### **GitHub Pages'e Dağıt**

```bash
git init
git add .
git commit -m "Initial commit: Water monitoring system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/obruk.git
git push -u origin main
```

Settings → Pages → Branch: main → Save

Erişim: `https://YOUR_USERNAME.github.io/obruk`

---

## 📈 Veri Akışı

```
GeoJSON Dosyası (data/sensors.geojson)
       ↓
DataLoader (GeoJSON parse)
       ↓
RiskAnalyzer (TDS → Risk Skoru)
       ↓
MapRenderer (Leaflet harita)
       ↓
ChartManager (Chart.js grafikler)
       ↓
Tarayıcıda İnteraktif Dashboard
```

---

## 🔄 Gelecek Entegrasyonlar

### **ESP32 Sensör Kartından Veri**
```javascript
// API endpoint örneği
fetch('/api/sensors')
  .then(r => r.json())
  .then(data => dataLoader.parseGeoJSON(data))
```

### **Python Analiz Motoru**
```
ESP Veri → Cloud → Python Script → GeoJSON Üretimi → Frontend
```

### **Bilim Fuarı Gösterimi**
- Gerçek zamanlı veri akışı
- Etkileşimli grafikler
- Obruk risk haritası

---

## 📚 Kullanılan Kütüphaneler

| Kütüphane | Amaç | Kaynak |
|-----------|------|--------|
| **Leaflet.js** | Harita | CDN |
| **Chart.js** | Grafikler | CDN |
| **OpenStreetMap** | Harita verileri | OSM Contributors |
| **Vanilla JavaScript** | Mantık ve koordinasyon | İç geliştirme |

---

## 📄 Lisans & Etik

- **Açık Kaynak**: MIT License
- **Açık Veri**: Tüm sensor verileri GeoJSON formatında erişilebilir
- **Açık Bilim**: Metodoloji ve kod tamamen denetlenebilir
- **Sorumluluk Beyanı**: "Risk" ifadesi tahmin değil, göstergedir

---

## 📞 İletişim

**Proje**: Sweden Junior Water Prize 2026  
**Ülke**: Türkiye  
**Kurum**: DSİ (Devlet Su İşleri)

---

## 📝 Notlar

- Şu an örnek/simüle edilmiş veri kullanılıyor
- ESP32 ve IoT entegrasyonu gelecek faza
- Python backend analiz motoru hazırlanıyor
- Çok katmanlı harita (heatmap) ekleme planlanıyor

**Son Güncelleme**: 4 Şubat 2026
