/**
 * PANTHEON PHOENIX SIGNALS CARD
 * Sinyal tarama ve onayı sonuçları
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from './GlassCard';
import { Theme } from '../../constants/Theme';
import type { PhoenixAnalysis, PhoenixSignal } from '../../types/api';

interface PhoenixSignalsCardProps {
  phoenix: PhoenixAnalysis;
  onPress?: () => void;
}

export const PhoenixSignalsCard: React.FC<PhoenixSignalsCardProps> = ({
  phoenix,
  onPress,
}) => {
  const { score, signals, riskLevel } = phoenix;

  const getRiskColor = (risk: string): string => {
    if (risk === 'DÜŞÜK') return Theme.colors.positive;
    if (risk === 'ORTA') return Theme.colors.warning;
    return Theme.colors.negative;
  };

  const getRiskLabel = (risk: string): string => {
    if (risk === 'DÜŞÜK') return 'Düşük Risk';
    if (risk === 'ORTA') return 'Orta Risk';
    return 'Yüksek Risk';
  };

  const getScoreColor = (s: number): string => {
    if (s >= 80) return Theme.colors.positive;
    if (s >= 60) return Theme.colors.warning;
    return Theme.colors.textTertiary;
  };

  const getSignalIcon = (signal: PhoenixSignal): string => {
    if (!signal.bullish) return '▼';
    if (signal.strength >= 8) return '🔥';
    if (signal.strength >= 6) return '⬆️';
    return '▶️';
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.container}>
      <GlassCard style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.icon}>🔥</Text>
            <Text style={styles.title}>Phoenix Sinyaller</Text>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={[styles.score, { color: getScoreColor(score) }]}>
              {score}
            </Text>
            <Text style={styles.scoreLabel}>/100</Text>
          </View>
        </View>

        {/* Risk Level */}
        <View style={[styles.riskBadge, { backgroundColor: `${getRiskColor(riskLevel)}20` }]}>
          <View style={[styles.riskDot, { backgroundColor: getRiskColor(riskLevel) }]} />
          <Text style={[styles.riskText, { color: getRiskColor(riskLevel) }]}>
            {getRiskLabel(riskLevel)}
          </Text>
        </View>

        {/* Signals List */}
        <View style={styles.signalsContainer}>
          {signals.slice(0, 3).map((signal, index) => (
            <View key={index} style={styles.signalRow}>
              <Text style={styles.signalIcon}>{getSignalIcon(signal)}</Text>
              <View style={styles.signalContent}>
                <Text style={styles.signalName}>{formatSignalType(signal.type)}</Text>
                <Text style={styles.signalDescription}>{signal.description}</Text>
              </View>
              <View style={[styles.strengthBar, { width: `${signal.strength * 10}%` }]} />
            </View>
          ))}

          {signals.length === 0 && (
            <Text style={styles.noSignals}>Sinyal bulunamadı</Text>
          )}
        </View>

        {/* Reason */}
        {phoenix.reason && (
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel} numberOfLines={1}>
              {phoenix.reason}
            </Text>
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
};

const formatSignalType = (type: string): string => {
  const map: Record<string, string> = {
    'GOLDEN_CROSS': 'Golden Cross',
    'DEATH_CROSS': 'Death Cross',
    'SMA_CROSS': 'SMA Cross',
    'MACD_CROSS': 'MACD Cross',
    'RSI_OVERSOLD': 'RSI Aşırı Satım',
    'RSI_OVERBOUGHT': 'RSI Aşırı Alım',
    'FORMASYON': 'Formasyon',
    'VOLUME_SPIKE': 'Hacim Spike',
  };
  return map[type] || type;
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Theme.spacing.small,
  },
  card: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.small,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  score: {
    fontSize: 24,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 12,
    color: Theme.colors.textTertiary,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Theme.spacing.small,
    paddingVertical: 4,
    borderRadius: Theme.radius.small,
    marginBottom: Theme.spacing.small,
    gap: 6,
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '600',
  },
  signalsContainer: {
    gap: Theme.spacing.small,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
  },
  signalIcon: {
    fontSize: 14,
    width: 20,
    textAlign: 'center',
  },
  signalContent: {
    flex: 1,
  },
  signalName: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  signalDescription: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  strengthBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: Theme.colors.primary,
    borderRadius: 1,
  },
  noSignals: {
    fontSize: 12,
    color: Theme.colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Theme.spacing.medium,
  },
  reasonContainer: {
    marginTop: Theme.spacing.small,
    paddingTop: Theme.spacing.small,
    borderTopWidth: 1,
    borderTopColor: `${Theme.colors.textSecondary}15`,
  },
  reasonLabel: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
});
