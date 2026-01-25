'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MarketData {
  xu100: number;
  xu100Change: number;
  usdTry: number;
  eurTry: number;
}

interface StockScore {
  kod: string;
  ad: string;
  toplamSkor: number;
  sinyal: string;
}

export default function DashboardPage() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [topStocks, setTopStocks] = useState<StockScore[]>([]);
  const [wonderkids, setWonderkids] = useState<StockScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Market verisi
        const marketRes = await fetch('/api/market');
        const marketData = await marketRes.json();
        setMarketData(marketData.data);

        // Erdinç top skorlar
        const erdincRes = await fetch('/api/analysis/erdinc?action=top&limit=10');
        const erdincData = await erdincRes.json();
        setTopStocks(erdincData.data ? [erdincData.data] : []);

        // Wonderkid
        const wonderkidRes = await fetch('/api/analysis/erdinc?action=wonderkid&limit=5');
        const wonderkidData = await wonderkidRes.json();
        setWonderkids(wonderkidData.data || []);
      } catch (error) {
        console.error('Veri yüklenemedi:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function getScoreClass(score: number) {
    if (score >= 75) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  }

  function getSignalClass(signal: string) {
    const s = signal?.toUpperCase() || '';
    if (s.includes('AL')) return 'signal-al';
    if (s.includes('SAT')) return 'signal-sat';
    return 'signal-bekle';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-400">Piyasa özeti ve en iyi fırsatlar</p>
        </div>
        <div className="text-sm text-slate-500">
          Son güncelleme: {new Date().toLocaleString('tr-TR')}
        </div>
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
        {/* Wonderkid Picks */}
        <div className="card lg:col-span-1">
          <h2 className="card-header flex items-center gap-2">
            <span className="wonderkid-star">⭐</span>
            Wonderkid Seçimleri
          </h2>
          <div className="space-y-3">
            {wonderkids.length > 0 ? wonderkids.map((wk, i) => (
              <Link
                key={wk.kod}
                href={`/stocks?symbol=${wk.kod}`}
                className="block p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-emerald-400">#{i + 1}</span>
                    <div>
                      <div className="font-semibold">{wk.kod}</div>
                      <div className="text-xs text-slate-400">{wk.ad || wk.kod}</div>
                    </div>
                  </div>
                  <div className={`score-badge ${getScoreClass(wk.toplamSkor)}`}>
                    {wk.toplamSkor}
                  </div>
                </div>
              </Link>
            )) : (
              <div className="text-center text-slate-500 py-4">Veri yükleniyor...</div>
            )}
          </div>
          <Link href="/wonderkid" className="block mt-4 text-center text-sm text-emerald-400 hover:underline">
            Tümünü Gör →
          </Link>
        </div>

        {/* Top Stocks */}
        <div className="card lg:col-span-2">
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
                    <span className={`score-badge ${getScoreClass(stock.toplamSkor)}`}>
                      {stock.toplamSkor}
                    </span>
                  </td>
                  <td>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getSignalClass(stock.sinyal)}`}>
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
        <Link href="/council" className="card hover:border-emerald-500/50 transition cursor-pointer">
          <div className="text-3xl mb-2">🏛️</div>
          <div className="font-semibold">Grand Council</div>
          <div className="text-sm text-slate-400">AI oylama sistemi</div>
        </Link>
      </div>
    </div>
  );
}
