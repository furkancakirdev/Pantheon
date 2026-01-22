// Chiron - Risk Yönetimi Sayfası

export default function ChironPage() {
    const data = {
        totalRisk: 1.4, // %1.4 risk
        maxRisk: 2.0,
        activeTrades: 4,
        maxTrades: 10,
        sectorExposure: [
            { name: 'Teknoloji', percent: 45, status: 'warning' },
            { name: 'Savunma', percent: 30, status: 'ok' },
            { name: 'Enerji', percent: 15, status: 'ok' },
            { name: 'Nakit', percent: 10, status: 'ok' },
        ],
        alerts: [
            { type: 'warning', msg: 'Teknoloji sektörü ağırlığı %40 sınırını aştı.' },
            { type: 'info', msg: 'Cooldown aktif değil. Yeni işlem açılabilir.' },
        ]
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        🛡️ Chiron Risk Kalkanı
                    </h1>
                    <p className="text-slate-400">Portföy riski ve limit kontrolleri</p>
                </div>
                <div className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg border border-blue-500/30">
                    <div className="text-xs text-center uppercase">Risk Seviyesi</div>
                    <div className="text-xl font-bold">MAKUL</div>
                </div>
            </div>

            {/* Risk Meters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card text-center">
                    <h3 className="text-slate-400 text-sm mb-2">Toplam R-Risk</h3>
                    <div className="relative pt-4">
                        <div className="text-4xl font-bold text-emerald-400">%{data.totalRisk}</div>
                        <div className="text-xs text-slate-500 mt-1">Limit: %{data.maxRisk}</div>
                        <div className="w-full bg-slate-800 h-2 mt-4 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(data.totalRisk / data.maxRisk) * 100}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="card text-center">
                    <h3 className="text-slate-400 text-sm mb-2">Aktif Pozisyonlar</h3>
                    <div className="relative pt-4">
                        <div className="text-4xl font-bold text-blue-400">{data.activeTrades}</div>
                        <div className="text-xs text-slate-500 mt-1">Limit: {data.maxTrades}</div>
                        <div className="w-full bg-slate-800 h-2 mt-4 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full transition-all" style={{ width: `${(data.activeTrades / data.maxTrades) * 100}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 className="card-header">Sektör Dağılımı</h3>
                    <div className="space-y-3">
                        {data.sectorExposure.map((sec, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>{sec.name}</span>
                                    <span className={sec.status === 'warning' ? 'text-yellow-400' : 'text-slate-400'}>%{sec.percent}</span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${sec.status === 'warning' ? 'bg-yellow-500' : 'bg-slate-500'}`}
                                        style={{ width: `${sec.percent}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Alerts */}
            <div className="card">
                <h3 className="card-header">🔔 Chiron Bildirimleri</h3>
                <div className="space-y-3">
                    {data.alerts.map((alert, i) => (
                        <div key={i} className={`p-4 rounded-lg flex items-start gap-3 ${alert.type === 'warning' ? 'bg-yellow-500/10 text-yellow-200 border border-yellow-500/20' :
                                'bg-blue-500/10 text-blue-200 border border-blue-500/20'
                            }`}>
                            <span className="text-lg">{alert.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                            <div>{alert.msg}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
