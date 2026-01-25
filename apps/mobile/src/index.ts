/**
 * PANTHEON ANDROID APP - BARREL EXPORTS
 * Central export point for all components, hooks, and utilities
 */

// ============ CONSTANTS ============
export { Theme, Colors, Spacing, Radius, Typography } from './constants/Theme';
export { API_URL } from './constants/Config';

// ============ TYPES ============
export type {
  Verdict,
  ModuleVote,
  CouncilDecision,
  StockSignal,
  MarketData,
  StockAnalysis,
  MacroRating,
  BacktestResult,
  NewsItem,
  HermesResult,
  ApiResponse,
  StockQuote,
  FundamentalData,
  AppSettings,
} from './types/api';

// ============ HOOKS ============
export {
  useSignals,
  useAnalysis,
  useMarket,
  useAether,
  useBacktest,
} from './hooks/useApi';

export {
  useRefresh,
  useDebounce,
  useThrottle,
  REFRESH_INTERVALS,
} from './hooks/useRefresh';

export { useAppNavigation } from './navigation/AppNavigator';

// ============ CARDS ============
export { GlassCard, SolidCard, OutlineCard, PositiveCard, NegativeCard } from './components/cards/GlassCard';
export { SignalCard, SignalCardCompact } from './components/cards/SignalCard';
export { CouncilCard, CouncilCardMini } from './components/cards/CouncilCard';
export { AnalysisCard, ScoreBadge, VerticalScoreCard, getScoreColor, MODULE_INFO } from './components/cards/AnalysisCard';
export { AetherHUDCard, AetherHUDMini, RegimePill } from './components/cards/AetherHUDCard';

// ============ NAVIGATION ============
export {
  FloatingTabBar,
  TabBarItem,
  MiniTabBar,
  TABS,
} from './components/navigation/FloatingTabBar';
export { AppNavigator, PantheonHeader } from './navigation/AppNavigator';
export {
  TabNavigator,
  ScreenWithTab,
  TabNavigatorWithNav,
  useTabNavigation,
  getTabInfo,
} from './navigation/TabNavigator';

// ============ CHARTS ============
export { RadarChart, RadarChartMini, RadarChartComparison } from './components/charts/RadarChart';
export { MiniChart, CandleMini, VerticalBar, ScoreGauge } from './components/charts/MiniChart';
export {
  CandleChart,
  PriceLineChart,
  VolumeChart,
  TimeRangeSelector,
  ChartHeader,
} from './components/charts/CandleChart';

// ============ COMMON ============
export {
  PantheonLogo,
  LogoBadge,
  SplashLogo,
} from './components/common/PantheonLogo';
export {
  LoadingSpinner,
  FullScreenLoading,
  ProgressSpinner,
  Skeleton,
  SkeletonCard,
} from './components/common/LoadingSpinner';
export {
  ErrorMessage,
  MiniError,
  InlineError,
  EmptyState,
  ErrorFallback,
  NetworkStatus,
} from './components/common/ErrorMessage';

// ============ SCREENS ============
export { MarketScreen } from './screens/MarketScreen';
export { StockDetailScreen } from './screens/StockDetailScreen';
export { CouncilScreen } from './screens/CouncilScreen';
export { BacktestScreen } from './screens/BacktestScreen';
export { SettingsScreen } from './screens/SettingsScreen';
export { SplashScreen as PantheonSplashScreen } from './screens/SplashScreen';

// ============ MAIN APP ============
export { App } from './App';
