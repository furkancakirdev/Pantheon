
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { Config } from './src/constants/Config';

const { width } = Dimensions.get('window');

// ==================== TYPES ====================
interface ModuleVote {
  module: string;
  icon: string;
  vote: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
}

interface PantheonSignal {
  symbol: string;
  name: string;
  coreScore: number;
  pulseScore: number;
  verdict: string;
  price: number;
  modules: ModuleVote[];
  lastUpdate: string;
}

interface MarketData {
  xu100: number;
  xu100Change: number;
  xu030: number;
  usdtry: number;
  gold: number;
  vix: number;
  regime: string;
}

interface ApiMeta {
  totalStocks: number;
  analysisTime: string;
  summary: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    signals: PantheonSignal[];
    market: MarketData;
    meta: ApiMeta;
  };
}


// ==================== RADAR CHART ====================
const RadarChart = ({ data, size = 120 }: { data: number[], size?: number }) => {
  const center = size / 2;
  const radius = (size / 2) - 10;
  const angleStep = (Math.PI * 2) / data.length;

  const points = data.map((val, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (val / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg height={size} width={size}>
        {/* Grid */}
        {gridLevels.map((level, i) => (
          <Circle
            key={i}
            cx={center}
            cy={center}
            r={radius * level}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
            fill="none"
          />
        ))}
        {/* Data Polygon */}
        <Polygon
          points={points}
          fill="rgba(16, 185, 129, 0.3)"
          stroke="#10B981"
          strokeWidth="2"
        />
        {/* Labels (Simplified) */}
        <SvgText x={center} y={15} fill="white" fontSize="8" textAnchor="middle">Atlas</SvgText>
        <SvgText x={size - 20} y={center} fill="white" fontSize="8" textAnchor="middle">Orion</SvgText>
        <SvgText x={center} y={size - 5} fill="white" fontSize="8" textAnchor="middle">Phoenix</SvgText>
        <SvgText x={20} y={center} fill="white" fontSize="8" textAnchor="middle">Aether</SvgText>
      </Svg>
    </View>
  );
};

// ==================== COMPONENTS ====================

const SignalCard = ({ signal, onPress, expanded }: { signal: PantheonSignal, onPress: () => void, expanded: boolean }) => {
  const getVerdictStyle = (verdict: string) => {
    if (verdict.includes('GÜÇLÜ AL')) return ['#059669', '#10B981'];
    if (verdict.includes('AL')) return ['#0D9488', '#14B8A6'];
    if (verdict.includes('SAT')) return ['#DC2626', '#EF4444'];
    return ['#D97706', '#F59E0B'];
  };

  // Extract module scores for radar (defaulting to confidence)
  const radarData = signal.modules.map(m => m.confidence);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        style={styles.signalCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.symbolText}>{signal.symbol}</Text>
            <Text style={styles.priceText}>${signal.price?.toFixed(2)}</Text>
          </View>
          <LinearGradient colors={getVerdictStyle(signal.verdict)} style={styles.badge}>
            <Text style={styles.badgeText}>{signal.verdict}</Text>
          </LinearGradient>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>CORE SCORE</Text>
            <Text style={[styles.scoreValue, { color: getVerdictStyle(signal.verdict)[1] }]}>
              {Math.floor(signal.coreScore)}
            </Text>
          </View>

          <RadarChart data={radarData.length ? radarData : [50, 50, 50, 50]} size={100} />

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>PULSE</Text>
            <Text style={styles.scoreValue}>{Math.floor(signal.pulseScore)}</Text>
          </View>
        </View>

        {expanded && (
          <View style={styles.modulesList}>
            <View style={styles.separator} />
            {signal.modules.map((m, i) => (
              <View key={i} style={styles.moduleRow}>
                <View style={styles.moduleLeft}>
                  <Text style={styles.moduleIcon}>{m.icon}</Text>
                  <Text style={styles.moduleName}>{m.module}</Text>
                </View>
                <View style={styles.moduleRight}>
                  <Text style={[styles.moduleVote, { color: m.vote === 'BUY' ? '#10B981' : (m.vote === 'SELL' ? '#EF4444' : '#F59E0B') }]}>
                    {m.vote}
                  </Text>
                  <Text style={styles.moduleReason}>{m.reason}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const MarketPill = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.marketPill}>
    <Text style={styles.pillLabel}>{label}</Text>
    <Text style={styles.pillValue}>{value}</Text>
  </View>
);

// ==================== MAIN APP ====================
export default function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse['data'] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      console.log(`Fetching: ${Config.API_URL}`);
      const res = await fetch(Config.API_URL);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        Alert.alert("Hata", "Veri alınamadı: " + (json.error || "Bilinmeyen hata"));
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Bağlantı Hatası", `Sunucuya erişilemiyor.\nURL: ${Config.API_URL}\nDesteklenen IP'yi Config.ts'den kontrol edin.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{ color: 'white', marginTop: 20 }}>Sistemler Başlatılıyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.appTitle}>ARGUS <Text style={{ fontWeight: '300', fontSize: 14 }}>TERMINAL</Text></Text>
          <View style={styles.statusIndicator}>
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.statusText}>ONLINE</Text>
          </View>
        </View>

        {/* MACRO STRIP */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.macroStrip}>
          <MarketPill label="XU100" value={data?.market.xu100?.toLocaleString('tr-TR') || '-'} />
          <MarketPill label="USD/TRY" value={data?.market.usdtry?.toFixed(2) || '-'} />
          <MarketPill label="ALTIN" value={data?.market.gold?.toLocaleString('tr-TR') || '-'} />
          <MarketPill label="VIX" value={data?.market.vix?.toFixed(1) || '-'} />
          <MarketPill label="REJİM" value={data?.market.regime || '-'} />
        </ScrollView>

      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
      >
        <Text style={styles.sectionTitle}>GÖZETİM LİSTESİ</Text>

        {data?.signals.map((signal) => (
          <SignalCard
            key={signal.symbol}
            signal={signal}
            expanded={expanded === signal.symbol}
            onPress={() => setExpanded(expanded === signal.symbol ? null : signal.symbol)}
          />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}><Text style={styles.navText}>RADAR</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Text style={styles.navText}>PORTFÖY</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Text style={styles.navText}>AYARLAR</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  center: { flex: 1, backgroundColor: '#0B0F19', justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 40, backgroundColor: '#111827', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  appTitle: { fontSize: 24, fontWeight: '900', color: 'white', letterSpacing: 2 },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { color: '#10B981', fontSize: 10, fontWeight: 'bold' },
  macroStrip: { flexDirection: 'row' },
  marketPill: { backgroundColor: '#1F2937', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 10, alignItems: 'center' },
  pillLabel: { color: '#9CA3AF', fontSize: 10, fontWeight: 'bold' },
  pillValue: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  content: { padding: 16 },
  sectionTitle: { color: '#6B7280', fontSize: 12, fontWeight: 'bold', marginBottom: 16, letterSpacing: 1 },

  signalCard: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#374151' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  symbolText: { color: 'white', fontSize: 20, fontWeight: 'bold', fontFamily: 'System' },
  priceText: { color: '#9CA3AF', fontSize: 14 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreContainer: { alignItems: 'center' },
  scoreLabel: { color: '#6B7280', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  scoreValue: { color: 'white', fontSize: 24, fontWeight: 'bold' },

  modulesList: { marginTop: 16 },
  separator: { height: 1, backgroundColor: '#374151', marginBottom: 12 },
  moduleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  moduleLeft: { flexDirection: 'row', alignItems: 'center' },
  moduleIcon: { marginRight: 8, fontSize: 16 },
  moduleName: { color: '#D1D5DB', fontSize: 14, fontWeight: '600' },
  moduleRight: { alignItems: 'flex-end' },
  moduleVote: { fontSize: 14, fontWeight: 'bold' },
  moduleReason: { color: '#6B7280', fontSize: 12 },

  bottomNav: { flexDirection: 'row', padding: 20, backgroundColor: '#111827', borderTopWidth: 1, borderTopColor: '#1F2937' },
  navItem: { flex: 1, alignItems: 'center' },
  navText: { color: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }
});
