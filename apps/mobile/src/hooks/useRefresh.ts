/**
 * PANTHEON REFRESH HOOK
 * Pull-to-refresh and auto-refresh functionality
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ============ CONFIG ============
export const REFRESH_INTERVALS = {
  OFF: 0,
  SLOW: 60,      // 1 minute
  MEDIUM: 30,    // 30 seconds
  FAST: 15,      // 15 seconds
} as const;

// ============ USE REFRESH HOOK ============
export interface UseRefreshResult {
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  setAutoRefresh: (interval: number) => void;
  autoRefreshInterval: number;
  cancelAutoRefresh: () => void;
}

export const useRefresh = (
  refreshCallback: () => Promise<void>,
  defaultInterval: number = REFRESH_INTERVALS.MEDIUM
): UseRefreshResult => {
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(defaultInterval);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Manual refresh (pull-to-refresh)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshCallback();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshCallback]);

  // Auto-refresh setup
  const setAutoRefresh = useCallback((interval: number) => {
    setAutoRefreshInterval(interval);
  }, []);

  // Clear auto-refresh timer
  const cancelAutoRefresh = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    cancelAutoRefresh();

    if (autoRefreshInterval > 0) {
      timerRef.current = setInterval(() => {
        refreshCallback().catch(console.error);
      }, autoRefreshInterval * 1000);
    }

    return cancelAutoRefresh;
  }, [autoRefreshInterval, refreshCallback, cancelAutoRefresh]);

  return {
    refreshing,
    onRefresh,
    setAutoRefresh,
    autoRefreshInterval,
    cancelAutoRefresh,
  };
};

// ============ USE DEBOUNCE HOOK ============
// For preventing excessive API calls during rapid changes
export const useDebounce = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return ((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }) as T;
};

// ============ USE THROTTLE HOOK ============
// For limiting function call frequency
export const useThrottle = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 1000
): T => {
  const lastRun = useRef(Date.now());

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    }
  }) as T;
};

export default {
  useRefresh,
  useDebounce,
  useThrottle,
  REFRESH_INTERVALS,
};
