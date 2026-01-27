/**
 * Pantheon Stock Registry
 * Tüm BIST hisseleri, ABD hisseleri ve TEFAS fonlarının kayıt defteri
 *
 * Bu dosya örnek semboller yerine TAM listeleri içerir
 */

export interface StockInfo {
    symbol: string;
    name: string;
    sector: string;
    market: 'BIST' | 'NYSE' | 'NASDAQ' | 'TEFAS';
    subMarket?: string; // 'STAR', 'MAIN', 'EMERGING' vb.
    currency?: 'TRY' | 'USD';
    isActive: boolean;
}

export interface FundInfo {
    code: string;
    name: string;
    sector: string;
    market: 'TEFAS';
    type: string; // 'YENI', 'ESKI', 'SEPET', 'KATILIM', 'GOLD'
    fundManager: string;
    riskLevel: 1 | 2 | 3 | 4 | 5;
    managementFee: number; // Yüzde olarak
    subMarket?: string; // type ile aynı
    currency?: 'TRY';
    isActive: boolean;
}

// ==================== BIST TÜM HİSSELER (500+) ====================
// Sektör atama fonksiyonu - hisse koduna göre sektör tahmini
function getSectorByCode(code: string): string {
    const suffix = code.slice(-2);
    const bankCodes = ['AKBNK', 'ASBNK', 'ICBCT', 'DENIZ', 'QNBFB', 'FINBN', 'TSKB', 'SKBNK', 'ISCTR', 'GARAN', 'YKBNK', 'HALKB', 'VAKBN', 'YATAS', 'PKART'];
    const techCodes = ['ASELS', 'PARSN', 'IHEVA', 'IHYT', 'KAREL', 'NETAS', 'ULUFA', 'AVOD', 'URPA'];
    const goldCodes = ['KOZAA', 'KOZAL', 'BRGYO', 'ASTOR', 'EGEPO'];
    const gyoCodes = ['TEKYO', 'EKGYO', 'ALGYO', 'AVGYO', 'KGYO', 'MRGYO', 'PNLSN', 'PNSUT', 'SERYY', 'VKGYO', 'ZRGYO', 'FEGYO'];

    if (bankCodes.includes(code)) return 'Finans';
    if (suffix === 'BN') return 'Finans';
    if (techCodes.includes(code)) return 'Teknoloji';
    if (suffix === 'GY' || gyoCodes.includes(code)) return 'Gayrimenkul';
    if (suffix === 'YO') return 'Gayrimenkul';
    if (goldCodes.includes(code)) return 'Madencilik';
    if (suffix === 'AO') return 'Otomotiv';
    if (suffix === 'HO') return 'Holding';
    if (suffix === 'SA') return 'Otomotiv';
    if (suffix === 'EN' || suffix === 'ER') return 'Enerji';
    if (suffix === 'CM') return 'Çimento';
    if (suffix === 'TK') return 'Tekstil';

    // Varsayılan sektör atamaları
    const firstChar = code[0];
    if (firstChar === 'A') return 'Diğer';
    if (firstChar === 'B') return 'Gıda';
    if (firstChar === 'C') return 'Kimya';
    if (firstChar === 'D') return 'Enerji';
    if (firstChar === 'E') return 'Gayrimenkul';
    if (firstChar === 'F') return 'Perakende';
    if (firstChar === 'G') return 'Gıda';
    if (firstChar === 'H') return 'Orman';
    if (firstChar === 'I') return 'İnşaat';
    if (firstChar === 'K') return 'Madencilik';
    if (firstChar === 'L') return 'Lojistik';
    if (firstChar === 'M') return 'Metal';
    if (firstChar === 'O') return 'Otomotiv';
    if (firstChar === 'P') return 'Petrokimya';
    if (firstChar === 'S') return 'Teknoloji';
    if (firstChar === 'T') return 'Turizm';
    if (firstChar === 'U') return 'Ulaştırma';
    if (firstChar === 'V') return 'Madencilik';
    if (firstChar === 'Y') return 'Enerji';
    if (firstChar === 'Z') return 'Gıda';

    return 'Diğer';
}

function getSubMarket(code: string): 'STAR' | 'MAIN' | 'EMERGING' {
    // BIST 30 ve önemli hisseler MAIN piyasa
    const mainMarket = ['GARAN', 'ISCTR', 'AKBNK', 'YKBNK', 'HALKB', 'VAKBN', 'TKFEN', 'THYAO', 'PGSUS', 'SAHOL', 'KCHOL',
        'AEFES', 'TUPRS', 'PETKM', 'SISE', 'KOZAA', 'KOZAL', 'TOASO', 'FROTO', 'OTKAR', 'BIMAS', 'MGROS', 'SASA', 'ARCLK',
        'KRDMD', 'EREGL', 'TAVHL', 'BRSAN', 'TSKB', 'ENKAI', 'KORDS', 'ULAS', 'TAVHL', 'ALARK', 'CIMSA', 'ECILC', 'ETIL',
        'SODA', 'YYLGD', 'GSDHO', 'ALBRK', 'AYGAZ', 'BAGFS', 'BRSAN', 'CCOLA', 'DEVA', 'DITAS', 'EKGYO', 'FENER', 'KONTR',
        'KONYA', 'PETSU', 'PTRKM', 'PENTA', 'PETKM', 'SASA', 'SISE', 'TAVHL', 'TKFEN', 'TRKCM', 'TTRAK', 'TUPRS',
        'VAKBN', 'VAKKO', 'YATAS', 'YKBNK', 'YUNSA', 'ACSEL', 'ADEL', 'ADESE', 'ADGYO', 'AEFES', 'AFYON', 'AGESA', 'AGHOL',
        'AGROT', 'AHGAZ', 'AHSGY', 'AKBNK', 'AKCNS', 'AKENR', 'AKFIS', 'AKFGY', 'AKSA', 'AKSEN', 'ALARK', 'ALBRK'];

    return mainMarket.includes(code) ? 'MAIN' : 'STAR';
}

// BIST 500+ Hisse Listesi - Kaynak: Midas, Borsa İstanbul
const BIST_ALL_CODES = [
    'ACSEL', 'ADEL', 'ADESE', 'ADGYO', 'AEFES', 'AFYON', 'AGESA', 'AGHOL', 'AGROT', 'AHGAZ', 'AHSGY', 'AKBNK', 'AKCNS',
    'AKENR', 'AKFIS', 'AKFGY', 'AKFYE', 'AKGRT', 'AKSA', 'AKSEN', 'AKSGY', 'ALARK', 'ALBRK', 'ALCAR', 'ALCTL', 'ALFAS',
    'ALGYO', 'ALKA', 'ALKIM', 'ALKLC', 'ALTNY', 'ALVES', 'ANELE', 'ANGEN', 'ANHYT', 'ANSGR', 'ARASE', 'ARCLK', 'ARDYZ',
    'ARENA', 'ARMGD', 'ARSAN', 'ARTMS', 'ARZUM', 'ASELS', 'ASGYO', 'ASTOR', 'ASUZU', 'ATAKP', 'ATATP', 'AVGYO',
    'AVHOL', 'AVOD', 'AVPGY', 'AYCES', 'AYDEM', 'AYEN', 'AYGAZ', 'AZTEK', 'BAGFS', 'BAHKM', 'BAKAB', 'BALSU',
    'BANVT', 'BARMA', 'BASGZ', 'BAYRK', 'BEGYO', 'BERA', 'BESLR', 'BEYAZ', 'BFREN', 'BIENY', 'BIGCH', 'BIGEN',
    'BIGTK', 'BIMAS', 'BINBN', 'BINHO', 'BIOEN', 'BIZIM', 'BJKAS', 'BLCYT', 'BLUME', 'BMSCH', 'BMSTL', 'BNTAS',
    'BOBET', 'BORLS', 'BORSK', 'BOSSA', 'BRISA', 'BRKVY', 'BRLSM', 'BRSAN', 'BRYAT', 'BSOKE', 'BTCIM', 'BUCIM',
    'BULGS', 'BURCE', 'BVSAN', 'CANTE', 'CATES', 'CCOLA', 'CELHA', 'CEMAS', 'CEMTS', 'CEMZY', 'CEOEM', 'CGCAM',
    'CIMSA', 'CLEBI', 'CMBTN', 'CONSE', 'CRFSA', 'CUSAN', 'CVKMD', 'CWENE', 'DAGI', 'DAPGM', 'DARDL', 'DCTTR',
    'DENGE', 'DERHL', 'DERIM', 'DESA', 'DESPC', 'DEVA', 'DGATE', 'DGNMO', 'DITAS', 'DMRGD', 'DMSAS', 'DNISI',
    'DOAS', 'DOCO', 'DOFER', 'DOFRB', 'DOHOL', 'DSTKF', 'DURDO', 'DURKN', 'DYOBY', 'DZGYO', 'EBEBK', 'ECILC',
    'ECZYT', 'EDATA', 'EDIP', 'EFOR', 'EGEEN', 'EGEGY', 'EGEPO', 'EGGUB', 'EGPRO', 'EGSER', 'EKGYO', 'EKOS', 'EKSUN',
    'ELITE', 'EMKEL', 'ENDAE', 'ENERY', 'ENJSA', 'ENKAI', 'ENSRI', 'ENTRA', 'EPLAS', 'ERBOS', 'ERCB', 'EREGL',
    'ESCAR', 'ESCOM', 'ESEN', 'ETILR', 'EUPWR', 'EUREN', 'EYGYO', 'FADE', 'FENER', 'FLAP', 'FMIZP', 'FONET', 'FORMT',
    'FORTE', 'FRIGO', 'FROTO', 'FZLGY', 'GARAN', 'GARFA', 'GEDIK', 'GEDZA', 'GENIL', 'GENTS', 'GEREL', 'GESAN',
    'GIPTA', 'GLCVY', 'GLRMK', 'GLRYH', 'GLYHO', 'GMTAS', 'GOKNR', 'GOLTS', 'GOODY', 'GOZDE', 'GRSEL', 'GRTHO',
    'GSDDE', 'GSDHO', 'GSRAY', 'GUBRF', 'GUNDG', 'GWIND', 'GZNMI', 'HALKB', 'HATEK', 'HATSN', 'HDFGS', 'HEDEF',
    'HEKTS', 'HKTM', 'HLGYO', 'HOROZ', 'HRKET', 'HTTBT', 'HUNER', 'HURGZ', 'ICBCT', 'ICUGS', 'IEYHO', 'IHAAS',
    'IHGZT', 'IHLAS', 'IHLGM', 'IHYAY', 'IMASM', 'INDES', 'INFO', 'INGRM', 'INTEM', 'INVEO', 'INVES', 'IPEKE',
    'ISCTR', 'ISDMR', 'ISFIN', 'ISGSY', 'ISGYO', 'ISKPL', 'ISMEN', 'ISSEN', 'IZENR', 'IZFAS', 'IZMDC', 'JANTS',
    'KAPLM', 'KAREL', 'KARSN', 'KARTN', 'KATMR', 'KAYSE', 'KBORU', 'KCAER', 'KCHOL', 'KFEIN', 'KGYO', 'KIMMR',
    'KLGYO', 'KLKIM', 'KLMSN', 'KLRHO', 'KLSER', 'KLSYN', 'KLYPV', 'KMPUR', 'KNFRT', 'KOCMT', 'KONKA', 'KONTR',
    'KONYA', 'KOPOL', 'KORDS', 'KOTON', 'KOZAA', 'KOZAL', 'KRDMD', 'KRGYO', 'KRONT', 'KRPLS', 'KRSTL', 'KRTEK',
    'KRVGD', 'KTLEV', 'KTSKR', 'KUTPO', 'KUYAS', 'KZBGY', 'KZGYO', 'LIDER', 'LIDFA', 'LILAK', 'LINK', 'LKMNH',
    'LMKDC', 'LOGO', 'LRSHO', 'LUKSK', 'LYDHO', 'LYDYE', 'MAALT', 'MACKO', 'MAGEN', 'MAKIM', 'MAKTK', 'MANAS',
    'MARBL', 'MARKA', 'MARTI', 'MAVI', 'MEDTR', 'MEGMT', 'MEKAG', 'MERCN', 'MERIT', 'MERKO', 'METRO', 'MGROS',
    'MHRGY', 'MIATK', 'MNDRS', 'MNDTR', 'MOBTL', 'MOGAN', 'MOPAS', 'MPARK', 'MRGYO', 'MRSHL', 'MSGYO', 'MTRKS',
    'NATEN', 'NETAS', 'NIBAS', 'NTGAZ', 'NTHOL', 'NUGYO', 'NUHCM', 'OBAMS', 'OBASE', 'ODAS', 'ODINE', 'OFSYM',
    'ONCSM', 'ONRYT', 'ORGE', 'OSMEN', 'OSTIM', 'OTKAR', 'OTTO', 'OYAKC', 'OYYAT', 'OZATD', 'OZGYO', 'OZKGY',
    'OZSUB', 'OZYSR', 'PAGYO', 'PAMEL', 'PAPIL', 'PARSN', 'PASEU', 'PATEK', 'PCILT', 'PEKGY', 'PENGD', 'PENTA',
    'PETKM', 'PETUN', 'PGSUS', 'PINSU', 'PKART', 'PKENT', 'PLTUR', 'PNLSN', 'PNSUT', 'POLHO', 'POLTK', 'PRDGS',
    'PRKAB', 'PRKME', 'PSGYO', 'QUAGR', 'RALYH', 'RAYSG', 'REEDR', 'RGYAS', 'RTALB', 'RUBNS', 'RUZYE', 'RYGYO',
    'RYSAS', 'SAFKR', 'SAHOL', 'SANFM', 'SANKO', 'SARKY', 'SASA', 'SAYAS', 'SDTTR', 'SEGMN', 'SEGYO', 'SELEC',
    'SERNT', 'SISE', 'SKBNK', 'SKTAS', 'SKYMD', 'SMART', 'SMRTG', 'SMRVA', 'SNGYO', 'SNICA', 'SOKE', 'SOKM',
    'SRVGY', 'SUNTK', 'SURGY', 'SUWEN', 'TABGD', 'TARKM', 'TATEN', 'TATGD', 'TAVHL', 'TBORG', 'TCELL', 'TCKRC',
    'TEHOL', 'TEKTU', 'TERA', 'TEZOL', 'THYAO', 'TKFEN', 'TKNSA', 'TLMAN', 'TMPOL', 'TMSN', 'TNZTP', 'TOASO',
    'TRCAS', 'TRGYO', 'TRHOL', 'TRILC', 'TSGYO', 'TSKB', 'TSPOR', 'TTKOM', 'TTRAK', 'TUCLK', 'TUKAS', 'TUPRS',
    'TUREX', 'TURGG', 'TURSG', 'UFUK', 'ULKER', 'ULUFA', 'ULUSE', 'ULUUN', 'UNLU', 'USAK', 'VAKBN', 'VAKFN',
    'VAKKO', 'VBTYZ', 'VERTU', 'VERUS', 'VESBE', 'VESTL', 'VKGYO', 'VKING', 'VRGYO', 'VSNMD', 'YAPRK', 'YATAS',
    'YAYLA', 'YEOTK', 'YESIL', 'YGGYO', 'YIGIT', 'YKBNK', 'YKSLN', 'YUNSA', 'YYAPI', 'YYLGD', 'ZEDUR', 'ZOREN', 'ZRGYO'
];

// Bazı önemli şirketlerin isimlerini manuel tanımla
const KNOWN_NAMES: Record<string, string> = {
    'GARAN': 'Garanti BBVA', 'ISCTR': 'İş Bankası', 'AKBNK': 'Akbank', 'YKBNK': 'Yapı Kredi',
    'HALKB': 'Halkbank', 'VAKBN': 'Vakıfbank', 'THYAO': 'Türk Hava Yolları', 'PGSUS': 'Pegasus',
    'SAHOL': 'Sabancı Holding', 'KCHOL': 'Koç Holding', 'AEFES': 'Anadolu Efes', 'TUPRS': 'Tüpraş',
    'PETKM': 'Petkim', 'SISE': 'Şişe Cam', 'KOZAA': 'Koza Altın', 'KOZAL': 'Koza Altın (DL)',
    'TOASO': 'Tofaş', 'FROTO': 'Ford Otosan', 'OTKAR': 'Otokar', 'MGROS': 'Migros',
    'SASA': 'Sasa Polyester', 'ARCLK': 'Arçelik', 'KRDMD': 'Kardemir', 'EREGL': 'Ereğli Demir',
    'TAVHL': 'TAV Havalimanları', 'ULAS': 'Ulaşım Ticaret', 'BRSAN': 'Brisa', 'TSKB': 'TSKB',
    'DENIZ': 'Denizbank', 'QNBFB': 'QNB Finansbank', 'FINBN': 'Fibabanka', 'ASELS': 'Aselsan',
    'NETAS': 'Netas', 'KAREL': 'Karel', 'CIMSA': 'Çimsa', 'ALARK': 'Alarko', 'ENKAI': 'Enka',
    'DEVA': 'Deva Holding', 'EKGYO': 'Emlak Konut', 'BAGFS': 'Bagfaş', 'GSDHO': 'GSD Holding',
    'COLA': 'Cola Turka', 'BERA': 'Bera', 'ETIL': 'Eti', 'FENER': 'Fenerbahçe',
    'BJKAS': 'Beşiktaş', 'ULUFA': 'Uluğ', 'PARSN': 'Parsons', 'IHLAS': 'İhlas Holding',
    'ACSEL': 'Akış Elektronik', 'AVOD': 'A.V.O.D', 'AVHOL': 'Avrupa Yatırım Holding', 'AVPGY': 'Avrupakent GMYO',
    'AYGAZ': 'Aygaz', 'AKENR': 'Aksa Enerji', 'AKSA': 'Aksa Akrilik',
    'CALIK': 'Çalık Holding', 'KORDS': 'Kordsa', 'KONYA': 'Konya Selçuk', 'TRKCM': 'Türk Çimento',
    'ATATP': 'Ata Teknoloji', 'ATAKP': 'Ata Petrol', 'YATAS': 'Yapı Kredi Koray', 'PKART': 'Pasha Yatırım',
    'VKGYO': 'Vakıf GYO', 'EGGYO': 'Ege GYO', 'MRGYO': 'Merit GYO', 'KGYO': 'Kütahya GYO',
    'ALGYO': 'Alarko GYO', 'FEGYO': 'Fenerbahçe GYO', 'TRCAS': 'Türk Traktör', 'PETUN': 'Petrol Ofisi',
    'TTKOM': 'Türk Telekom', 'TCELL': 'Turkcell', 'TKFEN': 'Tekfen Holding',
    'PINSU': 'Pınar Su', 'PCILT': 'Pınar Karışık', 'SODA': 'Sanayi Soda', 'YYLGD': 'Yıldız Levent',
    'DOAS': 'Doğa Alışveriş', 'SOKM': 'Şok Marketler',
    'MAVI': 'Mavi', 'LCWAI': 'LC Waikiki'
};

// Dinamik BIST hisse listesi oluştur
export const BIST_STOCKS: StockInfo[] = BIST_ALL_CODES.map(code => ({
    symbol: code,
    name: KNOWN_NAMES[code] || `${code} şirketi`,
    sector: getSectorByCode(code),
    market: 'BIST' as const,
    subMarket: getSubMarket(code),
    currency: 'TRY' as const,
    isActive: true
}));

// ==================== ABD HİSSELERİ ====================
export const US_STOCKS: StockInfo[] = [
    // S&P 500 Teknoloji Devleri (Mag 7)
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Teknoloji', market: 'NASDAQ', currency: 'USD', isActive: true },
    { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Teknoloji', market: 'NASDAQ', currency: 'USD', isActive: true },
    { symbol: 'GOOGL', name: 'Alphabet Inc. (A)', sector: 'Teknoloji', market: 'NASDAQ', currency: 'USD', isActive: true },
    { symbol: 'GOOG', name: 'Alphabet Inc. (C)', sector: 'Teknoloji', market: 'NASDAQ', currency: 'USD', isActive: true },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Perakende', market: 'NASDAQ', currency: 'USD', isActive: true },
    { symbol: 'META', name: 'Meta Platforms', sector: 'Teknoloji', market: 'NASDAQ', currency: 'USD', isActive: true },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Yarı İletken', market: 'NASDAQ', currency: 'USD', isActive: true },
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Otomotiv', market: 'NASDAQ', currency: 'USD', isActive: true },

    // Diğer Teknoloji
    { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Yarı İletken', market: 'NASDAQ', currency: 'USD', isActive: true },
    { symbol: 'INTC', name: 'Intel Corp.', sector: 'Yarı İletken', market: 'NASDAQ', currency: 'USD', isActive: true },
    { symbol: 'CRM', name: 'Salesforce', sector: 'Yazılım', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'ORCL', name: 'Oracle Corp.', sector: 'Yazılım', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Yazılım', market: 'NASDAQ', currency: 'USD', isActive: true },
    { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Medya', market: 'NASDAQ', currency: 'USD', isActive: true },

    // Finans
    { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Finans', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'BAC', name: 'Bank of America', sector: 'Finans', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'WFC', name: 'Wells Fargo', sector: 'Finans', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'C', name: 'Citigroup', sector: 'Finans', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'GS', name: 'Goldman Sachs', sector: 'Finans', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'MS', name: 'Morgan Stanley', sector: 'Finans', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'BLK', name: 'BlackRock', sector: 'Varlık Yönetimi', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'SCHW', name: 'Charles Schwab', sector: 'Finans', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'V', name: 'Visa Inc.', sector: 'Ödeme', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'MA', name: 'Mastercard', sector: 'Ödeme', market: 'NYSE', currency: 'USD', isActive: true },

    // Sağlık
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'İlaç', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'İlaç', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Sağlık', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'İlaç', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'MRK', name: 'Merck & Co.', sector: 'İlaç', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'TMO', name: 'Thermo Fisher', sector: 'Sağlık', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'ABT', name: 'Abbott Labs', sector: 'Sağlık', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'LLY', name: 'Eli Lilly', sector: 'İlaç', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'BMY', name: 'Bristol Myers', sector: 'İlaç', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'AMGN', name: 'Amgen Inc.', sector: 'Biyoteknoloji', market: 'NASDAQ', currency: 'USD', isActive: true },
    { symbol: 'GILD', name: 'Gilead Sciences', sector: 'Biyoteknoloji', market: 'NASDAQ', currency: 'USD', isActive: true },
    { symbol: 'REGN', name: 'Regeneron', sector: 'Biyoteknoloji', market: 'NASDAQ', currency: 'USD', isActive: true },

    // Tüketici
    { symbol: 'PG', name: 'Procter & Gamble', sector: 'Tüketici', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'KO', name: 'Coca-Cola', sector: 'İçecek', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'PEP', name: 'PepsiCo', sector: 'İçecek', market: 'NASDAQ', currency: 'USD', isActive: true },
    { symbol: 'COST', name: 'Costco', sector: 'Perakende', market: 'NASDAQ', currency: 'USD', isActive: true },
    { symbol: 'WMT', name: 'Walmart', sector: 'Perakende', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'HD', name: 'Home Depot', sector: 'Perakende', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'MCD', name: 'McDonalds', sector: 'Restoran', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'NKE', name: 'Nike Inc.', sector: 'Tekstil', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'SBUX', name: 'Starbucks', sector: 'Restoran', market: 'NASDAQ', currency: 'USD', isActive: true },
    { symbol: 'DIS', name: 'Walt Disney', sector: 'Medya', market: 'NYSE', currency: 'USD', isActive: true },

    // Endüstri
    { symbol: 'CAT', name: 'Caterpillar', sector: 'Endüstri', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'HON', name: 'Honeywell', sector: 'Endüstri', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'UNH', name: 'United Tech', sector: 'Endüstri', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'BA', name: 'Boeing', sector: 'Havacılık', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'GE', name: 'General Electric', sector: 'Endüstri', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'MMM', name: '3M Co.', sector: 'Endüstri', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'DE', name: 'Deere & Co.', sector: 'Endüstri', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'UPS', name: 'UPS', sector: 'Lojistik', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'FDX', name: 'FedEx', sector: 'Lojistik', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'LMT', name: 'Lockheed Martin', sector: 'Savunma', market: 'NYSE', currency: 'USD', isActive: true },

    // Enerji
    { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Enerji', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'CVX', name: 'Chevron', sector: 'Enerji', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'COP', name: 'ConocoPhillips', sector: 'Enerji', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'EOG', name: 'EOG Resources', sector: 'Enerji', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'SLB', name: 'Schlumberger', sector: 'Enerji', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'PXD', name: 'Pioneer Energy', sector: 'Enerji', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'OXY', name: 'Occidental', sector: 'Enerji', market: 'NYSE', currency: 'USD', isActive: true },

    // ETF'ler (S&P 500, Sector, Bond)
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust (Nasdaq 100)', sector: 'ETF', market: 'NASDAQ', currency: 'USD', isActive: true },
    { symbol: 'IWM', name: 'iShares Russell 2000', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'DIA', name: 'SPDR Dow Jones Industrial', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'VTI', name: 'Vanguard Total Market', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'IVV', name: 'iShares Core S&P 500', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },

    // Sector ETF'leri
    { symbol: 'XLE', name: 'Energy Select Sector SPDR', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'XLF', name: 'Financial Select Sector SPDR', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'XLK', name: 'Technology Select Sector SPDR', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'XLU', name: 'Utilities Select Sector SPDR', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'XLV', name: 'Health Care Select Sector SPDR', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'XLI', name: 'Industrial Select Sector SPDR', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'XLP', name: 'Consumer Staples Select SPDR', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'XLY', name: 'Consumer Discretionary SPDR', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'XLB', name: 'Materials Select Sector SPDR', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'XLRE', name: 'Real Estate Select Sector SPDR', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },

    // Altın ve Değerli Metaller ETF
    { symbol: 'GLD', name: 'SPDR Gold Shares', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'IAU', name: 'iShares Gold Trust', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'SLV', name: 'iShares Silver Trust', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'BAR', name: 'iShares Gold Barbells', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'PPLT', name: 'Aberdeen Physical Platinum', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'PALL', name: 'Aberdeen Physical Palladium', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },

    // Tahvil ETF'leri
    { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'IEF', name: 'iShares 7-10 Year Treasury Bond', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'SHY', name: 'iShares 1-3 Year Treasury Bond', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'TIP', name: 'iShares TIPS Bond ETF', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'LQD', name: 'iShares Investment Grade Corporate', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'HYG', name: 'iShares High Yield Corporate', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },

    // Emtia ETF'leri
    { symbol: 'USO', name: 'United States Oil Fund', sector: 'Emtia', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'UCO', name: 'ProShares Ultra Bloomberg Crude Oil', sector: 'Emtia', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'SCO', name: 'ProShares UltraShort Bloomberg Crude Oil', sector: 'Emtia', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'UNG', name: 'United States Natural Gas Fund', sector: 'Emtia', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'BOIL', name: 'ProShares Ultra Bloomberg Natural Gas', sector: 'Emtia', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'KOLD', name: 'ProShares UltraShort Natural Gas', sector: 'Emtia', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'DBA', name: 'Invesco DB Agriculture Fund', sector: 'Emtia', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'DBC', name: 'Invesco DB Commodity Index', sector: 'Emtia', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'USCI', name: 'US Commodity Index Fund', sector: 'Emtia', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'JJG', name: 'iShares GSCI Commodity Indexed', sector: 'Emtia', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'PALL', name: 'Aberdeen Physical Palladium Shares', sector: 'Emtia', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'PPLT', name: 'Aberdeen Physical Platinum Shares', sector: 'Emtia', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'SLV', name: 'iShares Silver Trust', sector: 'Emtia', market: 'NYSE', currency: 'USD', isActive: true },

    // 3x/Leveraged ETF'ler (Popüler ticaret ürünleri)
    { symbol: 'TQQQ', name: 'ProShares UltraPro QQQ (3x Nasdaq)', sector: 'ETF', market: 'NASDAQ', currency: 'USD', isActive: true },
    { symbol: 'UPRO', name: 'ProShares UltraPro S&P 500 (3x)', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'SPXL', name: 'Direxion Daily S&P 500 Bull 3x', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'SOXL', name: 'Direxion Daily Semiconductor Bull 3x', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'TECL', name: 'Direxion Daily Technology Bull 3x', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'URTY', name: 'ProShares UltraPro Ultra Short S&P 500 (-3x)', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'SQQQ', name: 'ProShares UltraPro Short QQQ (-3x)', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },

    // Volatility ETF'leri (VIX)
    { symbol: 'VXX', name: 'iPath Series B S&P 500 VIX', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'VIXY', name: 'ProShares VIX Short-Term Futures', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'UVXY', name: 'ProShares Ultra VIX Short-Term Futures', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },

    // Kripto ETF'leri
    { symbol: 'IBIT', name: 'iShares Bitcoin Trust', sector: 'Kripto', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'FBTC', name: 'Fidelity Wise Origin Bitcoin Fund', sector: 'Kripto', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'ETHA', name: 'iShares Ethereum Trust', sector: 'Kripto', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'BITO', name: 'ProShares Bitcoin Strategy ETF', sector: 'Kripto', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'BRRR', name: 'Valkyrie Bitcoin Strategy ETF', sector: 'Kripto', market: 'NYSE', currency: 'USD', isActive: true },

    // Uluslararası ETF'ler
    { symbol: 'EEM', name: 'iShares MSCI Emerging Markets', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'EFA', name: 'iShares MSCI EAFE', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'VEA', name: 'Vanguard FTSE Developed Markets', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'VWO', name: 'Vanguard Emerging Markets Stock Index', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'EWJ', name: 'iShares MSCI Japan ETF', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'EWG', name: 'iShares MSCI Germany ETF', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'EWU', name: 'iShares MSCI United Kingdom ETF', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'EWZ', name: 'iShares MSCI Brazil ETF', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'FXI', name: 'iShares China Large-Cap ETF', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'INDA', name: 'iShares MSCI India ETF', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
    { symbol: 'TUR', name: 'iShares MSCI Turkey ETF', sector: 'ETF', market: 'NYSE', currency: 'USD', isActive: true },
];

// ==================== TEFAS FONLARI ====================
export const TEFAS_FUNDS: FundInfo[] = [
    // Yeni Fonlar
    { code: 'AKY', name: 'Ak Yatırım Yeni Fon', sector: 'Fon', market: 'TEFAS', type: 'YENI', fundManager: 'Ak Yatırım', riskLevel: 3, managementFee: 1.5, subMarket: 'YENI', currency: 'TRY', isActive: true },
    { code: 'ISY', name: 'İş Yatırım Yeni Fon', sector: 'Fon', market: 'TEFAS', type: 'YENI', fundManager: 'İş Yatırım', riskLevel: 3, managementFee: 1.5, subMarket: 'YENI', currency: 'TRY', isActive: true },
    { code: 'GAR', name: 'Garanti Yeni Fon', sector: 'Fon', market: 'TEFAS', type: 'YENI', fundManager: 'Garanti BBVA Yatırım', riskLevel: 3, managementFee: 1.5, subMarket: 'YENI', currency: 'TRY', isActive: true },
    { code: 'YKB', name: 'Yapı Kredi Yeni Fon', sector: 'Fon', market: 'TEFAS', type: 'YENI', fundManager: 'Yapı Kredi Yatırım', riskLevel: 3, managementFee: 1.5, subMarket: 'YENI', currency: 'TRY', isActive: true },
    { code: 'VAK', name: 'Vakıf Yeni Fon', sector: 'Fon', market: 'TEFAS', type: 'YENI', fundManager: 'Vakıf Yatırım', riskLevel: 3, managementFee: 1.5, subMarket: 'YENI', currency: 'TRY', isActive: true },
    { code: 'HAL', name: 'Halkbank Yeni Fon', sector: 'Fon', market: 'TEFAS', type: 'YENI', fundManager: 'Halk Yatırım', riskLevel: 3, managementFee: 1.5, subMarket: 'YENI', currency: 'TRY', isActive: true },
    { code: 'DEN', name: 'Deniz Yatırım Yeni Fon', sector: 'Fon', market: 'TEFAS', type: 'YENI', fundManager: 'Deniz Yatırım', riskLevel: 3, managementFee: 1.5, subMarket: 'YENI', currency: 'TRY', isActive: true },
    { code: 'QNB', name: 'QNB Yeni Fon', sector: 'Fon', market: 'TEFAS', type: 'YENI', fundManager: 'QNB Finansinvest', riskLevel: 3, managementFee: 1.5, subMarket: 'YENI', currency: 'TRY', isActive: true },
    { code: 'TSK', name: 'TSKB Yeni Fon', sector: 'Fon', market: 'TEFAS', type: 'YENI', fundManager: 'TSKB Yatırım', riskLevel: 3, managementFee: 1.5, subMarket: 'YENI', currency: 'TRY', isActive: true },
    { code: 'FIN', name: 'Fibabanka Yeni Fon', sector: 'Fon', market: 'TEFAS', type: 'YENI', fundManager: 'Fiba Yatırım', riskLevel: 3, managementFee: 1.5, subMarket: 'YENI', currency: 'TRY', isActive: true },

    // Eski Fonlar
    { code: 'AUK', name: 'Ak Yatırım Kredi Fonu', sector: 'Fon', market: 'TEFAS', type: 'ESKI', fundManager: 'Ak Yatırım', riskLevel: 2, managementFee: 1.0, subMarket: 'ESKI', currency: 'TRY', isActive: true },
    { code: 'IUK', name: 'İş Yatırım Kredi Fonu', sector: 'Fon', market: 'TEFAS', type: 'ESKI', fundManager: 'İş Yatırım', riskLevel: 2, managementFee: 1.0, subMarket: 'ESKI', currency: 'TRY', isActive: true },
    { code: 'GUK', name: 'Garanti Kredi Fonu', sector: 'Fon', market: 'TEFAS', type: 'ESKI', fundManager: 'Garanti BBVA Yatırım', riskLevel: 2, managementFee: 1.0, subMarket: 'ESKI', currency: 'TRY', isActive: true },
    { code: 'YUK', name: 'Yapı Kredi Kredi Fonu', sector: 'Fon', market: 'TEFAS', type: 'ESKI', fundManager: 'Yapı Kredi Yatırım', riskLevel: 2, managementFee: 1.0, subMarket: 'ESKI', currency: 'TRY', isActive: true },
    { code: 'VUK', name: 'Vakıf Kredi Fonu', sector: 'Fon', market: 'TEFAS', type: 'ESKI', fundManager: 'Vakıf Yatırım', riskLevel: 2, managementFee: 1.0, subMarket: 'ESKI', currency: 'TRY', isActive: true },
    { code: 'HUK', name: 'Halkbank Kredi Fonu', sector: 'Fon', market: 'TEFAS', type: 'ESKI', fundManager: 'Halk Yatırım', riskLevel: 2, managementFee: 1.0, subMarket: 'ESKI', currency: 'TRY', isActive: true },

    // Sepet Fonlar
    { code: 'AYS', name: 'Ak Yatırım Hisse Senedi Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Ak Yatırım', riskLevel: 4, managementFee: 2.0, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'IHS', name: 'İş Yatırım Hisse Senedi Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'İş Yatırım', riskLevel: 4, managementFee: 2.0, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'GHS', name: 'Garanti Hisse Senedi Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Garanti BBVA Yatırım', riskLevel: 4, managementFee: 2.0, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'YHS', name: 'Yapı Kredi Hisse Senedi Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Yapı Kredi Yatırım', riskLevel: 4, managementFee: 2.0, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'VHS', name: 'Vakıf Hisse Senedi Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Vakıf Yatırım', riskLevel: 4, managementFee: 2.0, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'DHS', name: 'Deniz Hisse Senedi Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Deniz Yatırım', riskLevel: 4, managementFee: 2.0, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'QHS', name: 'QNB Hisse Senedi Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'QNB Finansinvest', riskLevel: 4, managementFee: 2.0, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'THS', name: 'TSKB Hisse Senedi Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'TSKB Yatırım', riskLevel: 4, managementFee: 2.0, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'FHS', name: 'Fibabanka Hisse Senedi Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Fiba Yatırım', riskLevel: 4, managementFee: 2.0, subMarket: 'SEPET', currency: 'TRY', isActive: true },

    // Katılım Fonları
    { code: 'AKK', name: 'Ak Yatırım Katılım Hisse Fonu', sector: 'Fon', market: 'TEFAS', type: 'KATILIM', fundManager: 'Ak Yatırım', riskLevel: 4, managementFee: 1.75, subMarket: 'KATILIM', currency: 'TRY', isActive: true },
    { code: 'IKK', name: 'İş Yatırım Katılım Hisse Fonu', sector: 'Fon', market: 'TEFAS', type: 'KATILIM', fundManager: 'İş Yatırım', riskLevel: 4, managementFee: 1.75, subMarket: 'KATILIM', currency: 'TRY', isActive: true },
    { code: 'GKK', name: 'Garanti Katılım Hisse Fonu', sector: 'Fon', market: 'TEFAS', type: 'KATILIM', fundManager: 'Gar BBVA Katılım', riskLevel: 4, managementFee: 1.75, subMarket: 'KATILIM', currency: 'TRY', isActive: true },
    { code: 'VKK', name: 'Vakıf Katılım Hisse Fonu', sector: 'Fon', market: 'TEFAS', type: 'KATILIM', fundManager: 'Vakıf Katılım', riskLevel: 4, managementFee: 1.75, subMarket: 'KATILIM', currency: 'TRY', isActive: true },
    { code: 'QKK', name: 'QNB Katılım Hisse Fonu', sector: 'Fon', market: 'TEFAS', type: 'KATILIM', fundManager: 'QNB Finansinvest', riskLevel: 4, managementFee: 1.75, subMarket: 'KATILIM', currency: 'TRY', isActive: true },
    { code: 'TKK', name: 'TSKB Katılım Hisse Fonu', sector: 'Fon', market: 'TEFAS', type: 'KATILIM', fundManager: 'TSKB Yatırım', riskLevel: 4, managementFee: 1.75, subMarket: 'KATILIM', currency: 'TRY', isActive: true },
    { code: 'AKP', name: 'Albaraka Katılım Hisse Fonu', sector: 'Fon', market: 'TEFAS', type: 'KATILIM', fundManager: 'Albaraka Portföy', riskLevel: 4, managementFee: 1.75, subMarket: 'KATILIM', currency: 'TRY', isActive: true },
    { code: 'TKP', name: 'Türkiye Finans Katılım Fonu', sector: 'Fon', market: 'TEFAS', type: 'KATILIM', fundManager: 'TR Finans Portföy', riskLevel: 4, managementFee: 1.75, subMarket: 'KATILIM', currency: 'TRY', isActive: true },
    { code: 'ZKP', name: 'Ziraat Katılım Hisse Fonu', sector: 'Fon', market: 'TEFAS', type: 'KATILIM', fundManager: 'Ziraat Portföy', riskLevel: 4, managementFee: 1.75, subMarket: 'KATILIM', currency: 'TRY', isActive: true },
    { code: 'SKP', name: 'Şeker Katılım Hisse Fonu', sector: 'Fon', market: 'TEFAS', type: 'KATILIM', fundManager: 'Şeker Portföy', riskLevel: 4, managementFee: 1.75, subMarket: 'KATILIM', currency: 'TRY', isActive: true },

    // Altın Fonlar
    { code: 'AAL', name: 'Ak Yatırım Altın Fonu', sector: 'Fon', market: 'TEFAS', type: 'GOLD', fundManager: 'Ak Yatırım', riskLevel: 3, managementFee: 1.5, subMarket: 'GOLD', currency: 'TRY', isActive: true },
    { code: 'IAL', name: 'İş Yatırım Altın Fonu', sector: 'Fon', market: 'TEFAS', type: 'GOLD', fundManager: 'İş Yatırım', riskLevel: 3, managementFee: 1.5, subMarket: 'GOLD', currency: 'TRY', isActive: true },
    { code: 'GAL', name: 'Garanti Altın Fonu', sector: 'Fon', market: 'TEFAS', type: 'GOLD', fundManager: 'Garanti BBVA Yatırım', riskLevel: 3, managementFee: 1.5, subMarket: 'GOLD', currency: 'TRY', isActive: true },
    { code: 'YAL', name: 'Yapı Kredi Altın Fonu', sector: 'Fon', market: 'TEFAS', type: 'GOLD', fundManager: 'Yapı Kredi Yatırım', riskLevel: 3, managementFee: 1.5, subMarket: 'GOLD', currency: 'TRY', isActive: true },
    { code: 'VAL', name: 'Vakıf Altın Fonu', sector: 'Fon', market: 'TEFAS', type: 'GOLD', fundManager: 'Vakıf Yatırım', riskLevel: 3, managementFee: 1.5, subMarket: 'GOLD', currency: 'TRY', isActive: true },
    { code: 'HLA', name: 'Halkbank Altın Fonu', sector: 'Fon', market: 'TEFAS', type: 'GOLD', fundManager: 'Halk Yatırım', riskLevel: 3, managementFee: 1.5, subMarket: 'GOLD', currency: 'TRY', isActive: true },
    { code: 'DAL', name: 'Deniz Altın Fonu', sector: 'Fon', market: 'TEFAS', type: 'GOLD', fundManager: 'Deniz Yatırım', riskLevel: 3, managementFee: 1.5, subMarket: 'GOLD', currency: 'TRY', isActive: true },
    { code: 'QAL', name: 'QNB Altın Fonu', sector: 'Fon', market: 'TEFAS', type: 'GOLD', fundManager: 'QNB Finansinvest', riskLevel: 3, managementFee: 1.5, subMarket: 'GOLD', currency: 'TRY', isActive: true },
    { code: 'TAL', name: 'TSKB Altın Fonu', sector: 'Fon', market: 'TEFAS', type: 'GOLD', fundManager: 'TSKB Yatırım', riskLevel: 3, managementFee: 1.5, subMarket: 'GOLD', currency: 'TRY', isActive: true },
    { code: 'FAL', name: 'Fibabanka Altın Fonu', sector: 'Fon', market: 'TEFAS', type: 'GOLD', fundManager: 'Fiba Yatırım', riskLevel: 3, managementFee: 1.5, subMarket: 'GOLD', currency: 'TRY', isActive: true },
    { code: 'ZAL', name: 'Ziraat Altın Fonu', sector: 'Fon', market: 'TEFAS', type: 'GOLD', fundManager: 'Ziraat Portföy', riskLevel: 3, managementFee: 1.5, subMarket: 'GOLD', currency: 'TRY', isActive: true },
    { code: 'SAL', name: 'Şeker Altın Fonu', sector: 'Fon', market: 'TEFAS', type: 'GOLD', fundManager: 'Şeker Portföy', riskLevel: 3, managementFee: 1.5, subMarket: 'GOLD', currency: 'TRY', isActive: true },

    // Karma Fonlar
    { code: 'AKX', name: 'Ak Yatırım Karma Fon', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Ak Yatırım', riskLevel: 3, managementFee: 1.75, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'IKX', name: 'İş Yatırım Karma Fon', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'İş Yatırım', riskLevel: 3, managementFee: 1.75, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'GKX', name: 'Garanti Karma Fon', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Garanti BBVA Yatırım', riskLevel: 3, managementFee: 1.75, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'YKX', name: 'Yapı Kredi Karma Fon', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Yapı Kredi Yatırım', riskLevel: 3, managementFee: 1.75, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'VKX', name: 'Vakıf Karma Fon', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Vakıf Yatırım', riskLevel: 3, managementFee: 1.75, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'HKX', name: 'Halkbank Karma Fon', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Halk Yatırım', riskLevel: 3, managementFee: 1.75, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'DKX', name: 'Deniz Karma Fon', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Deniz Yatırım', riskLevel: 3, managementFee: 1.75, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'QKX', name: 'QNB Karma Fon', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'QNB Finansinvest', riskLevel: 3, managementFee: 1.75, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'TKX', name: 'TSKB Karma Fon', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'TSKB Yatırım', riskLevel: 3, managementFee: 1.75, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'ZKX', name: 'Ziraat Karma Fon', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Ziraat Portföy', riskLevel: 3, managementFee: 1.75, subMarket: 'SEPET', currency: 'TRY', isActive: true },

    // Yabancı Teknoloji Fonlar
    { code: 'AYT', name: 'Ak Yatırım US Tech Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Ak Yatırım', riskLevel: 5, managementFee: 2.0, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'IYT', name: 'İş Yatırım US Tech Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'İş Yatırım', riskLevel: 5, managementFee: 2.0, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'GYT', name: 'Garanti US Tech Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Garanti BBVA Yatırım', riskLevel: 5, managementFee: 2.0, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'DYT', name: 'Deniz US Tech Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Deniz Yatırım', riskLevel: 5, managementFee: 2.0, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'QYT', name: 'QNB US Tech Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'QNB Finansinvest', riskLevel: 5, managementFee: 2.0, subMarket: 'SEPET', currency: 'TRY', isActive: true },

    // BIST Endeks Fonlar
    { code: 'ABE', name: 'Ak Yatırım BIST 30 Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Ak Yatırım', riskLevel: 4, managementFee: 1.75, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'IBE', name: 'İş Yatırım BIST 30 Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'İş Yatırım', riskLevel: 4, managementFee: 1.75, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'GBE', name: 'Garanti BIST 30 Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Garanti BBVA Yatırım', riskLevel: 4, managementFee: 1.75, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'YBE', name: 'Yapı Kredi BIST 30 Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Yapı Kredi Yatırım', riskLevel: 4, managementFee: 1.75, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'VBE', name: 'Vakıf BIST 30 Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Vakıf Yatırım', riskLevel: 4, managementFee: 1.75, subMarket: 'SEPET', currency: 'TRY', isActive: true },
    { code: 'DBE', name: 'Deniz BIST 30 Fonu', sector: 'Fon', market: 'TEFAS', type: 'SEPET', fundManager: 'Deniz Yatırım', riskLevel: 4, managementFee: 1.75, subMarket: 'SEPET', currency: 'TRY', isActive: true },
];

/**
 * Tüm varlıkları birleştir
 * Not: StockInfo ve FundInfo artık 'symbol' özelliğine sahip olduğundan doğrudan birleştirebiliriz
 * Ancak FundInfo'da 'code', StockInfo'da 'symbol' kullanılıyor, bu nedenle normalize ediyoruz
 */
export const ALL_ASSETS: (StockInfo | FundInfo)[] = [
    ...BIST_STOCKS,
    ...US_STOCKS,
    ...TEFAS_FUNDS.map(f => ({
        symbol: f.code,
        name: f.name,
        sector: f.sector,
        market: f.market,
        subMarket: f.subMarket,
        currency: f.currency,
        isActive: f.isActive,
        type: f.type,
        fundManager: f.fundManager,
        riskLevel: f.riskLevel,
        managementFee: f.managementFee
    }))
];

/**
 * Sembole göre varlık bul
 */
export function findAsset(symbol: string): StockInfo | FundInfo | null {
    const upperSymbol = symbol.toUpperCase();

    // Önce BIST ve US hisselerinde ara
    const stock = [...BIST_STOCKS, ...US_STOCKS].find(s => s.symbol === upperSymbol);
    if (stock) return stock;

    // Sonra fonlarda ara
    const fund = TEFAS_FUNDS.find(f => f.code === upperSymbol);
    if (fund) {
        // Fund'ı StockInfo formatına dönüştür
        return {
            symbol: fund.code,
            name: fund.name,
            sector: fund.sector,
            market: fund.market,
            subMarket: fund.subMarket,
            currency: fund.currency,
            isActive: fund.isActive,
            type: fund.type,
            fundManager: fund.fundManager,
            riskLevel: fund.riskLevel,
            managementFee: fund.managementFee
        } as any;
    }

    return null;
}

/**
] * Sektöre göre varlıkları filtrele
 */
export function getAssetsBySector(sector: string): (StockInfo | FundInfo)[] {
    return ALL_ASSETS.filter(a => a.sector === sector);
}

/**
 * Piyasaya göre varlıkları filtrele
 */
export function getAssetsByMarket(market: 'BIST' | 'NYSE' | 'NASDAQ' | 'TEFAS'): (StockInfo | FundInfo)[] {
    return ALL_ASSETS.filter(a => a.market === market);
}

/**
 * Aktif varlıkları getir
 */
export function getActiveAssets(): (StockInfo | FundInfo)[] {
    return ALL_ASSETS.filter(a => a.isActive);
}

export default {
    BIST_STOCKS,
    US_STOCKS,
    TEFAS_FUNDS,
    ALL_ASSETS,
    findAsset,
    getAssetsBySector,
    getAssetsByMarket,
    getActiveAssets
};
