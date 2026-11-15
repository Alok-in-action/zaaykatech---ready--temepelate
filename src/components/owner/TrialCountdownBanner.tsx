'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteStatus } from '@/types/database';
import { RazorpayCheckoutButton } from '@/components/owner/billing/RazorpayCheckoutButton';
import { Sparkles, AlertTriangle, Lock, Clock } from 'lucide-react';

interface TrialCountdownBannerProps {
  trialEndsAt: string;
  siteStatus: SiteStatus;
  restaurantId?: string;
  subscriptionEndDate?: string | null;
}

export function TrialCountdownBanner({
  trialEndsAt,
  siteStatus,
  restaurantId,
  subscriptionEndDate,
}: TrialCountdownBannerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    isExpired: boolean;
  }>({ hours: 0, minutes: 0, isExpired: false });

  useEffect(() => {
    function updateCountdown() {
      const now = new Date().getTime();
      const end = new Date(trialEndsAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, isExpired: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft({ hours, minutes, isExpired: false });
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [trialEndsAt]);

  // Active Paid Subscription State
  if (siteStatus === 'active') {
    if (!subscriptionEndDate) return null;
    const formattedDate = new Date(subscriptionEndDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return (
      <aside aria-label="Subscription Status" className="bg-emerald-950/95 text-emerald-200 border-b border-emerald-800/40 px-4 py-2 text-xs backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              <strong>Annual Pro Plan Active:</strong> Your public QR menu is live. Valid until <strong>{formattedDate}</strong>.
            </span>
          </div>
          <Link
            href="/owner/billing"
            className="text-emerald-300 hover:text-white underline text-[11px] font-medium transition-colors"
          >
            Manage Billing &amp; Invoices →
          </Link>
        </div>
      </aside>
    );
  }

  // Grace Period State
  if (siteStatus === 'grace_period') {
    return (
      <aside aria-label="Grace Period Alert" className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2.5 text-xs font-semibold shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-200" />
            <span>
              <strong>Trial Expired — 24-Hour Grace Period Active.</strong> Your public menu is still live, but will go offline soon.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <RazorpayCheckoutButton
              restaurantId={restaurantId}
              label="Upgrade Now (₹2,999/yr)"
              variant="secondary"
              className="bg-white text-orange-950 hover:bg-stone-100 h-7 text-[11px] font-bold px-3.5 rounded-full shadow-2xs"
            />
            <Link
              href="/owner/billing"
              className="text-white hover:underline text-[11px] font-medium hidden sm:inline"
            >
              Details
            </Link>
          </div>
        </div>
      </aside>
    );
  }

  // Expired / Payment Overdue State
  if (siteStatus === 'expired' || siteStatus === 'payment_overdue') {
    return (
      <aside aria-label="Expired Notification" className="bg-stone-900 text-stone-200 px-4 py-2.5 text-xs font-semibold border-b border-rose-900/50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Public QR Menu Offline.</strong> All your restaurant data, dishes, and QR codes are preserved safely.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <RazorpayCheckoutButton
              restaurantId={restaurantId}
              label="Reactivate Menu (₹2,999/yr)"
              variant="default"
              className="bg-rose-600 hover:bg-rose-500 text-white h-7 text-[11px] font-bold px-3.5 rounded-full shadow-2xs"
            />
            <Link
              href="/owner/billing"
              className="text-stone-300 hover:text-white underline text-[11px] font-medium hidden sm:inline"
            >
              Billing
            </Link>
          </div>
        </div>
      </aside>
    );
  }

  // Active Trial State
  return (
    <aside aria-label="Trial Countdown" className="bg-indigo-50/80 border-b border-indigo-200/60 text-stone-900 px-4 py-2 text-xs font-medium backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-indigo-700 animate-pulse shrink-0" />
          <span>
            <strong className="text-indigo-950">Your 24-hour trial is active</strong> —{' '}
            {timeLeft.isExpired
              ? 'Trial expiring shortly'
              : `${timeLeft.hours}h ${timeLeft.minutes}m remaining`}
          </span>
          <span className="hidden md:inline text-stone-500 text-[11px]">
            — Full features unlocked. Public QR menu is live.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <RazorpayCheckoutButton
            restaurantId={restaurantId}
            label="Upgrade Now — ₹2,999/yr"
            variant="default"
            className="bg-[#4338CA] hover:bg-[#3730A3] active:bg-[#312E81] text-white h-7 text-[11px] font-bold px-3.5 rounded-full shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 transition-all"
          />
          <Link
            href="/owner/billing"
            className="text-stone-600 hover:text-stone-900 underline text-[11px] font-medium hidden sm:inline"
          >
            Pricing Details
          </Link>
        </div>
      </div>
    </aside>
  );
}
