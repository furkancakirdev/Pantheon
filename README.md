# InvestorAgent - Yatırım ve Borsa Ajanı

> 📊 BIST, TEFAS, ABD Borsaları için hibrit yatırım analiz platformu

![Version](https://img.shields.io/badge/version-0.7.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Özellikler

### Analiz Motorları

- **Yaşar Erdinç** - Temel analiz (F/K, PD/DD, ROE, DuPont)
- **Ali Perşembe** - Teknik analiz (Destek/Direnç, Fibonacci, Hacim)
- **Kıvanç Özbilgiç** - İndikatörler (AlphaTrend, MOST, MavilimW)
- **Wonderkid** - FM tarzı gelecek vaat eden şirket keşfi
- **Grand Council** - Tüm modüllerin oylama ile karar vermesi

### Veri Kaynakları

- İş Yatırım API (BIST temel veriler)
- TEFAS API (Fon verileri)
- Mynet API (Canlı piyasa)

### Sentiment Analizi

- 22 X/Twitter hesabı takibi
- Türkçe NLP sentiment analizi

## 📁 Proje Yapısı

```
InvestorAgent/
├── apps/
│   ├── web/                 # Next.js 15 dashboard
│   └── mobile/              # React Native + Expo
├── packages/
│   ├── api-clients/         # Veri kaynağı API'leri
│   ├── analysis/            # Analiz motorları
│   │   ├── erdinc/          # Yaşar Erdinç kuralları
│   │   ├── persembe/        # Ali Perşembe teknikleri
│   │   ├── kivanc/          # Kıvanç indikatörleri
│   │   ├── wonderkid/       # FM tarzı keşif
│   │   └── council/         # Grand Council oylama
│   └── sentiment/           # NLP sentiment
├── prisma/                  # Veritabanı şeması
└── data/                    # SQLite DB
```

## 🚀 Kurulum

### Web Dashboard

```bash
cd apps/web
npm install
npm run dev
# http://localhost:3000
```

### Mobil Uygulama

```bash
cd apps/mobile
npm install
npx expo start
```

## 📊 API Endpoints

| Endpoint | Açıklama |
|----------|----------|
| `/api/stocks` | BIST hisse verileri |
| `/api/market` | Canlı piyasa (endeks, döviz, emtia) |
| `/api/funds` | TEFAS fon getirileri |
| `/api/analysis?symbol=ASELS` | Hisse analizi + Grand Council |

## 🏛️ Grand Council

Argus Terminal'den ilham alınarak oluşturulan oylama sistemi:

| Modül | Kaynak | Odak |
|-------|--------|------|
| Atlas | Yaşar Erdinç | Temel analiz |
| Demeter | Wonderkid | Sektör rotasyonu |
| Orion | Kıvanç | Teknik sinyaller |
| Athena | Ali Perşembe | Faktör analizi |
| Hermes | Sentiment | Sosyal medya |

## 📦 Git Versiyonlar

```
v0.1.0 - Proje iskeleti, API clients
v0.2.0 - Analiz motorları (Erdinç, Perşembe, Kıvanç, Wonderkid)
v0.3.0 - Web Dashboard (Next.js)
v0.4.0 - Sentiment modülü + 22 X hesabı
v0.5.0 - Grand Council + Argus entegrasyonu
v0.6.0 - API Routes (stocks, market, funds, analysis)
v0.7.0 - React Native mobil uygulama
```

## ⚠️ Yasal Uyarı

**Bu uygulama YATIRIM TAVSİYESİ DEĞİLDİR.**

- Eğitim ve araştırma amaçlıdır
- Alım-satım kararlarınızdan siz sorumlusunuz
- Profesyonel danışmanlık almanız önerilir

## 📄 Lisans

MIT License
