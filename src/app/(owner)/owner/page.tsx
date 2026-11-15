import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOwnerLifecycle } from '@/lib/owner-lifecycle';
import { getPlatformAdminAllowlist } from '@/lib/admin/auth';
import { RazorpayCheckoutButton } from '@/components/owner/billing/RazorpayCheckoutButton';
import {
  Store,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  UtensilsCrossed,
  Palette,
  QrCode,
  CreditCard,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

export default async function OwnerDashboardPage() {
  const lifecycle = await getOwnerLifecycle();

  // Handle transient query failure with retryable error
  if (lifecycle.state === 'error') {
    throw new Error(lifecycle.error || 'Temporary database error retrieving restaurant. Please refresh to retry.');
  }

  // 1. If user has no restaurant, route allowlisted admin to /admin or owner to onboarding
  if (lifecycle.state === 'no_restaurant') {
    const adminAllowlist = getPlatformAdminAllowlist();
    if (adminAllowlist.length > 0) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && adminAllowlist.includes(user.id.toLowerCase())) {
        redirect('/admin');
      }
    }
    redirect('/owner/onboarding');
  }

  // 2. If restaurant exists but onboarding is incomplete, resume onboarding at last incomplete step
  if (lifecycle.state === 'onboarding_in_progress') {
    redirect('/owner/onboarding');
  }

  const restaurant = lifecycle.restaurant;
  if (!restaurant) {
    redirect('/owner/onboarding');
  }

  const supabase = await createClient();

  // Fetch category and item counts in parallel
  const [{ count: catCount }, { count: itmCount }] = await Promise.all([
    supabase
      .from('menu_categories')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true),
    supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .eq('is_available', true),
  ]);

  const categoryCount = catCount || 0;
  const itemCount = itmCount || 0;
  const publicUrl = `/r/${restaurant.slug}`;

  const isOffline = lifecycle.state === 'offline';
  const isExpired = lifecycle.state === 'expired';
  const isGrace = lifecycle.state === 'grace_period';
  const isTrial = lifecycle.state === 'trial_active';
  const isSubActive = lifecycle.state === 'subscription_active';

  const formattedRenewalDate = restaurant.subscription_end_date
    ? new Date(restaurant.subscription_end_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="space-y-6">
      {/* 0. Offline Notice Banner (Completed but unpublished) */}
      {isOffline && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-amber-950">
                Menu Currently Unpublished (Offline)
              </h2>
              <p className="text-xs text-amber-800 mt-1 max-w-xl">
                Your restaurant setup is complete, but the public menu is offline. You can edit your menu and branding below, or publish when ready to welcome diners.
              </p>
            </div>
          </div>
          <div className="shrink-0 w-full sm:w-auto">
            <Link
              href="/owner/onboarding?edit=true"
              className="inline-flex items-center justify-center px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-2xl shadow-xs transition-all w-full sm:w-auto"
            >
              Review &amp; Publish
            </Link>
          </div>
        </div>
      )}

      {/* 1. Subscription Expired Warning Banner (if expired) */}
      {isExpired && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-rose-950">
                Menu Offline: Your Subscription Has Expired
              </h2>
              <p className="text-xs text-rose-700 mt-1 max-w-xl">
                Your public QR menu at <code className="bg-rose-100/70 px-1 py-0.5 rounded font-mono text-[11px]">{publicUrl}</code> is currently showing the polite expired notice. Renew now for ₹2,999/yr to immediately reactivate the menu.
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <RazorpayCheckoutButton
              restaurantId={restaurant.id}
              label="Renew Now (₹2,999/yr)"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold w-full sm:w-auto"
            />
          </div>
        </div>
      )}

      {/* 2. Grace Period Warning Banner */}
      {isGrace && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-amber-950">
                Grace Period: {lifecycle.hoursRemaining} Hours Left to Renew
              </h2>
              <p className="text-xs text-amber-800 mt-0.5">
                Your QR menu is still live during this 24-hour courtesy period. Renew today to avoid interruption.
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <RazorpayCheckoutButton
              restaurantId={restaurant.id}
              label="Renew Plan (₹2,999/yr)"
              className="bg-amber-700 hover:bg-amber-800 text-white font-bold w-full sm:w-auto"
            />
          </div>
        </div>
      )}

      {/* 3. Header & Active Restaurant Status */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              {restaurant.name}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                restaurant.status === 'published' && !isExpired
                  ? 'bg-emerald-100 text-emerald-800'
                  : isExpired
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isExpired ? 'Expired' : restaurant.status}
            </span>
            <span className="text-xs font-mono bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-full">
              slug: {restaurant.slug}
            </span>
          </div>

          {/* Subscription State Summary */}
          <div className="flex items-center gap-2 text-xs text-stone-600 mt-1 flex-wrap">
            {isSubActive && (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Annual Pro: {lifecycle.daysRemaining} days remaining</span>
                {formattedRenewalDate && <span className="text-stone-400 font-normal">(renews on {formattedRenewalDate})</span>}
              </span>
            )}
            {isTrial && (
              <span className="inline-flex items-center gap-1 font-semibold text-[#8B4A27]">
                <Clock className="w-3.5 h-3.5" />
                <span>Free Trial: {lifecycle.hoursRemaining} hours left</span>
              </span>
            )}
            {isGrace && (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                <Clock className="w-3.5 h-3.5" />
                <span>Grace Period: {lifecycle.hoursRemaining} hours left</span>
              </span>
            )}
            {isExpired && (
              <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Plan Expired: Menu currently offline</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {restaurant.status === 'published' && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] active:bg-[#312E81] text-white text-xs font-semibold rounded-2xl shadow-xs transition-all text-center flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <span>View Public Menu</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
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

      {/* 4. Key Metrics Grid */}
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
          <p className="text-xs font-medium text-stone-400">Menu Public Status</p>
          <div className="flex items-center gap-1.5 mt-1">
            {restaurant.status === 'published' && !isExpired ? (
              <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Live Online
              </span>
            ) : isExpired ? (
              <span className="text-sm font-semibold text-rose-700 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Offline (Expired)
              </span>
            ) : (
              <span className="text-sm font-semibold text-amber-700 flex items-center gap-1">
                <Clock className="w-4 h-4" /> Draft
              </span>
            )}
          </div>
          <Link
            href="/owner/settings"
            className="text-[11px] text-[#8B4A27] font-semibold hover:underline mt-2 inline-block"
          >
            Publish settings →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/70 shadow-xs">
          <p className="text-xs font-medium text-stone-400">Subscription Status</p>
          <p className="text-base sm:text-lg font-serif font-bold text-[#8B4A27] mt-1">
            {isSubActive ? `${lifecycle.daysRemaining} days left` : isExpired ? 'Expired' : 'Trialing'}
          </p>
          <Link
            href="/owner/billing"
            className="text-[11px] text-[#8B4A27] font-semibold hover:underline mt-2 inline-block"
          >
            Manage billing →
          </Link>
        </div>
      </div>

      {/* 5. Core Feature Action Cards */}
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
            className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-[#4338CA] hover:bg-[#3730A3] active:bg-[#312E81] text-white text-xs font-semibold rounded-xl shadow-xs transition-all apple-press gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
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
