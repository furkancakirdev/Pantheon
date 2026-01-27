/**
 * Twitter API v2 Client (Mock)
 *
 * Pantheon Investment Platform için Twitter/X veri entegrasyonu
 * Academic Research API olmadan mock verilerle çalışır
 *
 * Not: Gerçek Twitter API v2 Academic Research erişimi için
 * https://developer.twitter.com/en/docs/twitter-api/getting-started/about-twitter-api#v2-access
 */

// Redis disabled - cache operations removed

// === TYPES ===

export interface Tweet {
  id: string;
  text: string;
  authorId: string;
  authorUsername: string;
  createdAt: Date;
  publicMetrics: {
    likeCount: number;
    retweetCount: number;
    replyCount: number;
    quoteCount: number;
  };
  mentionedSymbols?: string[]; // $THYAO, $ASELS gibi
}

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  description: string;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
}

export interface SentimentAnalysis {
  symbol: string;
  sentiment: number; // -1 (negatif) to +1 (pozitif)
  label: 'POZITIF' | 'NEGATIF' | 'NOTR';
  tweetCount: number;
  lastUpdate: Date;
  topTweets: {
    text: string;
    sentiment: number;
    author: string;
  }[];
}

// === MOCK DATA ===

/**
 * Takip edilecek finansal Twitter hesapları (Türkiye)
 * Gerçek API olmadan mock veri üretimi için
 */
export const FINANCIAL_TWITTER_ACCOUNTS: TwitterUser[] = [
  {
    id: '1',
    username: 'YasarErdinc',
    name: 'Yaşar Erdinç',
    description: 'Borsa Yatırımcısı | Temel Analiz Uzmanı',
    verified: true,
    followersCount: 150000,
    followingCount: 500,
    tweetCount: 15000,
  },
  {
    id: '2',
    username: 'AliPersembe',
    name: 'Ali Perşembe',
    description: 'Teknik Analiz | Borsa Uzmanı',
    verified: true,
    followersCount: 80000,
    followingCount: 300,
    tweetCount: 8500,
  },
  {
    id: '3',
    username: 'KivancOzbilgic',
    name: 'Kıvanç Özbilgiç',
    description: 'İndikatör Uzmanı | Borsa Eğitmeni',
    verified: true,
    followersCount: 120000,
    followingCount: 400,
    tweetCount: 12000,
  },
];

/**
 * Mock tweet'ler - hisse senedi mention'ları ile
 */
const MOCK_TWEETS: Tweet[] = [
  {
    id: '1001',
    text: '$THYAO Türk Hava Yolları yeni uçak siparişi verdi. Gelecek parlak görünüyor. 🚀',
    authorId: '1',
    authorUsername: 'YasarErdinc',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 saat önce
    publicMetrics: { likeCount: 1250, retweetCount: 320, replyCount: 85, quoteCount: 45 },
    mentionedSymbols: ['THYAO'],
  },
  {
    id: '1002',
    text: '$ASELS savunma harcamalarındaki artışla birlikte ciddi bir potansiyel taşıyor. Teknik olarak 150-170 bandı önemli.',
    authorId: '2',
    authorUsername: 'AliPerşembe',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 saat önce
    publicMetrics: { likeCount: 890, retweetCount: 210, replyCount: 65, quoteCount: 30 },
    mentionedSymbols: ['ASELS'],
  },
  {
    id: '1003',
    text: '$BIMAS perakende sektöründe hala en güçlü oyuncu. F/K oranları cazip. Yabancı ilgisi devam ediyor.',
    authorId: '1',
    authorUsername: 'YasarErdinc',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 saat önce
    publicMetrics: { likeCount: 2100, retweetCount: 580, replyCount: 120, quoteCount: 65 },
    mentionedSymbols: ['BIMAS'],
  },
  {
    id: '1004',
    text: '$SAHOL AlphaTrend al sinyali verdi. Hacim artışı dikkat çekici. Yatırımcılar dikkatli olmalı.',
    authorId: '3',
    authorUsername: 'KivancOzbilgic',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 saat önce
    publicMetrics: { likeCount: 1450, retweetCount: 380, replyCount: 95, quoteCount: 50 },
    mentionedSymbols: ['SAHOL'],
  },
  {
    id: '1005',
    text: '$KCHOL mali tabloları zayıf geldi. ROE beklentilerin altında. Temel analizcuları dikkatli olmalı.',
    authorId: '1',
    authorUsername: 'YasarErdinc',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 saat önce
    publicMetrics: { likeCount: 650, retweetCount: 180, replyCount: 45, quoteCount: 20 },
    mentionedSymbols: ['KCHOL'],
  },
  {
    id: '1006',
    text: '$TUPRS rafineri marjları iyileşiyor. Petrol fiyatlarındaki istikrar olumlu. Yatırım yapılabilir.',
    authorId: '2',
    authorUsername: 'AliPersembe',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 saat önce
    publicMetrics: { likeCount: 980, retweetCount: 250, replyCount: 70, quoteCount: 35 },
    mentionedSymbols: ['TUPRS'],
  },
  {
    id: '1007',
    text: '$GARAN bankacılık sektöründe en güçlü bilanço. Kar artışı sürüyor. Uzun vadede güvenilir.',
    authorId: '1',
    authorUsername: 'YasarErdinc',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 saat önce
    publicMetrics: { likeCount: 1750, retweetCount: 420, replyCount: 100, quoteCount: 55 },
    mentionedSymbols: ['GARAN'],
  },
  {
    id: '1008',
    text: '$SISE global polimer fiyatlarındaki düşüş kar marjlarını baskılıyor. Kısa vadede temkinli olmakta fayda var.',
    authorId: '3',
    authorUsername: 'KivancOzbilgic',
    createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000), // 7 saat önce
    publicMetrics: { likeCount: 540, retweetCount: 150, replyCount: 40, quoteCount: 15 },
    mentionedSymbols: ['SISE'],
  },
  {
    id: '1009',
    text: "Bugün piyasa genelinde alıcılı seyir var. Endeks 10.000'i test ediyor. Risk iştahı yüksek.",
    authorId: '2',
    authorUsername: 'AliPersembe',
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 dk önce
    publicMetrics: { likeCount: 3200, retweetCount: 850, replyCount: 180, quoteCount: 90 },
    mentionedSymbols: [],
  },
  {
    id: '1010',
    text: '$THYAO 2025 hedeflerimize ulaşma yolunda ilerliyoruz. Filomuzu genişletmeye devam edeceğiz. Yolcularımızın memnuniyeti önceliğimiz.',
    authorId: '1',
    authorUsername: 'YasarErdinc',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 saat önce
    publicMetrics: { likeCount: 5600, retweetCount: 1200, replyCount: 320, quoteCount: 180 },
    mentionedSymbols: ['THYAO'],
  },
];

// === CLIENT CLASS ===

class TwitterClient {
  private static instance: TwitterClient;
  private useMock: boolean;

  private constructor() {
    // Gerçek API anahtarı varsa false yapın
    this.useMock = !process.env.TWITTER_API_KEY;
    if (this.useMock) {
      console.log('ℹ️ Twitter Client: Mock modda çalışıyor');
    }
  }

  public static getInstance(): TwitterClient {
    if (!TwitterClient.instance) {
      TwitterClient.instance = new TwitterClient();
    }
    return TwitterClient.instance;
  }

  /**
   * Kullanıcı bilgilerini getir
   */
  async getUserByUsername(username: string): Promise<TwitterUser | null> {
    // Mock veriden getir
    const user = FINANCIAL_TWITTER_ACCOUNTS.find(u =>
      u.username.toLowerCase() === username.toLowerCase()
    );

    return user || null;
  }

  /**
   * Belirli bir kullanıcının tweet'lerini getir
   */
  async getUserTweets(username: string, count: number = 10): Promise<Tweet[]> {
    const cacheKey = `twitter:tweets:${username}`;

    // Mock veriden filtrele
    const userTweets = MOCK_TWEETS.filter(t =>
      t.authorUsername.toLowerCase() === username.toLowerCase()
    ).slice(0, count);

    return userTweets;
  }

  /**
   * Hisse senedi mention'larını ara
   */
  async searchBySymbol(symbol: string, count: number = 20): Promise<Tweet[]> {
    // Mock veriden ara
    const tweets = MOCK_TWEETS.filter(t =>
      t.mentionedSymbols?.some(s => s.toUpperCase() === symbol.toUpperCase()) ||
      t.text.toUpperCase().includes(`$${symbol.toUpperCase()}`)
    ).slice(0, count);

    return tweets;
  }

  /**
   * Tüm finansal tweet'leri getir
   */
  async getAllFinancialTweets(count: number = 50): Promise<Tweet[]> {
    const tweets = MOCK_TWEETS.slice(0, count);
    return tweets;
  }

  /**
   * Tweet'ten bahsedilen sembolleri çıkar
   */
  extractMentionedSymbols(text: string): string[] {
    const symbolRegex = /\$([A-Z0-9]{3,6})/gi;
    const matches = text.match(symbolRegex) || [];
    return [...new Set(matches.map(s => s.substring(1).toUpperCase()))];
  }

  /**
   * Tweet'in etkileşim skorunu hesapla
   */
  calculateEngagementScore(tweet: Tweet): number {
    const { likeCount, retweetCount, replyCount, quoteCount } = tweet.publicMetrics;

    // Ağırlıklı skor: Retweet > Like > Quote > Reply
    const score =
      (likeCount * 1) +
      (retweetCount * 3) +
      (replyCount * 0.5) +
      (quoteCount * 2);

    return score;
  }
}

// === EXPORTS ===

export const twitterClient = TwitterClient.getInstance();

export default TwitterClient;
