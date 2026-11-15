import React from 'react';
import Link from 'next/link';
import { getAdminStorageReport } from '@/lib/admin/data';
import { StatusBadge } from '@/components/admin/StatusBadge';
import {
  HardDrive,
  Database,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Info,
  Server,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminStoragePage() {
  const report = await getAdminStorageReport();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <span className="text-xs uppercase font-semibold text-stone-500 tracking-wider">
            Infrastructure Observability
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-0.5">
            Storage & Database Usage
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Authoritative object counts, bucket status, tenant breakdowns, and provider dashboard boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={report.providerLinks.supabaseStorage}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors shadow-xs"
          >
            Supabase Storage <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
          </a>
        </div>
      </div>

      {/* Verified Real Metrics Grid */}
      {report.isPartialScan && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{report.scanNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-stone-500">
            <span>Stored Object Volume</span>
            <HardDrive className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900 mt-1">
            {formatBytes(report.totalSizeBytes)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {report.totalObjectsCount} total files in bucket
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-stone-500">
            <span>Media Bucket Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-serif font-bold text-stone-900 mt-1 flex items-center gap-2">
            <span>{report.bucketName}</span>
          </div>
          <div className="text-[11px] mt-1">
            <StatusBadge status={report.bucketExists ? 'healthy' : 'unhealthy'} label={report.bucketExists ? 'Verified Active' : 'Unreachable'} />
          </div>
        </div>

        {/* Bandwidth Egress (Truthful Provider Boundary) */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-stone-500">
            <span>Monthly Egress Bandwidth</span>
            <ArrowUpRight className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-sm font-semibold text-stone-800 mt-2">
            Provider Dashboard Required
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            CDN bandwidth cannot be computed from storage sizes.
          </div>
        </div>

        {/* Database Size (Truthful Provider Boundary) */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-stone-500">
            <span>Database Storage & Compute</span>
            <Database className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-sm font-semibold text-stone-800 mt-2">
            Supabase Console Required
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Postgres disk and RAM metrics require Supabase API access.
          </div>
        </div>
      </div>

      {/* Explicit Provider Boundary Explanation Banner */}
      <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-stone-500 shrink-0 mt-0.5" />
          <div className="text-xs text-stone-600 space-y-1">
            <h4 className="font-bold text-stone-900 text-sm">Provider Telemetry Boundaries</h4>
            <p>
              ZaaykaTech strictly reports measured object sizes and counts from Supabase Storage. File sizes do NOT measure egress bandwidth, and per-tenant network consumption is not fabricated.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href={report.providerLinks.supabaseStorage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8B4A27] font-semibold hover:underline inline-flex items-center gap-1"
              >
                Inspect Supabase Storage Quota (1GB free / 100GB pro) <ExternalLink className="w-3 h-3" />
              </a>
              <span>•</span>
              <a
                href={report.providerLinks.supabaseDatabase}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8B4A27] font-semibold hover:underline inline-flex items-center gap-1"
              >
                Inspect Postgres Table Sizes <ExternalLink className="w-3 h-3" />
              </a>
              <span>•</span>
              <a
                href={report.providerLinks.vercelUsage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8B4A27] font-semibold hover:underline inline-flex items-center gap-1"
              >
                Inspect Vercel Edge Bandwidth <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Attributable Storage by Restaurant */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-semibold text-stone-800 text-sm">
            Attributable Storage by Restaurant
          </h2>
          <span className="text-xs text-stone-500 font-mono">
            Path structure: restaurants/&#123;restaurantId&#125;/*
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200/80 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Restaurant</th>
                <th className="py-3 px-4">Objects Stored</th>
                <th className="py-3 px-4">Total Attributable Size</th>
                <th className="py-3 px-4 text-right">Inspect Tenant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {report.restaurantBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-stone-400">
                    No files found in restaurant folders yet.
                  </td>
                </tr>
              ) : (
                report.restaurantBreakdown.map((row) => (
                  <tr key={row.restaurantId} className="hover:bg-stone-50/70">
                    <td className="py-3.5 px-4 font-semibold text-stone-900">
                      {row.restaurantName}
                      <div className="text-[10px] font-mono text-stone-400">ID: {row.restaurantId}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">{row.objectCount} files</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-stone-900">
                      {formatBytes(row.sizeBytes)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/restaurants/${row.restaurantId}`}
                        className="text-xs font-semibold text-[#8B4A27] hover:underline"
                      >
                        View Files →
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
