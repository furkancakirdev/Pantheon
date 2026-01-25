/**
 * PANTHEON RADAR CHART
 * 8-axis radar chart for module comparison
 * Based on Argus Terminal RadarChart
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polygon, Polyline, Circle, Line } from 'react-native-svg';

import { Theme } from '../../constants/Theme';
import { MODULE_INFO } from '../cards/AnalysisCard';

// ============ CONSTANTS ============
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_SIZE = Math.min(SCREEN_WIDTH - 60, 300);
const CENTER = CHART_SIZE / 2;
const RADIUS = (CHART_SIZE / 2) - 50;

const MODULES = Object.keys(MODULE_INFO).slice(0, 8);

// ============ PROPS ============
export interface RadarChartProps {
  scores: Record<string, number>;
  size?: number;
  showLabels?: boolean;
  showGrid?: boolean;
}

// ============ COMPONENT ============
export const RadarChart: React.FC<RadarChartProps> = ({
  scores,
  size = CHART_SIZE,
  showLabels = true,
  showGrid = true,
}) => {
  const center = size / 2;
  const radius = (size / 2) - 50;

  // Generate polygon points for a given scale (0-1)
  const generatePoints = (scale: number) => {
    return MODULES.map((module, index) => {
      const angle = (Math.PI * 2 * index) / MODULES.length - Math.PI / 2;
      const value = ((scores[module] || 50) / 100) * scale;
      const x = center + Math.cos(angle) * (radius * value);
      const y = center + Math.sin(angle) * (radius * value);
      return `${x},${y}`;
    }).join(' ');
  };

  // Generate grid circles (25%, 50%, 75%, 100%)
  const gridCircles = [0.25, 0.5, 0.75, 1].map((scale) => {
    const points = MODULES.map((_, index) => {
      const angle = (Math.PI * 2 * index) / MODULES.length - Math.PI / 2;
      const x = center + Math.cos(angle) * (radius * scale);
      const y = center + Math.sin(angle) * (radius * scale);
      return `${x},${y}`;
    }).join(' ');

    return { scale, points };
  });

  // Generate axis lines
  const axisLines = MODULES.map((_, index) => {
    const angle = (Math.PI * 2 * index) / MODULES.length - Math.PI / 2;
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    return { x1: center, y1: center, x2: x, y2: y };
  });

  // Generate label positions
  const labels = MODULES.map((module, index) => {
    const angle = (Math.PI * 2 * index) / MODULES.length - Math.PI / 2;
    const labelRadius = radius + 30;
    const x = center + Math.cos(angle) * labelRadius;
    const y = center + Math.sin(angle) * labelRadius;
    return { module, x, y };
  });

  // Data points
  const dataPoints = generatePoints(0.85);

  // Calculate average score
  const averageScore =
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length || 0;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Grid circles */}
        {showGrid &&
          gridCircles.map((circle) => (
            <Polygon
              key={`grid-${circle.scale}`}
              points={circle.points}
              fill="none"
              stroke={Theme.colors.border}
              strokeWidth="1"
            />
          ))}

        {/* Axis lines */}
        {showGrid &&
          axisLines.map((line, index) => (
            <Line
              key={`axis-${index}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={Theme.colors.border}
              strokeWidth="1"
            />
          ))}

        {/* Data polygon with gradient effect */}
        <Polygon
          points={dataPoints}
          fill={Theme.colors.accent + '30'}
          stroke={Theme.colors.accent}
          strokeWidth="2"
        />

        {/* Data points */}
        {MODULES.map((module, index) => {
          const angle = (Math.PI * 2 * index) / MODULES.length - Math.PI / 2;
          const value = ((scores[module] || 50) / 100) * 0.85;
          const x = center + Math.cos(angle) * (radius * value);
          const y = center + Math.sin(angle) * (radius * value);

          return (
            <Circle
              key={module}
              cx={x}
              cy={y}
              r="5"
              fill={
                (scores[module] || 50) >= 70
                  ? Theme.colors.positive
                  : (scores[module] || 50) >= 40
                  ? Theme.colors.warning
                  : Theme.colors.negative
              }
              stroke={Theme.colors.background}
              strokeWidth="2"
            />
          );
        })}
      </Svg>

      {/* Labels */}
      {showLabels && (
        <>
          {labels.map((label) => (
            <View
              key={label.module}
              style={[
                styles.label,
                {
                  left: label.x - 15,
                  top: label.y - 10,
                },
              ]}
            >
              <Text style={styles.labelIcon}>
                {MODULE_INFO[label.module]?.icon || '📊'}
              </Text>
            </View>
          ))}

          {/* Center score */}
          <View style={[styles.centerScore, { left: center - 15, top: center - 12 }]}>
            <Text style={styles.centerScoreText}>{Math.round(averageScore)}</Text>
          </View>
        </>
      )}
    </View>
  );
};

// ============ MINI RADAR ============
export interface RadarChartMiniProps {
  scores: Record<string, number>;
  size?: number;
}

export const RadarChartMini: React.FC<RadarChartMiniProps> = ({
  scores,
  size = 120,
}) => {
  const center = size / 2;
  const radius = (size / 2) - 15;

  const dataPoints = MODULES.slice(0, 6).map((module, index) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
    const value = ((scores[module] || 50) / 100) * 0.9;
    const x = center + Math.cos(angle) * (radius * value);
    const y = center + Math.sin(angle) * (radius * value);
    return `${x},${y}`;
  }).join(' ');

  const gridPoints = MODULES.slice(0, 6).map((_, index) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={[styles.miniContainer, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Polygon
          points={gridPoints}
          fill="none"
          stroke={Theme.colors.border}
          strokeWidth="0.5"
        />
        <Polygon
          points={dataPoints}
          fill={Theme.colors.accent + '40'}
          stroke={Theme.colors.accent}
          strokeWidth="1"
        />
      </Svg>
    </View>
  );
};

// ============ RADAR COMPARISON (2 datasets) ============
export interface RadarChartComparisonProps {
  primaryScores: Record<string, number>;
  secondaryScores: Record<string, number>;
  size?: number;
  primaryLabel?: string;
  secondaryLabel?: string;
}

export const RadarChartComparison: React.FC<RadarChartComparisonProps> = ({
  primaryScores,
  secondaryScores,
  size = CHART_SIZE,
  primaryLabel = 'Seçili',
  secondaryLabel = 'Piyasa',
}) => {
  const center = size / 2;
  const radius = (size / 2) - 50;

  const primaryPoints = MODULES.map((module, index) => {
    const angle = (Math.PI * 2 * index) / MODULES.length - Math.PI / 2;
    const value = ((primaryScores[module] || 50) / 100) * 0.8;
    const x = center + Math.cos(angle) * (radius * value);
    const y = center + Math.sin(angle) * (radius * value);
    return `${x},${y}`;
  }).join(' ');

  const secondaryPoints = MODULES.map((module, index) => {
    const angle = (Math.PI * 2 * index) / MODULES.length - Math.PI / 2;
    const value = ((secondaryScores[module] || 50) / 100) * 0.6;
    const x = center + Math.cos(angle) * (radius * value);
    const y = center + Math.sin(angle) * (radius * value);
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={styles.comparisonContainer}>
      <Svg width={size} height={size}>
        {/* Secondary polygon (background) */}
        <Polygon
          points={secondaryPoints}
          fill={Theme.colors.neutral + '30'}
          stroke={Theme.colors.neutral}
          strokeWidth="1"
        />

        {/* Primary polygon (foreground) */}
        <Polygon
          points={primaryPoints}
          fill={Theme.colors.accent + '30'}
          stroke={Theme.colors.accent}
          strokeWidth="2"
        />
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: Theme.colors.accent }]}
          />
          <Text style={styles.legendText}>{primaryLabel}</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: Theme.colors.neutral }]}
          />
          <Text style={styles.legendText}>{secondaryLabel}</Text>
        </View>
      </View>
    </View>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  label: {
    position: 'absolute',
    width: 30,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelIcon: {
    fontSize: 16,
  },
  centerScore: {
    position: 'absolute',
    width: 30,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  centerScoreText: {
    ...Theme.typography.caption,
    fontWeight: '700',
    color: Theme.colors.accent,
  },
  miniContainer: {
    alignSelf: 'center',
  },
  comparisonContainer: {
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    gap: Theme.spacing.large,
    marginTop: Theme.spacing.medium,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
  },
});

export default RadarChart;
