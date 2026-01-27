/**
 * DashboardClient - İnteraktif bileşenler
 * Canlı piyasa verisi ve gerçek zamanlı güncellemeler için client component
 */

'use client';

import { LiveTicker, LiveQuoteGrid } from '@/components/market/LiveQuoteCard';
import { ScoreCard } from './ScoreCard';
import Link from 'next/link';

const TOP_STOCKS = ['THYAO', 'ASELS', 'SAHOL', 'GARAN', 'AKBNK', 'KCHOL'];

export interface MarketData {
    xu100: number;
    xu100Change: number;
    usdTry: number;
    eurTry: number;
}

export interface StockScore {
    kod: string;
    ad: string;
    toplamSkor: number;
    sinyal: string;
}

interface DashboardClientProps {
    marketData: MarketData | null;
    wonderkids: StockScore[];
}

export function DashboardClient({ marketData, wonderkids }: DashboardClientProps) {
    return (
        <>
            {/* Live Market Ticker */}
            <div className="card bg-slate-900/50 border-slate-700/50 overflow-hidden">
                <LiveTicker symbols={TOP_STOCKS} />
            </div>

            {/* Market Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card">
                    <div className="text-slate-400 text-sm">BIST 100</div>
                    <div className="text-2xl font-bold">{marketData?.xu100?.toLocaleString('tr-TR') || '-'}</div>
                    <div className={`text-sm ${(marketData?.xu100Change ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {(marketData?.xu100Change ?? 0) >= 0 ? '+' : ''}{marketData?.xu100Change ?? 0}%
                    </div>
                </div>
                <div className="card">
                    <div className="text-slate-400 text-sm">BIST 30</div>
                    <div className="text-2xl font-bold">{marketData?.xu100?.toLocaleString('tr-TR') || '-'}</div>
                </div>
                <div className="card">
                    <div className="text-slate-400 text-sm">USD/TRY</div>
                    <div className="text-2xl font-bold">{marketData?.usdTry || '-'}</div>
                </div>
                <div className="card">
                    <div className="text-slate-400 text-sm">EUR/TRY</div>
                    <div className="text-2xl font-bold">{marketData?.eurTry || '-'}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live Quotes Grid */}
                <div className="card lg:col-span-1">
                    <h2 className="card-header flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Canlı Piyasa
                    </h2>
                    <LiveQuoteGrid symbols={['THYAO', 'ASELS', 'GARAN']} columns={1} showDetails />
                </div>

                {/* Wonderkid Picks */}
                <div className="card lg:col-span-1">
                    <h2 className="card-header flex items-center gap-2">
                        <span className="wonderkid-star">⭐</span>
                        Wonderkid Seçimleri
                    </h2>
                    <div className="space-y-3">
                        {wonderkids.length > 0 ? wonderkids.map((wk, i) => (
                            <ScoreCard key={wk.kod} stock={wk} index={i + 1} variant="compact" />
                        )) : (
                            <div className="text-center text-slate-500 py-4">Veri yükleniyor...</div>
                        )}
                    </div>
                    <Link href="/wonderkid" className="block mt-4 text-center text-sm text-emerald-400 hover:underline">
                        Tümünü Gör →
                    </Link>
                </div>

                {/* Placeholder for server-rendered content */}
                <div className="card lg:col-span-1" data-server-slot="true">
                    {/* Server component'den gelecek içerik */}
                </div>
            </div>
        </>
    );
}
