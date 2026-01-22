/**
 * LLM Client - Groq & Gemini Entegrasyonu
 * 
 * Amaç: Sentiment analizi (Hermes) ve Karar yorumlama (Grand Council)
 * için Büyük Dil Modellerini kullanmak.
 */

// Basit tip tanımları (SDK kullanmadan fetch ile)
interface LlmResponse {
    text: string;
    model: string;
    latency?: number;
}

export class LlmClient {
    private groqKey: string;
    private geminiKey: string;

    constructor() {
        this.groqKey = process.env.GROQ_API_KEY || '';
        this.geminiKey = process.env.GEMINI_API_KEY || '';
    }

    /**
     * Metin üretimi isteği yapar (Önce Groq dener, yoksa Gemini, yoksa Mock)
     */
    async generate(prompt: string, systemPrompt?: string): Promise<LlmResponse> {

        // 1. Groq (En Hızlı)
        if (this.groqKey) {
            try {
                const start = Date.now();
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.groqKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messages: [
                            { role: 'system', content: systemPrompt || 'You are a financial analyst.' },
                            { role: 'user', content: prompt }
                        ],
                        model: 'llama3-8b-8192', // Hızlı ve Yeterli
                        temperature: 0.1
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    return {
                        text: data.choices[0].message.content,
                        model: 'Groq/Llama3',
                        latency: Date.now() - start
                    };
                }
            } catch (e) {
                console.error('Groq Failed:', e);
            }
        }

        // 2. Gemini (Google - Yedek veya Analitik)
        if (this.geminiKey) {
            try {
                const start = Date.now();
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiKey}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: (systemPrompt ? systemPrompt + '\n' : '') + prompt }] }]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    return {
                        text: text,
                        model: 'Gemini-Pro',
                        latency: Date.now() - start
                    };
                }
            } catch (e) {
                console.error('Gemini Failed:', e);
            }
        }

        // 3. Fallback (Mock)
        console.warn('LLM API Keys eksik. Mock cevap dönülüyor.');
        return {
            text: "Yapay zeka modellerine erişilemedi. Bu, otomatik oluşturulmuş bir mock analizdir. Piyasa koşulları belirsizliğini koruyor.",
            model: 'Mock-Engine',
            latency: 0
        };
    }
}

export const llm = new LlmClient();
