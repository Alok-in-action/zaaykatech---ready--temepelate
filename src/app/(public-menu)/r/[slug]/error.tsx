'use client';

import { useEffect } from 'react';

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
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-stone-200/60">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4 text-2xl">
          ⚠️
        </div>
        <h2 className="font-serif text-xl font-bold text-stone-900 mb-2">
          Unable to load menu
        </h2>
        <p className="text-stone-600 text-xs leading-relaxed mb-6">
          We encountered an unexpected error while loading this restaurant&apos;s menu. Please tap below to reload.
        </p>
        <button
          onClick={() => reset()}
          className="w-full py-2.5 px-4 bg-[#8B4A27] hover:bg-[#723b1f] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

