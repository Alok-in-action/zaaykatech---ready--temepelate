import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAdminRestaurantDetail } from '@/lib/admin/data';
import { StatusBadge } from '@/components/admin/StatusBadge';
import {
  ArrowLeft,
  ExternalLink,
  Store,
  User,
  CreditCard,
  HardDrive,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminRestaurantDetailPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getAdminRestaurantDetail(id);

  if (!detail) {
    notFound();
  }

  const { restaurant, owner, subscription, recentPayments, itemCount, categoryCount, storageUsage, recentAuditLogs, mismatches } =
    detail;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div>
        <Link
          href="/admin/restaurants"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Restaurants Registry
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                {restaurant.name}
              </h1>
              <StatusBadge status={restaurant.status} />
              <StatusBadge status={restaurant.site_status} />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 mt-1">
              <span>ID: {restaurant.id}</span>
              <span>•</span>
              <span>/{restaurant.slug}</span>
              {restaurant.published_at && (
                <a
                  href={`/r/${restaurant.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8B4A27] hover:underline inline-flex items-center gap-1"
                >
                  View Public Menu <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] bg-stone-100 text-stone-600 border border-stone-200 px-3 py-1 rounded-full uppercase font-bold tracking-wider">
              Read-Only Inspection
            </span>
          </div>
        </div>
      </div>

      {/* Mismatch Alert Banner if any */}
      {mismatches.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-900 text-xs">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Discrepancy Flagged
          </div>
          <ul className="list-disc list-inside space-y-1">
            {mismatches.map((m, idx) => (
              <li key={idx}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Grid: Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Restaurant Identity & Configuration */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-semibold text-stone-800 text-sm border-b border-stone-100 pb-3">
            <Store className="w-4 h-4 text-[#8B4A27]" /> Restaurant Configuration
          </div>

          <div className="text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-stone-500">Created:</span>
              <span className="font-mono text-stone-800">
                {new Date(restaurant.created_at).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Published At:</span>
              <span className="font-mono text-stone-800">
                {restaurant.published_at
                  ? new Date(restaurant.published_at).toLocaleString('en-IN')
                  : 'Not published'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Onboarding Step:</span>
              <span className="text-stone-800 font-semibold">
                Step {restaurant.onboarding_current_step || 1} ({restaurant.onboarding_status || 'in_progress'})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Menu Catalog:</span>
              <span className="text-stone-800 font-semibold">
                {itemCount} Dishes across {categoryCount} Categories
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Food Type:</span>
              <span className="text-stone-800 capitalize">{restaurant.food_type || 'Unspecified'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Owner Identity (Restricted PII) */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-semibold text-stone-800 text-sm border-b border-stone-100 pb-3">
            <User className="w-4 h-4 text-[#8B4A27]" /> Owner Profile
          </div>

          {owner ? (
            <div className="text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-stone-500">Name:</span>
                <span className="text-stone-800 font-medium">{owner.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Auth User UUID:</span>
                <span className="font-mono text-[11px] text-stone-800 truncate max-w-[170px]" title={owner.authUserId}>
                  {owner.authUserId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Profile ID:</span>
                <span className="font-mono text-[11px] text-stone-500 truncate max-w-[170px]" title={owner.id}>
                  {owner.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">System Role:</span>
                <span className="font-semibold text-stone-800 capitalize">{owner.role}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-stone-400 py-4 text-center">Owner profile not found</div>
          )}
        </div>

        {/* Card 3: Subscription & Trial Horizon */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-semibold text-stone-800 text-sm border-b border-stone-100 pb-3">
            <CreditCard className="w-4 h-4 text-[#8B4A27]" /> Subscription & Billing
          </div>

          <div className="text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-stone-500">Subscription Status:</span>
              <StatusBadge status={subscription?.status || (restaurant.subscription_end_date ? 'active' : 'none')} />
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Subscription Expiry:</span>
              <span className="font-mono text-stone-800 font-semibold">
                {restaurant.subscription_end_date
                  ? new Date(restaurant.subscription_end_date).toLocaleDateString('en-IN')
                  : 'No active plan'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Trial Ends At:</span>
              <span className="font-mono text-stone-800">
                {restaurant.trial_ends_at
                  ? new Date(restaurant.trial_ends_at).toLocaleString('en-IN')
                  : 'Trial not started'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Attributable Storage:</span>
              <span className="font-mono text-stone-800">
                {formatBytes(storageUsage.totalBytes)} ({storageUsage.objectCount} objects)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payment History Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
        <h3 className="font-semibold text-stone-800 text-sm mb-3">Recent Payments for this Tenant</h3>
        {recentPayments.length === 0 ? (
          <div className="text-xs text-stone-400 py-6 text-center">No payment records found for this restaurant.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 border-b border-stone-100 text-[11px] font-semibold text-stone-500 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Payment ID</th>
                  <th className="py-2.5 px-3">Idempotency Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-3 font-mono">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="py-2.5 px-3 font-semibold text-stone-900">₹{(p.amount_paise / 100).toFixed(0)}</td>
                    <td className="py-2.5 px-3"><StatusBadge status={p.status} /></td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500">{p.external_payment_id}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-stone-400">{p.idempotency_key}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attributable Storage Files */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-stone-800 text-sm">Tenant Media Objects (zaaykatech-media)</h3>
          <span className="text-xs text-stone-500">Path: restaurants/{restaurant.id}/</span>
        </div>

        {storageUsage.objects.length === 0 ? (
          <div className="text-xs text-stone-400 py-6 text-center">No files uploaded under this tenant folder.</div>
        ) : (
          <div className="overflow-x-auto max-h-60">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 border-b border-stone-100 text-[11px] font-semibold text-stone-500 uppercase">
                <tr>
                  <th className="py-2 px-3">File Name</th>
                  <th className="py-2 px-3">Size</th>
                  <th className="py-2 px-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                {storageUsage.objects.map((obj, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 text-stone-800 truncate max-w-xs">{obj.name}</td>
                    <td className="py-2 px-3 text-stone-600">{formatBytes(obj.size)}</td>
                    <td className="py-2 px-3 text-stone-400">{new Date(obj.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Audit Trail */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
        <h3 className="font-semibold text-stone-800 text-sm mb-3">Recent Tenant Audit Trail</h3>
        {recentAuditLogs.length === 0 ? (
          <div className="text-xs text-stone-400 py-6 text-center">No audit log entries recorded for this tenant.</div>
        ) : (
          <div className="space-y-2">
            {recentAuditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-stone-50/70 border border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1"
              >
                <div>
                  <span className="font-semibold text-stone-900 font-mono">{log.action}</span>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <span className="text-[11px] text-stone-500 ml-2 font-mono">
                      {JSON.stringify(log.metadata).slice(0, 80)}...
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-stone-400 shrink-0">
                  {new Date(log.created_at).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
