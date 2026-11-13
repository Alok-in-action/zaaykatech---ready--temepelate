'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, ArrowLeft, Scan } from 'lucide-react';

export default function AIImportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('OCR Menu Import Error:', error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center">
      <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4 border border-destructive/20">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">
          Unable to Load OCR Import
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed mb-6 max-w-md mx-auto">
          We encountered an issue preparing the menu scanner. You can retry or return to your menu to enter dishes manually or upload a CSV.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="py-2.5 px-5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/owner/menu"
            className="py-2.5 px-5 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Menu</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
