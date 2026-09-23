import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }

    // Check karein ke email pehle se registered toh nahi hai
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'Email is already registered' }, { status: 400 });
    }

    // Password ko secure hash banayein
    const hashedPassword = await bcrypt.hash(password, 10);

    // Naya admin user create karein
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN', // Pehla register karne wala ya admin SUPER_ADMIN ban sakta hai
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin account registered successfully',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}