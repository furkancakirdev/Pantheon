/**
 * PANTHEON CHIRON RISK CARD
 * Risk yönetimi ve position sizing sonuçları
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassCard } from './GlassCard';
import { PositiveCard, NegativeCard, WarningCard } from './GlassCard';
import { Theme } from '../../constants/Theme';
import type { ChironRiskDecision } from '../../types/api';

interface ChironRiskCardProps {
  decision: ChironRiskDecision;
  equity?: number;
  onPress?: () => void;
}

export const ChironRiskCard: React.FC<ChironRiskCardProps> = ({
  decision,
  equity,
  onPress,
}) => {
  const { approved, adjustedQuantity, suggestedStopLoss, suggestedTakeProfit, riskR, reason, warnings } = decision;

  const Wrapper = approved ? PositiveCard : NegativeCard;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.container}>
      <Wrapper style={styles.card} blurAmount={5}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>{approved ? '✅' : '❌'}</Text>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Chiron Risk Kontrolü</Text>
            <Text style={styles.verdict}>
              {approved ? 'ONAYLANDI' : 'REDDEDİ'}
            </Text>
          </View>
        </View>

        {/* Position Info */}
        {approved && (
          <View style={styles.positionInfo}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Pozisyon</Text>
              <Text style={styles.infoValue}>{adjustedQuantity} Adet</Text>
            </View>

            {riskR && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Risk</Text>
                <Text style={styles.infoValue}>{riskR}R</Text>
              </View>
            )}

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Stop</Text>
              <Text style={styles.infoValue}>{suggestedStopLoss?.toFixed(2)}</Text>
            </View>

            {suggestedTakeProfit && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Hedef</Text>
                <Text style={styles.infoValue}>{suggestedTakeProfit.toFixed(2)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Reason */}
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonText}>{reason}</Text>
        </View>

        {/* Warnings */}
        {warnings.length > 0 && (
          <View style={styles.warningsContainer}>
            <Text style={styles.warningsTitle}>⚠️ Uyarılar:</Text>
            {warnings.map((warning, index) => (
              <Text key={index} style={styles.warningItem}>
                • {warning}
              </Text>
            ))}
          </View>
        )}

        {/* Risk Level Bar */}
        {riskR && (
          <View style={styles.riskBarContainer}>
            <Text style={styles.riskBarLabel}>Risk Seviyesi</Text>
            <View style={styles.riskBarBg}>
              <View style={[styles.riskBarFill, { width: `${Math.min(riskR * 25, 100)}%` }]} />
            </View>
            <Text style={styles.riskBarValue}>{riskR}R</Text>
          </View>
        )}
      </Wrapper>
    </TouchableOpacity>
  );
};

interface ChironMetricsCardProps {
  metrics: {
    totalRiskR: number;
    sectorExposure: Record<string, number>;
    maxDrawdown: number;
    var95: number;
    concentrationRisk: number;
  };
  onPress?: () => void;
}

export const ChironMetricsCard: React.FC<ChironMetricsCardProps> = ({
  metrics,
  onPress,
}) => {
  const getRiskColor = (value: number, max: number): string => {
    const ratio = value / max;
    if (ratio < 0.5) return Theme.colors.positive;
    if (ratio < 0.8) return Theme.colors.warning;
    return Theme.colors.negative;
  };

  const sectors = Object.entries(metrics.sectorExposure).slice(0, 3);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.container}>
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.icon}>📊</Text>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Portföy Risk Analizi</Text>
          </View>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Toplam Risk</Text>
            <Text style={[styles.metricValue, { color: getRiskColor(metrics.totalRiskR, 10) }]}>
              %{metrics.totalRiskR.toFixed(1)}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Max DD</Text>
            <Text style={[styles.metricValue, { color: getRiskColor(metrics.maxDrawdown, 15) }]}>
              %{metrics.maxDrawdown.toFixed(1)}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>VaR 95%</Text>
            <Text style={[styles.metricValue, { color: getRiskColor(metrics.var95, 10) }]}>
              %{metrics.var95.toFixed(1)}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Konsantrasyon</Text>
            <Text style={[styles.metricValue, { color: getRiskColor(metrics.concentrationRisk, 100) }]}>
              {metrics.concentrationRisk.toFixed(0)}
            </Text>
          </View>
        </View>

        {/* Sector Exposure */}
        {sectors.length > 0 && (
          <View style={styles.sectorContainer}>
            <Text style={styles.sectorTitle}>Sektör Dağılımı</Text>
            {sectors.map(([sector, exposure], index) => (
              <View key={index} style={styles.sectorRow}>
                <Text style={styles.sectorName}>{sector}</Text>
                <View style={styles.sectorBarBg}>
                  <View
                    style={[
                      styles.sectorBarFill,
                      { width: `${Math.min(exposure, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.sectorValue}>{exposure.toFixed(0)}%</Text>
              </View>
            ))}
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
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
    alignItems: 'center',
    gap: Theme.spacing.small,
    marginBottom: Theme.spacing.small,
  },
  icon: {
    fontSize: 20,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  verdict: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.positive,
  },
  positionInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.small,
    marginBottom: Theme.spacing.small,
  },
  infoItem: {
    flex: 1,
    minWidth: 80,
    backgroundColor: `${Theme.colors.textSecondary}10`,
    padding: Theme.spacing.small,
    borderRadius: Theme.radius.small,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    color: Theme.colors.textTertiary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  reasonContainer: {
    padding: Theme.spacing.small,
    backgroundColor: `${Theme.colors.textSecondary}10`,
    borderRadius: Theme.radius.small,
    marginBottom: Theme.spacing.small,
  },
  reasonText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  warningsContainer: {
    gap: 4,
  },
  warningsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.warning,
    marginBottom: 4,
  },
  warningItem: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    paddingLeft: Theme.spacing.small,
  },
  riskBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
  },
  riskBarLabel: {
    fontSize: 10,
    color: Theme.colors.textTertiary,
    flex: 1,
  },
  riskBarBg: {
    flex: 2,
    height: 4,
    backgroundColor: `${Theme.colors.textSecondary}20`,
    borderRadius: 2,
    overflow: 'hidden',
  },
  riskBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
  },
  riskBarValue: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    width: 40,
    textAlign: 'right',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.small,
  },
  metricItem: {
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
    padding: Theme.spacing.small,
    backgroundColor: `${Theme.colors.textSecondary}10`,
    borderRadius: Theme.radius.small,
  },
  metricLabel: {
    fontSize: 10,
    color: Theme.colors.textTertiary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectorContainer: {
    marginTop: Theme.spacing.small,
    gap: Theme.spacing.small,
  },
  sectorTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  sectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
  },
  sectorName: {
    fontSize: 11,
    color: Theme.colors.textTertiary,
    width: 80,
  },
  sectorBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: `${Theme.colors.textSecondary}20`,
    borderRadius: 2,
    overflow: 'hidden',
  },
  sectorBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
  },
  sectorValue: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    width: 40,
    textAlign: 'right',
  },
});
