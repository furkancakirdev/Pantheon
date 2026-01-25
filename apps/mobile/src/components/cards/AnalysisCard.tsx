/**
 * PANTHEON ANALYSIS CARD
 * Display individual module analysis score with details
 * Based on Argus Terminal AnalysisCard design
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme, getVerdictColor } from '../../constants/Theme';
import { GlassCard } from './GlassCard';

// ============ MODULE METADATA ============
export const MODULE_INFO: Record<
  string,
  { name: string; icon: string; color: string; description: string }
> = {
  'Atlas V2': {
    name: 'Atlas V2',
    icon: '🏛️',
    color: '#FFD700',
    description: 'Temel Analiz - F/K, FD/FAİZ, Kar Marjı',
  },
  'Orion V3': {
    name: 'Orion V3',
    icon: '〰️',
    color: '#00A8FF',
    description: 'Teknik Analiz - SMA, RSI, MACD',
  },
  'Phoenix': {
    name: 'Phoenix',
    icon: '🔥',
    color: '#FF6B35',
    description: 'Sinyal Onayı - Golden Cross, Pattern',
  },
  'Hermes': {
    name: 'Hermes',
    icon: '📰',
    color: '#9B59B6',
    description: 'Haber Analizi - Twitter Sentiment',
  },
  'Athena': {
    name: 'Athena',
    icon: '🦉',
    color: '#3498DB',
    description: 'Smart Beta - Faktör Analizi',
  },
  'Demeter': {
    name: 'Demeter',
    icon: '🌾',
    color: '#27AE60',
    description: 'Sektör Analizi - Dinamik Sektör',
  },
  'Aether': {
    name: 'Aether',
    icon: '👁️',
    color: '#1ABC9C',
    description: 'Makro Rejim - Risk İştahı',
  },
  'Chiron': {
    name: 'Chiron',
    icon: '⚖️',
    color: '#E74C3C',
    description: 'Risk Rejimi - Portföy Ağırlık',
  },
  'Cronos': {
    name: 'Cronos',
    icon: '⏰',
    color: '#95A5A6',
    description: 'Zaman Analizi - Sezonluk Etki',
  },
  'Wonderkid': {
    name: 'Wonderkid',
    icon: '⭐',
    color: '#F39C12',
    description: 'Yıldız Hisse - Yüksek Potansiyel',
  },
};

// ============ PROPS ============
export interface AnalysisCardProps {
  moduleName: string;
  score: number;
  verdict?: string;
  details?: string;
  compact?: boolean;
  onPress?: () => void;
}

// ============ COMPONENT ============
export const AnalysisCard: React.FC<AnalysisCardProps> = ({
  moduleName,
  score,
  verdict,
  details,
  compact = false,
  onPress,
}) => {
  const [expanded, setExpanded] = useState(false);
  const moduleInfo = MODULE_INFO[moduleName] || {
    name: moduleName,
    icon: '📊',
    color: Theme.colors.accent,
    description: 'Analiz Modülü',
  };

  const scoreColor = getScoreColor(score);
  const verdictColor = verdict ? getVerdictColor(verdict) : scoreColor;

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.compactContainer}
      >
        <Text style={styles.compactIcon}>{moduleInfo.icon}</Text>
        <View style={styles.compactMiddle}>
          <Text style={styles.compactName}>{moduleInfo.name}</Text>
          <View style={styles.compactScoreBar}>
            <View
              style={[
                styles.compactScoreFill,
                { width: `${score}%`, backgroundColor: scoreColor },
              ]}
            />
          </View>
        </View>
        <Text style={[styles.compactScore, { color: scoreColor }]}>
          {score}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <GlassCard onPress={onPress} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>{moduleInfo.icon}</Text>
          <View>
            <Text style={styles.moduleName}>{moduleInfo.name}</Text>
            <Text style={styles.moduleDesc}>{moduleInfo.description}</Text>
          </View>
        </View>

        <View
          style={[
            styles.scoreBadge,
            { backgroundColor: `${scoreColor}20`, borderColor: scoreColor },
          ]}
        >
          <Text style={[styles.scoreValue, { color: scoreColor }]}>{score}</Text>
        </View>
      </View>

      {/* Verdict Badge */}
      {verdict && (
        <View style={styles.verdictRow}>
          <View
            style={[
              styles.verdictBadge,
              { backgroundColor: `${verdictColor}20` },
            ]}
          >
            <Text style={[styles.verdictText, { color: verdictColor }]}>
              {verdict}
            </Text>
          </View>
        </View>
      )}

      {/* Score Bar */}
      <View style={styles.scoreBarContainer}>
        <LinearGradient
          colors={[scoreColor, scoreColor + '66', scoreColor + '33']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.scoreBar, { width: `${score}%` }]}
        />
      </View>

      {/* Details (Expandable) */}
      {details && (
        <>
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.expandLabel}>Açıklama</Text>
            <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {expanded && (
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsText}>{details}</Text>
            </View>
          )}
        </>
      )}
    </GlassCard>
  );
};

// ============ SCORE COLOR HELPER ============
export const getScoreColor = (score: number): string => {
  if (score >= 80) return Theme.colors.positive;
  if (score >= 60) return Theme.colors.warning;
  if (score >= 40) return Theme.colors.neutral;
  return Theme.colors.negative;
};

// ============ SCORE BADGE COMPONENT ============
export interface ScoreBadgeProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  label?: string;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  size = 'medium',
  showLabel = false,
  label,
}) => {
  const color = getScoreColor(score);
  const sizeMap = {
    small: { width: 32, height: 32, fontSize: 12 },
    medium: { width: 48, height: 48, fontSize: 16 },
    large: { width: 64, height: 64, fontSize: 20 },
  };
  const { width, height, fontSize } = sizeMap[size];

  return (
    <View style={styles.scoreBadgeContainer}>
      <View
        style={[
          styles.circleBadge,
          { width, height, borderColor: color },
        ]}
      >
        <Text style={[styles.circleScore, { color: color, fontSize }]}>
          {score}
        </Text>
      </View>
      {showLabel && (
        <Text style={[styles.badgeLabel, { color: color }]}>
          {label || (score >= 70 ? 'Yüksek' : score >= 50 ? 'Orta' : 'Düşük')}
        </Text>
      )}
    </View>
  );
};

// ============ VERTICAL SCORE CARD ============
export interface VerticalScoreCardProps {
  moduleName: string;
  score: number;
  verdict?: string;
  icon?: string;
  onPress?: () => void;
}

export const VerticalScoreCard: React.FC<VerticalScoreCardProps> = ({
  moduleName,
  score,
  verdict,
  icon,
  onPress,
}) => {
  const moduleInfo = MODULE_INFO[moduleName];
  const scoreColor = getScoreColor(score);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.verticalContainer,
        { borderLeftColor: scoreColor },
      ]}
    >
      <Text style={styles.verticalIcon}>
        {icon || moduleInfo?.icon || '📊'}
      </Text>
      <Text style={styles.verticalName}>{moduleInfo?.name || moduleName}</Text>

      <View style={styles.verticalScoreContainer}>
        <Text style={[styles.verticalScore, { color: scoreColor }]}>
          {score}
        </Text>
      </View>

      {verdict && (
        <Text style={[styles.verticalVerdict, { color: scoreColor }]}>
          {verdict}
        </Text>
      )}
    </TouchableOpacity>
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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
  },
  icon: {
    fontSize: 28,
  },
  moduleName: {
    ...Theme.typography.body,
    fontWeight: '700',
  },
  moduleDesc: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textSecondary,
  },
  scoreBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    ...Theme.typography.h4,
    fontWeight: '700',
  },
  verdictRow: {
    marginTop: Theme.spacing.small,
  },
  verdictBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Theme.spacing.small,
    paddingVertical: 4,
    borderRadius: Theme.radius.small,
  },
  verdictText: {
    ...Theme.typography.caption,
    fontWeight: '700',
  },
  scoreBarContainer: {
    height: 6,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.pill,
    marginTop: Theme.spacing.small,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    borderRadius: Theme.radius.pill,
  },
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.small,
    paddingVertical: Theme.spacing.small,
  },
  expandLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
  },
  expandIcon: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textTertiary,
  },
  detailsContainer: {
    marginTop: Theme.spacing.small,
    padding: Theme.spacing.medium,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.small,
  },
  detailsText: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  // Compact variant
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
    padding: Theme.spacing.small,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.small,
  },
  compactIcon: {
    fontSize: 20,
  },
  compactMiddle: {
    flex: 1,
    gap: 4,
  },
  compactName: {
    ...Theme.typography.bodySmall,
    fontWeight: '600',
  },
  compactScoreBar: {
    height: 3,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.pill,
    overflow: 'hidden',
  },
  compactScoreFill: {
    height: '100%',
  },
  compactScore: {
    ...Theme.typography.body,
    fontWeight: '700',
  },
  // Score Badge
  scoreBadgeContainer: {
    alignItems: 'center',
    gap: 4,
  },
  circleBadge: {
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleScore: {
    fontWeight: '700',
  },
  badgeLabel: {
    ...Theme.typography.captionSmall,
    fontWeight: '600',
  },
  // Vertical variant
  verticalContainer: {
    flex: 1,
    alignItems: 'center',
    padding: Theme.spacing.medium,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.medium,
    borderLeftWidth: 3,
    gap: Theme.spacing.small,
  },
  verticalIcon: {
    fontSize: 32,
  },
  verticalName: {
    ...Theme.typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  verticalScoreContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalScore: {
    ...Theme.typography.h3,
    fontWeight: '700',
  },
  verticalVerdict: {
    ...Theme.typography.captionSmall,
    fontWeight: '700',
  },
});

export default AnalysisCard;
