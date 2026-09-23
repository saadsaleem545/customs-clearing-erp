import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'supersecretkey123'
);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const { pathname } = req.url ? new URL(req.url) : { pathname: '' };

  // Protected routes ki list jo bina login ke open nahi honi chahiye
  const protectedPaths = [
    '/dashboard',
    '/parties',
    '/imports',
    '/analysis',
    '/exports',
    '/reconciliation'
  ];

  // Check karein ke current URL in protected paths se start hota hai ya nahi
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected) {
    if (!token) {
      // Agar token nahi hai, toh seedha login/landing page par redirect kar dein
      return NextResponse.redirect(new URL('/', req.url));
    }

    try {
      // Token ko cryptographically verify karein
      await jwtVerify(token, JWT_SECRET);
    } catch (err) {
      // Agar token fake ya expired hai, toh cookie clear karke login par bhej dein
      const response = NextResponse.redirect(new URL('/', req.url));
      response.cookies.delete('auth_token');
      response.cookies.delete('user_role');
      return response;
    }
  }

  // Agar user logged in hai aur root/login page par jana chahta hai, toh dashboard par bhej dein
  if (pathname === '/' && token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.redirect(new URL('/dashboard', req.url));
    } catch (err) {
      // Invalid token, allow access to landing page
    }
  }

  return NextResponse.next();
}

// Middleware ko in sabhi paths par active kar diya gaya hai
export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/parties/:path*',
    '/imports/:path*',
    '/analysis/:path*',
    '/exports/:path*',
    '/reconciliation/:path*'
  ],
};