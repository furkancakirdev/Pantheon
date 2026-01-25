/**
 * Hermes V3 - Twitter Sentiment + Haber Analiz Motoru
 *
 * Twitter Client entegrasyonu ile tweet'leri doğrudan çeker
 * Groq API ile Türkçe NLP sentiment analizi
 *
 * Takip Edilen Hesaplar:
 * - Yaşar Erdinç, Ali Perşembe, Kıvanç Özbilgiç (Mock veri)
 * - Diğer finansal hesaplar
 */

import { twitterClient, FINANCIAL_TWITTER_ACCOUNTS, Tweet } from '@api/twitter';
import { llm } from '@api/llm';

// === TYPES ===

export type Sentiment = 'POZITIF' | 'NOTR' | 'NEGATIF';

export interface NewsItem {
    source: string;
    title: string;
    content?: string;
    publishedAt: Date;
    sentiment?: Sentiment;
    impactScore?: number;
}

export interface HermesResult {
    symbol: string;
    score: number;              // 0-100
    sentiment: Sentiment;
    tweetCount: number;
    topTweets: Tweet[];
    twitterSummary: string;
    llmAnalysis?: string;
    engagementScore: number;   // Etkileşim skoru
}

export interface TweetSentiment {
    tweet: Tweet;
    sentiment: Sentiment;
    score: number;              // -1 to +1
    confidence: number;         // 0-1
}

export class HermesEngine {
    private static instance: HermesEngine;

    private constructor() { }

    public static getInstance(): HermesEngine {
        if (!HermesEngine.instance) {
            HermesEngine.instance = new HermesEngine();
        }
        return HermesEngine.instance;
    }

    /**
     * Hisse için sentiment analizi yap (Twitter verileri ile)
     */
    public async analyze(symbol: string, useLLM: boolean = true): Promise<HermesResult> {
        // 1. Twitter'dan ilgili tweet'leri çek
        const tweets = await twitterClient.searchBySymbol(symbol, 20);

        if (tweets.length === 0) {
            return {
                symbol,
                score: 50,
                sentiment: 'NOTR',
                tweetCount: 0,
                topTweets: [],
                twitterSummary: 'Bu hisse hakkında tweet bulunamadı',
                engagementScore: 0,
            };
        }

        // 2. Tweet'leri analiz et
        const analyzedTweets = useLLM
            ? await this.analyzeTweetsWithLLM(tweets)
            : this.analyzeTweetsSimple(tweets);

        // 3. Skor hesapla
        const score = this.calculateTweetScore(analyzedTweets);

        // 4. Genel sentiment belirle
        const sentiment = this.determineSentiment(score);

        // 5. Etkileşim skoru
        const engagementScore = this.calculateEngagementScore(tweets);

        // 6. Özet oluştur
        const twitterSummary = this.generateTwitterSummary(analyzedTweets, sentiment);

        // 7. LLM detaylı analizi (opsiyonel)
        let llmAnalysis: string | undefined;
        if (useLLM && analyzedTweets.length > 0) {
            llmAnalysis = await this.generateLLMAnalysis(symbol, analyzedTweets, sentiment);
        }

        // En etkileyici tweet'ler
        const topTweets = analyzedTweets
            .sort((a, b) => twitterClient.calculateEngagementScore(b.tweet) - twitterClient.calculateEngagementScore(a.tweet))
            .slice(0, 5)
            .map(t => t.tweet);

        return {
            symbol,
            score,
            sentiment,
            tweetCount: tweets.length,
            topTweets,
            twitterSummary,
            llmAnalysis,
            engagementScore,
        };
    }

    /**
     * LLM ile tweet analizi (Groq - Türkçe)
     */
    private async analyzeTweetsWithLLM(tweets: Tweet[]): Promise<TweetSentiment[]> {
        try {
            const tweetTexts = tweets.map(t => `@${t.authorUsername}: ${t.text}`).join('\n\n');

            const prompt = `Aşağıdaki Türkiye borsası tweet'lerini analiz et. Her tweet için tek satırda format: "sentiment,skor"
- sentiment: POZITIF / NOTR / NEGATIF
- skor: -1.0 ile +1.0 arası (pozitif için +, negatif için -)

Tweet'ler:
${tweetTexts}`;

            const response = await llm.generate(
                prompt,
                'Sen bir Türk finans piyasası uzmanısın. Twitter\'daki borsa yorumlarını analiz et ve sentiment belirle.'
            );

            // Parse LLM response
            const lines = response.text.split('\n').filter(l => l.trim());

            return tweets.map((t, i) => {
                const line = lines[i] || 'NOTR,0';
                const parts = line.split(',');

                let sentiment: Sentiment = 'NOTR';
                let score = 0;

                if (parts[0]?.includes('POZITIF')) sentiment = 'POZITIF';
                else if (parts[0]?.includes('NEGATIF')) sentiment = 'NEGATIF';

                const scoreStr = parts[1]?.trim();
                if (scoreStr) {
                    score = parseFloat(scoreStr) || 0;
                }

                return {
                    tweet: t,
                    sentiment,
                    score,
                    confidence: Math.abs(score),
                };
            });

        } catch (error) {
            console.log('Hermes LLM fallback to simple analysis');
            return this.analyzeTweetsSimple(tweets);
        }
    }

    /**
     * Basit kelime bazlı tweet analizi (Fallback)
     */
    private analyzeTweetsSimple(tweets: Tweet[]): TweetSentiment[] {
        return tweets.map(tweet => {
            const result = this.simpleSentiment(tweet.text);
            return {
                tweet,
                sentiment: result.sentiment,
                score: result.score,
                confidence: 0.6,
            };
        });
    }

    /**
     * Basit kelime bazlı sentiment (Fallback)
     */
    private simpleSentiment(text: string): { sentiment: Sentiment; score: number } {
        const lower = text.toLowerCase();

        const positive = ['yükseliş', 'artış', 'rekor', 'kar', 'kazanç', 'olumlu', 'büyüme',
            'talep', 'güçlü', 'parlak', 'fırsat', 'yatırım', 'hedef', 'başarılı', 'prim', 'yukarı'];
        const negative = ['düşüş', 'kayıp', 'zarar', 'kriz', 'risk', 'satış', 'olumsuz',
            'tehlike', 'zayıf', 'baskı', 'dikkat', 'temkinli', 'aşağı', 'gerileme'];

        const posCount = positive.filter(w => lower.includes(w)).length;
        const negCount = negative.filter(w => lower.includes(w)).length;

        let sentiment: Sentiment = 'NOTR';
        let score = 0;

        if (posCount > negCount) {
            sentiment = 'POZITIF';
            score = Math.min(0.8, 0.3 + posCount * 0.1);
        } else if (negCount > posCount) {
            sentiment = 'NEGATIF';
            score = Math.max(-0.8, -0.3 - negCount * 0.1);
        }

        return { sentiment, score };
    }

    /**
     * Tweet'lerden ağırlıklı skor hesapla (0-100)
     */
    private calculateTweetScore(analyzedTweets: TweetSentiment[]): number {
        if (analyzedTweets.length === 0) return 50;

        let totalWeight = 0;
        let weightedSum = 0;

        for (const item of analyzedTweets) {
            const engagement = twitterClient.calculateEngagementScore(item.tweet);
            // Etkileşim skoru ağırlık olarak kullanılır
            const weight = Math.log(engagement + 1);

            weightedSum += item.score * weight;
            totalWeight += weight;
        }

        if (totalWeight === 0) return 50;

        // Normalize to 0-100 (center at 50)
        const avgScore = weightedSum / totalWeight;
        return Math.min(100, Math.max(0, 50 + avgScore * 50));
    }

    /**
     * Genel sentiment belirle
     */
    private determineSentiment(score: number): Sentiment {
        if (score >= 60) return 'POZITIF';
        if (score <= 40) return 'NEGATIF';
        return 'NOTR';
    }

    /**
     * Etkileşim skoru hesapla
     */
    private calculateEngagementScore(tweets: Tweet[]): number {
        return tweets.reduce((sum, t) => sum + twitterClient.calculateEngagementScore(t), 0);
    }

    /**
     * Twitter özeti oluştur
     */
    private generateTwitterSummary(analyzedTweets: TweetSentiment[], sentiment: Sentiment): string {
        const positive = analyzedTweets.filter(t => t.sentiment === 'POZITIF').length;
        const negative = analyzedTweets.filter(t => t.sentiment === 'NEGATIF').length;
        const neutral = analyzedTweets.length - positive - negative;

        const sentimentText = sentiment === 'POZITIF' ? 'olumlu' : sentiment === 'NEGATIF' ? 'olumsuz' : 'nötr';

        return `${analyzedTweets.length} tweet analiz edildi. ${positive} pozitif, ${negative} negatif, ${neutral} nötr. Genel görünüm ${sentimentText}.`;
    }

    /**
     * LLM ile detaylı analiz oluştur
     */
    private async generateLLMAnalysis(symbol: string, analyzedTweets: TweetSentiment[], sentiment: Sentiment): Promise<string> {
        try {
            const topTweets = analyzedTweets.slice(0, 5);
            const tweetsText = topTweets.map(t => `@${t.tweet.authorUsername}: ${t.tweet.text}`).join('\n');

            const prompt = `Aşağıdaki tweet'ler $${symbol} hissesi hakkında. Bu tweet'lere dayanarak yatırımcılar için 2-3 cümlelik özetli bir analiz yaz.

Tweet'ler:
${tweetsText}

Analiz:`;

            const response = await llm.generate(
                prompt,
                'Sen bir Türkiye borsası analiz uzmanısın. Twitter sentiment\'ini özetle.'
            );

            return response.text.trim();

        } catch (error) {
            return 'LLM analizi yapılamadı.';
        }
    }

    /**
     * Tüm finansal tweet'leri analiz et (Genel piyasa sentiment'i için)
     */
    public async analyzeMarketSentiment(): Promise<{
        overall: Sentiment;
        score: number;
        topSymbols: string[];
        summary: string;
    }> {
        const tweets = await twitterClient.getAllFinancialTweets(50);

        // Tüm tweet'lerden bahsedilen sembolleri çıkar
        const symbolCounts = new Map<string, number>();
        const symbolSentiments = new Map<string, number[]>();

        for (const tweet of tweets) {
            const symbols = twitterClient.extractMentionedSymbols(tweet.text);
            const { score } = this.simpleSentiment(tweet.text);

            for (const symbol of symbols) {
                symbolCounts.set(symbol, (symbolCounts.get(symbol) || 0) + 1);
                symbolSentiments.set(symbol, [...(symbolSentiments.get(symbol) || []), score]);
            }
        }

        // En çok bahsedilen semboller
        const topSymbols = [...symbolCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([symbol]) => symbol);

        // Genel piyasa skoru
        const allScores = Array.from(symbolSentiments.values()).flat();
        const avgScore = allScores.length > 0
            ? allScores.reduce((a, b) => a + b, 0) / allScores.length
            : 0;

        const overallScore = 50 + avgScore * 50;
        const overall = this.determineSentiment(overallScore);

        return {
            overall,
            score: Math.round(overallScore),
            topSymbols,
            summary: `Piyasa sentiment'i ${overall === 'POZITIF' ? 'olumlu' : overall === 'NEGATIF' ? 'olumsuz' : 'nötr'}. En çok bahsedilen: ${topSymbols.slice(0, 3).join(', ')}.`,
        };
    }
}

export const hermes = HermesEngine.getInstance();
export default HermesEngine.getInstance();
