import React from 'react';
import Link from 'next/link';
import { getAdminPayments } from '@/lib/admin/data';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ReconciliationAlert } from '@/components/admin/ReconciliationAlert';
import {
  CreditCard,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function AdminPaymentsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;

  const { payments, report, totalCount, currentPage, totalPages } = await getAdminPayments({
    page,
    limit: 20,
  });

  const formatRupees = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <span className="text-xs uppercase font-semibold text-stone-500 tracking-wider">
            Reconciliation & Ledger
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-0.5">
            Payments & Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Authoritative local payment records, Razorpay webhook status, and subscription alignment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://dashboard.razorpay.com/app/payments"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors shadow-xs"
          >
            Razorpay Dashboard <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
          </a>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase text-stone-500">Gross Live Revenue</div>
          <div className="text-2xl font-serif font-bold text-stone-900 mt-1">
            {formatRupees(report.succeededRevenuePaise)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {report.capturedPaymentsCount} verified live transactions
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase text-stone-500">Recorded Refunds</div>
          <div className="text-2xl font-serif font-bold text-stone-900 mt-1">
            {formatRupees(report.refundedRevenuePaise)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Local database status = refunded</div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase text-stone-500">Net Collected Amount</div>
          <div className="text-2xl font-serif font-bold text-emerald-700 mt-1">
            {formatRupees(report.succeededRevenuePaise - report.refundedRevenuePaise)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Excludes payment gateway fees</div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase text-stone-500">Test Mode Volume</div>
          <div className="text-2xl font-serif font-bold text-stone-500 mt-1">
            {formatRupees(report.testRevenuePaise)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Mock / sandbox checkouts</div>
        </div>
      </div>

      {/* Mismatches Alert */}
      <ReconciliationAlert mismatches={report.mismatches} />

      {/* Payments Ledger Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-semibold text-stone-800 text-sm">Transaction Ledger</h2>
          <span className="text-xs text-stone-500 font-mono">Total Records: {totalCount}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200/80 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Restaurant</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Provider Ref (Razorpay)</th>
                <th className="py-3 px-4">Subscription Credited</th>
                <th className="py-3 px-4">Webhook Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    <CreditCard className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    No payment records recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-stone-600">
                      {new Date(p.createdAt).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-stone-900">
                      <Link
                        href={`/admin/restaurants/${p.restaurantId}`}
                        className="hover:text-[#8B4A27] hover:underline"
                      >
                        {p.restaurantName}
                      </Link>
                      <div className="text-[10px] font-mono text-stone-400">/{p.restaurantSlug}</div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-stone-900">
                      ₹{p.amountRupees.toFixed(0)}
                    </td>

                    <td className="py-3.5 px-4">
                      {p.isTestMode ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-stone-100 border border-stone-200 text-stone-600 font-mono">
                          TEST
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-semibold">
                          LIVE
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.status} />
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-stone-600 truncate max-w-[150px]">
                      {p.externalPaymentId}
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      {p.subscriptionPeriodCredited ? (
                        <span className="font-mono text-stone-800">
                          Until {new Date(p.subscriptionPeriodCredited).toLocaleDateString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-400">Not linked</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      {p.hasWebhookPayload ? (
                        <span className="text-emerald-700 font-semibold">Captured & Verified</span>
                      ) : (
                        <span className="text-stone-400 italic">Not recorded</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
            <div>
              Page <span className="font-semibold text-stone-900">{currentPage}</span> of{' '}
              <span className="font-semibold text-stone-900">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/admin/payments?page=${currentPage - 1}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Link>
              )}

              {currentPage < totalPages && (
                <Link
                  href={`/admin/payments?page=${currentPage + 1}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
