import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

interface AccessDeniedProps {
  reason?: 'unauthenticated' | 'unauthorized_account' | 'not_configured';
  userId?: string;
  email?: string;
}

export function AccessDenied({ reason, userId, email }: AccessDeniedProps) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4 sm:p-6 text-stone-900 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider">
          Platform Security Boundary
        </span>

        <h1 className="text-2xl font-serif font-bold text-stone-900 mt-3 mb-2">
          Operator Access Required
        </h1>

        <p className="text-sm text-stone-600 leading-relaxed mb-6">
          {reason === 'not_configured'
            ? 'Platform operator allowlist is not yet configured on this environment. By default, all operator access is restricted until PLATFORM_ADMIN_USER_IDS is set.'
            : 'Your authenticated account is not authorized as a ZaaykaTech platform operator. Platform admin controls are strictly separated from restaurant owner dashboards.'}
        </p>

        {userId && (
          <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3 text-left mb-6 text-xs text-stone-600 space-y-1">
            <div className="flex justify-between">
              <span className="text-stone-400 font-medium">Account ID:</span>
              <span className="font-mono text-stone-800 select-all">{userId}</span>
            </div>
            {email && (
              <div className="flex justify-between">
                <span className="text-stone-400 font-medium">Email:</span>
                <span className="font-mono text-stone-800">{email}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-stone-400 font-medium">Access Status:</span>
              <span className="text-rose-600 font-semibold">Denied (HTTP 403)</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href="/owner"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#8B4A27] text-white font-medium text-sm hover:bg-[#703b1f] transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Restaurant Dashboard
          </Link>

          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-medium text-xs hover:bg-stone-50 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Switch Account / Sign Out
          </Link>
        </div>
      </div>
    </div>
  );
}
