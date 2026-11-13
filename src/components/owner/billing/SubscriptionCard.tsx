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
    <Card className="border border-border/80 shadow-sm max-w-xl">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={`text-xs px-2.5 py-0.5 font-semibold ${
              isPaidActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                : isGracePeriod
                ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                : isExpired
                ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300'
                : 'bg-primary/10 text-primary border-primary/30'
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

          <span className="text-2xl font-bold font-serif text-foreground">
            ₹2,999 <span className="text-xs font-normal text-muted-foreground font-sans">/ year</span>
          </span>
        </div>

        <CardTitle className="text-xl">Yearly Pro Plan</CardTitle>
        <CardDescription>
          Keep your restaurant&apos;s digital QR menu live with unlimited dishes, AI imports, and custom branding.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Notification Box */}
        {isPaidActive && formattedEndDate && (
          <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              Your subscription is active and valid until <strong>{formattedEndDate}</strong>. Renewing now extends your end date by +365 days.
            </span>
          </div>
        )}

        {isGracePeriod && (
          <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Your trial expired. You are currently in the <strong>24-hour grace period</strong>. Upgrade now to prevent your public QR menu from going offline.
            </span>
          </div>
        )}

        {isExpired && (
          <div className="rounded-xl p-3 bg-rose-500/10 border border-rose-500/20 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <Lock className="h-4 w-4 shrink-0 text-rose-600" />
            <span>
              Your public QR menu is offline. Your menu data and QR code are preserved. Subscribe now to reactivate the live menu immediately.
            </span>
          </div>
        )}

        {!isPaidActive && !isGracePeriod && !isExpired && (
          <div className="rounded-xl p-3 bg-muted/40 border border-border text-xs text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Free full-access trial active until <strong>{formattedTrialEnd}</strong>.
            </span>
          </div>
        )}

        {/* Features Checklist */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Everything Included in Plan:
          </p>
          <ul className="text-xs space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Unlimited menu categories &amp; dishes</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>AI Menu Import using Google Gemini</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Custom colors, branding, logo &amp; hero media</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>High-resolution print-ready QR codes (PNG &amp; SVG)</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Fast Cloudflare CDN media storage</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Manual renewal — zero automatic recurring deductions</span>
            </li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <span className="text-[11px] text-muted-foreground">
          Secure payment via UPI, Cards, NetBanking (Razorpay)
        </span>
        <RazorpayCheckoutButton
          restaurantId={restaurantId}
          label={
            isPaidActive
              ? 'Extend by 1 Year (₹2,999)'
              : isExpired
              ? 'Reactivate Menu (₹2,999)'
              : 'Upgrade to Yearly (₹2,999)'
          }
          className="w-full sm:w-auto"
        />
      </CardFooter>
    </Card>
  );
}
