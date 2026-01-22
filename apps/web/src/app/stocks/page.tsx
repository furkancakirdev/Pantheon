// Hisseler Sayfası (Güncel Veriler)

interface Stock {
    kod: string;
    ad: string;
    fiyat: number;
    degisim: number;
    hacim: string;
}

export default function StocksPage() {
    const stocks: Stock[] = [
        { kod: 'ASELS', ad: 'Aselsan', fiyat: 64.25, degisim: 2.4, hacim: '5.4Mr' },
        { kod: 'THYAO', ad: 'Türk Hava Yolları', fiyat: 312.50, degisim: 1.8, hacim: '12.5Mr' },
        { kod: 'GARAN', ad: 'Garanti BBVA', fiyat: 124.60, degisim: 3.5, hacim: '8.5Mr' },
        { kod: 'TUPRS', ad: 'Tüpraş', fiyat: 168.40, degisim: 0.2, hacim: '3.2Mr' },
        { kod: 'MGROS', ad: 'Migros', fiyat: 510.25, degisim: 1.2, hacim: '950Mn' },
        { kod: 'AKBNK', ad: 'Akbank', fiyat: 68.90, degisim: 3.1, hacim: '6.4Mr' },
        { kod: 'SISE', ad: 'Şişecam', fiyat: 46.80, degisim: -1.2, hacim: '1.8Mr' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        📈 Hisseler
                    </h1>
                    <p className="text-slate-400">BIST 100 Gözetim Pazarı</p>
                </div>
            </div>

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
                                <tr key={stock.kod} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                                    <td className="p-3">
                                        <div className="font-bold">{stock.kod}</div>
                                        <div className="text-xs text-slate-400">{stock.ad}</div>
                                    </td>
                                    <td className="p-3 font-medium">{stock.fiyat.toFixed(2)} ₺</td>
                                    <td className={`p-3 font-bold ${stock.degisim >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        %{stock.degisim}
                                    </td>
                                    <td className="p-3 text-slate-300">{stock.hacim}</td>
                                    <td className="p-3 text-right">
                                        <button className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm text-white transition">
                                            Analiz Et
                                        </button>
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
