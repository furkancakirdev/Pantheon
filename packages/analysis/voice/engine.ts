/**
 * Voice - LLM Sohbet Modülü
 * Pantheon Trading OS v1.0
 * 
 * Bu modül:
 * - LLM ile doğal dil etkileşimi
 * - Portföy sorguları ve öneriler
 * - Council kararları açıklamaları
 * - Piyasa analizi sohbeti
 */

// ==================== TYPES ====================

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

export interface ChatContext {
    portfolio?: {
        totalValue: number;
        positions: string[];
        pnl: number;
    };
    watchlist?: string[];
    recentSignals?: Array<{
        symbol: string;
        verdict: string;
        coreScore: number;
    }>;
    marketCondition?: string;
}

export interface VoiceConfig {
    provider: 'groq' | 'gemini';
    model: string;
    systemPrompt: string;
    maxTokens: number;
    temperature: number;
}

// ==================== DEFAULT CONFIG ====================

const SYSTEM_PROMPT = `Sen Pantheon Trading OS'un yapay zeka asistanısın. Görevin kullanıcıya BIST hisse senetleri hakkında bilgi vermek, portföy durumunu açıklamak ve yatırım kararlarında yardımcı olmaktır.

ÖNEMLİ KURALLAR:
1. Kesinlikle yatırım tavsiyesi verme. Her zaman "bu finansal tavsiye değildir" uyarısı ekle.
2. Council kararlarını ve skorları açıklarken objektif ol.
3. Teknik ve temel analiz terimlerini sade bir dille açıkla.
4. Risk yönetimi konusunda her zaman dikkatli ol.
5. Türkçe konuş, samimi ama profesyonel ol.

KULLANDIĞIN MODÜLLER:
- Atlas: Temel analiz (F/K, PD/DD, ROE, Borç/Özkaynak, Nakit Akışı)
- Orion: Teknik analiz (Trend yapısı, AlphaTrend, MOST, MavilimW)
- Hermes: Twitter sentiment analizi
- Cronos: Zamanlama faktörleri
- Athena: Faktör analizi (Momentum, Value, Quality)
- Aether: Makro ekonomik rejim
- Phoenix: Strateji optimizasyonu
- Chiron: Risk yönetimi ve ağırlık öğrenme

SKOR SİSTEMİ:
- Core Score (0-100): Uzun vadeli yatırım uygunluğu
- Pulse Score (0-100): Kısa vadeli trade fırsatı
- 80+: Güçlü sinyal
- 60-80: Orta sinyal
- 40-60: Nötr
- 40-: Zayıf/Negatif sinyal`;

const DEFAULT_CONFIG: VoiceConfig = {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    systemPrompt: SYSTEM_PROMPT,
    maxTokens: 1024,
    temperature: 0.7,
};

// ==================== VOICE ENGINE ====================

export class VoiceEngine {
    private config: VoiceConfig;
    private conversationHistory: ChatMessage[] = [];
    private context: ChatContext = {};

    constructor(config: Partial<VoiceConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    // ==================== CONTEXT MANAGEMENT ====================

    updateContext(newContext: Partial<ChatContext>): void {
        this.context = { ...this.context, ...newContext };
    }

    clearHistory(): void {
        this.conversationHistory = [];
    }

    getHistory(): ChatMessage[] {
        return [...this.conversationHistory];
    }

    // ==================== MESSAGE BUILDING ====================

    private buildContextPrompt(): string {
        let contextStr = '\n\n--- GÜNCEL BAĞLAM ---\n';

        if (this.context.portfolio) {
            contextStr += `\n📊 PORTFÖY DURUMU:\n`;
            contextStr += `- Toplam Değer: ${this.context.portfolio.totalValue.toLocaleString('tr-TR')} TL\n`;
            contextStr += `- Kar/Zarar: ${this.context.portfolio.pnl >= 0 ? '+' : ''}${this.context.portfolio.pnl.toLocaleString('tr-TR')} TL\n`;
            contextStr += `- Pozisyonlar: ${this.context.portfolio.positions.join(', ') || 'Yok'}\n`;
        }

        if (this.context.watchlist && this.context.watchlist.length > 0) {
            contextStr += `\n👁️ İZLEME LİSTESİ: ${this.context.watchlist.join(', ')}\n`;
        }

        if (this.context.recentSignals && this.context.recentSignals.length > 0) {
            contextStr += `\n🎯 SON SİNYALLER:\n`;
            for (const sig of this.context.recentSignals.slice(0, 5)) {
                contextStr += `- ${sig.symbol}: ${sig.verdict} (Core: ${sig.coreScore})\n`;
            }
        }

        if (this.context.marketCondition) {
            contextStr += `\n🌍 PİYASA DURUMU: ${this.context.marketCondition}\n`;
        }

        return contextStr;
    }

    private buildMessages(userMessage: string): Array<{ role: string; content: string }> {
        const messages: Array<{ role: string; content: string }> = [
            {
                role: 'system',
                content: this.config.systemPrompt + this.buildContextPrompt(),
            },
        ];

        // Son 10 mesajı ekle
        const recentHistory = this.conversationHistory.slice(-10);
        for (const msg of recentHistory) {
            messages.push({
                role: msg.role,
                content: msg.content,
            });
        }

        messages.push({
            role: 'user',
            content: userMessage,
        });

        return messages;
    }

    // ==================== CHAT ====================

    async chat(userMessage: string): Promise<string> {
        // Kullanıcı mesajını kaydet
        const userMsg: ChatMessage = {
            id: `msg-${Date.now()}-user`,
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
        };
        this.conversationHistory.push(userMsg);

        try {
            const response = await this.callLLM(userMessage);

            // Asistan yanıtını kaydet
            const assistantMsg: ChatMessage = {
                id: `msg-${Date.now()}-assistant`,
                role: 'assistant',
                content: response,
                timestamp: new Date(),
            };
            this.conversationHistory.push(assistantMsg);

            return response;
        } catch (error) {
            const errorMsg = `Üzgünüm, bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`;
            return errorMsg;
        }
    }

    // ==================== LLM CALL ====================

    private async callLLM(userMessage: string): Promise<string> {
        const messages = this.buildMessages(userMessage);

        if (this.config.provider === 'groq') {
            return this.callGroq(messages);
        } else {
            return this.callGemini(userMessage);
        }
    }

    private async callGroq(messages: Array<{ role: string; content: string }>): Promise<string> {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ_API_KEY bulunamadı');
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: this.config.model,
                messages,
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature,
            }),
        });

        if (!response.ok) {
            throw new Error(`Groq API hatası: ${response.status}`);
        }

        const data = await response.json() as { choices: Array<{ message: { content: string } }> };
        return data.choices[0]?.message?.content || 'Yanıt alınamadı.';
    }

    private async callGemini(userMessage: string): Promise<string> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY bulunamadı');
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: this.config.systemPrompt + this.buildContextPrompt() },
                                { text: userMessage },
                            ],
                        },
                    ],
                    generationConfig: {
                        maxOutputTokens: this.config.maxTokens,
                        temperature: this.config.temperature,
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API hatası: ${response.status}`);
        }

        const data = await response.json() as {
            candidates: Array<{ content: { parts: Array<{ text: string }> } }>
        };
        return data.candidates[0]?.content?.parts[0]?.text || 'Yanıt alınamadı.';
    }

    // ==================== QUICK RESPONSES ====================

    async askAboutStock(symbol: string): Promise<string> {
        return this.chat(`${symbol} hissesi hakkında ne düşünüyorsun? Council kararı ve skorları nasıl?`);
    }

    async explainDecision(symbol: string, verdict: string): Promise<string> {
        return this.chat(`${symbol} için "${verdict}" kararını açıklar mısın? Hangi modüller ne oy verdi?`);
    }

    async getMarketOverview(): Promise<string> {
        return this.chat('Bugün piyasalar nasıl görünüyor? Genel bir özet verir misin?');
    }

    async getPortfolioAdvice(): Promise<string> {
        return this.chat('Portföyüm hakkında ne düşünüyorsun? Bir önerine var mı?');
    }
}

// ==================== EXPORTS ====================

export default VoiceEngine;

// Factory function
export function createVoice(config: Partial<VoiceConfig> = {}): VoiceEngine {
    return new VoiceEngine(config);
}
