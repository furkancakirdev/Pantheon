'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface StockQuote {
  kod: string;
  ad: string;
  fiyat: number;
  degisim: number;
  degisimPercent: number;
  hacim: string;
}

interface ErdincAnalysis {
  symbol: string;
  toplamSkor: number;
  buyumeSkor: number;
  borcSkor: number;
  carpanSkor: number;
  karlilikSkor: number;
  gidaSkor?: number;
  gidaKriterler?: {
    aktifKariligi: boolean;
    netKarMarji: boolean;
    serbestNakitAkisi: boolean;
    brutKarMarji: boolean;
    roic: boolean;
  };
  gerekceler: string[];
  uyari?: string[];
}

interface OrionAnalysis {
  symbol: string;
  totalScore: number;
  verdict: string;
  components: {
    trend: number;
    momentum: number;
    volatilite: number;
    yapi: number;
    kivanc: number;
  };
}

interface PhoenixAnalysis {
  symbol: string;
  score: number;
  signals: string[];
  riskLevel: string;
}

interface CompleteAnalysis {
  symbol: string;
  timestamp: string;
  orion: OrionAnalysis;
  erdinc: ErdincAnalysis;
  phoenix: PhoenixAnalysis;
  overall: {
    score: number;
    verdict: string;
  };
}

function StocksPageInner() {
  const searchParams = useSearchParams();
  const symbolParam = searchParams.get('symbol');

  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(symbolParam);
  const [analysis, setAnalysis] = useState<CompleteAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hisseleri yükle
  useEffect(() => {
    async function fetchStocks() {
      try {
        const res = await fetch('/api/stocks');
        const data = await res.json();
        setStocks(data.data || []);
      } catch (err) {
        console.error('Hisseler yüklenemedi:', err);
      }
    }
    fetchStocks();
  }, []);

  // Seçili hisse analizi
  useEffect(() => {
    if (selectedSymbol) {
      fetchAnalysis(selectedSymbol);
    }
  }, [selectedSymbol]);

  async function fetchAnalysis(symbol: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analysis/complete?symbol=${symbol}`);
      if (!res.ok) throw new Error('Analiz alınamadı');
      const data = await res.json();
      setAnalysis(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  function getScoreClass(score: number) {
    if (score >= 75) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  }

  function getVerdictClass(verdict: string) {
    const v = verdict?.toUpperCase() || '';
    if (v.includes('AL')) return 'text-emerald-400';
    if (v.includes('SAT')) return 'text-red-400';
    return 'text-yellow-400';
  }

  function getRiskClass(risk: string) {
    const r = risk?.toUpperCase() || '';
    if (r.includes('DÜŞÜK')) return 'text-emerald-400';
    if (r.includes('YÜKSEK')) return 'text-red-400';
    return 'text-yellow-400';
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            📈 Hisse Analizi
          </h1>
          <p className="text-slate-400">
            {selectedSymbol ? `${selectedSymbol} Detaylı Analiz` : 'BIST 100 Gözetim Pazarı'}
          </p>
        </div>
        {selectedSymbol && (
          <button
            onClick={() => {
              setSelectedSymbol(null);
              setAnalysis(null);
            }}
            className="text-sm text-slate-400 hover:text-white transition"
          >
            ← Listeye Dön
          </button>
        )}
      </div>

      {!selectedSymbol ? (
        // Hisse Listesi
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="p-3">Hisse</th>
                  <th className="p-3">Son Fiyat</th>
                  <th className="p-3">Değişim</th>
                  <th className="p-3">Hacim</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
                  <tr
                    key={stock.kod}
                    className="border-b border-slate-800 hover:bg-slate-800/50 transition cursor-pointer"
                    onClick={() => setSelectedSymbol(stock.kod)}
                  >
                    <td className="p-3">
                      <div className="font-bold">{stock.kod}</div>
                      <div className="text-xs text-slate-400">{stock.ad}</div>
                    </td>
                    <td className="p-3 font-medium">{stock.fiyat.toFixed(2)} ₺</td>
                    <td className={`p-3 font-bold ${stock.degisimPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      %{stock.degisimPercent}
                    </td>
                    <td className="p-3 text-slate-300">{stock.hacim}</td>
                    <td className="p-3 text-right">
                      <button className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded text-sm text-white transition">
                        Analiz Et
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Detaylı Analiz
        <div className="space-y-6">
          {loading && (
            <div className="text-center py-12">
              <div className="text-slate-400">Analiz yapılıyor...</div>
            </div>
          )}

          {error && (
            <div className="card bg-red-900/20 border-red-500/50">
              <div className="text-red-400">{error}</div>
            </div>
          )}

          {analysis && !loading && (
            <>
              {/* Header */}
              <div className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold">{analysis.symbol}</h2>
                    <p className="text-slate-400 mt-1">
                      Son güncelleme: {new Date(analysis.timestamp).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getVerdictClass(analysis.overall.verdict)}`}>
                      {analysis.overall.verdict}
                    </div>
                    <div className={`score-badge ${getScoreClass(analysis.overall.score)} text-lg mt-2`}>
                      {analysis.overall.score.toFixed(0)}/100
                    </div>
                  </div>
                </div>
              </div>

              {/* Analiz Kartları Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Orion Analizi */}
                <div className="card">
                  <h3 className="card-header text-lg">🔭 Orion (Teknik)</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-slate-400">Toplam Skor</div>
                      <div className={`text-2xl font-bold ${getScoreClass(analysis.orion.totalScore)}`}>
                        {analysis.orion.totalScore}/100
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Trend</span>
                        <span>{analysis.orion.components.trend}/25</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(analysis.orion.components.trend / 25) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Momentum</span>
                        <span>{analysis.orion.components.momentum}/20</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${(analysis.orion.components.momentum / 20) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Kıvanç İndikatörleri</span>
                        <span>{analysis.orion.components.kivanc}/25</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{ width: `${(analysis.orion.components.kivanc / 25) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Erdinç Analizi */}
                <div className="card">
                  <h3 className="card-header text-lg">📊 Erdinç (Temel)</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-slate-400">Toplam Skor</div>
                      <div className={`text-2xl font-bold ${getScoreClass(analysis.erdinc.toplamSkor)}`}>
                        {analysis.erdinc.toplamSkor}/100
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-slate-800/50 p-2 rounded">
                        <div className="text-slate-400">Büyüme</div>
                        <div className="font-bold">{analysis.erdinc.buyumeSkor}</div>
                      </div>
                      <div className="bg-slate-800/50 p-2 rounded">
                        <div className="text-slate-400">Borç</div>
                        <div className="font-bold">{analysis.erdinc.borcSkor}</div>
                      </div>
                      <div className="bg-slate-800/50 p-2 rounded">
                        <div className="text-slate-400">Çarpan</div>
                        <div className="font-bold">{analysis.erdinc.carpanSkor}</div>
                      </div>
                      <div className="bg-slate-800/50 p-2 rounded">
                        <div className="text-slate-400">Kârlılık</div>
                        <div className="font-bold">{analysis.erdinc.karlilikSkor}</div>
                      </div>
                    </div>
                    {analysis.erdinc.gidaSkor !== undefined && (
                      <div className="mt-3 p-3 bg-emerald-900/20 rounded-lg border border-emerald-500/30">
                        <div className="text-sm text-emerald-400 font-semibold">GIDA Skoru: {analysis.erdinc.gidaSkor}/100</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Phoenix Analizi */}
                <div className="card">
                  <h3 className="card-header text-lg">🔥 Phoenix (Sinyal)</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-slate-400">Skor</div>
                      <div className={`text-2xl font-bold ${getScoreClass(analysis.phoenix.score)}`}>
                        {analysis.phoenix.score}/100
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Risk Seviyesi</div>
                      <div className={`text-lg font-bold ${getRiskClass(analysis.phoenix.riskLevel)}`}>
                        {analysis.phoenix.riskLevel}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-2">Sinyaller</div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.phoenix.signals.length > 0 ? (
                          analysis.phoenix.signals.map((signal, i) => (
                            <span key={i} className="px-2 py-1 bg-slate-700 rounded text-xs">
                              {signal}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-sm">Belirgin sinyal yok</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gerekçeler */}
              {analysis.erdinc.gerekceler && analysis.erdinc.gerekceler.length > 0 && (
                <div className="card">
                  <h3 className="card-header">📋 Analiz Gerekçeleri</h3>
                  <ul className="space-y-2">
                    {analysis.erdinc.gerekceler.map((gerekce, i) => (
                      <li key={i} className="text-sm text-slate-300">
                        {gerekce}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Aksiyon Butonları */}
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => window.open(`/api/analysis/erdinc?action=gida&symbol=${analysis.symbol}`)}
                  className="card bg-emerald-900/20 hover:bg-emerald-900/40 border-emerald-500/50 cursor-pointer text-center"
                >
                  <div className="text-2xl mb-2">🔬</div>
                  <div className="font-semibold">GIDA Analizi</div>
                  <div className="text-xs text-slate-400">Detaylı temel inceleme</div>
                </button>
                <button
                  onClick={() => window.open(`/api/live?action=quote&symbol=${analysis.symbol}`)}
                  className="card bg-blue-900/20 hover:bg-blue-900/40 border-blue-500/50 cursor-pointer text-center"
                >
                  <div className="text-2xl mb-2">📡</div>
                  <div className="font-semibold">Canlı Fiyat</div>
                  <div className="text-xs text-slate-400">Anlık veri akışı</div>
                </button>
                <button
                  onClick={() => window.open(`/api/analysis/phoenix?action=analyze&symbol=${analysis.symbol}`)}
                  className="card bg-orange-900/20 hover:bg-orange-900/40 border-orange-500/50 cursor-pointer text-center"
                >
                  <div className="text-2xl mb-2">🔥</div>
                  <div className="font-semibold">Sinyal Tarama</div>
                  <div className="text-xs text-slate-400">Tüm formasyonlar</div>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Wrapper with Suspense boundary for useSearchParams
export default function StocksPage() {
  return (
    <Suspense fallback={<div className="text-center py-12"><div className="text-slate-400">Yükleniyor...</div></div>}>
      <StocksPageInner />
    </Suspense>
  );
}
