/**
 * Demeter Module Types - Sector Rotation Analysis (Agora)
 *
 * Sektör rotasyonu modülü için tip tanımları.
 * Agora mimarisine uygun Result ve Opinion tipleri.
 */

// ============ TEMEL VERİ TİPLERİ ============

/**
 * Sektör Kodu
 */
export type SectorCode =
  | 'BANK'      // Bankacılık
  | 'SINA'      // Sınai
  | 'TEKN'      // Teknoloji
  | 'GYNA'      // Gıda
  | 'MANA'      // Mağazacılık
  | 'ELEC'      // Elektrik
  | 'ENRG'      // Enerji
  | 'META'      // Madencilik
  | 'HOCA'      // Holding
  | 'ILCS'      // İletişim
  | 'TAAS'      // Taşıma
  | 'INSR'      // Sigorta
  | 'REAL'      // Gayrimenkul
  | 'TEXT'      // Tekstil
  | 'CHEM'      // Kimya
  | 'OTOM';     // Otomotiv

/**
 * Sektör Trendi
 */
export type SectorTrend = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

/**
 * Sektör Fazı
 */
export type SectorPhase =
  | 'EARLY_CYCLE'    // Erken döngü (banka, tüketici)
  | 'MID_CYCLE'      // Orta döngü (sınai, teknoloji)
  | 'LATE_CYCLE'     // Geç döngü (enerji, madencilik)
  | 'RECESSION'      // Resesyon (defansif)
  | 'RECOVERY';      // İyileşme (tüketici, perakende)

/**
 * Piyasa Fazı (Demeter Regime)
 */
export type MarketPhase =
  | 'RISK_ON'        // Risk alımı (siklikal sektöler)
  | 'RISK_OFF'       // Risk kaçışı (defansif sektöler)
  | 'TRANSITION';    // Geçiş fazı

/**
 * Sektör Verisi
 */
export interface SectorData {
  /** Sektör kodu */
  sector: SectorCode;
  /** Sektör adı */
  name: string;
  /** Mevcut fiyat */
  price: number;
  /** Günlük değişim (%) */
  change: number;
  /** Hacim */
  volume: number;
  /** 52 hafta yüksek/yüksek oranı */
  high52Ratio: number;
  /** RSI (14) */
  rsi: number;
  /** Momentum skoru */
  momentum: number;
  /** Göreceli güç (endekse karşı) */
  relativeStrength: number;
  /** Trend */
  trend: SectorTrend;
  /** Faz */
  phase: SectorPhase;
  /** P/E oranı */
  pe?: number;
  /** P/B oranı */
  pb?: number;
}

/**
 * Sektör Sinyali
 */
export interface SectorSignal {
  /** Sektör */
  sector: SectorCode;
  /** Sinyal tipi */
  type: 'ENTRY' | 'EXIT' | 'ROTATE_IN' | 'ROTATE_OUT' | 'HOLD';
  /** Sinyal gücü (0-100) */
  strength: number;
  /** Açıklama */
  description: string;
  /** Kaynak faktörler */
  factors: string[];
}

/**
 * Sektör Rotasyonu
 */
export interface SectorRotation {
  /** Çıkan sektörlere öneri */
  rotateIn: SectorCode[];
  /** Çıkan sektörler */
  rotateOut: SectorCode[];
  /** Tutulacak sektörlere öneri */
  hold: SectorCode[];
  /** Ağırlık değişikliği önerisi */
  weightChanges: Array<{
    sector: SectorCode;
    fromWeight: number;
    toWeight: number;
    reason: string;
  }>;
}

/**
 * Demeter Faz Analizi
 */
export interface PhaseAnalysis {
  /** Mevcut piyasa fazı */
  currentPhase: MarketPhase;
  /** Faz güvenilirliği (0-1) */
  phaseConfidence: number;
  /** Sektör dağılımı önerisi */
  sectorAllocation: Record<SectorCode, number>;
  /** Defansif/Siklikal oranı */
  defensiveRatio: number;
  /** Faz açıklaması */
  description: string;
}

// ============ ANALİZ SONUCU ============

/**
 * Demeter Analiz Sonucu (Agora)
 */
export interface DemeterResult {
  /** Analiz tarihi */
  date: Date;
  /** Genel skor (0-100) */
  score: number;
  /** Harf notu */
  letterGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** Karar */
  verdict: Verdict;
  /** Piyasa fazı */
  marketPhase: MarketPhase;
  /** Sektör verileri */
  sectors: SectorData[];
  /** Sektör rotasyonu */
  rotation: SectorRotation;
  /** Faz analizi */
  phaseAnalysis: PhaseAnalysis;
  /** En güçlü sektörler */
  topSectors: SectorData[];
  /** En zayıf sektörler */
  bottomSectors: SectorData[];
  /** Sinyaller */
  signals: SectorSignal[];
  /** Detaylar */
  details: string[];
  /** Özet */
  summary: string;
  /** Analiz zamanı */
  timestamp: Date;
}

/**
 * Agora modül opiniyonuna dönüşüm
 */
export interface DemeterOpinion {
  /** Modül */
  module: 'demeter';
  /** Duruş */
  stance: 'CLAIM' | 'SUPPORT' | 'OBJECT' | 'ABSTAIN';
  /** Tercih edilen aksiyon */
  preferredAction: 'buy' | 'sell' | 'hold';
  /** Güç (0-1) */
  strength: number;
  /** Skor (0-100) */
  score: number;
  /** Güven (0-1) */
  confidence: number;
  /** Kanıtlar */
  evidence: string[];
  /** Sektörel öneriler */
  sectorRecommendations: Array<{
    sector: SectorCode;
    action: 'OVERWEIGHT' | 'EQUAL' | 'UNDERWEIGHT';
    conviction: number;
  }>;
}

/**
 * Karar Tipi
 */
export type Verdict = 'GÜÇLÜ POZİTİF' | 'POZİTİF' | 'NÖTR' | 'NEGATİF' | 'GÜÇLÜ NEGATİF';

// ============ SEKTÖR TANIMLARI ============

/**
 * Sektör bilgisi
 */
export interface SectorInfo {
  /** Sektör kodu */
  code: SectorCode;
  /** Sektör adı */
  name: string;
  /** Sektör fazı */
  phase: SectorPhase[];
  /** Defansif mi? */
  isDefensive: boolean;
  /** Siklikal mi? */
  isCyclical: boolean;
  /** Beta */
  beta: number;
  /** Temel semboller */
  symbols: string[];
}

/**
 * Endeks verisi
 */
export interface IndexData {
  /** Sembol */
  symbol: string;
  /** Fiyat */
  price: number;
  /** Değişim */
  change: number;
  /** Hacim */
  volume: number;
  /** Timestamp */
  timestamp: Date;
}

// ============ HARF NOTLARI ============

/**
 * Skora göre harf notu hesapla
 */
export function getLetterGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 45) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

/**
 * Skora göre karar ver
 */
export function getVerdict(score: number): Verdict {
  if (score >= 75) return 'GÜÇLÜ POZİTİF';
  if (score >= 60) return 'POZİTİF';
  if (score >= 45) return 'NÖTR';
  if (score >= 30) return 'NEGATİF';
  return 'GÜÇLÜ NEGATİF';
}

/**
 * Kararı Action'a çevir
 */
export function verdictToAction(verdict: Verdict): 'buy' | 'sell' | 'hold' {
  if (verdict === 'GÜÇLÜ POZİTİF' || verdict === 'POZİTİF') return 'buy';
  if (verdict === 'GÜÇLÜ NEGATİF' || verdict === 'NEGATİF') return 'sell';
  return 'hold';
}

/**
 * Trend belirle
 */
export function getTrend(
  rsi: number,
  momentum: number,
  relativeStrength: number
): SectorTrend {
  const bullishScore =
    (rsi > 50 ? 1 : 0) +
    (momentum > 0 ? 1 : 0) +
    (relativeStrength > 100 ? 1 : 0);

  if (bullishScore >= 2) return 'BULLISH';
  if (bullishScore === 1) return 'NEUTRAL';
  return 'BEARISH';
}

/**
 * Skoru Opinion'a dönüştür
 */
export function scoreToOpinion(
  sectors: SectorData[],
  rotation: SectorRotation,
  phaseAnalysis: PhaseAnalysis,
  score: number
): DemeterOpinion {
  const quality = 0.80; // Demeter güvenilirliği

  // Stance belirle
  let stance: DemeterOpinion['stance'];
  if (score >= 70) {
    stance = 'SUPPORT';
  } else if (score >= 55) {
    stance = 'ABSTAIN';
  } else if (score >= 40) {
    stance = 'OBJECT';
  } else {
    stance = 'OBJECT';
  }

  // Kanıtlar
  const evidence: string[] = [
    `Rotasyon Skoru: ${score}/100`,
    `Piyasa Fazı: ${phaseAnalysis.currentPhase}`,
    `Defansif Oran: ${(phaseAnalysis.defensiveRatio * 100).toFixed(1)}%`,
  ];

  // Sektörel öneriler
  const sectorRecommendations: DemeterOpinion['sectorRecommendations'] = [];

  for (const sector of rotation.rotateIn.slice(0, 3)) {
    const sectorData = sectors.find(s => s.sector === sector);
    if (sectorData) {
      sectorRecommendations.push({
        sector: sector,
        action: 'OVERWEIGHT',
        conviction: sectorData.momentum / 100,
      });
    }
  }

  for (const sector of rotation.rotateOut.slice(0, 2)) {
    sectorRecommendations.push({
      sector,
      action: 'UNDERWEIGHT',
      conviction: 0.7,
    });
  }

  return {
    module: 'demeter',
    stance,
    preferredAction: verdictToAction(getVerdict(score)),
    strength: Math.abs(score - 50) / 50 * quality,
    score,
    confidence: quality,
    evidence,
    sectorRecommendations,
  };
}

/**
 * Özet oluştur
 */
export function generateSummary(
  marketPhase: MarketPhase,
  topSector: SectorData,
  bottomSector: SectorData,
  rotation: SectorRotation
): string {
  const parts: string[] = [];

  switch (marketPhase) {
    case 'RISK_ON':
      parts.push('Risk iştahı yüksek. Siklikal sektörlere yönelim.');
      break;
    case 'RISK_OFF':
      parts.push('Risk kaçışında. Defansif sektörlere rotasyon.');
      break;
    case 'TRANSITION':
      parts.push('Geçiş fazı. Dikkatli sektörel dağılım.');
      break;
  }

  parts.push(`En güçlü: ${topSector.name} (${topSector.change > 0 ? '+' : ''}${topSector.change.toFixed(1)}%).`);
  parts.push(`En zayıf: ${bottomSector.name} (${bottomSector.change > 0 ? '+' : ''}${bottomSector.change.toFixed(1)}%).`);

  if (rotation.rotateIn.length > 0) {
    const rotateInNames = rotation.rotateIn
      .map(s => sectors.find(x => x.code === s)?.name || s)
      .slice(0, 2)
      .join(', ');
    parts.push(`Öneri: ${rotateInNames} ağırlık artır.`);
  }

  return parts.join(' ');
}

/**
 * Sektör tanımları
 */
export const SECTORS: SectorInfo[] = [
  {
    code: 'BANK',
    name: 'Bankacılık',
    phase: ['EARLY_CYCLE', 'RECOVERY'],
    isDefensive: false,
    isCyclical: true,
    beta: 1.3,
    symbols: ['AKBNK', 'GARAN', 'ISCTR', 'YKBNK', 'HALKB', 'TSKB'],
  },
  {
    code: 'SINA',
    name: 'Sınaî',
    phase: ['MID_CYCLE'],
    isDefensive: false,
    isCyclical: true,
    beta: 1.2,
    symbols: ['THYAO', 'FROTO', 'TOASO', 'CCOLA', 'SAHOL'],
  },
  {
    code: 'TEKN',
    name: 'Teknoloji',
    phase: ['EARLY_CYCLE', 'MID_CYCLE'],
    isDefensive: false,
    isCyclical: true,
    beta: 1.4,
    symbols: ['PARSN', 'PRKME', 'LOGFA', 'TUPRS', 'MIATK'],
  },
  {
    code: 'GYNA',
    name: 'Gıda',
    phase: ['RECESSION', 'DEFENSIVE'],
    isDefensive: true,
    isCyclical: false,
    beta: 0.6,
    symbols: ['GUBRF', 'PENSAS', 'TKFEN', 'ULKER', 'AGROT'],
  },
  {
    code: 'MANA',
    name: 'Mağazacılık',
    phase: ['RECOVERY', 'LATE_CYCLE'],
    isDefensive: false,
    isCyclical: true,
    beta: 1.1,
    symbols: ['BIMAS', 'MGROS', 'SASA', 'GSDDE', 'KERVN'],
  },
  {
    code: 'ELEC',
    name: 'Elektrik',
    phase: ['RECESSION'],
    isDefensive: true,
    isCyclical: false,
    beta: 0.5,
    symbols: ['AKSA', 'AKENR', 'AYEN', 'BRSAN', 'TKFEN'],
  },
  {
    code: 'ENRG',
    name: 'Enerji',
    phase: ['LATE_CYCLE'],
    isDefensive: false,
    isCyclical: true,
    beta: 1.5,
    symbols: ['PETKM', 'TUPRS', 'TPSAO', 'BRISA', 'MITSO'],
  },
  {
    code: 'META',
    name: 'Madencilik',
    phase: ['LATE_CYCLE', 'EARLY_CYCLE'],
    isDefensive: false,
    isCyclical: true,
    beta: 1.6,
    symbols: ['TKFEN', 'DDMN', 'KOZAA', 'KOZAL', 'SNGS'],
  },
  {
    code: 'HOCA',
    name: 'Holding',
    phase: ['MID_CYCLE'],
    isDefensive: false,
    isCyclical: true,
    beta: 1.0,
    symbols: ['SAHOL', 'KCHOL', 'ALARK', 'HOLYA', 'TRKCM'],
  },
  {
    code: 'ILCS',
    name: 'İletişim',
    phase: ['RECESSION'],
    isDefensive: true,
    isCyclical: false,
    beta: 0.7,
    symbols: ['TKTL', 'TCELL', 'KRDMD', 'INFO'],
  },
  {
    code: 'TAAS',
    name: 'Taşıma',
    phase: ['EARLY_CYCLE', 'RECOVERY'],
    isDefensive: false,
    isCyclical: true,
    beta: 1.2,
    symbols: ['THYAO', 'ARCLK', 'EKGYO', 'ULAS'],
  },
  {
    code: 'INSR',
    name: 'Sigorta',
    phase: ['MID_CYCLE', 'RECESSION'],
    isDefensive: true,
    isCyclical: false,
    beta: 0.8,
    symbols: ['ALLI', 'GENIL', 'TRKCM', 'BAFRA'],
  },
  {
    code: 'REAL',
    name: 'Gayrimenkul',
    phase: ['LATE_CYCLE'],
    isDefensive: false,
    isCyclical: true,
    beta: 1.3,
    symbols: ['AVEYO', 'TEMVO', 'EKGYO', 'KONTR'],
  },
  {
    code: 'TEXT',
    name: 'Tekstil',
    phase: ['EARLY_CYCLE'],
    isDefensive: false,
    isCyclical: true,
    beta: 1.1,
    symbols: ['SUNTK', 'BORSA', 'GSDDE'],
  },
  {
    code: 'CHEM',
    name: 'Kimya',
    phase: ['MID_CYCLE'],
    isDefensive: false,
    isCyclical: true,
    beta: 1.1,
    symbols: ['PETKM', 'TUPRS', 'DURDO', 'TRKCM'],
  },
  {
    code: 'OTOM',
    name: 'Otomotiv',
    phase: ['EARLY_CYCLE', 'MID_CYCLE'],
    isDefensive: false,
    isCyclical: true,
    beta: 1.4,
    symbols: ['TOASO', 'FROTO', 'DOAS', 'OTSAN'],
  },
];

// Sector name lookup
export const getSectorName = (code: SectorCode): string => {
  return SECTORS.find(s => s.code === code)?.name || code;
};

// ============ EXPORTS ============

export default {
  SectorCode,
  SectorTrend,
  SectorPhase,
  MarketPhase,
  SectorData,
  SectorSignal,
  SectorRotation,
  PhaseAnalysis,
  DemeterResult,
  DemeterOpinion,
  SectorInfo,
  IndexData,
  Verdict,
  getLetterGrade,
  getVerdict,
  verdictToAction,
  getTrend,
  scoreToOpinion,
  generateSummary,
  SECTORS,
  getSectorName,
};
