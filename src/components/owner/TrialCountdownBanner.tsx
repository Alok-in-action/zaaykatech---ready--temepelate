'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteStatus } from '@/types/database';
import { RazorpayCheckoutButton } from '@/components/owner/billing/RazorpayCheckoutButton';

interface TrialCountdownBannerProps {
  trialEndsAt: string;
  siteStatus: SiteStatus;
  restaurantId?: string;
  subscriptionEndDate?: string | null;
}

export function TrialCountdownBanner({
  trialEndsAt,
  siteStatus,
  restaurantId = '00000000-0000-0000-0000-000000000000',
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
    const interval = setInterval(updateCountdown, 60000); // Update every minute
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
      <div className="bg-emerald-950 text-emerald-200 border-b border-emerald-800/40 px-4 py-2 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✨</span>
            <span>
              <strong>Yearly Pro Plan Active:</strong> Your public QR menu is live. Subscription valid until <strong>{formattedDate}</strong>.
            </span>
          </div>
          <Link
            href="/owner/billing"
            className="text-emerald-300 hover:text-white underline text-[11px] font-medium"
          >
            Manage Billing &amp; Invoices →
          </Link>
        </div>
      </div>
    );
  }

  // Grace Period State
  if (siteStatus === 'grace_period') {
    return (
      <div className="bg-orange-500 text-white px-4 py-2.5 text-xs font-semibold shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>
              <strong>Trial Expired — 24-Hour Grace Period Active.</strong> Your public menu is still live, but will go offline soon.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <RazorpayCheckoutButton
              restaurantId={restaurantId}
              label="Upgrade Now (₹2,999/yr)"
              variant="secondary"
              className="bg-white text-orange-950 hover:bg-stone-100 h-7 text-[11px] font-bold px-3 rounded-full shadow-sm"
            />
            <Link
              href="/owner/billing"
              className="text-white hover:underline text-[11px] font-medium hidden sm:inline"
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Expired / Payment Overdue State
  if (siteStatus === 'expired' || siteStatus === 'payment_overdue') {
    return (
      <div className="bg-stone-900 text-rose-400 px-4 py-2.5 text-xs font-semibold shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🔒</span>
            <span>
              <strong>Public QR Menu Offline.</strong> All your restaurant data, QR code, and dishes are saved safely.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <RazorpayCheckoutButton
              restaurantId={restaurantId}
              label="Reactivate Menu (₹2,999/yr)"
              variant="default"
              className="bg-rose-600 hover:bg-rose-500 text-white h-7 text-[11px] font-bold px-3 rounded-full shadow-sm"
            />
            <Link
              href="/owner/billing"
              className="text-stone-300 hover:text-white underline text-[11px] font-medium hidden sm:inline"
            >
              Billing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active Trial State
  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-stone-950 px-4 py-2 text-xs font-medium shadow-sm">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="animate-pulse text-sm">⏳</span>
          <span>
            <strong>24-Hour Free Trial:</strong>{' '}
            {timeLeft.isExpired
              ? 'Trial expiring shortly'
              : `${timeLeft.hours}h ${timeLeft.minutes}m remaining`}
          </span>
          <span className="hidden md:inline text-stone-900 text-[11px]">
            — Full features unlocked. Public menu is live.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <RazorpayCheckoutButton
            restaurantId={restaurantId}
            label="Keep Live (₹2,999/yr)"
            variant="default"
            className="bg-stone-950 hover:bg-stone-800 text-white h-7 text-[11px] font-bold px-3 rounded-full shadow-sm"
          />
          <Link
            href="/owner/billing"
            className="text-stone-900 hover:underline text-[11px] font-medium hidden sm:inline"
          >
            Plan Details
          </Link>
        </div>
      </div>
    </div>
  );
}
