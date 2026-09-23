import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import DashboardLayoutContent from './DashboardLayoutContent';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'supersecretkey123'
);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/');
  }

  let userName = 'Saad Saleem';
  let userRole = 'SUPER_ADMIN';

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.name) userName = payload.name as string;
    if (payload.role) userRole = payload.role as string;
  } catch (err) {
    redirect('/');
  }

  return (
    <DashboardLayoutContent userName={userName} userRole={userRole}>
      {children}
    </DashboardLayoutContent>
  );
}