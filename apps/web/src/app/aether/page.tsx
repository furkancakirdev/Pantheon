// Aether - Makroekonomik Analiz Sayfası

export default function AetherPage() {
    const data = {
        regime: 'EUPHORIA',
        score: 88,
        allocation: { equity: 80, bond: 10, gold: 10, cash: 0 },
        indicators: [
            { name: 'VIX (Korku Endeksi)', value: '12.4', signal: 'DÜŞÜK', status: 'pozitif' },
            { name: 'DXY (Dolar Endeksi)', value: '102.5', signal: 'NÖTR', status: 'notr' },
            { name: 'Tahvil Faizi (10Y)', value: '4.1%', signal: 'DÜŞÜŞTE', status: 'pozitif' },
            { name: 'Enflasyon Beklentisi', value: '2.8%', signal: 'STABİL', status: 'pozitif' },
        ]
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        🌍 Aether Makro Analiz
                    </h1>
                    <p className="text-slate-400">Piyasa rejimi ve varlık dağılım önerileri</p>
                </div>
                <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/30">
                    <div className="text-xs text-center uppercase">Piyasa Rejimi</div>
                    <div className="text-xl font-bold">{data.regime}</div>
                </div>
            </div>

            {/* Allocation Chart (Mock) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="card-header">🎯 Hedef Varlık Dağılımı</h3>
                    <div className="flex items-end gap-4 h-48 mt-4">
                        <div className="flex-1 bg-blue-500/20 rounded-t-lg relative group">
                            <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-lg transition-all" style={{ height: `${data.allocation.equity}%` }}></div>
                            <div className="absolute -top-6 w-full text-center font-bold text-blue-400">%{data.allocation.equity}</div>
                            <div className="absolute bottom-2 w-full text-center text-xs font-bold text-white z-10">Hisse</div>
                        </div>
                        <div className="flex-1 bg-yellow-500/20 rounded-t-lg relative group">
                            <div className="absolute bottom-0 w-full bg-yellow-500 rounded-t-lg transition-all" style={{ height: `${data.allocation.gold}%` }}></div>
                            <div className="absolute -top-6 w-full text-center font-bold text-yellow-400">%{data.allocation.gold}</div>
                            <div className="absolute bottom-2 w-full text-center text-xs font-bold text-white z-10">Altın</div>
                        </div>
                        <div className="flex-1 bg-green-500/20 rounded-t-lg relative group">
                            <div className="absolute bottom-0 w-full bg-green-500 rounded-t-lg transition-all" style={{ height: `${data.allocation.bond}%` }}></div>
                            <div className="absolute -top-6 w-full text-center font-bold text-green-400">%{data.allocation.bond}</div>
                            <div className="absolute bottom-2 w-full text-center text-xs font-bold text-white z-10">Tahvil</div>
                        </div>
                        <div className="flex-1 bg-slate-500/20 rounded-t-lg relative group">
                            <div className="absolute bottom-0 w-full bg-slate-500 rounded-t-lg transition-all" style={{ height: `${data.allocation.cash}%` }}></div>
                            <div className="absolute -top-6 w-full text-center font-bold text-slate-400">%{data.allocation.cash}</div>
                            <div className="absolute bottom-2 w-full text-center text-xs font-bold text-white z-10">Nakit</div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 className="card-header">📊 Makro İndikatörler</h3>
                    <div className="space-y-4">
                        {data.indicators.map((ind, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                <div>
                                    <div className="font-medium">{ind.name}</div>
                                    <div className="text-xl font-bold text-slate-200">{ind.value}</div>
                                </div>
                                <div className={`px-3 py-1 rounded text-sm font-bold ${ind.status === 'pozitif' ? 'bg-emerald-500/20 text-emerald-400' :
                                        ind.status === 'negatif' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'
                                    }`}>
                                    {ind.signal}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card bg-purple-900/10 border-purple-500/30">
                <h3 className="font-semibold text-purple-400 mb-2">💡 Aether Notu</h3>
                <p className="text-slate-300">
                    Aether skoru 85'in üzerinde (Euphoria). Piyasalarda aşırı coşku hakim.
                    Hisse senedi ağırlığı yüksek tutulabilir ancak kar realizasyonu için tetikte olunmalı.
                    VIX düşük seyrediyor, risk iştahı açık.
                </p>
            </div>
        </div>
    );
}
