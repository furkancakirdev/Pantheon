/**
 * PANTHEON COUNCIL SCREEN
 * Radar chart showing module comparison for selected stock
 * Based on Argus Terminal CockpitView
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Theme } from '../constants/Theme';
import { GlassCard } from '../components/cards/GlassCard';
import { AnalysisCard, VerticalScoreCard, MODULE_INFO, getScoreColor } from '../components/cards/AnalysisCard';
import { CouncilCardMini } from '../components/cards/CouncilCard';
import { AetherHUDCard } from '../components/cards/AetherHUDCard';
import { useSignals, useAether } from '../hooks/useApi';
import { useRefresh } from '../hooks/useRefresh';
import { StockSignal } from '../types/api';

// ============ SCREEN DIMENSIONS ============
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RADAR_SIZE = Math.min(SCREEN_WIDTH - Theme.spacing.large * 2, 320);

// ============ STOCK SELECTOR ============
interface StockSelectorProps {
  stocks: StockSignal[];
  selectedStock?: StockSignal;
  onSelect: (stock: StockSignal) => void;
}

const StockSelector: React.FC<StockSelectorProps> = ({
  stocks,
  selectedStock,
  onSelect,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <TouchableOpacity
        style={styles.selectorCollapsed}
        onPress={() => setExpanded(true)}
      >
        <Text style={styles.selectorIcon}>📊</Text>
        <View style={styles.selectorInfo}>
          <Text style={styles.selectorLabel}>
            {selectedStock ? selectedStock.hisse : 'Hisse Seç'}
          </Text>
          {selectedStock?.councilKarar && (
            <CouncilCardMini
              verdict={selectedStock.councilKarar.sonKarar}
              consensus={selectedStock.councilKarar.konsensus}
            />
          )}
        </View>
        <Text style={styles.selectorArrow}>▼</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.selectorExpanded}>
      <View style={styles.selectorHeader}>
        <Text style={styles.selectorTitle}>Hisse Seç</Text>
        <TouchableOpacity onPress={() => setExpanded(false)}>
          <Text style={styles.selectorClose}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.stockList}>
        {stocks.map((stock) => (
          <TouchableOpacity
            key={stock.hisse}
            style={[
              styles.stockItem,
              selectedStock?.hisse === stock.hisse && styles.stockItemSelected,
            ]}
            onPress={() => {
              onSelect(stock);
              setExpanded(false);
            }}
          >
            <Text style={styles.stockSymbol}>{stock.hisse}</Text>
            {stock.fiyat && (
              <Text style={styles.stockPrice}>{stock.fiyat.toFixed(2)}</Text>
            )}
            {stock.councilKarar && (
              <Text
                style={[
                  styles.stockVerdict,
                  {
                    color: getScoreColor(
                      stock.councilKarar.konsensus
                    ),
                  },
                ]}
              >
                {stock.councilKarar.sonKarar}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// ============ RADAR CHART (Simple SVG-based) ============
interface RadarChartProps {
  scores: Record<string, number>;
}

const RadarChart: React.FC<RadarChartProps> = ({ scores }) => {
  const modules = Object.keys(MODULE_INFO);
  const centerX = RADAR_SIZE / 2;
  const centerY = RADAR_SIZE / 2;
  const radius = (RADAR_SIZE / 2 - 40);

  // Generate polygon points
  const generatePoints = (valueScale: number) => {
    return modules.map((module, index) => {
      const angle = (Math.PI * 2 * index) / modules.length - Math.PI / 2;
      const value = (scores[module] || 50) / 100 * valueScale;
      const x = centerX + Math.cos(angle) * (radius * value);
      const y = centerY + Math.sin(angle) * (radius * value);
      return `${x},${y}`;
    }).join(' ');
  };

  const outerPoints = generatePoints(1);
  const dataPoints = generatePoints(0.7);

  return (
    <View style={[styles.radarContainer, { width: RADAR_SIZE, height: RADAR_SIZE }]}>
      {/* Background circles */}
      <View style={[styles.radarCircle, { width: RADAR_SIZE - 80, height: RADAR_SIZE - 80 }]} />
      <View style={[styles.radarCircle, { width: RADAR_SIZE - 120, height: RADAR_SIZE - 120 }]} />
      <View style={[styles.radarCircle, { width: RADAR_SIZE - 160, height: RADAR_SIZE - 160 }]} />

      {/* Module Labels */}
      {modules.map((module, index) => {
        const angle = (Math.PI * 2 * index) / modules.length - Math.PI / 2;
        const labelRadius = radius + 25;
        const x = centerX + Math.cos(angle) * labelRadius;
        const y = centerY + Math.sin(angle) * labelRadius;

        return (
          <View
            key={module}
            style={[
              styles.moduleLabel,
              {
                left: x - 20,
                top: y - 10,
              },
            ]}
          >
            <Text style={styles.moduleLabelText}>{MODULE_INFO[module].icon}</Text>
          </View>
        );
      })}

      {/* Data Polygon (simplified visual representation) */}
      <View style={styles.dataPolygon}>
        {modules.map((module, index) => {
          const score = scores[module] || 50;
          const angle = (Math.PI * 2 * index) / modules.length - Math.PI / 2;
          const distance = (score / 100) * radius * 0.7;
          const x = centerX + Math.cos(angle) * distance - 6;
          const y = centerY + Math.sin(angle) * distance - 6;

          return (
            <View
              key={module}
              style={[
                styles.dataPoint,
                {
                  left: x,
                  top: y,
                  backgroundColor: getScoreColor(score) + 'CC',
                },
              ]}
            />
          );
        })}

        {/* Connecting lines */}
        <View style={styles.dataLines}>
          {modules.map((module, index) => {
            const score = scores[module] || 50;
            const angle = (Math.PI * 2 * index) / modules.length - Math.PI / 2;
            const distance = (score / 100) * radius * 0.7;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;

            const nextIndex = (index + 1) % modules.length;
            const nextModule = modules[nextIndex];
            const nextScore = scores[nextModule] || 50;
            const nextAngle = (Math.PI * 2 * nextIndex) / modules.length - Math.PI / 2;
            const nextDistance = (nextScore / 100) * radius * 0.7;
            const nextX = centerX + Math.cos(nextAngle) * nextDistance;
            const nextY = centerY + Math.sin(nextAngle) * nextDistance;

            // Calculate line length and angle
            const lineLength = Math.sqrt(
              Math.pow(nextX - x, 2) + Math.pow(nextY - y, 2)
            );
            const lineAngle = Math.atan2(nextY - y, nextX - x) * 180 / Math.PI;

            return (
              <View
                key={`${module}-${nextModule}`}
                style={[
                  styles.dataLine,
                  {
                    left: x,
                    top: y,
                    width: lineLength,
                    transform: [{ rotate: `${lineAngle}deg` }],
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Center Point */}
      <View style={[styles.centerPoint, { left: centerX - 4, top: centerY - 4 }]} />

      {/* Average Score */}
      <View style={styles.averageScore}>
        <Text style={styles.averageScoreLabel}>
          {Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length || 0}
        </Text>
      </View>
    </View>
  );
};

// ============ MODULE COMPARISON LIST ============
interface ModuleComparisonProps {
  selectedStock: StockSignal;
}

const ModuleComparison: React.FC<ModuleComparisonProps> = ({ selectedStock }) => {
  const votes = selectedStock.councilKarar?.oylar || [];

  if (votes.length === 0) {
    return (
      <View style={styles.comparisonEmpty}>
        <Text style={styles.comparisonEmptyText}>
          Bu hisse için modül oyları mevcut değil.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.comparisonContainer}>
      <Text style={styles.comparisonTitle}>Modül Karşılaştırması</Text>

      <View style={styles.comparisonList}>
        {votes.map((vote, index) => {
          const score = vote.guven;
          const verdict = vote.oy;

          return (
            <View key={index} style={styles.comparisonItem}>
              <View style={styles.comparisonLeft}>
                <Text style={styles.comparisonIcon}>
                  {MODULE_INFO[vote.modul]?.icon || '📊'}
                </Text>
                <View>
                  <Text style={styles.comparisonModule}>{vote.modul}</Text>
                  <Text style={styles.comparisonVerdict}>{verdict}</Text>
                </View>
              </View>

              <View style={styles.comparisonRight}>
                <Text
                  style={[
                    styles.comparisonScore,
                    { color: getScoreColor(score) },
                  ]}
                >
                  {score}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ============ MAIN COUNCIL SCREEN ============
export const CouncilScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { signals, refresh: refreshSignals } = useSignals();
  const { macro, refresh: refreshAether } = useAether();

  const [selectedStock, setSelectedStock] = useState<StockSignal | undefined>(
    signals.length > 0 ? signals[0] : undefined
  );

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshSignals(), refreshAether()]);
  }, [refreshSignals, refreshAether]);

  const { refreshing, onRefresh } = useRefresh(refreshAll);

  // Build scores from selected stock
  const buildScores = (): Record<string, number> => {
    if (!selectedStock?.councilKarar?.oylar) return {};

    const scores: Record<string, number> = {};
    selectedStock.councilKarar.oylar.forEach((vote) => {
      scores[vote.modul] = vote.guven;
    });

    return scores;
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <ScrollView
          refreshControlProps={{
            refreshing,
            onRefresh,
            tintColor: Theme.colors.accent,
          }}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👁️ KONSEY</Text>
        <Text style={styles.headerSubtitle}>Modül Karşılaştırma</Text>
      </View>

      {/* Stock Selector */}
      {signals.length > 0 && (
        <View style={styles.section}>
          <StockSelector
            stocks={signals}
            selectedStock={selectedStock}
            onSelect={setSelectedStock}
          />
        </View>
      )}

      {/* Radar Chart */}
      {selectedStock && Object.keys(buildScores()).length > 0 && (
        <GlassCard style={styles.radarSection}>
          <Text style={styles.sectionTitle}>{selectedStock.hisse} - Modül Skorları</Text>
          <View style={styles.radarWrapper}>
            <RadarChart scores={buildScores()} />
          </View>
        </GlassCard>
      )}

      {/* Module Comparison */}
      {selectedStock && <ModuleComparison selectedStock={selectedStock} />}

      {/* Aether HUD */}
      <View style={styles.section}>
        <AetherHUDCard macro={macro} />
      </View>

      {/* Legend */}
      <View style={styles.section}>
        <GlassCard style={styles.legendCard}>
          <Text style={styles.legendTitle}>Modül Açıklamaları</Text>
          {Object.entries(MODULE_INFO).slice(0, 5).map(([key, info]) => (
            <View key={key} style={styles.legendItem}>
              <Text style={styles.legendIcon}>{info.icon}</Text>
              <View style={styles.legendInfo}>
                <Text style={styles.legendName}>{info.name}</Text>
                <Text style={styles.legendDesc}>{info.description}</Text>
              </View>
            </View>
          ))}
        </GlassCard>
      </View>
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
    paddingHorizontal: Theme.spacing.medium,
    paddingVertical: Theme.spacing.medium,
  },
  headerTitle: {
    ...Theme.typography.h2,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
  },
  section: {
    paddingHorizontal: Theme.spacing.medium,
    marginBottom: Theme.spacing.medium,
  },
  sectionTitle: {
    ...Theme.typography.h4,
    fontWeight: '700',
    marginBottom: Theme.spacing.medium,
    textAlign: 'center',
  },
  // Stock Selector
  selectorCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.medium,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.medium,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  selectorIcon: {
    fontSize: 24,
    marginRight: Theme.spacing.medium,
  },
  selectorInfo: {
    flex: 1,
    gap: 4,
  },
  selectorLabel: {
    ...Theme.typography.body,
    fontWeight: '600',
  },
  selectorArrow: {
    ...Theme.typography.body,
    color: Theme.colors.textTertiary,
  },
  selectorExpanded: {
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.medium,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  selectorTitle: {
    ...Theme.typography.body,
    fontWeight: '700',
  },
  selectorClose: {
    ...Theme.typography.h3,
    color: Theme.colors.textSecondary,
  },
  stockList: {
    maxHeight: 200,
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  stockItemSelected: {
    backgroundColor: `${Theme.colors.accent}10`,
  },
  stockSymbol: {
    ...Theme.typography.body,
    fontWeight: '700',
    flex: 1,
  },
  stockPrice: {
    ...Theme.typography.monoSmall,
    marginRight: Theme.spacing.medium,
  },
  stockVerdict: {
    ...Theme.typography.captionSmall,
    fontWeight: '600',
  },
  // Radar Chart
  radarSection: {
    padding: Theme.spacing.large,
  },
  radarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.medium,
  },
  radarContainer: {
    position: 'relative',
  },
  radarCircle: {
    position: 'absolute',
    left: Theme.spacing.large + 20,
    top: Theme.spacing.large + 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  moduleLabel: {
    position: 'absolute',
    width: 40,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleLabelText: {
    fontSize: 16,
  },
  dataPolygon: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  dataPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dataLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  dataLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: Theme.colors.accent,
    transformOrigin: 'left',
  },
  centerPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.accent,
  },
  averageScore: {
    position: 'absolute',
    left: RADAR_SIZE / 2 - 15,
    top: RADAR_SIZE / 2 - 12,
  },
  averageScoreLabel: {
    ...Theme.typography.h3,
    fontWeight: '700',
    color: Theme.colors.accent,
  },
  // Module Comparison
  comparisonContainer: {
    paddingHorizontal: Theme.spacing.medium,
    marginBottom: Theme.spacing.medium,
  },
  comparisonTitle: {
    ...Theme.typography.h4,
    fontWeight: '700',
    marginBottom: Theme.spacing.medium,
  },
  comparisonList: {
    gap: Theme.spacing.small,
  },
  comparisonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.medium,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.medium,
  },
  comparisonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
  },
  comparisonIcon: {
    fontSize: 24,
  },
  comparisonModule: {
    ...Theme.typography.body,
    fontWeight: '600',
  },
  comparisonVerdict: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
  },
  comparisonRight: {
    alignItems: 'flex-end',
  },
  comparisonScore: {
    ...Theme.typography.h4,
    fontWeight: '700',
  },
  comparisonEmpty: {
    padding: Theme.spacing.xLarge,
    alignItems: 'center',
  },
  comparisonEmptyText: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  // Legend
  legendCard: {
    padding: Theme.spacing.medium,
  },
  legendTitle: {
    ...Theme.typography.body,
    fontWeight: '700',
    marginBottom: Theme.spacing.medium,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
    marginBottom: Theme.spacing.small,
  },
  legendIcon: {
    fontSize: 20,
  },
  legendInfo: {
    flex: 1,
  },
  legendName: {
    ...Theme.typography.bodySmall,
    fontWeight: '600',
  },
  legendDesc: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textTertiary,
  },
});

export default CouncilScreen;
