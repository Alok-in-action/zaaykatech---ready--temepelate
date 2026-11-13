'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-stone-200/60">
        <span className="text-4xl mb-4 block">⚠️</span>
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-stone-600 text-xs leading-relaxed mb-6">
          We encountered an unexpected technical issue. Our system team has been alerted.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-2.5 px-4 bg-[#8B4A27] hover:bg-[#723b1f] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-all"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

