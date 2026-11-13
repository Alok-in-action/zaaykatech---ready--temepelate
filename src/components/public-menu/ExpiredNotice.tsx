'use client';

import React from 'react';
import Link from 'next/link';

interface ExpiredNoticeProps {
  restaurantName: string;
}

export default function ExpiredNotice({ restaurantName }: ExpiredNoticeProps) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-stone-200/60 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-serif font-bold text-stone-900 mb-2">
          {restaurantName}
        </h1>

        <div className="inline-block px-3 py-1 bg-amber-50 text-amber-900 text-xs font-semibold rounded-full mb-4 border border-amber-200">
          Menu Temporarily Offline
        </div>

        <p className="text-stone-600 text-sm leading-relaxed mb-6">
          This restaurant&apos;s digital QR menu is currently taking a short break. If you are dining here, please ask your server for a physical menu card.
        </p>

        <div className="w-full pt-6 border-t border-stone-100 flex flex-col items-center gap-2">
          <p className="text-xs text-stone-400">Are you the restaurant owner?</p>
          <Link
            href="/owner/billing"
            className="w-full py-2.5 px-4 bg-[#8B4A27] hover:bg-[#723b1f] text-white text-xs font-medium rounded-xl transition-all shadow-sm"
          >
            Owner Login &amp; Renew Menu
          </Link>
        </div>

        <div className="mt-8 text-[11px] text-stone-400">
          Powered by <span className="font-semibold text-stone-600">ZaaykaTech</span>
        </div>
      </div>
    </div>
  );
}

