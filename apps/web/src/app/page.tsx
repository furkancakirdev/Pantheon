/**
 * Dashboard Page - React Server Component
 * Veri sunucuda çekilir, istemciye sadece HTML gönderilir
 */

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Suspense } from 'react';
import { DashboardClient, MarketData, StockScore } from '@/components/dashboard/DashboardClient';
import { ScoreCard } from '@/components/dashboard/ScoreCard';

// ============ DATA FETCHING (Server-Side) ============

async function fetchMarketData(): Promise<MarketData | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/market`, {
            cache: 'no-store',
        });

        if (!res.ok) return null;

        const json = await res.json();
        return json.data;
    } catch {
        return null;
    }
}

async function fetchHealthStatus(): Promise<any> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/health`, {
            cache: 'no-store',
        });

        if (!res.ok) return null;

        return await res.json();
    } catch {
        return null;
    }
}

async function fetchErdincTop(limit: number = 10): Promise<StockScore[]> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/analysis/erdinc?action=top&limit=${limit}`, {
            cache: 'no-store',
        });

        if (!res.ok) return [];

        const json = await res.json();
        return json.data ? [json.data] : [];
    } catch {
        return [];
    }
}

async function fetchWonderkids(limit: number = 5): Promise<StockScore[]> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/analysis/erdinc?action=wonderkid&limit=${limit}`, {
            cache: 'no-store',
        });

        if (!res.ok) return [];

        const json = await res.json();
        return json.data || [];
    } catch {
        return [];
    }
}

// ============ SKELETON COMPONENTS ============

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 w-40 bg-slate-800 rounded animate-pulse"></div>
                    <div className="h-4 w-60 bg-slate-800 rounded mt-2 animate-pulse"></div>
                </div>
            </div>
            <div className="h-16 bg-slate-800 rounded animate-pulse"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-slate-800 rounded animate-pulse"></div>
                ))}
            </div>
        </div>
    );
}

// ============ SERVER COMPONENT ============

export default async function DashboardPage() {
    // Paralel veri çekme (Server-side)
    const [marketData, healthStatus, topStocks, wonderkids] = await Promise.all([
        fetchMarketData(),
        fetchHealthStatus(),
        fetchErdincTop(10),
        fetchWonderkids(5),
    ]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-slate-400">Piyasa özeti ve en iyi fırsatlar</p>
                </div>
                <div className="flex items-center gap-4">
                    {healthStatus && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-lg">
                            <div className={`w-2 h-2 rounded-full ${healthStatus.status === 'operational' ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                            <span className="text-xs text-slate-300">
                                Cache: {healthStatus.performance?.cacheHitRate || '%95'}
                            </span>
                        </div>
                    )}
                    <div className="text-sm text-slate-500">
                        {new Date().toLocaleString('tr-TR')}
                    </div>
                </div>
            </div>

            {/* Cache Info Banner */}
            {healthStatus && (
                <div className="card bg-blue-900/20 border-blue-500/30">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⏱️</span>
                        <div className="flex-1">
                            <div className="font-semibold text-blue-400">15 Dakika Gecikmeli Veri</div>
                            <p className="text-xs text-slate-400 mt-1">
                                Veriler cache'den serving ediliyor. Son cache yenileme:{" "}
                                {healthStatus.timestamp ? new Date(healthStatus.timestamp).toLocaleString('tr-TR') : '-'}
                            </p>
                        </div>
                        <a href="/api/health" target="_blank" className="text-xs text-blue-400 hover:underline">
                            Detay →
                        </a>
                    </div>
                </div>
            )}

            {/* Client Component - Interaktif bileşenler */}
            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardClient marketData={marketData} wonderkids={wonderkids} />
            </Suspense>

            {/* Top Stocks - Server Rendered */}
            <div className="card">
                <h2 className="card-header">🏆 En Yüksek Skorlu Hisseler</h2>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Hisse</th>
                            <th>Toplam Skor</th>
                            <th>Sinyal</th>
                            <th>Detay</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topStocks.length > 0 ? topStocks.map((stock) => (
                            <tr key={stock.kod}>
                                <td>
                                    <div className="font-semibold">{stock.kod}</div>
                                    <div className="text-xs text-slate-400">{stock.ad || stock.kod}</div>
                                </td>
                                <td>
                                    <span className={`score-badge ${
                                        stock.toplamSkor >= 75 ? 'score-high' :
                                        stock.toplamSkor >= 50 ? 'score-medium' : 'score-low'
                                    }`}>
                                        {stock.toplamSkor}
                                    </span>
                                </td>
                                <td>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        stock.sinyal?.toUpperCase().includes('AL') ? 'signal-al' :
                                        stock.sinyal?.toUpperCase().includes('SAT') ? 'signal-sat' : 'signal-bekle'
                                    }`}>
                                        {stock.sinyal || 'BEKLE'}
                                    </span>
                                </td>
                                <td>
                                    <Link href={`/stocks?symbol=${stock.kod}`} className="text-emerald-400 hover:underline text-sm">
                                        Analiz →
                                    </Link>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="text-center text-slate-500 py-4">
                                    Veri yükleniyor...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/stocks" className="card hover:border-emerald-500/50 transition cursor-pointer">
                    <div className="text-3xl mb-2">📈</div>
                    <div className="font-semibold">Hisse Tarama</div>
                    <div className="text-sm text-slate-400">Tüm BIST hisselerini filtrele</div>
                </Link>
                <a href="/api/funds" target="_blank" className="card hover:border-emerald-500/50 transition cursor-pointer">
                    <div className="text-3xl mb-2">💰</div>
                    <div className="font-semibold">Fon Analizi</div>
                    <div className="text-sm text-slate-400">TEFAS fonlarını karşılaştır</div>
                </a>
                <Link href="/wonderkid" className="card hover:border-emerald-500/50 transition cursor-pointer">
                    <div className="text-3xl mb-2">⭐</div>
                    <div className="font-semibold">Wonderkid</div>
                    <div className="text-sm text-slate-400">Gelecek vaat eden şirketler</div>
                </Link>
                <Link href="/council" className="card hover:border-purple-500/50 transition cursor-pointer">
                    <div className="text-3xl mb-2">🏛️</div>
                    <div className="font-semibold">Grand Council</div>
                    <div className="text-sm text-slate-400">11 Modüllü karar mekanizması</div>
                </Link>
            </div>

            {/* Module Links - New Agora Modules */}
            <div className="card">
                <h2 className="card-header">🔧 Agora Modülleri</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <Link href="/council" className="p-3 bg-slate-800/50 rounded-lg text-center hover:bg-slate-800 transition">
                        <div className="text-2xl mb-1">🏛️</div>
                        <div className="text-xs font-bold text-white">Council</div>
                        <div className="text-xs text-slate-500">Karar</div>
                    </Link>
                    <Link href="/cronos" className="p-3 bg-slate-800/50 rounded-lg text-center hover:bg-slate-800 transition">
                        <div className="text-2xl mb-1">⏰</div>
                        <div className="text-xs font-bold text-white">Cronos</div>
                        <div className="text-xs text-slate-500">Zamanlama</div>
                    </Link>
                    <Link href="/demeter" className="p-3 bg-slate-800/50 rounded-lg text-center hover:bg-slate-800 transition">
                        <div className="text-2xl mb-1">⭐</div>
                        <div className="text-xs font-bold text-white">Demeter</div>
                        <div className="text-xs text-slate-500">Sektör</div>
                    </Link>
                    <Link href="/poseidon" className="p-3 bg-slate-800/50 rounded-lg text-center hover:bg-slate-800 transition">
                        <div className="text-2xl mb-1">🔱</div>
                        <div className="text-xs font-bold text-white">Poseidon</div>
                        <div className="text-xs text-slate-500">Dağılım</div>
                    </Link>
                    <Link href="/phoenix" className="p-3 bg-slate-800/50 rounded-lg text-center hover:bg-slate-800 transition">
                        <div className="text-2xl mb-1">🔥</div>
                        <div className="text-xs font-bold text-white">Phoenix</div>
                        <div className="text-xs text-slate-500">Sinyaller</div>
                    </Link>
                    <Link href="/prometheus" className="p-3 bg-slate-800/50 rounded-lg text-center hover:bg-slate-800 transition">
                        <div className="text-2xl mb-1">🔮</div>
                        <div className="text-xs font-bold text-white">Prometheus</div>
                        <div className="text-xs text-slate-500">2nd Order</div>
                    </Link>
                    <Link href="/orion" className="p-3 bg-slate-800/50 rounded-lg text-center hover:bg-slate-800 transition">
                        <div className="text-2xl mb-1">📈</div>
                        <div className="text-xs font-bold text-white">Orion</div>
                        <div className="text-xs text-slate-500">Teknik</div>
                    </Link>
                    <Link href="/aether" className="p-3 bg-slate-800/50 rounded-lg text-center hover:bg-slate-800 transition">
                        <div className="text-2xl mb-1">🌍</div>
                        <div className="text-xs font-bold text-white">Aether</div>
                        <div className="text-xs text-slate-500">Makro</div>
                    </Link>
                    <Link href="/sentiment" className="p-3 bg-slate-800/50 rounded-lg text-center hover:bg-slate-800 transition">
                        <div className="text-2xl mb-1">🐦</div>
                        <div className="text-xs font-bold text-white">Hermes</div>
                        <div className="text-xs text-slate-500">Sentiment</div>
                    </Link>
                    <Link href="/chiron" className="p-3 bg-slate-800/50 rounded-lg text-center hover:bg-slate-800 transition">
                        <div className="text-2xl mb-1">🛡️</div>
                        <div className="text-xs font-bold text-white">Chiron</div>
                        <div className="text-xs text-slate-500">Risk</div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
