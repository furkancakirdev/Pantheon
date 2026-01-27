/**
 * LiveQuoteCard - Canlı Piyasa Verisi Bileşeni
 *
 * SSE stream'den gelen canlı veriyi gösterir
 *
 * Kullanım:
 * <LiveQuoteCard symbol="THYAO" />
 * <LiveQuoteGrid symbols={['THYAO', 'ASELS', 'GARAN']} />
 */

'use client';

import React, { useMemo } from 'react';
import { useQuote, useMarketStream, StreamQuote } from '@/hooks/useMarketStream';

// ============ STYLES ============

const styles = {
    card: 'bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 transition-all duration-300',
    pulse: 'animate-pulse',
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400',
    glowGreen: 'shadow-[0_0_20px_rgba(74,222,128,0.3)]',
    glowRed: 'shadow-[0_0_20px_rgba(248,113,113,0.3)]'
};

// ============ SINGLE QUOTE CARD ============

interface LiveQuoteCardProps {
    symbol: string;
    showDetails?: boolean;
    className?: string;
}

export function LiveQuoteCard({ symbol, showDetails = false, className = '' }: LiveQuoteCardProps) {
    const { quote, connected, error } = useQuote(symbol, {
        interval: 1000,
        autoReconnect: true
    });

    const [prevPrice, setPrevPrice] = React.useState<number | null>(null);
    const [direction, setDirection] = React.useState<'up' | 'down' | 'neutral'>('neutral');

    // Fiyat değişimini takip et
    React.useEffect(() => {
        if (quote && prevPrice !== null) {
            if (quote.price > prevPrice) {
                setDirection('up');
            } else if (quote.price < prevPrice) {
                setDirection('down');
            }
        }
        if (quote) {
            setPrevPrice(quote.price);
            // 500ms sonra direction'u sıfırla
            const timer = setTimeout(() => setDirection('neutral'), 500);
            return () => clearTimeout(timer);
        }
    }, [quote, prevPrice]);

    const changeClass = useMemo(() => {
        if (!quote) return styles.neutral;
        return quote.changePercent >= 0 ? styles.positive : styles.negative;
    }, [quote]);

    const glowClass = useMemo(() => {
        if (direction === 'up') return styles.glowGreen;
        if (direction === 'down') return styles.glowRed;
        return '';
    }, [direction]);

    if (error) {
        return (
            <div className={`${styles.card} ${className} border-red-500/30`}>
                <div className="text-red-400 text-sm">{error}</div>
            </div>
        );
    }

    if (!quote) {
        return (
            <div className={`${styles.card} ${className} opacity-50`}>
                <div className="flex items-center justify-center h-20">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.card} ${glowClass} ${className}`}>
            {/* Header - Symbol and Status */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{quote.symbol}</span>
                    {connected && (
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                </div>
                {showDetails && (
                    <span className="text-xs text-gray-500">
                        {new Date(quote.timestamp).toLocaleTimeString('tr-TR')}
                    </span>
                )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-1">
                <span className={`text-2xl font-bold ${changeClass}`}>
                    {quote.price.toFixed(2)}
                </span>
                <span className={`text-sm ${changeClass}`}>
                    {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
                </span>
            </div>

            {/* Details */}
            {showDetails && (
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Yüksek:</span>
                        <span className="text-white">{quote.high?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Düşük:</span>
                        <span className="text-white">{quote.low?.toFixed(2)}</span>
                    </div>
                    {quote.bid && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Alış:</span>
                            <span className="text-white">{quote.bid.toFixed(2)}</span>
                        </div>
                    )}
                    {quote.ask && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Satış:</span>
                            <span className="text-white">{quote.ask.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between col-span-2">
                        <span className="text-gray-500">Hacim:</span>
                        <span className="text-white">{(quote.volume / 1000000).toFixed(2)}M</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============ QUOTE GRID ============

interface LiveQuoteGridProps {
    symbols: string[];
    columns?: number;
    showDetails?: boolean;
    className?: string;
}

export function LiveQuoteGrid({
    symbols,
    columns = 3,
    showDetails = false,
    className = ''
}: LiveQuoteGridProps) {
    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: '1rem'
    };

    return (
        <div className={className} style={gridStyle}>
            {symbols.map(symbol => (
                <LiveQuoteCard
                    key={symbol}
                    symbol={symbol}
                    showDetails={showDetails}
                />
            ))}
        </div>
    );
}

// ============ TICKER ============

interface LiveTickerProps {
    symbols: string[];
    className?: string;
}

export function LiveTicker({ symbols, className = '' }: LiveTickerProps) {
    const { quotes, connected } = useMarketStream(symbols, {
        interval: 500,
        autoReconnect: true
    });

    const quoteArray = useMemo(() => {
        return Array.from(quotes.values()).sort((a, b) => b.changePercent - a.changePercent);
    }, [quotes]);

    return (
        <div className={`flex items-center gap-6 overflow-hidden ${className}`}>
            {connected && (
                <span className="text-xs text-green-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    CANLI
                </span>
            )}
            {quoteArray.map(quote => {
                const changeClass = quote.changePercent >= 0 ? 'text-green-400' : 'text-red-400';
                return (
                    <div key={quote.symbol} className="flex items-center gap-2 whitespace-nowrap">
                        <span className="text-sm text-gray-400">{quote.symbol}</span>
                        <span className={`text-sm font-medium ${changeClass}`}>
                            {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ============ MINI SPARKLINE ============

interface MiniSparklineProps {
    symbol: string;
    dataPoints?: number;
}

export function MiniSparkline({ symbol, dataPoints = 20 }: MiniSparklineProps) {
    const { quote } = useQuote(symbol);
    const [history, setHistory] = React.useState<number[]>([]);

    React.useEffect(() => {
        if (quote) {
            setHistory(prev => {
                const newHistory = [...prev, quote.price];
                if (newHistory.length > dataPoints) {
                    return newHistory.slice(-dataPoints);
                }
                return newHistory;
            });
        }
    }, [quote, dataPoints]);

    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;

    const points = history.map((price, i) => {
        const x = (i / (dataPoints - 1)) * 100;
        const y = 100 - ((price - min) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    const color = quote && quote.changePercent >= 0 ? '#4ade80' : '#f87171';

    return (
        <svg viewBox="0 0 100 100" className="w-full h-8">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}

// ============ COMPACT TABLE ROW ============

interface CompactQuoteRowProps {
    symbol: string;
    onClick?: (symbol: string) => void;
}

export function CompactQuoteRow({ symbol, onClick }: CompactQuoteRowProps) {
    const { quote } = useQuote(symbol);

    if (!quote) {
        return (
            <div className="flex items-center justify-between py-2 px-3 opacity-50">
                <span className="text-sm text-gray-400">{symbol}</span>
                <div className="w-16 h-4 bg-white/10 rounded animate-pulse" />
            </div>
        );
    }

    const changeClass = quote.changePercent >= 0 ? 'text-green-400' : 'text-red-400';
    const arrow = quote.changePercent >= 0 ? '▲' : '▼';

    return (
        <div
            className={`flex items-center justify-between py-2 px-3 rounded hover:bg-white/5 transition-colors cursor-pointer ${onClick ? 'cursor-pointer' : ''}`}
            onClick={() => onClick?.(symbol)}
        >
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white">{symbol}</span>
                <MiniSparkline symbol={symbol} />
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm text-white">{quote.price.toFixed(2)}</span>
                <span className={`text-xs ${changeClass} flex items-center gap-1`}>
                    <span>{arrow}</span>
                    <span>{Math.abs(quote.changePercent).toFixed(2)}%</span>
                </span>
            </div>
        </div>
    );
}

export default LiveQuoteCard;
