/**
 * Grand Council AI Açıklama Servisi
 *
 * Pantheon Grand Council kararlarını Gemini Pro ile
 * yatırımcıya anlaşılır şekilde açıklar
 *
 * Kullanıcı: cakirfurkan48@gmail.com (Gemini Pro)
 */

import { llm } from '@api/llm';
import { CouncilKarar, ModulOyu } from './grand-council.js';

// === TYPES ===

export interface CouncilExplanation {
  councilDecision: CouncilKarar;
  explanation: string;
  keyPoints: string[];
  risks: string[];
  opportunities: string[];
  recommendation: string;
  modelUsed: string;
}

export interface MarketContext {
  regime?: string;        // Aether'dan
  sectorTrend?: string;   // Demeter'dan
  overallSentiment?: string; // Hermes'ten
}

// === EXPLANATION SERVICE ===

class CouncilExplanationService {
  private static instance: CouncilExplanationService;

  private constructor() { }

  public static getInstance(): CouncilExplanationService {
    if (!CouncilExplanationService.instance) {
      CouncilExplanationService.instance = new CouncilExplanationService();
    }
    return CouncilExplanationService.instance;
  }

  /**
   * Grand Council kararını AI ile açıkla
   */
  async explainDecision(
    decision: CouncilKarar,
    context?: MarketContext
  ): Promise<CouncilExplanation> {
    const prompt = this.buildPrompt(decision, context);

    const systemPrompt = `Sen Pantheon Investment Platform'un AI yatırım danışmanısın.
Türkiye borsasında uzmanlaşmışsın. Grand Council'nin kararlarını yatırımcıya
anlaşılır, güvenilir ve tarafsız bir şekilde açıkla.

Kurallar:
- Kısa ve öz yaz (2-3 paragraf)
- Türkçe kullan
- Yatırım tavsiyesi verme (eğitim amaçlı)
- Riskleri ve fırsatları net şekilde belirt
- Modül oylarını referans al`;

    try {
      const response = await llm.generate(prompt, systemPrompt);

      // Yanıtı parse et
      const explanation = response.text;
      const keyPoints = this.extractKeyPoints(explanation);
      const risks = this.extractRisks(explanation);
      const opportunities = this.extractOpportunities(explanation);
      const recommendation = this.extractRecommendation(explanation, decision.sonKarar);

      return {
        councilDecision: decision,
        explanation,
        keyPoints,
        risks,
        opportunities,
        recommendation,
        modelUsed: response.model,
      };
    } catch (error) {
      console.error('AI açıklama hatası:', error);
      return this.getFallbackExplanation(decision);
    }
  }

  /**
   * Prompt oluştur
   */
  private buildPrompt(decision: CouncilKarar, context?: MarketContext): string {
    const emoji = decision.sonKarar === 'AL' ? '🟢' : decision.sonKarar === 'SAT' ? '🔴' : '🟡';

    let prompt = `Pantheon Grand Council şu kararı verdi:

${emoji} Hisse: ${decision.hisse}
${emoji} Karar: ${decision.sonKarar}
${emoji} Konsensus: %${decision.konsensus}

Modül Oyları:
`;

    decision.oylar.forEach(o => {
      prompt += `  • ${o.modul}: ${o.oy} (${o.guven}/100 güven) - ${o.aciklama}\n`;
    });

    if (context) {
      prompt += `\nPiyasa Bağlamı:\n`;
      if (context.regime) prompt += `  • Makro Rejim: ${context.regime}\n`;
      if (context.sectorTrend) prompt += `  • Sektör Trend: ${context.sectorTrend}\n`;
      if (context.overallSentiment) prompt += `  • Piyasa Sentiment: ${context.overallSentiment}\n`;
    }

    prompt += `\nBu kararın arkasındaki nedenleri, riskleri ve fırsatları analiz et.`;

    return prompt;
  }

  /**
   * AI yanıtından ana noktaları çıkar
   */
  private extractKeyPoints(text: string): string[] {
    const points: string[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      // Başlangıç noktaları
      if (line.match(/^(•|-|\*|\d+\.)/)) {
        const cleaned = line.replace(/^(•|-|\*|\d+\.)\s*/, '').trim();
        if (cleaned.length > 10) {
          points.push(cleaned);
        }
      }
    }

    return points.slice(0, 5);
  }

  /**
   * AI yanıtından riskleri çıkar
   */
  private extractRisks(text: string): string[] {
    const risks: string[] = [];
    const riskKeywords = ['risk', 'tehlike', 'dikkat', 'temkinli', 'kayip', 'zarar'];

    const sentences = text.split(/[.!?]+/);
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if (riskKeywords.some(k => lower.includes(k))) {
        const cleaned = sentence.trim();
        if (cleaned.length > 15) {
          risks.push(cleaned);
        }
      }
    }

    return risks.slice(0, 3);
  }

  /**
   * AI yanıtından fırsatları çıkar
   */
  private extractOpportunities(text: string): string[] {
    const opportunities: string[] = [];
    const oppKeywords = ['fırsat', 'potansiyel', 'büyüme', 'artış', 'kazanç', 'hedef'];

    const sentences = text.split(/[.!?]+/);
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if (oppKeywords.some(k => lower.includes(k))) {
        const cleaned = sentence.trim();
        if (cleaned.length > 15) {
          opportunities.push(cleaned);
        }
      }
    }

    return opportunities.slice(0, 3);
  }

  /**
   * AI yanıtından tavsiye çıkar
   */
  private extractRecommendation(text: string, decision: string): string {
    const recommendationMap: Record<string, string> = {
      'AL': 'Bu hisse için AL sinyali var. Ancak kendi araştırmanızı yapın.',
      'SAT': 'Bu hisse için SAT sinyali var. Dikkatli olun.',
      'BEKLE': 'Bu hisse için BEKLE sinyali var. Gelişmeleri izleyin.',
    };

    return recommendationMap[decision] || 'Kendi araştırmanızı yapın.';
  }

  /**
   * Fallback açıklama (AI çalışmazsa)
   */
  private getFallbackExplanation(decision: CouncilKarar): CouncilExplanation {
    const alVotes = decision.oylar.filter(o => o.oy === 'AL').length;
    const satVotes = decision.oylar.filter(o => o.oy === 'SAT').length;

    let explanation = `${decision.hisse} için Grand Council ${decision.sonKarar} kararı verdi. `;
    explanation += `%${decision.konsensus} konsensus ile ${alVotes} modül AL, ${satVotes} modül SAT oyu verdi. `;

    if (decision.sonKarar === 'AL') {
      explanation += 'Çoğunluk modüller bu hisse için olumlu görüş beyan ediyor.';
    } else if (decision.sonKarar === 'SAT') {
      explanation += 'Çoğunluk modüller bu hisse için temkinli görüş beyan ediyor.';
    } else {
      explanation += 'Modüller kararsız, nötr bir tavsiye veriyor.';
    }

    return {
      councilDecision: decision,
      explanation,
      keyPoints: [],
      risks: ['Yatırım kararı almadan önce kendi araştırmanızı yapın'],
      opportunities: [],
      recommendation: 'Kendi araştırmanızı yapın.',
      modelUsed: 'Fallback',
    };
  }

  /**
   * Toplu karar açıklaması
   */
  async explainMultipleDecisions(
    decisions: CouncilKarar[],
    context?: MarketContext
  ): Promise<CouncilExplanation[]> {
    const explanations: CouncilExplanation[] = [];

    for (const decision of decisions) {
      const explanation = await this.explainDecision(decision, context);
      explanations.push(explanation);
    }

    return explanations;
  }

  /**
   * Portföy özeti oluştur
   */
  async generatePortfolioSummary(
    decisions: CouncilKarar[],
    context?: MarketContext
  ): Promise<{
    summary: string;
    alCount: number;
    satCount: number;
    bekleCount: number;
    topPicks: string[];
  }> {
    const alCount = decisions.filter(d => d.sonKarar === 'AL').length;
    const satCount = decisions.filter(d => d.sonKarar === 'SAT').length;
    const bekleCount = decisions.filter(d => d.sonKarar === 'BEKLE').length;

    // En yüksek konsensuslu AL hisseleri
    const topPicks = decisions
      .filter(d => d.sonKarar === 'AL')
      .sort((a, b) => b.konsensus - a.konsensus)
      .slice(0, 5)
      .map(d => d.hisse);

    let prompt = `Pantheon portföy analizi:\n\n`;
    prompt += `Toplam ${decisions.length} hisse analiz edildi.\n`;
    prompt += `• AL: ${alCount}\n`;
    prompt += `• SAT: ${satCount}\n`;
    prompt += `• BEKLE: ${bekleCount}\n\n`;

    if (topPicks.length > 0) {
      prompt += `En güçlü AL sinyalleri: ${topPicks.join(', ')}\n\n`;
    }

    if (context) {
      if (context.regime) prompt += `Makro Rejim: ${context.regime}\n`;
      if (context.overallSentiment) prompt += `Piyasa Sentiment: ${context.overallSentiment}\n`;
    }

    prompt += `\nBu portföy için 2-3 cümlelik özetli bir yatırım stratejisi yaz.`;

    try {
      const response = await llm.generate(
        prompt,
        'Sen bir portföy yöneticisisin. Pantheon analiz sonuçlarına portföy stratejisi öner.'
      );

      return {
        summary: response.text,
        alCount,
        satCount,
        bekleCount,
        topPicks,
      };
    } catch (error) {
      return {
        summary: `${decisions.length} hisse analiz edildi. ${alCount} AL, ${satCount} SAT, ${bekleCount} BEKLE sinyali var.`,
        alCount,
        satCount,
        bekleCount,
        topPicks,
      };
    }
  }
}

// === EXPORTS ===

export const councilExplanation = CouncilExplanationService.getInstance();

export default CouncilExplanationService;
