/**
 * LLM Client - Groq & Gemini Entegrasyonu
 *
 * Amaç: Sentiment analizi (Hermes) ve Karar yorumlama (Grand Council)
 * için Büyük Dil Modellerini kullanmak.
 */

export interface LlmConfig {
    groqKey?: string;
    geminiKey?: string;
    timeout?: number; // ms
}

// Basit tip tanımları (SDK kullanmadan fetch ile)
interface LlmResponse {
    text: string;
    model: string;
    latency?: number;
}

export class LlmClient {
    private config: LlmConfig;

    constructor(config?: LlmConfig) {
        this.config = {
            groqKey: config?.groqKey || process.env.GROQ_API_KEY || '',
            geminiKey: config?.geminiKey || process.env.GEMINI_API_KEY || '',
            timeout: config?.timeout || 60000, // LLM için daha uzun timeout
        };
    }

    /**
     * API çağrısı yap (timeout ile)
     */
    private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * API key kontrolü
     */
    private ensureApiKey(): void {
        if (!this.config.groqKey && !this.config.geminiKey) {
            throw new Error('LLM API key bulunamadı. Lütfen GROQ_API_KEY veya GEMINI_API_KEY environment variable\'ını ayarlayın.');
        }
    }

    /**
     * Groq ile metin üretimi
     */
    private async generateWithGroq(prompt: string, systemPrompt?: string): Promise<LlmResponse> {
        if (!this.config.groqKey) {
            throw new Error('Groq API key bulunamadı');
        }

        const start = Date.now();
        const response = await this.fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.groqKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt || 'You are a financial analyst.' },
                    { role: 'user', content: prompt },
                ],
                model: 'llama3-8b-8192', // Hızlı ve yeterli
                temperature: 0.1,
                max_tokens: 2048,
            }),
        });

        if (!response.ok) {
            throw new Error(`Groq API Hatası: HTTP ${response.status}`);
        }

        const data = await response.json() as { choices: Array<{ message: { content: string } }> };

        if (!data.choices || data.choices.length === 0) {
            throw new Error('Groq API: Geçersiz response');
        }

        return {
            text: data.choices[0].message.content,
            model: 'Groq/Llama3',
            latency: Date.now() - start,
        };
    }

    /**
     * Gemini ile metin üretimi
     */
    private async generateWithGemini(prompt: string, systemPrompt?: string): Promise<LlmResponse> {
        if (!this.config.geminiKey) {
            throw new Error('Gemini API key bulunamadı');
        }

        const start = Date.now();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.config.geminiKey}`;

        const response = await this.fetchWithTimeout(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: (systemPrompt ? systemPrompt + '\n' : '') + prompt }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 2048,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Gemini API Hatası: HTTP ${response.status}`);
        }

        const data = await response.json() as {
            candidates?: Array<{
                content?: {
                    parts?: Array<{ text?: string }>;
                };
            }>;
        };

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (!text) {
            throw new Error('Gemini API: Geçersiz response');
        }

        return {
            text,
            model: 'Gemini-Pro',
            latency: Date.now() - start,
        };
    }

    /**
     * Metin üretimi isteği yapar (Önce Groq dener, yoksa Gemini)
     */
    async generate(prompt: string, systemPrompt?: string, preferGemini = false): Promise<LlmResponse> {
        this.ensureApiKey();

        // Gemini tercih ediliyorsa önce dene
        if (preferGemini && this.config.geminiKey) {
            try {
                return await this.generateWithGemini(prompt, systemPrompt);
            } catch (error) {
                console.warn('Gemini başarısız, Groq deneniyor:', error);
            }
        }

        // Groq dene (daha hızlı)
        if (this.config.groqKey) {
            try {
                return await this.generateWithGroq(prompt, systemPrompt);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.warn('Groq başarısız:', errorMessage);
            }
        }

        // Gemini yedek olarak dene (eğer daha önce denenmediyse)
        if (!preferGemini && this.config.geminiKey) {
            try {
                return await this.generateWithGemini(prompt, systemPrompt);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.warn('Gemini de başarısız:', errorMessage);
            }
        }

        throw new Error('Tüm LLM API\'leri başarısız oldu. Lütfen API key\'lerinizi kontrol edin.');
    }

    /**
     * JSON formatında yanıt al (structured output)
     */
    async generateJson<T extends object>(
        prompt: string,
        systemPrompt?: string
    ): Promise<T> {
        const enhancedSystemPrompt = `${systemPrompt || ''}

IMPORTANT: You must respond with valid JSON only. No markdown, no code blocks, no additional text.
The response must be a valid JSON object that can be parsed directly.`;

        const response = await this.generate(prompt, enhancedSystemPrompt);

        try {
            // JSON parsing - markdown kod bloklarını temizle
            let cleanText = response.text.trim();

            // ```json ve ``` bloklarını kaldır
            cleanText = cleanText.replace(/^```json\s*/i, '');
            cleanText = cleanText.replace(/^```\s*/i, '');
            cleanText = cleanText.replace(/\s*```$/g, '');

            // Sadece JSON kısmını al (ilk { ve son } arası)
            const firstBrace = cleanText.indexOf('{');
            const lastBrace = cleanText.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                cleanText = cleanText.substring(firstBrace, lastBrace + 1);
            }

            return JSON.parse(cleanText) as T;
        } catch (error) {
            throw new Error(`JSON parse hatası: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * API yapılandırılmış mı kontrol et
     */
    isConfigured(): boolean {
        return !!(this.config.groqKey || this.config.geminiKey);
    }
}

export const llm = new LlmClient();
