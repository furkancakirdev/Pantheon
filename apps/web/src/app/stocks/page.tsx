// Hisse Tarama Sayfası
// Tüm BIST hisselerini filtrele ve skorla

export default function StocksPage() {
    // Mock data
    const stocks = [
        { kod: 'ASELS', ad: 'Aselsan', sektor: 'Savunma', fk: 12.5, pddd: 1.8, roe: 24, erdincSkor: 85, sinyal: 'AL' },
        { kod: 'THYAO', ad: 'Türk Hava Yolları', sektor: 'Havacılık', fk: 8.2, pddd: 1.2, roe: 28, erdincSkor: 78, sinyal: 'AL' },
        { kod: 'KCHOL', ad: 'Koç Holding', sektor: 'Holding', fk: 6.5, pddd: 0.9, roe: 18, erdincSkor: 72, sinyal: 'BEKLE' },
        { kod: 'TUPRS', ad: 'Tüpraş', sektor: 'Enerji', fk: 5.8, pddd: 1.1, roe: 22, erdincSkor: 68, sinyal: 'BEKLE' },
        { kod: 'SISE', ad: 'Şişecam', sektor: 'Cam', fk: 7.2, pddd: 0.8, roe: 16, erdincSkor: 65, sinyal: 'AL' },
        { kod: 'SAHOL', ad: 'Sabancı Holding', sektor: 'Holding', fk: 5.5, pddd: 0.7, roe: 15, erdincSkor: 62, sinyal: 'BEKLE' },
        { kod: 'AKBNK', ad: 'Akbank', sektor: 'Banka', fk: 4.2, pddd: 0.6, roe: 20, erdincSkor: 70, sinyal: 'AL' },
        { kod: 'GARAN', ad: 'Garanti BBVA', sektor: 'Banka', fk: 3.8, pddd: 0.5, roe: 22, erdincSkor: 75, sinyal: 'AL' },
    ];

    function getScoreClass(score: number) {
        if (score >= 75) return 'bg-emerald-500/20 text-emerald-400';
        if (score >= 50) return 'bg-amber-500/20 text-amber-400';
        return 'bg-red-500/20 text-red-400';
    }

    function getSignalClass(signal: string) {
        if (signal === 'AL') return 'bg-emerald-500/20 text-emerald-400';
        if (signal === 'SAT') return 'bg-red-500/20 text-red-400';
        return 'bg-slate-500/20 text-slate-400';
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">📈 Hisse Tarama</h1>
                    <p className="text-slate-400">Yaşar Erdinç kriterleriyle filtrelenmiş BIST hisseleri</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card">
                <h3 className="font-semibold mb-3">🔍 Filtreler (Yaşar Erdinç Kriterleri)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-sm text-slate-400">Min F/K</label>
                        <input type="number" placeholder="0" className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg" />
                    </div>
                    <div>
                        <label className="text-sm text-slate-400">Max F/K</label>
                        <input type="number" placeholder="15" className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg" />
                    </div>
                    <div>
                        <label className="text-sm text-slate-400">Max PD/DD</label>
                        <input type="number" placeholder="2.0" className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg" />
                    </div>
                    <div>
                        <label className="text-sm text-slate-400">Min ROE %</label>
                        <input type="number" placeholder="15" className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg" />
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition">
                        Filtrele
                    </button>
                    <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition">
                        Sıfırla
                    </button>
                </div>
            </div>

            {/* Results Table */}
            <div className="card overflow-x-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Sonuçlar ({stocks.length} hisse)</h3>
                    <select className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-sm">
                        <option>Erdinç Skoru (Yüksek-Düşük)</option>
                        <option>F/K (Düşük-Yüksek)</option>
                        <option>ROE (Yüksek-Düşük)</option>
                    </select>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Hisse</th>
                            <th>Sektör</th>
                            <th>F/K</th>
                            <th>PD/DD</th>
                            <th>ROE</th>
                            <th>Erdinç Skoru</th>
                            <th>Sinyal</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {stocks.map((stock) => (
                            <tr key={stock.kod}>
                                <td>
                                    <div className="font-semibold">{stock.kod}</div>
                                    <div className="text-xs text-slate-400">{stock.ad}</div>
                                </td>
                                <td className="text-slate-300">{stock.sektor}</td>
                                <td className={stock.fk <= 10 ? 'text-emerald-400' : ''}>{stock.fk}</td>
                                <td className={stock.pddd <= 1.5 ? 'text-emerald-400' : ''}>{stock.pddd}</td>
                                <td className={stock.roe >= 20 ? 'text-emerald-400' : ''}>{stock.roe}%</td>
                                <td>
                                    <span className={`px-2 py-1 rounded text-sm font-bold ${getScoreClass(stock.erdincSkor)}`}>
                                        {stock.erdincSkor}
                                    </span>
                                </td>
                                <td>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getSignalClass(stock.sinyal)}`}>
                                        {stock.sinyal}
                                    </span>
                                </td>
                                <td>
                                    <button className="text-emerald-400 hover:underline text-sm">Detay</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
