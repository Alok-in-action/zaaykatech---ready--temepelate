'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, CreditCard, HelpCircle, ShieldCheck } from 'lucide-react';
import { SubscriptionCard } from '@/components/owner/billing/SubscriptionCard';
import { getSubscriptionStatus } from '@/actions/subscription';
import { SiteStatus } from '@/types/database';

export default function BillingPage() {
  const [restaurantId] = useState<string>('00000000-0000-0000-0000-000000000000');
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
        const res = await getSubscriptionStatus(restaurantId);
        if (res.success && res.data) {
          setRestaurantName(res.data.name);
          setSiteStatus(res.data.siteStatus as SiteStatus);
          setSubscriptionEndDate(res.data.subscriptionEndDate);
          setTrialEndsAt(res.data.trialEndsAt);
        }
      } catch (err) {
        console.warn('Could not fetch subscription status (using dev defaults):', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, [restaurantId]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/owner/settings" className="hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Settings</span>
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Subscription &amp; Billing</span>
      </div>

      {/* HEADER */}
      <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Subscription &amp; Billing
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-2 max-w-xl">
            Manage your yearly plan for <strong>{restaurantName}</strong>. Simple flat pricing, zero automatic recurring deductions, and instant menu reactivation.
          </p>
        </div>

        <Link
          href="/owner/settings"
          className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-muted transition-colors shrink-0"
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
      <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
          <HelpCircle className="h-4 w-4 text-primary" />
          <span>Frequently Asked Questions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground pt-2">
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              Do I ever need to reprint my QR code when renewing?
            </p>
            <p>
              Never. Your printed table QR codes and your custom link remain identical. Once your payment succeeds, your existing QR code reactivates instantly.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              Will my credit card or bank account be debited automatically?
            </p>
            <p>
              No. We strictly believe in zero hidden renewal surprises. Every subscription renewal is 100% manual directly from your dashboard.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              What happens to my dishes and photos if my trial or plan expires?
            </p>
            <p>
              All your dishes, categories, photos, branding, and QR codes are preserved safely in your account. You can log in and edit your menu anytime.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              How does the 24-hour grace period work?
            </p>
            <p>
              After your 24-hour trial ends, your public QR menu stays live for an extra 24 hours (grace period) to give you time to subscribe without interrupting your diners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
