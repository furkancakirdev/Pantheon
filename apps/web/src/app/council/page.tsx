// Grand Council Sayfası
// Argus Terminal'den ilham - Tüm modüllerin oylama ile karar vermesi

export default function CouncilPage() {
    // Mock data - Grand Council kararı
    const councilKarar = {
        hisse: 'ASELS',
        ad: 'Aselsan',
        sonKarar: 'AL' as const,
        konsensus: 82,
        tarih: new Date().toLocaleString('tr-TR'),
        oylar: [
            { modul: 'Atlas (Temel - Erdinç)', oy: 'AL', guven: 85, aciklama: 'Erdinç skoru: 85/100. F/K düşük, ROE yüksek' },
            { modul: 'Demeter (Sektör - Wonderkid)', oy: 'AL', guven: 92, aciklama: 'Wonderkid skoru: 92/100. Savunma + Teknoloji trendi' },
            { modul: 'Orion (Teknik - Kıvanç)', oy: 'AL', guven: 75, aciklama: 'AlphaTrend: AL, MOST: AL sinyali' },
            { modul: 'Athena (Faktör - Perşembe)', oy: 'BEKLE', guven: 60, aciklama: 'Trend: YUKARI, ancak direnç yakın' },
            { modul: 'Hermes (Sentiment)', oy: 'AL', guven: 78, aciklama: 'Piyasa duyarlılığı: %72 pozitif' },
        ],
        toplamOy: { al: 4, sat: 0, bekle: 1 },
    };

    const digerKararlar = [
        { hisse: 'THYAO', sonKarar: 'AL', konsensus: 75 },
        { hisse: 'KCHOL', sonKarar: 'BEKLE', konsensus: 58 },
        { hisse: 'TUPRS', sonKarar: 'BEKLE', konsensus: 52 },
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
                    🏛️ Grand Council
                </h1>
                <p className="text-slate-400">
                    Argus tarzı - Tüm analiz modüllerinin oylama ile karar vermesi
                </p>
            </div>

            {/* Info Card */}
            <div className="card bg-gradient-to-r from-purple-900/20 to-slate-900 border-purple-500/30">
                <h3 className="font-semibold text-purple-400 mb-2">🎯 Grand Council Nedir?</h3>
                <p className="text-sm text-slate-300">
                    Argus Terminal&apos;den ilham alarak oluşturulmuş bu sistem, tüm analiz modüllerinin
                    (Erdinç, Wonderkid, Kıvanç, Perşembe, Sentiment) bir hisse için oy vermesini sağlar.
                    Oylar güven seviyesiyle ağırlıklandırılır ve final karar konsensus ile belirlenir.
                </p>
            </div>

            {/* Featured Decision */}
            <div className="card border-2 border-purple-500/30">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold">{councilKarar.hisse} - {councilKarar.ad}</h2>
                        <p className="text-sm text-slate-400">Son güncelleme: {councilKarar.tarih}</p>
                    </div>
                    <div className="text-right">
                        <div className={`text-3xl font-bold px-4 py-2 rounded-lg border ${getKararClass(councilKarar.sonKarar)}`}>
                            {getKararEmoji(councilKarar.sonKarar)} {councilKarar.sonKarar}
                        </div>
                        <div className="text-sm text-slate-400 mt-1">Konsensus: %{councilKarar.konsensus}</div>
                    </div>
                </div>

                {/* Voting Summary */}
                <div className="flex gap-4 mb-4">
                    <div className="flex-1 text-center p-3 bg-emerald-500/10 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-400">{councilKarar.toplamOy.al}</div>
                        <div className="text-xs text-slate-400">AL Oyu</div>
                    </div>
                    <div className="flex-1 text-center p-3 bg-red-500/10 rounded-lg">
                        <div className="text-2xl font-bold text-red-400">{councilKarar.toplamOy.sat}</div>
                        <div className="text-xs text-slate-400">SAT Oyu</div>
                    </div>
                    <div className="flex-1 text-center p-3 bg-amber-500/10 rounded-lg">
                        <div className="text-2xl font-bold text-amber-400">{councilKarar.toplamOy.bekle}</div>
                        <div className="text-xs text-slate-400">BEKLE Oyu</div>
                    </div>
                </div>

                {/* Module Votes */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-slate-300">Modül Oyları</h3>
                    {councilKarar.oylar.map((oy, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                            <div className="flex-1">
                                <div className="font-medium">{oy.modul}</div>
                                <div className="text-xs text-slate-400">{oy.aciklama}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-sm text-slate-400">%{oy.guven} güven</div>
                                <div className={`px-3 py-1 rounded font-bold text-sm ${getKararClass(oy.oy)}`}>
                                    {getKararEmoji(oy.oy)} {oy.oy}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Other Decisions */}
            <div className="card">
                <h2 className="card-header">📊 Diğer Council Kararları</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {digerKararlar.map((k) => (
                        <div key={k.hisse} className="p-4 bg-slate-800/50 rounded-lg text-center">
                            <div className="text-lg font-bold mb-2">{k.hisse}</div>
                            <div className={`inline-block px-3 py-1 rounded font-bold ${getKararClass(k.sonKarar)}`}>
                                {getKararEmoji(k.sonKarar)} {k.sonKarar}
                            </div>
                            <div className="text-xs text-slate-400 mt-2">%{k.konsensus} konsensus</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modül Açıklamaları */}
            <div className="card">
                <h3 className="card-header">📚 Modül Referansları</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="font-semibold text-blue-400">Atlas (Temel Analiz)</div>
                        <div className="text-slate-400">Yaşar Erdinç kriterleri: F/K, PD/DD, ROE, DuPont</div>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="font-semibold text-yellow-400">Demeter (Sektör Rotasyonu)</div>
                        <div className="text-slate-400">Wonderkid: Megatrend eşleştirme, yönetim vizyonu</div>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="font-semibold text-purple-400">Orion (Teknik Analiz)</div>
                        <div className="text-slate-400">Kıvanç: AlphaTrend, MOST, MavilimW</div>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="font-semibold text-cyan-400">Athena (Faktör Analizi)</div>
                        <div className="text-slate-400">Ali Perşembe: Destek/Direnç, Trend, Fibonacci</div>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="font-semibold text-pink-400">Hermes (Sentiment)</div>
                        <div className="text-slate-400">Sosyal medya: 22 hesap, Türkçe NLP</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
