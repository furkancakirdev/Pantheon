/**
 * PANTHEON APP NAVIGATOR
 * Main navigation structure using React Navigation
 * Stack Navigator for screen transitions
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Theme } from '../constants/Theme';
import { TABS } from '../components/navigation/FloatingTabBar';

// Import actual screens
import { MarketScreen } from '../screens/MarketScreen';
import { CouncilScreen } from '../screens/CouncilScreen';
import { StockDetailScreen } from '../screens/StockDetailScreen';
import { PortfolioScreen } from '../screens/PortfolioScreen';
import { WatchlistScreen } from '../screens/WatchlistScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// ============ PLACEHOLDER ============
const PlaceholderScreen = ({ name }: { name: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background }}>
    <Text style={{ color: Theme.colors.textPrimary, ...Theme.typography.h3 }}>{name}</Text>
  </View>
);

// ============ STACK NAVIGATOR ============
export type RootStackParamList = {
  Main: undefined;
  StockDetail: { symbol: string };
  Backtest: { symbol: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ============ HEADER COMPONENTS ============
interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: () => void;
  rightIcon?: string;
}

export const PantheonHeader: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  rightAction,
  rightIcon,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        {showBack && (
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerIcon}>←</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.headerTitle}>{title}</Text>

        {rightIcon && rightAction && (
          <TouchableOpacity style={styles.headerButton} onPress={rightAction}>
            <Text style={styles.headerIcon}>{rightIcon}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ============ MAIN NAVIGATOR ============
interface AppNavigatorProps {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({
  selectedTab,
  setSelectedTab,
}) => {
  return (
    <NavigationContainer independent={true}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Theme.colors.background },
          animation: 'slide_from_right',
        }}
      >
        {/* Main Tab Screens */}
        <Stack.Screen name="Main">
          {() => {
            // Render the selected tab screen
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
          }}
        </Stack.Screen>

        {/* Detail Screens */}
        <Stack.Screen
          name="StockDetail"
          component={StockDetailScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />

        <Stack.Screen
          name="Backtest"
          component={() => <PlaceholderScreen name="Backtest Ekranı" />}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />

        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            presentation: 'card',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// ============ NAVIGATION HOOKS ============
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const useAppNavigation = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return {
    navigateToStock: (symbol: string) =>
      navigation.navigate('StockDetail', { symbol }),
    navigateToBacktest: (symbol: string) =>
      navigation.navigate('Backtest', { symbol }),
    navigateToSettings: () =>
      navigation.navigate('Settings'),
    goBack: () => navigation.goBack(),
  };
};

// ============ SIMPLE TAB NAVIGATOR (for quick testing) ============
export type TabParamList = {
  Market: undefined;
  Council: undefined;
  Detail: undefined;
  Settings: undefined;
};

export const createSimpleTabNavigator = () => {
  // Simple tab switcher without React Navigation's Tab Navigator
  // Uses the FloatingTabBar component instead
  return null;
};

// ============ STYLES ============
const styles = StyleSheet.create({
  header: {
    backgroundColor: Theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    paddingHorizontal: Theme.spacing.medium,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
  },
  headerTitle: {
    ...Theme.typography.h3,
    fontWeight: '700',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.medium,
  },
  headerIcon: {
    ...Theme.typography.h3,
  },
});

export default AppNavigator;
