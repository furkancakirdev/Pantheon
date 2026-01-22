// Sentiment Sayfası
// Piyasa duyarlılığı ve sosyal medya analizi

export default function SentimentPage() {
    // Mock data
    const genelSentiment = 0.68;
    const genelLabel = 'POZİTİF';

    const takipHesaplari = [
        { handle: 'prideveteran1', odak: 'genel piyasa', sonPost: 'BIST güçlü görünüyor', sentiment: 0.8 },
        { handle: 'kursadbucak', odak: 'teknik analiz', sonPost: '$THYAO destek test ediyor', sentiment: 0.5 },
        { handle: 'ganicyus', odak: 'portföy', sonPost: 'Bankacılık sektörü cazip', sentiment: 0.7 },
        { handle: 'yatirimcibaba1', odak: 'değer yatırımı', sonPost: '$ASELS için hedef güncellendi', sentiment: 0.9 },
        { handle: 'Finansalpsk', odak: 'temel analiz', sonPost: '$KCHOL bilanço güçlü', sentiment: 0.6 },
    ];

    const trendingHisseler = [
        { kod: 'THYAO', mention: 145, sentiment: 0.72 },
        { kod: 'ASELS', mention: 98, sentiment: 0.85 },
        { kod: 'KCHOL', mention: 67, sentiment: 0.58 },
        { kod: 'AKBNK', mention: 54, sentiment: 0.65 },
        { kod: 'TUPRS', mention: 43, sentiment: 0.42 },
    ];

    const sonPostlar = [
        { hesap: 'prideveteran1', metin: '$THYAO bugün güçlü bir yükseliş trendi gösteriyor. Destek seviyesi korundu.', sentiment: 0.8, tarih: '2 saat önce' },
        { hesap: 'yatirimcibaba1', metin: '$ASELS savunma sektöründe lider konumunu sürdürüyor. Uzun vadeli al.', sentiment: 0.9, tarih: '3 saat önce' },
        { hesap: 'kursadbucak', metin: 'BIST 100 direnç bölgesinde. Kırılım olursa yeni rekorlar gelebilir.', sentiment: 0.6, tarih: '4 saat önce' },
        { hesap: 'Finansalpsk', metin: '$SISE cam sektörü ihracat verileri beklentinin üzerinde geldi.', sentiment: 0.7, tarih: '5 saat önce' },
    ];

    function getSentimentColor(sentiment: number) {
        if (sentiment >= 0.6) return 'text-emerald-400';
        if (sentiment >= 0.4) return 'text-amber-400';
        return 'text-red-400';
    }

    function getSentimentEmoji(sentiment: number) {
        if (sentiment >= 0.6) return '🟢';
        if (sentiment >= 0.4) return '🟡';
        return '🔴';
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">🐦 Piyasa Duyarlılığı</h1>
                <p className="text-slate-400">Sosyal medya ve haber analizi</p>
            </div>

            {/* Genel Sentiment */}
            <div className="card bg-gradient-to-r from-emerald-900/20 to-slate-900 border-emerald-500/30">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg text-slate-400">Genel Piyasa Duyarlılığı</h2>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-4xl font-bold text-emerald-400">
                                {(genelSentiment * 100).toFixed(0)}%
                            </span>
                            <span className="text-2xl">{genelLabel === 'POZİTİF' ? '🟢' : genelLabel === 'NEGATİF' ? '🔴' : '🟡'}</span>
                            <span className="text-xl text-emerald-400">{genelLabel}</span>
                        </div>
                    </div>
                    <div className="text-right text-sm text-slate-400">
                        <div>12 hesap takip ediliyor</div>
                        <div>Son güncelleme: 5 dk önce</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trending Hisseler */}
                <div className="card">
                    <h2 className="card-header">📈 En Çok Konuşulan Hisseler</h2>
                    <div className="space-y-3">
                        {trendingHisseler.map((hisse, i) => (
                            <div key={hisse.kod} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-slate-500">#{i + 1}</span>
                                    <div>
                                        <div className="font-semibold">${hisse.kod}</div>
                                        <div className="text-xs text-slate-400">{hisse.mention} mention</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold ${getSentimentColor(hisse.sentiment)}`}>
                                        {(hisse.sentiment * 100).toFixed(0)}%
                                    </span>
                                    <span>{getSentimentEmoji(hisse.sentiment)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Takip Edilen Hesaplar */}
                <div className="card">
                    <h2 className="card-header">👥 Takip Edilen Hesaplar</h2>
                    <div className="space-y-3">
                        {takipHesaplari.map((hesap) => (
                            <div key={hesap.handle} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                <div>
                                    <div className="font-semibold">@{hesap.handle}</div>
                                    <div className="text-xs text-slate-400">{hesap.odak}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={getSentimentColor(hesap.sentiment)}>
                                        {getSentimentEmoji(hesap.sentiment)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Son Postlar */}
            <div className="card">
                <h2 className="card-header">📝 Son Paylaşımlar</h2>
                <div className="space-y-4">
                    {sonPostlar.map((post, i) => (
                        <div key={i} className="p-4 bg-slate-800/50 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-emerald-400">@{post.hesap}</span>
                                    <span className="text-xs text-slate-500">{post.tarih}</span>
                                </div>
                                <span className={`font-bold ${getSentimentColor(post.sentiment)}`}>
                                    {getSentimentEmoji(post.sentiment)} {(post.sentiment * 100).toFixed(0)}%
                                </span>
                            </div>
                            <p className="text-slate-300">{post.metin}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Gündem */}
            <div className="card">
                <h2 className="card-header">🔥 Finans Gündemi</h2>
                <div className="flex flex-wrap gap-2">
                    {['BIST', 'Dolar', 'Altın', 'Merkez Bankası', 'Enflasyon', 'THYAO', 'ASELS', 'Temettü', 'Halka Arz', 'Faiz'].map(tag => (
                        <span key={tag} className="px-3 py-1 bg-slate-800 rounded-full text-sm hover:bg-slate-700 cursor-pointer transition">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
