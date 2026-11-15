import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface MismatchItem {
  type: string;
  severity: 'warning' | 'error';
  description: string;
  paymentId?: string;
  restaurantId?: string;
}

interface ReconciliationAlertProps {
  mismatches: MismatchItem[];
}

export function ReconciliationAlert({ mismatches }: ReconciliationAlertProps) {
  if (!mismatches || mismatches.length === 0) {
    return (
      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-emerald-900">
            Payment Reconciliation Clean
          </h4>
          <p className="text-xs text-emerald-800 mt-0.5">
            Zero discrepancies detected between captured payment records, idempotency keys, and active subscriptions.
          </p>
        </div>
      </div>
    );
  }

  const hasErrors = mismatches.some((m) => m.severity === 'error');

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 mb-6 ${
        hasErrors
          ? 'bg-rose-50/70 border-rose-300 text-rose-950'
          : 'bg-amber-50/70 border-amber-300 text-amber-950'
      }`}
    >
      <div className="flex items-start gap-3">
        {hasErrors ? (
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <h4 className="text-sm font-bold flex items-center justify-between">
            <span>
              {mismatches.length} Reconciliation {mismatches.length === 1 ? 'Mismatch' : 'Mismatches'} Detected
            </span>
            <span className="text-[11px] font-normal uppercase tracking-wider px-2 py-0.5 rounded-full border border-current">
              Read-Only Audit
            </span>
          </h4>
          <p className="text-xs opacity-90 mt-1">
            The platform reports these records for operator inspection. Records are not silently altered.
          </p>
          <ul className="mt-3 space-y-2">
            {mismatches.map((m, idx) => (
              <li
                key={idx}
                className="text-xs p-2.5 rounded-xl bg-white/70 border border-stone-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
              >
                <span>{m.description}</span>
                {m.paymentId && (
                  <span className="font-mono text-[10px] text-stone-500 shrink-0">
                    ID: {m.paymentId.slice(0, 16)}...
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
