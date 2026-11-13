import React from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getOwnerLifecycle } from '@/lib/owner-lifecycle';
import { TrialCountdownBanner } from '@/components/owner/TrialCountdownBanner';
import { OwnerHeader } from '@/components/owner/OwnerHeader';

export const metadata: Metadata = {
  title: 'Owner Portal | ZaaykaTech',
  description: 'Manage menu items, pricing variants, branding, and QR kits for your restaurant.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // In production without auth, redirect to login
  const isDevWithoutSupabase =
    process.env.NODE_ENV === 'development' &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder'));

  if (!user && !isDevWithoutSupabase) {
    redirect('/login');
  }

  // Authoritative single-restaurant lifecycle resolution
  const lifecycle = await getOwnerLifecycle();
  const activeRestaurant = lifecycle.restaurant;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans">
      {/* 1. Real-time Trial & Subscription Countdown Banner (only for published restaurants) */}
      {activeRestaurant && activeRestaurant.status === 'published' && (
        <TrialCountdownBanner
          trialEndsAt={lifecycle.trialEndsAt || new Date().toISOString()}
          siteStatus={lifecycle.siteStatus}
          restaurantId={activeRestaurant.id}
        />
      )}

      {/* 2. Owner Header with Single Restaurant Identity */}
      <OwnerHeader
        userEmail={user?.email}
        activeRestaurant={activeRestaurant}
      />

      {/* 3. Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
