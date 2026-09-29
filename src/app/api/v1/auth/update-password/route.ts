import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secure_jwt_secret_key';

export async function POST(req: Request) {
  try {
    // Cookie se verify karein ke user logged in hai
    const token = req.headers.get('cookie')?.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const { currentPassword, newPassword } = await req.json();

    if (!newPassword || newPassword.length < 3) {
      return NextResponse.json({ success: false, error: 'Password must be at least 3 characters' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Optional: Agar current password verify karna ho
    if (currentPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json({ success: false, error: 'Incorrect current password!' }, { status: 400 });
      }
    }

    // Naye password ko hash karein
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Database mein update karein
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully in database!' });
  } catch (err) {
    console.error('Password update error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}