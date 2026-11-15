'use client';

import React from 'react';
import { RestaurantTheme, CardStyle } from '@/types/database';
import { PREDEFINED_THEMES } from '@/lib/themes/predefinedThemes';
import { Palette, Check } from 'lucide-react';

interface ThemeCustomizerProps {
  theme: RestaurantTheme;
  onChange: (updatedTheme: RestaurantTheme) => void;
}

export const THEME_CARD_STYLES: Record<string, CardStyle> = {
  cappuccino: 'warm_editorial',
  'dark-coffee-luxury': 'modern_dark',
  botanical: 'minimalist',
  'minimal-editorial': 'minimalist',
  'terracotta-mediterranean': 'warm_editorial',
  'midnight-blue': 'modern_dark',
  'cream-orange': 'warm_editorial',
  'pure-monochrome': 'minimalist',
  'soft-blush': 'warm_editorial',
  'forest-gold': 'heritage',
};

const PRESET_PALETTES = PREDEFINED_THEMES.map((t) => ({
  id: t.id,
  name: t.name,
  primary: t.colors.primary,
  accent: t.colors.accent,
  background: t.colors.background,
  cardStyle: THEME_CARD_STYLES[t.id] || 'warm_editorial',
  description: t.description,
}));

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
            Curated Design Presets (10 Themes)
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
              onChange={(e) => onChange({ ...theme, primary_color: e.target.value, theme_id: undefined })}
              className="w-10 h-10 rounded-xl cursor-pointer border border-stone-300 p-0.5 bg-white shadow-xs"
            />
            <input
              type="text"
              value={theme.primary_color}
              onChange={(e) => onChange({ ...theme, primary_color: e.target.value, theme_id: undefined })}
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
              onChange={(e) => onChange({ ...theme, accent_color: e.target.value, theme_id: undefined })}
              className="w-10 h-10 rounded-xl cursor-pointer border border-stone-300 p-0.5 bg-white shadow-xs"
            />
            <input
              type="text"
              value={theme.accent_color}
              onChange={(e) => onChange({ ...theme, accent_color: e.target.value, theme_id: undefined })}
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
              onChange={(e) => onChange({ ...theme, background_color: e.target.value, theme_id: undefined })}
              className="w-10 h-10 rounded-xl cursor-pointer border border-stone-300 p-0.5 bg-white shadow-xs"
            />
            <input
              type="text"
              value={theme.background_color}
              onChange={(e) => onChange({ ...theme, background_color: e.target.value, theme_id: undefined })}
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
