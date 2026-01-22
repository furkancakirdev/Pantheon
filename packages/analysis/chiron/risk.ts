/**
 * Chiron - Risk Yönetimi ve Portföy Optimizasyonu
 * Argus Terminal'den port edildi.
 * 
 * Amaç: İşlemlerin risk bütçesine, sektör limitlerine ve cooldown sürelerine uygunluğunu denetlemek.
 */

// Basit Trade arayüzü
export interface Trade {
    symbol: string;
    entryPrice: number;
    quantity: number;
    stopLoss?: number;
    sector?: string;
    isOpen: boolean;
}

export interface Signal {
    action: 'BUY' | 'SELL';
    symbol: string;
    quantity: number;
    reason: string;
}

export interface RiskDecision {
    approved: boolean;
    adjustedQuantity: number;
    reason: string;
}

export class ChironEngine {
    private static instance: ChironEngine;

    // Konfigürasyon
    private readonly MAX_RISK_R = 2.0; // Maksimum %2 risk
    private readonly MAX_SECTOR_COUNT = 3; // Aynı sektörden max hisse
    private readonly COOLDOWN_MINUTES = 60; // İşlem arası bekleme

    // Durum
    private lastTradeTime: Map<string, number> = new Map();

    private constructor() { }

    public static getInstance(): ChironEngine {
        if (!ChironEngine.instance) {
            ChironEngine.instance = new ChironEngine();
        }
        return ChironEngine.instance;
    }

    /**
     * Bir sinyali risk kurallarına göre değerlendir
     */
    public review(
        signal: Signal,
        portfolio: Trade[],
        grandCouncilScore: number, // 0-100 (Konsensus)
        equity: number // Toplam Portföy Değeri
    ): RiskDecision {

        // Satış sinyalleri genellikle onaylanır (Risk azaltma)
        if (signal.action === 'SELL') {
            return { approved: true, adjustedQuantity: signal.quantity, reason: 'Satış (Risk Azaltma) Onaylandı' };
        }

        // 1. Cooldown Kontrolü
        const lastTime = this.lastTradeTime.get(signal.symbol);
        if (lastTime) {
            const elapsedMinutes = (Date.now() - lastTime) / (1000 * 60);
            if (elapsedMinutes < this.COOLDOWN_MINUTES) {
                return {
                    approved: false,
                    adjustedQuantity: 0,
                    reason: `Cooldown Aktif (${Math.round(this.COOLDOWN_MINUTES - elapsedMinutes)}dk kaldı)`
                };
            }
        }

        // 2. Maksimum Pozisyon Kontrolü (Opsiyonel, şimdilik atlandı)

        // 3. Sektör Doygunluk Kontrolü
        if (signal.action === 'BUY') {
            // Mock portfolio verisinde sektör varsa kontrol et
            // TODO: Gerçek implementasyonda sektör bilgisini al
        }

        // 4. Güven Seviyesine Göre Miktar Ayarlama (Heimdall)
        let finalQuantity = signal.quantity;
        let note = '';

        if (grandCouncilScore < 70) {
            // Düşük güven, miktarı azalt
            finalQuantity = Math.floor(signal.quantity * 0.7);
            note = '[Chiron: Güven < 70, miktar %30 azaltıldı]';
        } else if (grandCouncilScore >= 90) {
            // Yüksek güven, tam miktar
            note = '[Chiron: Yüksek Güven]';
        }

        // 5. İşlemi Kaydet
        if (finalQuantity > 0) {
            this.lastTradeTime.set(signal.symbol, Date.now());
            return {
                approved: true,
                adjustedQuantity: finalQuantity,
                reason: `Onaylandı. ${note}`
            };
        } else {
            return { approved: false, adjustedQuantity: 0, reason: 'Miktar 0' };
        }
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
                riskAmount = (trade.entryPrice - trade.stopLoss) * trade.quantity;
            } else {
                // Stop loss yoksa %10 varsayılan risk
                riskAmount = (trade.entryPrice * trade.quantity) * 0.10;
            }

            const riskPercent = (riskAmount / equity) * 100;
            totalRisk += riskPercent;
        }

        return totalRisk;
    }
}

export default ChironEngine.getInstance();
