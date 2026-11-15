'use client';

import React, { useState, useEffect } from 'react';
import { MediaUploader } from '@/components/owner/MediaUploader';
import { ThemeCustomizer } from '@/components/owner/ThemeCustomizer';
import { getOwnerRestaurant, updateBrandingAndTheme } from '@/actions/restaurant';
import { RestaurantBranding, RestaurantTheme } from '@/types/database';
import { Image as ImageIcon, Film, CheckCircle2, AlertCircle, RefreshCw, Palette, Sparkles } from 'lucide-react';

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function loadBranding() {
      try {
        setInitialLoading(true);
        const res = await getOwnerRestaurant();
        if (res.success && res.restaurant) {
          setRestaurantId(res.restaurant.id);
          if (typeof window !== 'undefined') {
            localStorage.setItem('zaayka_active_restaurant_id', res.restaurant.id);
          }
          if (res.restaurant.branding) {
            setBranding(res.restaurant.branding);
          }
          if (res.restaurant.theme) {
            setTheme(res.restaurant.theme);
          }
        } else {
          setMessage({
            text: res.error || 'No restaurant found. Please create one in Setup Wizard.',
            type: 'error',
          });
        }
      } catch (err: unknown) {
        setMessage({ text: (err as Error).message, type: 'error' });
      } finally {
        setInitialLoading(false);
      }
    }

    loadBranding();
  }, []);

  const handleSave = async () => {
    if (!restaurantId) {
      setMessage({ text: 'Please wait until restaurant details are loaded.', type: 'error' });
      return;
    }
    setMessage(null);

    // Validate hero video poster rule
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
      setTimeout(() => setMessage(null), 4000);
    } catch (err: unknown) {
      setMessage({ text: (err as Error).message || 'Save failed', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-[#8B4A27]/10 text-[#8B4A27]">
              <Palette className="w-5 h-5" />
            </span>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
              Branding &amp; Theme Customizer
            </h1>
          </div>
          <p className="text-xs text-stone-500 max-w-xl">
            Personalize your dining space. Customize your logo, hero video/image, brand palette, and menu card typography.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || initialLoading}
          className="px-6 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] active:bg-[#312E81] text-white text-xs font-bold rounded-2xl shadow-sm transition-all apple-press disabled:opacity-60 flex items-center gap-1.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          {saving ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {message && (
        <div
          className={`p-3.5 text-xs rounded-2xl border flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Media Uploads Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-6">
        <div>
          <h2 className="font-serif text-lg font-bold text-stone-900">Brand Assets &amp; Hero Section</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            These visual assets are rendered at the top of your public QR menu for your diners.
          </p>
        </div>

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
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all apple-press flex items-center gap-1.5 ${
                  branding.hero_media_type === 'image'
                    ? 'bg-[#8B4A27] text-white border-[#8B4A27] shadow-xs'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Image</span>
              </button>
              <button
                type="button"
                onClick={() => setBranding({ ...branding, hero_media_type: 'video' })}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all apple-press flex items-center gap-1.5 ${
                  branding.hero_media_type === 'video'
                    ? 'bg-[#8B4A27] text-white border-[#8B4A27] shadow-xs'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Video (Max 50MB)</span>
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
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-1">
              <MediaUploader
                restaurantId={restaurantId}
                purpose="poster"
                currentUrl={branding.hero_poster_url}
                onUploadSuccess={(url) => setBranding({ ...branding, hero_poster_url: url })}
                label="Poster Image for Video * (Displayed instantly before video stream buffers)"
                accept="image/jpeg,image/png,image/webp"
                maxSizeMb={5}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Tagline / Subtitle
            </label>
            <input
              type="text"
              value={branding.tagline}
              onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
              className="w-full text-xs sm:text-sm px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8B4A27]"
              placeholder="e.g. Fresh wood-fired sourdough pizzas & artisanal coffee"
            />
          </div>
        </div>
      </div>

      {/* Theme Customizer Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-stone-900">Colors &amp; Menu Card Style</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Select a tailored palette or fine-tune individual colors to match your restaurant interior.
          </p>
        </div>
        <ThemeCustomizer theme={theme} onChange={(t) => setTheme(t)} />
      </div>
    </div>
  );
}
