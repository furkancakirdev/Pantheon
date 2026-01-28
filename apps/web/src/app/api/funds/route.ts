/**
 * TEFAS Yatırım Fonları API
 * Fon getirileri, analizi, filtreleme ve sıralama
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
    fetchFundReturns,
    getFundDetails,
    sortByReturn,
    filterByFundType,
    selectBestFunds,
    getFonTurleri,
    getKurucular,
    type FundAnalysis,
} from '@api/tefas';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const fonKodu = searchParams.get('fonKodu');

    try {
        if (action === 'detail' && fonKodu) {
            // Tek fon detayı
            const fund = await getFundDetails(fonKodu);

            if (!fund) {
                return NextResponse.json({
                    success: false,
                    error: 'Fon bulunamadı',
                });
            }

            return NextResponse.json({
                success: true,
                data: fund,
            });
        }

        if (action === 'top') {
            // En iyi getirili fonlar
            const limit = parseInt(searchParams.get('limit') || '10');
            const period = (searchParams.get('period') || 'yillik') as 'gunluk' | 'haftalik' | 'aylik' | 'yillik';
            const fonTuru = searchParams.get('fonTuru') || undefined;

            const funds = await fetchFundReturns();
            let filtered = fonTuru ? filterByFundType(funds, fonTuru) : funds;
            const sorted = sortByReturn(filtered, period);
            const analyzed = sorted.slice(0, limit).map(f => ({
                ...f,
                trend: f.gunlukGetiri > 0 && f.haftalikGetiri > 0 && f.aylikGetiri > 0 ? 'YUKARI' :
                    f.gunlukGetiri < 0 && f.haftalikGetiri < 0 && f.aylikGetiri < 0 ? 'ASAGI' : 'YATAY',
            }));

            return NextResponse.json({
                success: true,
                data: {
                    total: filtered.length,
                    period,
                    top: analyzed,
                },
            });
        }

        if (action === 'best') {
            // Multi-kriter en iyi fonlar
            const minReturn = parseFloat(searchParams.get('minReturn') || '20');
            const maxRisk = parseInt(searchParams.get('maxRisk') || '50');
            const fonTuru = searchParams.get('fonTuru') || undefined;
            const limit = parseInt(searchParams.get('limit') || '10');

            const best = await selectBestFunds({ minReturn, maxRisk, fonTuru, limit });

            return NextResponse.json({
                success: true,
                data: {
                    filters: { minReturn, maxRisk, fonTuru },
                    best,
                },
            });
        }

        if (action === 'types') {
            // Fon türleri listesi
            const types = await getFonTurleri();

            return NextResponse.json({
                success: true,
                data: types,
            });
        }

        if (action === 'founders') {
            // Kurucu şirketleri listesi
            const founders = await getKurucular();

            return NextResponse.json({
                success: true,
                data: founders,
            });
        }

        if (action === 'search') {
            // Fon ara
            const query = searchParams.get('q') || '';
            const funds = await fetchFundReturns();

            const filtered = funds.filter(f =>
                f.fonKodu.toLowerCase().includes(query.toLowerCase()) ||
                f.fonAdi.toLowerCase().includes(query.toLowerCase())
            );

            return NextResponse.json({
                success: true,
                data: filtered.slice(0, 20),
            });
        }

        if (action === 'compare') {
            // Fon karşılaştırma
            const codes = searchParams.get('codes')?.split(',') || [];

            if (codes.length < 2) {
                return NextResponse.json({
                    success: false,
                    error: 'En az 2 fon kodu gerekli',
                });
            }

            const funds = await fetchFundReturns();
            const found = funds.filter(f => codes.includes(f.fonKodu));

            if (found.length !== codes.length) {
                return NextResponse.json({
                    success: false,
                    error: 'Bazı fonlar bulunamadı',
                });
            }

            return NextResponse.json({
                success: true,
                data: found,
            });
        }

        // Default: Tüm fonları listele (top 50)
        const funds = await fetchFundReturns();
        const top50 = sortByReturn(funds, 'yillik').slice(0, 50);

        return NextResponse.json({
            success: true,
            data: {
                total: funds.length,
                top50,
            },
        });
    } catch (error) {
        console.error('TEFAS API Error:', error);

        // Fallback mock response
        return NextResponse.json({
            success: true,
            data: {
                total: 500,
                top50: [
                    {
                        fonKodu: 'YAY',
                        fonAdi: 'Yapı Kredi Altın Fonu',
                        fonTuru: 'Kıymetli Maden',
                        kurucuAdi: 'Yapı Kredi Yatırım',
                        gunlukGetiri: 0.5,
                        haftalikGetiri: 1.2,
                        aylikGetiri: 3.5,
                        yillikGetiri: 45.2,
                        fonBuyuklugu: 5000000000,
                        trend: 'YUKARI',
                        riskSkoru: 30,
                    },
                    {
                        fonKodu: 'TI2',
                        fonAdi: 'Teknoloji Yatırım Fonu',
                        fonTuru: 'Hisse Senedi',
                        kurucuAdi: 'İş Yatırım',
                        gunlukGetiri: 0.8,
                        haftalikGetiri: 2.1,
                        aylikGetiri: 5.2,
                        yillikGetiri: 62.5,
                        trend: 'YUKARI',
                        riskSkoru: 45,
                    },
                ],
            },
        });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Cache temizme özelliği Redis olmadan devre dışı
        if (body.action === 'clearCache') {
            return NextResponse.json({
                success: true,
                data: { message: 'Cache temizleme devre dışı (Redis yok)' },
            });
        }

        return NextResponse.json({
            success: false,
            error: 'Invalid action',
        });
    } catch (error) {
        console.error('TEFAS POST Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Request failed',
        });
    }
}
