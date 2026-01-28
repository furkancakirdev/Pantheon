/**
 * Notification Types
 */

export enum NotificationType {
  SIGNAL = "SIGNAL",
  PRICE = "PRICE",
  NEWS = "NEWS",
  SYSTEM = "SYSTEM",
  PORTFOLIO = "PORTFOLIO",
  WATCHLIST = "WATCHLIST"
}

export enum NotificationChannel {
  EMAIL = "EMAIL",
  PUSH = "PUSH",
  SMS = "SMS",
  IN_APP = "IN_APP"
}

export interface NotificationData {
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  channels: NotificationChannel[];
  priority?: "low" | "normal" | "high" | "urgent";
  scheduledAt?: Date;
}

export interface EmailNotification {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

export interface PushNotification {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: "normal" | "high";
}

export interface SMSNotification {
  to: string;
  message: string;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  signalAlerts: boolean;
  priceAlerts: boolean;
  newsAlerts: boolean;
}

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  error?: string;
  messageId?: string;
}

export interface BatchNotificationResult {
  success: boolean;
  results: NotificationResult[];
  failed: number;
  sent: number;
}

export interface SignalNotificationData {
  symbol: string;
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  modules: string[];
  explanation?: string;
}

export interface PriceAlertData {
  symbol: string;
  targetPrice: number;
  currentPrice: number;
  direction: "ABOVE" | "BELOW";
}

export interface NewsNotificationData {
  title: string;
  url?: string;
  sentiment?: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  symbols?: string[];
}
