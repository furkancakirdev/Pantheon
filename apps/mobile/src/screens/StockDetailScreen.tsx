/**
 * PANTHEON STOCK DETAIL SCREEN
 * Full analysis view for a single stock
 * Based on Argus Terminal StockDetailView
 */

import React, { useCallback, useEffect } from 'react';
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
import { GlassCard, SolidCard } from '../components/cards/GlassCard';
import { CouncilCard, CouncilCardMini } from '../components/cards/CouncilCard';
import { AnalysisCard, VerticalScoreCard, MODULE_INFO } from '../components/cards/AnalysisCard';
import { ScoreBadge } from '../components/cards/AnalysisCard';
import { AetherHUDMini } from '../components/cards/AetherHUDCard';
import { KivancIndicatorsCard } from '../components/cards/KivancIndicatorsCard';
import { useCompleteAnalysis, useOrion } from '../hooks/useApi';
import { useRefresh } from '../hooks/useRefresh';
import { StockAnalysis, ModuleVote } from '../types/api';
import type { OrionAnalysis } from '../types/api';

// ============ HEADER ============
interface DetailHeaderProps {
  symbol: string;
  price?: number;
  change?: string;
  changePercent?: number;
  onBack: () => void;
}

const DetailHeader: React.FC<DetailHeaderProps> = ({
  symbol,
  price,
  change,
  changePercent = 0,
  onBack,
}) => {
  const isPositive = changePercent > 0;
  const isNegative = changePercent < 0;
  const changeColor = isPositive ? Theme.colors.positive : isNegative ? Theme.colors.negative : Theme.colors.neutral;

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      <View style={styles.headerMiddle}>
        <Text style={styles.headerSymbol}>{symbol}</Text>
        {price && (
          <View style={styles.priceContainer}>
            <Text style={styles.headerPrice}>{price.toFixed(2)} ₺</Text>
            {change && (
              <Text style={[styles.headerChange, { color: changeColor }]}>
                {change} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>⭐</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📊</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============ COUNCIL SECTION ============
interface CouncilSectionProps {
  decision: StockAnalysis['councilKarar'];
  symbol: string;
}

const CouncilSection: React.FC<CouncilSectionProps> = ({ decision, symbol }) => {
  return (
    <View style={styles.section}>
      <CouncilCard decision={decision} symbol={symbol} />
    </View>
  );
};

// ============ MODULES GRID ============
interface ModulesGridProps {
  votes: ModuleVote[];
  onModulePress?: (moduleName: string) => void;
}

const ModulesGrid: React.FC<ModulesGridProps> = ({ votes, onModulePress }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Analiz Modülleri</Text>

      <View style={styles.modulesGrid}>
        {votes.map((vote, index) => {
          const moduleInfo = MODULE_INFO[vote.modul] || {
            icon: '📊',
            color: Theme.colors.accent,
          };

          return (
            <TouchableOpacity
              key={index}
              style={styles.moduleItem}
              onPress={() => onModulePress?.(vote.modul)}
            >
              <Text style={styles.moduleIcon}>{moduleInfo.icon}</Text>
              <Text style={styles.moduleName}>{vote.modul}</Text>
              <Text style={styles.moduleVerdict}>{vote.oy}</Text>
              <View style={styles.moduleScoreBar}>
                <View
                  style={[
                    styles.moduleScoreFill,
                    {
                      width: `${vote.guven}%`,
                      backgroundColor:
                        vote.oy === 'AL' || vote.oy === 'GÜÇLÜ AL'
                          ? Theme.colors.positive
                          : vote.oy === 'SAT' || vote.oy === 'GÜÇLÜ SAT'
                          ? Theme.colors.negative
                          : Theme.colors.warning,
                    },
                  ]}
                />
              </View>
              <Text style={styles.moduleConfidence}>{vote.guven}%</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ============ DETAILED MODULES LIST ============
interface DetailedModulesProps {
  votes: ModuleVote[];
  symbol: string;
}

const DetailedModules: React.FC<DetailedModulesProps> = ({ votes, symbol }) => {
  // Calculate mock scores from votes
  const getScoreFromVerdict = (verdict: string, confidence: number): number => {
    if (verdict === 'GÜÇLÜ AL') return Math.min(100, confidence + 20);
    if (verdict === 'AL') return confidence;
    if (verdict === 'TUT' || verdict === 'BEKLE') return 50;
    if (verdict === 'SAT') return 100 - confidence;
    if (verdict === 'GÜÇLÜ SAT') return Math.max(0, 20 - confidence);
    return 50;
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Modül Detayları</Text>

      {votes.map((vote, index) => {
        const score = getScoreFromVerdict(vote.oy as string, vote.guven);

        return (
          <View key={index} style={styles.detailCard}>
            <AnalysisCard
              moduleName={vote.modul}
              score={score}
              verdict={vote.oy as string}
              details={vote.aciklama}
            />
          </View>
        );
      })}
    </View>
  );
};

// ============ SCORE SUMMARY ============
interface ScoreSummaryProps {
  erdincScore?: number;
  wonderkidScore?: number;
  consensus: number;
}

const ScoreSummary: React.FC<ScoreSummaryProps> = ({
  erdincScore,
  wonderkidScore,
  consensus,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Skor Özeti</Text>

      <View style={styles.scoreSummary}>
        {erdincScore !== undefined && (
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Erdinç</Text>
            <ScoreBadge score={erdincScore} size="large" showLabel />
          </View>
        )}

        {wonderkidScore !== undefined && (
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Wonderkid</Text>
            <ScoreBadge score={wonderkidScore} size="large" showLabel />
          </View>
        )}

        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>Konsensus</Text>
          <ScoreBadge score={consensus} size="large" showLabel />
        </View>
      </View>
    </View>
  );
};

// ============ ACTION BAR ============
interface ActionBarProps {
  symbol: string;
  verdict?: string;
}

const ActionBar: React.FC<ActionBarProps> = ({ symbol, verdict }) => {
  const isBuy = verdict === 'AL' || verdict === 'GÜÇLÜ AL';
  const isSell = verdict === 'SAT' || verdict === 'GÜÇLÜ SAT';

  return (
    <View style={styles.actionBar}>
      <TouchableOpacity
        style={[
          styles.actionButtonLarge,
          styles.sellButton,
          isSell && styles.sellButtonActive,
        ]}
      >
        <Text style={styles.actionButtonText}>SAT</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.trackButton}>
        <Text style={styles.trackButtonText}>📊 Sinyali İzle</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.actionButtonLarge,
          styles.buyButton,
          isBuy && styles.buyButtonActive,
        ]}
      >
        <Text style={styles.actionButtonText}>AL</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============ MAIN SCREEN ============
export const StockDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const symbol = (params.symbol as string) || 'ASELS';

  // Use new hooks for detailed analysis
  const { analysis, loading, error, refresh } = useCompleteAnalysis(symbol);
  const { orion } = useOrion(symbol);
  const { refreshing, onRefresh } = useRefresh(refresh);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleModulePress = useCallback((moduleName: string) => {
    console.log('Module pressed:', moduleName);
    // Could open a modal with detailed analysis
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerSymbol}>{symbol}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <DetailHeader symbol={symbol} onBack={handleBack} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Analiz verisi bulunamadı</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Yeniden Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const verdict = analysis.councilKarar?.sonKarar;
  const votes = analysis.councilKarar?.oylar || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <ScrollView
            refreshControlProps={{
              refreshing: refreshing,
              onRefresh: onRefresh,
              tintColor: Theme.colors.accent,
            }}
          />
        }
      >
        {/* Header */}
        <DetailHeader
          symbol={symbol}
          price={analysis.quote?.currentPrice}
          change={analysis.quote?.changePercent ? `${analysis.quote.changePercent > 0 ? '+' : ''}${analysis.quote.changePercent.toFixed(2)}%` : undefined}
          changePercent={analysis.quote?.changePercent || 0}
          onBack={handleBack}
        />

        {/* Council Decision */}
        <CouncilSection
          decision={analysis.councilKarar}
          symbol={symbol}
        />

        {/* Kıvanç İndikatörleri - NEW */}
        {orion && (
          <View style={styles.section}>
            <KivancIndicatorsCard
              orion={orion}
              onPress={() => console.log('Kıvanç detay')}
            />
          </View>
        )}

        {/* Score Summary */}
        <ScoreSummary
          erdincScore={analysis.erdinc?.toplamSkor}
          wonderkidScore={undefined}
          consensus={analysis.councilKarar.konsensus}
        />

        {/* Module Grid */}
        {votes.length > 0 && <ModulesGrid votes={votes} onModulePress={handleModulePress} />}

        {/* Detailed Modules */}
        {votes.length > 0 && <DetailedModules votes={votes} symbol={symbol} />}

        {/* Aether Mini (Macro Context) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Makro Rejim</Text>
          <AetherHUDMini
            score={75}
            regime="Risk İştahı Yüksek"
            onPress={() => console.log('Navigate to Aether')}
          />
        </View>

        {/* Bottom padding for action bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Action Bar */}
      <ActionBar symbol={symbol} verdict={verdict} />
    </View>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.medium,
    paddingVertical: Theme.spacing.small,
    gap: Theme.spacing.medium,
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
    color: Theme.colors.textPrimary,
  },
  headerMiddle: {
    flex: 1,
  },
  headerSymbol: {
    ...Theme.typography.h2,
    fontWeight: '700',
  },
  priceContainer: {
    marginTop: 4,
  },
  headerPrice: {
    ...Theme.typography.mono,
    fontSize: 20,
  },
  headerChange: {
    ...Theme.typography.bodySmall,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Theme.spacing.small,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.medium,
  },
  actionIcon: {
    fontSize: 18,
  },
  // Section
  section: {
    paddingHorizontal: Theme.spacing.medium,
    marginTop: Theme.spacing.medium,
  },
  sectionTitle: {
    ...Theme.typography.h4,
    fontWeight: '700',
    marginBottom: Theme.spacing.medium,
  },
  // Modules Grid
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.small,
  },
  moduleItem: {
    width: (Theme.spacing.medium * 2 + 60) / 2,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.medium,
    padding: Theme.spacing.small,
    alignItems: 'center',
    gap: 4,
  },
  moduleIcon: {
    fontSize: 24,
  },
  moduleName: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textSecondary,
  },
  moduleVerdict: {
    ...Theme.typography.body,
    fontWeight: '700',
  },
  moduleScoreBar: {
    width: '100%',
    height: 4,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.pill,
    overflow: 'hidden',
  },
  moduleScoreFill: {
    height: '100%',
  },
  moduleConfidence: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textTertiary,
  },
  // Detail Card
  detailCard: {
    marginBottom: Theme.spacing.small,
  },
  // Score Summary
  scoreSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Theme.spacing.medium,
  },
  scoreItem: {
    alignItems: 'center',
    gap: Theme.spacing.small,
  },
  scoreLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
  },
  // Action Bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: Theme.spacing.medium,
    gap: Theme.spacing.medium,
    backgroundColor: Theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  actionButtonLarge: {
    flex: 1,
    paddingVertical: Theme.spacing.medium,
    borderRadius: Theme.radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellButton: {
    backgroundColor: Theme.colors.secondaryBackground,
    borderWidth: 1,
    borderColor: Theme.colors.negative,
  },
  sellButtonActive: {
    backgroundColor: `${Theme.colors.negative}20`,
  },
  buyButton: {
    backgroundColor: Theme.colors.positive,
  },
  buyButtonActive: {
    backgroundColor: Theme.colors.positive,
  },
  actionButtonText: {
    ...Theme.typography.body,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  trackButton: {
    flex: 1.5,
    paddingVertical: Theme.spacing.medium,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  trackButtonText: {
    ...Theme.typography.body,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  // Loading & Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xLarge,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: Theme.spacing.large,
  },
  errorText: {
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
  bottomPadding: {
    height: 120,
  },
});

export default StockDetailScreen;
