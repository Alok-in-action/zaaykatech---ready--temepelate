'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getOwnerRestaurant } from '@/actions/restaurant';
import { QRCodeGenerator } from '@/components/owner/QRCodeGenerator';
import { Restaurant } from '@/types/database';
import { ArrowRight, QrCode, Sparkles } from 'lucide-react';

export default function QRPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        setLoading(true);
        const res = await getOwnerRestaurant();
        if (res.success && res.restaurant) {
          setRestaurant(res.restaurant);
          if (typeof window !== 'undefined') {
            localStorage.setItem('zaayka_active_restaurant_id', res.restaurant.id);
          }
        }
      } catch (err) {
        console.warn('Could not load restaurant for QR:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRestaurant();
  }, []);

  if (loading) {
    return (
      <div className="py-2 space-y-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-stone-100" />
            <div className="space-y-2">
              <div className="h-5 w-48 bg-stone-200 rounded-md" />
              <div className="h-3.5 w-64 bg-stone-100 rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="aspect-square max-w-[280px] mx-auto w-full bg-stone-100 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-10 w-full bg-stone-100 rounded-xl" />
              <div className="h-10 w-full bg-stone-100 rounded-xl" />
              <div className="h-10 w-full bg-stone-100 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const slug = restaurant?.slug || 'demo';
  const name = restaurant?.name || 'My Restaurant';
  const primaryColor = restaurant?.theme?.primary_color || '#4338CA';

  return (
    <div className="py-2 space-y-6">
      {!restaurant && (
        <div className="max-w-2xl mx-auto bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <span>You haven&apos;t created your restaurant yet. Showing preview for demo menu.</span>
          <Link
            href="/owner/onboarding"
            className="px-3.5 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] active:bg-[#312E81] text-white rounded-xl font-semibold flex items-center gap-1.5 shrink-0 apple-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <span>Create Restaurant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <QRCodeGenerator restaurantName={name} slug={slug} primaryColor={primaryColor} />
    </div>
  );
}
