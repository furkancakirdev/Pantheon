/**
 * AutoPilot - Paper Trading & Al-Sat Motoru
 * Pantheon Trading OS v1.0
 * 
 * Bu modül:
 * - Sanal portföy yönetimi (Paper Trading)
 * - Council kararlarına göre otomatik al-sat sinyalleri
 * - Stop-loss / Take-profit yönetimi
 * - Position sizing (Kelly Criterion)
 */

// ==================== TYPES ====================

export interface Position {
    symbol: string;
    quantity: number;
    entryPrice: number;
    entryDate: Date;
    currentPrice: number;
    stopLoss: number;
    takeProfit: number;
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
}

export interface AutoPilotTrade {
    id: string;
    symbol: string;
    action: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    timestamp: Date;
    reason: string;
    councilScore: number;
    status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
}

export interface Portfolio {
    cash: number;
    initialCapital: number;
    positions: Position[];
    totalValue: number;
    totalPnL: number;
    totalPnLPercent: number;
    winRate: number;
    trades: AutoPilotTrade[];
}

export interface AutoPilotConfig {
    enabled: boolean;
    mode: 'PAPER' | 'LIVE'; // Sadece PAPER destekleniyor şimdilik
    maxPositionSize: number; // Portföyün max yüzdesi (örn: 0.10 = %10)
    stopLossPercent: number; // Varsayılan stop-loss (örn: 0.05 = %5)
    takeProfitPercent: number; // Varsayılan take-profit (örn: 0.15 = %15)
    minCoreScore: number; // Min Core skoru (AL için)
    minPulseScore: number; // Min Pulse skoru (trade için)
    trailingStopEnabled: boolean;
    trailingStopPercent: number;
}

export interface TradeSignal {
    symbol: string;
    action: 'BUY' | 'SELL' | 'HOLD';
    strength: 'STRONG' | 'MODERATE' | 'WEAK';
    coreScore: number;
    pulseScore: number;
    reason: string;
    suggestedQuantity: number;
    suggestedStopLoss: number;
    suggestedTakeProfit: number;
}

// ==================== DEFAULT CONFIG ====================

const DEFAULT_CONFIG: AutoPilotConfig = {
    enabled: false,
    mode: 'PAPER',
    maxPositionSize: 0.10, // Portföyün max %10'u tek pozisyona
    stopLossPercent: 0.07, // %7 zarar limiti
    takeProfitPercent: 0.15, // %15 kar hedefi
    minCoreScore: 65, // AL için min Core skoru
    minPulseScore: 60, // Trade için min Pulse skoru
    trailingStopEnabled: true,
    trailingStopPercent: 0.05, // %5 trailing stop
};

// ==================== AUTOPILOT ENGINE ====================

export class AutoPilotEngine {
    private portfolio: Portfolio;
    private config: AutoPilotConfig;
    private tradeHistory: AutoPilotTrade[] = [];

    constructor(initialCapital: number = 100000, config: Partial<AutoPilotConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.portfolio = {
            cash: initialCapital,
            initialCapital,
            positions: [],
            totalValue: initialCapital,
            totalPnL: 0,
            totalPnLPercent: 0,
            winRate: 0,
            trades: [],
        };
    }

    // ==================== PORTFOLIO OPS ====================

    getPortfolio(): Portfolio {
        this.updatePortfolioMetrics();
        return { ...this.portfolio };
    }

    getConfig(): AutoPilotConfig {
        return { ...this.config };
    }

    updateConfig(newConfig: Partial<AutoPilotConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    // ==================== TRADE SIGNAL GENERATOR ====================

    generateSignal(
        symbol: string,
        currentPrice: number,
        coreScore: number,
        pulseScore: number,
        councilVerdict: string
    ): TradeSignal {
        // Karar mantığı
        let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
        let strength: 'STRONG' | 'MODERATE' | 'WEAK' = 'WEAK';
        let reason = '';

        // Mevcut pozisyon kontrolü
        const existingPosition = this.portfolio.positions.find(p => p.symbol === symbol);

        // AL sinyali kontrolü
        if (!existingPosition) {
            if (coreScore >= 80 && pulseScore >= 70 && councilVerdict.includes('GÜÇLÜ AL')) {
                action = 'BUY';
                strength = 'STRONG';
                reason = `Core: ${coreScore}, Pulse: ${pulseScore} - Council: ${councilVerdict}`;
            } else if (coreScore >= this.config.minCoreScore && pulseScore >= this.config.minPulseScore) {
                if (councilVerdict.includes('AL')) {
                    action = 'BUY';
                    strength = coreScore >= 75 ? 'MODERATE' : 'WEAK';
                    reason = `Core: ${coreScore}, Pulse: ${pulseScore} - Council onaylı`;
                }
            }
        }

        // SAT sinyali kontrolü (mevcut pozisyon varsa)
        if (existingPosition) {
            // Stop-loss tetiklendi mi?
            if (currentPrice <= existingPosition.stopLoss) {
                action = 'SELL';
                strength = 'STRONG';
                reason = `STOP-LOSS tetiklendi: ${existingPosition.stopLoss.toFixed(2)} TL`;
            }
            // Take-profit tetiklendi mi?
            else if (currentPrice >= existingPosition.takeProfit) {
                action = 'SELL';
                strength = 'STRONG';
                reason = `TAKE-PROFIT tetiklendi: ${existingPosition.takeProfit.toFixed(2)} TL`;
            }
            // Council SAT dedi mi?
            else if (councilVerdict.includes('SAT') && pulseScore < 40) {
                action = 'SELL';
                strength = councilVerdict.includes('GÜÇLÜ') ? 'STRONG' : 'MODERATE';
                reason = `Council: ${councilVerdict}, Pulse düşük: ${pulseScore}`;
            }
        }

        // Position sizing (Kelly Criterion simplified)
        const suggestedQuantity = this.calculatePositionSize(currentPrice, coreScore);
        const suggestedStopLoss = currentPrice * (1 - this.config.stopLossPercent);
        const suggestedTakeProfit = currentPrice * (1 + this.config.takeProfitPercent);

        return {
            symbol,
            action,
            strength,
            coreScore,
            pulseScore,
            reason,
            suggestedQuantity,
            suggestedStopLoss,
            suggestedTakeProfit,
        };
    }

    // ==================== TRADE EXECUTION ====================

    executeTrade(signal: TradeSignal, currentPrice: number): AutoPilotTrade | null {
        if (!this.config.enabled) {
            console.log('⚠️ AutoPilot devre dışı');
            return null;
        }

        if (signal.action === 'HOLD') {
            return null;
        }

        const tradeId = `T-${Date.now()}-${signal.symbol}`;

        if (signal.action === 'BUY') {
            return this.executeBuy(tradeId, signal, currentPrice);
        } else {
            return this.executeSell(tradeId, signal, currentPrice);
        }
    }

    private executeBuy(tradeId: string, signal: TradeSignal, price: number): AutoPilotTrade | null {
        const cost = signal.suggestedQuantity * price;

        if (cost > this.portfolio.cash) {
            console.log(`❌ Yetersiz bakiye: ${this.portfolio.cash.toFixed(2)} TL`);
            return null;
        }

        // Pozisyon aç
        const position: Position = {
            symbol: signal.symbol,
            quantity: signal.suggestedQuantity,
            entryPrice: price,
            entryDate: new Date(),
            currentPrice: price,
            stopLoss: signal.suggestedStopLoss,
            takeProfit: signal.suggestedTakeProfit,
            unrealizedPnL: 0,
            unrealizedPnLPercent: 0,
        };

        this.portfolio.positions.push(position);
        this.portfolio.cash -= cost;

        const trade: AutoPilotTrade = {
            id: tradeId,
            symbol: signal.symbol,
            action: 'BUY',
            quantity: signal.suggestedQuantity,
            price,
            timestamp: new Date(),
            reason: signal.reason,
            councilScore: signal.coreScore,
            status: 'EXECUTED',
        };

        this.portfolio.trades.push(trade);
        this.tradeHistory.push(trade);

        console.log(`✅ AL: ${signal.symbol} x${signal.suggestedQuantity} @ ${price.toFixed(2)} TL`);
        return trade;
    }

    private executeSell(tradeId: string, signal: TradeSignal, price: number): AutoPilotTrade | null {
        const positionIndex = this.portfolio.positions.findIndex(p => p.symbol === signal.symbol);

        if (positionIndex === -1) {
            console.log(`❌ Pozisyon bulunamadı: ${signal.symbol}`);
            return null;
        }

        const position = this.portfolio.positions[positionIndex];
        const proceeds = position.quantity * price;
        const pnl = proceeds - (position.quantity * position.entryPrice);

        // Pozisyonu kapat
        this.portfolio.positions.splice(positionIndex, 1);
        this.portfolio.cash += proceeds;

        const trade: AutoPilotTrade = {
            id: tradeId,
            symbol: signal.symbol,
            action: 'SELL',
            quantity: position.quantity,
            price,
            timestamp: new Date(),
            reason: `${signal.reason} | PnL: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} TL`,
            councilScore: signal.coreScore,
            status: 'EXECUTED',
        };

        this.portfolio.trades.push(trade);
        this.tradeHistory.push(trade);

        console.log(`✅ SAT: ${signal.symbol} x${position.quantity} @ ${price.toFixed(2)} TL | PnL: ${pnl.toFixed(2)} TL`);
        return trade;
    }

    // ==================== POSITION SIZING ====================

    private calculatePositionSize(price: number, confidence: number): number {
        // Simplified Kelly Criterion
        // f = (bp - q) / b
        // b = odds, p = win probability, q = loss probability

        // Confidence'ı win probability olarak kullan
        const winProb = Math.min(confidence / 100, 0.75); // Max %75
        const lossProb = 1 - winProb;
        const odds = this.config.takeProfitPercent / this.config.stopLossPercent;

        let kellyFraction = (odds * winProb - lossProb) / odds;
        kellyFraction = Math.max(0, Math.min(kellyFraction, this.config.maxPositionSize));

        // Half-Kelly (daha konservatif)
        kellyFraction = kellyFraction / 2;

        const positionValue = this.portfolio.totalValue * kellyFraction;
        const quantity = Math.floor(positionValue / price);

        return Math.max(1, quantity); // En az 1 lot
    }

    // ==================== TRAILING STOP ====================

    updateTrailingStops(priceUpdates: Map<string, number>): void {
        if (!this.config.trailingStopEnabled) return;

        for (const position of this.portfolio.positions) {
            const newPrice = priceUpdates.get(position.symbol);
            if (!newPrice) continue;

            position.currentPrice = newPrice;

            // Fiyat yükseldi mi?
            if (newPrice > position.entryPrice) {
                const newStopLoss = newPrice * (1 - this.config.trailingStopPercent);

                // Yeni stop-loss eskisinden yüksekse güncelle
                if (newStopLoss > position.stopLoss) {
                    position.stopLoss = newStopLoss;
                    console.log(`📈 Trailing stop güncellendi: ${position.symbol} → ${newStopLoss.toFixed(2)} TL`);
                }
            }

            // PnL güncelle
            position.unrealizedPnL = (newPrice - position.entryPrice) * position.quantity;
            position.unrealizedPnLPercent = ((newPrice - position.entryPrice) / position.entryPrice) * 100;
        }

        this.updatePortfolioMetrics();
    }

    // ==================== METRICS ====================

    private updatePortfolioMetrics(): void {
        // Pozisyonların toplam değeri
        const positionsValue = this.portfolio.positions.reduce(
            (sum, p) => sum + p.currentPrice * p.quantity,
            0
        );

        this.portfolio.totalValue = this.portfolio.cash + positionsValue;
        this.portfolio.totalPnL = this.portfolio.totalValue - this.portfolio.initialCapital;
        this.portfolio.totalPnLPercent = (this.portfolio.totalPnL / this.portfolio.initialCapital) * 100;

        // Win rate hesapla
        const closedTrades = this.tradeHistory.filter(t => t.action === 'SELL');
        if (closedTrades.length > 0) {
            const winningTrades = closedTrades.filter(t => t.reason.includes('+'));
            this.portfolio.winRate = (winningTrades.length / closedTrades.length) * 100;
        }
    }

    // ==================== REPORTING ====================

    getPerformanceReport(): string {
        this.updatePortfolioMetrics();

        const report = `
╔══════════════════════════════════════════════════════════╗
║              🚀 AUTOPILOT PERFORMANS RAPORU              ║
╠══════════════════════════════════════════════════════════╣
║  Başlangıç Sermayesi:  ${this.portfolio.initialCapital.toLocaleString('tr-TR').padStart(15)} TL       ║
║  Mevcut Değer:         ${this.portfolio.totalValue.toLocaleString('tr-TR').padStart(15)} TL       ║
║  Toplam Kar/Zarar:     ${(this.portfolio.totalPnL >= 0 ? '+' : '') + this.portfolio.totalPnL.toLocaleString('tr-TR').padStart(14)} TL       ║
║  Getiri:               ${(this.portfolio.totalPnLPercent >= 0 ? '+' : '') + this.portfolio.totalPnLPercent.toFixed(2).padStart(14)}%        ║
╠══════════════════════════════════════════════════════════╣
║  Nakit:                ${this.portfolio.cash.toLocaleString('tr-TR').padStart(15)} TL       ║
║  Açık Pozisyon:        ${this.portfolio.positions.length.toString().padStart(15)} adet     ║
║  Toplam İşlem:         ${this.portfolio.trades.length.toString().padStart(15)} adet     ║
║  Kazanma Oranı:        ${this.portfolio.winRate.toFixed(1).padStart(14)}%        ║
╚══════════════════════════════════════════════════════════╝
    `.trim();

        return report;
    }

    getPositionsSummary(): string {
        if (this.portfolio.positions.length === 0) {
            return '📭 Açık pozisyon bulunmuyor.';
        }

        let summary = '📊 AÇIK POZİSYONLAR:\n';
        summary += '─'.repeat(60) + '\n';

        for (const pos of this.portfolio.positions) {
            const pnlEmoji = pos.unrealizedPnL >= 0 ? '🟢' : '🔴';
            summary += `${pnlEmoji} ${pos.symbol.padEnd(8)} | `;
            summary += `${pos.quantity} lot @ ${pos.entryPrice.toFixed(2)} TL | `;
            summary += `PnL: ${pos.unrealizedPnL >= 0 ? '+' : ''}${pos.unrealizedPnL.toFixed(2)} TL (${pos.unrealizedPnLPercent.toFixed(1)}%)\n`;
            summary += `   SL: ${pos.stopLoss.toFixed(2)} | TP: ${pos.takeProfit.toFixed(2)}\n`;
        }

        return summary;
    }
}

// ==================== EXPORTS ====================

export default AutoPilotEngine;

// Factory function
export function createAutoPilot(
    initialCapital: number = 100000,
    config: Partial<AutoPilotConfig> = {}
): AutoPilotEngine {
    return new AutoPilotEngine(initialCapital, config);
}
