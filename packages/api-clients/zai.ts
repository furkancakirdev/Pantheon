/**
 * Z.AI API Client
 * 
 * Amaç: AI özellikleri için Z.AI API'sini kullanmak.
 */

const BASE_URL = 'https://api.z.ai/v1';

export interface ZaiResponse {
    text: string;
    model: string;
    latency?: number;
}

export class ZaiClient {
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.ZAI_API_KEY || '';
    }

    /**
     * Metin üretimi isteği yapar
     */
    async generate(prompt: string, systemPrompt?: string): Promise<ZaiResponse> {
        if (!this.apiKey) {
            console.warn('Z.AI API Key eksik. Mock veri dönülüyor.');
            return this.getMockResponse();
        }

        try {
            const start = Date.now();
            const response = await fetch(`${BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: systemPrompt || 'You are a financial analyst.' },
                        { role: 'user', content: prompt }
                    ],
                    model: 'zai-pro',
                    temperature: 0.1
                })
            });

            if (response.ok) {
                const data = await response.json() as { choices: Array<{ message: { content: string } }> };
                return {
                    text: data.choices[0].message.content,
                    model: 'Z.AI-Pro',
                    latency: Date.now() - start
                };
            }
            throw new Error(`Z.AI API Error: ${response.status}`);
        } catch (error) {
            console.error('Z.AI Fetch Error:', error);
            return this.getMockResponse();
        }
    }

    private getMockResponse(): ZaiResponse {
        return {
            text: "Z.AI modellerine erişilemedi. Bu, otomatik oluşturulmuş bir mock analizdir. Piyasa koşulları belirsizliğini koruyor.",
            model: 'Mock-Engine',
            latency: 0
        };
    }
}

export const zai = new ZaiClient();
