/**
 * PANTHEON SPLASH SCREEN
 * Launch screen with animated logo
 * Based on Argus Terminal SplashScreen
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../constants/Theme';

// ============ SPLASH SCREEN PROPS ============
interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

// ============ ANIMATED LOGO ============
interface AnimatedLogoProps {
  size?: number;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ size = 120 }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial appearance
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Continuous rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <View style={styles.logoContainer}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.logoGlow,
          {
            width: size,
            height: size,
            transform: [{ scale: glowScale }],
          },
        ]}
      >
        <View style={[styles.glowInner, { backgroundColor: '#FFD70020' }]} />
        <View style={[styles.glowMiddle, { backgroundColor: '#FFD70010' }]} />
      </Animated.View>

      {/* Rotating ring */}
      <Animated.View
        style={[
          styles.logoRing,
          {
            width: size,
            height: size,
            transform: [{ rotate: rotateInterpolate }],
          },
        ]}
      >
        <View style={styles.ringSegment1} />
        <View style={styles.ringSegment2} />
        <View style={styles.ringSegment3} />
      </Animated.View>

      {/* Central eye */}
      <Animated.View
        style={[
          styles.logoEye,
          {
            width: size * 0.4,
            height: size * 0.4,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.eyeInner}>
          <View style={styles.eyePupil} />
        </View>
      </Animated.View>
    </View>
  );
};

// ============ MAIN SPLASH SCREEN ============
export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  duration = 2500,
}) => {
  const fadeOpacity = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Fade out
      Animated.timing(fadeOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onComplete?.();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, fadeOpacity, onComplete]);

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom, opacity: fadeOpacity },
      ]}
    >
      {/* Background with nebula effect */}
      <View style={styles.background}>
        <View style={[styles.nebula1, { backgroundColor: '#00A8FF10' }]} />
        <View style={[styles.nebula2, { backgroundColor: '#FFD70008' }]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <AnimatedLogo size={140} />

        {/* Title */}
        <Animated.View style={styles.titleContainer}>
          <Text style={styles.title}>PANTHEON</Text>
          <Text style={styles.subtitle}>TRADING OS</Text>
        </Animated.View>

        {/* Tagline */}
        <Text style={styles.tagline}>Grand Council AI</Text>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBar}>
            <Animated.View
              style={[
                styles.loadingFill,
                {
                  backgroundColor: '#FFD700',
                },
              ]}
            >
              <View style={styles.loadingGlow} />
            </Animated.View>
          </View>
        </View>

        {/* Version */}
        <Text style={styles.version}>v1.0.0</Text>
      </View>

      {/* Bottom info */}
      <View style={styles.bottom}>
        <Text style={styles.bottomText}>Powered by Grand Council AI</Text>
      </View>
    </Animated.View>
  );
};

// ============ MINI SPLASH (for transitions) ============
interface MiniSplashProps {
  visible: boolean;
  message?: string;
}

export const MiniSplash: React.FC<MiniSplashProps> = ({ visible, message }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.miniSplash, { opacity }]}>
      <Text style={styles.miniLogo}>👁️</Text>
      {message && <Text style={styles.miniMessage}>{message}</Text>}
    </Animated.View>
  );
};

// ============ STYLES ============
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  nebula1: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_WIDTH * 1.5,
    borderRadius: 999,
    top: -SCREEN_WIDTH * 0.4,
    left: -SCREEN_WIDTH * 0.3,
  },
  nebula2: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_WIDTH * 1.2,
    borderRadius: 999,
    bottom: -SCREEN_WIDTH * 0.3,
    right: -SCREEN_WIDTH * 0.2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Theme.spacing.large,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  glowMiddle: {
    ...StyleSheet.absoluteFillObject,
    margin: '20%',
    borderRadius: 999,
  },
  logoRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  ringSegment1: {
    position: 'absolute',
    top: -2,
    left: '50%',
    width: 20,
    height: 4,
    marginLeft: -10,
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  ringSegment2: {
    position: 'absolute',
    right: -2,
    top: '50%',
    width: 4,
    height: 20,
    marginTop: -10,
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  ringSegment3: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    width: 20,
    height: 4,
    marginLeft: -10,
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  logoEye: {
    borderRadius: 999,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeInner: {
    width: '60%',
    height: '60%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyePupil: {
    width: '50%',
    height: '50%',
    borderRadius: 999,
    backgroundColor: '#FFD700',
  },
  titleContainer: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    ...Theme.typography.h1,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#FFD700',
  },
  subtitle: {
    ...Theme.typography.body,
    letterSpacing: 8,
    color: Theme.colors.textSecondary,
  },
  tagline: {
    ...Theme.typography.body,
    color: Theme.colors.textTertiary,
    letterSpacing: 2,
  },
  loadingContainer: {
    width: 120,
    gap: 8,
  },
  loadingBar: {
    height: 3,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.pill,
    overflow: 'hidden',
  },
  loadingFill: {
    height: '100%',
    width: '100%',
    borderRadius: Theme.radius.pill,
  },
  loadingGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF',
    opacity: 0.3,
  },
  version: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
  },
  bottom: {
    position: 'absolute',
    bottom: Theme.spacing.xLarge + 20,
    alignItems: 'center',
  },
  bottomText: {
    ...Theme.typography.caption,
    color: Theme.colors.textTertiary,
  },
  // Mini Splash
  miniSplash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 5, 5, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Theme.spacing.medium,
    zIndex: 9999,
  },
  miniLogo: {
    fontSize: 48,
  },
  miniMessage: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
  },
});

export default SplashScreen;
