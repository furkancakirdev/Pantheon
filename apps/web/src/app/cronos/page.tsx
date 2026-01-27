/**
 * Cronos - Zamanlama Analizi Sayfası
 * Timing & Cycle Analysis
 */

'use client';

import React, { useState, useEffect } from 'react';

interface CronosData {
  date: string;
  score: number;
  letterGrade: string;
  verdict: string;
  timing: string;
  recommendation: string;
  factors: Array<{
    name: string;
    score: number;
    description: string;
    weight: number;
  }>;
  summary: string;
}

export default function CronosPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CronosData | null>(null);

  const fetchCronosData = async (date?: string) => {
    setLoading(true);
    try {
      const url = date ? `/api/analysis/cronos?date=${date}` : '/api/analysis/cronos';
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Cronos data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCronosData();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getGradeColor = (grade: string) => {
    if (grade === 'A' || grade === 'B') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (grade === 'C') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const getTimingIcon = (timing: string) => {
    if (timing === 'UYGUN') return '🟢';
    if (timing === 'NOTR') return '🟡';
    return '🔴';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          ⏰ Cronos
        </h1>
        <p className="text-slate-400">
          Timing & Cycle Analysis - Zamanlama Faktörü Motoru
        </p>
      </div>

      {/* Ana Skor Kartı */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Skor */}
          <div className="card border-2 border-indigo-500/30">
            <div className="text-center">
              <div className="text-slate-400 text-sm mb-2">Zamanlama Skoru</div>
              <div className={`text-5xl font-black ${getScoreColor(data.score)}`}>
                {data.score.toFixed(0)}
              </div>
              <div className="text-slate-500 text-xs mt-1">/ 100</div>
            </div>
          </div>

          {/* Harf Notu */}
          <div className="card">
            <div className="text-center">
              <div className="text-slate-400 text-sm mb-2">Harf Notu</div>
              <div className={`text-4xl font-black px-4 py-2 rounded-lg border-2 ${getGradeColor(data.letterGrade)}`}>
                {data.letterGrade}
              </div>
            </div>
          </div>

          {/* Zamanlama */}
          <div className="card">
            <div className="text-center">
              <div className="text-slate-400 text-sm mb-2">Zamanlama</div>
              <div className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                {getTimingIcon(data.timing)} {data.timing}
              </div>
              <div className="text-slate-500 text-xs mt-1">{data.recommendation}</div>
            </div>
          </div>
        </div>
      )}

      {/* Faktörler */}
      {data && (
        <div className="card">
          <h2 className="card-header">📊 Zamanlama Faktörleri</h2>
          <div className="space-y-4">
            {data.factors.map((factor) => (
              <div key={factor.name} className="p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{factor.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                      Ağırlık: %{factor.weight}
                    </span>
                  </div>
                  <div className={`text-xl font-bold ${getScoreColor(factor.score)}`}>
                    {factor.score.toFixed(0)}
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all ${
                      factor.score >= 70 ? 'bg-emerald-500' :
                      factor.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
                <div className="text-sm text-slate-400">{factor.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Özet */}
      {data && (
        <div className="card">
          <h2 className="card-header">📝 Analiz Özeti</h2>
          <p className="text-slate-300 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Bilgi Kartı */}
      <div className="card bg-indigo-500/10 border-indigo-500/30">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-bold text-white mb-1">Cronos Nedir?</h3>
            <p className="text-sm text-slate-400">
              Cronos, piyasa timing analizi yapan bir modüldür. Saat, gün, ay sonu, kazanç sezonu ve tatil etkilerini analiz ederek
              optimal işlem zamanlarını belirler. "Ne zaman aldığın, ne aldığın kadar önemlidir."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
