/**
 * Pantheon Authentication Utilities
 * JWT token yönetimi, password hashing, validation
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// JWT Configuration
// Security: JWT_SECRET must be set in production, no weak fallback
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    // Development fallback with warning
    console.warn('⚠️  JWT_SECRET not set, using development fallback. Set JWT_SECRET in .env!');
    return 'dev-secret-key-change-in-production-min-32-chars';
  }
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  return secret;
};

// JWT_SECRET - Lazy evaluation to avoid build-time errors
// Only validated when actually used (runtime), not during build
const getJwtSecretRuntime = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    // Development fallback with warning
    if (!globalThis._jwtWarnShown) {
      console.warn('⚠️  JWT_SECRET not set, using development fallback. Set JWT_SECRET in .env!');
      globalThis._jwtWarnShown = true;
    }
    return 'dev-secret-key-change-in-production-min-32-chars';
  }
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  return secret;
};

// Runtime JWT config (lazy evaluation)
const getJwtExpiresIn = (): string => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
  const allowedExpirations = ['15m', '1h', '24h', '7d'];
  if (!allowedExpirations.includes(expiresIn)) {
    throw new Error(`Invalid JWT_EXPIRES_IN: "${expiresIn}". Allowed: ${allowedExpirations.join(', ')}`);
  }
  return expiresIn;
};

const REFRESH_TOKEN_EXPIRES_IN = '30d';

// Global warning flag (development only)
declare global {
  var _jwtWarnShown: boolean | undefined;
}

// Password Requirements
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

// Types
export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Password hash'leme
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Password karşılaştırma
 */
export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * JWT access token oluştur
 */
export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, getJwtSecretRuntime(), {
    expiresIn: getJwtExpiresIn(),
  } as jwt.SignOptions);
}

/**
 * JWT refresh token oluştur
 */
export function signRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, getJwtSecretRuntime(), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Hem access hem refresh token oluştur
 */
export function signTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): AuthTokens {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // expiresIn değerini hesapla (7 gün = 7 * 24 * 60 * 60 saniye)
  const expiresIn = 7 * 24 * 60 * 60;

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * JWT token verify et
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecretRuntime()) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Token'dan userId çıkar
 */
export function getUserIdFromToken(token: string): string | null {
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}

/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Username validation
 */
export function isValidUsername(username: string): boolean {
  // 3-20 karakter, sadece harf, rakam ve underscore
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Password validation
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Uzunluk kontrolü
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır`);
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`Şifre en fazla ${PASSWORD_MAX_LENGTH} karakter olabilir`);
  }

  // En az bir küçük harf
  if (!/[a-z]/.test(password)) {
    errors.push('Şifre en az bir küçük harf içermelidir');
  }

  // En az bir büyük harf
  if (!/[A-Z]/.test(password)) {
    errors.push('Şifre en az bir büyük harf içermelidir');
  }

  // En az bir rakam
  if (!/\d/.test(password)) {
    errors.push('Şifre en az bir rakam içermelidir');
  }

  // En az bir özel karakter
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Şifre en az bir özel karakter içermelidir');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Password strength hesapla (0-100)
 */
export function calculatePasswordStrength(password: string): number {
  let strength = 0;

  // Uzunluk puanı (max 40)
  strength += Math.min(password.length * 2, 40);

  // Küçük harf (max 10)
  if (/[a-z]/.test(password)) strength += 10;

  // Büyük harf (max 10)
  if (/[A-Z]/.test(password)) strength += 10;

  // Rakam (max 10)
  if (/\d/.test(password)) strength += 10;

  // Özel karakter (max 15)
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 15;

  // Çeşitlilik bonusu (max 15)
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const varietyCount = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

  if (varietyCount === 4) strength += 15;
  else if (varietyCount === 3) strength += 10;
  else if (varietyCount === 2) strength += 5;

  return Math.min(strength, 100);
}

/**
 * Request'ten bearer token çıkar
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Auth response formatı
 */
export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
    name?: string;
  };
  tokens?: AuthTokens;
  error?: string;
  message?: string;
}

/**
 * Başarılı auth response oluştur
 */
export function createAuthResponse(
  user: { id: string; username: string; email: string; name?: string },
  tokens?: AuthTokens
): AuthResponse {
  return {
    success: true,
    user,
    tokens,
  };
}

/**
 * Hatalı auth response oluştur
 */
export function createAuthError(error: string): AuthResponse {
  return {
    success: false,
    error,
  };
}
