/**
 * PANTHEON LOGO COMPONENT
 * Animated Pantheon logo (Argus Eye variant)
 * Based on Argus Terminal ShiningLogoView
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

import { Theme } from '../../constants/Theme';

// ============ PROPS ============
export interface PantheonLogoProps {
  size?: number;
  animated?: boolean;
  variant?: 'full' | 'icon' | 'text' | 'compact';
}

// ============ FULL LOGO WITH EYE ============
const LogoWithEye: React.FC<{ size: number; animated: boolean }> = ({
  size,
  animated,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, [animated]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.logoContainer, { width: size, height: size }]}>
      {/* Outer ring */}
      <Animated.View
        style={[
          styles.outerRing,
          {
            width: size,
            height: size,
            transform: animated ? [{ rotate: rotateInterpolate }] : undefined,
          },
        ]}
      >
        <View style={[styles.ringSegment, { backgroundColor: '#FFD700' }]} />
        <View style={[styles.ringSegment, styles.ringSegment2, { backgroundColor: '#FFD700' }]} />
        <View style={[styles.ringSegment, styles.ringSegment3, { backgroundColor: '#FFD700' }]} />
        <View style={[styles.ringSegment, styles.ringSegment4, { backgroundColor: '#FFD700' }]} />
      </Animated.View>

      {/* Inner glow */}
      <Animated.View
        style={[
          styles.innerGlow,
          {
            width: size * 0.7,
            height: size * 0.7,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View style={[styles.glowLayer, { backgroundColor: '#FFD70020' }]} />
        <View style={[styles.glowLayer, styles.glowLayer2, { backgroundColor: '#FFD70010' }]} />
      </Animated.View>

      {/* Eye */}
      <View
        style={[
          styles.eye,
          {
            width: size * 0.35,
            height: size * 0.35,
          },
        ]}
      >
        <View style={styles.eyeOuter} />
        <View style={styles.eyeInner}>
          <View style={styles.pupil}>
            <View style={styles.pupilHighlight} />
          </View>
        </View>
      </View>
    </View>
  );
};

// ============ ICON ONLY ============
const LogoIcon: React.FC<{ size: number; animated: boolean }> = ({
  size,
  animated,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animated]);

  return (
    <Animated.View
      style={[
        styles.iconContainer,
        {
          width: size,
          height: size,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <Text style={[styles.iconText, { fontSize: size * 0.6 }]}>👁️</Text>
    </Animated.View>
  );
};

// ============ TEXT ONLY ============
const LogoText: React.FC<{ size?: number }> = ({ size = 100 }) => {
  return (
    <View style={styles.textContainer}>
      <Text style={[styles.textMain, { fontSize: size * 0.4 }]}>PANTHEON</Text>
      <Text style={[styles.textSub, { fontSize: size * 0.12 }]}>TRADING OS</Text>
    </View>
  );
};

// ============ COMPACT ============
const LogoCompact: React.FC<{ size: number }> = ({ size }) => {
  return (
    <View style={styles.compactContainer}>
      <Text style={[styles.compactIcon, { fontSize: size * 0.5 }]}>👁️</Text>
      <Text style={[styles.compactText, { fontSize: size * 0.25 }]}>PAN</Text>
    </View>
  );
};

// ============ MAIN COMPONENT ============
export const PantheonLogo: React.FC<PantheonLogoProps> = ({
  size = 60,
  animated = true,
  variant = 'icon',
}) => {
  switch (variant) {
    case 'full':
      return <LogoWithEye size={size} animated={animated} />;
    case 'icon':
      return <LogoIcon size={size} animated={animated} />;
    case 'text':
      return <LogoText size={size} />;
    case 'compact':
      return <LogoCompact size={size} />;
    default:
      return <LogoIcon size={size} animated={animated} />;
  }
};

// ============ LOGO BADGE (for headers) ============
export interface LogoBadgeProps {
  size?: number;
}

export const LogoBadge: React.FC<LogoBadgeProps> = ({ size = 40 }) => {
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <Text style={[styles.badgeText, { fontSize: size * 0.5 }]}>P</Text>
    </View>
  );
};

// ============ SPLASH LOGO ============
export const SplashLogo: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <LogoWithEye size={160} animated={true} />
      <Text style={styles.splashTitle}>PANTHEON</Text>
      <Text style={styles.splashSubtitle}>TRADING OS</Text>
    </Animated.View>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  ringSegment: {
    position: 'absolute',
    top: -2,
    left: '50%',
    width: 20,
    height: 4,
    marginLeft: -10,
    borderRadius: 2,
  },
  ringSegment2: {
    top: '50%',
    right: -2,
    left: undefined,
    marginLeft: 0,
    transform: [{ rotate: '90deg' }],
  },
  ringSegment3: {
    bottom: -2,
    top: undefined,
    transform: [{ rotate: '180deg' }],
  },
  ringSegment4: {
    top: '50%',
    left: -2,
    transform: [{ rotate: '270deg' }],
  },
  innerGlow: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  glowLayer2: {
    margin: '20%',
  },
  eye: {
    borderRadius: 999,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeOuter: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  eyeInner: {
    width: '60%',
    height: '60%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pupil: {
    width: '50%',
    height: '50%',
    borderRadius: 999,
    backgroundColor: '#FFD700',
    position: 'relative',
  },
  pupilHighlight: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    width: '30%',
    height: '30%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  // Icon
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    // filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))', // RN doesn't support filter
  },
  // Text
  textContainer: {
    alignItems: 'center',
  },
  textMain: {
    fontWeight: '900',
    letterSpacing: 4,
    color: '#FFD700',
  },
  textSub: {
    letterSpacing: 6,
    color: Theme.colors.textSecondary,
  },
  // Compact
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactIcon: {
    // filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.4))',
  },
  compactText: {
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 2,
  },
  // Badge
  badge: {
    borderRadius: 999,
    backgroundColor: `${Theme.colors.primary}20`,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontWeight: '900',
    color: Theme.colors.primary,
  },
  // Splash
  splashTitle: {
    ...Theme.typography.h1,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 6,
    color: '#FFD700',
    textAlign: 'center',
    marginTop: Theme.spacing.large,
  },
  splashSubtitle: {
    ...Theme.typography.body,
    letterSpacing: 10,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default PantheonLogo;
