/**
 * PANTHEON CANDLE CHART
 * OHLC candlestick chart for stock price analysis
 * Based on Argus Terminal CandleChart
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

import { Theme } from '../../constants/Theme';
import { GlassCard } from '../cards/GlassCard';

// ============ CONSTANTS ============
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 32;
const CHART_HEIGHT = 200;
const CANDLE_WIDTH = 8;
const CANDLE_GAP = 4;

// ============ TYPES ============
export interface CandleData {
  timestamp: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// ============ PROPS ============
export interface CandleChartProps {
  data: CandleData[];
  width?: number;
  height?: number;
  showVolume?: boolean;
  showGrid?: boolean;
  onCandlePress?: (index: number, candle: CandleData) => void;
}

// ============ COMPONENT ============
export const CandleChart: React.FC<CandleChartProps> = ({
  data,
  width = CHART_WIDTH,
  height = CHART_HEIGHT,
  showVolume = true,
  showGrid = true,
  onCandlePress,
}) => {
  const [selectedCandle, setSelectedCandle] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { width, height }]}>
        <Text style={styles.emptyText}>Veri yok</Text>
      </View>
    );
  }

  // Calculate min/max for scaling
  const allHighs = data.map((d) => d.high);
  const allLows = data.map((d) => d.low);
  const maxPrice = Math.max(...allHighs);
  const minPrice = Math.min(...allLows);
  const priceRange = maxPrice - minPrice || 1;

  // Volume max
  const maxVolume = Math.max(...data.map((d) => d.volume || 0));

  // Helper: Y position for price
  const getY = (price: number) => {
    return height - ((price - minPrice) / priceRange) * (height - (showVolume ? 40 : 0)) - 10;
  };

  // Helper: X position for index
  const getX = (index: number) => {
    return (index * (CANDLE_WIDTH + CANDLE_GAP));
  };

  // Generate candles
  const candles = data.map((candle, index) => {
    const x = getX(index);
    const isGreen = candle.close >= candle.open;
    const color = isGreen ? Theme.colors.positive : Theme.colors.negative;

    const bodyTop = getY(Math.max(candle.open, candle.close));
    const bodyBottom = getY(Math.min(candle.open, candle.close));
    const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

    const wickTop = getY(candle.high);
    const wickBottom = getY(candle.low);

    // Volume bar
    const volumeHeight = showVolume && candle.volume
      ? (candle.volume / maxVolume) * 30
      : 0;

    return (
      <g key={index}>
        {/* Volume bar */}
        {showVolume && candle.volume && (
          <Rect
            x={x}
            y={height - volumeHeight - 5}
            width={CANDLE_WIDTH}
            height={volumeHeight}
            fill={color + '40'}
          />
        )}

        {/* Wick */}
        <Line
          x1={x + CANDLE_WIDTH / 2}
          y1={wickTop}
          x2={x + CANDLE_WIDTH / 2}
          y2={wickBottom}
          stroke={color}
          strokeWidth="1"
        />

        {/* Body */}
        <Rect
          x={x}
          y={bodyTop}
          width={CANDLE_WIDTH}
          height={bodyHeight}
          fill={color}
        />

        {/* Selection highlight */}
        {selectedCandle === index && (
          <Line
            x1={x - 2}
            y1={10}
            x2={x - 2}
            y2={height - (showVolume ? 40 : 0)}
            stroke={Theme.colors.accent}
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        )}
      </g>
    );
  });

  // Grid lines
  const gridLines = showGrid
    ? [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const y = 10 + ratio * (height - (showVolume ? 50 : 10));
      const price = maxPrice - ratio * priceRange;
      return { y, price };
    })
    : [];

  return (
    <GlassCard style={styles.container}>
      {/* Chart */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Svg width={Math.max(width, data.length * (CANDLE_WIDTH + CANDLE_GAP) + 20)} height={height}>
          {/* Grid lines */}
          {gridLines.map((line, index) => (
            <g key={index}>
              <Line
                x1="0"
                y1={line.y}
                x2={Math.max(width, data.length * (CANDLE_WIDTH + CANDLE_GAP))}
                y2={line.y}
                stroke={Theme.colors.border}
                strokeWidth="0.5"
                strokeDasharray="4,4"
              />
              <SvgText
                x={Math.max(width, data.length * (CANDLE_WIDTH + CANDLE_GAP)) - 5}
                y={line.y + 3}
                fontSize="9"
                fill={Theme.colors.textTertiary}
                textAnchor="end"
              >
                {line.price.toFixed(2)}
              </SvgText>
            </g>
          ))}

          {/* Candles */}
          {candles}
        </Svg>
      </ScrollView>

      {/* Selected info */}
      {selectedCandle !== null && data[selectedCandle] && (
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedDate}>
            {new Date(data[selectedCandle].timestamp).toLocaleDateString('tr-TR')}
          </Text>
          <View style={styles.selectedPrices}>
            <Text style={styles.priceLabel}>O: <Text style={styles.priceValue}>{data[selectedCandle].open.toFixed(2)}</Text></Text>
            <Text style={styles.priceLabel}>H: <Text style={styles.priceValue}>{data[selectedCandle].high.toFixed(2)}</Text></Text>
            <Text style={styles.priceLabel}>L: <Text style={styles.priceValue}>{data[selectedCandle].low.toFixed(2)}</Text></Text>
            <Text style={styles.priceLabel}>C: <Text style={styles.priceValue}>{data[selectedCandle].close.toFixed(2)}</Text></Text>
          </View>
        </View>
      )}
    </GlassCard>
  );
};

// ============ PRICE LINE CHART ============
export interface PriceLineChartProps {
  data: Array<{ timestamp: string | number; price: number }>;
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
}

export const PriceLineChart: React.FC<PriceLineChartProps> = ({
  data,
  width = CHART_WIDTH,
  height = CHART_HEIGHT / 2,
  color,
  showArea = true,
}) => {
  if (data.length < 2) {
    return <View style={[styles.emptyContainer, { width, height }]} />;
  }

  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const lineColor = color || (data[0].price <= data[data.length - 1].price ? Theme.colors.positive : Theme.colors.negative);

  const points = data.map((d, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((d.price - minPrice) / priceRange) * (height - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <Svg width={width} height={height}>
      {showArea && (
        <Polygon
          points={areaPoints}
          fill={lineColor + '20'}
        />
      )}
      <Polyline
        points={points}
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* End dot */}
      <Circle
        cx={width}
        cy={height - ((data[data.length - 1].price - minPrice) / priceRange) * (height - 20) - 10}
        r="4"
        fill={lineColor}
      />
    </Svg>
  );
};

// ============ VOLUME CHART ============
export interface VolumeChartProps {
  data: Array<{ volume: number; timestamp: string | number }>;
  width?: number;
  height?: number;
}

export const VolumeChart: React.FC<VolumeChartProps> = ({
  data,
  width = CHART_WIDTH,
  height = 60,
}) => {
  if (data.length === 0) {
    return <View style={[styles.emptyContainer, { width, height }]} />;
  }

  const maxVolume = Math.max(...data.map((d) => d.volume));
  const barWidth = (width / data.length) * 0.8;

  return (
    <Svg width={width} height={height}>
      {data.map((d, index) => {
        const barHeight = (d.volume / maxVolume) * (height - 10);
        const x = (index / data.length) * width + barWidth * 0.1;
        const y = height - barHeight;

        return (
          <Rect
            key={index}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            fill={Theme.colors.accent + '40'}
            rx="2"
          />
        );
      })}
    </Svg>
  );
};

// ============ TIME RANGE SELECTOR ============
export interface TimeRangeSelectorProps {
  ranges: Array<{ label: string; value: string }>;
  selected: string;
  onSelect: (value: string) => void;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  ranges,
  selected,
  onSelect,
}) => {
  return (
    <View style={styles.rangeSelector}>
      {ranges.map((range) => (
        <TouchableOpacity
          key={range.value}
          style={[
            styles.rangeChip,
            selected === range.value && styles.rangeChipActive,
          ]}
          onPress={() => onSelect(range.value)}
        >
          <Text
            style={[
              styles.rangeLabel,
              selected === range.value && styles.rangeLabelActive,
            ]}
          >
            {range.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ============ CHART HEADER ============
export interface ChartHeaderProps {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  period?: string;
}

export const ChartHeader: React.FC<ChartHeaderProps> = ({
  symbol,
  price,
  change,
  changePercent,
  period,
}) => {
  const isPositive = change >= 0;

  return (
    <View style={styles.chartHeader}>
      <View>
        <Text style={styles.chartSymbol}>{symbol}</Text>
        {period && (
          <Text style={styles.chartPeriod}>{period}</Text>
        )}
      </View>
      <View style={styles.chartPriceInfo}>
        <Text style={styles.chartPrice}>{price.toFixed(2)} ₺</Text>
        <Text
          style={[
            styles.chartChange,
            isPositive && styles.changePositive,
            !isPositive && styles.changeNegative,
          ]}
        >
          {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
        </Text>
      </View>
    </View>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    padding: Theme.spacing.medium,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.medium,
  },
  emptyText: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
  },
  scrollContent: {
    paddingRight: Theme.spacing.medium,
  },
  selectedInfo: {
    marginTop: Theme.spacing.small,
    padding: Theme.spacing.small,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.small,
  },
  selectedDate: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
    marginBottom: 4,
  },
  selectedPrices: {
    flexDirection: 'row',
    gap: Theme.spacing.medium,
  },
  priceLabel: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textSecondary,
  },
  priceValue: {
    ...Theme.typography.captionSmall,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  rangeSelector: {
    flexDirection: 'row',
    gap: Theme.spacing.small,
    marginBottom: Theme.spacing.medium,
  },
  rangeChip: {
    flex: 1,
    paddingVertical: Theme.spacing.small,
    paddingHorizontal: Theme.spacing.medium,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.small,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  rangeChipActive: {
    backgroundColor: `${Theme.colors.accent}20`,
    borderColor: Theme.colors.accent,
  },
  rangeLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  rangeLabelActive: {
    color: Theme.colors.accent,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.medium,
  },
  chartSymbol: {
    ...Theme.typography.h3,
    fontWeight: '700',
  },
  chartPeriod: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
  },
  chartPriceInfo: {
    alignItems: 'flex-end',
  },
  chartPrice: {
    ...Theme.typography.h3,
    fontWeight: '700',
  },
  chartChange: {
    ...Theme.typography.bodySmall,
    fontWeight: '600',
  },
  changePositive: {
    color: Theme.colors.positive,
  },
  changeNegative: {
    color: Theme.colors.negative,
  },
});

// TypeScript compatibility
const Polyline = (props: any) => <polyline {...props} />;
const Polygon = (props: any) => <polygon {...props} />;
const Circle = (props: any) => <circle {...props} />;
const TextSVG = (props: any) => <text {...props} />;

export default CandleChart;
