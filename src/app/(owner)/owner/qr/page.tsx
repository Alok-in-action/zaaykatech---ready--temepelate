import React from 'react';
import Link from 'next/link';
import { getOwnerRestaurant } from '@/actions/restaurant';
import { QRCodeGenerator } from '@/components/owner/QRCodeGenerator';
import { Restaurant } from '@/types/database';

export default async function QRPage() {
  const res = await getOwnerRestaurant();
  const restaurant: Restaurant | null = res.restaurant;

  // Fallback demo for preview if no restaurant created yet
  const slug = restaurant?.slug || 'demo';
  const name = restaurant?.name || 'Cafe 9:50';
  const primaryColor = restaurant?.theme?.primary_color || '#8B4A27';

  return (
    <div className="py-4 space-y-6">
      {!restaurant && (
        <div className="max-w-2xl mx-auto bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-center justify-between">
          <span>You haven&apos;t created your restaurant yet. Showing preview for demo menu.</span>
          <Link
            href="/owner/onboarding"
            className="px-3 py-1 bg-[#8B4A27] text-white rounded-xl font-semibold"
          >
            Create Restaurant →
          </Link>
        </div>
      )}

      <QRCodeGenerator restaurantName={name} slug={slug} primaryColor={primaryColor} />
    </div>
  );
}
