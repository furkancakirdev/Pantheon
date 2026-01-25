/**
 * PANTHEON KIVANÇ INDICATORS CARD
 * Display Kıvanç Özbilgiç indicators with visual signals
 * SuperTrend, AlphaTrend, MOST, MavilimW, KIVANÇ HL, StochRSI
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme, getVerdictColor } from '../../constants/Theme';
import type { OrionAnalysis } from '../../types/api';

// ============ PROPS ============
export interface KivancIndicatorsCardProps {
  orion: OrionAnalysis;
  onPress?: () => void;
}

// ============ COMPONENT ============
export const KivancIndicatorsCard: React.FC<KivancIndicatorsCardProps> = ({
  orion,
  onPress,
}) => {
  const { kivanc, totalScore, verdict } = orion;

  // Signal color helper
  const getSignalColor = (signal: string): string => {
    if (signal === 'AL' || signal === 'YUKARI') return Theme.colors.positive;
    if (signal === 'SAT' || signal === 'ASAGI') return Theme.colors.negative;
    return Theme.colors.textTertiary;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>📈</Text>
          <View>
            <Text style={styles.title}>Kıvanç İndikatörleri</Text>
            <Text style={styles.subtitle}>SuperTrend • AlphaTrend • MOST</Text>
          </View>
        </View>
        <View
          style={[
            styles.scoreBadge,
            { backgroundColor: `${getVerdictColor(verdict)}20` },
          ]}
        >
          <Text
            style={[styles.scoreValue, { color: getVerdictColor(verdict) }]}
          >
            {totalScore}
          </Text>
        </View>
      </View>

      {/* Indicators Grid */}
      <View style={styles.indicatorsGrid}>
        {/* AlphaTrend */}
        <IndicatorItem
          name="AlphaTrend"
          signal={kivanc.alphaTrend}
          color={getSignalColor(kivanc.alphaTrend)}
        />

        {/* SuperTrend */}
        <IndicatorItem
          name="SuperTrend"
          signal={kivanc.superTrend}
          color={getSignalColor(kivanc.superTrend)}
        />

        {/* MOST */}
        <IndicatorItem
          name="MOST"
          signal={kivanc.most}
          color={getSignalColor(kivanc.most)}
        />

        {/* StochRSI */}
        <IndicatorItem
          name="StochRSI"
          signal={kivanc.stochRSI}
          color={getSignalColor(kivanc.stochRSI)}
        />

        {/* MavilimW */}
        <IndicatorItem
          name="MavilimW"
          signal={kivanc.mavilimW}
          color={getSignalColor(
            kivanc.mavilimW === 'YUKARI' ? 'AL' : kivanc.mavilimW === 'ASAGI' ? 'SAT' : 'BEKLE'
          )}
        />
      </View>

      {/* Harmonic Levels */}
      {kivanc.harmonicLevels && (
        <View style={styles.harmonicSection}>
          <Text style={styles.harmonicTitle}>KIVANÇ HL (Harmonic)</Text>
          <View style={styles.harmonicLevels}>
            <HarmonicLevel label="H6" value={kivanc.harmonicLevels.h6} />
            <HarmonicLevel label="M1" value={kivanc.harmonicLevels.m1} />
            <HarmonicLevel label="L6" value={kivanc.harmonicLevels.l6} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ============ INDICATOR ITEM ============
interface IndicatorItemProps {
  name: string;
  signal: string;
  color: string;
}

const IndicatorItem: React.FC<IndicatorItemProps> = ({ name, signal, color }) => (
  <BlurView intensity={10} tint="dark" style={styles.indicatorItem}>
    <Text style={styles.indicatorName}>{name}</Text>
    <View style={[styles.signalDot, { backgroundColor: color }]} />
    <Text style={[styles.indicatorSignal, { color }]}>{signal}</Text>
  </BlurView>
);

// ============ HARMONIC LEVEL ============
interface HarmonicLevelProps {
  label: string;
  value: number;
}

const HarmonicLevel: React.FC<HarmonicLevelProps> = ({ label, value }) => (
  <View style={styles.harmonicLevelItem}>
    <Text style={styles.harmonicLabel}>{label}</Text>
    <Text style={styles.harmonicValue}>{value.toFixed(2)}</Text>
  </View>
);

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.large,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
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
    ...Theme.typography.h4,
    fontWeight: '700',
  },
  subtitle: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textSecondary,
  },
  scoreBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    ...Theme.typography.body,
    fontWeight: '700',
  },
  indicatorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Theme.spacing.small,
    gap: Theme.spacing.small,
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Theme.spacing.small,
    paddingVertical: 8,
    borderRadius: Theme.radius.small,
    minWidth: 100,
  },
  indicatorName: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  signalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorSignal: {
    ...Theme.typography.caption,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  harmonicSection: {
    padding: Theme.spacing.medium,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  harmonicTitle: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.small,
    fontWeight: '600',
  },
  harmonicLevels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  harmonicLevelItem: {
    alignItems: 'center',
    gap: 4,
  },
  harmonicLabel: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textTertiary,
  },
  harmonicValue: {
    ...Theme.typography.bodySmall,
    fontWeight: '600',
    color: Theme.colors.accent,
  },
});

export default KivancIndicatorsCard;
