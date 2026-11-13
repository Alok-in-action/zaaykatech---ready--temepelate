'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, ShieldCheck, Clock, AlertTriangle, Lock } from 'lucide-react';
import { RazorpayCheckoutButton } from '@/components/owner/billing/RazorpayCheckoutButton';
import { SiteStatus } from '@/types/database';

interface SubscriptionCardProps {
  restaurantId: string;
  restaurantName: string;
  siteStatus: SiteStatus;
  subscriptionEndDate: string | null;
  trialEndsAt: string;
}

export function SubscriptionCard({
  restaurantId,
  restaurantName,
  siteStatus,
  subscriptionEndDate,
  trialEndsAt,
}: SubscriptionCardProps) {
  const isPaidActive = siteStatus === 'active';
  const isGracePeriod = siteStatus === 'grace_period';
  const isExpired = siteStatus === 'expired' || siteStatus === 'payment_overdue';

  const formattedEndDate = subscriptionEndDate
    ? new Date(subscriptionEndDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const formattedTrialEnd = new Date(trialEndsAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className="border border-stone-200/80 shadow-sm max-w-xl w-full rounded-3xl bg-white overflow-hidden">
      <CardHeader className="space-y-3 p-6 sm:p-8 bg-[#FAF8F5]/50 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={`text-xs px-3 py-1 font-semibold rounded-full ${
              isPaidActive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : isGracePeriod
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : isExpired
                ? 'bg-rose-50 text-rose-800 border-rose-300'
                : 'bg-[#8B4A27]/10 text-[#8B4A27] border-[#8B4A27]/20'
            }`}
          >
            {isPaidActive
              ? 'Active Pro Plan'
              : isGracePeriod
              ? 'Grace Period'
              : isExpired
              ? 'Expired (Offline)'
              : '24-Hour Free Trial'}
          </Badge>

          <div className="text-right">
            <span className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-stone-900">
              ₹2,999
            </span>
            <span className="text-xs text-stone-500 font-sans ml-1">/ year</span>
          </div>
        </div>

        <div>
          <CardTitle className="text-xl font-serif font-bold text-stone-900">
            Yearly Pro Plan
          </CardTitle>
          <CardDescription className="text-xs text-stone-500 mt-1">
            Keep your restaurant&apos;s digital QR menu live with unlimited dishes, AI imports, and custom branding.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-6 sm:p-8">
        {/* Status Notification Box */}
        {isPaidActive && formattedEndDate && (
          <div className="rounded-2xl p-4 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="leading-relaxed">
              Your subscription is active and valid until <strong>{formattedEndDate}</strong>. Renewing now extends your end date by +365 days.
            </span>
          </div>
        )}

        {isGracePeriod && (
          <div className="rounded-2xl p-4 bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <span className="leading-relaxed">
              Your trial expired. You are currently in the <strong>24-hour grace period</strong>. Upgrade now to prevent your public QR menu from going offline.
            </span>
          </div>
        )}

        {isExpired && (
          <div className="rounded-2xl p-4 bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-3">
            <Lock className="h-5 w-5 shrink-0 text-rose-600" />
            <span className="leading-relaxed">
              Your public QR menu is offline. Your menu data and QR code are preserved. Subscribe now to reactivate the live menu immediately.
            </span>
          </div>
        )}

        {!isPaidActive && !isGracePeriod && !isExpired && (
          <div className="rounded-2xl p-4 bg-[#FAF8F5] border border-stone-200/80 text-xs text-stone-600 flex items-center gap-3">
            <Clock className="h-5 w-5 shrink-0 text-[#8B4A27]" />
            <span className="leading-relaxed">
              Free full-access trial active until <strong>{formattedTrialEnd}</strong>.
            </span>
          </div>
        )}

        {/* Features Checklist */}
        <div className="space-y-2.5 pt-2 border-t border-stone-100">
          <p className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
            Everything Included in Plan:
          </p>
          <ul className="text-xs space-y-2.5 text-stone-600">
            <li className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="h-2.5 w-2.5" />
              </span>
              <span>Unlimited menu categories &amp; dishes</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="h-2.5 w-2.5" />
              </span>
              <span>AI Menu Import using Google Gemini</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="h-2.5 w-2.5" />
              </span>
              <span>Custom colors, branding, logo &amp; hero media</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="h-2.5 w-2.5" />
              </span>
              <span>High-resolution print-ready QR codes (PNG &amp; SVG)</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="h-2.5 w-2.5" />
              </span>
              <span>Fast global CDN media storage</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="h-2.5 w-2.5" />
              </span>
              <span>Manual renewal — zero automatic recurring deductions</span>
            </li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="p-6 sm:p-8 bg-stone-50/60 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <span className="text-[11px] text-stone-500">
          Instant activation via UPI, Cards, NetBanking (Razorpay)
        </span>
        <RazorpayCheckoutButton
          restaurantId={restaurantId}
          label={
            isPaidActive
              ? 'Extend Plan (+365 Days) • ₹2,999'
              : isExpired
              ? 'Reactivate Menu Now • ₹2,999'
              : 'Upgrade to Yearly Pro • ₹2,999'
          }
          className="px-6 py-3 bg-[#8B4A27] hover:bg-[#723b1f] text-white text-xs font-bold rounded-2xl shadow-sm transition-all apple-press shrink-0 text-center"
        />
      </CardFooter>
    </Card>
  );
}
