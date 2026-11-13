import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Restaurant, SiteStatus } from '@/types/database';
import { calculateSiteStatus } from '@/lib/tenant/resolver';
import { TrialCountdownBanner } from '@/components/owner/TrialCountdownBanner';

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

  // Fetch owner's restaurant
  let restaurant: Restaurant | null = null;
  let siteStatus: SiteStatus = 'trialing';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (profile) {
      const { data: rest } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (rest) {
        restaurant = rest as unknown as Restaurant;
        siteStatus = calculateSiteStatus(restaurant);
      }
    }
  }

  // Fallback demo trial date for preview
  const trialEndsAt =
    restaurant?.trial_ends_at ||
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans">
      {/* 1. Real-time Trial Countdown Banner (Correction 8) */}
      <TrialCountdownBanner trialEndsAt={trialEndsAt} siteStatus={siteStatus} />

      {/* 2. Top Header Navigation */}
      <header className="bg-white border-b border-stone-200/80 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/owner" className="flex items-center gap-1.5">
              <span className="font-serif text-2xl font-black tracking-tight text-[#8B4A27]">
                Zaayka<span className="text-[#D2691E]">Tech</span>
              </span>
              <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                Owner
              </span>
            </Link>

            {restaurant && (
              <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-stone-200">
                <span className="text-xs font-medium text-stone-800">{restaurant.name}</span>
                <a
                  href={`/r/${restaurant.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#8B4A27] hover:underline flex items-center gap-0.5"
                >
                  <span>View Menu</span>
                  <span className="text-[10px]">↗</span>
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!restaurant && (
              <Link
                href="/owner/onboarding"
                className="px-3 py-1.5 bg-[#8B4A27] text-white text-xs font-semibold rounded-xl shadow-sm"
              >
                + Create Restaurant
              </Link>
            )}

            {restaurant && (
              <a
                href={`/r/${restaurant.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8B4A27]/10 hover:bg-[#8B4A27]/20 text-[#8B4A27] text-xs font-semibold rounded-xl transition-all"
              >
                <span>Live Menu</span>
                <span>↗</span>
              </a>
            )}
            <Link
              href="/owner/billing"
              className="px-3 py-1.5 bg-[#8B4A27] hover:bg-[#743c1e] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              Subscription
            </Link>
          </div>
        </div>

        {/* 3. Subnav Tabs */}
        <nav className="border-t border-stone-100 bg-stone-50/50 overflow-x-auto no-scrollbar">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 sm:gap-2 py-1.5 text-xs font-medium">
            <Link
              href="/owner"
              className="px-3 py-1.5 rounded-lg text-stone-800 hover:bg-stone-200/60 transition-colors whitespace-nowrap"
            >
              Overview
            </Link>
            <Link
              href="/owner/onboarding"
              className="px-3 py-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors whitespace-nowrap"
            >
              Setup Wizard
            </Link>
            <Link
              href="/owner/branding"
              className="px-3 py-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors whitespace-nowrap"
            >
              Branding &amp; Theme
            </Link>
            <Link
              href="/owner/qr"
              className="px-3 py-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors whitespace-nowrap"
            >
              QR Code
            </Link>
            <Link
              href="/owner/settings"
              className="px-3 py-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors whitespace-nowrap"
            >
              Settings &amp; Publish
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
