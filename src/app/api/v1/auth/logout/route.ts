import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

  // Clear HTTP-Only authentication cookies
  response.cookies.set({
    name: 'auth_token',
    value: '',
    maxAge: 0,
    path: '/',
  });

  response.cookies.set({
    name: 'user_role',
    value: '',
    maxAge: 0,
    path: '/',
  });

  return response;
}