/**
 * useMarketStream Hook
 * Real-time market data SSE hook
 *
 * Kullanım:
 * const { quotes, connected, error } = useMarketStream(['THYAO', 'ASELS', 'GARAN']);
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MarketQuote } from '@/types/market';

// ============ TİP TANIMLARI ============

export interface StreamQuote {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    high: number;
    low: number;
    bid?: number;
    ask?: number;
    timestamp: number;
}

export interface UseMarketStreamOptions {
    /** Veri güncelleme interval'i (ms) - server side throttle */
    interval?: number;
    /** Bağlantı kesildiğinde otomatik reconnect */
    autoReconnect?: boolean;
    /** Reconnect deneme sayısı */
    maxReconnectAttempts?: number;
    /** Reconnect aralığı (ms) */
    reconnectDelay?: number;
}

export interface UseMarketStreamResult {
    /** Güncel fiyat verileri */
    quotes: Map<string, StreamQuote>;
    /** Bağlantı durumu */
    connected: boolean;
    /** Son hata */
    error: string | null;
    /** Bağlantı zamanı */
    connectedAt: Date | null;
    /** Toplam mesaj sayısı */
    messageCount: number;
    /** Manuel reconnect */
    reconnect: () => void;
    /** Bağlantıyı kes */
    disconnect: () => void;
}

export interface StreamMessage {
    type: 'quote' | 'heartbeat' | 'error' | 'connected';
    data?: StreamQuote | { symbols: string[] };
    error?: string;
    timestamp: number;
}

// ============ HOOK ============

export function useMarketStream(
    symbols: string[],
    options: UseMarketStreamOptions = {}
): UseMarketStreamResult {
    const {
        interval = 1000,
        autoReconnect = true,
        maxReconnectAttempts = 10,
        reconnectDelay = 2000
    } = options;

    const [quotes, setQuotes] = useState<Map<string, StreamQuote>>(new Map());
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connectedAt, setConnectedAt] = useState<Date | null>(null);
    const [messageCount, setMessageCount] = useState(0);

    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const symbolsRef = useRef(symbols);

    // Symbols güncellendiğinde ref'i de güncelle
    useEffect(() => {
        symbolsRef.current = symbols;
    }, [symbols]);

    /**
     * SSE bağlantısını kur
     */
    const connect = useCallback(() => {
        // Önceki bağlantıyı temizle
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        // URL oluştur
        const params = new URLSearchParams({
            symbols: symbolsRef.current.join(','),
            interval: interval.toString()
        });

        const url = `/api/stream/market?${params.toString()}`;

        try {
            const eventSource = new EventSource(url, {
                withCredentials: false
            });

            eventSourceRef.current = eventSource;

            // Bağlantı kuruldu
            eventSource.addEventListener('connected', (event: MessageEvent) => {
                const message: StreamMessage = JSON.parse(event.data);
                setConnected(true);
                setConnectedAt(new Date());
                setError(null);
                reconnectAttemptsRef.current = 0;
                console.log('🔗 Market stream bağlantısı kuruldu');
            });

            // Veri mesajı
            eventSource.addEventListener('quote', (event: MessageEvent) => {
                const message: StreamMessage = JSON.parse(event.data);

                if (message.data && 'symbol' in message.data) {
                    const quote = message.data as StreamQuote;

                    setQuotes(prev => {
                        const newMap = new Map(prev);
                        newMap.set(quote.symbol, quote);
                        return newMap;
                    });

                    setMessageCount(prev => prev + 1);
                }
            });

            // Heartbeat
            eventSource.addEventListener('heartbeat', (event: MessageEvent) => {
                // Bağlantı canlı
            });

            // Hata
            eventSource.addEventListener('error', (event: MessageEvent) => {
                const message: StreamMessage = JSON.parse(event.data);
                setError(message.error || 'Bilinmeyen hata');
            });

            // EventSource native error
            eventSource.onerror = (e) => {
                console.error('SSE hatası:', e);
                setConnected(false);
                setError('Bağlantı hatası');

                eventSource.close();

                // Auto reconnect
                if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
                    reconnectAttemptsRef.current++;
                    const delay = reconnectDelay * Math.pow(1.5, reconnectAttemptsRef.current - 1);

                    console.log(`🔄 ${delay}ms sonra yeniden bağlanılıyor... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

                    reconnectTimerRef.current = setTimeout(() => {
                        connect();
                    }, delay);
                }
            };

        } catch (err) {
            console.error('Stream başlatma hatası:', err);
            setError('Stream başlatılamadı');
        }
    }, [interval, autoReconnect, maxReconnectAttempts, reconnectDelay]);

    /**
     * Manuel reconnect
     */
    const reconnect = useCallback(() => {
        reconnectAttemptsRef.current = 0;
        connect();
    }, [connect]);

    /**
     * Bağlantıyı kes
     */
    const disconnect = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        setConnected(false);
        setConnectedAt(null);
    }, []);

    // İlk mount'ta bağlan
    useEffect(() => {
        if (symbols.length > 0) {
            connect();
        }

        return () => {
            disconnect();
        };
        // Bağlantı sadece ilk mount'ta kurulsun
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Symbols değişirse reconnect
    useEffect(() => {
        if (symbols.length > 0 && connected) {
            disconnect();
            // Delayed reconnect
            setTimeout(() => {
                reconnect();
            }, 100);
        }
    }, [symbols.length]); // Sadece symbols'a bağla

    return {
        quotes,
        connected,
        error,
        connectedAt,
        messageCount,
        reconnect,
        disconnect
    };
}

// ============ HELPER HOOKS ============

/**
 * Tek sembol stream'i
 */
export function useQuote(symbol: string, options?: UseMarketStreamOptions) {
    const result = useMarketStream(symbol ? [symbol] : [], options);

    const quote = symbol ? result.quotes.get(symbol) : undefined;

    return {
        ...result,
        quote
    };
}

/**
 * Portföy stream'i
 */
export function usePortfolioStream(symbols: string[], options?: UseMarketStreamOptions) {
    const result = useMarketStream(symbols, options);

    // Portföy değeri hesapla
    const portfolioValue = useMemo(() => {
        let total = 0;
        let totalChange = 0;

        result.quotes.forEach(quote => {
            // Varsayılan 1 lot varsayıyoruz
            total += quote.price;
            totalChange += quote.change;
        });

        return {
            totalValue: total,
            totalChange: totalChange,
            totalChangePercent: total > 0 ? (totalChange / (total - totalChange)) * 100 : 0
        };
    }, [result.quotes]);

    return {
        ...result,
        portfolioValue
    };
}

export default useMarketStream;
