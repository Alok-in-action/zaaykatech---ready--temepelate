import React from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Restaurant, SiteStatus } from '@/types/database';
import { calculateSiteStatus } from '@/lib/tenant/resolver';
import { TrialCountdownBanner } from '@/components/owner/TrialCountdownBanner';
import { OwnerHeader } from '@/components/owner/OwnerHeader';

export const metadata: Metadata = {
  title: 'Owner Portal | ZaaykaTech',
  description: 'Manage menu items, pricing variants, branding, and QR kits for your restaurants.',
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

  // Fetch all owner's restaurants
  let restaurants: Restaurant[] = [];
  let activeRestaurant: Restaurant | null = null;
  let siteStatus: SiteStatus = 'trialing';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (profile) {
      const { data: userRestaurants } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (userRestaurants && userRestaurants.length > 0) {
        restaurants = userRestaurants as unknown as Restaurant[];

        // Check active restaurant from cookie
        const cookieStore = await cookies();
        const activeCookieId = cookieStore.get('zaaykatech_active_restaurant')?.value;
        const matched = restaurants.find((r) => r.id === activeCookieId);

        activeRestaurant = matched || restaurants[0];
        siteStatus = calculateSiteStatus(activeRestaurant);
      }
    }
  }

  // Trial date for active restaurant
  const trialEndsAt =
    activeRestaurant?.trial_ends_at ||
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans">
      {/* 1. Real-time Trial Countdown Banner */}
      <TrialCountdownBanner
        trialEndsAt={trialEndsAt}
        siteStatus={siteStatus}
        restaurantId={activeRestaurant?.id}
      />

      {/* 2. Owner Header with Restaurant Switcher & Tabs */}
      <OwnerHeader
        userEmail={user?.email}
        restaurants={restaurants}
        activeRestaurant={activeRestaurant}
      />

      {/* 3. Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
