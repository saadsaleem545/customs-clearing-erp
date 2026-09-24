import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // <-- Apne shared prisma instance ko import karein
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secure_jwt_secret_key';

// Brute-force Protection: In-memory IP tracking map
const attemptTracker = new Map<string, { count: number; lockUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes lockout

export async function POST(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
  const now = Date.now();

  const record = attemptTracker.get(ip);
  if (record && record.lockUntil > now) {
    const minutesLeft = Math.ceil((record.lockUntil - now) / 60000);
    return NextResponse.json(
      { success: false, error: `Too many failed login attempts. IP temporarily blocked for ${minutesLeft} minutes.` },
      { status: 429 }
    );
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      trackFailedAttempt(ip);
      return NextResponse.json({ success: false, error: 'Invalid credentials or inactive account' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      trackFailedAttempt(ip);

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          entity: 'User',
          entityId: user.id,
          ipAddress: ip,
        },
      }).catch(() => {});

      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    attemptTracker.delete(ip);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        entity: 'User',
        entityId: user.id,
        ipAddress: ip,
      },
    }).catch(() => {});

    const token = jwt.sign(
      { userId: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const response = NextResponse.json({
      success: true,
      message: 'Login successful with enterprise security',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    response.cookies.set({
      name: 'user_role',
      value: user.role,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    response.cookies.set({
      name: 'user_name',
      value: user.name,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

function trackFailedAttempt(ip: string) {
  const now = Date.now();
  const record = attemptTracker.get(ip);
  if (!record || record.lockUntil <= now) {
    attemptTracker.set(ip, { count: 1, lockUntil: 0 });
  } else {
    record.count += 1;
    if (record.count >= MAX_ATTEMPTS) {
      record.lockUntil = now + LOCK_TIME_MS;
    }
  }
}