# Veri Kaynakları Doğrulama ve İyileştirme Planı

Kullanıcı raporuna göre "datalar yanlış/eski". Bu durum, uygulamanın sürekli "Mock Data" modunda çalışmasından kaynaklanıyor. Gerçek zamanlı verilere geçiş için aşağıdaki adımlar uygulanacak.

## 🎯 Hedef

API endpoint'lerini "Mock Data" yerine gerçek veri kaynaklarına (İş Yatırım, Mynet, Alternatifler) bağlamak ve verilerin doğruluğunu sağlamak.

## ⚠️ Mevcut Sorunlar

1. `api/stocks/route.ts`: Tamamen hardcoded veri döndürüyor. `isyatirim.ts` istemcisini HİÇ kullanmıyor.
2. `api/market/route.ts`: Mynet API hatasında direkt mock veriye düşüyor. Fallback mekanizması çok agresif.
3. Mock veriler statik olduğu için piyasa değişimlerini yansıtmıyor.

## 📅 Uygulama Planı

### Faz 1: Hisse Senedi Verileri (Gerçek Veri)

- [ ] `packages/api-clients/isyatirim.ts` dosyasını test et ve çalışır olduğundan emin ol.
- [ ] `apps/web/src/app/api/stocks/route.ts` dosyasını güncelle:
  - Mock veriyi kaldır.
  - `fetchAllStocks()` fonksiyonunu bağla.
  - Veri gelmezse (hata durumunda) *cachelenmiş* son geçerli veriyi veya daha güncel bir mock listesini kullan.

### Faz 2: Piyasa Verileri (Endeks, Döviz, Altın)

- [ ] `packages/api-clients/mynet.ts` dosyasını güncelle:
  - CORS/Header sorunlarını çözmek için `User-Agent` ve `Referer` başlıkları ekle.
  - Alternatif kaynak ekle: `https://api.genelpara.com/embed/para-birimleri.json` (Genellikle daha stabildir).
- [ ] `apps/web/src/app/api/market/route.ts` dosyasını güncelle:
  - Önce Mynet'i dene.
  - Başarısız olursa GenelPara'yı dene.
  - En son çare olarak Mock döndür (ama kullanıcıya "Offline Mod" uyarısı ilet).

### Faz 3: Doğrulama

- [ ] `scripts/verify_data.ts` scripti ile:
  - İş Yatırım bağlantısını test et.
  - Mynet bağlantısını test et.
  - Dönen verilerin (ör. Dolar kuru) mantıklı aralıkta olduğunu (30-40 TL arası) kontrol et.

## 🛠️ Fallback Stratejisi

Eğer tüm API'ler engellenirse (IP Block vb.), sunucu tarafında (Server Side) scraping yapan basit bir "Scraper Service" kurulacak.
