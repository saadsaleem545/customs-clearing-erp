import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email address dena lazmi hai.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Yeh email system mein registered nahi hai.' }, { status: 404 });
    }

    // Generate 6-digit random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save OTP to user record
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: otp,
        resetTokenExpiry: expiry,
      },
    });

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send Email
    await transporter.sendMail({
      from: '"HASH ERP Security" <no-reply@hasherp.com>',
      to: email,
      subject: 'Password Reset OTP - Customs Clearing ERP',
      text: `Aapka password reset verification code hai: ${otp}. Yeh code 10 minutes mein expire ho jayega.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc; border-radius: 10px;">
          <h2 style="color: #2563eb;">HASH ERP Security</h2>
          <p>Aapke account ke password reset ke liye verification code generate kiya gaya hai:</p>
          <div style="background: #2563eb; color: #fff; padding: 10px 20px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 8px; width: fit-content; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 12px;">Yeh code sirf 10 minutes ke liye valid hai. Agar aapne yeh request nahi ki toh is email ko ignore karein.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: 'OTP successfully aapke email par bhej diya gaya hai!' }, { status: 200 });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Email send karne mein error aagayi hai.' }, { status: 500 });
  }
}