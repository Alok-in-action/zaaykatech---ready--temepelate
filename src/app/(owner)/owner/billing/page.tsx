'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, CreditCard, HelpCircle, ShieldCheck } from 'lucide-react';
import { SubscriptionCard } from '@/components/owner/billing/SubscriptionCard';
import { getSubscriptionStatus } from '@/actions/subscription';
import { getOwnerRestaurant } from '@/actions/restaurant';
import { SiteStatus } from '@/types/database';

export default function BillingPage() {
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [restaurantName, setRestaurantName] = useState('My Restaurant');
  const [siteStatus, setSiteStatus] = useState<SiteStatus>('trialing');
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        setLoading(true);
        const savedId = typeof window !== 'undefined' ? localStorage.getItem('zaayka_active_restaurant_id') : null;
        const rRes = await getOwnerRestaurant(savedId || undefined);
        if (rRes.success && rRes.restaurant) {
          const activeId = rRes.restaurant.id;
          setRestaurantId(activeId);
          setRestaurantName(rRes.restaurant.name);

          const res = await getSubscriptionStatus(activeId);
          if (res.success && res.data) {
            setRestaurantName(res.data.name);
            setSiteStatus(res.data.siteStatus as SiteStatus);
            setSubscriptionEndDate(res.data.subscriptionEndDate);
            setTrialEndsAt(res.data.trialEndsAt);
          }
        }
      } catch (err) {
        console.warn('Could not fetch subscription status:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs text-stone-500">
        <Link href="/owner/settings" className="hover:text-stone-900 flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Settings</span>
        </Link>
        <span>/</span>
        <span className="text-stone-900 font-medium">Subscription &amp; Billing</span>
      </div>

      {/* HEADER */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-[#8B4A27]/10 text-[#8B4A27]">
              <CreditCard className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-serif font-bold tracking-tight text-stone-900">
              Subscription &amp; Billing
            </h1>
          </div>
          <p className="text-xs text-stone-500 max-w-xl">
            Manage your annual plan for <strong>{restaurantName}</strong>. Simple flat pricing, zero automated card deductions, and instant menu reactivation.
          </p>
        </div>

        <Link
          href="/owner/settings"
          className="px-4 py-2 border border-stone-300 rounded-2xl text-xs font-semibold hover:bg-stone-50 text-stone-700 transition-colors shrink-0 apple-press shadow-xs"
        >
          Restaurant Settings
        </Link>
      </div>

      {/* SUBSCRIPTION CARD */}
      <div className="flex justify-center">
        <SubscriptionCard
          restaurantId={restaurantId}
          restaurantName={restaurantName}
          siteStatus={siteStatus}
          subscriptionEndDate={subscriptionEndDate}
          trialEndsAt={trialEndsAt}
        />
      </div>

      {/* FAQ SECTION */}
      <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm">
          <HelpCircle className="h-4 w-4 text-[#8B4A27]" />
          <span>Frequently Asked Questions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-stone-600 pt-2">
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/60 space-y-1">
            <p className="font-semibold text-stone-900">
              Do I ever need to reprint my QR code when renewing?
            </p>
            <p className="leading-relaxed">
              Never. Your printed table QR codes and custom link remain identical. Once your payment succeeds, your existing QR code reactivates instantly.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/60 space-y-1">
            <p className="font-semibold text-stone-900">
              Will my credit card or bank account be debited automatically?
            </p>
            <p className="leading-relaxed">
              No. We strictly believe in zero hidden renewal surprises. Every subscription renewal is 100% manual directly from your dashboard.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/60 space-y-1">
            <p className="font-semibold text-stone-900">
              What happens to my dishes and photos if my trial or plan expires?
            </p>
            <p className="leading-relaxed">
              All your dishes, categories, photos, branding, and QR codes are preserved safely in your account. You can log in and edit your menu anytime.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/60 space-y-1">
            <p className="font-semibold text-stone-900">
              How does the 24-hour grace period work?
            </p>
            <p className="leading-relaxed">
              After your 24-hour trial ends, your public QR menu stays live for an extra 24 hours (grace period) to give you time to subscribe without interrupting your diners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
