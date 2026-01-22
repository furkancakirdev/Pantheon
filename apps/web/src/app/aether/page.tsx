// Aether - Makroekonomik Analiz Sayfası (Güncel)

export default function AetherPage() {
    const data = {
        regime: 'RISK_ON', // Euphoria'dan Risk On'a revize
        score: 78,
        allocation: { equity: 75, bond: 15, gold: 5, cash: 5 },
        indicators: [
            { name: 'VIX (Korku Endeksi)', value: '14.2', signal: 'NORMAL', status: 'notr' },
            { name: 'DXY (Dolar Endeksi)', value: '103.8', signal: 'YÜKSELİŞ', status: 'negatif' },
            { name: 'Tahvil Faizi (10Y)', value: '4.25%', signal: 'YÜKSEK', status: 'negatif' },
            { name: 'Enflasyon (TR)', value: '%42', signal: 'YÜKSEK', status: 'negatif' },
            { name: 'Büyüme Beklentisi', value: '%3.5', signal: 'POZİTİF', status: 'pozitif' },
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

            {/* Allocation Chart */}
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

            <div className="card bg-blue-900/10 border-blue-500/30">
                <h3 className="font-semibold text-blue-400 mb-2">💡 Aether Görüşü</h3>
                <p className="text-slate-300">
                    Aether skoru 78 (Risk On). Enflasyon baskısı sürse de büyüme beklentileri hisse senetlerini destekliyor.
                    Dolar endeksindeki (DXY) yükseliş gelişmekte olan piyasalar için risk oluştursa da BIST tarafında seçici hisse alımları (Stock Picking) önerilir.
                    Nakit oranı %5 seviyesine çekilerek fırsatlar değerlendirilmeli.
                </p>
            </div>
        </div>
    );
}
