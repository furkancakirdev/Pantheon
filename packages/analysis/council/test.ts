/**
 * Grand Council AI Açıklama Test Script
 *
 * Gemini Pro ile Grand Council kararlarını açıklama testi
 * Kullanıcı: cakirfurkan48@gmail.com
 */

import {
  grandCouncil,
  atlasOyu,
  wonderkidOyu,
  orionOyu,
  athenaOyu,
  hermesOyu,
  aetherOyu,
  phoenixOyu,
  type CouncilKarar,
  type ModulOyu,
} from './grand-council.js';
import { councilExplanation } from './explanation.js';
import { redis, CacheTTL } from '@db/redis';

// Mock analiz sonuçları (gerçek modüller olmadan test için)
function createMockAnalysis(symbol: string): {
  atlas: any;
  orion: any;
  wonderkid: any;
} {
  return {
    // Atlas V3 Sonucu
    atlas: {
      symbol,
      dynamicFK: 8.5,
      dynamicPDDD: 1.2,
      score: 75,
      letterGrade: 'B',
      verdict: 'AL',
      erdincChecklist: [
        { rule: 'F/K < Sektör', passed: true, value: '8.5 vs 12.0', weight: 10 },
        { rule: 'PD/DD < 2', passed: true, value: '1.2', weight: 10 },
        { rule: 'ROE > %15', passed: true, value: '%18.5', weight: 10 },
        { rule: 'Borç/Özkaynak < 1', passed: true, value: '0.6', weight: 10 },
        { rule: 'İşletme Nakit Akışı > 0', passed: true, value: '2.5Bn TL', weight: 10 },
      ],
    },
    // Orion V4 Sonucu
    orion: {
      symbol,
      totalScore: 72,
      verdict: 'AL',
      kivanc: {
        alphaTrend: 'AL',
        most: 'AL',
        mavilimW: 'YUKARI',
      },
      persembe: {
        marketStructure: 'UPTREND',
        lastSwingHigh: 175,
        lastSwingLow: 155,
      },
    },
    // Wonderkid Sonucu
    wonderkid: {
      kod: symbol,
      ad: `${symbol} Şirketi`,
      wonderkidSkor: 78,
      potansiyelYildiz: true,
      trendEslesmesi: ['savunma', 'teknoloji'],
      sektor: 'Teknoloji',
    },
  };
}

async function testSingleStockAI() {
  console.log('\n🔍 Tek Hisse AI Açıklama Testi\n');
  console.log('════════════════════════════════════════════════════════════\n');

  // ASELS için mock analiz sonuçları
  const mock = createMockAnalysis('ASELS');

  // Modül oylarını oluştur
  const oylar: ModulOyu[] = [
    atlasOyu(mock.atlas),
    orionOyu(mock.orion),
    wonderkidOyu(mock.wonderkid),
    athenaOyu('YUKARI'),
    hermesOyu(0.65),
    aetherOyu('RISK_ON'),
    phoenixOyu(true),
  ];

  // Grand Council toplantısı
  const karar = grandCouncil('ASELS', oylar);

  console.log('Grand Council Kararı:');
  console.log(`  Hisse: ${karar.hisse}`);
  console.log(`  Karar: ${karar.sonKarar}`);
  console.log(`  Konsensus: %${karar.konsensus}`);
  console.log(`  AL: ${karar.toplamOy.al}, SAT: ${karar.toplamOy.sat}, BEKLE: ${karar.toplamOy.bekle}\n`);

  console.log('Modül Oyları:');
  karar.oylar.forEach(o => {
    console.log(`  • ${o.modul}: ${o.oy} (${o.guven}/100)`);
    console.log(`    ${o.aciklama}`);
  });

  // AI Açıklama
  console.log('\n🤖 AI Açıklama Oluşturuluyor...\n');

  const aciklama = await councilExplanation.explainDecision(karar, {
    regime: 'RISK_ON',
    sectorTrend: 'Savunma sektörü güçlü',
    overallSentiment: 'POZITIF',
  });

  console.log('════════════════════════════════════════════════════════════\n');
  console.log('AI AÇIKLAMA:');
  console.log('════════════════════════════════════════════════════════════\n');
  console.log(aciklama.explanation);
  console.log('\n');

  if (aciklama.keyPoints.length > 0) {
    console.log('Ana Noktalar:');
    aciklama.keyPoints.forEach(p => console.log(`  • ${p}`));
    console.log('\n');
  }

  if (aciklama.risks.length > 0) {
    console.log('Riskler:');
    aciklama.risks.forEach(r => console.log(`  ⚠️  ${r}`));
    console.log('\n');
  }

  if (aciklama.opportunities.length > 0) {
    console.log('Fırsatlar:');
    aciklama.opportunities.forEach(o => console.log(`  💰 ${o}`));
    console.log('\n');
  }

  console.log(`Model: ${aciklama.modelUsed}`);
  console.log(`Tavsiye: ${aciklama.recommendation}`);
  console.log('════════════════════════════════════════════════════════════\n');

  return aciklama;
}

async function testPortfolioAI() {
  console.log('\n🔍 Portföy AI Açıklama Testi\n');
  console.log('════════════════════════════════════════════════════════════\n');

  // Birden fazla hisse için mock kararlar oluştur
  const decisions: CouncilKarar[] = [];

  const symbols = ['THYAO', 'ASELS', 'BIMAS', 'GARAN', 'SAHOL'];
  const mockDecisions = [
    { sonKarar: 'AL' as const, konsensus: 85 },
    { sonKarar: 'AL' as const, konsensus: 72 },
    { sonKarar: 'BEKLE' as const, konsensus: 55 },
    { sonKarar: 'AL' as const, konsensus: 68 },
    { sonKarar: 'SAT' as const, konsensus: 65 },
  ];

  for (let i = 0; i < symbols.length; i++) {
    const mock = createMockAnalysis(symbols[i]);
    const oylar: ModulOyu[] = [
      atlasOyu(mock.atlas),
      orionOyu(mock.orion),
      wonderkidOyu(mock.wonderkid),
      athenaOyu(i % 2 === 0 ? 'YUKARI' : 'YATAY'),
      hermesOyu(0.5 + Math.random() * 0.4),
      aetherOyu('RISK_ON'),
      phoenixOyu(true),
    ];

    decisions.push(grandCouncil(symbols[i], oylar));
  }

  console.log('Portföy Kararları:');
  decisions.forEach(d => {
    const emoji = d.sonKarar === 'AL' ? '🟢' : d.sonKarar === 'SAT' ? '🔴' : '🟡';
    console.log(`  ${emoji} ${d.hisse}: ${d.sonKarar} (%${d.konsensus})`);
  });

  // AI Portföy özeti
  console.log('\n🤖 AI Portföy Özeti Oluşturuluyor...\n');

  const portfolioSummary = await councilExplanation.generatePortfolioSummary(decisions, {
    regime: 'RISK_ON',
    overallSentiment: 'POZITIF',
  });

  console.log('════════════════════════════════════════════════════════════\n');
  console.log('AI PORTFÖY ÖZETİ:');
  console.log('════════════════════════════════════════════════════════════\n');
  console.log(portfolioSummary.summary);
  console.log('\n');
  console.log(`Top Picks: ${portfolioSummary.topPicks.join(', ')}`);
  console.log('════════════════════════════════════════════════════════════\n');
}

async function testGeminiDirectly() {
  console.log('\n🔍 Gemini Pro Doğrudan Test\n');
  console.log('════════════════════════════════════════════════════════════\n');

  const { llm } = await import('../../api-clients/llm.js');

  const prompt = `Merhaba! Adın nedir ve Türkiye borsası hakkında ne biliyorsun?`;

  console.log('Prompt:', prompt);
  console.log('\nCevap bekleniyor...\n');

  try {
    const response = await llm.generate(
      prompt,
      'Sen Pantheon Investment Platform\'un AI asistanısın. Kısa ve öz cevap ver.'
    );

    console.log('Model:', response.model);
    console.log('Gecikme:', response.latency, 'ms');
    console.log('\nCevap:');
    console.log(response.text);
    console.log('\n════════════════════════════════════════════════════════════\n');

    return response.model !== 'Mock-Engine';
  } catch (error) {
    console.error('❌ Gemini test hatası:', error);
    return false;
  }
}

// Ana test fonksiyonu
async function runAllTests() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('         GRAND COUNCIL AI - TEST SUIT');
  console.log('         Kullanıcı: cakirfurkan48@gmail.com');
  console.log('════════════════════════════════════════════════════════════\n');

  // 1. Gemini doğrudan test
  const geminiOk = await testGeminiDirectly();

  // 2. Tek hisse AI açıklama testi
  await testSingleStockAI();

  // 3. Portföy AI testi
  await testPortfolioAI();

  // Özet
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('                     TEST SONUÇLARI');
  console.log('════════════════════════════════════════════════════════════\n');
  console.log(`  Gemini Pro:      ${geminiOk ? '✅ BAĞLI' : '⚠️ MOCK MOD'}`);
  console.log(`  AI Açıklama:     ✅ BAŞARILI`);
  console.log(`  Portföy AI:      ✅ BAŞARILI`);
  console.log('\n════════════════════════════════════════════════════════════\n');
}

// Testi çalıştır
runAllTests().catch(err => {
  console.error('💥 Kritik hata:', err);
  process.exit(1);
});
