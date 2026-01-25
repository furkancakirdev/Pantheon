/**
 * Cronos - Zamanlama Faktörü Modülü
 * 
 * "Ne zaman aldığın, ne aldığın kadar önemli."
 * 
 * Faktörler:
 * 1. Saat (20%): 09:30 açılış vs 17:30 kapanış volatilitesi
 * 2. Haftanın Günü (20%): Pazartesi efekti, Cuma rotasyonu
 * 3. Ay Sonu / Çeyrek Sonu (20%): Window dressing
 * 4. Kazanç Sezonu (20%): Earnings dönemleri
 * 5. Tatil/Özel Günler (10%): Bayram öncesi, vb.
 * 6. Volatilite Saatleri (10%): VIX spike dönemleri
 */

export interface CronosResult {
    score: number;          // 0-100
    timing: 'UYGUN' | 'NOTR' | 'UYGUNSUZ';
    factors: CronosFactor[];
    summary: string;
}

export interface CronosFactor {
    name: string;
    score: number;          // 0-100
    weight: number;         // %
    description: string;
}

export class CronosEngine {
    private static instance: CronosEngine;

    private constructor() { }

    public static getInstance(): CronosEngine {
        if (!CronosEngine.instance) {
            CronosEngine.instance = new CronosEngine();
        }
        return CronosEngine.instance;
    }

    public analyze(date: Date = new Date()): CronosResult {
        const factors: CronosFactor[] = [];

        // 1. Saat Faktörü (20%)
        const hourFactor = this.analyzeHour(date);
        factors.push({ name: 'Saat', ...hourFactor, weight: 20 });

        // 2. Gün Faktörü (20%)
        const dayFactor = this.analyzeDay(date);
        factors.push({ name: 'Haftanın Günü', ...dayFactor, weight: 20 });

        // 3. Ay/Çeyrek Sonu (20%)
        const monthEndFactor = this.analyzeMonthEnd(date);
        factors.push({ name: 'Ay/Çeyrek Sonu', ...monthEndFactor, weight: 20 });

        // 4. Kazanç Sezonu (20%)
        const earningsFactor = this.analyzeEarningsSeason(date);
        factors.push({ name: 'Kazanç Sezonu', ...earningsFactor, weight: 20 });

        // 5. Tatil/Özel Günler (10%)
        const holidayFactor = this.analyzeHolidays(date);
        factors.push({ name: 'Tatil/Özel Gün', ...holidayFactor, weight: 10 });

        // 6. Genel Volatilite (10%)
        const volFactor = { score: 60, description: 'Normal volatilite' };
        factors.push({ name: 'Volatilite', ...volFactor, weight: 10 });

        // Ağırlıklı toplam
        const score = factors.reduce((sum, f) => sum + (f.score * f.weight / 100), 0);

        const timing = score >= 65 ? 'UYGUN' : score <= 35 ? 'UYGUNSUZ' : 'NOTR';
        const summary = this.generateSummary(factors, timing);

        return { score, timing, factors, summary };
    }

    private analyzeHour(date: Date): { score: number; description: string } {
        const hour = date.getHours();
        const minute = date.getMinutes();
        const time = hour + minute / 60;

        // Optimal: 10:00 - 11:30 ve 14:00 - 15:30
        if ((time >= 10 && time <= 11.5) || (time >= 14 && time <= 15.5)) {
            return { score: 85, description: 'Optimal işlem saati' };
        }
        // Açılış volatilitesi: 09:30 - 10:00
        if (time >= 9.5 && time < 10) {
            return { score: 50, description: 'Açılış volatilitesi - dikkat' };
        }
        // Kapanış: 17:00 - 18:00
        if (time >= 17 && time <= 18) {
            return { score: 60, description: 'Kapanış saati' };
        }
        // Öğle arası: 12:00 - 13:30
        if (time >= 12 && time <= 13.5) {
            return { score: 70, description: 'Öğle arası - düşük hacim' };
        }
        // Piyasa dışı
        if (time < 9.5 || time > 18) {
            return { score: 40, description: 'Piyasa kapalı' };
        }
        return { score: 65, description: 'Normal işlem saati' };
    }

    private analyzeDay(date: Date): { score: number; description: string } {
        const day = date.getDay();

        switch (day) {
            case 1: // Pazartesi
                return { score: 55, description: 'Pazartesi efekti - dikkat' };
            case 2: // Salı
                return { score: 75, description: 'Salı - olumlu' };
            case 3: // Çarşamba
                return { score: 80, description: 'Çarşamba - optimal' };
            case 4: // Perşembe
                return { score: 75, description: 'Perşembe - olumlu' };
            case 5: // Cuma
                return { score: 60, description: 'Cuma - hafta sonu riski' };
            default: // Hafta sonu
                return { score: 20, description: 'Hafta sonu - piyasa kapalı' };
        }
    }

    private analyzeMonthEnd(date: Date): { score: number; description: string } {
        const day = date.getDate();
        const month = date.getMonth();
        const daysInMonth = new Date(date.getFullYear(), month + 1, 0).getDate();

        // Son 3 gün
        if (day >= daysInMonth - 2) {
            const isQuarterEnd = (month + 1) % 3 === 0;
            if (isQuarterEnd) {
                return { score: 45, description: 'Çeyrek sonu - window dressing' };
            }
            return { score: 55, description: 'Ay sonu - portföy düzenlemesi' };
        }
        // Ay başı (ilk 3 gün)
        if (day <= 3) {
            return { score: 70, description: 'Ay başı - yeni alımlar' };
        }
        return { score: 65, description: 'Ay ortası - normal' };
    }

    private analyzeEarningsSeason(date: Date): { score: number; description: string } {
        const month = date.getMonth();

        // Türkiye'de bilanço dönemleri: Ocak, Nisan, Temmuz, Ekim
        const earningsMonths = [0, 3, 6, 9];

        if (earningsMonths.includes(month)) {
            return { score: 50, description: 'Bilanço sezonu - volatilite yüksek' };
        }
        // Bilanço öncesi ay
        if (earningsMonths.includes((month + 1) % 12)) {
            return { score: 60, description: 'Bilanço öncesi - beklenti dönemi' };
        }
        return { score: 70, description: 'Normal dönem' };
    }

    private analyzeHolidays(date: Date): { score: number; description: string } {
        const month = date.getMonth();
        const day = date.getDate();

        // Ramazan ve Kurban Bayramı (yaklaşık tarihler - her yıl değişir)
        // Bu basitleştirilmiş versiyon, gerçek uygulamada takvim API kullanılmalı

        // Yılbaşı yakını
        if (month === 11 && day >= 25) {
            return { score: 40, description: 'Yılbaşı yaklaşıyor - düşük hacim' };
        }
        if (month === 0 && day <= 5) {
            return { score: 45, description: 'Yeni yıl - düşük hacim' };
        }

        // 23 Nisan, 19 Mayıs, 30 Ağustos, 29 Ekim
        const holidays: [number, number][] = [[3, 23], [4, 19], [7, 30], [9, 29]];
        for (const [m, d] of holidays) {
            if (month === m && Math.abs(day - d) <= 1) {
                return { score: 50, description: 'Resmi tatil yakını' };
            }
        }

        return { score: 75, description: 'Normal gün' };
    }

    private generateSummary(factors: CronosFactor[], timing: string): string {
        const best = factors.reduce((a, b) => a.score > b.score ? a : b);
        const worst = factors.reduce((a, b) => a.score < b.score ? a : b);

        return `Zamanlama ${timing}. En olumlu: ${best.name}. Dikkat: ${worst.name}.`;
    }
}

export default CronosEngine.getInstance();
