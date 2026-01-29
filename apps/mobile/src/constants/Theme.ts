/**
 * PANTHEON DESIGN SYSTEM
 * Based on Argus Terminal (ADS) - Dark Space Theme
 *
 * Color Philosophy:
 * - Void Black background for focus
 * - Cyber Blue for technology/innovation
 * - Argus Gold for wisdom/premium
 * - Neon signals for clear action indicators
 */

import { TextStyle, ViewStyle } from 'react-native';

// ============ COLOR PALETTE ============
export const Colors = {
  // Backgrounds (Deep Space)
  background: '#050505' as string,          // Void Black
  secondaryBackground: '#0A0A0E' as string, // Deep Nebula
  cardBackground: '#12121A' as string,      // Glass Base

  // Brand Identity
  primary: '#FFD700' as string,             // Argus Gold (Wisdom)
  accent: '#00A8FF' as string,              // Cyber Blue (Tech)

  // Signal Colors (Neon)
  positive: '#00FFA3' as string,            // Cyber Green
  negative: '#FF2E55' as string,            // Crimson Red
  warning: '#FFD740' as string,             // Amber
  neutral: '#565E6D' as string,             // Steel Gray

  // Typography
  text: '#FFFFFF' as string,
  textPrimary: '#FFFFFF' as string,
  textSecondary: '#8A8F98' as string,       // Stardust Gray
  textTertiary: '#4A4F58' as string,

  // Border & Overlay
  border: 'rgba(255, 255, 255, 0.1)' as string,
  borderLight: 'rgba(255, 255, 255, 0.15)' as string,
  overlay: 'rgba(0, 0, 0, 0.5)' as string,
};

// ============ VERDICT COLORS ============
export const VerdictColors: Record<string, string> = {
  'GÜÇLÜ AL': Colors.positive,
  'AL': Colors.positive,
  'TUT': Colors.warning,
  'BEKLE': Colors.neutral,
  'SAT': Colors.negative,
  'GÜÇLÜ SAT': Colors.negative,
};

export const getVerdictColor = (verdict?: string): string => {
  if (!verdict) return Colors.neutral;
  return VerdictColors[verdict.toUpperCase()] ?? Colors.neutral;
};

// ============ SPACING ============
export const Spacing = {
  tiny: 4,
  xSmall: 2,
  small: 8,
  medium: 16,
  large: 24,
  xLarge: 32,
  xxLarge: 48,
} as const;

// ============ RADIUS ============
export const Radius = {
  small: 8,
  medium: 12,
  large: 16,
  xLarge: 20,
  pill: 999,
} as const;

// ============ SHADOWS ============
export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ============ TYPOGRAPHY ============
export const Typography = {
  // Headers
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  } as TextStyle,
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.25,
  } as TextStyle,
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  } as TextStyle,
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  } as TextStyle,

  // Body
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: Colors.textPrimary,
  } as TextStyle,
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
  } as TextStyle,

  // Captions
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  } as TextStyle,
  captionSmall: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: Colors.textTertiary,
  } as TextStyle,

  // Monospace (for prices/numbers)
  mono: {
    fontSize: 16,
    fontFamily: 'Courier' as const,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  } as TextStyle,
  monoSmall: {
    fontSize: 14,
    fontFamily: 'Courier' as const,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  } as TextStyle,
} as const;

// ============ GLASS MORPHISM STYLES ============
export const GlassStyles = {
  base: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  } as ViewStyle,

  card: {
    backgroundColor: 'rgba(18, 18, 26, 0.8)',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.large,
  } as ViewStyle,

  tabBar: {
    backgroundColor: 'rgba(10, 10, 14, 0.9)',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  } as ViewStyle,
};

// ============ COMPLETE THEME EXPORT ============
export const Theme = {
  colors: Colors,
  spacing: Spacing,
  radius: Radius,
  shadows: Shadows,
  typography: Typography,
  glass: GlassStyles,

  // Helper functions
  getVerdictColor,
};

export default Theme;
