import Link from 'next/link';
import { Search, Home, UtensilsCrossed } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-stone-200/80">
        <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center mx-auto mb-4 border border-stone-200/60 shadow-xs">
          <Search className="w-7 h-7" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2 tracking-tight">
          Page or Restaurant Not Found
        </h1>
        <p className="text-stone-600 text-xs leading-relaxed mb-6">
          The menu or page you are looking for doesn&apos;t exist or has moved. Please verify the URL or return to home.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Link
            href="/"
            className="flex-1 py-2.5 px-4 bg-[#4338CA] hover:bg-[#3730A3] active:bg-[#312E81] text-white text-xs font-semibold rounded-2xl shadow-xs transition-all apple-press flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Go to Homepage</span>
          </Link>
          <Link
            href="/r/demo"
            className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-2xl transition-all apple-press flex items-center justify-center gap-1.5"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Demo Menu</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
