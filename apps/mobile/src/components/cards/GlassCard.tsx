/**
 * PANTHEON GLASS CARD
 * Glass morphism card with blur effect and gradient border
 * Based on Argus Terminal design
 */

import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../../constants/Theme';

// ============ PROPS ============
export interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  blurAmount?: number;
  tint?: 'light' | 'dark' | 'default';
  variant?: 'solid' | 'glass' | 'outline';
}

// ============ COMPONENT ============
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  onPress,
  disabled = false,
  blurAmount = 10,
  tint = 'dark',
  variant = 'glass',
}) => {
  const cardContent = (
    <>
      {/* Background Layer */}
      <View
        style={[
          styles.cardBase,
          variant === 'solid' && styles.solidBackground,
          variant === 'outline' && styles.outlineBackground,
        ]}
      />

      {/* Blur Layer */}
      {variant === 'glass' && (
        <BlurView intensity={blurAmount} tint={tint} style={styles.blur} />
      )}

      {/* Gradient Border Overlay */}
      {variant === 'glass' && (
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.15)',
            'rgba(255, 255, 255, 0.05)',
            'rgba(255, 255, 255, 0.02)',
            'rgba(255, 255, 255, 0.05)',
            'rgba(255, 255, 255, 0.15)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        />
      )}

      {/* Content */}
      <View style={[styles.content, style]}>{children}</View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        style={styles.touchable}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return <View style={styles.container}>{cardContent}</View>;
};

// ============ SPECIALIZED VARIANTS ============

// Solid card for important information
export const SolidCard: React.FC<
  GlassCardProps & { backgroundColor?: string }
> = ({ children, style, backgroundColor, ...props }) => (
  <GlassCard variant="solid" {...props}>
    <View
      style={[
        styles.solidCardInner,
        backgroundColor ? { backgroundColor } : undefined,
        style,
      ]}
    >
      {children}
    </View>
  </GlassCard>
);

// Outline card for secondary content
export const OutlineCard: React.FC<GlassCardProps> = (props) => (
  <GlassCard variant="outline" {...props} />
);

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  touchable: {
    position: 'relative',
  },
  cardBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.radius.large,
  },
  solidBackground: {
    backgroundColor: Theme.colors.secondaryBackground,
  },
  outlineBackground: {
    backgroundColor: 'transparent',
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Theme.radius.large,
    overflow: 'hidden',
  },
  gradientBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Theme.radius.large,
    borderWidth: 1,
    borderColor: 'transparent',
    // Border is simulated by gradient
  },
  solidCardInner: {
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.large - 1,
    padding: Theme.spacing.medium,
  },
  content: {
    padding: Theme.spacing.medium,
    position: 'relative',
    zIndex: 1,
  },
});

// ============ PREMADE COLOR CARDS ============
export const PositiveCard: React.FC<GlassCardProps> = (props) => (
  <SolidCard
    backgroundColor={`${Theme.colors.positive}15`}
    {...props}
  />
);

export const NegativeCard: React.FC<GlassCardProps> = (props) => (
  <SolidCard
    backgroundColor={`${Theme.colors.negative}15`}
    {...props}
  />
);

export const WarningCard: React.FC<GlassCardProps> = (props) => (
  <SolidCard
    backgroundColor={`${Theme.colors.warning}15`}
    {...props}
  />
);

export const NeutralCard: React.FC<GlassCardProps> = (props) => (
  <SolidCard
    backgroundColor={`${Theme.colors.neutral}15`}
    {...props}
  />
);

export default GlassCard;
