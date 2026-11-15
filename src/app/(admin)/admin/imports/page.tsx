import React from 'react';
import Link from 'next/link';
import { getAdminOCRReport } from '@/lib/admin/data';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { FileScan, Cpu, AlertCircle, CheckCircle2, ShieldAlert, Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminImportsPage() {
  const report = await getAdminOCRReport();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <span className="text-xs uppercase font-semibold text-stone-500 tracking-wider">
            Pipeline Observability
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-0.5">
            OCR & Menu Import Jobs
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Authoritative execution history, local OCR worker performance, and failure categorization.
          </p>
        </div>

        <div className="bg-stone-100 border border-stone-200/80 rounded-2xl px-4 py-2 text-right">
          <div className="text-[11px] text-stone-500 font-medium">Active Extraction Engine</div>
          <div className="text-xs font-semibold text-stone-800">Local Tesseract + PDF.js</div>
        </div>
      </div>

      {/* Engine Architecture Information Box */}
      <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Cpu className="w-5 h-5 text-stone-600 shrink-0 mt-0.5" />
          <div className="text-xs text-stone-600 space-y-1">
            <h4 className="font-bold text-stone-900 text-sm">Execution Model & Zero AI Tokens</h4>
            <p>
              ZaaykaTech uses a hybrid local extraction engine: digital PDF text layer extraction (via <code className="font-mono bg-stone-200/60 px-1 py-0.5 rounded">pdfjs-dist</code>) combined with client/server local OCR (via <code className="font-mono bg-stone-200/60 px-1 py-0.5 rounded">tesseract.js</code> WebAssembly) and Sharp image preprocessing.
            </p>
            <p className="font-medium text-stone-800">
              No third-party paid LLM token API is used for menu extraction. AI token count is 0, and customer menu documents are never transmitted to external AI vendors.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-stone-500">
            <span>Total Logged Jobs</span>
            <FileScan className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900 mt-1">
            {report.totalJobsCount}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Logged in audit_logs</div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-stone-500">
            <span>Successful Jobs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-700 mt-1">
            {report.successfulJobsCount}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Completed with extracted items</div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-stone-500">
            <span>Extraction Failures</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-serif font-bold text-rose-700 mt-1">
            {report.failedJobsCount}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Unreadable photos or timeout</div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-stone-500">
            <span>Rate Limit Blocks</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-serif font-bold text-amber-700 mt-1">
            {report.rateLimitedJobsCount}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Exceeded 5/hr or 20/day policy</div>
        </div>
      </div>

      {/* Jobs Log Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-semibold text-stone-800 text-sm">Recent Extraction & Import Events</h2>
          <span className="text-xs text-stone-400 font-mono">Source: audit_logs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200/80 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Action</th>
                <th className="py-3 px-4">File Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Result / Error Category</th>
                <th className="py-3 px-4 text-right">Tenant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {report.recentJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <FileScan className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    No import or OCR events recorded in audit logs.
                  </td>
                </tr>
              ) : (
                report.recentJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-stone-50/70">
                    <td className="py-3 px-4 font-mono text-xs text-stone-600">
                      {new Date(job.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-900 font-mono text-xs">
                      {job.action.replace('ai_menu_extraction_', '')}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-stone-600">
                      {job.fileType || 'text/csv'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-stone-700">
                      {job.durationMs ? `${(job.durationMs / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {job.itemCount !== undefined ? `${job.itemCount} items` : '—'}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {job.error ? (
                        <span className="text-rose-600 font-medium truncate max-w-xs block" title={job.error}>
                          {job.error}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Completed</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/restaurants/${job.restaurantId}`}
                        className="text-xs font-semibold text-[#8B4A27] hover:underline font-mono"
                      >
                        {job.restaurantId.slice(0, 8)}...
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
