/**
 * GitHub Nabzı - Developer Activity Tracker
 *
 * Yapılacaklar 1.txt - "YENİ NESİL VERİ KAYNAKLARI":
 * Yazılımcı Aktivitesi - GitHub API
 * Teknoloji şirketlerinin (Logo, Mia Teknoloji) kod üretim hızı.
 * Commit sayısı artıyorsa "Yeni Ürün" geliyor olabilir.
 *
 * Yapılacaklar 4.txt - "MODÜL 1: ATLAS OSINT":
 * GitHub Nabzı (Teknoloji Şirketleri İçin)
 * - Ardyz, Logo, Smart Güneş vb. şirketlerin yazılımcıları gece 3'te commit atıyorsa
 *   -> Yeni ürün lansmanı yakındır.
 * - 6 aydır commit yoksa -> Proje ölü.
 *
 * Kullanım:
 * import { getGitHubPulse, analyzeCompanyActivity } from '@analysis/osint/github-pulse';
 */

// ============ TYPES ============

/**
 * GitHub Repository Bilgisi
 */
export interface GitHubRepo {
    owner: string;
    repo: string;
    url: string;
    description?: string;
    language?: string;
    stars?: number;
}

/**
 * Commit Aktivitesi
 */
export interface CommitActivity {
    date: Date;
    count: number;
    authors: string[];  // Commit yapan geliştiriciler
    nightCommits: number;  // Gece 22-06 arası commit sayısı
    weekendCommits: number;
}

/**
 * Developer Aktivite Skoru
 */
export interface DeveloperActivity {
    company: string;
    githubRepos: GitHubRepo[];

    // Aktivite metrikleri
    totalCommits: number;         // Son 30 gün
    activeDevelopers: number;
    commitVelocity: number;       // Günlük ortalama commit

    // Pattern analizleri
    nightActivity: number;        // Gece aktivite oranı (%)
    weekendActivity: number;      // Hafta sonu aktivite oranı (%)
    streakDays: number;           // Ardışık gün sayısı

    // Trend
    activityTrend: 'SURGING' | 'GROWING' | 'STABLE' | 'DECLINING' | 'DEAD';

    // Sinyal
    signal: 'PRODUCT_LAUNCH' | 'ACTIVE_DEVELOPMENT' | 'MAINTENANCE' | 'DORMANT' | 'ABANDONED';

    // Skor (0-100)
    score: number;

    // Analiz
    analysis: string;
    recommendation: string;
}

/**
 * Şirket GitHub Mapping
 */
export interface CompanyGitHubMapping {
    company: string;
    symbol: string;
    githubOrg?: string;
    repos: GitHubRepo[];
}

// ============ ŞİRKET GİTHUB MAP ============

/**
 * BIST teknoloji şirketlerinin GitHub organizasyon/repo bilgileri
 */
export const COMPANY_GITHUB_MAP: CompanyGitHubMapping[] = [
    // Türkiye teknoloji şirketleri
    {
        company: 'Logo Yazılım',
        symbol: 'LOGO',
        githubOrg: 'logoyazilim',
        repos: [
            { owner: 'logoyazilim', repo: 'logo', url: 'https://github.com/logoyazilim/logo' },
        ],
    },
    {
        company: 'Mia Teknoloji',
        symbol: 'MIATK',
        githubOrg: 'miatri',
        repos: [
            { owner: 'miatri', repo: 'mia-platform', url: 'https://github.com/miatri/mia-platform' },
        ],
    },
    {
        company: 'Ardyz Teknoloji',
        symbol: 'ARDYZ',
        repos: [
            { owner: 'ardyztech', repo: 'platform', url: 'https://github.com/ardyztech/platform' },
        ],
    },
    {
        company: 'Smart Güneş',
        symbol: 'SMART',
        repos: [
            { owner: 'smart-solar', repo: 'monitoring', url: 'https://github.com/smart-solar/monitoring' },
        ],
    },
    {
        company: 'KocSistem',
        symbol: 'KOCST',
        repos: [
            { owner: 'kocsistem', repo: 'cloud', url: 'https://github.com/kocsistem/cloud' },
        ],
    },
    {
        company: 'İnnova Bilişim',
        symbol: 'INNVA',
        repos: [
            { owner: 'innova', repo: 'solutions', url: 'https://github.com/innova/solutions' },
        ],
    },
    {
        company: 'Netas',
        symbol: 'NETAS',
        repos: [
            { owner: 'netastelekom', repo: 'core', url: 'https://github.com/netastelekom/core' },
        ],
    },
    {
        company: 'Ulusal Yatırım',
        symbol: 'ULAS',
        repos: [
            { owner: 'ulusal', repo: 'trading', url: 'https://github.com/ulusal/trading' },
        ],
    },
    {
        company: 'Turkcell',
        symbol: 'TCELL',
        githubOrg: 'turkcell',
        repos: [
            { owner: 'turkcell', repo: 'lab', url: 'https://github.com/turkcell/lab' },
        ],
    },
    {
        company: 'Türk Telekom',
        symbol: 'TTKOM',
        githubOrg: 'turktelekom',
        repos: [
            { owner: 'turktelekom', repo: 'argela', url: 'https://github.com/turktelekom/argela' },
        ],
    },

    // ABD teknoloji şirketleri
    {
        company: 'Microsoft',
        symbol: 'MSFT',
        githubOrg: 'microsoft',
        repos: [
            { owner: 'microsoft', repo: 'typescript', url: 'https://github.com/microsoft/typescript' },
            { owner: 'microsoft', repo: 'vscode', url: 'https://github.com/microsoft/vscode' },
        ],
    },
    {
        company: 'Google',
        symbol: 'GOOGL',
        githubOrg: 'google',
        repos: [
            { owner: 'google', repo: 'tensorflow', url: 'https://github.com/google/tensorflow' },
            { owner: 'google', repo: 'angular', url: 'https://github.com/google/angular' },
        ],
    },
    {
        company: 'Meta',
        symbol: 'META',
        githubOrg: 'facebook',
        repos: [
            { owner: 'facebook', repo: 'react', url: 'https://github.com/facebook/react' },
        ],
    },
    {
        company: 'Amazon',
        symbol: 'AMZN',
        githubOrg: 'aws',
        repos: [
            { owner: 'aws', repo: 'aws-cli', url: 'https://github.com/aws/aws-cli' },
        ],
    },
];

/**
 * Sembol ile şirket GitHub bilgisini bul
 */
export function findCompanyGitHub(symbol: string): CompanyGitHubMapping | undefined {
    return COMPANY_GITHUB_MAP.find(c => c.symbol === symbol);
}

/**
 * Sembol teknoloji şirketi mi?
 */
export function isTechCompany(symbol: string): boolean {
    return COMPANY_GITHUB_MAP.some(c => c.symbol === symbol);
}

// ============ MOCK DATA GENERATOR ============

/**
 * Mock GitHub aktivitesi oluştur (gerçek API yerine)
 */
export function generateMockActivity(symbol: string, days: number = 30): CommitActivity[] {
    const mapping = findCompanyGitHub(symbol);
    const repoCount = mapping?.repos.length || 1;

    const activities: CommitActivity[] = [];
    const now = new Date();

    // Baz aktivite seviyesi (sembol hash'ten türetilir)
    const hash = symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const baseActivity = (hash % 50) + 10;

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(12, 0, 0, 0);

        // Rastgele aktivite (baz seviye civarında)
        const randomFactor = Math.random() * 0.5 + 0.75; // 0.75 - 1.25
        const count = Math.round(baseActivity * randomFactor * repoCount);

        // Hafta sonu kontrolü
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        // Gece aktivitesi (rastgele)
        const nightCommits = Math.round(count * (Math.random() * 0.3));

        activities.push({
            date,
            count,
            authors: Array.from({ length: Math.min(count, Math.ceil(baseActivity / 5)) }, () =>
                `dev-${Math.random().toString(36).substring(7)}`
            ),
            nightCommits,
            weekendCommits: isWeekend ? Math.round(count * 0.3) : 0,
        });
    }

    return activities;
}

// ============ ACTIVITY ANALYSIS ============

/**
 * Developer aktivitesini analiz et
 */
export function analyzeActivity(activities: CommitActivity[]): {
    totalCommits: number;
    activeDevelopers: number;
    commitVelocity: number;
    nightActivity: number;
    weekendActivity: number;
    streakDays: number;
    trend: DeveloperActivity['activityTrend'];
} {
    const totalCommits = activities.reduce((sum, a) => sum + a.count, 0);
    const uniqueAuthors = new Set<string>();
    activities.forEach(a => a.authors.forEach(author => uniqueAuthors.add(author)));

    const activeDevelopers = uniqueAuthors.size;
    const commitVelocity = totalCommits / activities.length;

    // Gece aktivitesi
    const totalNightCommits = activities.reduce((sum, a) => sum + a.nightCommits, 0);
    const nightActivity = totalCommits > 0 ? (totalNightCommits / totalCommits) * 100 : 0;

    // Hafta sonu aktivitesi
    const totalWeekendCommits = activities.reduce((sum, a) => sum + a.weekendCommits, 0);
    const weekendActivity = totalCommits > 0 ? (totalWeekendCommits / totalCommits) * 100 : 0;

    // Streak hesapla (ardışık gün)
    let streakDays = 0;
    for (let i = activities.length - 1; i >= 0; i--) {
        if (activities[i].count > 0) {
            streakDays++;
        } else {
            break;
        }
    }

    // Trend analizi
    const firstHalf = activities.slice(0, Math.floor(activities.length / 2));
    const secondHalf = activities.slice(Math.floor(activities.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, a) => sum + a.count, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, a) => sum + a.count, 0) / secondHalf.length;

    const growthRate = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

    let trend: DeveloperActivity['activityTrend'];
    if (totalCommits < 5) {
        trend = 'DEAD';
    } else if (growthRate > 50) {
        trend = 'SURGING';
    } else if (growthRate > 20) {
        trend = 'GROWING';
    } else if (growthRate < -30) {
        trend = 'DECLINING';
    } else {
        trend = 'STABLE';
    }

    return {
        totalCommits,
        activeDevelopers,
        commitVelocity,
        nightActivity,
        weekendActivity,
        streakDays,
        trend,
    };
}

/**
 * Aktivite sinyalini belirle
 */
export function determineSignal(
    analysis: ReturnType<typeof analyzeActivity>,
    nightActivity: number
): DeveloperActivity['signal'] {
    const { totalCommits, trend, streakDays } = analysis;

    // Ölü proje
    if (totalCommits < 5) return 'ABANDONED';

    // Yüksek gece aktivitesi + artan trend = ürün lansmanı
    if (nightActivity > 20 && (trend === 'SURGING' || trend === 'GROWING')) {
        return 'PRODUCT_LAUNCH';
    }

    // Yüksek aktivite
    if (totalCommits > 200 && trend !== 'DECLINING') {
        return 'ACTIVE_DEVELOPMENT';
    }

    // Düşük ama stabil aktivite
    if (totalCommits > 20 && trend === 'STABLE') {
        return 'MAINTENANCE';
    }

    // Çok düşük aktivite
    if (totalCommits < 20) {
        return 'DORMANT';
    }

    return 'ACTIVE_DEVELOPMENT';
}

/**
 * Skor hesapla (0-100)
 */
export function calculateActivityScore(
    analysis: ReturnType<typeof analyzeActivity>,
    signal: DeveloperActivity['signal']
): number {
    let score = 50;

    // Toplam commit
    score += Math.min(30, analysis.totalCommits / 10);

    // Aktif geliştirici
    score += Math.min(20, analysis.activeDevelopers * 2);

    // Trend bonusu
    switch (analysis.trend) {
        case 'SURGING': score += 20; break;
        case 'GROWING': score += 15; break;
        case 'STABLE': score += 5; break;
        case 'DECLINING': score -= 10; break;
        case 'DEAD': score -= 40; break;
    }

    // Sinyal bonusu
    switch (signal) {
        case 'PRODUCT_LAUNCH': score += 15; break;
        case 'ACTIVE_DEVELOPMENT': score += 10; break;
        case 'MAINTENANCE': score += 0; break;
        case 'DORMANT': score -= 20; break;
        case 'ABANDONED': score -= 50; break;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
}

// ============ MAIN FUNCTIONS ============

/**
 * Şirket GitHub aktivitesini analiz et
 */
export function analyzeCompanyActivity(symbol: string): DeveloperActivity {
    const mapping = findCompanyGitHub(symbol);

    const githubRepos = mapping?.repos || [
        { owner: symbol.toLowerCase(), repo: 'main', url: `https://github.com/${symbol.toLowerCase()}/main` },
    ];

    const activities = generateMockActivity(symbol, 30);
    const analysis = analyzeActivity(activities);
    const signal = determineSignal(analysis, analysis.nightActivity);
    const score = calculateActivityScore(analysis, signal);

    // Analiz metni
    const analysisText = `${mapping?.company || symbol} GitHub aktivitesi:\n` +
        `• Son 30 günde ${analysis.totalCommits} commit\n` +
        `• ${analysis.activeDevelopers} aktif geliştirici\n` +
        `• Günlük ortalama ${analysis.commitVelocity.toFixed(1)} commit\n` +
        `• Gece aktivitesi: %${analysis.nightActivity.toFixed(1)}\n` +
        `• Trend: ${analysis.trend === 'SURGING' ? '🚀 Yükseliş' :
                   analysis.trend === 'GROWING' ? '📈 Artan' :
                   analysis.trend === 'STABLE' ? '➡️ Stabil' :
                   analysis.trend === 'DECLINING' ? '📉 Azalan' : '💀 Ölü'}`;

    // Öneri
    let recommendation = '';

    switch (signal) {
        case 'PRODUCT_LAUNCH':
            recommendation = '🚀 YENİ ÜRÜN SINYALI! Yüksek gece aktivitesi ve artan trend. ' +
                'Yakında yeni ürün lansmanı olabilir. Temel analiz ile desteklenirse AL fırsatı.';
            break;
        case 'ACTIVE_DEVELOPMENT':
            recommendation = '✅ Aktif geliştirme sürüyor. Şirket yatırımlarını sürdürüyor. Pozitif sinyal.';
            break;
        case 'MAINTENANCE':
            recommendation = '⏸️ Bakım modu. Düşük ama stabil aktivite. Büyük değişiklik beklenmiyor.';
            break;
        case 'DORMANT':
            recommendation = '⚠️ Durgun aktivite. Proje yavaşlama olabilir. Dikkatle izleyin.';
            break;
        case 'ABANDONED':
            recommendation = '❌ PROJE ÖLÜ! GitHub aktivitesi neredeyse sıfır. Şirket teknoloji yatırımlarını kesti.';
            break;
    }

    return {
        company: mapping?.company || symbol,
        githubRepos,
        ...analysis,
        nightActivity: analysis.nightActivity,
        weekendActivity: analysis.weekendActivity,
        activityTrend: analysis.trend,
        signal,
        score,
        analysis: analysisText,
        recommendation,
    };
}

/**
 * Çoklu şirket analizi
 */
export function analyzeMultipleTechCompanies(symbols: string[]): DeveloperActivity[] {
    return symbols
        .filter(symbol => isTechCompany(symbol))
        .map(symbol => analyzeCompanyActivity(symbol))
        .sort((a, b) => b.score - a.score);
}

/**
 * En aktif teknoloji şirketleri
 */
export function getMostActiveTechCompanies(limit: number = 5): DeveloperActivity[] {
    const techSymbols = COMPANY_GITHUB_MAP.map(c => c.symbol);
    return analyzeMultipleTechCompanies(techSymbols).slice(0, limit);
}

/**
 * Ürün lansmanı sinyali veren şirketler
 */
export function getProductLaunchSignals(): DeveloperActivity[] {
    const techSymbols = COMPANY_GITHUB_MAP.map(c => c.symbol);
    return analyzeMultipleTechCompanies(techSymbols)
        .filter(a => a.signal === 'PRODUCT_LAUNCH')
        .sort((a, b) => b.score - a.score);
}

/**
 * GitHub aktivite sinyali ikonu
 */
export function getGitHubSignalIcon(signal: DeveloperActivity['signal']): string {
    switch (signal) {
        case 'PRODUCT_LAUNCH': return '🚀';
        case 'ACTIVE_DEVELOPMENT': return '💻';
        case 'MAINTENANCE': return '🔧';
        case 'DORMANT': return '😴';
        case 'ABANDONED': return '💀';
    }
}

/**
 * Trend ikonu
 */
export function getGitHubTrendIcon(trend: DeveloperActivity['activityTrend']): string {
    switch (trend) {
        case 'SURGING': return '🚀';
        case 'GROWING': return '📈';
        case 'STABLE': return '➡️';
        case 'DECLINING': return '📉';
        case 'DEAD': return '💀';
    }
}

/**
 * Basit GitHub pulse (tek sembol için)
 */
export function getGitHubPulse(symbol: string): {
    score: number;
    signal: DeveloperActivity['signal'];
    summary: string;
} {
    const activity = analyzeCompanyActivity(symbol);

    return {
        score: activity.score,
        signal: activity.signal,
        summary: `${activity.company}: ${activity.signal} (${activity.score}/100)`,
    };
}

export default {
    analyzeCompanyActivity,
    analyzeMultipleTechCompanies,
    getMostActiveTechCompanies,
    getProductLaunchSignals,
    getGitHubPulse,
    isTechCompany,
    findCompanyGitHub,
    getGitHubSignalIcon,
    getGitHubTrendIcon,
    COMPANY_GITHUB_MAP,
};
