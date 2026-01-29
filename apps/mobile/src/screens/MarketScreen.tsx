/**
 * PANTHEON MARKET SCREEN
 * Main screen showing Aether HUD, market summary, and signal list
 * Based on Argus Terminal MarketView
 */

import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Theme } from '../constants/Theme';
import { AetherHUDCard } from '../components/cards/AetherHUDCard';
import { SignalCard } from '../components/cards/SignalCard';
import { useSignals, useMarket, useAether } from '../hooks/useApi';
import { useRefresh } from '../hooks/useRefresh';
import { StockSignal } from '../types/api';

// ============ MARKET HEADER ============
interface MarketHeaderProps {
  endeks?: string;
  endeksDeger?: number;
  endeksDegisim?: string;
}

const MarketHeader: React.FC<MarketHeaderProps> = ({
  endeks = 'BIST100',
  endeksDeger = 0,
  endeksDegisim = '%0.0',
}) => {
  const isPositive = endeksDegisim?.includes('+');
  const isNegative = endeksDegisim?.includes('-');

  return (
    <View style={styles.marketHeader}>
      <View style={styles.marketHeaderLeft}>
        <Text style={styles.marketIndexLabel}>Endeks</Text>
        <Text style={styles.marketIndexName}>{endeks}</Text>
      </View>

      <View style={styles.marketHeaderRight}>
        {endeksDeger > 0 && (
          <Text style={styles.marketIndexValue}>
            {endeksDeger.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
          </Text>
        )}
        <Text
          style={[
            styles.marketIndexChange,
            isPositive && styles.changePositive,
            isNegative && styles.changeNegative,
          ]}
        >
          {endeksDegisim}
        </Text>
      </View>
    </View>
  );
};

// ============ EMPTY STATE ============
const EmptyState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>📭</Text>
    <Text style={styles.emptyTitle}>Sinyal Bulunamadı</Text>
    <Text style={styles.emptyText}>Henüz sinyal verisi mevcut değil.</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Yeniden Dene</Text>
    </TouchableOpacity>
  </View>
);

// ============ LOADING STATE ============
const LoadingState: React.FC = () => (
  <View style={styles.loadingState}>
    <View style={styles.loadingCard} />
    <View style={styles.loadingCard} />
    <View style={styles.loadingCard} />
  </View>
);

// ============ MARKET SCREEN ============
export const MarketScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  // Fetch data
  const { signals, loading: signalsLoading, error, refresh: refreshSignals } = useSignals();
  const { market, loading: marketLoading, refresh: refreshMarket } = useMarket();
  const { macro, loading: aetherLoading, refresh: refreshAether } = useAether();

  // Combined loading state
  const isLoading = signalsLoading || marketLoading || aetherLoading;

  // Pull-to-refresh
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshSignals(),
      refreshMarket(),
      refreshAether(),
    ]);
  }, [refreshSignals, refreshMarket, refreshAether]);

  const { refreshing, onRefresh } = useRefresh(refreshAll, 30);

  // Navigate to stock detail
  const handleSignalPress = useCallback((symbol: string) => {
    // Navigation will be handled by parent navigator
    console.log('Navigate to detail:', symbol);
  }, []);

  // Render signal item
  const renderSignal = useCallback(({ item }: { item: StockSignal }) => {
    return (
      <View style={styles.signalItem}>
        <SignalCard
          signal={item}
          onPress={() => handleSignalPress(item.hisse)}
        />
      </View>
    );
  }, [handleSignalPress]);

  // List header
  const listHeader = useCallback(() => (
    <View style={styles.listHeader}>
      {/* Aether HUD */}
      <View style={styles.aetherSection}>
        <AetherHUDCard macro={macro || undefined} />
      </View>

      {/* Market Header */}
      <View style={styles.marketHeaderSection}>
        <MarketHeader
          endeks={market?.endeks}
          endeksDeger={market?.endeksDeger}
          endeksDegisim={market?.endeksDegisim}
        />
      </View>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sinyaller</Text>
        <Text style={styles.sectionCount}>
          {signals.length} Hisse
        </Text>
      </View>
    </View>
  ), [macro, market, signals.length]);

  // Loading state
  if (isLoading && signals.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <View style={styles.aetherSection}>
            <AetherHUDCard macro={macro || undefined} />
          </View>
          <LoadingState />
        </View>
      </View>
    );
  }

  // Error state
  if (error && signals.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Veri Yükleme Hatası</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshAll}>
            <Text style={styles.retryButtonText}>Yeniden Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        ref={flatListRef}
        data={signals}
        keyExtractor={(item) => item.hisse}
        renderItem={renderSignal}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={() => <EmptyState onRetry={refreshAll} />}
        contentContainerStyle={[
          styles.listContent,
          signals.length === 0 && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Theme.colors.accent}
            colors={[Theme.colors.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// ============ FILTER BAR (optional) ============
interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: Record<string, number>;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  onFilterChange,
  counts,
}) => {
  const filters = [
    { id: 'all', label: 'Tümü' },
    { id: 'buy', label: 'Al' },
    { id: 'hold', label: 'Bekle' },
    { id: 'sell', label: 'Sat' },
  ];

  return (
    <View style={styles.filterBar}>
      {filters.map((filter) => {
        const count = counts[filter.id] || 0;
        const isActive = activeFilter === filter.id;

        return (
          <TouchableOpacity
            key={filter.id}
            onPress={() => onFilterChange(filter.id)}
            style={[
              styles.filterChip,
              isActive && {
                backgroundColor: `${Theme.colors.accent}20`,
                borderColor: Theme.colors.accent,
              },
            ]}
          >
            <Text
              style={[
                styles.filterLabel,
                isActive && { color: Theme.colors.accent },
              ]}
            >
              {filter.label}
            </Text>
            {count > 0 && (
              <Text
                style={[
                  styles.filterCount,
                  isActive && { color: Theme.colors.accent },
                ]}
              >
                {count}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: Theme.spacing.medium,
    gap: Theme.spacing.medium,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  listHeader: {
    gap: Theme.spacing.medium,
  },
  // Aether Section
  aetherSection: {
    paddingHorizontal: Theme.spacing.medium,
    paddingTop: Theme.spacing.medium,
  },
  // Market Header
  marketHeaderSection: {
    paddingHorizontal: Theme.spacing.medium,
  },
  marketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.medium,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.medium,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  marketHeaderLeft: {
    gap: 4,
  },
  marketIndexLabel: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textTertiary,
  },
  marketIndexName: {
    ...Theme.typography.h3,
    fontWeight: '700',
  },
  marketHeaderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  marketIndexValue: {
    ...Theme.typography.monoSmall,
  },
  marketIndexChange: {
    ...Theme.typography.bodySmall,
    fontWeight: '600',
  },
  changePositive: {
    color: Theme.colors.positive,
  },
  changeNegative: {
    color: Theme.colors.negative,
  },
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.medium,
    marginTop: Theme.spacing.small,
  },
  sectionTitle: {
    ...Theme.typography.h4,
    fontWeight: '700',
  },
  sectionCount: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
  },
  // Signal Item
  signalItem: {
    paddingHorizontal: Theme.spacing.medium,
  },
  // Loading State
  loadingState: {
    padding: Theme.spacing.medium,
    gap: Theme.spacing.medium,
  },
  loadingCard: {
    height: 120,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.large,
  },
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xLarge,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Theme.spacing.large,
  },
  emptyTitle: {
    ...Theme.typography.h3,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.small,
  },
  emptyText: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
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
    color: '#000',
  },
  // Error Container
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xLarge,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: Theme.spacing.large,
  },
  errorTitle: {
    ...Theme.typography.h3,
    fontWeight: '700',
    marginBottom: Theme.spacing.small,
  },
  errorText: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xLarge,
  },
  // Filter Bar
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.medium,
    paddingVertical: Theme.spacing.small,
    gap: Theme.spacing.small,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Theme.spacing.medium,
    paddingVertical: 8,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.pill,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  filterLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  filterCount: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textTertiary,
  },
});

export default MarketScreen;
