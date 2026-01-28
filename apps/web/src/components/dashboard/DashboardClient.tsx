/**
 * DashboardClient - İnteraktif bileşenler
 * Canlı piyasa verisi ve gerçek zamanlı güncellemeler için client component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { LiveTicker, LiveQuoteGrid } from '@/components/market/LiveQuoteCard';
import { ScoreCard } from './ScoreCard';
import Link from 'next/link';

const TOP_STOCKS = ['THYAO', 'ASELS', 'SAHOL', 'GARAN', 'AKBNK', 'KCHOL'];

// Loading Skeleton Component
function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="h-16 bg-slate-800/50 rounded-lg animate-pulse"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-slate-800/50 rounded-lg animate-pulse"></div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="h-48 bg-slate-800/50 rounded-lg animate-pulse"></div>
                <div className="h-48 bg-slate-800/50 rounded-lg animate-pulse"></div>
                <div className="h-48 bg-slate-800/50 rounded-lg animate-pulse"></div>
            </div>
        </div>
    );
}

// Error Component
function ErrorComponent({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="card border-red-500/30 bg-red-900/10">
            <div className="text-center py-8">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">Veri Yükleme Hatası</h3>
                <p className="text-slate-400 mb-4">{message}</p>
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                    Yeniden Dene
                </button>
            </div>
        </div>
    );
}

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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Refresh market data
    const refreshData = async () => {
        setLoading(true);
        setError(null);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const res = await fetch(`${baseUrl}/api/market`, { cache: 'no-store' });
            if (!res.ok) throw new Error('Piyasa verisi alınamadı');
            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
            setLoading(false);
        }
    };

    return (
        <>
            {/* Live Market Ticker */}
            <div className="card bg-slate-900/50 border-slate-700/50 overflow-hidden">
                <LiveTicker symbols={TOP_STOCKS} />
            </div>

            {/* Error State */}
            {error && (
                <ErrorComponent
                    message={error}
                    onRetry={refreshData}
                />
            )}

            {/* Loading State */}
            {loading && <DashboardSkeleton />}

            {/* Market Overview */}
            {!loading && !error && (
                <>
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
            )}
        </>
    );
}
