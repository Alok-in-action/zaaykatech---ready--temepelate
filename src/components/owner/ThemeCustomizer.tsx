'use client';

import React from 'react';
import { RestaurantTheme, CardStyle } from '@/types/database';

interface ThemeCustomizerProps {
  theme: RestaurantTheme;
  onChange: (updatedTheme: RestaurantTheme) => void;
}

const PRESET_PALETTES: Array<{
  name: string;
  primary: string;
  accent: string;
  background: string;
  cardStyle: CardStyle;
}> = [
  {
    name: 'Warm Artisanal',
    primary: '#8B4A27',
    accent: '#D2691E',
    background: '#FAF8F5',
    cardStyle: 'warm_editorial',
  },
  {
    name: 'Royal Heritage',
    primary: '#781D22',
    accent: '#D4AF37',
    background: '#FDFBF7',
    cardStyle: 'heritage',
  },
  {
    name: 'Botanical Bistro',
    primary: '#2D4A22',
    accent: '#8F9779',
    background: '#F8FAF6',
    cardStyle: 'minimalist',
  },
  {
    name: 'Midnight Velvet',
    primary: '#D4AF37',
    accent: '#E5C158',
    background: '#1A1A1A',
    cardStyle: 'modern_dark',
  },
];

export function ThemeCustomizer({ theme, onChange }: ThemeCustomizerProps) {
  const applyPreset = (preset: (typeof PRESET_PALETTES)[0]) => {
    onChange({
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
        <label className="block text-xs font-semibold text-stone-700 mb-2">
          Curated Design Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESET_PALETTES.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset)}
              className="p-3 bg-white border border-stone-200 rounded-2xl hover:border-stone-400 text-left transition-all shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span
                  className="w-4 h-4 rounded-full border border-black/10"
                  style={{ backgroundColor: preset.primary }}
                />
                <span
                  className="w-4 h-4 rounded-full border border-black/10"
                  style={{ backgroundColor: preset.accent }}
                />
                <span
                  className="w-4 h-4 rounded-full border border-black/10"
                  style={{ backgroundColor: preset.background }}
                />
              </div>
              <span className="text-xs font-semibold text-stone-800">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Custom Color Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-stone-100">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Primary Brand Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.primary_color}
              onChange={(e) => onChange({ ...theme, primary_color: e.target.value })}
              className="w-10 h-10 rounded-xl cursor-pointer border border-stone-200 p-0.5 bg-white"
            />
            <input
              type="text"
              value={theme.primary_color}
              onChange={(e) => onChange({ ...theme, primary_color: e.target.value })}
              className="w-full text-xs font-mono px-3 py-2 bg-white border border-stone-200 rounded-xl uppercase"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Accent Badge Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.accent_color}
              onChange={(e) => onChange({ ...theme, accent_color: e.target.value })}
              className="w-10 h-10 rounded-xl cursor-pointer border border-stone-200 p-0.5 bg-white"
            />
            <input
              type="text"
              value={theme.accent_color}
              onChange={(e) => onChange({ ...theme, accent_color: e.target.value })}
              className="w-full text-xs font-mono px-3 py-2 bg-white border border-stone-200 rounded-xl uppercase"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Background Canvas
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.background_color}
              onChange={(e) => onChange({ ...theme, background_color: e.target.value })}
              className="w-10 h-10 rounded-xl cursor-pointer border border-stone-200 p-0.5 bg-white"
            />
            <input
              type="text"
              value={theme.background_color}
              onChange={(e) => onChange({ ...theme, background_color: e.target.value })}
              className="w-full text-xs font-mono px-3 py-2 bg-white border border-stone-200 rounded-xl uppercase"
            />
          </div>
        </div>
      </div>

      {/* 3. Card Typography & Layout Style */}
      <div className="pt-2 border-t border-stone-100">
        <label className="block text-xs font-semibold text-stone-700 mb-2">
          Menu Card Layout Style
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
              className={`p-3 rounded-2xl text-xs font-medium border text-center transition-all ${
                theme.card_style === style.id
                  ? 'border-[#8B4A27] bg-[#8B4A27]/5 text-[#8B4A27] font-bold'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
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
