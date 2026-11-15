import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { verifyPlatformAdmin } from '@/lib/admin/auth';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AccessDenied } from '@/components/admin/AccessDenied';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Platform Admin | ZaaykaTech Operator Portal',
  description: 'ZaaykaTech platform observability, tenant monitoring, payments, and system health.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await verifyPlatformAdmin();

  if (!auth.authorized) {
    if (auth.reason === 'unauthenticated') {
      redirect('/login?next=/admin');
    }
    return <AccessDenied reason={auth.reason} userId={auth.userId} email={auth.email} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans">
      <AdminHeader userEmail={auth.email} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
      <footer className="border-t border-stone-200/80 py-4 px-6 text-center text-xs text-stone-400">
        ZaaykaTech Operator Observability Panel — Read-Only Production Mode
      </footer>
    </div>
  );
}
