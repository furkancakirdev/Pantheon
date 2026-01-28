# Pantheon Trading OS - Deployment Checklist

Bu checklist, hem Vercel (Web) hem de EAS Build (Mobil) deployment için gerekli adımları içerir.

## 📋 Öncelikli Kontroller

- [x] API.txt dosyasından API key'leri alındı
- [x] `.env.production.example` dosyası güncellendi
- [x] `.env` dosyası güncellendi (development için)
- [x] Mobil API config güncellendi
- [x] Web API client'ları güncellendi

---

## 🌐 Vercel Deployment Checklist

### 1. Environment Variables Kurulumu

Vercel Dashboard'da aşağı environment variables'ı ekleyin:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_APP_URL` | `https://pantheon.vercel.app` | Production |
| `DATABASE_URL` | Production PostgreSQL URL | Production |
| `FRED_API_KEY` | `your-fred-api-key-here` | Production |
| `FMP_API_KEY` | `your-fmp-api-key-here` | Production |
| `GROQ_API_KEY` | `your-groq-api-key-here` | Production |
| `GEMINI_API_KEY` | `your-gemini-api-key-here` | Production |
| `ZAI_API_KEY` | `your-zai-api-key-here` | Production |
| `NODE_ENV` | `production` | Production |

### 2. Database Kurulumu

- [ ] Production PostgreSQL veritabanı oluşturun (Vercel Postgres, Neon, veya Supabase)
- [ ] `DATABASE_URL` environment variable'ını ayarlayın
- [ ] Prisma migration'larını çalıştırın:
  ```bash
  pnpm prisma migrate deploy
  ```

### 3. Deployment Komutları

```bash
# Vercel CLI ile deploy
vercel --prod

# Veya GitHub entegrasyonu ile otomatik deploy
```

### 4. Deployment Sonrası Kontroller

- [ ] `https://pantheon.vercel.app/api/health` endpoint'ini test edin
- [ ] API endpoint'lerinin çalıştığını doğrulayın:
  - `/api/portfolio`
  - `/api/watchlist`
  - `/api/signals`
  - `/api/analysis/council`
- [ ] Environment variables'ın doğru yüklendiğini kontrol edin

---

## 📱 EAS Build Deployment Checklist

### 1. Environment Variables Kurulumu

EAS Dashboard veya `eas.json` dosyasında environment variables'ı ayarlayın:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `EXPO_PUBLIC_API_URL` | `https://pantheon.vercel.app/api` | Production |

### 2. Build Konfigürasyonu

`apps/mobile/eas.json` dosyasını kontrol edin:

```json
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://pantheon.vercel.app/api"
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://pantheon.vercel.app/api"
      }
    }
  }
}
```

### 3. Build Komutları

```bash
# Development build
eas build --profile development

# Preview build
eas build --profile preview

# Production build
eas build --profile production
```

### 4. Submit to Stores

```bash
# iOS App Store
eas submit --platform ios --latest

# Google Play Store
eas submit --platform android --latest
```

### 5. Build Sonrası Kontroller

- [ ] Uygulamanın production API'ye bağlandığını doğrulayın
- [ ] API endpoint'lerinin çalıştığını test edin
- [ ] Push notifications'ın çalıştığını kontrol edin

---

## 🔒 Güvenlik Kontrolleri

- [ ] API key'leri production ortamında güvenli bir şekilde saklanıyor
- [ ] `.env` dosyası `.gitignore`'da
- [ ] Production environment variables'ı Vercel/EAS dashboard'da ayarlandı
- [ ] CORS ayarları doğru yapılandırıldı

---

## 📊 Monitoring ve Logging

- [ ] Vercel Analytics aktif
- [ ] Error tracking (Sentry veya benzeri) aktif
- [ ] API rate limiting yapılandırıldı
- [ ] Database connection pooling aktif

---

## 🔄 CI/CD Pipeline

- [ ] GitHub Actions veya benzeri CI/CD pipeline yapılandırıldı
- [ ] Automated tests çalışıyor
- [ ] Automated deployment aktif

---

## 📞 Destek ve İletişim

Sorunlar için:
- Vercel: https://vercel.com/docs
- Expo EAS: https://docs.expo.dev/build/introduction/
- GitHub Issues: Proje repository'si

---

**Not:** Bu checklist deployment süreci boyunca güncellenmelidir.
