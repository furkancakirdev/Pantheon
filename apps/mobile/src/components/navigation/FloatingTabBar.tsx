/**
 * PANTHEON FLOATING TAB BAR
 * Glass morphism floating tab bar based on Argus Terminal design
 * Features: Blur effect, gradient border, animated indicators
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../../constants/Theme';

// ============ TAB CONFIG ============
export interface TabItem {
  id: string;
  label: string;
  icon: string; // Emoji for simplicity
  iconActive?: string;
}

export const TABS: TabItem[] = [
  { id: 'market', label: 'Piyasa', icon: '📊', iconActive: '📈' },
  { id: 'council', label: 'Konsey', icon: '👁️', iconActive: '🎯' },
  { id: 'portfolio', label: 'Portföy', icon: '💼', iconActive: '💰' },
  { id: 'watchlist', label: 'İzleme', icon: '⭐', iconActive: '🌟' },
  { id: 'settings', label: 'Ayarlar', icon: '⚙️', iconActive: '🔧' },
];

// ============ PROPS ============
export interface FloatingTabBarProps {
  selectedTab: string;
  onTabPress: (tabId: string) => void;
}

// ============ COMPONENT ============
export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  selectedTab,
  onTabPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Gradient Mask (fade effect behind tab bar) */}
      <LinearGradient
        colors={['transparent', Theme.colors.background + 'CC', Theme.colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.mask}
      />

      {/* Floating Tab Bar */}
      <View style={styles.tabBarWrapper}>
        {/* Blur Background */}
        <BlurView intensity={20} tint="dark" style={styles.blur}>
          <View style={styles.tabBar}>
            {/* Gradient Border */}
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

            {/* Tab Items */}
            {TABS.map((tab, index) => {
              const isActive = selectedTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => onTabPress(tab.id)}
                  activeOpacity={0.7}
                  style={styles.tabItem}
                >
                  {/* Active Indicator Dot */}
                  {isActive && (
                    <View style={styles.activeDot}>
                      <View style={styles.activeDotGlow} />
                    </View>
                  )}

                  {/* Icon */}
                  <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                    {isActive && tab.iconActive ? tab.iconActive : tab.icon}
                  </Text>

                  {/* Label (hidden for compact look) */}
                  {/* <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text> */}
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
};

// ============ SINGLE TAB ITEM (for custom layouts) ============
export interface TabBarItemProps {
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
}

export const TabBarItem: React.FC<TabBarItemProps> = ({ tab, isActive, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={styles.customTabItem}
  >
    {isActive && <View style={[styles.indicator, { backgroundColor: Theme.colors.accent }]} />}

    <View style={[styles.tabIconCircle, isActive && styles.tabIconCircleActive]}>
      <Text style={styles.tabIcon}>
        {isActive && tab.iconActive ? tab.iconActive : tab.icon}
      </Text>
    </View>

    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
      {tab.label}
    </Text>
  </TouchableOpacity>
);

// ============ MINI TAB BAR (compact variant) ============
export interface MiniTabBarProps {
  selectedTab: string;
  onTabPress: (tabId: string) => void;
}

export const MiniTabBar: React.FC<MiniTabBarProps> = ({ selectedTab, onTabPress }) => (
  <View style={styles.miniContainer}>
    {TABS.map((tab) => {
      const isActive = selectedTab === tab.id;
      return (
        <TouchableOpacity
          key={tab.id}
          onPress={() => onTabPress(tab.id)}
          activeOpacity={0.7}
          style={[
            styles.miniTabItem,
            isActive && { backgroundColor: `${Theme.colors.accent}20` },
          ]}
        >
          <Text style={styles.miniTabIcon}>
            {isActive && tab.iconActive ? tab.iconActive : tab.icon}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.select({
      ios: Theme.spacing.large,
      android: Theme.spacing.medium,
    }),
  },
  mask: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    height: 100,
    pointerEvents: 'none',
  },
  tabBarWrapper: {
    marginHorizontal: Theme.spacing.medium,
    borderRadius: Theme.radius.large + 4,
    overflow: 'hidden',
    ...Theme.shadows.large,
  },
  blur: {
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 10, 14, 0.9)',
    paddingTop: Theme.spacing.small,
    paddingBottom: Theme.spacing.medium,
    paddingHorizontal: Theme.spacing.small,
    position: 'relative',
    minHeight: 60,
  },
  gradientBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Theme.radius.large + 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.small,
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.accent,
    zIndex: 1,
  },
  activeDotGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 2,
    backgroundColor: Theme.colors.accent,
    opacity: 0.5,
    transform: [{ scale: 2 }],
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  tabLabelActive: {
    color: Theme.colors.accent,
    fontWeight: '600',
  },
  // Custom tab item
  customTabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Theme.spacing.medium,
    gap: Theme.spacing.small,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginBottom: 2,
  },
  tabIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.secondaryBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconCircleActive: {
    backgroundColor: `${Theme.colors.accent}15`,
    borderWidth: 1,
    borderColor: Theme.colors.accent,
  },
  // Mini variant
  miniContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.large,
    padding: Theme.spacing.small,
    marginHorizontal: Theme.spacing.medium,
    marginBottom: Theme.spacing.medium,
    gap: Theme.spacing.small,
  },
  miniTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.small,
    paddingHorizontal: Theme.spacing.medium,
    borderRadius: Theme.radius.medium,
  },
  miniTabIcon: {
    fontSize: 20,
  },
});

export default FloatingTabBar;
