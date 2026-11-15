import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  definition: string;
  source: string;
  trend?: string;
  badge?: React.ReactNode;
  warning?: boolean;
}

export function MetricCard({
  title,
  value,
  definition,
  source,
  trend,
  badge,
  warning,
}: MetricCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all hover:border-stone-300 ${
        warning ? 'border-amber-300/80 bg-amber-50/20' : 'border-stone-200/80'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            {title}
          </span>
          {badge}
        </div>
        <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
          {value}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-stone-100 flex flex-col gap-1.5">
        <p className="text-xs text-stone-600 leading-relaxed">{definition}</p>
        <div className="flex items-center justify-between text-[11px] text-stone-400">
          <span>Source: {source}</span>
          {trend && <span className="font-medium text-stone-600">{trend}</span>}
        </div>
      </div>
    </div>
  );
}
