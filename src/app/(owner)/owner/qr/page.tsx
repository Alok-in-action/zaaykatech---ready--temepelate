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

  const slug = restaurant?.slug || 'demo';
  const name = restaurant?.name || 'Cafe 9:50';
  const primaryColor = restaurant?.theme?.primary_color || '#8B4A27';

  return (
    <div className="py-2 space-y-6">
      {!loading && !restaurant && (
        <div className="max-w-2xl mx-auto bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <span>You haven&apos;t created your restaurant yet. Showing preview for demo menu.</span>
          <Link
            href="/owner/onboarding"
            className="px-3.5 py-1.5 bg-[#8B4A27] text-white rounded-xl font-semibold flex items-center gap-1.5 shrink-0 apple-press"
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
