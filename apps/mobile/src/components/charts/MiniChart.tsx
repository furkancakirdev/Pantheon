/**
 * PANTHEON MINI CHART
 * Sparkline-style mini chart for lists
 * Based on Argus Terminal MiniChart
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Line, Circle, Area, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import { Theme } from '../../constants/Theme';

// ============ CONSTANTS ============
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_WIDTH = 80;
const DEFAULT_HEIGHT = 40;

// ============ PROPS ============
export interface MiniChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
  type?: 'line' | 'area' | 'bar';
}

// ============ COMPONENT ============
export const MiniChart: React.FC<MiniChartProps> = ({
  data,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  color,
  showDots = false,
  type = 'line',
}) => {
  if (data.length < 2) {
    return <View style={[styles.placeholder, { width, height }]} />;
  }

  // Determine color based on trend
  const getTrendColor = () => {
    if (color) return color;
    const first = data[0];
    const last = data[data.length - 1];
    return last >= first ? Theme.colors.positive : Theme.colors.negative;
  };

  const strokeColor = getTrendColor();

  // Normalize data to fit in chart
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height * 0.8 - height * 0.1;
    return `${x},${y}`;
  });

  const polylinePoints = points.join(' ');

  if (type === 'bar') {
    const barWidth = (width / data.length) * 0.7;
    const bars = data.map((value, index) => {
      const x = (index / data.length) * width + barWidth * 0.15;
      const barHeight = ((value - min) / range) * height * 0.8;
      const y = height - barHeight - height * 0.1;
      const barColor = value >= data[Math.max(0, index - 1)]
        ? Theme.colors.positive
        : Theme.colors.negative;

      return (
        <Rect
          key={index}
          x={x}
          y={y}
          width={barWidth}
          height={barHeight}
          fill={barColor}
          opacity={0.8}
        />
      );
    });

    return (
      <Svg width={width} height={height}>
        {bars}
      </Svg>
    );
  }

  if (type === 'area') {
    // Area chart with gradient fill
    const areaPoints = [
      `0,${height}`,
      ...points,
      `${width},${height}`,
    ].join(' ');

    return (
      <Svg width={width} height={height}>
        <Polygon
          points={areaPoints}
          fill={strokeColor + '30'}
        />
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  // Default line chart
  return (
    <Svg width={width} height={height}>
      {/* Background grid lines */}
      <Line
        x1="0"
        y1={height * 0.25}
        x2={width}
        y2={height * 0.25}
        stroke={Theme.colors.border}
        strokeWidth="0.5"
        strokeDasharray="2,2"
      />
      <Line
        x1="0"
        y1={height * 0.5}
        x2={width}
        y2={height * 0.5}
        stroke={Theme.colors.border}
        strokeWidth="0.5"
        strokeDasharray="2,2"
      />
      <Line
        x1="0"
        y1={height * 0.75}
        x2={width}
        y2={height * 0.75}
        stroke={Theme.colors.border}
        strokeWidth="0.5"
        strokeDasharray="2,2"
      />

      {/* Main line */}
      <Polyline
        points={polylinePoints}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* End dot */}
      {showDots && data.length > 0 && (
        <Circle
          cx={width}
          cy={
            height -
            ((data[data.length - 1] - min) / range) * height * 0.8 -
            height * 0.1
          }
          r="3"
          fill={strokeColor}
        />
      )}
    </Svg>
  );
};

// ============ CANDLE MINI (simplified candlesticks) ============
export interface CandleMiniProps {
  data: Array<{ open: number; high: number; low: number; close: number }>;
  width?: number;
  height?: number;
}

export const CandleMini: React.FC<CandleMiniProps> = ({
  data,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
}) => {
  if (data.length === 0) {
    return <View style={[styles.placeholder, { width, height }]} />;
  }

  const minLow = Math.min(...data.map((d) => d.low));
  const maxHigh = Math.max(...data.map((d) => d.high));
  const range = maxHigh - minLow || 1;

  const candleWidth = (width / data.length) * 0.7;

  return (
    <Svg width={width} height={height}>
      {data.map((candle, index) => {
        const x = (index / data.length) * width + candleWidth * 0.15;
        const isGreen = candle.close >= candle.open;
        const color = isGreen ? Theme.colors.positive : Theme.colors.negative;

        const bodyTop =
          height -
          ((Math.max(candle.open, candle.close) - minLow) / range) *
            height *
            0.8 -
          height * 0.1;
        const bodyBottom =
          height -
          ((Math.min(candle.open, candle.close) - minLow) / range) *
            height *
            0.8 -
          height * 0.1;
        const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

        const wickTop =
          height -
          ((candle.high - minLow) / range) * height * 0.8 -
          height * 0.1;
        const wickBottom =
          height -
          ((candle.low - minLow) / range) * height * 0.8 -
          height * 0.1;

        return (
          <g key={index}>
            {/* Wick */}
            <Line
              x1={x + candleWidth / 2}
              y1={wickTop}
              x2={x + candleWidth / 2}
              y2={wickBottom}
              stroke={color}
              strokeWidth="1"
            />
            {/* Body */}
            <Rect
              x={x}
              y={bodyTop}
              width={candleWidth}
              height={bodyHeight}
              fill={color}
            />
          </g>
        );
      })}
    </Svg>
  );
};

// ============ VERTICAL BAR CHART ============
export interface VerticalBarProps {
  values: number[];
  labels?: string[];
  width?: number;
  height?: number;
  color?: string;
}

export const VerticalBar: React.FC<VerticalBarProps> = ({
  values,
  labels,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  color,
}) => {
  if (values.length === 0) {
    return <View style={[styles.placeholder, { width, height }]} />;
  }

  const max = Math.max(...values);
  const barWidth = (width / values.length) * 0.8;

  return (
    <Svg width={width} height={height}>
      {values.map((value, index) => {
        const barHeight = (value / max) * height * 0.9;
        const x = (index / values.length) * width + barWidth * 0.1;
        const y = height - barHeight;

        const barColor =
          color ||
          (value >= 70
            ? Theme.colors.positive
            : value >= 40
            ? Theme.colors.warning
            : Theme.colors.negative);

        return (
          <g key={index}>
            <Rect x={x} y={y} width={barWidth} height={barHeight} fill={barColor} rx="2" />
            {labels && (
              <Text
                x={x + barWidth / 2}
                y={height - 2}
                fontSize="8"
                fill={Theme.colors.textTertiary}
                textAnchor="middle"
              >
                {labels[index]}
              </Text>
            )}
          </g>
        );
      })}
    </Svg>
  );
};

// ============ SCORE GAUGE ============
export interface ScoreGaugeProps {
  score: number;
  size?: number;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, size = 60 }) => {
  const center = size / 2;
  const radius = (size / 2) - 5;

  // Determine color
  const color =
    score >= 70
      ? Theme.colors.positive
      : score >= 40
      ? Theme.colors.warning
      : Theme.colors.negative;

  // Calculate angle (180 degrees = half circle)
  const startAngle = 180;
  const endAngle = 0;
  const scoreAngle = startAngle - (score / 100) * (startAngle - endAngle);

  // Convert polar to cartesian
  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const start = polarToCartesian(center, center, radius, startAngle);
  const end = polarToCartesian(center, center, radius, scoreAngle);

  const largeArcFlag = scoreAngle < 90 ? 0 : 1;

  const pathData = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;

  return (
    <Svg width={size} height={size / 2}>
      {/* Background arc */}
      <Path
        d={`M ${polarToCartesian(center, center, radius, 180).x} ${
          polarToCartesian(center, center, radius, 180).y
        } A ${radius} ${radius} 0 0 1 ${polarToCartesian(center, center, radius, 0).x} ${
          polarToCartesian(center, center, radius, 0).y
        }`}
        fill="none"
        stroke={Theme.colors.secondaryBackground}
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Value arc */}
      <Path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
      />
    </Svg>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.small,
  },
});

// For TypeScript compatibility
const Rect = (props: any) => <rect {...props} />;
const Text = (props: any) => <text {...props} />;

export default MiniChart;
