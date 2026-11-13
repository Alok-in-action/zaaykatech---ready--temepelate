import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Restaurant, SiteStatus } from '@/types/database';
import { calculateSiteStatus } from '@/lib/tenant/resolver';

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

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans">
      {/* 1. Trial / Site Status Banner */}
      {siteStatus === 'trialing' || siteStatus === 'trial_ending' ? (
        <div className="bg-amber-500 text-stone-950 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2">
              <span className="animate-pulse">⏳</span>
              <span>24-Hour Full-Access Trial Active</span>
              <span className="hidden sm:inline font-normal text-stone-900">
                — Your public QR menu is live. Upgrade anytime to ensure zero downtime.
              </span>
            </div>
            <Link
              href="/owner/billing"
              className="bg-stone-950 hover:bg-stone-800 text-white px-3 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm"
            >
              Upgrade (₹2999/yr)
            </Link>
          </div>
        </div>
      ) : siteStatus === 'grace_period' ? (
        <div className="bg-rose-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>Grace Period Active! Your public menu will go offline soon.</span>
            </div>
            <Link
              href="/owner/billing"
              className="bg-white hover:bg-stone-100 text-rose-700 px-3 py-1 rounded-full text-[11px] font-bold transition-all"
            >
              Reactivate Now
            </Link>
          </div>
        </div>
      ) : siteStatus === 'expired' ? (
        <div className="bg-stone-900 text-rose-400 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <span>Public QR Menu is Currently Offline.</span>
            </div>
            <Link
              href="/owner/billing"
              className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-full text-[11px] font-bold transition-all"
            >
              Activate Menu (₹2999)
            </Link>
          </div>
        </div>
      ) : null}

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
              href="/owner/menu"
              className="px-3 py-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors whitespace-nowrap"
            >
              Menu &amp; Categories
            </Link>
            <Link
              href="/owner/menu/ai-import"
              className="px-3 py-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors whitespace-nowrap flex items-center gap-1"
            >
              <span>AI Import</span>
              <span className="text-[9px] bg-amber-200/70 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                Gemini
              </span>
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
              href="/owner/billing"
              className="px-3 py-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors whitespace-nowrap"
            >
              Billing (₹2999/yr)
            </Link>
            <Link
              href="/owner/settings"
              className="px-3 py-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors whitespace-nowrap"
            >
              Settings
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

