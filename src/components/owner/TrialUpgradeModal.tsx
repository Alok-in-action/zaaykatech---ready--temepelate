'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, CheckCircle2, Sparkles, ShieldCheck, Zap, Headphones, ArrowRight } from 'lucide-react';
import { RazorpayCheckoutButton } from '@/components/owner/billing/RazorpayCheckoutButton';

interface TrialUpgradeModalProps {
  restaurantId: string;
}

export function TrialUpgradeModal({ restaurantId }: TrialUpgradeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!restaurantId || typeof window === 'undefined') return;

    const storageKey = `zaayka_trial_modal_dismissed_${restaurantId}`;
    try {
      const isDismissed =
        localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);
      if (!isDismissed) {
        // Small delay so page loads smoothly before showing dialog
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Storage restricted, skip auto-opening
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleDismiss = () => {
    setIsOpen(false);
    if (!restaurantId || typeof window === 'undefined') return;
    const storageKey = `zaayka_trial_modal_dismissed_${restaurantId}`;
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {
      try {
        sessionStorage.setItem(storageKey, 'true');
      } catch {
        // Ignore storage exceptions
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-upgrade-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200/90 relative overflow-hidden"
      >
        {/* Subtle accent backdrop */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          aria-label="Close upgrade dialog"
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>24-Hour Trial In Progress</span>
          </div>
        </div>

        <h2
          id="trial-upgrade-title"
          className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight"
        >
          Keep Your QR Menu Live All Year
        </h2>

        <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
          Upgrade to the Annual Pro Plan today so your diners never see an offline menu. All your dishes, categories, and QR codes stay active uninterrupted.
        </p>

        {/* Pricing Highlight Pill */}
        <div className="mt-5 p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-baseline justify-between">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-stone-900 font-mono tracking-tight">
              ₹2,999<span className="text-xs sm:text-sm font-sans font-normal text-stone-500"> / year</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              Just ₹8.2 per day · Less than one chai a day
            </div>
          </div>
          <span className="text-[11px] font-semibold text-stone-600 bg-white border border-stone-200 px-2.5 py-1 rounded-lg">
            Annual Pass
          </span>
        </div>

        {/* Feature Highlights */}
        <div className="mt-5 space-y-2.5 text-xs text-stone-700">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span><strong>Unlimited QR Scans &amp; Menu Updates</strong> — change dishes and prices anytime</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span><strong>Custom Branding &amp; Colors</strong> — logo, theme palette, and high-res food photos</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span><strong>Print-Ready QR Kits</strong> — 1024px PNG and vector SVG for table standees</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span><strong>Live WhatsApp &amp; Phone Support</strong> — instant help from our Indian team</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-7 flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1">
            <RazorpayCheckoutButton
              restaurantId={restaurantId}
              label="Upgrade Now — ₹2,999/yr"
              variant="default"
              onSuccess={() => {
                handleDismiss();
              }}
              className="w-full py-3 px-5 bg-[#4338CA] hover:bg-[#3730A3] active:bg-[#312E81] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm transition-all apple-press flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            />
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full sm:w-auto px-5 py-3 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-2xl hover:bg-stone-100 transition-colors cursor-pointer text-center"
          >
            Continue Trial
          </button>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/owner/billing"
            onClick={handleDismiss}
            className="text-[11px] text-stone-400 hover:text-stone-700 underline transition-colors"
          >
            Review billing details, invoices &amp; GST info →
          </Link>
        </div>
      </div>
    </div>
  );
}
