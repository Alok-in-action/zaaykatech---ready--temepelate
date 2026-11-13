import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Restaurant, SiteStatus } from '@/types/database';
import { calculateSiteStatus } from '@/lib/tenant/resolver';
import { Store, ArrowRight, CheckCircle2, Clock, Sparkles, UtensilsCrossed, Palette, QrCode } from 'lucide-react';

export default async function OwnerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let restaurants: Restaurant[] = [];
  let restaurant: Restaurant | null = null;
  let itemCount = 0;
  let categoryCount = 0;
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

        const cookieStore = await cookies();
        const activeCookieId = cookieStore.get('zaaykatech_active_restaurant')?.value;
        const matched = restaurants.find((r) => r.id === activeCookieId);

        restaurant = matched || restaurants[0];
        siteStatus = calculateSiteStatus(restaurant);

        // Fetch counts for active restaurant
        const { count: catCount } = await supabase
          .from('menu_categories')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id);
        const { count: itmCount } = await supabase
          .from('menu_items')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id);

        categoryCount = catCount || 0;
        itemCount = itmCount || 0;
      }
    }
  }

  // If no restaurant exists yet, show prompt to create one
  if (!restaurant) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 bg-[#8B4A27]/10 text-[#8B4A27] rounded-3xl flex items-center justify-center mx-auto">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-extrabold text-stone-900">
          Welcome to ZaaykaTech!
        </h1>
        <p className="text-sm text-stone-600 max-w-lg mx-auto">
          You haven&apos;t set up a restaurant yet. Launch your 24-hour full-access trial now in just 2 minutes.
        </p>
        <Link
          href="/owner/onboarding"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B4A27] hover:bg-[#723b1f] text-white font-bold rounded-2xl shadow-md transition-all text-sm"
        >
          <span>Create Your Restaurant →</span>
        </Link>
      </div>
    );
  }

  const publicUrl = `/r/${restaurant.slug}`;

  return (
    <div className="space-y-6">
      {/* 1. Header & Active Restaurant Status */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              {restaurant.name}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                restaurant.status === 'published'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {restaurant.status}
            </span>
            <span className="text-xs font-mono bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-full">
              slug: {restaurant.slug}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 max-w-xl">
            {restaurant.status === 'published'
              ? 'Your mobile-first QR menu is published and accessible to diners.'
              : 'Your restaurant is currently in draft. Complete your setup, add dishes, and publish when ready.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {restaurant.status === 'published' ? (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-[#8B4A27] hover:bg-[#723b1f] text-white text-xs font-semibold rounded-2xl shadow-xs transition-all text-center flex items-center justify-center gap-1.5"
            >
              <span>View Public Menu</span>
              <span>↗</span>
            </a>
          ) : (
            <Link
              href="/owner/settings"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-2xl shadow-xs transition-all text-center"
            >
              Review &amp; Publish Menu →
            </Link>
          )}

          <Link
            href="/owner/menu"
            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-2xl shadow-xs transition-all text-center"
          >
            Manage Dishes
          </Link>

          <Link
            href="/owner/qr"
            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-2xl transition-all text-center"
          >
            QR Code Kit
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/70 shadow-xs">
          <p className="text-xs font-medium text-stone-400">Total Categories</p>
          <p className="text-2xl font-serif font-bold text-stone-900 mt-1">{categoryCount}</p>
          <Link
            href="/owner/menu"
            className="text-[11px] text-[#8B4A27] font-semibold hover:underline mt-2 inline-block"
          >
            Manage categories →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/70 shadow-xs">
          <p className="text-xs font-medium text-stone-400">Menu Items</p>
          <p className="text-2xl font-serif font-bold text-stone-900 mt-1">{itemCount}</p>
          <Link
            href="/owner/menu"
            className="text-[11px] text-[#8B4A27] font-semibold hover:underline mt-2 inline-block"
          >
            Add or edit items →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/70 shadow-xs">
          <p className="text-xs font-medium text-stone-400">Public Status</p>
          <div className="flex items-center gap-1.5 mt-1">
            {restaurant.status === 'published' ? (
              <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Live Online
              </span>
            ) : (
              <span className="text-sm font-semibold text-amber-700 flex items-center gap-1">
                <Clock className="w-4 h-4" /> Draft / Offline
              </span>
            )}
          </div>
          <Link
            href="/owner/settings"
            className="text-[11px] text-[#8B4A27] font-semibold hover:underline mt-2 inline-block"
          >
            Configure publish →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/70 shadow-xs">
          <p className="text-xs font-medium text-stone-400">Subscription</p>
          <p className="text-lg font-serif font-bold text-[#8B4A27] mt-1">₹2,999 / year</p>
          <Link
            href="/owner/billing"
            className="text-[11px] text-[#8B4A27] font-semibold hover:underline mt-2 inline-block"
          >
            Manage billing →
          </Link>
        </div>
      </div>

      {/* 3. Your Owned Restaurants List (if multiple) */}
      {restaurants.length > 1 && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-[#8B4A27]" />
              <span>All Your Restaurants ({restaurants.length})</span>
            </h2>
            <Link
              href="/owner/onboarding"
              className="text-xs font-semibold text-[#8B4A27] hover:underline"
            >
              + Create Another
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {restaurants.map((r) => {
              const isCurrent = r.id === restaurant?.id;
              return (
                <div
                  key={r.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'border-[#8B4A27] bg-[#FAF8F5] ring-1 ring-[#8B4A27]/20'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-semibold text-xs text-stone-900 truncate">
                      {r.name}
                    </h3>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
                        r.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-stone-400 mb-3 truncate">
                    slug: {r.slug}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px]">
                    {isCurrent ? (
                      <span className="text-[#8B4A27] font-bold">● Active Now</span>
                    ) : (
                      <form
                        action={async () => {
                          'use server';
                          const cookieStore = await cookies();
                          cookieStore.set('zaaykatech_active_restaurant', r.id, {
                            path: '/',
                            httpOnly: true,
                            sameSite: 'lax',
                            maxAge: 60 * 60 * 24 * 30,
                          });
                        }}
                      >
                        <button
                          type="submit"
                          className="text-stone-600 hover:text-stone-900 font-semibold flex items-center gap-1"
                        >
                          <span>Switch to this</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </form>
                    )}
                    <Link
                      href="/owner/settings"
                      className="text-stone-500 hover:text-stone-800"
                    >
                      Settings
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Menu Management */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center mb-3">
              <UtensilsCrossed className="w-5 h-5 text-amber-800" />
            </div>
            <h3 className="font-serif text-base font-bold text-stone-900">
              Menu &amp; Dish Catalog
            </h3>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              Create categories, add single and multi-variant items, upload food photography, and toggle stock availability in real time.
            </p>
          </div>
          <Link
            href="/owner/menu"
            className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-[#8B4A27] hover:bg-[#723b1f] text-white text-xs font-semibold rounded-xl shadow-xs transition-all apple-press gap-1.5"
          >
            <span>Open Menu Manager</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 2: Custom Branding & Theme */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center mb-3">
              <Palette className="w-5 h-5 text-stone-700" />
            </div>
            <h3 className="font-serif text-base font-bold text-stone-900">
              Branding &amp; Media
            </h3>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              Upload your logo, high-definition background video (up to 50MB), poster images, and customize brand palettes.
            </p>
          </div>
          <Link
            href="/owner/branding"
            className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all apple-press gap-1.5"
          >
            <span>Customize Branding</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3: QR Code Generator */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center mb-3">
              <QrCode className="w-5 h-5 text-stone-700" />
            </div>
            <h3 className="font-serif text-base font-bold text-stone-900">
              Print-Ready QR Stickers
            </h3>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              Download 1024px PNG or vector SVG format with your restaurant name and scan instructions ready for table tents.
            </p>
          </div>
          <Link
            href="/owner/qr"
            className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all apple-press gap-1.5"
          >
            <span>Download QR Kit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
