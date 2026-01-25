/**
 * Database Test Script
 *
 * Prisma ve Redis bağlantılarını test eder
 */

import { prisma, redis, CacheTTL } from './index.js';

async function testPrisma() {
  console.log('\n🔍 Prisma Testi Başlatılıyor...\n');

  try {
    // 1. Bağlantı testi
    const stockCount = await prisma.stock.count();
    console.log(`✅ Prisma bağlantısı başarılı. Mevcut hisse sayısı: ${stockCount}`);

    // 2. Yeni kayıt oluştur
    const testStock = await prisma.stock.upsert({
      where: { kod: 'TEST' },
      update: {},
      create: {
        kod: 'TEST',
        ad: 'Test Şirketi',
        sektor: 'Teknoloji',
      },
    });
    console.log(`✅ Test kaydı oluşturuldu: ${testStock.kod}`);

    // 3. Analiz kaydı oluştur
    const testAnalysis = await prisma.analysis.create({
      data: {
        stockKod: 'TEST',
        moduleName: 'Atlas',
        verdict: 'AL',
        confidence: 85,
        details: { test: true },
      },
    });
    console.log(`✅ Analiz kaydı oluşturuldu: ${testAnalysis.id}`);

    // 4. Council kararı oluştur
    const testCouncil = await prisma.councilDecision.create({
      data: {
        stockKod: 'TEST',
        finalVerdict: 'AL',
        consensus: 75,
        votes: { atlas: 'AL', orion: 'AL', wonderkid: 'BEKLE' },
        aiExplanation: 'Test açıklaması',
      },
    });
    console.log(`✅ Council kararı oluşturuldu: ${testCouncil.id}`);

    // 5. Temizlik
    await prisma.councilDecision.delete({ where: { id: testCouncil.id } });
    await prisma.analysis.delete({ where: { id: testAnalysis.id } });
    await prisma.stock.delete({ where: { kod: 'TEST' } });
    console.log('✅ Test kayıtları temizlendi');

    return true;
  } catch (err) {
    console.error('❌ Prisma test hatası:', err);
    return false;
  }
}

async function testRedis() {
  console.log('\n🔍 Redis Testi Başlatılıyor...\n');

  try {
    // 1. Ping testi
    const isAlive = await redis.ping();
    console.log(`${isAlive ? '✅' : '⚠️'} Redis durumu: ${isAlive ? 'Bağlı' : 'Mock mod'}`);

    // 2. Set/Get testi
    await redis.set('test:key', { message: 'Merhaba Pantheon!' }, CacheTTL.ONE_MINUTE);
    const value = await redis.get<{ message: string }>('test:key');
    console.log(`✅ Set/Get testi: ${value?.message}`);

    // 3. TTL testi
    await redis.set('test:ttl', { expiring: 'soon' }, 2); // 2 saniye
    const before = await redis.get('test:ttl');
    await new Promise(resolve => setTimeout(resolve, 2500));
    const after = await redis.get('test:ttl');
    console.log(`✅ TTL testi: Öncesi=${before ? 'var' : 'yok'}, Sonrası=${after ? 'var' : 'yok'}`);

    // 4. Pattern delete testi
    await redis.set('test:pattern:1', { data: 1 });
    await redis.set('test:pattern:2', { data: 2 });
    await redis.delPattern('test:pattern:*');
    const deleted = await redis.get('test:pattern:1');
    console.log(`✅ Pattern delete testi: ${deleted ? 'başarısız' : 'başarılı'}`);

    // 5. Flush testi
    await redis.set('test:flush', { data: 'flush me' });
    await redis.flush();
    const flushed = await redis.get('test:flush');
    console.log(`✅ Flush testi: ${flushed ? 'başarısız' : 'başarılı'}`);

    return true;
  } catch (err) {
    console.error('❌ Redis test hatası:', err);
    return false;
  }
}

async function testIsyatirimApi() {
  console.log('\n🔍 İş Yatırım API Testi Başlatılıyor...\n');

  try {
    const { fetchAllStocks, clearStocksCache } = await import('../api-clients/isyatirim.js');

    // 1. İlk çağrı (cache'ten olmalı)
    console.log('İlk çağrı (cache bekleniyor)...');
    const start1 = Date.now();
    const stocks1 = await fetchAllStocks(true);
    const time1 = Date.now() - start1;
    console.log(`✅ ${stocks1.length} hisse çekildi (${time1}ms)`);

    // 2. İkinci çağrı (cache'ten gelmeli)
    console.log('\nİkinci çağrı (cache\'ten bekleniyor)...');
    const start2 = Date.now();
    const stocks2 = await fetchAllStocks(true);
    const time2 = Date.now() - start2;
    console.log(`✅ ${stocks2.length} hisse çekildi (${time2}ms) ${time2 < 100 ? '🚀 Cache hit!' : ''}`);

    // 3. Cache temizle ve tekrar çek
    console.log('\nCache temizleniyor ve tekrar çekiliyor...');
    await clearStocksCache();
    const start3 = Date.now();
    const stocks3 = await fetchAllStocks(true);
    const time3 = Date.now() - start3;
    console.log(`✅ ${stocks3.length} hisse çekildi (${time3}ms) - Yeni API çağrısı`);

    return true;
  } catch (err) {
    console.error('❌ İş Yatırım API test hatası:', err);
    return false;
  }
}

// Ana test fonksiyonu
async function runAllTests() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('         PANTHEON INVESTMENT PLATFORM - TEST SUIT');
  console.log('════════════════════════════════════════════════════════════\n');

  const results = {
    prisma: await testPrisma(),
    redis: await testRedis(),
    isyatirim: await testIsyatirimApi(),
  };

  console.log('\n════════════════════════════════════════════════════════════');
  console.log('                     TEST SONUÇLARI');
  console.log('════════════════════════════════════════════════════════════\n');
  console.log(`  Prisma:        ${results.prisma ? '✅ BAŞARILI' : '❌ BAŞARISIZ'}`);
  console.log(`  Redis:         ${results.redis ? '✅ BAŞARILI' : '❌ BAŞARISIZ'}`);
  console.log(`  İş Yatırım:    ${results.isyatirim ? '✅ BAŞARILI' : '❌ BAŞARISIZ'}`);
  console.log('\n════════════════════════════════════════════════════════════\n');

  const allPassed = Object.values(results).every(r => r);
  process.exit(allPassed ? 0 : 1);
}

// Testi çalıştır
runAllTests().catch(err => {
  console.error('💥 Kritik hata:', err);
  process.exit(1);
});
