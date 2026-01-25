/**
 * Aether API - Makroekonomik Veriler
 * Kaynaklar: FRED, Mynet (Döviz/Altın)
 */

import { NextResponse } from 'next/server';
import { fred } from '../../../../../../packages/api-clients/fred';
import { fetchRealTimeMarket } from '../../../../../../packages/api-clients/mynet';

export async function GET() {
    try {
        // Paralel veri çekimi
        const [vix, faiz, enflasyon, piyasa] = await Promise.all([
            fred.getLastObservation('VIXCLS'),    // VIX Endeksi
            fred.getLastObservation('DGS10'),     // ABD 10 Yıllık Tahvil
            fred.getLastObservation('CPIAUCSL'),  // ABD Enflasyon (TÜFE)
            fetchRealTimeMarket().catch(() => null) // Yerel Piyasa (Dolar/Altın)
        ]);

        // Verileri işle
        const indicators = [
            {
                name: 'VIX (Korku Endeksi)',
                value: vix?.value.toFixed(2) ?? 'N/A',
                signal: (vix?.value || 0) < 20 ? 'GÜVENLİ' : 'RİSKLİ',
                status: (vix?.value || 0) < 20 ? 'pozitif' : 'negatif'
            },
            {
                name: 'ABD 10Y Tahvil',
                value: `%${faiz?.value.toFixed(2) ?? 'N/A'}`,
                signal: (faiz?.value || 0) > 4.5 ? 'YÜKSEK' : 'NORMAL',
                status: (faiz?.value || 0) > 4.5 ? 'negatif' : 'notr'
            },
            {
                name: 'ABD Enflasyon (Endeks)',
                value: enflasyon?.value.toString() ?? 'N/A',
                signal: 'İZLENMELİ',
                status: 'notr'
            },
            {
                name: 'Dolar/TL',
                value: piyasa?.dolar?.satis.toFixed(4) ?? '37.22', // Fallback to mock value if fetch fails
                signal: 'YÜKSELİŞ',
                status: 'negatif'
            }
        ];

        // Rejim Belirleme (Basit Mantık)
        let score = 50;
        if ((vix?.value || 20) < 15) score += 20;
        if ((vix?.value || 20) > 25) score -= 20;
        if ((faiz?.value || 4) < 4.0) score += 10;

        let regime = 'NEUTRAL';
        if (score >= 70) regime = 'RISK_ON';
        else if (score <= 30) regime = 'RISK_OFF';

        // Yanıt
        return NextResponse.json({
            success: true,
            data: {
                regime,
                score,
                allocation: getMockAllocation(regime), // Şimdilik statik alokasyon mantığı
                indicators
            }
        });

    } catch (error) {
        console.error('Aether API Error:', error);
        return NextResponse.json({ success: false, message: 'Veri hatası' }, { status: 500 });
    }
}

function getMockAllocation(regime: string) {
    if (regime === 'RISK_ON') return { equity: 80, bond: 10, gold: 10, cash: 0 };
    if (regime === 'RISK_OFF') return { equity: 20, bond: 40, gold: 30, cash: 10 };
    return { equity: 50, bond: 30, gold: 10, cash: 10 };
}
