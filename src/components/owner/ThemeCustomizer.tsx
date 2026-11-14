'use client';

import React from 'react';
import { RestaurantTheme, CardStyle } from '@/types/database';
import { Palette, Check } from 'lucide-react';

interface ThemeCustomizerProps {
  theme: RestaurantTheme;
  onChange: (updatedTheme: RestaurantTheme) => void;
}

const PRESET_PALETTES: Array<{
  id: string;
  name: string;
  primary: string;
  accent: string;
  background: string;
  cardStyle: CardStyle;
  description: string;
}> = [
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    primary: '#914C2B',
    accent: '#B86B3D',
    background: '#F5EBDD',
    cardStyle: 'warm_editorial',
    description: 'Warm cream tones with handcrafted terracotta accents',
  },
  {
    id: 'dark-coffee-luxury',
    name: 'Dark Coffee Luxury',
    primary: '#C77A32',
    accent: '#E4A64A',
    background: '#120D09',
    cardStyle: 'modern_dark',
    description: 'High-end specialty coffee bar with deep espresso and gold',
  },
  {
    id: 'botanical',
    name: 'Botanical',
    primary: '#426B45',
    accent: '#A7B88A',
    background: '#F1F3E8',
    cardStyle: 'minimalist',
    description: 'Organic café with sage and cream botanical accents',
  },
  {
    id: 'minimal-editorial',
    name: 'Minimal Editorial',
    primary: '#1A1A1A',
    accent: '#404040',
    background: '#FFFFFF',
    cardStyle: 'minimalist',
    description: 'Clean modern black & white editorial typography',
  },
  {
    id: 'terracotta-mediterranean',
    name: 'Terracotta Mediterranean',
    primary: '#C85A32',
    accent: '#D97736',
    background: '#F7F2EA',
    cardStyle: 'warm_editorial',
    description: 'Sun-baked clay, warm sand, and olive tones',
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    primary: '#1E3A5F',
    accent: '#4A90E2',
    background: '#0D1B2A',
    cardStyle: 'modern_dark',
    description: 'Deep navy night with crisp silver and sky blue',
  },
];

export function ThemeCustomizer({ theme, onChange }: ThemeCustomizerProps) {
  const applyPreset = (preset: (typeof PRESET_PALETTES)[0]) => {
    onChange({
      theme_id: preset.id,
      primary_color: preset.primary,
      accent_color: preset.accent,
      background_color: preset.background,
      card_style: preset.cardStyle,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Quick Presets */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-[#8B4A27]" />
          <label className="text-xs font-semibold text-stone-800 tracking-tight">
            Curated Design Presets (6 Themes)
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESET_PALETTES.map((preset) => {
            const isSelected =
              theme.theme_id === preset.id ||
              (theme.primary_color?.toLowerCase() === preset.primary.toLowerCase() &&
                theme.background_color?.toLowerCase() === preset.background.toLowerCase());

            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`p-4 rounded-2xl text-left transition-all apple-press border relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#8B4A27] bg-[#8B4A27]/5 ring-1 ring-[#8B4A27]/20 shadow-sm'
                    : 'border-stone-200/80 bg-white hover:border-stone-300'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#8B4A27] text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <span
                      className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: preset.accent }}
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: preset.background }}
                    />
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 tracking-tight">
                    {preset.name}
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Custom Color Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-stone-200/60">
        <div className="p-3 bg-stone-50/60 rounded-2xl border border-stone-200/60">
          <label className="block text-xs font-semibold text-stone-700 mb-2">
            Primary Brand Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.primary_color}
              onChange={(e) => onChange({ ...theme, primary_color: e.target.value })}
              className="w-10 h-10 rounded-xl cursor-pointer border border-stone-300 p-0.5 bg-white shadow-xs"
            />
            <input
              type="text"
              value={theme.primary_color}
              onChange={(e) => onChange({ ...theme, primary_color: e.target.value })}
              className="w-full text-xs font-mono px-3 py-2 bg-white border border-stone-300 rounded-xl uppercase text-stone-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#8B4A27]"
            />
          </div>
        </div>

        <div className="p-3 bg-stone-50/60 rounded-2xl border border-stone-200/60">
          <label className="block text-xs font-semibold text-stone-700 mb-2">
            Accent Badge Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.accent_color}
              onChange={(e) => onChange({ ...theme, accent_color: e.target.value })}
              className="w-10 h-10 rounded-xl cursor-pointer border border-stone-300 p-0.5 bg-white shadow-xs"
            />
            <input
              type="text"
              value={theme.accent_color}
              onChange={(e) => onChange({ ...theme, accent_color: e.target.value })}
              className="w-full text-xs font-mono px-3 py-2 bg-white border border-stone-300 rounded-xl uppercase text-stone-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#8B4A27]"
            />
          </div>
        </div>

        <div className="p-3 bg-stone-50/60 rounded-2xl border border-stone-200/60">
          <label className="block text-xs font-semibold text-stone-700 mb-2">
            Background Canvas
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.background_color}
              onChange={(e) => onChange({ ...theme, background_color: e.target.value })}
              className="w-10 h-10 rounded-xl cursor-pointer border border-stone-300 p-0.5 bg-white shadow-xs"
            />
            <input
              type="text"
              value={theme.background_color}
              onChange={(e) => onChange({ ...theme, background_color: e.target.value })}
              className="w-full text-xs font-mono px-3 py-2 bg-white border border-stone-300 rounded-xl uppercase text-stone-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#8B4A27]"
            />
          </div>
        </div>
      </div>

      {/* 3. Card Typography & Layout Style */}
      <div className="pt-4 border-t border-stone-200/60">
        <label className="block text-xs font-semibold text-stone-800 tracking-tight mb-2.5">
          Menu Card Layout Style
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'warm_editorial', label: 'Warm Editorial' },
            { id: 'minimalist', label: 'Clean Minimalist' },
            { id: 'modern_dark', label: 'Modern Dark' },
            { id: 'heritage', label: 'Heritage Serif' },
          ].map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => onChange({ ...theme, card_style: style.id as CardStyle })}
              className={`p-3 rounded-2xl text-xs font-semibold border text-center transition-all apple-press ${
                theme.card_style === style.id
                  ? 'border-[#8B4A27] bg-[#8B4A27] text-white shadow-sm'
                  : 'border-stone-200/80 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
