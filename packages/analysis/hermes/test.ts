/**
 * Hermes Sentiment Test Script
 *
 * Twitter client ve Hermes engine test eder
 */

import { twitterClient, FINANCIAL_TWITTER_ACCOUNTS } from '@api/twitter';
import hermes from './engine.js';

async function testTwitterClient() {
  console.log('\n🔍 Twitter Client Testi Başlatılıyor...\n');

  // 1. Kullanıcı bilgisi testi
  console.log('--- Kullanıcı Bilgileri ---');
  const user = await twitterClient.getUserByUsername('YasarErdinc');
  console.log(JSON.stringify(user, null, 2));

  // 2. Kullanıcı tweet'leri testi
  console.log('\n--- Kullanıcı Tweet\'leri ---');
  const userTweets = await twitterClient.getUserTweets('AliPersembe', 5);
  console.log(`${userTweets.length} tweet bulundu:`);
  userTweets.forEach(t => {
    console.log(`  @${t.authorUsername}: ${t.text.substring(0, 60)}...`);
  });

  // 3. Sembol arama testi
  console.log('\n--- $THYAO Tweet\'leri ---');
  const thyaoTweets = await twitterClient.searchBySymbol('THYAO', 10);
  console.log(`${thyaoTweets.length} tweet bulundu:`);
  thyaoTweets.forEach(t => {
    console.log(`  [${t.publicMetrics.likeCount}❤️] @${t.authorUsername}: ${t.text.substring(0, 60)}...`);
  });

  // 4. Tüm finansal tweet'ler
  console.log('\n--- Tüm Finansal Tweet\'ler ---');
  const allTweets = await twitterClient.getAllFinancialTweets(20);
  console.log(`${allTweets.length} tweet bulundu`);

  // 5. Mention edilen sembolleri çıkar
  console.log('\n--- Mention Edilen Semboller ---');
  const symbols = new Set<string>();
  allTweets.forEach(t => {
    const mentioned = twitterClient.extractMentionedSymbols(t.text);
    mentioned.forEach(s => symbols.add(s));
  });
  console.log(`Toplam ${symbols.size} farklı sembol: ${[...symbols].join(', ')}`);

  return true;
}

async function testHermesEngine() {
  console.log('\n🔍 Hermes Engine Testi Başlatılıyor...\n');

  // 1. THYAO analizi
  console.log('--- $THYAO Analizi ---');
  const thyaoAnalysis = await hermes.analyze('THYAO', false); // LLM olmadan
  console.log(`Skor: ${thyaoAnalysis.score}/100`);
  console.log(`Sentiment: ${thyaoAnalysis.sentiment}`);
  console.log(`Tweet Sayısı: ${thyaoAnalysis.tweetCount}`);
  console.log(`Etkileşim: ${thyaoAnalysis.engagementScore}`);
  console.log(`Özet: ${thyaoAnalysis.twitterSummary}`);

  // Top tweet'ler
  console.log('\nTop Tweet\'ler:');
  thyaoAnalysis.topTweets.forEach((t, i) => {
    console.log(`  ${i + 1}. [${t.publicMetrics.likeCount}❤️] @${t.authorUsername}: ${t.text.substring(0, 50)}...`);
  });

  // 2. ASELS analizi
  console.log('\n--- $ASELS Analizi ---');
  const aselsAnalysis = await hermes.analyze('ASELS', false);
  console.log(`Skor: ${aselsAnalysis.score}/100`);
  console.log(`Sentiment: ${aselsAnalysis.sentiment}`);
  console.log(`Özet: ${aselsAnalysis.twitterSummary}`);

  // 3. BIMAS analizi
  console.log('\n--- $BIMAS Analizi ---');
  const bimasAnalysis = await hermes.analyze('BIMAS', false);
  console.log(`Skor: ${bimasAnalysis.score}/100`);
  console.log(`Sentiment: ${bimasAnalysis.sentiment}`);
  console.log(`Özet: ${bimasAnalysis.twitterSummary}`);

  // 4. Piyasa sentiment analizi
  console.log('\n--- Piyasa Sentiment Analizi ---');
  const marketSentiment = await hermes.analyzeMarketSentiment();
  console.log(`Genel: ${marketSentiment.overall}`);
  console.log(`Skor: ${marketSentiment.score}/100`);
  console.log(`En Çok Bahsedilen: ${marketSentiment.topSymbols.join(', ')}`);
  console.log(`Özet: ${marketSentiment.summary}`);

  return true;
}

async function testWithLLM() {
  console.log('\n🔍 Hermes LLM Testi (Groq) Başlatılıyor...\n');

  try {
    console.log('--- $THYAO LLM Analizi ---');
    const thyaoLLM = await hermes.analyze('THYAO', true);
    console.log(`Skor: ${thyaoLLM.score}/100`);
    console.log(`Sentiment: ${thyaoLLM.sentiment}`);
    console.log(`LLM Analizi: ${thyaoLLM.llmAnalysis || 'Yok'}`);
    return true;
  } catch (err) {
    console.log('⚠️ LLM testi atlandı (API anahtarı gerekli):', err instanceof Error ? err.message : err);
    return false;
  }
}

// Ana test fonksiyonu
async function runAllTests() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('         HERMES SENTIMENT - TEST SUIT');
  console.log('════════════════════════════════════════════════════════════\n');

  const results = {
    twitter: await testTwitterClient(),
    hermes: await testHermesEngine(),
    llm: await testWithLLM(),
  };

  console.log('\n════════════════════════════════════════════════════════════');
  console.log('                     TEST SONUÇLARI');
  console.log('════════════════════════════════════════════════════════════\n');
  console.log(`  Twitter Client:  ${results.twitter ? '✅ BAŞARILI' : '❌ BAŞARISIZ'}`);
  console.log(`  Hermes Engine:   ${results.hermes ? '✅ BAŞARILI' : '❌ BAŞARISIZ'}`);
  console.log(`  LLM Entegrasyon: ${results.llm ? '✅ BAŞARILI' : '⚠️ ATLANDI'}`);
  console.log('\n════════════════════════════════════════════════════════════\n');

  const allPassed = results.twitter && results.hermes;
  process.exit(allPassed ? 0 : 1);
}

// Testi çalıştır
runAllTests().catch(err => {
  console.error('💥 Kritik hata:', err);
  process.exit(1);
});
