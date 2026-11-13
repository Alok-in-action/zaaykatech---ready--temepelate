import React from 'react';
import Link from 'next/link';
import {
  QrCode,
  Sparkles,
  Smartphone,
  Video,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Zap,
  Layers,
  ChefHat,
  Coffee,
  Store,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 font-sans flex flex-col selection:bg-[#8B4A27]/20 selection:text-[#8B4A27]">
      {/* 1. Translucent Sticky Navigation */}
      <header className="apple-glass sticky top-0 z-40 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-serif text-2xl font-black tracking-tight text-[#8B4A27] transition-transform duration-200 group-hover:scale-[1.02]">
              Zaayka<span className="text-[#D95B16]">Tech</span>
            </span>
            <span className="hidden sm:inline text-[10px] bg-[#8B4A27]/10 text-[#8B4A27] px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider">
              Restaurant SaaS
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/r/demo"
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-3.5 py-2 rounded-xl transition-colors hidden sm:inline-flex items-center gap-1"
            >
              <span>Live Demo</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-[#8B4A27] hover:bg-[#723b1f] text-white text-xs font-semibold rounded-xl shadow-xs transition-all apple-press inline-flex items-center gap-1.5"
            >
              <span>Owner Portal</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-black/[0.08] text-stone-700 text-xs font-medium mb-6 shadow-2xs backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>24-Hour Full-Access Trial • No Credit Card Required</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-stone-950 max-w-4xl mx-auto leading-[1.08]">
            Turn Any Paper Menu Into a{' '}
            <span className="text-[#8B4A27] decoration-[#D95B16]/30 underline underline-offset-4">
              Fluid QR Experience
            </span>{' '}
            in Minutes.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Designed for cafés, restaurants, cloud kitchens, and food brands. Zero app downloads for diners. Instant WhatsApp orders, Google review boosters, and real-time dish updates.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#8B4A27] hover:bg-[#743b1e] text-white text-sm font-semibold rounded-2xl shadow-sm hover:shadow-md transition-all apple-press inline-flex items-center justify-center gap-2"
            >
              <span>Create My QR Menu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/r/demo"
              className="w-full sm:w-auto px-6 py-3.5 bg-white border border-stone-200/90 hover:border-stone-300 text-stone-800 text-sm font-semibold rounded-2xl shadow-2xs transition-all apple-press inline-flex items-center justify-center gap-2"
            >
              <span>Experience Customer View</span>
              <ExternalLink className="w-4 h-4 text-stone-400" />
            </Link>
          </div>

          <p className="mt-3.5 text-xs text-stone-500">
            Keep your restaurant live for just ₹2,999/year (₹250/month) after trial.
          </p>

          {/* Industry Pills */}
          <div className="mt-12 pt-8 border-t border-stone-200/60 max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-3 text-xs text-stone-500 font-medium">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-stone-200/60">
              <Coffee className="w-3.5 h-3.5 text-[#8B4A27]" />
              Artisan Cafés
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-stone-200/60">
              <ChefHat className="w-3.5 h-3.5 text-[#8B4A27]" />
              Fine Dining
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-stone-200/60">
              <Store className="w-3.5 h-3.5 text-[#8B4A27]" />
              Cloud Kitchens
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-stone-200/60">
              <Smartphone className="w-3.5 h-3.5 text-[#8B4A27]" />
              Food Trucks &amp; Dhabas
            </span>
          </div>
        </section>

        {/* 3. Three-Step Process (Apple Simplicity) */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center mb-12">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Three Simple Steps from Paper to Screen
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-2 max-w-md mx-auto">
              No technical skill required. Setup takes under two minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="apple-card rounded-3xl p-6 sm:p-7 relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-800 flex items-center justify-center text-sm font-bold mb-4">
                01
              </div>
              <h3 className="font-serif text-base font-bold text-stone-900">
                Snap or Paste Your Menu
              </h3>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                Upload a photo of your paper menu or PDF. Our local OCR engine structures your dishes, prices, and food categories automatically.
              </p>
            </div>

            <div className="apple-card rounded-3xl p-6 sm:p-7 relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-[#8B4A27]/10 text-[#8B4A27] flex items-center justify-center text-sm font-bold mb-4">
                02
              </div>
              <h3 className="font-serif text-base font-bold text-stone-900">
                Style Your Video Hero
              </h3>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                Add your logo, pick your brand colors, and showcase kitchen ambiance with high-definition background video.
              </p>
            </div>

            <div className="apple-card rounded-3xl p-6 sm:p-7 relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-800 flex items-center justify-center text-sm font-bold mb-4">
                03
              </div>
              <h3 className="font-serif text-base font-bold text-stone-900">
                Print Your Table QR Kit
              </h3>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                Download ready-to-print vector and PNG QR stickers. Place them on tables or counters for instant customer scanning.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Bento Feature Highlights */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="apple-card rounded-3xl p-6 sm:p-8 md:col-span-2 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-semibold mb-4">
                  <Video className="w-3.5 h-3.5 text-[#8B4A27]" />
                  <span>Cinematic Mobile Video</span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-950">
                  Captivate Diners the Second They Scan
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 mt-2 max-w-lg leading-relaxed">
                  Static menus are forgettable. ZaaykaTech welcomes guests with a smooth, mobile-optimized background video with high-definition poster fallbacks, creating instant appetite appeal.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center gap-4 text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Auto-playing muted video
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Fast sub-second load
                </span>
              </div>
            </div>

            <div className="apple-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-semibold mb-4">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Zero Friction</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-950">
                  No App to Install
                </h3>
                <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                  Customers scan your QR code with any camera and land straight into your menu in under a second. No downloads, no passwords, no waiting.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Works on iOS &amp; Android
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Honest Pricing Callout */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
          <div className="apple-card rounded-3xl p-8 sm:p-12 relative overflow-hidden bg-gradient-to-b from-white via-white to-[#FAF8F5]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B4A27] bg-[#8B4A27]/10 px-3 py-1 rounded-full inline-block mb-3">
              Honest Restaurant Pricing
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-950 tracking-tight">
              One Flat Plan. Unlimited Growth.
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-2 max-w-lg mx-auto leading-relaxed">
              Start with a 24-hour full-access trial. When you are ready to stay live, subscribe with our yearly pass.
            </p>

            <div className="mt-8 inline-block bg-white px-8 py-5 rounded-2xl border border-black/[0.08] shadow-xs">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl sm:text-5xl font-serif font-black text-[#8B4A27] tracking-tight">
                  ₹2,999
                </span>
                <span className="text-stone-500 text-xs font-semibold">/ year</span>
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">
                (That&apos;s just ₹250 / month — less than one coffee per week)
              </span>
              <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-left text-[11px] text-stone-600">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Unlimited items
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Real-time edits
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Custom QR stickers
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> WhatsApp &amp; Reviews
                </span>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/login"
                className="px-8 py-3.5 bg-[#8B4A27] hover:bg-[#743c1e] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm transition-all apple-press inline-flex items-center gap-2"
              >
                <span>Claim Your 24-Hour Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Footer */}
      <footer className="border-t border-black/[0.06] bg-white py-8 px-4 text-center mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="font-serif font-semibold text-[#8B4A27]">
            ZaaykaTech © 2026. Built with precision for culinary entrepreneurs.
          </div>
          <div className="flex items-center gap-5">
            <Link href="/r/demo" className="hover:text-stone-900 transition-colors">
              Demo Menu
            </Link>
            <Link href="/login" className="hover:text-stone-900 transition-colors">
              Owner Sign In
            </Link>
            <Link href="/api/health" className="hover:text-stone-900 transition-colors">
              System Health
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
