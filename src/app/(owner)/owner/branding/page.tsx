'use client';

import React, { useState, useEffect } from 'react';
import { MediaUploader } from '@/components/owner/MediaUploader';
import { ThemeCustomizer } from '@/components/owner/ThemeCustomizer';
import { updateBrandingAndTheme } from '@/actions/restaurant';
import { RestaurantBranding, RestaurantTheme } from '@/types/database';

export default function BrandingPage() {
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [branding, setBranding] = useState<RestaurantBranding>({
    logo_url: null,
    hero_media_type: 'image',
    hero_media_url: null,
    hero_poster_url: null,
    tagline: 'Fresh flavors served with love',
  });
  const [theme, setTheme] = useState<RestaurantTheme>({
    primary_color: '#8B4A27',
    accent_color: '#D2691E',
    background_color: '#FAF8F5',
    card_style: 'warm_editorial',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // In real dashboard, state can be initialized from parent context or fetch
    // Use fallback demo ID if testing locally
    setRestaurantId('00000000-0000-0000-0000-000000000000');
  }, []);

  const handleSave = async () => {
    setMessage(null);

    // Validate hero video poster rule (Correction 3)
    if (branding.hero_media_type === 'video' && branding.hero_media_url && !branding.hero_poster_url) {
      setMessage({ text: 'A poster image is required when using a hero video.', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      const res = await updateBrandingAndTheme(restaurantId, branding, theme);
      if (!res.success) {
        throw new Error(res.error || 'Failed to update branding');
      }
      setMessage({ text: 'Branding and theme saved successfully!', type: 'success' });
    } catch (err: unknown) {
      setMessage({ text: (err as Error).message || 'Save failed', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Branding &amp; Theme Customizer</h1>
          <p className="text-xs text-stone-500 mt-1">
            Customize your logo, hero video/image, brand palette, and menu card typography.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#8B4A27] hover:bg-[#723b1f] text-white text-xs font-bold rounded-2xl shadow-sm transition-all disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div
          className={`p-3 text-xs rounded-2xl border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Media Uploads Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-6">
        <h2 className="font-serif text-lg font-bold text-stone-900">Brand Assets &amp; Hero Section</h2>

        <div className="space-y-4">
          <MediaUploader
            restaurantId={restaurantId}
            purpose="logo"
            currentUrl={branding.logo_url}
            onUploadSuccess={(url) => setBranding({ ...branding, logo_url: url })}
            label="Restaurant Logo (PNG / WEBP)"
            maxSizeMb={5}
          />

          <div className="pt-4 border-t border-stone-100">
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Hero Section Media Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBranding({ ...branding, hero_media_type: 'image' })}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  branding.hero_media_type === 'image'
                    ? 'bg-[#8B4A27] text-white border-[#8B4A27]'
                    : 'bg-white text-stone-700 border-stone-300'
                }`}
              >
                📷 Image
              </button>
              <button
                type="button"
                onClick={() => setBranding({ ...branding, hero_media_type: 'video' })}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  branding.hero_media_type === 'video'
                    ? 'bg-[#8B4A27] text-white border-[#8B4A27]'
                    : 'bg-white text-stone-700 border-stone-300'
                }`}
              >
                🎬 Video (Max 50MB)
              </button>
            </div>
          </div>

          <MediaUploader
            restaurantId={restaurantId}
            purpose="hero"
            currentUrl={branding.hero_media_url}
            onUploadSuccess={(url) => setBranding({ ...branding, hero_media_url: url })}
            label={branding.hero_media_type === 'video' ? 'Hero Video (MP4 / WebM)' : 'Hero Image'}
            accept={branding.hero_media_type === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp'}
            maxSizeMb={branding.hero_media_type === 'video' ? 50 : 5}
          />

          {branding.hero_media_type === 'video' && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
              <MediaUploader
                restaurantId={restaurantId}
                purpose="poster"
                currentUrl={branding.hero_poster_url}
                onUploadSuccess={(url) => setBranding({ ...branding, hero_poster_url: url })}
                label="Poster Image for Video * (Displayed before video loads)"
                accept="image/jpeg,image/png,image/webp"
                maxSizeMb={5}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Tagline</label>
            <input
              type="text"
              value={branding.tagline}
              onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
              className="w-full text-xs sm:text-sm px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl"
            />
          </div>
        </div>
      </div>

      {/* Theme Customizer Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
        <h2 className="font-serif text-lg font-bold text-stone-900">Colors &amp; Menu Card Style</h2>
        <ThemeCustomizer theme={theme} onChange={(t) => setTheme(t)} />
      </div>
    </div>
  );
}
