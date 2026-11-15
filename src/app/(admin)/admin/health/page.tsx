import React from 'react';
import Link from 'next/link';
import { getAdminSystemHealth } from '@/lib/admin/data';
import { StatusBadge } from '@/components/admin/StatusBadge';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Database,
  HardDrive,
  Key,
  Webhook,
  Globe,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminHealthPage() {
  const health = await getAdminSystemHealth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <span className="text-xs uppercase font-semibold text-stone-500 tracking-wider">
            Diagnostics & Availability
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-0.5">
            System & Infrastructure Health
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Authoritative component-level availability, database latency, storage connectivity, and webhook freshness.
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono text-stone-600 font-semibold">
            SHA: {health.commitSha.slice(0, 7)}
          </div>
          <div className="text-[11px] text-stone-400">Environment: {health.environment}</div>
        </div>
      </div>

      {/* Component Availability Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database Check */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-stone-500">
            <span>Postgres Database</span>
            <Database className="w-4 h-4 text-stone-400" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={health.database.status} />
            <span className="text-xs font-mono text-stone-500">
              {health.database.latencyMs}ms latency
            </span>
          </div>
          <div className="text-[11px] text-stone-400 mt-2">
            Lightweight query (<code className="font-mono text-[10px]">plans.limit(1)</code>)
          </div>
        </div>

        {/* Storage API Check */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-stone-500">
            <span>Storage API (Media)</span>
            <HardDrive className="w-4 h-4 text-stone-400" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={health.storage.status} />
          </div>
          <div className="text-[11px] text-stone-400 mt-2">
            Bucket: {health.storage.bucketName}
          </div>
        </div>

        {/* Environment Config Check */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-stone-500">
            <span>Required Credentials</span>
            <Key className="w-4 h-4 text-stone-400" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge
              status={health.environmentConfig.status === 'valid' ? 'healthy' : 'unhealthy'}
              label={health.environmentConfig.status === 'valid' ? 'Valid' : 'Incomplete'}
            />
          </div>
          <div className="text-[11px] text-stone-400 mt-2">
            {health.environmentConfig.missingRequiredCount > 0
              ? `${health.environmentConfig.missingRequiredCount} keys missing`
              : 'All required environment variables present'}
          </div>
        </div>

        {/* Webhook Activity */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-stone-500">
            <span>Payment Webhook</span>
            <Webhook className="w-4 h-4 text-stone-400" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={health.paymentWebhook.status} />
          </div>
          <div className="text-[11px] text-stone-500 mt-2 space-y-0.5">
            <div>
              Credentials:{' '}
              <span className="font-semibold text-stone-700">
                {health.paymentWebhook.credentialsConfigured ? 'Configured' : 'Missing'}
              </span>
            </div>
            <div>
              Synthetic Engine:{' '}
              <span className="font-semibold text-stone-700">
                {health.paymentWebhook.syntheticVerificationPassed ? 'Passed' : 'Error'}
              </span>
            </div>
            <div>
              Live Integration:{' '}
              <span className="font-semibold text-stone-700">
                {health.paymentWebhook.liveIntegrationVerified ? 'Verified Live' : 'Pending Live Event'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Integration & Verification Breakdown */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-4">
        <h2 className="font-serif font-bold text-stone-900 text-base">
          Payment Webhook & Integration Verification Breakdown
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
            <div className="text-stone-500 text-[10px] uppercase font-semibold">1. Credentials</div>
            <div className="font-semibold text-stone-900 mt-1">
              {health.paymentWebhook.credentialsConfigured ? 'Configured' : 'Missing'}
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">Secrets present in server env</div>
          </div>
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
            <div className="text-stone-500 text-[10px] uppercase font-semibold">2. Synthetic Ping</div>
            <div className="font-semibold text-stone-900 mt-1">
              {health.paymentWebhook.syntheticVerificationPassed ? 'Passed' : 'Failed'}
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">HMAC crypto check executed</div>
          </div>
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
            <div className="text-stone-500 text-[10px] uppercase font-semibold">3. Last Received</div>
            <div className="font-semibold text-stone-900 mt-1 truncate">
              {health.paymentWebhook.lastReceivedAt
                ? new Date(health.paymentWebhook.lastReceivedAt).toLocaleDateString('en-IN')
                : 'None'}
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">Latest real payload</div>
          </div>
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
            <div className="text-stone-500 text-[10px] uppercase font-semibold">4. Last Processed</div>
            <div className="font-semibold text-stone-900 mt-1 truncate">
              {health.paymentWebhook.lastSuccessfulProcessingAt
                ? new Date(health.paymentWebhook.lastSuccessfulProcessingAt).toLocaleDateString('en-IN')
                : 'None'}
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">Successful payment logged</div>
          </div>
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
            <div className="text-stone-500 text-[10px] uppercase font-semibold">5. Live Integration</div>
            <div className="font-semibold text-stone-900 mt-1">
              {health.paymentWebhook.liveIntegrationVerified ? 'Verified Live' : 'Pending Proof'}
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">Conclusive live payload</div>
          </div>
        </div>
      </div>

      {/* External Monitoring Status & Architecture Details */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-4">
        <h2 className="font-serif font-bold text-stone-900 text-base">
          Synthetic External Uptime & Public Endpoint Guard
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-stone-600">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-stone-800 text-sm">
              <Globe className="w-4 h-4 text-[#8B4A27]" /> Minimal Public Health Route
            </div>
            <p>
              The public endpoint <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-stone-800">/api/health</code> strictly returns minimal unauthenticated payloads:
            </p>
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 font-mono text-[11px] text-stone-700">
              HTTP 200 {"{"}&quot;status&quot;: &quot;healthy&quot;{"}"} on success<br />
              HTTP 503 {"{"}&quot;status&quot;: &quot;unhealthy&quot;{"}"} on failure
            </div>
            <p className="text-stone-500">
              Internal latency measurements, table names, key prefixes, and database error messages are strictly stripped from public visibility.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-stone-800 text-sm">
              <Activity className="w-4 h-4 text-[#8B4A27]" /> External Synthetic Monitoring
            </div>
            <p>
              External monitoring status:{' '}
              <span className="font-semibold text-stone-800">Not configured</span>
            </p>
            <p className="leading-relaxed">
              To establish independent third-party availability verification, configure an external probe (e.g. Better Uptime or Checkly) to GET <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">https://zaaykatech.com/api/health</code> on a 10–15 minute interval.
            </p>
            <div className="pt-1">
              <span className="text-[11px] font-mono text-stone-400">
                Independent ping prevents Supabase pause while testing public availability.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
