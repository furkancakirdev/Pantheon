/**
 * PANTHEON API TYPES
 * Type definitions for all API responses
 */

// ============ VERDICT TYPES ============
export type Verdict = 'GÜÇLÜ AL' | 'AL' | 'TUT' | 'BEKLE' | 'SAT' | 'GÜÇLÜ SAT';

// ============ MODULE VOTE ============
export interface ModuleVote {
  modul: string;           // Module name: "Atlas V2", "Orion V3", etc.
  oy: Verdict | string;     // Vote: AL, SAT, BEKLE, etc.
  guven: number;           // Confidence: 0-100
  aciklama?: string;       // Explanation text
}

// ============ COUNCIL DECISION ============
export interface CouncilDecision {
  sonKarar: Verdict | string;  // Final verdict
  konsensus: number;           // Consensus percentage: 0-100
  oylar?: ModuleVote[];        // Individual module votes
}

// ============ STOCK SIGNAL ============
export interface StockSignal {
  hisse: string;               // Stock symbol: "THYAO", "ASELS"
  fiyat?: number;              // Current price
  degisim?: string;            // Change percentage: "+2.5%"
  erdimcSkor?: number;         // Yaşar Erdinç score
  wonderkidSkor?: number;      // Wonderkid score
  teknikSinyal?: string;       // Technical signal
  councilKarar?: CouncilDecision;
}

// ============ MARKET DATA ============
export interface MarketData {
  endeks?: string;             // Index name: "BIST100"
  endeksDeger?: number;        // Index value
  endeksDegisim?: string;      // Index change
  regime?: string;             // Market regime: "Bullish", "Bearish", "Neutral"
  signals?: StockSignal[];     // Stock signals list
}

// ============ STOCK ANALYSIS ============
export interface StockAnalysis {
  hisse: string;
  erdincSkor?: number;
  wonderkidSkor?: number;
  teknikSinyal?: string;
  councilKarar: CouncilDecision;
  tarih?: string;              // Analysis timestamp
}

// ============ AETHER MACRO RATING ============
export interface MacroRating {
  regime: string;              // "Risk İştahı Yüksek", "Nötr", "Risk İştahı Düşük"
  numericScore: number;        // 0-100
  leading?: number;            // Leading indicators score
  coincident?: number;         // Coincident indicators score
  lagging?: number;            // Lagging indicators score
  timestamp?: string;
}

// ============ ORION ANALYSIS RESULT ============
export interface OrionAnalysis {
  symbol: string;
  totalScore: number;
  verdict: 'GÜÇLÜ AL' | 'AL' | 'TUT' | 'SAT' | 'GÜÇLÜ SAT';
  components: {
    trend: number;
    momentum: number;
    volatility: number;
    structure: number;
    kivanc: number;
  };
  kivanc: {
    alphaTrend: 'AL' | 'SAT' | 'BEKLE';
    most: 'AL' | 'SAT' | 'BEKLE';
    superTrend: 'AL' | 'SAT' | 'BEKLE';
    stochRSI: 'AL' | 'SAT' | 'BEKLE';
    mavilimW: 'YUKARI' | 'ASAGI' | 'YATAY';
    harmonicLevels?: {
      h6: number;
      l6: number;
      m1: number;
    };
  };
  persembe: {
    marketStructure: 'UPTREND' | 'DOWNTREND' | 'RANGE';
    lastSwingHigh: number;
    lastSwingLow: number;
  };
  details: string[];
}

// ============ PERSEMBE ANALYSIS RESULT ============
export interface PersembeAnalysis {
  destekDirenc: Array<{
    seviye: number;
    tip: 'DESTEK' | 'DİRENÇ';
    guc: number;
    testSayisi: number;
  }>;
  trend: {
    yonu: 'YUKARI' | 'AŞAĞI' | 'YATAY';
    baslangic: string;
    guc: number;
  };
  fibonacci: Array<{
    seviye: number;
    oran: number;
  }>;
  hacim: {
    teyitli: boolean;
    hacimTrendi: 'ARTAN' | 'AZALAN' | 'NORMAL';
    aciklama: string;
  };
  formasyon: {
    tip: string;
    guvenilirlik: number;
    hedefFiyat: number;
    aciklama: string;
  } | null;
  mumFormasyonlari: Array<{
    tip: string;
    sinyal: 'AL' | 'SAT' | 'BEKLE';
    guvenilirlik: number;
    aciklama: string;
  }>;
  ozet: string;
}

// ============ COMPLETE STOCK ANALYSIS ============
export interface CompleteStockAnalysis {
  symbol: string;
  orion: OrionAnalysis;
  persembe: PersembeAnalysis;
  councilKarar: CouncilDecision;
  erdinc?: {
    toplamSkor: number;
    buyumeSkor: number;
    borcSkor: number;
    carpanSkor: number;
    karlilikSkor: number;
    gerekceler: string[];
  };
  quote?: {
    currentPrice: number;
    change: number;
    changePercent: number;
    volume: number;
    high52w?: number;
    low52w?: number;
  };
  timestamp: string;
}

// ============ BACKTEST RESULT ============
export interface BacktestResult {
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalValue: number;
  return: number;              // Percentage return
  winRate: number;             // Win rate percentage
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  sharpeRatio?: number;
}

// ============ NEWS/SENTIMENT ============
export interface NewsItem {
  title: string;
  url?: string;
  publishedAt?: string;
  source?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  impactScore?: number;        // 0-100
}

// ============ HERMES RESULT ============
export interface HermesResult {
  symbol: string;
  score: number;               // Sentiment score: -100 to 100
  sentiment: 'positive' | 'negative' | 'neutral';
  tweetCount: number;
  topTweets?: NewsItem[];
  summary?: string;
}

// ============ API RESPONSE WRAPPER ============
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// ============ STOCK QUOTE ============
export interface StockQuote {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume?: number;
  high52w?: number;
  low52w?: number;
  timestamp?: string;
}

// ============ FUNDAMENTAL DATA ============
export interface FundamentalData {
  symbol: string;
  pe?: number;                 // P/E Ratio
  pb?: number;                 // P/B Ratio
  ps?: number;                 // P/S Ratio
  fdFaiz?: number;             // Favök (FD/FAİZ)
  pdDd?: number;               // Piyasa Değiri / Defter Değeri
  netKar?: number;             // Net Kar (milyon TL)
  satislar?: number;           // Satışlar (milyon TL)
  karMarji?: number;           // Kar Marjı (%)
  sirketAdi?: string;
  sektor?: string;
}

// ============ SETTINGS ============
export interface AppSettings {
  apiUrl: string;
  refreshInterval: number;     // Auto-refresh interval (seconds)
  enableNotifications: boolean;
  theme: 'dark' | 'light';
}

// ============ PHOENIX SIGNAL ============
export interface PhoenixSignal {
  type: 'GOLDEN_CROSS' | 'DEATH_CROSS' | 'SMA_CROSS' | 'MACD_CROSS' | 'RSI_OVERSOLD' | 'RSI_OVERBOUGHT' | 'FORMASYON' | 'VOLUME_SPIKE';
  strength: number;              // 1-10
  description: string;
  bullish: boolean;
}

export interface PhoenixCandidate {
  symbol: string;
  lastPrice: number;
  score: number;                 // 0-100
  reason: string;
  signals: PhoenixSignal[];
  riskLevel: 'DÜŞÜK' | 'ORTA' | 'YÜKSEK';
}

export interface PhoenixAnalysis {
  symbol: string;
  lastPrice: number;
  score: number;
  reason: string;
  signals: PhoenixSignal[];
  riskLevel: 'DÜŞÜK' | 'ORTA' | 'YÜKSEK';
  timestamp: string;
}

// ============ CHIRON RISK ============
export interface ChironRiskDecision {
  approved: boolean;
  adjustedQuantity: number;
  suggestedStopLoss?: number;
  suggestedTakeProfit?: number;
  riskR?: number;                // Risk birimi
  reason: string;
  warnings: string[];
}

export interface ChironRiskMetrics {
  totalRiskR: number;            // Toplam risk birimi
  sectorExposure: Record<string, number>;
  maxDrawdown: number;
  var95: number;                 // Value at Risk 95%
  concentrationRisk: number;     // 0-100
}

export interface PositionSizeResult {
  shares: number;
  riskR: number;
  reason: string;
}

// ============ EXPORT ALL ============
// Types are exported individually above
