/**
 * Market Types
 * Piyasa verileri için tip tanımlamaları
 */

// ============ BASE TYPES ============

export type AssetType = 'STOCK' | 'FOND' | 'CRYPTO' | 'FX' | 'COMMODITY' | 'INDEX' | 'ETF';

export type MarketStatus = 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'AFTER_HOURS' | 'HALTED';

export type Exchange = 'BIST' | 'NASDAQ' | 'NYSE' | 'AMEX' | 'FX' | 'CRYPTO';

// ============ QUOTE TYPES ============

export interface MarketQuote {
    /** Sembol */
    symbol: string;
    /** Varlık tipi */
    type?: AssetType;
    /** Borsa */
    exchange?: Exchange;

    // Fiyat verileri
    /** Son fiyat */
    price: number;
    /** Güne açılış */
    open?: number;
    /** Gün içi en yüksek */
    high?: number;
    /** Gün içi en düşük */
    low?: number;
    /** Önceki kapanış */
    previousClose?: number;
    /** Değişim */
    change: number;
    /** Değişim yüzdesi */
    changePercent: number;

    // Derinlik
    /** Alış fiyatı */
    bid?: number;
    /** Satış fiyatı */
    ask?: number;
    /** Alış miktarı */
    bidSize?: number;
    /** Satış miktarı */
    askSize?: number;
    /** Spread */
    spread?: number;

    // Hacim
    /** İşlem hacmi */
    volume?: number;
    /** İşlem adedi */
    trades?: number;

    // İstatistikler
    /** Günlük ortalama */
    vwap?: number;
    /** 52 hafta en yüksek */
    week52High?: number;
    /** 52 hafta en düşük */
    week52Low?: number;

    // Meta
    /** Zaman damgası */
    timestamp: number;
    /** Veri kalitesi */
    quality?: 'REALTIME' | 'DELAYED' | 'EOD';
    /** Piyasa durumu */
    marketStatus?: MarketStatus;
}

// ============ OHLCV TYPES ============

export interface OHLCV {
    /** Zaman */
    time: number;
    /** Açılış */
    open: number;
    /** En yüksek */
    high: number;
    /** En düşük */
    low: number;
    /** Kapanış */
    close: number;
    /** Hacim */
    volume: number;
}

export type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';

export interface ChartData {
    symbol: string;
    timeframe: TimeFrame;
    data: OHLCV[];
}

// ============ DEPTH TYPES ============

export interface Level2Data {
    symbol: string;
    /** Bidding tarafı (alış) - fiyat ve miktar çiftleri */
    bids: Array<[price: number, size: number]>;
    /** Asking tarafı (satış) - fiyat ve miktar çiftleri */
    asks: Array<[price: number, size: number]>;
    /** Toplam bid hacmi */
    totalBidSize?: number;
    /** Toplam ask hacmi */
    totalAskSize?: number;
    /** Imbalance (buying/selling pressure) */
    imbalance?: number;
    timestamp: number;
}

// ============ WATCHLIST TYPES ============

export interface WatchlistItem {
    symbol: string;
    addedAt: number;
    notes?: string;
    alertAbove?: number;
    alertBelow?: number;
}

// ============ SIGNAL TYPES ============

export type SignalType = 'BUY' | 'SELL' | 'HOLD' | 'WATCH';

export interface Signal {
    id: string;
    symbol: string;
    type: SignalType;
    confidence: number; // 0-100
    reason: string;
    modules: string[];
    timestamp: number;
    expiresAt?: number;
}

// ============ PORTFOLIO TYPES ============

export interface Position {
    id: string;
    symbol: string;
    quantity: number;
    entryPrice: number;
    currentPrice?: number;
    entryDate: number;
}

export interface Portfolio {
    id: string;
    name: string;
    positions: Position[];
    createdAt: number;
    updatedAt: number;
}

export interface PositionSummary {
    symbol: string;
    quantity: number;
    entryPrice: number;
    currentPrice: number;
    value: number;
    cost: number;
    pnl: number;
    pnlPercent: number;
    dayChange?: number;
    dayChangePercent?: number;
}

// ============ MARKET SUMMARY TYPES ============

export interface MarketMover {
    symbol: string;
    name?: string;
    changePercent: number;
    volume?: number;
    price: number;
}

export interface MarketSummary {
    /** Endeks */
    index: {
        symbol: string;
        value: number;
        change: number;
        changePercent: number;
    };
    /** Yükselenler */
    gainers: MarketMover[];
    /** Düşenler */
    losers: MarketMover[];
    /** Hacim liderleri */
    volumeLeaders: MarketMover[];
    /** Piyasa durumu */
    status: MarketStatus;
    /** Son güncelleme */
    timestamp: number;
}

// ============ NEWS TYPES ============

export interface NewsItem {
    id: string;
    symbol?: string;
    title: string;
    content?: string;
    source: string;
    url?: string;
    publishedAt: number;
    sentiment?: 'positive' | 'negative' | 'neutral';
    relevance?: number;
}

// ============ ANALYSIS TYPES ============

export interface TechnicalIndicators {
    /** RSI */
    rsi?: number;
    /** MACD */
    macd?: {
        value: number;
        signal: number;
        histogram: number;
    };
    /** Hareketli ortalamalar */
    ma?: {
        ma20: number;
        ma50: number;
        ma200: number;
    };
    /** Bollinger Bands */
    bollinger?: {
        upper: number;
        middle: number;
        lower: number;
    };
    /** Destek ve direnç */
    support?: number[];
    resistance?: number[];
}

export interface FundamentalData {
    /** Piyasa değeri */
    marketCap?: number;
    /** F/K oranı */
    pe?: number;
    /** PD/DD oranı */
    pb?: number;
    /** PD/DD */
    dynamicPDDD?: number;
    /** Net kar */
    netProfit?: number;
    /** Özsermaye */
    equity?: number;
    /** FAVÖK */
    favok?: number;
    /** Temettü verimi */
    dividendYield?: number;
}

export interface AnalysisResult {
    symbol: string;
    recommendation: SignalType;
    confidence: number;
    technical?: TechnicalIndicators;
    fundamental?: FundamentalData;
    sentiment?: number;
    reasons: string[];
    risks: string[];
    timestamp: number;
}

export default MarketQuote;
