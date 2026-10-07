import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ success: false, message: 'All fields are required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.resetToken !== otp || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json({ success: false, message: 'Invalid or expired OTP code entered.' }, { status: 400 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ success: true, message: 'Password successfully updated!' }, { status: 200 });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ success: false, message: error.message || 'An error occurred while resetting the password.' }, { status: 500 });
  }
}