import React from 'react';

interface StatusBadgeProps {
  status: string;
  label?: string;
  variant?: 'emerald' | 'amber' | 'rose' | 'stone' | 'blue';
}

export function StatusBadge({ status, label, variant }: StatusBadgeProps) {
  let v = variant;

  if (!v) {
    const s = status.toLowerCase();
    if (['published', 'active', 'healthy', 'succeeded', 'completed', 'enforced_database'].includes(s)) {
      v = 'emerald';
    } else if (['trial', 'trialing', 'pending', 'expiring_soon', 'warning', 'in_progress', 'enforced_in_memory'].includes(s)) {
      v = 'amber';
    } else if (['expired', 'unhealthy', 'failed', 'refunded', 'suspended', 'error'].includes(s)) {
      v = 'rose';
    } else if (['not_implemented', 'provider_dashboard_required', 'not_configured', 'no_events'].includes(s)) {
      v = 'stone';
    } else {
      v = 'stone';
    }
  }

  const styles = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    amber: 'bg-amber-50 text-amber-900 border-amber-200/80',
    rose: 'bg-rose-50 text-rose-800 border-rose-200/80',
    stone: 'bg-stone-100 text-stone-700 border-stone-200/80',
    blue: 'bg-sky-50 text-sky-800 border-sky-200/80',
  }[v];

  const dotColors = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    stone: 'bg-stone-400',
    blue: 'bg-sky-500',
  }[v];

  const displayLabel = label || status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${styles}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors}`} />
      {displayLabel}
    </span>
  );
}
