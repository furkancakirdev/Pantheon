// Dashboard Ana Sayfa
// Piyasa özeti, top hisseler, wonderkid önerileri

export default function DashboardPage() {
  // Mock data - gerçek API entegrasyonu sonra eklenecek
  const marketData = {
    xu100: 9850.45,
    xu100Change: 1.24,
    xu030: 10245.80,
    xu030Change: 0.89,
    usdTry: 35.42,
    eurTry: 38.15,
    gold: 2850,
  };

  const topStocks = [
    { kod: 'ASELS', ad: 'Aselsan', erdincSkor: 85, wonderkidSkor: 92, sinyal: 'AL' },
    { kod: 'THYAO', ad: 'Türk Hava Yolları', erdincSkor: 78, wonderkidSkor: 88, sinyal: 'AL' },
    { kod: 'KCHOL', ad: 'Koç Holding', erdincSkor: 72, wonderkidSkor: 75, sinyal: 'BEKLE' },
    { kod: 'TUPRS', ad: 'Tüpraş', erdincSkor: 68, wonderkidSkor: 65, sinyal: 'BEKLE' },
    { kod: 'SISE', ad: 'Şişecam', erdincSkor: 65, wonderkidSkor: 70, sinyal: 'AL' },
  ];

  const wonderkids = [
    { kod: 'ASELS', trend: 'savunma', skor: 92 },
    { kod: 'THYAO', trend: 'havacılık', skor: 88 },
    { kod: 'VESTL', trend: 'teknoloji', skor: 82 },
  ];

  function getScoreClass(score: number) {
    if (score >= 75) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  }

  function getSignalClass(signal: string) {
    if (signal === 'AL') return 'signal-al';
    if (signal === 'SAT') return 'signal-sat';
    return 'signal-bekle';
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
          <div className="text-2xl font-bold">{marketData.xu100.toLocaleString('tr-TR')}</div>
          <div className={`text-sm ${marketData.xu100Change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {marketData.xu100Change >= 0 ? '+' : ''}{marketData.xu100Change}%
          </div>
        </div>
        <div className="card">
          <div className="text-slate-400 text-sm">BIST 30</div>
          <div className="text-2xl font-bold">{marketData.xu030.toLocaleString('tr-TR')}</div>
          <div className={`text-sm ${marketData.xu030Change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {marketData.xu030Change >= 0 ? '+' : ''}{marketData.xu030Change}%
          </div>
        </div>
        <div className="card">
          <div className="text-slate-400 text-sm">USD/TRY</div>
          <div className="text-2xl font-bold">{marketData.usdTry}</div>
        </div>
        <div className="card">
          <div className="text-slate-400 text-sm">Altın (gr)</div>
          <div className="text-2xl font-bold">₺{marketData.gold.toLocaleString('tr-TR')}</div>
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
            {wonderkids.map((wk, i) => (
              <div key={wk.kod} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-emerald-400">#{i + 1}</span>
                  <div>
                    <div className="font-semibold">{wk.kod}</div>
                    <div className="text-xs text-slate-400">{wk.trend}</div>
                  </div>
                </div>
                <div className={`score-badge ${getScoreClass(wk.skor)}`}>
                  {wk.skor}
                </div>
              </div>
            ))}
          </div>
          <a href="/wonderkid" className="block mt-4 text-center text-sm text-emerald-400 hover:underline">
            Tümünü Gör →
          </a>
        </div>

        {/* Top Stocks */}
        <div className="card lg:col-span-2">
          <h2 className="card-header">🏆 En Yüksek Skorlu Hisseler</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Hisse</th>
                <th>Erdinç Skoru</th>
                <th>Wonderkid</th>
                <th>Sinyal</th>
              </tr>
            </thead>
            <tbody>
              {topStocks.map((stock) => (
                <tr key={stock.kod}>
                  <td>
                    <div className="font-semibold">{stock.kod}</div>
                    <div className="text-xs text-slate-400">{stock.ad}</div>
                  </td>
                  <td>
                    <span className={`score-badge ${getScoreClass(stock.erdincSkor)}`}>
                      {stock.erdincSkor}
                    </span>
                  </td>
                  <td>
                    <span className={`score-badge ${getScoreClass(stock.wonderkidSkor)}`}>
                      {stock.wonderkidSkor}
                    </span>
                  </td>
                  <td>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getSignalClass(stock.sinyal)}`}>
                      {stock.sinyal}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a href="/stocks" className="card hover:border-emerald-500/50 transition cursor-pointer">
          <div className="text-3xl mb-2">📈</div>
          <div className="font-semibold">Hisse Tarama</div>
          <div className="text-sm text-slate-400">Tüm BIST hisselerini filtrele</div>
        </a>
        <a href="/funds" className="card hover:border-emerald-500/50 transition cursor-pointer">
          <div className="text-3xl mb-2">💰</div>
          <div className="font-semibold">Fon Analizi</div>
          <div className="text-sm text-slate-400">TEFAS fonlarını karşılaştır</div>
        </a>
        <a href="/wonderkid" className="card hover:border-emerald-500/50 transition cursor-pointer">
          <div className="text-3xl mb-2">⭐</div>
          <div className="font-semibold">Wonderkid</div>
          <div className="text-sm text-slate-400">Gelecek vaat eden şirketler</div>
        </a>
        <a href="/reports" className="card hover:border-emerald-500/50 transition cursor-pointer">
          <div className="text-3xl mb-2">📋</div>
          <div className="font-semibold">Raporlar</div>
          <div className="text-sm text-slate-400">Gerekçeli yatırım önerileri</div>
        </a>
      </div>
    </div>
  );
}
