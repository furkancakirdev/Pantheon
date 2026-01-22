# Argus-Terminal Entegrasyon Planı

Kullanıcının isteği üzerine `Argus-Terminal-main` (iOS/Swift) projesindeki gelişmiş analiz modülleri `InvestorAgent` (Web/Mobile) projesine entegre edilecektir.

## 🎯 Hedef

Argus Terminal'in 7 modüllü "Grand Council" mimarisini InvestorAgent içinde tam fonksiyonel hale getirmek.

### Mevcut Durum (InvestorAgent)

- **Atlas (Temel):** Yaşar Erdinç kuralları (Mevcut)
- **Orion (Teknik):** Kıvanç İndikatörleri (Mevcut)
- **Demeter (Sektör):** Wonderkid (Mevcut)
- **Hermes (Sentiment):** Sentiment Analizi (Mevcut)
- **Grand Council:** Mevcut modüllerle çalışıyor (5 modül)

### Eksik Modüller (Argus'tan Alınacak)

- **Aether (Makro):** Varlık alokasyonu ve piyasa rejimi
- **Athena (Faktör):** Ali Perşembe (kısmen var, geliştirilecek)
- **Chiron (Risk/Öğrenme):** Risk yönetimi ve portföy optimizasyonu
- **Phoenix (Strateji):** Destek/Direnç bazlı otomatik tarama

---

## 📅 Uygulama Planı

### Faz 1: Altyapı ve Eksik Modüllerin Port Edilmesi

Argus'un Swift kodları TypeScript'e çevrilecek.

#### 1.1 Aether Modülü (Makro)

- `AetherAllocationEngine.swift` -> `packages/analysis/aether/engine.ts`
- Piyasa rejimi (Euphoria, Risk On, Neutral, Risk Off) hesaplama
- Varlık dağılım önerisi (Hisse, Tahvil, Altın, Nakit)

#### 1.2 Chiron Modülü (Risk & Öğrenme)

- `Chiron/RiskBudgetService.swift` -> `packages/analysis/chiron/risk.ts`
- Portföy risk yönetimi ve pozisyon büyüklüğü hesaplama

#### 1.3 Phoenix Modülü (Strateji)

- `Phoenix/PhoenixScannerService.swift` -> `packages/analysis/phoenix/engine.ts`
- Destek/Direnç taraması ve kırılım sinyalleri

---

### Faz 2: Mevcut Modüllerin Güçlendirilmesi (Argus Mantığı ile)

#### 2.1 Orion (Teknik) - V3 Mimarisi

- `OrionAnalysisService.swift` mantığı eklenecek.
- Trend, Momentum, Volatilite, Yapı (Structure) puanlaması.
- Mevcut Kıvanç indikatörleri ile birleştirilecek.

#### 2.2 Atlas (Temel) - Dinamik Oranlar

- `AtlasEngine.swift` mantığı eklenecek.
- Canlı fiyat ile dinamik F/K, PD/DD hesaplama.

---

### Faz 3: Grand Council Güncellemesi

- Yeni modüller (Aether, Phoenix, Chiron) oylama sistemine dahil edilecek.
- Toplam 7 modülün ağırlıklı oylaması sağlanacak.

---

### Faz 4: Frontend Entegrasyonu

Her modül için detaylı analiz sayfaları oluşturulacak.

- [ ] **Aether Sayfası:** Makro görünüm ve varlık dağılımı
- [ ] **Chiron Sayfası:** Risk analizi
- [ ] **Phoenix Sayfası:** Strateji sinyalleri
- [ ] **Grand Council:** 7 modüllü yeni görünüm

---

## 🛠️ Teknoloji Stack

- **Backend:** TypeScript, Node.js
- **Frontend:** Next.js (Web), React Native (Mobile)
- **Database:** Prisma (Veri saklama gerekirse)
