import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In to Owner Dashboard | ZaaykaTech',
  description: 'Sign in with your Google account to manage your restaurant digital menus, QR codes, and branding.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
