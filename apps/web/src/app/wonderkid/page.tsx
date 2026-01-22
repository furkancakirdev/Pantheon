// Wonderkid Sayfası
// Football Manager tarzı gelecek vaat eden şirketler

export default function WonderkidPage() {
    // Mock data
    const wonderkids = [
        {
            kod: 'ASELS',
            ad: 'Aselsan',
            sektor: 'Savunma',
            skor: 92,
            yildiz: true,
            trendler: ['savunma', 'teknoloji'],
            nedenler: [
                '🌍 Çoklu megatrend eşleşmesi: savunma, teknoloji',
                '🇹🇷 Türkiye stratejik sektöründe',
                '📈 Yüksek yabancı ilgisi: %42',
                '✅ Güçlü Erdinç skoru: 85/100',
            ],
            riskler: [],
        },
        {
            kod: 'THYAO',
            ad: 'Türk Hava Yolları',
            sektor: 'Havacılık',
            skor: 88,
            yildiz: true,
            trendler: ['havacılık'],
            nedenler: [
                '🌍 Megatrend eşleşmesi: havacılık',
                '🇹🇷 Türkiye stratejik sektöründe',
                '💰 Yüksek verimlilik: ROE %28',
            ],
            riskler: ['⚠️ Yüksek borçluluk: 1.8x'],
        },
        {
            kod: 'VESTL',
            ad: 'Vestel',
            sektor: 'Teknoloji',
            skor: 82,
            yildiz: true,
            trendler: ['teknoloji', 'yeşil enerji'],
            nedenler: [
                '🌍 Çoklu megatrend: teknoloji, yeşil enerji',
                '📈 İhracat potansiyeli yüksek',
            ],
            riskler: ['⚠️ Yüksek değerleme: F/K 18'],
        },
        {
            kod: 'KORDS',
            ad: 'Kordsa',
            sektor: 'Kimya',
            skor: 78,
            yildiz: false,
            trendler: ['otomotiv'],
            nedenler: [
                '🌍 Elektrikli araç trendi',
                '🌍 Global müşteri portföyü',
            ],
            riskler: [],
        },
        {
            kod: 'TOASO',
            ad: 'Tofaş',
            sektor: 'Otomotiv',
            skor: 75,
            yildiz: false,
            trendler: ['elektrikli araç', 'otomasyon'],
            nedenler: [
                '🚗 Elektrikli araç yatırımları',
                '🤖 Otomasyon artışı',
            ],
            riskler: ['⚠️ Sektör döngüselliği'],
        },
    ];

    function getScoreClass(score: number) {
        if (score >= 75) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        if (score >= 50) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <span className="text-yellow-400">⭐</span>
                    Wonderkid Keşif Motoru
                </h1>
                <p className="text-slate-400">
                    Football Manager tarzı - Gelecek vaat eden şirketlerin analizi
                </p>
            </div>

            {/* Info Card */}
            <div className="card bg-gradient-to-r from-emerald-900/20 to-slate-900 border-emerald-500/30">
                <h3 className="font-semibold text-emerald-400 mb-2">🎯 Wonderkid Nedir?</h3>
                <p className="text-sm text-slate-300">
                    Wonderkid analizi, Football Manager oyunundaki &quot;genç yetenek&quot; mantığıyla çalışır.
                    Şirketlerin yönetim vizyonu, sektör potansiyeli, küresel trendlerle uyumu ve finansal
                    dinamizmi analiz edilerek gelecekte parlayacak şirketler tespit edilir.
                </p>
            </div>

            {/* Wonderkid Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wonderkids.map((wk, index) => (
                    <div
                        key={wk.kod}
                        className={`card relative ${wk.yildiz ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-900/10 to-slate-900' : ''}`}
                    >
                        {/* Rank Badge */}
                        <div className="absolute -top-2 -left-2 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-sm font-bold border border-slate-700">
                            {index + 1}
                        </div>

                        {/* Star Badge */}
                        {wk.yildiz && (
                            <div className="absolute -top-2 -right-2 text-2xl wonderkid-star">⭐</div>
                        )}

                        {/* Header */}
                        <div className="flex items-start justify-between mb-4 pt-2">
                            <div>
                                <h3 className="text-xl font-bold">{wk.kod}</h3>
                                <p className="text-slate-400 text-sm">{wk.ad}</p>
                                <p className="text-xs text-slate-500">{wk.sektor}</p>
                            </div>
                            <div className={`score-badge text-lg ${getScoreClass(wk.skor)}`}>
                                {wk.skor}
                            </div>
                        </div>

                        {/* Trend Tags */}
                        <div className="flex flex-wrap gap-1 mb-4">
                            {wk.trendler.map(trend => (
                                <span key={trend} className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-300">
                                    {trend}
                                </span>
                            ))}
                        </div>

                        {/* Reasons */}
                        <div className="space-y-1 mb-3">
                            {wk.nedenler.slice(0, 3).map((neden, i) => (
                                <p key={i} className="text-xs text-slate-300">{neden}</p>
                            ))}
                        </div>

                        {/* Risks */}
                        {wk.riskler.length > 0 && (
                            <div className="border-t border-slate-800 pt-2 mt-2">
                                {wk.riskler.map((risk, i) => (
                                    <p key={i} className="text-xs text-amber-400">{risk}</p>
                                ))}
                            </div>
                        )}

                        {/* Action */}
                        <button className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition">
                            Detaylı Rapor →
                        </button>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="card">
                <h3 className="font-semibold mb-3">📊 Skor Açıklaması</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="inline-block w-3 h-3 rounded bg-emerald-500 mr-2"></span>
                        75-100: Güçlü Wonderkid
                    </div>
                    <div>
                        <span className="inline-block w-3 h-3 rounded bg-amber-500 mr-2"></span>
                        50-74: Potansiyel Var
                    </div>
                    <div>
                        <span className="inline-block w-3 h-3 rounded bg-red-500 mr-2"></span>
                        0-49: Zayıf
                    </div>
                    <div>
                        <span className="text-yellow-400 mr-2">⭐</span>
                        Yıldız Adayı
                    </div>
                </div>
            </div>
        </div>
    );
}
