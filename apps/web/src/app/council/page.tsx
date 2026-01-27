/**
 * Grand Council Sayfası
 * 11 Modüllü Agora Council - Gerçek API Verileri
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CouncilRoom, CompactCouncilRoom } from '@components/council/CouncilRoom';
import { ModulGorus, OyTipi } from '@pantheon/analysis/council';

interface CouncilData {
  symbol: string;
  name: string;
  finalDecision: OyTipi;
  consensus: number;
  timestamp: string;
  opinions: ModulGorus[];
  marketRegime?: string;
}

export default function CouncilPage() {
  const [symbol, setSymbol] = useState('ASELS');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CouncilData | null>(null);
  const [watchlist, setWatchlist] = useState<Array<{ symbol: string; name: string; decision: OyTipi; consensus: number }>>([]);

  // Council verisini çek
  const fetchCouncilData = async (sym: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analysis?symbol=${sym}`);
      const result = await response.json();

      if (result.success) {
        const opinions: ModulGorus[] = result.data.opinions?.map((op: any) => ({
          modul: op.module,
          oy: op.preferredAction === 'buy' ? 'AL' as const : op.preferredAction === 'sell' ? 'SAT' as const : 'BEKLE' as const,
          guven: Math.round(op.confidence * 100),
          gorus: op.evidence?.join('. ') || '',
          sinyal: op.strength > 0.5 ? `${(op.strength * 100).toFixed(0)}% Güç` : undefined,
        })) || [];

        setData({
          symbol: result.data.symbol || sym,
          name: result.data.name || sym,
          finalDecision: result.data.decision || 'BEKLE',
          consensus: result.data.consensus || 0,
          timestamp: new Date().toLocaleString('tr-TR'),
          opinions,
          marketRegime: result.data.regime,
        });
      }
    } catch (error) {
      console.error('Council data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // İzleme listesini çek
  const fetchWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist');
      const result = await response.json();

      if (result.success && result.data) {
        const items = result.data.slice(0, 4).map((item: any) => ({
          symbol: item.symbol,
          name: item.symbol,
          decision: item.decision || 'BEKLE',
          consensus: item.consensus || 50,
        }));
        setWatchlist(items);
      }
    } catch (error) {
      console.error('Watchlist fetch error:', error);
    }
  };

  useEffect(() => {
    fetchCouncilData(symbol);
    fetchWatchlist();
  }, []);

  const getKararClass = (karar: string) => {
    if (karar === 'AL') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (karar === 'SAT') return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  };

  const getKararEmoji = (karar: string) => {
    if (karar === 'AL') return '🟢';
    if (karar === 'SAT') return '🔴';
    return '🟡';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🏛️ Grand Council
          </h1>
          <p className="text-slate-400">
            11 Bilge Modül - Agora Decision Engine
          </p>
        </div>

        {/* Arama kutusu */}
        <div className="flex gap-2">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && fetchCouncilData(symbol)}
            placeholder="Hisse kodu (örn: ASELS)"
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
          />
          <button
            onClick={() => fetchCouncilData(symbol)}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? '⏳' : '🔍 Analiz Et'}
          </button>
        </div>
      </div>

      {/* Council Room - Ana Görsel */}
      {data && data.opinions.length > 0 && (
        <div className="card border-2 border-purple-500/30">
          <CouncilRoom
            symbol={data.symbol}
            gorusler={data.opinions}
            finalKarar={data.finalDecision}
            konsensus={data.consensus}
            piyasaRejimi={data.marketRegime}
          />
        </div>
      )}

      {/* Detay Liste Görünümü */}
      {data && data.opinions.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">{data.symbol} - {data.name}</h2>
              <p className="text-sm text-slate-400">Son güncelleme: {data.timestamp}</p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-black px-6 py-3 rounded-lg border-2 ${getKararClass(data.finalDecision)} shadow-lg`}>
                {getKararEmoji(data.finalDecision)} {data.finalDecision}
              </div>
              <div className="text-sm font-bold text-slate-300 mt-2">Konsensus: %{data.consensus}</div>
            </div>
          </div>

          {/* Modül Oyları */}
          <div className="space-y-2">
            {data.opinions.map((oy) => {
              const config = {
                'Atlas': { icon: '📊' },
                'Orion': { icon: '📈' },
                'Athena': { icon: '🦉' },
                'Hermes': { icon: '🐦' },
                'Aether': { icon: '🌍' },
                'Phoenix': { icon: '🔥' },
                'Cronos': { icon: '⏰' },
                'Chiron': { icon: '🛡️' },
                'Demeter': { icon: '⭐' },
                'Poseidon': { icon: '🔱' },
                'Prometheus': { icon: '🔮' },
              }[oy.modul] || { icon: '🤖' };

              return (
                <div key={oy.modul} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-500 transition">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{config.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-bold text-slate-200">{oy.modul}</div>
                        <div className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">Güven: %{oy.guven}</div>
                      </div>
                      <div className="text-sm text-slate-400">{oy.gorus}</div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg font-bold text-sm ${getKararClass(oy.oy)}`}>
                    {oy.oy}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* İzleme Listesi Özetleri */}
      <div className="card">
        <h2 className="card-header">📊 İzleme Listesi Özetleri</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {watchlist.map((k) => (
            <button
              key={k.symbol}
              onClick={() => {
                setSymbol(k.symbol);
                fetchCouncilData(k.symbol);
              }}
              className="p-4 bg-slate-800/50 rounded-lg text-center hover:bg-slate-800 transition cursor-pointer"
            >
              <div className="text-lg font-bold mb-2 text-white">{k.symbol}</div>
              <div className={`inline-block px-3 py-1 rounded font-bold mb-2 ${getKararClass(k.decision)}`}>
                {getKararEmoji(k.decision)} {k.decision}
              </div>
              <div className="text-xs text-slate-400 font-medium">%{k.consensus} Güç</div>
            </button>
          ))}
        </div>
      </div>

      {/* Modül Bilgileri */}
      <div className="card">
        <h2 className="card-header">📚 Modül Bilgileri</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl mb-1">📊</div>
            <div className="font-bold text-white">Atlas</div>
            <div className="text-slate-400">Temel Analiz (P/E, P/B)</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl mb-1">📈</div>
            <div className="font-bold text-white">Orion</div>
            <div className="text-slate-400">Teknik Analiz (RSI, MACD)</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl mb-1">🦉</div>
            <div className="font-bold text-white">Athena</div>
            <div className="text-slate-400">Faktör Analizi</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl mb-1">🐦</div>
            <div className="font-bold text-white">Hermes</div>
            <div className="text-slate-400">Sentiment Analizi</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl mb-1">🌍</div>
            <div className="font-bold text-white">Aether</div>
            <div className="text-slate-400">Makro Rejim</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl mb-1">🔥</div>
            <div className="font-bold text-white">Phoenix</div>
            <div className="text-slate-400">Strateji & Sinyaller</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl mb-1">⏰</div>
            <div className="font-bold text-white">Cronos</div>
            <div className="text-slate-400">Zamanlama Analizi</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl mb-1">🛡️</div>
            <div className="font-bold text-white">Chiron</div>
            <div className="text-slate-400">Risk Yönetimi</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl mb-1">⭐</div>
            <div className="font-bold text-white">Demeter</div>
            <div className="text-slate-400">Sektör Rotasyonu</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl mb-1">🔱</div>
            <div className="font-bold text-white">Poseidon</div>
            <div className="text-slate-400">Varlık Dağılımı</div>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-2xl mb-1">🔮</div>
            <div className="font-bold text-white">Prometheus</div>
            <div className="text-slate-400">Second-Order Thinking</div>
          </div>
        </div>
      </div>
    </div>
  );
}
