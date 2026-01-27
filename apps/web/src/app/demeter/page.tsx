/**
 * Demeter - Sektör Rotasyonu Sayfası
 * Sector Rotation Analysis
 */

'use client';

import React, { useState, useEffect } from 'react';

interface SectorData {
  sector: string;
  name: string;
  score: number;
  change: number;
  recommendation: 'OVERWEIGHT' | 'EQUAL' | 'UNDERWEIGHT';
}

interface DemeterData {
  marketPhase: 'RISK_ON' | 'RISK_OFF' | 'TRANSITION';
  score: number;
  sectors: SectorData[];
  rotateIn: string[];
  rotateOut: string[];
  summary: string;
}

export default function DemeterPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DemeterData | null>(null);

  const fetchDemeterData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analysis/demeter');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Demeter data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemeterData();
  }, []);

  const getPhaseColor = (phase: string) => {
    if (phase === 'RISK_ON') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (phase === 'RISK_OFF') return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  };

  const getRecommendationColor = (rec: string) => {
    if (rec === 'OVERWEIGHT') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (rec === 'UNDERWEIGHT') return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const sectorIcons: Record<string, string> = {
    BANK: '🏦',
    SINA: '🏭',
    TEKN: '💻',
    GYNA: '🍞',
    MANA: '🛒',
    ELEC: '⚡',
    ENRG: '🛢️',
    META: '⛏️',
    HOCA: '🏢',
    ILCS: '📡',
    TAAS: '✈️',
    INSR: '🛡️',
    REAL: '🏠',
    TEXT: '🧵',
    CHEM: '🧪',
    OTOM: '🚗',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          ⭐ Demeter
        </h1>
        <p className="text-slate-400">
          Sector Rotation Analysis - Sektör Rotasyonu Motoru
        </p>
      </div>

      {/* Piyasa Fazı */}
      {data && (
        <div className="card border-2 border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Piyasa Fazı</h2>
              <p className="text-sm text-slate-400">Makro rejim ve risk iştahı</p>
            </div>
            <div className={`px-6 py-3 rounded-lg border-2 ${getPhaseColor(data.marketPhase)}`}>
              <div className="text-sm text-slate-400">Faz</div>
              <div className="text-xl font-bold">{data.marketPhase}</div>
            </div>
          </div>
        </div>
      )}

      {/* Rotasyon Sinyalleri */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rotate In */}
          <div className="card border border-emerald-500/30">
            <h3 className="font-bold text-emerald-400 mb-3 flex items-center gap-2">
              📈 Rotasyon Giriş
            </h3>
            <div className="space-y-2">
              {data.rotateIn.length > 0 ? data.rotateIn.map((sector) => (
                <div key={sector} className="flex items-center justify-between p-2 bg-emerald-500/10 rounded">
                  <span className="flex items-center gap-2">
                    <span>{sectorIcons[sector] || '📊'}</span>
                    <span className="text-white">{sector}</span>
                  </span>
                  <span className="text-emerald-400 text-sm">Ağırlık Artır</span>
                </div>
              )) : (
                <div className="text-slate-500 text-sm">Giriş sinyali yok</div>
              )}
            </div>
          </div>

          {/* Rotate Out */}
          <div className="card border border-red-500/30">
            <h3 className="font-bold text-red-400 mb-3 flex items-center gap-2">
              📉 Rotasyon Çıkış
            </h3>
            <div className="space-y-2">
              {data.rotateOut.length > 0 ? data.rotateOut.map((sector) => (
                <div key={sector} className="flex items-center justify-between p-2 bg-red-500/10 rounded">
                  <span className="flex items-center gap-2">
                    <span>{sectorIcons[sector] || '📊'}</span>
                    <span className="text-white">{sector}</span>
                  </span>
                  <span className="text-red-400 text-sm">Ağırlık Azalt</span>
                </div>
              )) : (
                <div className="text-slate-500 text-sm">Çıkış sinyali yok</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sektörler */}
      {data && (
        <div className="card">
          <h2 className="card-header">📊 Sektör Analizi</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.sectors.map((sector) => (
              <div
                key={sector.sector}
                className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-500 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{sectorIcons[sector.sector] || '📊'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${getRecommendationColor(sector.recommendation)}`}>
                    {sector.recommendation === 'OVERWEIGHT' ? 'OVER' :
                     sector.recommendation === 'UNDERWEIGHT' ? 'UNDER' : 'EQUAL'}
                  </span>
                </div>
                <div className="font-bold text-white text-sm mb-1">{sector.name}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className={sector.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(1)}%
                  </span>
                  <span className="text-slate-400">Skor: {sector.score.toFixed(0)}</span>
                </div>
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
      <div className="card bg-yellow-500/10 border-yellow-500/30">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-bold text-white mb-1">Demeter Nedir?</h3>
            <p className="text-sm text-slate-400">
              Demeter, sektörel rotasyon analizi yapan bir modüldür. 16 farklı sektörü analiz ederek,
              piyasa fazına göre hangi sektörlere ağırlık verilmesi gerektiğini belirler.
              "Paranın aktığı yere git."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
