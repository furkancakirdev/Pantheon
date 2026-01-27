/**
 * WebSocket Data Feed Service - Gerçek Zamanlı Veri Akışı
 *
 * Özellikler:
 * - WebSocket bağlantı yönetimi
 * - Oto-reconnect ile üstel backoff
 * - Pub/Sub pattern ile sembol abonelikleri
 * - Buffer management ve mesaj kuyruğu
 * - Connection health monitoring
 * - Matriksdata MQTT uyumlu interface
 */

import { EventEmitter } from 'events';

// ============ TİP TANIMLARI ============

export interface WebSocketConfig {
    url: string;
    protocols?: string | string[];
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    heartbeatInterval?: number;
    enableCompression?: boolean;
    token?: string;
}

export interface MarketDataUpdate {
    symbol: string;
    timestamp: number;
    data: MarketData;
}

export interface MarketData {
    // Level 1 Data (BBO - Best Bid/Offer)
    bid?: number;
    ask?: number;
    bidSize?: number;
    askSize?: number;

    // Trade Data
    lastPrice?: number;
    lastSize?: number;
    volume?: number;

    // OHLCV
    open?: number;
    high?: number;
    low?: number;
    close?: number;

    // Statistics
    change?: number;
    changePercent?: number;
    vwap?: number;

    // Level 2 Data (Order Book Depth)
    bids?: Array<[price: number, size: number]>;
    asks?: Array<[price: number, size: number]>;

    // Metadata
    source: 'BIST' | 'NASDAQ' | 'NYSE' | 'FX' | 'CRYPTO';
    quality: 'REALTIME' | 'DELAYED' | 'EOD';
}

export interface SubscriptionRequest {
    symbol: string;
    dataTypes: DataType[];
    throttleMs?: number;
}

export type DataType =
    | 'QUOTE'      // Level 1 BBO verisi
    | 'TRADE'      // Gerçekleşen işlemler
    | 'DEPTH'      // Level 2 derinlik
    | 'BAR'        // OHLCV bar verisi
    | 'NEWS'       // Haber akışı
    | 'ALERT';     // Alarm/sinyal

export enum ConnectionState {
    DISCONNECTED = 'DISCONNECTED',
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    RECONNECTING = 'RECONNECTING',
    ERROR = 'ERROR'
}

export interface ConnectionStats {
    state: ConnectionState;
    connectedAt?: Date;
    lastMessageAt?: Date;
    messagesReceived: number;
    messagesSent: number;
    bytesReceived: number;
    bytesSent: number;
    reconnectCount: number;
    latencyMs?: number;
}

// ============ WEBSOCKET CLIENT ============

export class MarketDataWebSocket extends EventEmitter {
    private ws: WebSocket | null = null;
    private config: Required<WebSocketConfig>;
    private state: ConnectionState = ConnectionState.DISCONNECTED;
    private subscriptions: Set<string> = new Set();
    private reconnectTimer: NodeJS.Timeout | null = null;
    private heartbeatTimer: NodeJS.Timeout | null = null;
    private reconnectAttempts = 0;
    private stats: ConnectionStats = {
        state: ConnectionState.DISCONNECTED,
        messagesReceived: 0,
        messagesSent: 0,
        bytesReceived: 0,
        bytesSent: 0,
        reconnectCount: 0
    };
    private messageQueue: Array<{ symbol: string; data: any }> = [];
    private isProcessingQueue = false;

    // Buffer management için limitler
    private readonly MAX_QUEUE_SIZE = 1000;
    private readonly MAX_RECONNECT_DELAY = 30000; // 30 saniye

    constructor(config: WebSocketConfig) {
        super();
        this.config = {
            url: config.url,
            protocols: config.protocols || [],
            reconnectInterval: config.reconnectInterval || 1000,
            maxReconnectAttempts: config.maxReconnectAttempts || 10,
            heartbeatInterval: config.heartbeatInterval || 30000,
            enableCompression: config.enableCompression ?? true,
            token: config.token || ''
        };

        // Max listeners artır - çok abone olabilir
        this.setMaxListeners(100);
    }

    // ============ BAĞLANTI YÖNETİMİ ============

    /**
     * WebSocket bağlantısını başlat
     */
    public async connect(): Promise<void> {
        if (this.state === ConnectionState.CONNECTED ||
            this.state === ConnectionState.CONNECTING) {
            return;
        }

        this.setState(ConnectionState.CONNECTING);

        try {
            // Browser ortamı için native WebSocket
            // Node.js ortamı için ws paketi kullanılabilir
            if (typeof WebSocket !== 'undefined') {
                this.ws = new WebSocket(this.config.url, this.config.protocols);
            } else {
                // Node.js fallback - require('ws')
                const WebSocketClass = require('ws');
                this.ws = new WebSocketClass(this.config.url, this.config.protocols);
            }

            this.setupEventHandlers();
        } catch (error) {
            this.setState(ConnectionState.ERROR);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * WebSocket olay dinleyicilerini kur
     */
    private setupEventHandlers(): void {
        if (!this.ws) return;

        this.ws.onopen = () => this.handleOpen();
        this.ws.onclose = (event) => this.handleClose(event);
        this.ws.onerror = (error) => this.handleError(error);
        this.ws.onmessage = (event) => this.handleMessage(event);
    }

    /**
     * Bağlantı başarılı olduğunda
     */
    private handleOpen(): void {
        this.setState(ConnectionState.CONNECTED);
        this.stats.connectedAt = new Date();
        this.reconnectAttempts = 0;

        // Abonelikleri yenile
        this.resubscribeAll();

        // Heartbeat başlat
        this.startHeartbeat();

        this.emit('connected');
        console.log(`🔌 WebSocket bağlantısı kuruldu: ${this.config.url}`);
    }

    /**
     * Bağlantı koptuğunda
     */
    private handleClose(event: CloseEvent): void {
        const wasConnected = this.state === ConnectionState.CONNECTED;
        this.setState(ConnectionState.DISCONNECTED);
        this.stopHeartbeat();

        this.emit('disconnected', { code: event.code, reason: event.reason });

        // Otomatik yeniden bağlan
        if (wasConnected && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
        }
    }

    /**
     * Hata oluştuğunda
     */
    private handleError(error: any): void {
        console.error('WebSocket hatası:', error);
        this.emit('error', error);
    }

    /**
     * Mesaj alındığında
     */
    private handleMessage(event: MessageEvent): void {
        this.stats.messagesReceived++;
        this.stats.lastMessageAt = new Date();

        try {
            const data = typeof event.data === 'string'
                ? JSON.parse(event.data)
                : event.data;

            // Mesajı parse et ve event olarak yayınla
            this.processMessage(data);
        } catch (error) {
            console.error('Mesaj parse hatası:', error);
        }
    }

    /**
     * Gelen mesajı işle
     */
    private processMessage(data: any): void {
        // Heartbeat yanıtı
        if (data.type === 'pong') {
            this.updateLatency(data.timestamp);
            return;
        }

        // Market data mesajı
        if (data.symbol && data.data) {
            const update: MarketDataUpdate = {
                symbol: data.symbol,
                timestamp: data.timestamp || Date.now(),
                data: this.normalizeMarketData(data.data)
            };

            // Sembol bazında event
            this.emit(`data:${update.symbol}`, update);

            // Genel market data event
            this.emit('marketData', update);
        }

        // Toplu mesaj (batch)
        if (data.batch && Array.isArray(data.batch)) {
            data.batch.forEach((item: any) => {
                if (item.symbol && item.data) {
                    const update: MarketDataUpdate = {
                        symbol: item.symbol,
                        timestamp: item.timestamp || Date.now(),
                        data: this.normalizeMarketData(item.data)
                    };
                    this.emit(`data:${update.symbol}`, update);
                    this.emit('marketData', update);
                }
            });
        }
    }

    /**
     * Market data normalizasyonu
     */
    private normalizeMarketData(raw: any): MarketData {
        return {
            bid: raw.bid,
            ask: raw.ask,
            bidSize: raw.bidSize || raw.bid_quantity,
            askSize: raw.askSize || raw.ask_quantity,
            lastPrice: raw.lastPrice || raw.price || raw.last,
            lastSize: raw.lastSize || raw.size || raw.last_volume,
            volume: raw.volume || raw.vol,
            open: raw.open,
            high: raw.high,
            low: raw.low,
            close: raw.close,
            change: raw.change,
            changePercent: raw.changePercent || raw.change_percent || raw.chg_pct,
            vwap: raw.vwap,
            bids: raw.bids || raw.bid_levels,
            asks: raw.asks || raw.ask_levels,
            source: raw.source || 'BIST',
            quality: raw.quality || 'DELAYED'
        };
    }

    // ============ ABONELİK YÖNETİMİ ============

    /**
     * Sembol aboneliği ekle
     */
    public subscribe(request: SubscriptionRequest | string): void {
        const symbol = typeof request === 'string' ? request : request.symbol;

        if (this.subscriptions.has(symbol)) {
            return; // Zaten abone
        }

        this.subscriptions.add(symbol);

        // Eğer bağlıysa hemen abone ol
        if (this.state === ConnectionState.CONNECTED && this.ws) {
            const message = typeof request === 'string'
                ? { action: 'subscribe', symbol }
                : { action: 'subscribe', ...request };

            this.send(message);
        }

        console.log(`➕ Abone olundu: ${symbol} (Toplam: ${this.subscriptions.size})`);
    }

    /**
     * Sembol aboneliğini kaldır
     */
    public unsubscribe(symbol: string): void {
        if (!this.subscriptions.delete(symbol)) {
            return; // Zaten abone değil
        }

        if (this.state === ConnectionState.CONNECTED && this.ws) {
            this.send({ action: 'unsubscribe', symbol });
        }

        // Event listener'ı temizle
        this.removeAllListeners(`data:${symbol}`);

        console.log(`➖ Abonelik iptal: ${symbol} (Kalan: ${this.subscriptions.size})`);
    }

    /**
     * Tüm abonelikleri getir
     */
    public getSubscriptions(): string[] {
        return Array.from(this.subscriptions);
    }

    /**
     * Bağlantı sonrası abonelikleri yenile
     */
    private resubscribeAll(): void {
        if (this.subscriptions.size === 0) return;

        console.log(`🔄 ${this.subscriptions.size} sembol için abonelik yenileniyor...`);

        const symbols = Array.from(this.subscriptions);
        this.send({ action: 'subscribeBatch', symbols });
    }

    // ============ MESAJ GÖNDERME ============

    /**
     * WebSocket üzerinden mesaj gönder
     */
    private send(data: any): boolean {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            // Kuyruğa ekle
            if (this.messageQueue.length < this.MAX_QUEUE_SIZE) {
                this.messageQueue.push(data);
            }
            return false;
        }

        try {
            const message = JSON.stringify(data);
            this.ws.send(message);

            this.stats.messagesSent++;
            this.stats.bytesSent += message.length;

            return true;
        } catch (error) {
            console.error('Mesaj gönderim hatası:', error);
            return false;
        }
    }

    /**
     * Kuyruktaki mesajları işle
     */
    private processQueue(): void {
        if (this.isProcessingQueue || this.messageQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (message) {
                this.send(message);
            }
        }

        this.isProcessingQueue = false;
    }

    // ============ HEARTBEAT & HEALTH ============

    /**
     * Heartbeat mekanizması başlat
     */
    private startHeartbeat(): void {
        this.stopHeartbeat();

        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.send({
                    type: 'ping',
                    timestamp: Date.now()
                });
            }
        }, this.config.heartbeatInterval);
    }

    /**
     * Heartbeat mekanizmasını durdur
     */
    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * Gecikme süresini güncelle
     */
    private updateLatency(sentTimestamp: number): void {
        this.stats.latencyMs = Date.now() - sentTimestamp;
    }

    // ============ RECONNECT ============

    /**
     * Yeniden bağlanma zamanla
     */
    private scheduleReconnect(): void {
        if (this.reconnectTimer) {
            return; // Zaten zamanlanmış
        }

        this.setState(ConnectionState.RECONNECTING);
        this.reconnectAttempts++;

        // Üstel backoff
        const delay = Math.min(
            this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
            this.MAX_RECONNECT_DELAY
        );

        console.log(`🔄 ${delay}ms sonra yeniden bağlanma denenecek (Deneme: ${this.reconnectAttempts})`);

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect().catch(() => {
                // Hata connect içinde handle edildi
            });
        }, delay);

        this.stats.reconnectCount = this.reconnectAttempts;
    }

    // ============ BAĞLANTI KESME ============

    /**
     * Bağlantıyı kes (reconnect olmadan)
     */
    public disconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        this.stopHeartbeat();

        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }

        this.setState(ConnectionState.DISCONNECTED);
        this.emit('disconnected');
    }

    // ============ YARDIMCI METODLAR ============

    /**
     * Bağlantı durumunu güncelle
     */
    private setState(state: ConnectionState): void {
        const oldState = this.state;
        this.state = state;
        this.stats.state = state;
        this.emit('stateChange', { oldState, newState: state });
    }

    /**
     * İstatistikleri al
     */
    public getStats(): ConnectionStats {
        return { ...this.stats };
    }

    /**
     * Bağlı mı?
     */
    public isConnected(): boolean {
        return this.state === ConnectionState.CONNECTED &&
            this.ws?.readyState === WebSocket.OPEN;
    }

    /**
     * Bellek temizliği
     */
    public destroy(): void {
        this.disconnect();
        this.subscriptions.clear();
        this.messageQueue.length = 0;
        this.removeAllListeners();
    }
}

// ============ FACTORY FUNCTIONS ============

/**
 * Matriksdata uyumlu WebSocket client oluştur
 */
export function createMatriksWebSocket(token: string): MarketDataWebSocket {
    const config: WebSocketConfig = {
        url: 'wss://stream.matriksdata.com/mqtt', // Örnek URL
        token,
        reconnectInterval: 2000,
        maxReconnectAttempts: 15,
        heartbeatInterval: 30000,
        enableCompression: true
    };

    return new MarketDataWebSocket(config);
}

/**
 * Generic WebSocket client oluştur
 */
export function createWebSocket(url: string, config?: Partial<WebSocketConfig>): MarketDataWebSocket {
    return new MarketDataWebSocket({
        url,
        ...config
    });
}

// ============ EXPORTS ============

export default MarketDataWebSocket;
