/**
 * Chiron V2 - Risk Yönetimi ve Portföy Optimizasyonu
 * Argus Terminal'den port edildi ve genişletildi.
 *
 * Özellikler:
 * - Risk bütçesi yönetimi (R-birimi)
 * - Sektör limit kontrolü
 * - Position sizing (Kelly kriteri, Sabit yüzde)
 * - Cooldown yönetimi
 * - VaR (Value at Risk) hesaplama
 * - Stop loss önerileri
 * - Portföy dağılım analizi
 */

// ============ TİP TANIMLARI ============

export interface Trade {
    symbol: string;
    entryPrice: number;
    quantity: number;
    stopLoss?: number;
    takeProfit?: number;
    sector?: string;
    isOpen: boolean;
    entryDate?: Date;
}

export interface ChironSignal {
    action: 'BUY' | 'SELL';
    symbol: string;
    price: number;
    reason: string;
    confidence?: number; // 0-100
    sector?: string;
}

export interface RiskDecision {
    approved: boolean;
    adjustedQuantity: number;
    suggestedStopLoss?: number;
    suggestedTakeProfit?: number;
    riskR?: number; // Risk birimi
    reason: string;
    warnings: string[];
}

export interface RiskMetrics {
    totalRiskR: number; // Toplam risk birimi
    sectorExposure: Record<string, number>; // Sektör bazlı dağılım
    maxDrawdown: number; // Maksimum drawdown
    var95: number; // Value at Risk 95%
    portfolioBeta?: number; // Portföy beta
    concentrationRisk: number; // Konsantrasyon riski 0-100
}

export interface PositionSizeResult {
    shares: number;
    riskR: number;
    reason: string;
}

export type RiskMethod = 'FIXED_PERCENT' | 'FIXED_R' | 'KELLY' | 'VOLATILITY';

export interface ChironConfig {
    maxRiskR: number; // Maksimum risk birimi (genelde %2)
    maxSectorExposure: number; // Bir sektörden max % (genelde %30)
    cooldownMinutes: number; // İşlem arası bekleme süresi
    defaultStopLoss: number; // Varsayılan stop loss %
    riskMethod: RiskMethod; // Position sizing metodu
    maxOpenPositions: number; // Aynı anda max açık pozisyon
}

// ============ CHIRON ENGINE ============

export class ChironEngine {
    private static instance: ChironEngine;

    // Varsayılan Konfigürasyon
    private config: ChironConfig = {
        maxRiskR: 2.0,
        maxSectorExposure: 30,
        cooldownMinutes: 60,
        defaultStopLoss: 10,
        riskMethod: 'FIXED_R',
        maxOpenPositions: 8,
    };

    // Durum
    private lastTradeTime: Map<string, number> = new Map();
    private tradeHistory: Array<{ symbol: string; time: number; action: string }> = [];

    private constructor() { }

    public static getInstance(): ChironEngine {
        if (!ChironEngine.instance) {
            ChironEngine.instance = new ChironEngine();
        }
        return ChironEngine.instance;
    }

    /**
     * Konfigürasyon güncelle
     */
    public setConfig(config: Partial<ChironConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Konfigürasyon oku
     */
    public getConfig(): ChironConfig {
        return { ...this.config };
    }

    /**
     * Bir sinyali risk kurallarına göre değerlendir
     */
    public review(
        signal: ChironSignal,
        portfolio: Trade[],
        grandCouncilScore: number,
        equity: number,
        currentPrice?: number
    ): RiskDecision {

        const warnings: string[] = [];
        let finalQuantity = 0;
        let reason = '';
        let suggestedStopLoss: number | undefined;
        let suggestedTakeProfit: number | undefined;
        let riskR: number | undefined;

        // SATIŞ sinyalleri genellikle onaylanır
        if (signal.action === 'SELL') {
            const position = portfolio.find(p => p.symbol === signal.symbol && p.isOpen);
            if (!position) {
                return {
                    approved: false,
                    adjustedQuantity: 0,
                    reason: 'Pozisyon bulunamadı',
                    warnings: []
                };
            }
            return {
                approved: true,
                adjustedQuantity: position.quantity,
                reason: 'Satış onaylandı',
                warnings: []
            };
        }

        // ========== ALIŞ KONTROLLERİ ==========

        // 1. Cooldown Kontrolü
        const lastTime = this.lastTradeTime.get(signal.symbol);
        if (lastTime) {
            const elapsedMinutes = (Date.now() - lastTime) / (1000 * 60);
            if (elapsedMinutes < this.config.cooldownMinutes) {
                return {
                    approved: false,
                    adjustedQuantity: 0,
                    reason: `Cooldown aktif (${Math.round(this.config.cooldownMinutes - elapsedMinutes)}dk kaldı)`,
                    warnings: []
                };
            }
        }

        // 2. Maksimum Açık Pozisyon Kontrolü
        const openPositions = portfolio.filter(t => t.isOpen).length;
        if (openPositions >= this.config.maxOpenPositions) {
            warnings.push(`Maksimum açık pozisyon sayısına ulaşıldı (${this.config.maxOpenPositions})`);
        }

        // 3. Sektör Doygunluk Kontrolü
        if (signal.sector) {
            const sectorExposure = this.calculateSectorExposure(portfolio, equity);
            const currentSectorExposure = sectorExposure[signal.sector] || 0;

            if (currentSectorExposure >= this.config.maxSectorExposure) {
                return {
                    approved: false,
                    adjustedQuantity: 0,
                    reason: `${signal.sector} sektörü limit dolu (%${currentSectorExposure.toFixed(1)})`,
                    warnings: [`Sektör limiti: %${this.config.maxSectorExposure}`]
                };
            } else if (currentSectorExposure >= this.config.maxSectorExposure * 0.8) {
                warnings.push(`${signal.sector} sektörü limitine yaklaşıyor (%${currentSectorExposure.toFixed(1)})`);
            }
        }

        // 4. Position Size Hesaplama
        const price = currentPrice || signal.price;
        const positionResult = this.calculatePositionSize(
            equity,
            price,
            grandCouncilScore,
            this.config.riskMethod
        );

        // 5. Güven Seviyesine Göre Ayarlama
        if (grandCouncilScore < 60) {
            positionResult.shares = Math.floor(positionResult.shares * 0.5);
            warnings.push('Düşük konsensus (%60 altı), pozisyon %50 azaltıldı');
        } else if (grandCouncilScore < 75) {
            positionResult.shares = Math.floor(positionResult.shares * 0.75);
            warnings.push('Orta konsensus, pozisyon %25 azaltıldı');
        }

        // 6. Stop Loss ve Take Profit Önerileri
        suggestedStopLoss = price * (1 - this.config.defaultStopLoss / 100);
        suggestedTakeProfit = price * (1 + this.config.defaultStopLoss * 2 / 100); // 1:2 risk/ödün

        riskR = positionResult.riskR;
        finalQuantity = positionResult.shares;

        if (finalQuantity > 0) {
            reason = `${positionResult.reason}. Grand Council: ${grandCouncilScore}/100`;

            // İşlemi kaydet
            this.lastTradeTime.set(signal.symbol, Date.now());
            this.tradeHistory.push({
                symbol: signal.symbol,
                time: Date.now(),
                action: 'BUY'
            });

            return {
                approved: true,
                adjustedQuantity: finalQuantity,
                suggestedStopLoss,
                suggestedTakeProfit,
                riskR,
                reason,
                warnings
            };
        }

        return {
            approved: false,
            adjustedQuantity: 0,
            reason: 'Hesaplanan pozisyon büyüklüğü 0',
            warnings
        };
    }

    /**
     * Position Size Hesaplama
     */
    public calculatePositionSize(
        equity: number,
        price: number,
        confidence: number,
        method: RiskMethod = this.config.riskMethod,
        atr?: number,
        volatility?: number
    ): PositionSizeResult {

        let shares = 0;
        let riskR = 0;
        let reason = '';

        switch (method) {
            case 'FIXED_PERCENT':
                // Sabit %(portföy) - genelde %5-10
                const percentOfEquity = 0.05; // %5
                const amount = equity * percentOfEquity;
                shares = Math.floor(amount / price);
                riskR = (this.config.defaultStopLoss / 100) * percentOfEquity * 100;
                reason = `Sabit %5 yöntemi`;
                break;

            case 'FIXED_R':
                // Sabit R-birimi - genelle 1R veya 2R
                const riskAmount = equity * (this.config.maxRiskR / 100);
                const riskPerShare = price * (this.config.defaultStopLoss / 100);
                shares = Math.floor(riskAmount / riskPerShare);
                riskR = this.config.maxRiskR;
                reason = `${this.config.maxRiskR}R yöntemi`;
                break;

            case 'KELLY':
                // Kelly Kriteri - f* = (bp - q) / b
                // b = odds, p = win probability, q = loss probability
                const winProb = confidence / 100;
                const avgWinLoss = 2; // 1:2 risk/ödün varsayımı
                const kellyFraction = (avgWinLoss * winProb - (1 - winProb)) / avgWinLoss;
                // Kelly'yi yarıya indir (daha conservatif)
                const halfKelly = Math.max(0, kellyFraction * 0.5);
                const kellyAmount = equity * halfKelly;
                shares = Math.floor(kellyAmount / price);
                riskR = halfKelly * 100;
                reason = `Half Kelly (%${(halfKelly * 100).toFixed(1)})`;
                break;

            case 'VOLATILITY':
                // Volatilite tabanlı - volatilite yüksekse pozisyon küçük
                const volFactor = volatility || 0.15; // Varsayılan %15 volatilite
                const volAmount = equity * Math.min(0.10, 0.05 / volFactor);
                shares = Math.floor(volAmount / price);
                riskR = (volAmount / equity) * 100;
                reason = `Volatilite tabanlı (%${(volFactor * 100).toFixed(0)})`;
                break;
        }

        return {
            shares: Math.max(0, shares),
            riskR: Math.max(0, riskR),
            reason
        };
    }

    /**
     * Toplam Portföy Riskini Hesapla (R birimi)
     */
    public calculateTotalRiskR(portfolio: Trade[], equity: number): number {
        if (equity <= 0) return 0;

        let totalRisk = 0;

        for (const trade of portfolio) {
            if (!trade.isOpen) continue;

            let riskAmount = 0;
            if (trade.stopLoss) {
                riskAmount = Math.abs(trade.entryPrice - trade.stopLoss) * trade.quantity;
            } else {
                // Stop loss yoksa %10 varsayılan risk
                riskAmount = (trade.entryPrice * trade.quantity) * 0.10;
            }

            const riskPercent = (riskAmount / equity) * 100;
            totalRisk += riskPercent;
        }

        return totalRisk;
    }

    /**
     * Sektör Bazlı Pozisyon Dağılımı
     */
    public calculateSectorExposure(portfolio: Trade[], equity: number): Record<string, number> {
        const exposure: Record<string, number> = {};

        for (const trade of portfolio) {
            if (!trade.isOpen) continue;

            const sector = trade.sector || 'Diğer';
            const value = trade.entryPrice * trade.quantity;
            const percent = (value / equity) * 100;

            exposure[sector] = (exposure[sector] || 0) + percent;
        }

        return exposure;
    }

    /**
     * VaR (Value at Risk) Hesaplama - Monte Carlo yaklaşımı
     */
    public calculateVaR(
        portfolio: Trade[],
        equity: number,
        confidence: number = 95
    ): number {
        if (portfolio.length === 0 || equity <= 0) return 0;

        // Basit VaR hesaplaması - her pozisyon için %95'lik olumsuz senaryo
        let totalVaR = 0;

        for (const trade of portfolio) {
            if (!trade.isOpen) continue;

            const positionValue = trade.entryPrice * trade.quantity;

            // Hisse başına varsayılan günlük volatilite %3
            const dailyVol = 0.03;

            // %95 güven için 1.65 sigma
            const zScore = 1.65;

            const positionVaR = positionValue * dailyVol * zScore;
            totalVaR += positionVaR;
        }

        return (totalVaR / equity) * 100; // Portföy yüzdesi olarak
    }

    /**
     * Konsantrasyon Riski Hesaplama
     */
    public calculateConcentrationRisk(portfolio: Trade[], equity: number): number {
        if (portfolio.length === 0 || equity <= 0) return 0;

        // Herken-Kendall indeksi yaklaşımı
        const positions = portfolio
            .filter(t => t.isOpen)
            .map(t => (t.entryPrice * t.quantity) / equity);

        if (positions.length === 0) return 0;

        // Her bir pozisyonun karesini al ve topla
        const sumSquares = positions.reduce((sum, p) => sum + p * p, 0);

        // 0 = mükemmel dağılım, 1 = tek hissede konsantrasyon
        return Math.min(100, sumSquares * 100);
    }

    /**
     * Portföy Risk Analizi
     */
    public analyzePortfolioRisk(portfolio: Trade[], equity: number): RiskMetrics {
        const sectorExposure = this.calculateSectorExposure(portfolio, equity);
        const totalRiskR = this.calculateTotalRiskR(portfolio, equity);
        const var95 = this.calculateVaR(portfolio, equity, 95);
        const concentrationRisk = this.calculateConcentrationRisk(portfolio, equity);

        // Maksimum drawdown hesaplama (basit yaklaşım)
        const maxDrawdown = Math.max(totalRiskR * 1.5, var95 * 2);

        return {
            totalRiskR,
            sectorExposure,
            maxDrawdown,
            var95,
            concentrationRisk
        };
    }

    /**
     * Stop Loss Seviyesi Öner
     */
    public suggestStopLoss(
        entryPrice: number,
        atr: number,
        method: 'ATR' | 'PERCENT' | 'SUPPORT' = 'PERCENT'
    ): number {
        switch (method) {
            case 'ATR':
                // 2x ATR stop loss
                return entryPrice - (atr * 2);

            case 'PERCENT':
                // Varsayılan %10
                return entryPrice * (1 - this.config.defaultStopLoss / 100);

            case 'SUPPORT':
                // Destek seviyesini bul (basit yaklaşım)
                // Gerçek implementasyonda Perşembe modülü kullanılabilir
                return entryPrice * 0.95;
        }
    }

    /**
     * Trade geçmişini temizle
     */
    public clearHistory(): void {
        this.tradeHistory = [];
        this.lastTradeTime.clear();
    }

    /**
     * Cooldown kontrolü
     */
    public getCooldownRemaining(symbol: string): number {
        const lastTime = this.lastTradeTime.get(symbol);
        if (!lastTime) return 0;

        const elapsed = (Date.now() - lastTime) / (1000 * 60);
        return Math.max(0, this.config.cooldownMinutes - elapsed);
    }
}

export default ChironEngine.getInstance();
