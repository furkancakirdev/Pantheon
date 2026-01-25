/**
 * PANTHEON BACKTEST SCREEN
 * Historical signal performance analysis
 * Based on Argus Terminal BacktestView
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Theme } from '../constants/Theme';
import { GlassCard } from '../components/cards/GlassCard';
import { useBacktest } from '../hooks/useApi';
import { BacktestResult } from '../types/api';

// ============ BACKTEST SUMMARY CARD ============
interface BacktestSummaryProps {
  result: BacktestResult;
}

const BacktestSummary: React.FC<BacktestSummaryProps> = ({ result }) => {
  const totalReturn = result.return;
  const isPositive = totalReturn >= 0;

  return (
    <GlassCard style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Backtest Sonucu</Text>
        <Text style={styles.summaryPeriod}>
          {new Date(result.startDate).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          {' - '}
          {new Date(result.endDate).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
        </Text>
      </View>

      <View style={styles.summaryMain}>
        <View style={styles.summaryValue}>
          <Text style={styles.summaryLabel}>Toplam Getiri</Text>
          <Text
            style={[
              styles.summaryReturn,
              isPositive && styles.returnPositive,
              !isPositive && styles.returnNegative,
            ]}
          >
            {isPositive ? '+' : ''}{totalReturn.toFixed(2)}%
          </Text>
        </View>

        <View style={styles.summaryValue}>
          <Text style={styles.summaryLabel}>Final Değer</Text>
          <Text style={styles.summaryFinalValue}>
            ₺{result.finalValue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          </Text>
        </View>
      </View>

      <View style={styles.summaryBar}>
        <View
          style={[
            styles.summaryBarFill,
            {
              width: `${Math.min(100, Math.max(0, 50 + totalReturn))}%`,
              backgroundColor: isPositive ? Theme.colors.positive : Theme.colors.negative,
            },
          ]}
        />
      </View>
    </GlassCard>
  );
};

// ============ STAT CARD ============
interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, color }) => (
  <View style={[styles.statCard, color && { borderColor: color }]}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, color && { color }]}>{value}</Text>
    {subtext && <Text style={styles.statSubtext}>{subtext}</Text>}
  </View>
);

// ============ TRADE STATS ROW ============
interface TradeStatsProps {
  result: BacktestResult;
}

const TradeStats: React.FC<TradeStatsProps> = ({ result }) => {
  const winRate = result.winRate || 0;
  const profitFactor = Math.abs(result.avgWin / (result.avgLoss || 1));

  return (
    <View style={styles.statsGrid}>
      <StatCard
        label="İşlem Sayısı"
        value={result.totalTrades}
        subtext={`${result.winningTrades}W / ${result.losingTrades}L`}
      />
      <StatCard
        label="Başarı Oranı"
        value={`${winRate.toFixed(0)}%`}
        color={winRate >= 50 ? Theme.colors.positive : Theme.colors.negative}
      />
      <StatCard
        label="Ortalama Kazanç"
        value={`+${result.avgWin.toFixed(1)}%`}
        color={Theme.colors.positive}
      />
      <StatCard
        label="Ortalama Kayıp"
        value={`${result.avgLoss.toFixed(1)}%`}
        color={Theme.colors.negative}
      />
      <StatCard
        label="Max Drawdown"
        value={`${result.maxDrawdown.toFixed(1)}%`}
        color={Theme.colors.negative}
      />
      {result.sharpeRatio && (
        <StatCard
          label="Sharpe Ratio"
          value={result.sharpeRatio.toFixed(2)}
          color={result.sharpeRatio >= 1 ? Theme.colors.positive : Theme.colors.warning}
        />
      )}
    </View>
  );
};

// ============ PERIOD SELECTOR ============
interface PeriodSelectorProps {
  selected: number;
  onSelect: (days: number) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ selected, onSelect }) => {
  const periods = [
    { label: '30 Gün', days: 30 },
    { label: '90 Gün', days: 90 },
    { label: '180 Gün', days: 180 },
    { label: '1 Yıl', days: 365 },
  ];

  return (
    <View style={styles.periodSelector}>
      {periods.map((period) => (
        <TouchableOpacity
          key={period.days}
          style={[
            styles.periodChip,
            selected === period.days && styles.periodChipActive,
          ]}
          onPress={() => onSelect(period.days)}
        >
          <Text
            style={[
              styles.periodLabel,
              selected === period.days && styles.periodLabelActive,
            ]}
          >
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ============ BACKTEST LIST ============
interface BacktestListProps {
  trades: Array<{
    date: string;
    signal: string;
    entryPrice: number;
    exitPrice?: number;
    return?: number;
  }>;
}

const BacktestList: React.FC<BacktestListProps> = ({ trades }) => {
  if (trades.length === 0) {
    return (
      <View style={styles.emptyList}>
        <Text style={styles.emptyListIcon}>📋</Text>
        <Text style={styles.emptyListText}>Henüz geçmiş işlem yok</Text>
      </View>
    );
  }

  return (
    <View style={styles.tradeList}>
      <Text style={styles.tradeListTitle}>İşlem Geçmişi</Text>

      {trades.map((trade, index) => {
        const isPositive = (trade.return || 0) >= 0;

        return (
          <View key={index} style={styles.tradeItem}>
            <View style={styles.tradeLeft}>
              <Text style={styles.tradeDate}>{trade.date}</Text>
              <Text style={styles.tradeSignal}>{trade.signal}</Text>
            </View>

            <View style={styles.tradeMiddle}>
              <Text style={styles.tradeEntry}>
                Giriş: ₺{trade.entryPrice.toFixed(2)}
              </Text>
              {trade.exitPrice && (
                <Text style={styles.tradeExit}>
                  Çıkış: ₺{trade.exitPrice.toFixed(2)}
                </Text>
              )}
            </View>

            <View style={styles.tradeRight}>
              {trade.return !== undefined && (
                <Text
                  style={[
                    styles.tradeReturn,
                    isPositive && styles.tradeReturnPositive,
                    !isPositive && styles.tradeReturnNegative,
                  ]}
                >
                  {isPositive ? '+' : ''}{trade.return.toFixed(1)}%
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

// ============ MAIN BACKTEST SCREEN ============
export const BacktestScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const symbol = (params.symbol as string) || 'ASELS';

  const [days, setDays] = useState(90);
  const { result, loading, refresh } = useBacktest(symbol, days);

  // Mock trades for demo
  const mockTrades = result
    ? Array.from({ length: result.totalTrades }, (_, i) => ({
        date: new Date(
          Date.now() - (result.totalTrades - i) * 24 * 60 * 60 * 1000
        ).toLocaleDateString('tr-TR'),
        signal: i % 3 === 0 ? 'AL' : i % 3 === 1 ? 'SAT' : 'BEKLE',
        entryPrice: 100 + Math.random() * 50,
        exitPrice: 100 + Math.random() * 50,
        return: (Math.random() - 0.4) * 20,
      }))
    : [];

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerMiddle}>
          <Text style={styles.headerTitle}>Backtest</Text>
          <Text style={styles.headerSymbol}>{symbol}</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={refresh}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.section}>
        <PeriodSelector selected={days} onSelect={setDays} />
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Backtest hesaplanıyor...</Text>
        </View>
      )}

      {/* Results */}
      {result && !loading && (
        <>
          {/* Summary Card */}
          <View style={styles.section}>
            <BacktestSummary result={result} />
          </View>

          {/* Trade Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>İstatistikler</Text>
            <TradeStats result={result} />
          </View>

          {/* Trade List */}
          <View style={styles.section}>
            <BacktestList trades={mockTrades} />
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimerSection}>
            <GlassCard style={styles.disclaimerCard}>
              <Text style={styles.disclaimerTitle}>⚠️ Önemli Not</Text>
              <Text style={styles.disclaimerText}>
                Backtest sonuçları geçmiş performansa dayanmaktadır. Geçmiş performans, gelecek
                sonuçları garanti etmez. Gerçek işlemlerde kayıp riski her zaman mevcuttur.
              </Text>
            </GlassCard>
          </View>
        </>
      )}

      {!result && !loading && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>Backtest verisi bulunamadı</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Yeniden Dene</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    paddingBottom: Theme.spacing.xLarge * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.medium,
    paddingVertical: Theme.spacing.small,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.medium,
  },
  backIcon: {
    ...Theme.typography.h3,
  },
  headerMiddle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Theme.typography.h4,
    fontWeight: '700',
  },
  headerSymbol: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.medium,
  },
  refreshIcon: {
    fontSize: 18,
  },
  section: {
    paddingHorizontal: Theme.spacing.medium,
    marginBottom: Theme.spacing.medium,
  },
  sectionTitle: {
    ...Theme.typography.h4,
    fontWeight: '700',
    marginBottom: Theme.spacing.small,
  },
  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    gap: Theme.spacing.small,
  },
  periodChip: {
    flex: 1,
    paddingVertical: Theme.spacing.small,
    paddingHorizontal: Theme.spacing.medium,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.small,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  periodChipActive: {
    backgroundColor: `${Theme.colors.accent}20`,
    borderColor: Theme.colors.accent,
  },
  periodLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  periodLabelActive: {
    color: Theme.colors.accent,
  },
  // Summary Card
  summaryCard: {
    padding: Theme.spacing.medium,
  },
  summaryHeader: {
    marginBottom: Theme.spacing.medium,
  },
  summaryTitle: {
    ...Theme.typography.h3,
    fontWeight: '700',
  },
  summaryPeriod: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
  },
  summaryMain: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Theme.spacing.medium,
  },
  summaryValue: {
    alignItems: 'center',
  },
  summaryLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  summaryReturn: {
    ...Theme.typography.h2,
    fontWeight: '700',
  },
  returnPositive: {
    color: Theme.colors.positive,
  },
  returnNegative: {
    color: Theme.colors.negative,
  },
  summaryFinalValue: {
    ...Theme.typography.h3,
    fontWeight: '600',
  },
  summaryBar: {
    height: 8,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.pill,
    overflow: 'hidden',
  },
  summaryBarFill: {
    height: '100%',
    borderRadius: Theme.radius.pill,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.small,
  },
  statCard: {
    width: (Theme.spacing.medium * 2 + 60) / 2 - Theme.spacing.small / 2,
    padding: Theme.spacing.small,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.small,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
  },
  statLabel: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textTertiary,
    marginBottom: 4,
  },
  statValue: {
    ...Theme.typography.h4,
    fontWeight: '700',
  },
  statSubtext: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textTertiary,
  },
  // Trade List
  tradeList: {
    gap: Theme.spacing.small,
  },
  tradeListTitle: {
    ...Theme.typography.body,
    fontWeight: '700',
    marginBottom: Theme.spacing.small,
  },
  tradeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.medium,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.small,
    gap: Theme.spacing.small,
  },
  tradeLeft: {
    flex: 1,
  },
  tradeDate: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
  },
  tradeSignal: {
    ...Theme.typography.bodySmall,
    fontWeight: '600',
  },
  tradeMiddle: {
    flex: 1.5,
  },
  tradeEntry: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textSecondary,
  },
  tradeExit: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textTertiary,
  },
  tradeRight: {
    alignItems: 'flex-end',
  },
  tradeReturn: {
    ...Theme.typography.bodySmall,
    fontWeight: '700',
  },
  tradeReturnPositive: {
    color: Theme.colors.positive,
  },
  tradeReturnNegative: {
    color: Theme.colors.negative,
  },
  emptyList: {
    padding: Theme.spacing.xLarge,
    alignItems: 'center',
  },
  emptyListIcon: {
    fontSize: 48,
    marginBottom: Theme.spacing.medium,
  },
  emptyListText: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
  },
  // Disclaimer
  disclaimerSection: {
    paddingHorizontal: Theme.spacing.medium,
  },
  disclaimerCard: {
    padding: Theme.spacing.medium,
  },
  disclaimerTitle: {
    ...Theme.typography.body,
    fontWeight: '700',
    marginBottom: Theme.spacing.small,
  },
  disclaimerText: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  // Loading
  loadingContainer: {
    padding: Theme.spacing.xLarge * 2,
    alignItems: 'center',
  },
  loadingText: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
  },
  // Empty
  emptyContainer: {
    padding: Theme.spacing.xLarge * 2,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Theme.spacing.large,
  },
  emptyText: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.large,
  },
  retryButton: {
    paddingVertical: Theme.spacing.medium,
    paddingHorizontal: Theme.spacing.xLarge,
    backgroundColor: Theme.colors.accent,
    borderRadius: Theme.radius.medium,
  },
  retryButtonText: {
    ...Theme.typography.body,
    fontWeight: '600',
  },
});

export default BacktestScreen;
