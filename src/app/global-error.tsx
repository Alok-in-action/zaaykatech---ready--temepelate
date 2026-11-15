'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Fatal root application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#FAF8F5] text-stone-900 font-sans min-h-screen flex items-center justify-center p-6 text-center antialiased">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-stone-200/80">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto mb-4 border border-rose-200/60 shadow-xs">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2 tracking-tight">
            System Interruption
          </h1>
          <p className="text-stone-600 text-xs leading-relaxed mb-6 font-normal">
            A critical error occurred while preparing this page. You can reload the view or return to the main portal.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => reset()}
              className="flex-1 py-2.5 px-4 bg-[#4338CA] hover:bg-[#3730A3] active:bg-[#312E81] text-white text-xs font-semibold rounded-2xl shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 cursor-pointer"
            >
              Reload Application
            </button>
            <Link
              href="/"
              className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-2xl transition-all flex items-center justify-center"
            >
              Return Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
