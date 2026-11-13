'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteStatus } from '@/types/database';

interface TrialCountdownBannerProps {
  trialEndsAt: string;
  siteStatus: SiteStatus;
}

export function TrialCountdownBanner({
  trialEndsAt,
  siteStatus,
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

  // Don't render banner if restaurant already has an active paid subscription
  if (siteStatus === 'active') {
    return null;
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
          <Link
            href="/owner/billing"
            className="bg-white text-orange-900 hover:bg-stone-100 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm flex-shrink-0"
          >
            Upgrade Now (₹2999/yr)
          </Link>
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
          <Link
            href="/owner/billing"
            className="bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm flex-shrink-0"
          >
            Reactivate Menu (₹2999/yr)
          </Link>
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
            — Full features unlocked. Public menu is ready to publish.
          </span>
        </div>
        <Link
          href="/owner/billing"
          className="bg-stone-950 hover:bg-stone-800 text-white px-3.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm flex-shrink-0"
        >
          Keep Live (₹2999/yr)
        </Link>
      </div>
    </div>
  );
}
