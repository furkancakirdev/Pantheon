'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface WonderkidStock {
  kod: string;
  ad: string;
  sektor: string;
  wonderkidSkor: number;
  erdincSkor?: number;
  potansiyelYildiz: boolean;
  trendEslesmesi: string[];
  vizyon?: string;
  riskler?: string[];
}

export default function WonderkidPage() {
  const [wonderkids, setWonderkids] = useState<WonderkidStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWonderkids() {
      try {
        const res = await fetch('/api/analysis/erdinc?action=wonderkid&limit=20');
        const data = await res.json();
        setWonderkids(data.data || []);
      } catch (err) {
        console.error('Wonderkid verileri yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchWonderkids();
  }, []);

  function getScoreClass(score: number) {
    if (score >= 75) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  }

  const MEGA_TRENDS = [
    'yapay zeka', 'elektrikli araç', 'yeşil enerji', 'savunma',
    'siber güvenlik', 'biyoteknoloji', 'bulut bilişim', 'fintech'
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-yellow-400">⭐</span>
          Wonderkid Keşif Motoru
        </h1>
        <p className="text-slate-400">
          Football Manager tarzı - Gelecek vaat eden şirketlerin analizi
        </p>
      </div>

      {/* Info Card */}
      <div className="card bg-gradient-to-r from-emerald-900/20 to-slate-900 border-emerald-500/30">
        <h3 className="font-semibold text-emerald-400 mb-2">🎯 Wonderkid Nedir?</h3>
        <p className="text-sm text-slate-300">
          Wonderkid analizi, Football Manager oyunundaki "genç yetenek" mantığıyla çalışır.
          Şirketlerin yönetim vizyonu, sektör potansiyeli, küresel trendlerle uyumu ve finansal
          dinamizmi analiz edilerek gelecekte parlayacak şirketler tespit edilir.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-slate-400">Megatrendler:</span>
          {MEGA_TRENDS.map(trend => (
            <span key={trend} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
              {trend}
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-slate-400">Yükleniyor...</div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="text-2xl font-bold text-yellow-400">
                {wonderkids.filter(w => w.potansiyelYildiz).length}
              </div>
              <div className="text-sm text-slate-400">Yıldız Adayı</div>
            </div>
            <div className="card">
              <div className="text-2xl font-bold text-emerald-400">
                {wonderkids.filter(w => w.wonderkidSkor >= 75).length}
              </div>
              <div className="text-sm text-slate-400">75+ Skor</div>
            </div>
            <div className="card">
              <div className="text-2xl font-bold">
                {wonderkids.length > 0 ? Math.round(wonderkids.reduce((s, w) => s + w.wonderkidSkor, 0) / wonderkids.length) : 0}
              </div>
              <div className="text-sm text-slate-400">Ortalama Skor</div>
            </div>
            <div className="card">
              <div className="text-2xl font-bold">
                {wonderkids.length}
              </div>
              <div className="text-sm text-slate-400">Toplam Hisse</div>
            </div>
          </div>

          {/* Wonderkid Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wonderkids.map((wk, index) => (
              <div
                key={wk.kod}
                className={`card relative ${wk.potansiyelYildiz ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-900/10 to-slate-900' : ''}`}
              >
                {/* Rank Badge */}
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-sm font-bold border border-slate-700">
                  {index + 1}
                </div>

                {/* Star Badge */}
                {wk.potansiyelYildiz && (
                  <div className="absolute -top-2 -right-2 text-2xl wonderkid-star">⭐</div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-4 pt-2">
                  <div>
                    <Link href={`/stocks?symbol=${wk.kod}`} className="hover:text-emerald-400 transition">
                      <h3 className="text-xl font-bold">{wk.kod}</h3>
                    </Link>
                    <p className="text-slate-400 text-sm">{wk.ad || wk.kod}</p>
                    <p className="text-xs text-slate-500">{wk.sektor || 'Belirtilmemiş'}</p>
                  </div>
                  <div className={`score-badge text-lg ${getScoreClass(wk.wonderkidSkor)}`}>
                    {wk.wonderkidSkor}
                  </div>
                </div>

                {/* Trend Tags */}
                {wk.trendEslesmesi && wk.trendEslesmesi.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {wk.trendEslesmesi.slice(0, 3).map(trend => (
                      <span key={trend} className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-300">
                        {trend}
                      </span>
                    ))}
                  </div>
                )}

                {/* Erdinç Skor */}
                {wk.erdincSkor && (
                  <div className="flex justify-between text-sm text-slate-400 mb-3">
                    <span>Erdinç Skor</span>
                    <span className={getScoreClass(wk.erdincSkor)}>
                      {wk.erdincSkor}/100
                    </span>
                  </div>
                )}

                {/* Vizyon */}
                {wk.vizyon && (
                  <p className="text-xs text-slate-300 mb-3 italic">"{wk.vizyon}"</p>
                )}

                {/* Action */}
                <Link
                  href={`/stocks?symbol=${wk.kod}`}
                  className="block w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-center transition"
                >
                  Detaylı Analiz →
                </Link>
              </div>
            ))}
          </div>

          {wonderkids.length === 0 && (
            <div className="card text-center py-12">
              <div className="text-slate-400">Henüz wonderkid verisi bulunmuyor.</div>
            </div>
          )}
        </>
      )}

      {/* Legend */}
      <div className="card">
        <h3 className="font-semibold mb-3">📊 Skor Açıklaması</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="inline-block w-3 h-3 rounded bg-emerald-500 mr-2"></span>
            75-100: Güçlü Wonderkid
          </div>
          <div>
            <span className="inline-block w-3 h-3 rounded bg-amber-500 mr-2"></span>
            50-74: Potansiyel Var
          </div>
          <div>
            <span className="inline-block w-3 h-3 rounded bg-red-500 mr-2"></span>
            0-49: Zayıf
          </div>
          <div>
            <span className="text-yellow-400 mr-2">⭐</span>
            Yıldız Adayı
          </div>
        </div>
      </div>
    </div>
  );
}
