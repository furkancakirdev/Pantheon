/**
 * ScoreCard - Hisse skor kartı bileşeni
 * Hem server hem client component'te kullanılabilir
 */

import Link from 'next/link';

interface StockScore {
    kod: string;
    ad: string;
    toplamSkor: number;
    sinyal: string;
}

interface ScoreCardProps {
    stock: StockScore;
    index?: number;
    variant?: 'default' | 'compact';
}

function getScoreClass(score: number) {
    if (score >= 75) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
}

function getSignalClass(signal: string) {
    const s = signal?.toUpperCase() || '';
    if (s.includes('AL')) return 'signal-al';
    if (s.includes('SAT')) return 'signal-sat';
    return 'signal-bekle';
}

export function ScoreCard({ stock, index, variant = 'default' }: ScoreCardProps) {
    if (variant === 'compact') {
        return (
            <Link
                href={`/stocks?symbol=${stock.kod}`}
                className="block p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-emerald-400">#{index}</span>
                        <div>
                            <div className="font-semibold">{stock.kod}</div>
                            <div className="text-xs text-slate-400">{stock.ad || stock.kod}</div>
                        </div>
                    </div>
                    <div className={`score-badge ${getScoreClass(stock.toplamSkor)}`}>
                        {stock.toplamSkor}
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={`/stocks?symbol=${stock.kod}`}
            className="block p-4 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition border border-slate-700/50"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-emerald-400">
                        {index}
                    </div>
                    <div>
                        <div className="font-semibold text-lg">{stock.kod}</div>
                        <div className="text-sm text-slate-400">{stock.ad || stock.kod}</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`score-badge ${getScoreClass(stock.toplamSkor)}`}>
                        {stock.toplamSkor}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getSignalClass(stock.sinyal)}`}>
                        {stock.sinyal || 'BEKLE'}
                    </span>
                </div>
            </div>
        </Link>
    );
}

export { getScoreClass, getSignalClass };
