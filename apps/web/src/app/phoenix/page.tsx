// Phoenix - Strateji Tarama Sayfası (Güncel)

export default function PhoenixPage() {
    const scans = [
        { symbol: 'ASELS', price: 64.25, change: 2.4, signal: 'AL', reason: 'Golden Cross (50/200) + Hacim Artışı', score: 92 },
        { symbol: 'THYAO', price: 312.50, change: 1.8, signal: 'AL', reason: 'Düşen Kırılımı + RSI Pozitif Uyumsuzluk', score: 88 },
        { symbol: 'TUPRS', price: 168.40, change: 0.2, signal: 'BEKLE', reason: 'Destek Bölgesinde Konsolidasyon', score: 65 },
        { symbol: 'GARAN', price: 124.60, change: 3.5, signal: 'AL', reason: 'Yeni Zirve Kırılımı', score: 95 },
    ];

    const lastRun = {
        time: '23:45',
        scanned: 560,
        candidates: 42,
        shortlist: 8,
        mode: 'DENGELI (Balanced)',
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ... (Header ve Stat Box'lar aynı) ... */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        🔥 Phoenix Strateji Motoru
                    </h1>
                    <p className="text-slate-400">Otomatik tarama ve fırsat yakalama</p>
                </div>
                <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition shadow-lg shadow-orange-500/20">
                    🚀 Yeni Tarama Başlat
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-slate-500">
                    <div className="text-xs text-slate-400 uppercase">Taranan Hisse</div>
                    <div className="text-2xl font-bold">{lastRun.scanned}</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500">
                    <div className="text-xs text-slate-400 uppercase">Aday Havuzu</div>
                    <div className="text-2xl font-bold">{lastRun.candidates}</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-purple-500">
                    <div className="text-xs text-slate-400 uppercase">Shortlist</div>
                    <div className="text-2xl font-bold">{lastRun.shortlist}</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-orange-500">
                    <div className="text-xs text-slate-400 uppercase">Çalışma Modu</div>
                    <div className="text-lg font-bold text-orange-400">{lastRun.mode}</div>
                </div>
            </div>

            <div className="card">
                <h3 className="card-header">🎯 Son Tarama Sonuçları ({lastRun.time})</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 border-b border-slate-700">
                                <th className="p-3">Sembol</th>
                                <th className="p-3">Fiyat</th>
                                <th className="p-3">Değişim</th>
                                <th className="p-3">Skor</th>
                                <th className="p-3">Sinyal</th>
                                <th className="p-3">Gerekçe</th>
                                <th className="p-3">İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scans.map((stock) => (
                                <tr key={stock.symbol} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                                    <td className="p-3 font-bold">{stock.symbol}</td>
                                    <td className="p-3">{stock.price.toFixed(2)} ₺</td>
                                    <td className={`p-3 font-medium ${stock.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        %{stock.change}
                                    </td>
                                    <td className="p-3">
                                        <div className="w-16 bg-slate-700 rounded-full h-2">
                                            <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${stock.score}%` }}></div>
                                        </div>
                                        <span className="text-xs text-slate-400">{stock.score}</span>
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${stock.signal === 'AL' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                                            }`}>
                                            {stock.signal}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm text-slate-300">{stock.reason}</td>
                                    <td className="p-3">
                                        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">İncele</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
