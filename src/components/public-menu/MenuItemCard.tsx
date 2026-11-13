'use client';

import React from 'react';
import Image from 'next/image';
import { MenuItem } from '@/types/database';
import { Sparkles, Star } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  onSelect?: (item: MenuItem) => void;
}

export function formatPrice(pricePaise: number | null, variantPrices?: Record<string, number> | null): string {
  if (variantPrices && Object.keys(variantPrices).length > 0) {
    const entries = Object.entries(variantPrices);
    return entries
      .map(([key, val]) => `${key.toUpperCase()}: ₹${Math.round(val / 100)}`)
      .join(' | ');
  }
  if (pricePaise !== null && pricePaise !== undefined) {
    return `₹${Math.round(pricePaise / 100)}`;
  }
  return '';
}

export function VegIndicator({ isVeg }: { isVeg: boolean | null }) {
  if (isVeg === null) return null;
  return (
    <span
      className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded border ${
        isVeg ? 'border-emerald-600 bg-emerald-50' : 'border-rose-600 bg-rose-50'
      } p-0.5 shrink-0`}
      title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isVeg ? 'bg-emerald-600' : 'bg-rose-600'
        }`}
      />
    </span>
  );
}

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  const priceDisplay = formatPrice(item.price_paise, item.variant_prices);
  const isAvailable = item.is_available !== false;

  // 1. Signature Card Style
  if (item.is_signature) {
    return (
      <div
        onClick={() => onSelect?.(item)}
        className={`group relative p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between text-white border border-[#834e2f]/40 bg-gradient-to-br from-[#834e2f] via-[#6f3f24] to-[#4e2b17] apple-press overflow-hidden ${
          !isAvailable ? 'opacity-60 grayscale-[40%]' : 'cursor-pointer'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1.5">
              <VegIndicator isVeg={item.is_veg} />
              <span className="text-[10px] uppercase font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                <span>{item.custom_tag || 'Signature'}</span>
              </span>
              {!isAvailable && (
                <span className="text-[10px] uppercase font-bold tracking-wider bg-black/40 text-rose-300 px-2 py-0.5 rounded-full">
                  Sold Out
                </span>
              )}
            </div>
            <h4 className="font-serif text-base font-semibold text-white leading-snug tracking-tight">
              {item.name}
            </h4>
            {item.description && (
              <p className="text-xs text-white/80 mt-1 line-clamp-2 leading-relaxed font-light">
                {item.description}
              </p>
            )}
          </div>
          {item.image_url && (
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-inner">
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/10">
          <div className="flex flex-wrap gap-1">
            {item.tags?.slice(0, 2).map((tag, idx) => (
              <span key={idx} className="text-[9px] text-white/70 bg-black/20 px-1.5 py-0.5 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
          {priceDisplay && (
            <span className="text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full whitespace-nowrap shadow-xs">
              {priceDisplay}
            </span>
          )}
        </div>
      </div>
    );
  }

  // 2. Regular Item Card
  return (
    <div
      onClick={() => onSelect?.(item)}
      className={`group bg-white p-4 rounded-2xl shadow-xs border border-stone-200/80 hover:shadow-sm transition-all duration-200 flex flex-col justify-between h-full apple-press ${
        !isAvailable ? 'opacity-60 bg-stone-50/80' : 'cursor-pointer'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <VegIndicator isVeg={item.is_veg} />
            {(item.is_most_ordered || item.custom_tag) && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#8B4A27] bg-[#8B4A27]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-[#8B4A27] text-[#8B4A27]" />
                <span>{item.custom_tag || 'Bestseller'}</span>
              </span>
            )}
            {!isAvailable && (
              <span className="text-[9px] uppercase font-bold tracking-wider bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full border border-stone-200">
                Sold Out
              </span>
            )}
          </div>
          <h4 className="font-serif text-sm font-semibold text-stone-900 leading-snug tracking-tight">
            {item.name}
          </h4>
          {item.description && (
            <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {item.image_url && (
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-stone-100 border border-stone-100">
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-100">
        <div className="flex flex-wrap gap-1">
          {item.tags?.slice(0, 2).map((tag, idx) => (
            <span key={idx} className="text-[9px] text-stone-500 bg-stone-50 px-1.5 py-0.5 rounded-md border border-stone-100">
              #{tag}
            </span>
          ))}
        </div>
        {priceDisplay && (
          <span className="text-xs font-bold text-[#8B4A27] bg-[#8B4A27]/10 px-2.5 py-1 rounded-full whitespace-nowrap">
            {priceDisplay}
          </span>
        )}
      </div>
    </div>
  );
}
