'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, CheckCircle2, ChevronRight, UtensilsCrossed, Scan, ArrowRight } from 'lucide-react';
import { MenuSourceUploader } from '@/components/owner/ai/MenuSourceUploader';
import { ExtractionReviewTable } from '@/components/owner/ai/ExtractionReviewTable';
import { Button } from '@/components/ui/button';
import type { AIMenuExtractionOutput } from '@/validations/ai';
import { getOwnerRestaurant } from '@/actions/restaurant';

function AIMenuImportContent() {
  const searchParams = useSearchParams();
  const isFromOnboarding = searchParams?.get('from') === 'onboarding';
  const paramRestaurantId = searchParams?.get('restaurant_id');

  const [restaurantId, setRestaurantId] = useState<string>(paramRestaurantId || '');
  const [step, setStep] = useState<'upload' | 'review' | 'success'>('upload');
  const [extractedData, setExtractedData] = useState<AIMenuExtractionOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadRestaurant() {
      if (paramRestaurantId) {
        setRestaurantId(paramRestaurantId);
        return;
      }
      try {
        const res = await getOwnerRestaurant();
        if (res.success && res.restaurant) {
          setRestaurantId(res.restaurant.id);
        } else {
          setErrorMsg(res.error || 'No restaurant found. Please start onboarding first.');
        }
      } catch (err: unknown) {
        setErrorMsg((err as Error).message);
      }
    }
    loadRestaurant();
  }, [paramRestaurantId]);

  const handleExtractionSuccess = (data: AIMenuExtractionOutput) => {
    setExtractedData(data);
    setStep('review');
  };

  const handleCommitted = () => {
    setStep('success');
  };

  const handleCancelReview = () => {
    setExtractedData(null);
    setStep('upload');
  };

  const returnUrl = isFromOnboarding ? '/owner/onboarding' : '/owner/menu';
  const returnLabel = isFromOnboarding ? 'Back to Onboarding' : 'Menu Management';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* NAVIGATION / BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href={returnUrl} className="hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{returnLabel}</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-60" />
        <span className="text-foreground font-medium flex items-center gap-1.5">
          <Scan className="h-3.5 w-3.5 text-primary" />
          <span>Local OCR Menu Import</span>
        </span>
      </div>

      {/* HEADER */}
      <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Scan className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Local OCR Menu Extraction
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-2 max-w-xl">
            Upload your existing menu photo, PDF catalog, spreadsheet, or paste raw text. Our local engine (Tesseract.js &amp; Sharp) extracts categories, dishes, prices, and dietary tags directly on the server without any external AI API keys.
          </p>
        </div>

        <Link
          href={returnUrl}
          className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-muted transition-colors shrink-0"
        >
          {returnLabel}
        </Link>
      </div>

      {/* STEP 1: UPLOAD & EXTRACTION */}
      {step === 'upload' && (
        <MenuSourceUploader
          restaurantId={restaurantId}
          onExtractionSuccess={handleExtractionSuccess}
        />
      )}

      {/* STEP 2: REVIEW & CORRECTION */}
      {step === 'review' && extractedData && (
        <ExtractionReviewTable
          restaurantId={restaurantId}
          initialData={extractedData}
          onCommitted={handleCommitted}
          onCancel={handleCancelReview}
        />
      )}

      {/* STEP 3: SUCCESSFUL IMPORT */}
      {step === 'success' && (
        <div className="bg-card border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-foreground">
              Dishes Successfully Imported!
            </h2>
            <p className="text-xs text-muted-foreground">
              Your approved dishes and categories have been securely saved to your menu dashboard. They are in <strong>Draft</strong> status and will not be displayed on your public QR menu until you choose to publish them.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            {isFromOnboarding ? (
              <Link href="/owner/onboarding">
                <Button className="flex items-center gap-2 bg-[#8B4A27] hover:bg-[#743c1e] text-white">
                  <span>Continue Onboarding</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/owner/menu">
                <Button className="flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  <span>Go to Menu &amp; Dishes</span>
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setExtractedData(null);
                setStep('upload');
              }}
            >
              Import Another Menu
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIMenuImportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-stone-500">Loading OCR importer...</div>}>
      <AIMenuImportContent />
    </Suspense>
  );
}
