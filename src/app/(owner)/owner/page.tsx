import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Restaurant, SiteStatus } from '@/types/database';
import { calculateSiteStatus, getDemoFallbackTenant } from '@/lib/tenant/resolver';

export default async function OwnerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

        // Fetch counts
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

  // Fallback to demo restaurant preview if database not yet initialized or dev mode
  if (!restaurant) {
    const demo = getDemoFallbackTenant('demo');
    restaurant = demo.restaurant;
    categoryCount = demo.categories.length;
    itemCount = demo.items.length;
    siteStatus = demo.siteStatus;
  }

  const publicUrl = `/r/${restaurant.slug}`;

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Status */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              {restaurant.name}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                siteStatus === 'active'
                  ? 'bg-emerald-100 text-emerald-800'
                  : siteStatus === 'trialing' || siteStatus === 'trial_ending'
                  ? 'bg-amber-100 text-amber-800'
                  : siteStatus === 'grace_period'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {siteStatus.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 max-w-xl">
            Your mobile-first QR menu is ready. Customers can scan your QR code or browse your public menu link instantly.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-[#8B4A27] hover:bg-[#723b1f] text-white text-xs font-semibold rounded-2xl shadow-sm transition-all text-center flex items-center justify-center gap-1.5"
          >
            <span>Open Public Menu</span>
            <span>↗</span>
          </a>
          <Link
            href="/owner/qr"
            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-2xl transition-all text-center"
          >
            Download QR Kit
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/70 shadow-sm">
          <p className="text-xs font-medium text-stone-400">Total Categories</p>
          <p className="text-2xl font-serif font-bold text-stone-900 mt-1">{categoryCount}</p>
          <Link
            href="/owner/menu"
            className="text-[11px] text-[#8B4A27] font-semibold hover:underline mt-2 inline-block"
          >
            Manage categories →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/70 shadow-sm">
          <p className="text-xs font-medium text-stone-400">Menu Items</p>
          <p className="text-2xl font-serif font-bold text-stone-900 mt-1">{itemCount}</p>
          <Link
            href="/owner/menu"
            className="text-[11px] text-[#8B4A27] font-semibold hover:underline mt-2 inline-block"
          >
            View all items →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/70 shadow-sm">
          <p className="text-xs font-medium text-stone-400">QR Code Scans</p>
          <p className="text-2xl font-serif font-bold text-stone-900 mt-1">0</p>
          <span className="text-[11px] text-stone-400 mt-2 inline-block">Real-time counter</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/70 shadow-sm">
          <p className="text-xs font-medium text-stone-400">Subscription</p>
          <p className="text-lg font-serif font-bold text-[#8B4A27] mt-1">₹2999 / year</p>
          <Link
            href="/owner/billing"
            className="text-[11px] text-[#8B4A27] font-semibold hover:underline mt-2 inline-block"
          >
            View plan details →
          </Link>
        </div>
      </div>

      {/* 3. Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: AI Menu Extraction */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 rounded-3xl border border-amber-200/70 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-amber-200/70 text-amber-900 flex items-center justify-center text-lg mb-3">
              ✨
            </div>
            <h3 className="font-serif text-base font-bold text-stone-900">
              AI Menu Import
            </h3>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              Upload a photo or PDF of your physical paper menu. Google Gemini extracts all categories, dishes, prices, and tags in seconds.
            </p>
          </div>
          <Link
            href="/owner/menu/ai-import"
            className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            Try AI Menu Import
          </Link>
        </div>

        {/* Card 2: Custom Branding & Theme */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center text-lg mb-3">
              🎨
            </div>
            <h3 className="font-serif text-base font-bold text-stone-900">
              Branding &amp; Hero Video
            </h3>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              Upload your restaurant logo, captivating background video or poster image, custom colors, and social links.
            </p>
          </div>
          <Link
            href="/owner/branding"
            className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            Customize Branding
          </Link>
        </div>

        {/* Card 3: Yearly Plan */}
        <div className="bg-gradient-to-br from-[#8B4A27]/10 to-[#D2691E]/10 p-6 rounded-3xl border border-[#8B4A27]/20 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-[#8B4A27] text-white flex items-center justify-center text-lg mb-3">
              💳
            </div>
            <h3 className="font-serif text-base font-bold text-stone-900">
              ZaaykaTech Yearly
            </h3>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              Keep your menu live 365 days a year for just ₹2,999. Includes unlimited items, AI OCR, instant updates, and QR downloads.
            </p>
          </div>
          <Link
            href="/owner/billing"
            className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-[#8B4A27] hover:bg-[#723b1f] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            Upgrade Now (₹2999/yr)
          </Link>
        </div>
      </div>
    </div>
  );
}

