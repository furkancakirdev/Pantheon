/**
 * Funds API - TEFAS'tan fon verileri
 * 
 * GET /api/funds - Tüm fonlar ve getirileri
 */

import { NextResponse } from 'next/server';

interface FundData {
    kod: string;
    ad: string;
    tur: string;
    kurucu: string;
    gunlukGetiri: number;
    haftalikGetiri: number;
    aylikGetiri: number;
    yillikGetiri: number;
    buyukluk: number;
}

// TEFAS API endpoint
const TEFAS_API = 'https://www.tefas.gov.tr/api/DB/BindComparisonFundReturns';

export async function GET() {
    try {
        const response = await fetch(TEFAS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ lang: 'TR' }),
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json({
                success: true,
                source: 'mock',
                data: getMockFunds(),
                message: 'TEFAS API erişilemedi, mock data kullanılıyor',
            });
        }

        const result = await response.json();

        return NextResponse.json({
            success: true,
            source: 'tefas',
            count: result.data?.length || 0,
            data: result.data || [],
        });

    } catch (error) {
        console.error('Funds API error:', error);

        return NextResponse.json({
            success: true,
            source: 'mock',
            data: getMockFunds(),
            message: 'API hatası, mock data kullanılıyor',
        });
    }
}

function getMockFunds(): FundData[] {
    return [
        { kod: 'TI2', ad: 'İş Portföy Hisse Senedi Fonu', tur: 'Hisse', kurucu: 'İş Portföy', gunlukGetiri: 1.2, haftalikGetiri: 3.5, aylikGetiri: 8.2, yillikGetiri: 45.6, buyukluk: 2500000000 },
        { kod: 'YAC', ad: 'Yapı Kredi Portföy Hisse Fonu', tur: 'Hisse', kurucu: 'Yapı Kredi', gunlukGetiri: 0.9, haftalikGetiri: 2.8, aylikGetiri: 7.5, yillikGetiri: 42.3, buyukluk: 1800000000 },
        { kod: 'GAR', ad: 'Garanti Portföy Hisse Fonu', tur: 'Hisse', kurucu: 'Garanti', gunlukGetiri: 1.1, haftalikGetiri: 3.2, aylikGetiri: 7.8, yillikGetiri: 44.1, buyukluk: 2100000000 },
        { kod: 'AKP', ad: 'Akbank Portföy Hisse Fonu', tur: 'Hisse', kurucu: 'Ak Portföy', gunlukGetiri: 0.8, haftalikGetiri: 2.5, aylikGetiri: 6.9, yillikGetiri: 38.7, buyukluk: 1500000000 },
        { kod: 'ZBH', ad: 'Ziraat Portföy Hisse Fonu', tur: 'Hisse', kurucu: 'Ziraat', gunlukGetiri: 1.0, haftalikGetiri: 3.0, aylikGetiri: 7.2, yillikGetiri: 40.5, buyukluk: 1200000000 },
    ];
}
