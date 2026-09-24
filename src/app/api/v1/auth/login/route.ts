import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secure_jwt_secret_key';

// Brute-force Protection: In-memory IP tracking map (IP -> { count, lockUntil })
const attemptTracker = new Map<string, { count: number; lockUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes lockout

export async function POST(req: Request) {
  // Get client IP address for rate limiting
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
  const now = Date.now();

  // 1. Check if IP is currently rate-limited
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

    // 2. Handle Invalid User or Inactive Account
    if (!user || !user.isActive) {
      trackFailedAttempt(ip);
      return NextResponse.json({ success: false, error: 'Invalid credentials or inactive account' }, { status: 401 });
    }

    // 3. Verify Password securely with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      trackFailedAttempt(ip);

      // Record Failed Login in Audit Log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          entity: 'User',
          entityId: user.id,
          ipAddress: ip,
        },
      }).catch(() => {}); // Catch silent logging errors

      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Clear failed attempts on successful login
    attemptTracker.delete(ip);

    // 4. Record Successful Login in Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        entity: 'User',
        entityId: user.id,
        ipAddress: ip,
      },
    }).catch(() => {});

    // 5. Generate Bank-Grade JWT Token (Expires in 8 Hours) - Includes name
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

    // 6. Set Secure HTTP-Only Cookies
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });

    response.cookies.set({
      name: 'user_role',
      value: user.role,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    // Cookie mein user_name bhi set karein
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

// Helper function to track failed login attempts per IP
function trackFailedAttempt(ip: string) {
  const now = Date.now();
  const record = attemptTracker.get(ip);
  if (!record || record.lockUntil <= now) {
    attemptTracker.set(ip, { count: 1, lockUntil: 0 });
  } else {
    record.count += 1;
    if (record.count >= MAX_ATTEMPTS) {
      record.lockUntil = now + LOCK_TIME_MS; // Lock for 15 minutes
    }
  }
}