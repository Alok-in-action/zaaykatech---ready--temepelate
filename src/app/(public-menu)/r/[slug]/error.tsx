'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function PublicMenuError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Menu load error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-stone-200/80">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto mb-4 border border-rose-200/60 shadow-xs">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-xl font-bold text-stone-900 mb-2 tracking-tight">
          Unable to load menu
        </h2>
        <p className="text-stone-600 text-xs leading-relaxed mb-6 font-normal">
          We encountered an unexpected error while loading this restaurant&apos;s menu. Please tap below to reload.
        </p>
        <button
          onClick={() => reset()}
          className="w-full py-2.5 px-4 bg-[#8B4A27] hover:bg-[#723b1f] text-white text-xs font-semibold rounded-2xl shadow-xs transition-all apple-press flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
}
