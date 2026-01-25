/**
 * PANTHEON TAB NAVIGATOR
 * Custom tab navigator using FloatingTabBar
 * Manages screen state and tab switching
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Theme } from '../constants/Theme';
import { FloatingTabBar, TABS } from '../components/navigation/FloatingTabBar';
import { AppNavigator } from './AppNavigator';

// Import actual screens
import { MarketScreen } from '../screens/MarketScreen';
import { CouncilScreen } from '../screens/CouncilScreen';
import { StockDetailScreen } from '../screens/StockDetailScreen';
import { PortfolioScreen } from '../screens/PortfolioScreen';
import { WatchlistScreen } from '../screens/WatchlistScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// ============ TAB NAVIGATOR PROPS ============
interface TabNavigatorProps {
  initialTab?: string;
}

// ============ MAIN TAB NAVIGATOR ============
export const TabNavigator: React.FC<TabNavigatorProps> = ({
  initialTab = 'market',
}) => {
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const insets = useSafeAreaInsets();

  const handleTabPress = useCallback((tabId: string) => {
    setSelectedTab(tabId);
  }, []);

  // Render the active screen
  const renderScreen = () => {
    switch (selectedTab) {
      case 'market':
        return <MarketScreen />;
      case 'council':
        return <CouncilScreen />;
      case 'portfolio':
        return <PortfolioScreen />;
      case 'watchlist':
        return <WatchlistScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <MarketScreen />;
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Main Content Area */}
      <View style={styles.content}>{renderScreen()}</View>

      {/* Floating Tab Bar */}
      <FloatingTabBar selectedTab={selectedTab} onTabPress={handleTabPress} />
    </View>
  );
};

// ============ SCREEN WITH TAB (wrapper for individual screens) ============
interface ScreenWithTabProps {
  tabId: string;
  children: React.ReactNode;
  onTabChange?: (tabId: string) => void;
}

export const ScreenWithTab: React.FC<ScreenWithTabProps> = ({
  tabId,
  children,
  onTabChange,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Screen Content */}
      <View style={styles.content}>{children}</View>

      {/* Floating Tab Bar */}
      <FloatingTabBar selectedTab={tabId} onTabPress={onTabChange || (() => {})} />
    </View>
  );
};

// ============ TAB NAVIGATOR WITH NAVIGATION ============
export const TabNavigatorWithNav: React.FC<TabNavigatorProps> = ({
  initialTab = 'market',
}) => {
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Navigation Stack */}
      <AppNavigator selectedTab={selectedTab} setSelectedTab={setSelectedTab} />

      {/* Floating Tab Bar */}
      <FloatingTabBar selectedTab={selectedTab} onTabPress={setSelectedTab} />
    </View>
  );
};

// ============ SINGLE TAB SCREEN (for use in stack navigator) ============
interface SingleTabScreenProps {
  tabId: string;
  children: React.ReactNode;
}

export const SingleTabScreen: React.FC<SingleTabScreenProps> = ({
  tabId,
  children,
}) => {
  return (
    <View style={styles.content}>
      {children}
    </View>
  );
};

// ============ HOOKS ============
export const useTabNavigation = () => {
  const [selectedTab, setSelectedTab] = useState('market');

  return {
    selectedTab,
    setSelectedTab,
    navigateToTab: (tabId: string) => setSelectedTab(tabId),
    isActiveTab: (tabId: string) => selectedTab === tabId,
  };
};

// ============ TAB ROUTER ============
export const getTabInfo = (tabId: string) => {
  return TABS.find((tab) => tab.id === tabId);
};

export const getAllTabs = () => TABS;

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
  },
});

export default TabNavigator;
