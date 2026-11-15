'use client';

import React from 'react';
import { Clock } from 'lucide-react';

interface ExpiredNoticeProps {
  restaurantName: string;
}

export default function ExpiredNotice({ restaurantName }: ExpiredNoticeProps) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-stone-200/80 flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mb-5 border border-amber-200/60 shadow-xs">
          <Clock className="w-7 h-7 text-amber-700" />
        </div>

        <h1 className="text-2xl font-serif font-bold text-stone-900 mb-2 tracking-tight">
          {restaurantName}
        </h1>

        <div className="inline-block px-3 py-1 bg-amber-50 text-amber-900 text-xs font-semibold rounded-full mb-4 border border-amber-200/80">
          Menu Temporarily Offline
        </div>

        <p className="text-stone-600 text-xs leading-relaxed mb-2 font-normal">
          This restaurant&apos;s digital QR menu is currently taking a short break. If you are dining in right now, please request a physical menu card from your server.
        </p>

        <div className="mt-6 text-[11px] text-stone-400">
          Powered by <span className="font-semibold text-stone-700">ZaaykaTech</span>
        </div>
      </div>
    </div>
  );
}
