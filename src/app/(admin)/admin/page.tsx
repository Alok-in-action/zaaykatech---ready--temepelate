import React from 'react';
import Link from 'next/link';
import { getAdminOverviewMetrics } from '@/lib/admin/data';
import { MetricCard } from '@/components/admin/MetricCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import {
  Store,
  CheckCircle2,
  Clock,
  CreditCard,
  AlertOctagon,
  HardDrive,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const metrics = await getAdminOverviewMetrics(30);

  const formatRupees = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <span className="text-xs uppercase font-semibold text-stone-500 tracking-wider">
            Operator Observability
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-0.5">
            Platform Overview
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Real-time aggregate tenant health, subscription lifecycles, revenue, and system metrics.
          </p>
        </div>

        <div className="bg-stone-100 border border-stone-200/80 rounded-2xl px-4 py-2 text-right">
          <div className="text-[11px] text-stone-500 font-medium">Reporting Window & Timezone</div>
          <div className="text-xs font-semibold text-stone-800">
            Last {metrics.periodDays} Days • {metrics.timezone}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            Updated: {new Date(metrics.lastUpdated).toLocaleTimeString('en-IN')}
          </div>
        </div>
      </div>

      {/* Section 1: Tenant & Lifecycle Totals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase text-stone-500 tracking-wider">
            Tenant & Subscription Lifecycles
          </h2>
          <Link
            href="/admin/restaurants"
            className="text-xs font-semibold text-[#8B4A27] hover:underline inline-flex items-center gap-1"
          >
            Manage Restaurants <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Registered"
            value={metrics.totalRestaurants}
            definition="All unique non-archived restaurants created across self-serve onboarding."
            source="public.restaurants"
            badge={<Store className="w-4 h-4 text-stone-400" />}
            trend={`+${metrics.newRegistrationsPeriod} in last ${metrics.periodDays}d`}
          />

          <MetricCard
            title="Published Menus"
            value={metrics.publishedRestaurants}
            definition="Restaurants with published_at set and an active public QR URL."
            source="published_at IS NOT NULL"
            badge={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          />

          <MetricCard
            title="Active 24h Trials"
            value={metrics.trialingRestaurants}
            definition="Published restaurants within 24h of publish without an active subscription."
            source="trial_ends_at > NOW()"
            badge={<Clock className="w-4 h-4 text-amber-500" />}
          />

          <MetricCard
            title="Active Paid Subscriptions"
            value={metrics.activePaidSubscriptions}
            definition="Restaurants with verified paid subscription end date >= today."
            source="subscription_end_date >= CURRENT_DATE"
            badge={<CreditCard className="w-4 h-4 text-stone-900" />}
          />
        </div>
      </div>

      {/* Section 2: Financial & Revenue Totals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase text-stone-500 tracking-wider">
            Revenue & Payment Collections
          </h2>
          <Link
            href="/admin/payments"
            className="text-xs font-semibold text-[#8B4A27] hover:underline inline-flex items-center gap-1"
          >
            Reconciliation & Ledger <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Net Live Collections"
            value={formatRupees(metrics.netLiveCollected)}
            definition="Total captured live payments minus recorded refunds. Excludes provider fees and unsettled gateway funds."
            source="payments (succeeded - refunded)"
            badge={<TrendingUp className="w-4 h-4 text-emerald-600" />}
          />

          <MetricCard
            title="Gross Live Captured"
            value={formatRupees(metrics.capturedLiveTotal)}
            definition="Total successfully captured live payments verified via webhook or server signature."
            source="payments.status = 'succeeded'"
          />

          <MetricCard
            title="Recorded Refunds"
            value={formatRupees(metrics.refundedTotal)}
            definition="Total recorded refund events in local database."
            source="payments.status = 'refunded'"
            warning={metrics.refundedTotal > 0}
          />

          <MetricCard
            title="Test Mode Volume"
            value={formatRupees(metrics.capturedTestTotal)}
            definition="Mock / test mode checkout volume. Strictly segregated from commercial receipts."
            source="order_mock_* / notes.test_mode"
            badge={<span className="text-[10px] bg-stone-200 px-1.5 py-0.5 rounded text-stone-600">TEST</span>}
          />
        </div>
      </div>

      {/* Section 3: Subscription Expiry Horizons & Retention */}
      <div>
        <h2 className="text-sm font-semibold uppercase text-stone-500 tracking-wider mb-3">
          Renewal & Expiry Horizons
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Expiring within 7 Days"
            value={metrics.expiringIn7Days}
            definition="Active paid restaurants due for renewal in the next 7 calendar days."
            source="subscription_end_date <= 7d"
            warning={metrics.expiringIn7Days > 0}
          />

          <MetricCard
            title="Expiring within 30 Days"
            value={metrics.expiringIn30Days}
            definition="Active paid restaurants due for renewal in the next 30 calendar days."
            source="subscription_end_date <= 30d"
          />

          <MetricCard
            title="Expired (Past Expiry)"
            value={metrics.expiredSubscriptions}
            definition="Published restaurants whose trial or annual subscription has ended without renewal."
            source="subscription_end_date < CURRENT_DATE"
            warning={metrics.expiredSubscriptions > 0}
          />
        </div>
      </div>

      {/* Section 4: Operational Health, Storage & Security */}
      <div>
        <h2 className="text-sm font-semibold uppercase text-stone-500 tracking-wider mb-3">
          Storage, OCR & Security Operations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Media Objects Stored"
            value={metrics.totalStorageObjects}
            definition="Count of menu photos, logos, QR codes, and import buffers in zaaykatech-media bucket."
            source="storage.objects / Supabase"
            badge={<HardDrive className="w-4 h-4 text-stone-400" />}
            trend={formatBytes(metrics.totalStorageBytes)}
          />

          <MetricCard
            title="Recent Critical Failures"
            value={metrics.criticalFailuresPeriod}
            definition="Failed OCR jobs, webhook parsing errors, or payment failures logged in the audit trail."
            source="audit_logs (failures in 30d)"
            badge={<AlertOctagon className="w-4 h-4 text-rose-500" />}
            warning={metrics.criticalFailuresPeriod > 0}
          />

          <MetricCard
            title="Rate Limit Blocks"
            value={metrics.rateLimitBlocksPeriod}
            definition="Number of menu extraction attempts rejected due to hourly (5) or daily (20) limits."
            source="audit_logs (action = rate_limited)"
            badge={<ShieldAlert className="w-4 h-4 text-amber-500" />}
          />
        </div>
      </div>
    </div>
  );
}
