import React from 'react';
import Link from 'next/link';
import { getAdminSecurityReport } from '@/lib/admin/data';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Shield, ShieldAlert, AlertTriangle, CheckCircle, Info, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminSecurityPage() {
  const report = await getAdminSecurityReport();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <span className="text-xs uppercase font-semibold text-stone-500 tracking-wider">
            Protection & Boundaries
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-0.5">
            Security & Rate Limits
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Audited rate limiting policies, multi-instance enforcement mechanisms, and recorded abuse events.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] bg-stone-100 text-stone-600 border border-stone-200 px-3 py-1 rounded-full uppercase font-bold tracking-wider">
            Audited Policy
          </span>
        </div>
      </div>

      {/* Security Architecture Notice */}
      <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-stone-600 shrink-0 mt-0.5" />
          <div className="text-xs text-stone-600 space-y-1">
            <h4 className="font-bold text-stone-900 text-sm">Truthful Serverless Enforcement Distinction</h4>
            <p>
              In multi-instance serverless deployments (such as Vercel Edge / Functions), in-memory counters (<code className="font-mono bg-stone-200/60 px-1 py-0.5 rounded">Map</code>) are process-local and reset between cold starts or across instances. Only database-backed checks (such as Supabase <code className="font-mono bg-stone-200/60 px-1 py-0.5 rounded">audit_logs</code> queries) are globally reliable across serverless workers.
            </p>
            <p className="font-medium text-stone-800">
              Unimplemented endpoints are truthfully reported as "Not implemented".
            </p>
          </div>
        </div>
      </div>

      {/* Audited Policy Matrix */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-semibold text-stone-800 text-sm">Enforced Rate-Limit Policies</h2>
          <span className="text-xs text-stone-400">Endpoint Policy Matrix</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200/80 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Endpoint / Action</th>
                <th className="py-3 px-4">Limit Scope</th>
                <th className="py-3 px-4">Policy Limit</th>
                <th className="py-3 px-4">Counter Store</th>
                <th className="py-3 px-4">Shared Across Instances?</th>
                <th className="py-3 px-4 text-right">Enforcement State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {report.policies.map((pol, idx) => (
                <tr key={idx} className="hover:bg-stone-50/70">
                  <td className="py-3.5 px-4 font-semibold text-stone-900">{pol.endpoint}</td>
                  <td className="py-3.5 px-4 text-stone-600">{pol.limitScope}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-stone-800">
                    {pol.maxRequests > 0 ? `${pol.maxRequests} req / ${pol.windowMinutes}m` : 'Uncapped'}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-stone-600">{pol.counterSource}</td>
                  <td className="py-3.5 px-4 text-xs">
                    {pol.isSharedAcrossInstances ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Yes (Global DB)
                      </span>
                    ) : pol.status === 'not_implemented' ? (
                      <span className="text-stone-400">N/A</span>
                    ) : (
                      <span className="text-amber-700 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> No (Process Local)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <StatusBadge status={pol.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Observed Blocked Events Log */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-semibold text-stone-800 text-sm">Observed Rate-Limit Blocks</h2>
          <span className="text-xs text-stone-400 font-mono">Source: audit_logs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200/80 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Action</th>
                <th className="py-3 px-4">Reason / Error Message</th>
                <th className="py-3 px-4 text-right">Tenant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {report.recentBlockedEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-stone-400">
                    <Shield className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    Zero rate limit violations logged in the database.
                  </td>
                </tr>
              ) : (
                report.recentBlockedEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-stone-50/70">
                    <td className="py-3 px-4 font-mono text-xs text-stone-600">
                      {new Date(ev.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-amber-800">{ev.action}</td>
                    <td className="py-3 px-4 text-xs text-stone-700">{ev.error}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/restaurants/${ev.restaurantId}`}
                        className="text-xs font-semibold text-[#8B4A27] hover:underline font-mono"
                      >
                        {ev.restaurantId.slice(0, 8)}...
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
