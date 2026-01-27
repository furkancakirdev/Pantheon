/**
 * Poseidon - Varlık Dağılımı Sayfası
 * Asset Allocation Analysis
 */

'use client';

import React, { useState, useEffect } from 'react';

type RiskProfile = 'CONSERVATIVE' | 'MODERATE' | 'BALANCED' | 'GROWTH' | 'AGGRESSIVE';

interface AssetAllocation {
  equity: number;
  fixedIncome: number;
  cash: number;
  gold: number;
  commodity: number;
  crypto: number;
  realEstate: number;
  international: number;
}

interface PoseidonData {
  riskProfile: RiskProfile;
  score: number;
  currentAllocation: AssetAllocation;
  targetAllocation: AssetAllocation;
  regime: {
    regime: string;
    confidence: number;
    volatility: string;
  };
  metrics: {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
  };
}

export default function PoseidonPage() {
  const [loading, setLoading] = useState(false);
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('BALANCED');
  const [data, setData] = useState<PoseidonData | null>(null);

  const fetchPoseidonData = async (profile: RiskProfile) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analysis/poseidon?risk=${profile}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Poseidon data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoseidonData(riskProfile);
  }, [riskProfile]);

  const riskProfiles: Array<{ value: RiskProfile; label: string; description: string }> = [
    { value: 'CONSERVATIVE', label: 'Muhafazakar', description: 'Sermaye koruma öncelikli' },
    { value: 'MODERATE', label: 'Ilımlı', description: 'Dengeli getiri-risk' },
    { value: 'BALANCED', label: 'Dengeli', description: 'Büyüme ve stabilite dengesi' },
    { value: 'GROWTH', label: 'Büyüme', description: 'Hisse ağırlıklı büyüme' },
    { value: 'AGGRESSIVE', label: 'Agresif', description: 'Maksimum büyüme' },
  ];

  const assetNames: Record<keyof AssetAllocation, string> = {
    equity: 'Hisse Senedi',
    fixedIncome: 'Tahvil',
    cash: 'Nakit',
    gold: 'Altın',
    commodity: 'Emtia',
    crypto: 'Kripto',
    realEstate: 'Gayrimenkul',
    international: 'Uluslararası',
  };

  const assetIcons: Record<keyof AssetAllocation, string> = {
    equity: '📈',
    fixedIncome: '📜',
    cash: '💵',
    gold: '🪙',
    commodity: '🛢️',
    crypto: '₿',
    realEstate: '🏠',
    international: '🌍',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          🔱 Poseidon
        </h1>
        <p className="text-slate-400">
          Asset Allocation Analysis - Varlık Dağılımı Motoru
        </p>
      </div>

      {/* Risk Profili Seçimi */}
      <div className="card">
        <h2 className="card-header">⚖️ Risk Profili</h2>
        <div className="flex flex-wrap gap-2">
          {riskProfiles.map((profile) => (
            <button
              key={profile.value}
              onClick={() => setRiskProfile(profile.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                riskProfile === profile.value
                  ? 'bg-teal-500 text-white scale-105'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {profile.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rejim ve Metrikler */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rejim */}
          <div className="card">
            <div className="text-center">
              <div className="text-slate-400 text-sm mb-2">Piyasa Rejimi</div>
              <div className="text-xl font-bold text-white mb-1">{data.regime.regime}</div>
              <div className="text-xs text-slate-500">Güven: %{data.regime.confidence * 100}</div>
            </div>
          </div>

          {/* Beklenen Getiri */}
          <div className="card">
            <div className="text-center">
              <div className="text-slate-400 text-sm mb-2">Beklenen Getiri</div>
              <div className="text-2xl font-bold text-emerald-400">%{data.metrics.expectedReturn.toFixed(1)}</div>
            </div>
          </div>

          {/* Sharpe */}
          <div className="card">
            <div className="text-center">
              <div className="text-slate-400 text-sm mb-2">Sharpe Oranı</div>
              <div className={`text-2xl font-bold ${data.metrics.sharpeRatio > 0.5 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                {data.metrics.sharpeRatio.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hedef Dağılım */}
      {data && (
        <div className="card">
          <h2 className="card-header">🎯 Hedef Portföy Dağılımı</h2>
          <div className="space-y-3">
            {(Object.keys(data.targetAllocation) as Array<keyof AssetAllocation>).map((asset) => {
              const value = data.targetAllocation[asset];
              if (value === 0) return null;

              return (
                <div key={asset} className="flex items-center gap-3">
                  <div className="text-2xl w-10 text-center">{assetIcons[asset]}</div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">{assetNames[asset]}</span>
                      <span className="text-teal-400 font-bold">%{value}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 transition-all"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Varlık Sınıfı Detayları */}
      {data && (
        <div className="card">
          <h2 className="card-header">📊 Varlık Sınıfı Analizi</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.keys(data.targetAllocation) as Array<keyof AssetAllocation>).map((asset) => {
              const current = data.currentAllocation[asset];
              const target = data.targetAllocation[asset];
              if (target === 0 && current === 0) return null;

              const change = target - current;

              return (
                <div key={asset} className="p-3 bg-slate-800/50 rounded-lg text-center">
                  <div className="text-2xl mb-1">{assetIcons[asset]}</div>
                  <div className="text-sm font-bold text-white">{assetNames[asset]}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    <div className="flex justify-between">
                      <span>%{current} →</span>
                      <span className="text-teal-400">%{target}</span>
                    </div>
                    {change !== 0 && (
                      <div className={`text-xs mt-1 ${change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {change > 0 ? '+' : ''}{change.toFixed(0)}%
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bilgi Kartı */}
      <div className="card bg-teal-500/10 border-teal-500/30">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-bold text-white mb-1">Poseidon Nedir?</h3>
            <p className="text-sm text-slate-400">
              Poseidon, stratejik ve taktiksel varlık dağılımı analizleri yapar. Risk profilinize göre
              hisse, tahvil, altın, nakit gibi varlık sınıfları arasında optimal dağılımı belirler.
              "Doğru varlık dağılımı, portföy başarısının %90'ını belirler."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
