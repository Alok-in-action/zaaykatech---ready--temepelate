import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 font-sans flex flex-col">
      {/* 1. Navigation */}
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-black tracking-tight text-[#8B4A27]">
              Zaayka<span className="text-[#D2691E]">Tech</span>
            </span>
            <span className="hidden sm:inline text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
              Restaurant SaaS
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/r/demo"
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-2 rounded-xl transition-colors"
            >
              Live Demo
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-[#8B4A27] hover:bg-[#723b1f] text-white text-xs font-semibold rounded-2xl shadow-sm transition-all"
            >
              Owner Login
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-semibold mb-6">
            <span>🚀</span>
            <span>24-Hour Full-Access Trial • No Credit Card Required</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-extrabold tracking-tight text-stone-900 max-w-3xl mx-auto leading-tight">
            Turn Any Paper Menu Into a{' '}
            <span className="text-[#8B4A27] underline decoration-[#D2691E]/40">
              Mobile-First QR Experience
            </span>{' '}
            in Minutes.
          </h1>

          <p className="mt-6 text-sm sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Designed for cafes, dhabas, cloud kitchens, and fine diners. Fast loading, beautiful video hero, instant WhatsApp orders, Google review boosters, and effortless updates.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#8B4A27] hover:bg-[#723b1f] text-white text-sm font-bold rounded-2xl shadow-md hover:shadow-lg transition-all"
            >
              Create My QR Menu →
            </Link>
            <Link
              href="/r/demo"
              className="w-full sm:w-auto px-6 py-3.5 bg-white border border-stone-300 hover:border-stone-400 text-stone-800 text-sm font-semibold rounded-2xl shadow-sm transition-all"
            >
              Experience Customer View ↗
            </Link>
          </div>

          <p className="mt-3 text-xs text-stone-400">
            Keep your restaurant live for just ₹2,999/year after trial.
          </p>
        </section>

        {/* 3. Features Grid */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center text-xl mb-4">
                ✨
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                AI Menu Extraction
              </h3>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                Snap a photo of your paper menu or upload a PDF. Google Gemini automatically extracts all categories, dishes, prices, and tags. Review and publish in one tap.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-800 flex items-center justify-center text-xl mb-4">
                🎬
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Cinematic Video Hero
              </h3>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                Captivate dining guests the second they scan. Showcase your kitchen ambiance with smooth, mobile-optimized background video served instantly via Cloudflare.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center text-xl mb-4">
                📈
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Google Reviews &amp; WhatsApp
              </h3>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                Built-in action floaters prompt diners to leave 5-star Google reviews, call for reservations, or message your WhatsApp order counter directly.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Pricing Callout */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
          <div className="bg-gradient-to-br from-[#8B4A27]/10 via-[#FAF8F5] to-amber-100/30 rounded-3xl p-8 sm:p-12 border border-[#8B4A27]/20">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Simple, Honest Restaurant Pricing
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm mt-2 max-w-lg mx-auto">
              Start with a 24-hour full-access trial. When you are ready to stay live, subscribe with our yearly plan.
            </p>
            <div className="mt-6 inline-block bg-white px-6 py-4 rounded-2xl border border-stone-200 shadow-sm">
              <span className="text-3xl sm:text-4xl font-serif font-black text-[#8B4A27]">
                ₹2,999
              </span>
              <span className="text-stone-500 text-xs ml-1">/ year (₹250/mo)</span>
              <p className="text-[11px] text-stone-400 mt-1">
                Unlimited items • Custom QR sticker • AI imports • Real-time edits
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/login"
                className="px-8 py-3 bg-[#8B4A27] hover:bg-[#723b1f] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm transition-all inline-block"
              >
                Claim Your 24-Hour Free Trial →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 5. Footer */}
      <footer className="border-t border-stone-200/80 bg-white py-8 px-4 text-center">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="font-serif font-bold text-[#8B4A27]">
            ZaaykaTech © 2026. Built for India&apos;s culinary entrepreneurs.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/r/demo" className="hover:text-stone-900">
              Demo Menu
            </Link>
            <Link href="/login" className="hover:text-stone-900">
              Owner Sign In
            </Link>
            <Link href="/api/health" className="hover:text-stone-900">
              System Health
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
