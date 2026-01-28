/**
 * Pantheon Rate Limiting Middleware
 * API endpoint'leri için rate limiting ve güvenlik başlıkları
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiter configuration
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'pantheon_api',
  points: 100, // 100 istek
  duration: 60, // 60 saniye içinde
});

// Auth endpoint'leri için daha sıkı limit
const authRateLimiter = new RateLimiterMemory({
  keyPrefix: 'pantheon_auth',
  points: 5, // 5 istek
  duration: 60, // 60 saniye içinde
});

// Analysis endpoint'leri için orta seviye limit
const analysisRateLimiter = new RateLimiterMemory({
  keyPrefix: 'pantheon_analysis',
  points: 30, // 30 istek
  duration: 60, // 60 saniye içinde
});

/**
 * IP adresi al (X-Forwarded-For header'ını dikkate alır)
 */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  return ip;
}

/**
 * Rate limiting kontrolü
 */
async function checkRateLimit(
  limiter: RateLimiterMemory,
  key: string
): Promise<{ success: boolean; remaining?: number }> {
  try {
    const result = await limiter.consume(key);
    return { success: true, remaining: result.remainingPoints };
  } catch (rejRes: any) {
    const remaining = rejRes?.remainingPoints ?? 0;
    return { success: false, remaining };
  }
}

/**
 * Rate limit exceeded response
 */
function createRateLimitResponse(remaining: number = 0): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.',
      retryAfter: 60,
    },
    { status: 429 }
  );
}

/**
 * Middleware main function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Sadece API endpoint'leri için rate limiting
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const clientIp = getClientIp(request);

  // Auth endpoint'leri için özel rate limiting
  if (pathname.startsWith('/api/auth/')) {
    const authResult = await checkRateLimit(authRateLimiter, `auth_${clientIp}`);
    if (!authResult.success) {
      const response = createRateLimitResponse(authResult.remaining);
      response.headers.set('Retry-After', '60');
      return response;
    }
  }
  // Analysis endpoint'leri için özel rate limiting
  else if (pathname.startsWith('/api/analysis/')) {
    const analysisResult = await checkRateLimit(
      analysisRateLimiter,
      `analysis_${clientIp}`
    );
    if (!analysisResult.success) {
      const response = createRateLimitResponse(analysisResult.remaining);
      response.headers.set('Retry-After', '60');
      return response;
    }
  }
  // Genel API endpoint'leri için rate limiting
  else {
    const generalResult = await checkRateLimit(rateLimiter, `api_${clientIp}`);
    if (!generalResult.success) {
      const response = createRateLimitResponse(generalResult.remaining);
      response.headers.set('Retry-After', '60');
      return response;
    }
  }

  // Response ile güvenlik başlıkları ekle
  const response = NextResponse.next();

  // Güvenlik başlıkları
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Rate limit bilgisi (opsiyonel)
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', '99');
  response.headers.set('X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 60));

  return response;
}

/**
 * Middleware configuration
 * Sadece API endpoint'lerini kapsar
 */
export const config = {
  matcher: '/api/:path*',
};
