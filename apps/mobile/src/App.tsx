/**
 * PANTHEON TRADING OS - MAIN APP
 * Entry point for the Pantheon Android application
 * Based on Argus Terminal architecture
 */

import React, { useState, useCallback, useEffect } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Theme } from './constants/Theme';
import { TabNavigatorWithNav } from './navigation/TabNavigator';
import { SplashScreen as PantheonSplash } from './screens/SplashScreen';

// ============ APP PROPS ============
interface AppProps {
  // Add any props from Expo Router if needed
}

// ============ MAIN APP COMPONENT ============
export const App: React.FC<AppProps> = () => {
  const [appReady, setAppReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [initialTab, setInitialTab] = useState('market');

  // Initialize app
  useEffect(() => {
    const init = async () => {
      // Simulate initialization
      await new Promise((resolve) => setTimeout(resolve, 500));
      setAppReady(true);
    };

    init();
  }, []);

  // Handle splash screen completion
  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  // If not ready, show nothing
  if (!appReady) {
    return null;
  }

  // Show splash screen
  if (showSplash) {
    return <PantheonSplash onComplete={handleSplashComplete} duration={2500} />;
  }

  // Main app
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Theme.colors.background}
        translucent
      />
      <AppContent initialTab={initialTab} onTabChange={setInitialTab} />
    </SafeAreaProvider>
  );
};

// ============ APP CONTENT ============
interface AppContentProps {
  initialTab: string;
  onTabChange: (tab: string) => void;
}

const AppContent: React.FC<AppContentProps> = ({ initialTab, onTabChange }) => {
  return (
    <View style={styles.container}>
      <TabNavigatorWithNav initialTab={initialTab} />
    </View>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
});

// ============ EXPORTS ============
export default App;

// For Expo Router compatibility
export * as screens from './screens';
export * as navigation from './navigation';
export * as components from './components';
export * as hooks from './hooks';
export * as constants from './constants';
export * as types from './types';
