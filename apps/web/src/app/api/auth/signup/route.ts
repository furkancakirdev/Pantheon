/**
 * Pantheon Authentication API - Sign Up
 * Güvenli kullanıcı kaydı ile password hashing ve validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  hashPassword,
  signTokens,
  isValidEmail,
  isValidUsername,
  validatePassword,
  createAuthResponse,
  createAuthError,
} from '@/lib/auth';

/**
 * POST /api/auth/signup
 * Yeni kullanıcı kaydı
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, name } = body;

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        createAuthError('Kullanıcı adı, e-posta ve şifre zorunludur'),
        { status: 400 }
      );
    }

    // Email validation
    if (!isValidEmail(email)) {
      return NextResponse.json(
        createAuthError('Geçersiz e-posta adresi'),
        { status: 400 }
      );
    }

    // Username validation
    if (!isValidUsername(username)) {
      return NextResponse.json(
        createAuthError('Kullanıcı adı 3-20 karakter olmalı, sadece harf, rakam ve "_" içerebilir'),
        { status: 400 }
      );
    }

    // Password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        createAuthError(passwordValidation.errors.join(', ')),
        { status: 400 }
      );
    }

    // Name validation (varsa)
    if (name && name.length > 100) {
      return NextResponse.json(
        createAuthError('İsim çok uzun (maksimum 100 karakter)'),
        { status: 400 }
      );
    }

    // Duplicate email kontrolü
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingEmail) {
      return NextResponse.json(
        createAuthError('Bu e-posta adresi zaten kullanımda'),
        { status: 409 }
      );
    }

    // Duplicate username kontrolü
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return NextResponse.json(
        createAuthError('Bu kullanıcı adı zaten kullanımda'),
        { status: 409 }
      );
    }

    // Password hash'le
    const passwordHash = await hashPassword(password);

    // Kullanıcı oluştur
    const user = await prisma.user.create({
      data: {
        username,
        email: email.toLowerCase(),
        passwordHash,
        name: name || null,
        emailVerified: false, // Production'da email verification gerekli
      },
    });

    // JWT token oluştur
    const tokens = signTokens({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    // Session'ı database'e kaydet
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 gün

    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt,
      },
    });

    // Response (password hash hariç)
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
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      createAuthError('Sunucu hatası'),
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/signup
 * Kullanıcı adı veya e-posta kullanılabilirlik kontrolü
 * Query params: ?username=xxx veya ?email=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const email = searchParams.get('email');

    if (!username && !email) {
      return NextResponse.json(
        createAuthError('Username veya email parametresi gerekli'),
        { status: 400 }
      );
    }

    let available = true;
    let message = 'Kullanılabilir';

    if (username) {
      const existing = await prisma.user.findUnique({
        where: { username },
      });
      available = !existing;
      if (!available) {
        message = 'Kullanıcı adı zaten kullanımda';
      }
    } else if (email) {
      const existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      available = !existing;
      if (!available) {
        message = 'E-posta adresi zaten kullanımda';
      }
    }

    return NextResponse.json(
      {
        success: true,
        available,
        message,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json(
      createAuthError('Sunucu hatası'),
      { status: 500 }
    );
  }
}
