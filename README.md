# InvestorAgent - Yatırım ve Borsa Ajanı

> Hibrit Yatırım Analiz Platformu - BIST, TEFAS, ABD Borsaları

## 🎯 Özellikler

- **Temel Analiz**: Yaşar Erdinç kriterleri (F/K, PD/DD, DuPont, Nakit Döngüsü)
- **Teknik Analiz**: Kıvanç Özbilgiç indikatörleri (AlphaTrend, OTT, MOST, PMAX)
- **Wonderkid Keşif**: Football Manager tarzı gelecek vaat eden şirket tespiti
- **Sentiment Analizi**: Türkçe NLP ile sosyal medya taraması

## 📁 Proje Yapısı

```
InvestorAgent/
├── apps/                    # Web ve Mobil uygulamalar
├── packages/
│   ├── api-clients/         # Veri kaynağı API'leri
│   ├── analysis/            # Analiz motorları
│   │   ├── erdinc/          # Yaşar Erdinç kuralları
│   │   ├── kivanc/          # Kıvanç indikatörleri
│   │   ├── persembe/        # Ali Perşembe teknikleri
│   │   └── wonderkid/       # FM tarzı keşif
│   ├── sentiment/           # NLP sentiment
│   └── db/                  # SQLite + Prisma
├── services/                # Scheduler, notifier
└── data/                    # SQLite veritabanı
```

## 🚀 Kurulum

```bash
npm install
npm run dev
```

## 📊 Veri Kaynakları

| Kaynak | API Endpoint | Veri |
|--------|--------------|------|
| İş Yatırım | POST `/Data.aspx/HisseSenetleri` | Temel veriler |
| Mynet | GET `/api/real-time` | Canlı fiyatlar |
| TEFAS | POST `/api/DB/BindComparisonFundReturns` | Fon verileri |

## 📝 Versiyon Geçmişi

- **v0.1.0** - Proje iskeleti oluşturuldu
