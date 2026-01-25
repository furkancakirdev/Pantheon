/**
 * PANTHEON ERROR MESSAGE COMPONENT
 * Various error states and messages
 * Based on Argus Terminal error handling
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import { Theme } from '../../constants/Theme';
import { GlassCard } from '../cards/GlassCard';

// ============ ERROR TYPES ============
export type ErrorType =
  | 'network'
  | 'api'
  | 'data'
  | 'auth'
  | 'timeout'
  | 'unknown';

// ============ PROPS ============
export interface ErrorMessageProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  fullScreen?: boolean;
}

// ============ ERROR CONFIG ============
const ERROR_CONFIG: Record<
  ErrorType,
  { icon: string; defaultTitle: string; defaultMessage: string }
> = {
  network: {
    icon: '📡',
    defaultTitle: 'Bağlantı Hatası',
    defaultMessage: 'İnternet bağlantınızı kontrol edip tekrar deneyin.',
  },
  api: {
    icon: '⚠️',
    defaultTitle: 'API Hatası',
    defaultMessage: 'Sunucuyla iletişim kurulurken bir hata oluştu.',
  },
  data: {
    icon: '📋',
    defaultTitle: 'Veri Hatası',
    defaultMessage: 'Veriler yüklenirken bir sorun oluştu.',
  },
  auth: {
    icon: '🔒',
    defaultTitle: 'Yetki Hatası',
    defaultMessage: 'Bu işlemi gerçekleştirmek için yetkiniz yok.',
  },
  timeout: {
    icon: '⏱️',
    defaultTitle: 'Zaman Aşımı',
    defaultMessage: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
  },
  unknown: {
    icon: '❌',
    defaultTitle: 'Hata',
    defaultMessage: 'Beklenmeyen bir hata oluştu.',
  },
};

// ============ ERROR MESSAGE CARD ============
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  type = 'unknown',
  title,
  message,
  onRetry,
  onDismiss,
  fullScreen = false,
}) => {
  const config = ERROR_CONFIG[type];
  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;

  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <Text style={styles.fullScreenIcon}>{config.icon}</Text>
        <Text style={styles.fullScreenTitle}>{displayTitle}</Text>
        <Text style={styles.fullScreenMessage}>{displayMessage}</Text>

        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Yeniden Dene</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{config.icon}</Text>
          <Text style={styles.cardTitle}>{displayTitle}</Text>
          {onDismiss && (
            <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
              <Text style={styles.dismissIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.cardMessage}>{displayMessage}</Text>

        {onRetry && (
          <TouchableOpacity style={styles.cardRetryButton} onPress={onRetry}>
            <Text style={styles.cardRetryButtonText}>Yeniden Dene</Text>
          </TouchableOpacity>
        )}
      </View>
    </GlassCard>
  );
};

// ============ MINI ERROR ============
export interface MiniErrorProps {
  message: string;
  type?: ErrorType;
}

export const MiniError: React.FC<MiniErrorProps> = ({ message, type = 'unknown' }) => {
  const config = ERROR_CONFIG[type];
  const color =
    type === 'network' || type === 'timeout'
      ? Theme.colors.warning
      : Theme.colors.negative;

  return (
    <View style={[styles.miniError, { borderColor: color }]}>
      <Text style={[styles.miniErrorIcon, { color }]}>{config.icon}</Text>
      <Text style={[styles.miniErrorText]}>{message}</Text>
    </View>
  );
};

// ============ INLINE ERROR ============
export interface InlineErrorProps {
  message: string;
  size?: 'small' | 'medium';
}

export const InlineError: React.FC<InlineErrorProps> = ({ message, size = 'small' }) => {
  return (
    <View style={styles.inlineError}>
      <Text style={[styles.inlineErrorText, size === 'small' && styles.inlineErrorTextSmall]}>
        {message}
      </Text>
    </View>
  );
};

// ============ EMPTY STATE (for no data, not error) ============
export interface EmptyStateProps {
  icon?: string;
  title?: string;
  message?: string;
  action?: { label: string; onPress: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title = 'Veri Bulunamadı',
  message,
  action,
}) => {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message && <Text style={styles.emptyMessage}>{message}</Text>}
      {action && (
        <TouchableOpacity style={styles.actionButton} onPress={action.onPress}>
          <Text style={styles.actionButtonText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============ ERROR BOUNDARY FALLBACK ============
export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackIcon}>💥</Text>
      <Text style={styles.fallbackTitle}>Bir Şeyler Ters Gitti</Text>
      <Text style={styles.fallbackMessage}>{error.message}</Text>

      <ScrollView style={styles.fallbackDetails}>
        <Text style={styles.fallbackStackTrace}>{error.stack}</Text>
      </ScrollView>

      <TouchableOpacity style={styles.fallbackButton} onPress={resetError}>
        <Text style={styles.fallbackButtonText}>Tekrar Dene</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============ NETWORK STATUS BAR ============
export interface NetworkStatusProps {
  connected: boolean;
  latency?: number;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ connected, latency }) => {
  return (
    <View
      style={[
        styles.networkBar,
        { backgroundColor: connected ? `${Theme.colors.positive}20` : `${Theme.colors.negative}20` },
      ]}
    >
      <View
        style={[
          styles.networkDot,
          { backgroundColor: connected ? Theme.colors.positive : Theme.colors.negative },
        ]}
      />
      <Text
        style={[
          styles.networkText,
          { color: connected ? Theme.colors.positive : Theme.colors.negative },
        ]}
      >
        {connected ? 'Bağlı' : 'Çevrimdışı'}
      </Text>
      {latency !== undefined && connected && (
        <Text style={styles.networkLatency}>{latency}ms</Text>
      )}
    </View>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  // Card
  card: {
    padding: Theme.spacing.medium,
  },
  cardContent: {
    gap: Theme.spacing.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
  },
  cardIcon: {
    fontSize: 20,
  },
  cardTitle: {
    ...Theme.typography.body,
    fontWeight: '700',
    flex: 1,
  },
  dismissButton: {
    padding: Theme.spacing.small,
  },
  dismissIcon: {
    ...Theme.typography.body,
    color: Theme.colors.textTertiary,
  },
  cardMessage: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.textSecondary,
  },
  cardRetryButton: {
    alignSelf: 'flex-start',
    paddingVertical: Theme.spacing.small,
    paddingHorizontal: Theme.spacing.medium,
    backgroundColor: `${Theme.colors.accent}20`,
    borderRadius: Theme.radius.small,
  },
  cardRetryButtonText: {
    ...Theme.typography.bodySmall,
    fontWeight: '600',
    color: Theme.colors.accent,
  },
  // Full Screen
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xLarge,
    gap: Theme.spacing.medium,
  },
  fullScreenIcon: {
    fontSize: 64,
  },
  fullScreenTitle: {
    ...Theme.typography.h3,
    fontWeight: '700',
  },
  fullScreenMessage: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Theme.spacing.medium,
    paddingVertical: Theme.spacing.medium,
    paddingHorizontal: Theme.spacing.xLarge,
    backgroundColor: Theme.colors.accent,
    borderRadius: Theme.radius.medium,
  },
  retryButtonText: {
    ...Theme.typography.body,
    fontWeight: '600',
  },
  // Mini Error
  miniError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
    padding: Theme.spacing.small,
    backgroundColor: `${Theme.colors.negative}10`,
    borderRadius: Theme.radius.small,
    borderWidth: 1,
  },
  miniErrorIcon: {
    fontSize: 14,
  },
  miniErrorText: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textSecondary,
    flex: 1,
  },
  // Inline Error
  inlineError: {
    paddingVertical: Theme.spacing.small,
  },
  inlineErrorText: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.negative,
  },
  inlineErrorTextSmall: {
    ...Theme.typography.caption,
  },
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xLarge,
    gap: Theme.spacing.medium,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyTitle: {
    ...Theme.typography.h3,
    fontWeight: '700',
  },
  emptyMessage: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  actionButton: {
    marginTop: Theme.spacing.medium,
    paddingVertical: Theme.spacing.medium,
    paddingHorizontal: Theme.spacing.xLarge,
    backgroundColor: Theme.colors.accent,
    borderRadius: Theme.radius.medium,
  },
  actionButtonText: {
    ...Theme.typography.body,
    fontWeight: '600',
  },
  // Error Fallback
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xLarge,
    gap: Theme.spacing.medium,
  },
  fallbackIcon: {
    fontSize: 64,
  },
  fallbackTitle: {
    ...Theme.typography.h3,
    fontWeight: '700',
  },
  fallbackMessage: {
    ...Theme.typography.body,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  fallbackDetails: {
    maxHeight: 200,
    width: '100%',
  },
  fallbackStackTrace: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textTertiary,
    fontFamily: 'monospace',
  },
  fallbackButton: {
    marginTop: Theme.spacing.medium,
    paddingVertical: Theme.spacing.medium,
    paddingHorizontal: Theme.spacing.xLarge,
    backgroundColor: Theme.colors.accent,
    borderRadius: Theme.radius.medium,
  },
  fallbackButtonText: {
    ...Theme.typography.body,
    fontWeight: '600',
  },
  // Network Status
  networkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
    paddingVertical: Theme.spacing.small,
    paddingHorizontal: Theme.spacing.medium,
    borderRadius: Theme.radius.pill,
    alignSelf: 'flex-start',
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  networkText: {
    ...Theme.typography.caption,
    fontWeight: '600',
  },
  networkLatency: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textTertiary,
  },
});

export default ErrorMessage;
