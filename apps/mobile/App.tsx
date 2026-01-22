import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

// Types
interface MarketData {
  xu100: { deger: number; degisimOran: number };
  xu030: { deger: number; degisimOran: number };
  dolar: { satis: number };
  altin: { satis: number };
}

interface Stock {
  kod: string;
  ad: string;
  kapanis: number;
  fk: number;
  erdincSkor?: number;
  wonderkidSkor?: number;
}

// API Base URL - development için localhost
const API_BASE = 'http://10.0.2.2:3000/api'; // Android emulator
// const API_BASE = 'http://localhost:3000/api'; // iOS simulator

export default function App() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [topStocks, setTopStocks] = useState<Stock[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Mock data for standalone mode
  const mockMarket: MarketData = {
    xu100: { deger: 9850.45, degisimOran: 1.24 },
    xu030: { deger: 10245.80, degisimOran: 0.89 },
    dolar: { satis: 35.42 },
    altin: { satis: 2850 },
  };

  const mockStocks: Stock[] = [
    { kod: 'ASELS', ad: 'Aselsan', kapanis: 52.80, fk: 12.5, erdincSkor: 85, wonderkidSkor: 92 },
    { kod: 'THYAO', ad: 'THY', kapanis: 285.50, fk: 8.2, erdincSkor: 78, wonderkidSkor: 88 },
    { kod: 'KCHOL', ad: 'Koç Holding', kapanis: 165.20, fk: 6.5, erdincSkor: 72, wonderkidSkor: 75 },
    { kod: 'GARAN', ad: 'Garanti', kapanis: 98.70, fk: 3.8, erdincSkor: 75, wonderkidSkor: 70 },
    { kod: 'SISE', ad: 'Şişecam', kapanis: 48.90, fk: 7.2, erdincSkor: 65, wonderkidSkor: 70 },
  ];

  const fetchData = async () => {
    try {
      // API'ye bağlanmayı dene
      // Şimdilik mock data kullan
      setMarket(mockMarket);
      setTopStocks(mockStocks);
      setError(null);
    } catch (err) {
      console.log('API error, using mock data');
      setMarket(mockMarket);
      setTopStocks(mockStocks);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>📊 InvestorAgent</Text>
        <Text style={styles.subtitle}>Mobil</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
      >
        {/* Market Overview */}
        <View style={styles.marketSection}>
          <Text style={styles.sectionTitle}>📈 Piyasa Özeti</Text>
          <View style={styles.marketGrid}>
            <View style={styles.marketCard}>
              <Text style={styles.marketLabel}>BIST 100</Text>
              <Text style={styles.marketValue}>{market?.xu100.deger.toLocaleString('tr-TR')}</Text>
              <Text style={[styles.marketChange, market?.xu100.degisimOran && market.xu100.degisimOran >= 0 ? styles.positive : styles.negative]}>
                {market?.xu100.degisimOran && market.xu100.degisimOran >= 0 ? '+' : ''}{market?.xu100.degisimOran}%
              </Text>
            </View>
            <View style={styles.marketCard}>
              <Text style={styles.marketLabel}>BIST 30</Text>
              <Text style={styles.marketValue}>{market?.xu030.deger.toLocaleString('tr-TR')}</Text>
              <Text style={[styles.marketChange, market?.xu030.degisimOran && market.xu030.degisimOran >= 0 ? styles.positive : styles.negative]}>
                {market?.xu030.degisimOran && market.xu030.degisimOran >= 0 ? '+' : ''}{market?.xu030.degisimOran}%
              </Text>
            </View>
            <View style={styles.marketCard}>
              <Text style={styles.marketLabel}>USD/TRY</Text>
              <Text style={styles.marketValue}>{market?.dolar.satis}</Text>
            </View>
            <View style={styles.marketCard}>
              <Text style={styles.marketLabel}>Altın</Text>
              <Text style={styles.marketValue}>₺{market?.altin.satis.toLocaleString('tr-TR')}</Text>
            </View>
          </View>
        </View>

        {/* Top Stocks */}
        <View style={styles.stocksSection}>
          <Text style={styles.sectionTitle}>🏆 En Yüksek Skorlu Hisseler</Text>
          {topStocks.map((stock) => (
            <View key={stock.kod} style={styles.stockCard}>
              <View style={styles.stockInfo}>
                <Text style={styles.stockCode}>{stock.kod}</Text>
                <Text style={styles.stockName}>{stock.ad}</Text>
              </View>
              <View style={styles.stockScores}>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreLabel}>Erdinç</Text>
                  <Text style={styles.scoreValue}>{stock.erdincSkor}</Text>
                </View>
                <View style={[styles.scoreBadge, styles.wonderkidBadge]}>
                  <Text style={styles.scoreLabel}>⭐</Text>
                  <Text style={styles.scoreValue}>{stock.wonderkidSkor}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Grand Council Quick View */}
        <View style={styles.councilSection}>
          <Text style={styles.sectionTitle}>🏛️ Grand Council</Text>
          <View style={styles.councilCard}>
            <View style={styles.councilHeader}>
              <Text style={styles.councilStock}>ASELS</Text>
              <View style={styles.councilDecision}>
                <Text style={styles.councilDecisionText}>🟢 AL</Text>
              </View>
            </View>
            <Text style={styles.councilConsensus}>Konsensus: %82</Text>
            <Text style={styles.councilVotes}>4 AL | 0 SAT | 1 BEKLE</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            InvestorAgent v0.7.0 - Mobil
          </Text>
          <Text style={styles.footerDisclaimer}>
            ⚠️ Yatırım tavsiyesi değildir
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 12,
  },
  // Market Section
  marketSection: {
    marginBottom: 24,
  },
  marketGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  marketCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  marketLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
  },
  marketValue: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: 'bold',
  },
  marketChange: {
    fontSize: 14,
    marginTop: 4,
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#EF4444',
  },
  // Stocks Section
  stocksSection: {
    marginBottom: 24,
  },
  stockCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  stockInfo: {
    flex: 1,
  },
  stockCode: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stockName: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  stockScores: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  wonderkidBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  scoreLabel: {
    color: '#94A3B8',
    fontSize: 10,
  },
  scoreValue: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Council Section
  councilSection: {
    marginBottom: 24,
  },
  councilCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  councilHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  councilStock: {
    color: '#F1F5F9',
    fontSize: 20,
    fontWeight: 'bold',
  },
  councilDecision: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  councilDecisionText: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 16,
  },
  councilConsensus: {
    color: '#94A3B8',
    fontSize: 14,
  },
  councilVotes: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    color: '#64748B',
    fontSize: 12,
  },
  footerDisclaimer: {
    color: '#EF4444',
    fontSize: 10,
    marginTop: 4,
  },
});
