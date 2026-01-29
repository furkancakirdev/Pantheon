/**
 * PANTHEON LOADING SPINNER
 * Various loading indicators for the app
 * Based on Argus Terminal loading states
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';

import { Theme } from '../../constants/Theme';
import { PantheonLogo } from './PantheonLogo';

// ============ PROPS ============
export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
}

// ============ ROTATING RING SPINNER ============
const RingSpinner: React.FC<{ size: number; color: string }> = ({ size, color }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.ringSpinner,
        {
          width: size,
          height: size,
          transform: [{ rotate: rotateInterpolate }],
        },
      ]}
    >
      <View style={[styles.ringSegment, { backgroundColor: color }]} />
      <View style={[styles.ringSegment, styles.ringSegment2, { backgroundColor: color }]} />
      <View style={[styles.ringSegment, styles.ringSegment3, { backgroundColor: color }]} />
    </Animated.View>
  );
};

// ============ DOT PULSE SPINNER ============
const DotSpinner: React.FC<{ size: number; color: string }> = ({ size, color }) => {
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const scale3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animate = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1.5,
            duration: 600,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
    };

    animate(scale1, 0).start();
    animate(scale2, 200).start();
    animate(scale3, 400).start();
  }, []);

  const dotSize = size / 5;

  return (
    <View style={styles.dotContainer}>
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            backgroundColor: color,
            transform: [{ scale: scale1 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            backgroundColor: color,
            transform: [{ scale: scale2 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            backgroundColor: color,
            transform: [{ scale: scale3 }],
          },
        ]}
      />
    </View>
  );
};

// ============ BAR SPINNER ============
const BarSpinner: React.FC<{ width: number; height: number; color: string }> = ({
  width,
  height,
  color,
}) => {
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const scale3 = useRef(new Animated.Value(1)).current;
  const scale4 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animate = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1.3,
            duration: 400,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    animate(scale1, 0).start();
    animate(scale2, 100).start();
    animate(scale3, 200).start();
    animate(scale4, 300).start();
  }, []);

  const barWidth = width / 6;

  return (
    <View style={[styles.barContainer, { width, height }]}>
      <Animated.View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: height * 0.6,
            backgroundColor: color,
            transform: [{ scaleY: scale1 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: height * 0.6,
            backgroundColor: color,
            transform: [{ scaleY: scale2 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: height * 0.6,
            backgroundColor: color,
            transform: [{ scaleY: scale3 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: height * 0.6,
            backgroundColor: color,
            transform: [{ scaleY: scale4 }],
          },
        ]}
      />
    </View>
  );
};

// ============ PROGRESS SPINNER ============
export interface ProgressSpinnerProps {
  progress: number; // 0-100
  size?: number;
  color?: string;
  showPercentage?: boolean;
}

export const ProgressSpinner: React.FC<ProgressSpinnerProps> = ({
  progress,
  size = 60,
  color = Theme.colors.accent,
  showPercentage = true,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '-90deg'],
  });

  const radius = size / 2 - 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={styles.progressContainer}>
      {/* Background circle */}
      <View
        style={[
          styles.progressCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 4,
            borderColor: Theme.colors.secondaryBackground,
          },
        ]}
      />

      {/* Progress arc (simulated with rotation) */}
      <View
        style={[
          styles.progressArc,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderLeftWidth: 4,
            borderRightWidth: 4,
            borderBottomWidth: 4,
            borderTopWidth: 4,
            borderColor: 'transparent',
            borderLeftColor: color,
            borderRightColor: color,
            transform: [{ rotate: `${(progress / 100) * 360}deg` }],
          },
        ]}
      />

      {/* Percentage text */}
      {showPercentage && (
        <View style={styles.progressTextContainer}>
          <Text style={[styles.progressText, { color }]}>{Math.round(progress)}%</Text>
        </View>
      )}
    </View>
  );
};

// ============ MAIN COMPONENT ============
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  text,
  overlay = false,
}) => {
  const sizeMap = {
    small: 30,
    medium: 50,
    large: 80,
  };

  const spinnerSize = sizeMap[size];

  const content = (
    <View style={styles.container}>
      <RingSpinner size={spinnerSize} color={Theme.colors.accent} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );

  if (overlay) {
    return (
      <View style={styles.overlay}>
        <View style={styles.overlayContent}>{content}</View>
      </View>
    );
  }

  return content;
};

// ============ FULL SCREEN LOADING ============
export interface FullScreenLoadingProps {
  text?: string;
  progress?: number;
  showLogo?: boolean;
}

export const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({
  text = 'Yükleniyor...',
  progress,
  showLogo = true,
}) => {
  return (
    <View style={styles.fullScreen}>
      {showLogo && <PantheonLogo size={80} animated={true} variant="icon" />}
      {progress !== undefined ? (
        <ProgressSpinner progress={progress} size={80} showPercentage />
      ) : (
        <DotSpinner size={50} color={Theme.colors.accent} />
      )}
      <Text style={styles.fullScreenText}>{text}</Text>
    </View>
  );
};

// ============ SKELETON LOADING ============
export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  variant?: 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = 100,
  height = 20,
  variant = 'rect',
}) => {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height: height as any,
          borderRadius: variant === 'circle' && typeof width === 'number' ? width / 2 : 4,
          opacity: opacityAnim,
        },
      ]}
    />
  );
};

// ============ SKELETON CARD ============
export const SkeletonCard: React.FC = () => {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <Skeleton width={40} height={40} variant="circle" />
        <View style={styles.skeletonHeaderInfo}>
          <Skeleton width={80} height={16} />
          <Skeleton width={60} height={12} />
        </View>
      </View>
      <View style={styles.skeletonBody}>
        <Skeleton width="100%" height={40} />
        <Skeleton width="100%" height={8} />
      </View>
    </View>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Theme.spacing.medium,
  },
  text: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  overlayContent: {
    padding: Theme.spacing.xLarge,
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.radius.large,
  },
  // Ring Spinner
  ringSpinner: {
    borderRadius: 999,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: Theme.colors.accent,
  },
  ringSegment: {
    position: 'absolute',
    top: -3,
    left: '50%',
    width: 12,
    height: 6,
    marginLeft: -6,
    borderRadius: 3,
  },
  ringSegment2: {
    top: '50%',
    right: -3,
    left: undefined,
    transform: [{ rotate: '90deg' }],
  },
  ringSegment3: {
    bottom: -3,
    top: undefined,
    transform: [{ rotate: '180deg' }],
  },
  // Dot Spinner
  dotContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.small,
  },
  dot: {
    borderRadius: 999,
  },
  // Bar Spinner
  barContainer: {
    flexDirection: 'row',
    alignContent: 'center',
    justifyContent: 'space-between',
  },
  bar: {
    borderRadius: 2,
  },
  // Progress Spinner
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    position: 'absolute',
  },
  progressArc: {
    position: 'absolute',
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    ...Theme.typography.h4,
    fontWeight: '700',
  },
  // Full Screen
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Theme.spacing.large,
    backgroundColor: Theme.colors.background,
  },
  fullScreenText: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
  },
  // Skeleton
  skeleton: {
    backgroundColor: Theme.colors.secondaryBackground,
  },
  skeletonCard: {
    padding: Theme.spacing.medium,
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.radius.medium,
    gap: Theme.spacing.medium,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.medium,
  },
  skeletonHeaderInfo: {
    gap: Theme.spacing.small,
  },
  skeletonBody: {
    gap: Theme.spacing.small,
  },
});

export default LoadingSpinner;
