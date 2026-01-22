// Orion V3 - Teknik Analiz Detay sayfası

export default function OrionPage() {
    const analysis = {
        symbol: 'ASELS',
        totalScore: 78,
        components: {
            trend: { score: 25, max: 30, details: ['Fiyat > SMA200', 'Altın Kesişim (Golden Cross)'] },
            momentum: { score: 20, max: 25, details: ['RSI: 62 (Güçlü)', 'Hacim artışta'] },
            volatility: { score: 8, max: 10, details: ['ATR stabil', 'Bollinger Daralması Yok'] },
            structure: { score: 15, max: 20, details: ['HH + HL yapısı korunuyor'] },
            pattern: { score: 10, max: 15, details: ['Bayrak formasyonu oluşumu'] },
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        ⚡ Orion V3 Teknik Analiz
                    </h1>
                    <p className="text-slate-400">Detaylı teknik puanlama ve bileşen analizi</p>
                </div>
                <div className="flex items-center gap-4">
                    <input className="bg-slate-800 border-none rounded px-3 py-2 text-white w-32" placeholder="Hisse Ara..." defaultValue="ASELS" />
                    <div className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-lg border border-purple-500/30">
                        <div className="text-xs text-center uppercase">Orion Skoru</div>
                        <div className="text-xl font-bold">{analysis.totalScore}/100</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Trend */}
                <div className="card border-t-4 border-blue-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Trend</h3>
                        <span className="font-bold text-blue-400">{analysis.components.trend.score}/{analysis.components.trend.max}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full mb-4">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(analysis.components.trend.score / analysis.components.trend.max) * 100}%` }}></div>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-300">
                        {analysis.components.trend.details.map((d, i) => <li key={i}>✅ {d}</li>)}
                    </ul>
                </div>

                {/* Momentum */}
                <div className="card border-t-4 border-pink-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Momentum</h3>
                        <span className="font-bold text-pink-400">{analysis.components.momentum.score}/{analysis.components.momentum.max}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full mb-4">
                        <div className="bg-pink-500 h-full rounded-full" style={{ width: `${(analysis.components.momentum.score / analysis.components.momentum.max) * 100}%` }}></div>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-300">
                        {analysis.components.momentum.details.map((d, i) => <li key={i}>⚡ {d}</li>)}
                    </ul>
                </div>

                {/* Volatilite */}
                <div className="card border-t-4 border-yellow-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Volatilite</h3>
                        <span className="font-bold text-yellow-400">{analysis.components.volatility.score}/{analysis.components.volatility.max}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full mb-4">
                        <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${(analysis.components.volatility.score / analysis.components.volatility.max) * 100}%` }}></div>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-300">
                        {analysis.components.volatility.details.map((d, i) => <li key={i}>📊 {d}</li>)}
                    </ul>
                </div>

                {/* Yapı */}
                <div className="card border-t-4 border-green-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Market Yapısı</h3>
                        <span className="font-bold text-green-400">{analysis.components.structure.score}/{analysis.components.structure.max}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full mb-4">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: `${(analysis.components.structure.score / analysis.components.structure.max) * 100}%` }}></div>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-300">
                        {analysis.components.structure.details.map((d, i) => <li key={i}>🧱 {d}</li>)}
                    </ul>
                </div>

                {/* Pattern */}
                <div className="card border-t-4 border-cyan-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Formasyon</h3>
                        <span className="font-bold text-cyan-400">{analysis.components.pattern.score}/{analysis.components.pattern.max}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full mb-4">
                        <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(analysis.components.pattern.score / analysis.components.pattern.max) * 100}%` }}></div>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-300">
                        {analysis.components.pattern.details.map((d, i) => <li key={i}>📐 {d}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
}
