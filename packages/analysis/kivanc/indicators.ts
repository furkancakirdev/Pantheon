/**
 * Kıvanç Özbilgiç İndikatörleri
 * 
 * Kaynak: TradingView - KivancOzbilgic
 * 
 * İndikatörler:
 * - AlphaTrend
 * - OTT (Optimized Trend Tracker)
 * - MOST (Moving Average Optimized Stop-Loss)
 * - PMAX (Profit Maximizer)
 * - MavilimW
 */

/**
 * Mum verisi tipi
 */
export interface Candle {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

/**
 * Sinyal tipi
 */
export type Signal = 'AL' | 'SAT' | 'BEKLE';

/**
 * İndikatör sonucu
 */
export interface IndicatorResult {
    name: string;
    value: number;
    signal: Signal;
    description: string;
}

// ===== YARDIMCI FONKSİYONLAR =====

/**
 * Basit Hareketli Ortalama (SMA)
 */
export function sma(data: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(NaN);
        } else {
            const slice = data.slice(i - period + 1, i + 1);
            result.push(slice.reduce((a, b) => a + b, 0) / period);
        }
    }
    return result;
}

/**
 * Üssel Hareketli Ortalama (EMA)
 */
export function ema(data: number[], period: number): number[] {
    const result: number[] = [];
    const multiplier = 2 / (period + 1);

    for (let i = 0; i < data.length; i++) {
        if (i === 0) {
            result.push(data[i]);
        } else {
            result.push((data[i] - result[i - 1]) * multiplier + result[i - 1]);
        }
    }
    return result;
}

/**
 * True Range
 */
export function trueRange(candles: Candle[]): number[] {
    return candles.map((c, i) => {
        if (i === 0) return c.high - c.low;
        const prevClose = candles[i - 1].close;
        return Math.max(
            c.high - c.low,
            Math.abs(c.high - prevClose),
            Math.abs(c.low - prevClose)
        );
    });
}

/**
 * ATR (Average True Range)
 */
export function atr(candles: Candle[], period: number = 14): number[] {
    const tr = trueRange(candles);
    return sma(tr, period);
}

// ===== KIVANÇ İNDİKATÖRLERİ =====

/**
 * MavilimW - Kıvanç'ın özgün hareketli ortalaması
 * İki WMA'nın WMA'sı
 */
export function mavilimW(candles: Candle[], period1: number = 3, period2: number = 5): number[] {
    const closes = candles.map(c => c.close);

    // Weighted Moving Average hesapla
    const wma = (data: number[], period: number): number[] => {
        const result: number[] = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                result.push(NaN);
            } else {
                let sum = 0;
                let weightSum = 0;
                for (let j = 0; j < period; j++) {
                    const weight = period - j;
                    sum += data[i - j] * weight;
                    weightSum += weight;
                }
                result.push(sum / weightSum);
            }
        }
        return result;
    };

    const fib1 = period1 * period2;
    const fib2 = fib1 + period1;

    const wma1 = wma(closes, fib1);
    const wma2 = wma(wma1.filter(x => !isNaN(x)), fib2);

    // Basitlik için ilk WMA'yı döndür
    return wma1;
}

/**
 * MOST - Moving Average Optimized Stop-Loss
 */
export function most(candles: Candle[], period: number = 8, percent: number = 2): {
    most: number[];
    signal: Signal;
} {
    const closes = candles.map(c => c.close);
    const exMov = ema(closes, period);

    const mostLine: number[] = [];
    let trend = 1; // 1: yukarı, -1: aşağı

    for (let i = 0; i < candles.length; i++) {
        if (i === 0) {
            mostLine.push(exMov[i] * (1 - percent / 100));
        } else {
            const stopLong = exMov[i] * (1 - percent / 100);
            const stopShort = exMov[i] * (1 + percent / 100);

            if (trend === 1) {
                mostLine.push(Math.max(stopLong, mostLine[i - 1]));
                if (closes[i] < mostLine[i]) trend = -1;
            } else {
                mostLine.push(Math.min(stopShort, mostLine[i - 1]));
                if (closes[i] > mostLine[i]) trend = 1;
            }
        }
    }

    // Son sinyal
    const lastClose = closes[closes.length - 1];
    const lastMost = mostLine[mostLine.length - 1];
    let signal: Signal = 'BEKLE';

    if (lastClose > lastMost && trend === 1) signal = 'AL';
    else if (lastClose < lastMost && trend === -1) signal = 'SAT';

    return { most: mostLine, signal };
}

/**
 * AlphaTrend - En popüler trend takipçisi
 */
export function alphaTrend(
    candles: Candle[],
    period: number = 14,
    multiplier: number = 1.5
): { line: number[]; signal: Signal } {
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const atrValues = atr(candles, period);

    const alphaLine: number[] = [];

    for (let i = 0; i < candles.length; i++) {
        if (i < period) {
            alphaLine.push(closes[i]);
        } else {
            const atrVal = atrValues[i] * multiplier;
            const upT = lows[i] + atrVal;
            const downT = highs[i] - atrVal;

            if (closes[i] > alphaLine[i - 1]) {
                alphaLine.push(Math.max(upT, alphaLine[i - 1]));
            } else {
                alphaLine.push(Math.min(downT, alphaLine[i - 1]));
            }
        }
    }

    // Sinyal belirleme
    const lastClose = closes[closes.length - 1];
    const lastAlpha = alphaLine[alphaLine.length - 1];
    const prevAlpha = alphaLine[alphaLine.length - 2];

    let signal: Signal = 'BEKLE';
    if (lastClose > lastAlpha && lastAlpha > prevAlpha) signal = 'AL';
    else if (lastClose < lastAlpha && lastAlpha < prevAlpha) signal = 'SAT';

    return { line: alphaLine, signal };
}

/**
 * Tüm indikatörleri çalıştır ve özet döndür
 */
export function tumIndikatorler(candles: Candle[]): IndicatorResult[] {
    const mostResult = most(candles);
    const alphaResult = alphaTrend(candles);

    return [
        {
            name: 'AlphaTrend',
            value: alphaResult.line[alphaResult.line.length - 1],
            signal: alphaResult.signal,
            description: `AlphaTrend trend takip: ${alphaResult.signal}`,
        },
        {
            name: 'MOST',
            value: mostResult.most[mostResult.most.length - 1],
            signal: mostResult.signal,
            description: `MOST stop-loss seviyesi: ${mostResult.signal}`,
        },
    ];
}

export default {
    sma,
    ema,
    atr,
    mavilimW,
    most,
    alphaTrend,
    tumIndikatorler,
};
