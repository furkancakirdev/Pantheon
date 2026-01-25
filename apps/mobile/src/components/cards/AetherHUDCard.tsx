/**
 * PANTHEON AETHER HUD CARD
 * Macro regime display with leading/coincident/lagging indicators
 * Based on Argus Terminal Aether HUD design
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MacroRating } from '../../types/api';
import { Theme } from '../../constants/Theme';
import { GlassCard } from './GlassCard';

// ============ PROPS ============
export interface AetherHUDCardProps {
  macro?: MacroRating;
  compact?: boolean;
  onPress?: () => void;
}

// ============ COMPONENT ============
export const AetherHUDCard: React.FC<AetherHUDCardProps> = ({
  macro,
  compact = false,
  onPress,
}) => {
  // Default/fallback data
  const data = macro || {
    regime: 'Risk İştahı Yüksek',
    numericScore: 75,
    leading: 80,
    coincident: 75,
    lagging: 70,
  };

  const regime = data.regime || 'Nötr';
  const score = data.numericScore || 50;
  const leading = data.leading || 50;
  const coincident = data.coincident || 50;
  const lagging = data.lagging || 50;

  // Determine regime color
  const getRegimeColor = (regime: string): string => {
    if (regime.includes('Yüksek') || regime.includes('Bullish'))
      return Theme.colors.positive;
    if (regime.includes('Düşük') || regime.includes('Bearish'))
      return Theme.colors.negative;
    return Theme.colors.warning;
  };

  const regimeColor = getRegimeColor(regime);

  // Pill styles for indicators
  const Pill = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: number;
    color: string;
  }) => (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
    </View>
  );

  if (compact) {
    return (
      <GlassCard onPress={onPress} style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactIcon}>👁️</Text>
          <View style={styles.compactMiddle}>
            <Text style={styles.compactLabel}>AETHER</Text>
            <Text style={[styles.compactRegime, { color: regimeColor }]}>
              {regime}
            </Text>
          </View>
          <View
            style={[
              styles.compactScore,
              { backgroundColor: `${regimeColor}20`, borderColor: regimeColor },
            ]}
          >
            <Text style={[styles.compactScoreValue, { color: regimeColor }]}>
              {score}
            </Text>
          </View>
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard onPress={onPress} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>👁️</Text>
          <View>
            <Text style={styles.title}>AETHER - Makro Gösterge</Text>
            <Text style={styles.subtitle}>Rejim Tespiti</Text>
          </View>
        </View>

        {/* Score Circle */}
        <View
          style={[
            styles.scoreCircle,
            { backgroundColor: `${regimeColor}15`, borderColor: regimeColor },
          ]}
        >
          <Text style={[styles.scoreValue, { color: regimeColor }]}>{score}</Text>
        </View>
      </View>

      {/* Regime Banner */}
      <View
        style={[
          styles.regimeBanner,
          { backgroundColor: `${regimeColor}20`, borderLeftColor: regimeColor },
        ]}
      >
        <Text style={[styles.regimeText, { color: regimeColor }]}>{regime}</Text>
      </View>

      {/* Indicator Pills */}
      <View style={styles.pillsContainer}>
        <Pill label="ÖNCÜ" value={leading} color={Theme.colors.positive} />
        <Pill label="EŞ ZAMANLI" value={coincident} color={Theme.colors.warning} />
        <Pill label="GECİKMİŞ" value={lagging} color={Theme.colors.negative} />
      </View>

      {/* Indicator Bars */}
      <View style={styles.barsContainer}>
        <IndicatorBar label="Öncü Göstergeler" value={leading} color={Theme.colors.positive} />
        <IndicatorBar label="Eş Zamanlı" value={coincident} color={Theme.colors.warning} />
        <IndicatorBar label="Gecikmiş" value={lagging} color={Theme.colors.negative} />
      </View>

      {/* Interpretation */}
      <View style={styles.interpretation}>
        {score >= 70 ? (
          <Text style={styles.interpretationText}>
            📈 Risk iştahı yüksek. Büyüme hisseleri favori. Temel ALS uygun.
          </Text>
        ) : score >= 40 ? (
          <Text style={styles.interpretationText}>
            ⚖️ Piyasa nötr bölgede. Seçici alım önerilir. Stop loss kullanın.
          </Text>
        ) : (
          <Text style={styles.interpretationText}>
            📉 Risk iştahı düşük. Defansif hisseler ve nakit pozisyon önerilir.
          </Text>
        )}
      </View>
    </GlassCard>
  );
};

// ============ INDICATOR BAR COMPONENT ============
interface IndicatorBarProps {
  label: string;
  value: number;
  color: string;
}

const IndicatorBar: React.FC<IndicatorBarProps> = ({ label, value, color }) => (
  <View style={styles.indicatorBarContainer}>
    <Text style={styles.indicatorLabel}>{label}</Text>
    <View style={styles.barWrapper}>
      <View style={styles.barBackground}>
        <LinearGradient
          colors={[color, color + '66']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.barFill, { width: `${value}%` }]}
        />
      </View>
      <Text style={[styles.barValue, { color }]}>{value}</Text>
    </View>
  </View>
);

// ============ MINI HUD ============
export interface AetherHUDMiniProps {
  score: number;
  regime?: string;
  onPress?: () => void;
}

export const AetherHUDMini: React.FC<AetherHUDMiniProps> = ({
  score,
  regime = 'Nötr',
  onPress,
}) => {
  const color = score >= 70 ? Theme.colors.positive : score >= 40 ? Theme.colors.warning : Theme.colors.negative;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.miniContainer, { borderColor: color }]}
    >
      <Text style={styles.miniIcon}>👁️</Text>
      <View style={styles.miniContent}>
        <Text style={styles.miniLabel}>AETHER</Text>
        <View style={styles.miniBar}>
          <View style={[styles.miniBarFill, { width: `${score}%`, backgroundColor: color }]} />
        </View>
      </View>
      <Text style={[styles.miniScore, { color }]}>{score}</Text>
    </TouchableOpacity>
  );
};

// ============ REGIME PILL ============
export interface RegimePillProps {
  regime: string;
  score: number;
  size?: 'small' | 'medium' | 'large';
}

export const RegimePill: React.FC<RegimePillProps> = ({
  regime,
  score,
  size = 'medium',
}) => {
  const color = score >= 70 ? Theme.colors.positive : score >= 40 ? Theme.colors.warning : Theme.colors.negative;

  const sizeStyles = {
    small: { paddingVertical: 4, paddingHorizontal: 8, fontSize: 10 },
    medium: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 12 },
    large: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
  };

  const { paddingVertical, paddingHorizontal, fontSize } = sizeStyles[size];

  return (
    <View
      style={[
        styles.regimePill,
        {
          backgroundColor: `${color}20`,
          borderColor: color,
          paddingVertical,
          paddingHorizontal,
        },
      ]}
    >
      <Text style={[styles.regimePillText, { color, fontSize }]}>
        {regime.toUpperCase()}
      </Text>
    </View>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    padding: Theme.spacing.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.medium,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    ...Theme.typography.body,
    fontWeight: '700',
  },
  subtitle: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textSecondary,
  },
  scoreCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    ...Theme.typography.h3,
    fontWeight: '700',
  },
  regimeBanner: {
    paddingVertical: Theme.spacing.small,
    paddingHorizontal: Theme.spacing.medium,
    borderRadius: Theme.radius.small,
    borderLeftWidth: 3,
    marginBottom: Theme.spacing.medium,
  },
  regimeText: {
    ...Theme.typography.body,
    fontWeight: '700',
  },
  pillsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Theme.spacing.medium,
  },
  pill: {
    alignItems: 'center',
    padding: Theme.spacing.small,
    borderRadius: Theme.radius.small,
    borderWidth: 1,
    minWidth: 70,
  },
  pillLabel: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  pillValue: {
    ...Theme.typography.h4,
    fontWeight: '700',
  },
  barsContainer: {
    gap: Theme.spacing.small,
    marginBottom: Theme.spacing.medium,
  },
  indicatorBarContainer: {
    gap: 4,
  },
  indicatorLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
  },
  barBackground: {
    flex: 1,
    height: 6,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.pill,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  barValue: {
    ...Theme.typography.captionSmall,
    fontWeight: '700',
    width: 30,
    textAlign: 'right',
  },
  interpretation: {
    padding: Theme.spacing.medium,
    backgroundColor: `${Theme.colors.accent}10`,
    borderRadius: Theme.radius.small,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.accent,
  },
  interpretationText: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  // Compact variant
  compactContainer: {
    padding: Theme.spacing.small,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
  },
  compactIcon: {
    fontSize: 24,
  },
  compactMiddle: {
    flex: 1,
    gap: 2,
  },
  compactLabel: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textTertiary,
  },
  compactRegime: {
    ...Theme.typography.bodySmall,
    fontWeight: '600',
  },
  compactScore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactScoreValue: {
    ...Theme.typography.body,
    fontWeight: '700',
  },
  // Mini variant
  miniContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
    padding: Theme.spacing.small,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.small,
    borderWidth: 1,
  },
  miniIcon: {
    fontSize: 18,
  },
  miniContent: {
    flex: 1,
    gap: 4,
  },
  miniLabel: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textSecondary,
  },
  miniBar: {
    height: 3,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.pill,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
  },
  miniScore: {
    ...Theme.typography.caption,
    fontWeight: '700',
  },
  // Regime Pill
  regimePill: {
    borderRadius: Theme.radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  regimePillText: {
    fontWeight: '700',
  },
});

export default AetherHUDCard;
