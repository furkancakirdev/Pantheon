// Grand Council V2 Sayfası
// 7 Modüllü Tam Entegrasyon

export default function CouncilPage() {
    // Mock data - Grand Council kararı
    const councilKarar = {
        hisse: 'ASELS',
        ad: 'Aselsan',
        sonKarar: 'AL' as const,
        konsensus: 88,
        tarih: new Date().toLocaleString('tr-TR'),
        oylar: [
            { modul: 'Atlas V2 (Temel)', oy: 'AL', guven: 85, aciklama: 'F/K: 12.5 (Makul), PD/DD: 1.8. Özsermaye karlılığı artışta.' },
            { modul: 'Orion V3 (Teknik)', oy: 'AL', guven: 78, aciklama: 'Trend: 25/30, Momentum: 20/25. SMA20 > SMA50 > SMA200.' },
            { modul: 'Demeter (Sektör)', oy: 'AL', guven: 92, aciklama: 'Savunma sanayi megatrendi. Sektör lideri.' },
            { modul: 'Aether (Makro)', oy: 'AL', guven: 85, aciklama: 'Euphoria rejimi. Risk iştahı yüksek.' },
            { modul: 'Chiron (Risk)', oy: 'BEKLE', guven: 60, aciklama: 'Portföyde savunma ağırlığı %30, limit sınırında.' },
            { modul: 'Phoenix (Strateji)', oy: 'AL', guven: 90, aciklama: 'Golden Cross taramasında yakalandı (Skor: 88).' },
            { modul: 'Hermes (Sentiment)', oy: 'AL', guven: 75, aciklama: 'Sosyal medya duyarlılığı %75 pozitif.' },
        ],
        toplamOy: { al: 6, sat: 0, bekle: 1 },
    };

    const digerKararlar = [
        { hisse: 'THYAO', sonKarar: 'AL', konsensus: 82 },
        { hisse: 'KCHOL', sonKarar: 'BEKLE', konsensus: 58 },
        { hisse: 'TUPRS', sonKarar: 'SAT', konsensus: 72 }, // Sat örneği
        { hisse: 'SISE', sonKarar: 'AL', konsensus: 68 },
    ];

    function getKararClass(karar: string) {
        if (karar === 'AL') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        if (karar === 'SAT') return 'bg-red-500/20 text-red-400 border-red-500/30';
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }

    function getKararEmoji(karar: string) {
        if (karar === 'AL') return '🟢';
        if (karar === 'SAT') return '🔴';
        return '🟡';
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    🏛️ Grand Council V2
                </h1>
                <p className="text-slate-400">
                    7 Bilge Modül tarafından yönetilen merkezi karar mekanizması
                </p>
            </div>

            {/* Featured Decision */}
            <div className="card border-2 border-purple-500/30">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-white">{councilKarar.hisse} - {councilKarar.ad}</h2>
                        <p className="text-sm text-slate-400">Son güncelleme: {councilKarar.tarih}</p>
                    </div>
                    <div className="text-right">
                        <div className={`text-4xl font-black px-6 py-3 rounded-lg border-2 ${getKararClass(councilKarar.sonKarar)} shadow-lg shadow-emerald-500/20`}>
                            {getKararEmoji(councilKarar.sonKarar)} {councilKarar.sonKarar}
                        </div>
                        <div className="text-sm font-bold text-slate-300 mt-2 tracking-wide uppercase">Konsensus: %{councilKarar.konsensus}</div>
                    </div>
                </div>

                {/* Voting Summary */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <div className="text-3xl font-bold text-emerald-400">{councilKarar.toplamOy.al}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">AL Oyu</div>
                    </div>
                    <div className="flex-1 text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                        <div className="text-3xl font-bold text-red-400">{councilKarar.toplamOy.sat}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">SAT Oyu</div>
                    </div>
                    <div className="flex-1 text-center p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                        <div className="text-3xl font-bold text-amber-400">{councilKarar.toplamOy.bekle}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">BEKLE Oyu</div>
                    </div>
                </div>

                {/* Module Votes List */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-slate-300 border-b border-slate-700 pb-2 mb-4">Modül Oyları ve Gerekçeler</h3>
                    {councilKarar.oylar.map((oy, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-500 transition">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="font-bold text-lg text-slate-200">{oy.modul}</div>
                                    <div className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">Güven: %{oy.guven}</div>
                                </div>
                                <div className="text-sm text-slate-400 leading-relaxed">{oy.aciklama}</div>
                            </div>
                            <div className="ml-4">
                                <div className={`px-4 py-2 rounded-lg font-bold text-sm min-w-[80px] text-center ${getKararClass(oy.oy)}`}>
                                    {oy.oy}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Other Decisions */}
            <div className="card">
                <h2 className="card-header">📊 İzleme Listesi Özetleri</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {digerKararlar.map((k) => (
                        <div key={k.hisse} className="p-4 bg-slate-800/50 rounded-lg text-center hover:bg-slate-800 transition cursor-pointer">
                            <div className="text-lg font-bold mb-2 text-white">{k.hisse}</div>
                            <div className={`inline-block px-3 py-1 rounded font-bold mb-2 ${getKararClass(k.sonKarar)}`}>
                                {k.sonKarar}
                            </div>
                            <div className="text-xs text-slate-400 font-medium">%{k.konsensus} Güç</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
