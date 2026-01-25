/**
 * PANTHEON SIGNAL CARD
 * Display stock signal with price, change, and council decision
 * Based on Argus Terminal SignalCard design
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StockSignal } from '../../types/api';
import { Theme, getVerdictColor } from '../../constants/Theme';
import { GlassCard } from './GlassCard';

// ============ PROPS ============
export interface SignalCardProps {
  signal: StockSignal;
  onPress?: () => void;
  showModuleChips?: boolean;
}

// ============ COMPONENT ============
export const SignalCard: React.FC<SignalCardProps> = ({
  signal,
  onPress,
  showModuleChips = true,
}) => {
  const verdict = signal.councilKarar?.sonKarar;
  const consensus = signal.councilKarar?.konsensus || 0;
  const verdictColor = getVerdictColor(verdict);

  const changePercent = signal.degisim || '%0.0';
  const isPositive = changePercent.includes('+');
  const isNegative = changePercent.includes('-');

  // Get top 2 contributing modules for chips
  const topVotes = signal.councilKarar?.oylar
    ?.filter((o) => o.oy === verdict)
    .slice(0, 2) || [];

  return (
    <GlassCard onPress={onPress} style={styles.container}>
      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Left: Symbol & Name */}
        <View style={styles.leftSection}>
          <View style={styles.symbolContainer}>
            <Text style={styles.symbol}>{signal.hisse}</Text>
            {verdict && (
              <View
                style={[
                  styles.verdictBadge,
                  { backgroundColor: `${verdictColor}20`, borderColor: verdictColor },
                ]}
              >
                <Text style={[styles.verdictText, { color: verdictColor }]}>
                  {verdict}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right: Price & Change */}
        <View style={styles.rightSection}>
          {signal.fiyat && (
            <Text style={styles.price}>{signal.fiyat.toFixed(2)} ₺</Text>
          )}
          <Text
            style={[
              styles.change,
              isPositive && styles.changePositive,
              isNegative && styles.changeNegative,
            ]}
          >
            {changePercent}
          </Text>
        </View>
      </View>

      {/* Bottom: Consensus Bar & Module Chips */}
      {(consensus > 0 || showModuleChips) && (
        <View style={styles.bottomSection}>
          {/* Consensus Bar */}
          {consensus > 0 && (
            <View style={styles.consensusContainer}>
              <Text style={styles.consensusLabel}>Konsensus:</Text>
              <View style={styles.consensusBarContainer}>
                <LinearGradient
                  colors={[
                    verdictColor,
                    verdictColor + 'CC',
                    verdictColor + '66',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.consensusBar, { width: `${consensus}%` }]}
                />
              </View>
              <Text style={[styles.consensusValue, { color: verdictColor }]}>
                %{consensus}
              </Text>
            </View>
          )}

          {/* Module Chips */}
          {showModuleChips && topVotes.length > 0 && (
            <View style={styles.chipsContainer}>
              {topVotes.map((vote, index) => (
                <View
                  key={index}
                  style={[
                    styles.chip,
                    { backgroundColor: `${Theme.colors.border}40` },
                  ]}
                >
                  <Text style={styles.chipText}>{vote.modul}</Text>
                  <View
                    style={[
                      styles.chipDot,
                      { backgroundColor: getVerdictColor(vote.oy) },
                    ]}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Scores Row (Optional) */}
      {(signal.erdimcSkor !== undefined ||
        signal.wonderkidSkor !== undefined) && (
        <View style={styles.scoresRow}>
          {signal.erdimcSkor !== undefined && (
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Erdinç</Text>
              <Text
                style={[
                  styles.scoreValue,
                  signal.erdimcSkor >= 70 && styles.scoreValueHigh,
                ]}
              >
                {signal.erdimcSkor}
              </Text>
            </View>
          )}
          {signal.wonderkidSkor !== undefined && (
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Wonderkid</Text>
              <Text
                style={[
                  styles.scoreValue,
                  signal.wonderkidSkor >= 70 && styles.scoreValueHigh,
                ]}
              >
                {signal.wonderkidSkor}
              </Text>
            </View>
          )}
        </View>
      )}
    </GlassCard>
  );
};

// ============ COMPACT VARIANT ============
export interface SignalCardCompactProps {
  symbol: string;
  price?: number;
  change?: string;
  verdict?: string;
  consensus?: number;
  onPress?: () => void;
}

export const SignalCardCompact: React.FC<SignalCardCompactProps> = ({
  symbol,
  price,
  change,
  verdict,
  consensus,
  onPress,
}) => {
  const verdictColor = getVerdictColor(verdict);
  const isPositive = change?.includes('+');
  const isNegative = change?.includes('-');

  return (
    <GlassCard onPress={onPress} style={styles.compactContainer}>
      <View style={styles.compactMain}>
        {/* Symbol */}
        <Text style={styles.compactSymbol}>{symbol}</Text>

        {/* Spacer */}
        <View style={styles.flex1} />

        {/* Price */}
        {price && <Text style={styles.compactPrice}>{price.toFixed(2)}</Text>}

        {/* Change */}
        {change && (
          <Text
            style={[
              styles.compactChange,
              isPositive && styles.changePositive,
              isNegative && styles.changeNegative,
            ]}
          >
            {change}
          </Text>
        )}

        {/* Verdict Badge */}
        {verdict && (
          <View
            style={[
              styles.compactBadge,
              { backgroundColor: `${verdictColor}20` },
            ]}
          >
            <Text style={[styles.compactBadgeText, { color: verdictColor }]}>
              {verdict.charAt(0)}
            </Text>
          </View>
        )}
      </View>

      {/* Consensus Bar */}
      {consensus !== undefined && consensus > 0 && (
        <View style={styles.compactConsensusBar}>
          <LinearGradient
            colors={[verdictColor, verdictColor + '66']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.compactConsensusFill, { width: `${consensus}%` }]}
          />
        </View>
      )}
    </GlassCard>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    padding: Theme.spacing.medium,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  symbolContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
  },
  symbol: {
    ...Theme.typography.h3,
    fontWeight: '700',
  },
  verdictBadge: {
    paddingHorizontal: Theme.spacing.small,
    paddingVertical: 4,
    borderRadius: Theme.radius.small,
    borderWidth: 1,
  },
  verdictText: {
    ...Theme.typography.caption,
    fontWeight: '700',
    fontSize: 10,
  },
  price: {
    ...Theme.typography.mono,
    fontSize: 18,
  },
  change: {
    ...Theme.typography.bodySmall,
    fontWeight: '600',
  },
  changePositive: {
    color: Theme.colors.positive,
  },
  changeNegative: {
    color: Theme.colors.negative,
  },
  bottomSection: {
    marginTop: Theme.spacing.small,
    gap: Theme.spacing.small,
  },
  consensusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
  },
  consensusLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
  },
  consensusBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.pill,
    overflow: 'hidden',
  },
  consensusBar: {
    height: '100%',
    borderRadius: Theme.radius.pill,
  },
  consensusValue: {
    ...Theme.typography.captionSmall,
    fontWeight: '700',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.small,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Theme.spacing.small,
    paddingVertical: 4,
    borderRadius: Theme.radius.small,
  },
  chipText: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textSecondary,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  scoresRow: {
    flexDirection: 'row',
    gap: Theme.spacing.medium,
    marginTop: Theme.spacing.small,
    paddingTop: Theme.spacing.small,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  scoreItem: {
    flex: 1,
  },
  scoreLabel: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textSecondary,
  },
  scoreValue: {
    ...Theme.typography.bodySmall,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  scoreValueHigh: {
    color: Theme.colors.positive,
  },
  // Compact variants
  compactContainer: {
    padding: Theme.spacing.small,
  },
  compactMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
  },
  flex1: {
    flex: 1,
  },
  compactSymbol: {
    ...Theme.typography.body,
    fontWeight: '700',
  },
  compactPrice: {
    ...Theme.typography.monoSmall,
  },
  compactChange: {
    ...Theme.typography.captionSmall,
    fontWeight: '600',
  },
  compactBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactBadgeText: {
    ...Theme.typography.caption,
    fontWeight: '700',
  },
  compactConsensusBar: {
    height: 3,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.pill,
    marginTop: Theme.spacing.small,
    overflow: 'hidden',
  },
  compactConsensusFill: {
    height: '100%',
  },
});

export default SignalCard;
