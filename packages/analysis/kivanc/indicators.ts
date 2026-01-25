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
 * - SuperTrend
 * - KIVANÇ HL (Harmonic Levels)
 * - Stochastic RSI
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
 * Fibonacci dizili kaskad WMA: 3, 5, 8, 13, 21, 34
 * Formül: M1=C, M2=WMA(M1,3), M3=WMA(M2,5), M4=WMA(M3,8), M5=WMA(M4,13), M6=WMA(M5,21), M7=WMA(M6,34)
 */
export function mavilimW(candles: Candle[]): number[] {
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

    // Fibonacci diziliminde kaskad WMA
    const m1 = closes;
    const m2 = wma(m1, 3);
    const m3 = wma(m2.map(x => x || 0), 5);
    const m4 = wma(m3.map(x => x || 0), 8);
    const m5 = wma(m4.map(x => x || 0), 13);
    const m6 = wma(m5.map(x => x || 0), 21);
    const m7 = wma(m6.map(x => x || 0), 34);

    return m7;
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
 * SuperTrend - Kıvanç Özbilgiç
 * ATR tabanlı trend takip indikatörü
 * Formül: AP = (H+L)/2, OFFSET = coeff * ATR(period)
 */
export function superTrend(
    candles: Candle[],
    period: number = 10,
    coeff: number = 3
): { line: number[]; signal: Signal; trend: number } {
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const closes = candles.map(c => c.close);
    const atrValues = atr(candles, period);

    const stLine: number[] = [];
    let trend = 0; // 1: up, -1: down

    for (let i = 0; i < candles.length; i++) {
        const ap = (highs[i] + lows[i]) / 2;
        const offset = atrValues[i] * coeff;
        const upperBand = ap + offset;
        const lowerBand = ap - offset;

        if (i === 0) {
            stLine.push(lowerBand);
            trend = 1;
        } else {
            const prevST = stLine[i - 1];
            const prevClose = closes[i - 1];

            // Trend direction logic
            if (prevST === upperBand || (prevClose > prevST && closes[i] > prevST)) {
                // Uptrend
                stLine.push(lowerBand);
                trend = 1;
            } else {
                // Downtrend
                stLine.push(upperBand);
                trend = -1;
            }
        }
    }

    // Sinyal belirleme
    const lastClose = closes[closes.length - 1];
    const lastST = stLine[stLine.length - 1];
    let signal: Signal = 'BEKLE';

    if (lastClose > lastST) signal = 'AL';
    else if (lastClose < lastST) signal = 'SAT';

    return { line: stLine, signal, trend };
}

/**
 * KIVANÇ HL (Harmonic Levels) - Fibonacci harmonik seviyeler
 * Periodlar: 13, 21, 34, 55, 89, 144 (Fibonacci dizisi)
 * Destek ve direnç seviyeleri hesaplar
 */
export function kivancHL(candles: Candle[]): {
    h6: number;
    l6: number;
    m1: number;
    levels: { h1: number; h2: number; h3: number; h4: number; h5: number; h6: number;
             l1: number; l2: number; l3: number; l4: number; l5: number; l6: number; };
} {
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const fibPeriods = [13, 21, 34, 55, 89, 144];

    // HHV (Highest High Value) and LLV (Lowest Low Value) functions
    const hhv = (data: number[], period: number) => {
        const result: number[] = [];
        for (let i = 0; i < data.length; i++) {
            const slice = data.slice(Math.max(0, i - period + 1), i + 1);
            result.push(Math.max(...slice));
        }
        return result;
    };

    const llv = (data: number[], period: number) => {
        const result: number[] = [];
        for (let i = 0; i < data.length; i++) {
            const slice = data.slice(Math.max(0, i - period + 1), i + 1);
            result.push(Math.min(...slice));
        }
        return result;
    };

    // Calculate harmonic levels
    let h = [...highs];
    let l = [...lows];

    for (const p of fibPeriods) {
        const hhvVal = hhv(h, p);
        const llvVal = llv(l, p);
        h = hhvVal;
        l = llvVal;
    }

    const h6 = h[h.length - 1];
    const l6 = l[l.length - 1];
    const m1 = (h6 + l6) / 2;

    return {
        h6,
        l6,
        m1,
        levels: {
            h1: hhv(highs, 13)[highs.length - 1],
            h2: hhv(highs, 21)[highs.length - 1],
            h3: hhv(highs, 34)[highs.length - 1],
            h4: hhv(highs, 55)[highs.length - 1],
            h5: hhv(highs, 89)[highs.length - 1],
            h6: h6,
            l1: llv(lows, 13)[lows.length - 1],
            l2: llv(lows, 21)[lows.length - 1],
            l3: llv(lows, 34)[lows.length - 1],
            l4: llv(lows, 55)[lows.length - 1],
            l5: llv(lows, 89)[lows.length - 1],
            l6: l6,
        },
    };
}

/**
 * Stochastic RSI
 * RSI üzerinde Stochastic osilatörü
 */
export function stochasticRSI(
    candles: Candle[],
    rsiPeriod: number = 14,
    stochPeriod: number = 14,
    smoothK: number = 3,
    smoothD: number = 3
): { k: number[]; d: number[]; signal: Signal } {
    const closes = candles.map(c => c.close);

    // RSI hesapla
    const rsiValues: number[] = [];
    let gains = 0;
    let losses = 0;

    for (let i = 0; i < closes.length; i++) {
        if (i === 0) {
            gains = 0;
            losses = 0;
        } else {
            const change = closes[i] - closes[i - 1];
            gains += change > 0 ? change : 0;
            losses += change < 0 ? Math.abs(change) : 0;
        }

        if (i < rsiPeriod) {
            rsiValues.push(50);
        } else {
            const avgGain = gains / rsiPeriod;
            const avgLoss = losses / rsiPeriod;
            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            rsiValues.push(100 - (100 / (1 + rs)));
        }
    }

    // Stochastic RSI hesapla
    const kValues: number[] = [];
    for (let i = 0; i < rsiValues.length; i++) {
        if (i < stochPeriod - 1) {
            kValues.push(50);
        } else {
            const rsiSlice = rsiValues.slice(i - stochPeriod + 1, i + 1);
            const rsiHigh = Math.max(...rsiSlice);
            const rsiLow = Math.min(...rsiSlice);
            const stochRSI = rsiHigh === rsiLow ? 50 : ((rsiValues[i] - rsiLow) / (rsiHigh - rsiLow)) * 100;
            kValues.push(stochRSI);
        }
    }

    // Smooth K
    const smoothedK = sma(kValues, smoothK);

    // Smooth D (SMA of smoothed K)
    const smoothedD = sma(smoothedK.map(x => x || 50), smoothD);

    // Sinyal belirleme
    const lastK = smoothedK[smoothedK.length - 1] || 50;
    const lastD = smoothedD[smoothedD.length - 1] || 50;
    const prevK = smoothedK[smoothedK.length - 2] || 50;
    const prevD = smoothedD[smoothedD.length - 2] || 50;

    let signal: Signal = 'BEKLE';
    if (prevK <= prevD && lastK > lastD) signal = 'AL';
    else if (prevK >= prevD && lastK < lastD) signal = 'SAT';

    return {
        k: smoothedK,
        d: smoothedD,
        signal,
    };
}

/**
 * Tüm indikatörleri çalıştır ve özet döndür
 */
export function tumIndikatorler(candles: Candle[]): IndicatorResult[] {
    const mostResult = most(candles);
    const alphaResult = alphaTrend(candles);
    const superTrendResult = superTrend(candles);
    const stochResult = stochasticRSI(candles);

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
        {
            name: 'SuperTrend',
            value: superTrendResult.line[superTrendResult.line.length - 1],
            signal: superTrendResult.signal,
            description: `SuperTrend trend: ${superTrendResult.signal}`,
        },
        {
            name: 'StochRSI',
            value: stochResult.k[stochResult.k.length - 1],
            signal: stochResult.signal,
            description: `StochRSI momentum: ${stochResult.signal}`,
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
    superTrend,
    kivancHL,
    stochasticRSI,
    tumIndikatorler,
};
