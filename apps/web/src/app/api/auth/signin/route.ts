/**
 * Pantheon Authentication API - Sign In
 * Güvenli authentication endpoint ile JWT token
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  comparePasswords,
  signTokens,
  extractBearerToken,
  verifyToken,
  createAuthResponse,
  createAuthError,
} from '@/lib/auth';

/**
 * POST /api/auth/signin
 * Kullanıcı girişi
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    // Validate input - username veya email biri zorunlu
    if ((!username && !email) || !password) {
      return NextResponse.json(
        createAuthError('Kullanıcı adı/e-posta ve şifre zorunludur'),
        { status: 400 }
      );
    }

    // Kullanıcıyı bul (username veya email ile)
    const user = await prisma.user.findFirst({
      where: username
        ? { username }
        : { email: email as string },
    });

    if (!user) {
      return NextResponse.json(
        createAuthError('Geçersiz kullanıcı adı/e-posta veya şifre'),
        { status: 401 }
      );
    }

    // Password kontrolü
    const isPasswordValid = await comparePasswords(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        createAuthError('Geçersiz kullanıcı adı/e-posta veya şifre'),
        { status: 401 }
      );
    }

    // JWT token oluştur
    const tokens = signTokens({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    // Session'ı database'e kaydet (refresh token için)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 gün

    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt,
      },
    });

    // Response
    return NextResponse.json(
      createAuthResponse(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name ?? undefined,
        },
        tokens
      ),
      { status: 200 }
    );
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      createAuthError('Sunucu hatası'),
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/signin
 * Mevcut token validate et
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
      return NextResponse.json(
        createAuthError('Token bulunamadı'),
        { status: 401 }
      );
    }

    // Token verify et
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        createAuthError('Geçersiz veya süresi dolmuş token'),
        { status: 401 }
      );
    }

    // Kullanıcı bilgilerini database'den getir
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        createAuthError('Kullanıcı bulunamadı'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name ?? undefined,
          emailVerified: user.emailVerified,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      createAuthError('Sunucu hatası'),
      { status: 500 }
    );
  }
}
