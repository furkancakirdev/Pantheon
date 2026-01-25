/**
 * Atlas V3 - Yaşar Erdinç + Genişletilmiş Temel Analiz Motoru
 * 
 * Erdinç Kriterleri (5):
 * 1. F/K vs Sektör Ortalaması
 * 2. PD/DD < 2
 * 3. ROE > %15
 * 4. Borç/Özkaynak < 1
 * 5. İşletme Nakit Akışı Pozitif
 * 
 * Ek Finansal Kriterler (5):
 * 6. Aktif Karlılığı (ROA) >= %8
 * 7. Net Kar Marjı >= %10
 * 8. Serbest Nakit Akışı (FCF) Pozitif
 * 9. Brüt Kar Marjı >= %25
 * 10. ROIC >= %10
 */

export interface FundamentalData {
    lastPrice: number;
    eps: number;                   // Hisse Başına Kar (TTM)
    bookValuePerShare: number;     // Özsermaye / Hisse Sayısı
    sectorAvgFK: number;           // Sektör Ortalama F/K
    roe: number;                   // Özkaynak Karlılığı (%)
    roa: number;                   // Aktif Karlılığı (%)
    roic: number;                  // Yatırılan Sermaye Getirisi (%)
    debtToEquity: number;          // Borç / Özkaynak
    operatingCashFlow: number;     // İşletme Nakit Akışı
    freeCashFlow: number;          // Serbest Nakit Akışı (FCF)
    netProfitMargin: number;       // Net Kar Marjı (%)
    grossProfitMargin: number;     // Brüt Kar Marjı (%)
}

export interface AtlasResult {
    symbol: string;
    dynamicFK: number;
    dynamicPDDD: number;
    score: number;                 // 0-100
    letterGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    verdict: 'GÜÇLÜ AL' | 'AL' | 'TUT' | 'SAT' | 'GÜÇLÜ SAT';
    erdincChecklist: ChecklistItem[];
    extendedChecklist: ChecklistItem[];
    summary: string;
}

export interface ChecklistItem {
    rule: string;
    passed: boolean;
    value: string;
    weight: number;
}

export class AtlasEngine {
    private static instance: AtlasEngine;

    private constructor() { }

    public static getInstance(): AtlasEngine {
        if (!AtlasEngine.instance) {
            AtlasEngine.instance = new AtlasEngine();
        }
        return AtlasEngine.instance;
    }

    public analyze(symbol: string, data: FundamentalData): AtlasResult {
        // 1. Dinamik Oran Hesaplama
        const dynamicFK = data.eps > 0 ? data.lastPrice / data.eps : 999;
        const dynamicPDDD = data.bookValuePerShare > 0 ? data.lastPrice / data.bookValuePerShare : 999;

        // 2. Yaşar Erdinç Kontrol Listesi (50 puan)
        const erdincChecklist: ChecklistItem[] = [];
        let erdincScore = 0;

        // Erdinç Kural 1: F/K < Sektör (10p)
        const fkVsSector = dynamicFK < data.sectorAvgFK;
        erdincChecklist.push({ rule: 'F/K < Sektör', passed: fkVsSector, value: `${dynamicFK.toFixed(1)} vs ${data.sectorAvgFK.toFixed(1)}`, weight: 10 });
        if (fkVsSector) erdincScore += 10;

        // Erdinç Kural 2: PD/DD < 2 (10p)
        const pdddOk = dynamicPDDD < 2;
        erdincChecklist.push({ rule: 'PD/DD < 2', passed: pdddOk, value: dynamicPDDD.toFixed(2), weight: 10 });
        if (pdddOk) erdincScore += 10;

        // Erdinç Kural 3: ROE > %15 (10p)
        const roeOk = data.roe > 15;
        erdincChecklist.push({ rule: 'ROE > %15', passed: roeOk, value: `%${data.roe.toFixed(1)}`, weight: 10 });
        if (roeOk) erdincScore += 10;

        // Erdinç Kural 4: Borç/Özkaynak < 1 (10p)
        const debtOk = data.debtToEquity < 1;
        erdincChecklist.push({ rule: 'Borç/Özkaynak < 1', passed: debtOk, value: data.debtToEquity.toFixed(2), weight: 10 });
        if (debtOk) erdincScore += 10;

        // Erdinç Kural 5: İşletme Nakit Akışı > 0 (10p)
        const cashFlowOk = data.operatingCashFlow > 0;
        erdincChecklist.push({ rule: 'İşletme Nakit Akışı > 0', passed: cashFlowOk, value: this.formatCurrency(data.operatingCashFlow), weight: 10 });
        if (cashFlowOk) erdincScore += 10;

        // 3. Genişletilmiş Finansal Kriterler (50 puan)
        const extendedChecklist: ChecklistItem[] = [];
        let extendedScore = 0;

        // Ek Kural 1: Aktif Karlılığı (ROA) >= %8 (10p)
        const roaOk = data.roa >= 8;
        extendedChecklist.push({ rule: 'Aktif Karlılığı >= %8', passed: roaOk, value: `%${data.roa.toFixed(1)}`, weight: 10 });
        if (roaOk) extendedScore += 10;

        // Ek Kural 2: Net Kar Marjı >= %10 (10p)
        const npmOk = data.netProfitMargin >= 10;
        extendedChecklist.push({ rule: 'Net Kar Marjı >= %10', passed: npmOk, value: `%${data.netProfitMargin.toFixed(1)}`, weight: 10 });
        if (npmOk) extendedScore += 10;

        // Ek Kural 3: Serbest Nakit Akışı (FCF) > 0 (10p)
        const fcfOk = data.freeCashFlow > 0;
        extendedChecklist.push({ rule: 'Serbest Nakit Akışı > 0', passed: fcfOk, value: this.formatCurrency(data.freeCashFlow), weight: 10 });
        if (fcfOk) extendedScore += 10;

        // Ek Kural 4: Brüt Kar Marjı >= %25 (10p)
        const gpmOk = data.grossProfitMargin >= 25;
        extendedChecklist.push({ rule: 'Brüt Kar Marjı >= %25', passed: gpmOk, value: `%${data.grossProfitMargin.toFixed(1)}`, weight: 10 });
        if (gpmOk) extendedScore += 10;

        // Ek Kural 5: ROIC >= %10 (10p)
        const roicOk = data.roic >= 10;
        extendedChecklist.push({ rule: 'ROIC >= %10', passed: roicOk, value: `%${data.roic.toFixed(1)}`, weight: 10 });
        if (roicOk) extendedScore += 10;

        // 4. Toplam Skor
        const totalScore = erdincScore + extendedScore;
        const letterGrade = this.getLetterGrade(totalScore);
        const verdict = this.getVerdict(totalScore);
        const summary = this.generateSummary(erdincChecklist, extendedChecklist, totalScore);

        return {
            symbol,
            dynamicFK,
            dynamicPDDD,
            score: totalScore,
            letterGrade,
            verdict,
            erdincChecklist,
            extendedChecklist,
            summary,
        };
    }

    private getLetterGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
        if (score >= 80) return 'A';
        if (score >= 60) return 'B';
        if (score >= 40) return 'C';
        if (score >= 20) return 'D';
        return 'F';
    }

    private getVerdict(score: number): 'GÜÇLÜ AL' | 'AL' | 'TUT' | 'SAT' | 'GÜÇLÜ SAT' {
        if (score >= 80) return 'GÜÇLÜ AL';
        if (score >= 60) return 'AL';
        if (score >= 40) return 'TUT';
        if (score >= 20) return 'SAT';
        return 'GÜÇLÜ SAT';
    }

    private generateSummary(erdinc: ChecklistItem[], extended: ChecklistItem[], score: number): string {
        const erdincPassed = erdinc.filter(c => c.passed).length;
        const extendedPassed = extended.filter(c => c.passed).length;
        const totalPassed = erdincPassed + extendedPassed;

        if (totalPassed >= 8) return `${totalPassed}/10 kriter karşılandı. Mükemmel finansal sağlık.`;
        if (totalPassed >= 6) return `${totalPassed}/10 kriter karşılandı. Güçlü temeller.`;
        if (totalPassed >= 4) return `${totalPassed}/10 kriter karşılandı. Ortalama durum.`;
        if (totalPassed >= 2) return `${totalPassed}/10 kriter karşılandı. Zayıf finansallar.`;
        return 'Kritik: Çok az kriter karşılanıyor. Yüksek risk.';
    }

    private formatCurrency(value: number): string {
        if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(1)}Mr TL`;
        if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}Mn TL`;
        return `${value.toLocaleString('tr-TR')} TL`;
    }
}

export default AtlasEngine.getInstance();
