'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRestaurant, publishRestaurantAction } from '@/actions/restaurant';
import { MediaUploader } from './MediaUploader';
import { ThemeCustomizer } from './ThemeCustomizer';
import PublicMenu from '@/components/public-menu/PublicMenu';
import { Restaurant, RestaurantTheme, RestaurantBranding, MenuCategory, MenuItem } from '@/types/database';

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('Fresh flavors served with love');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [instagram, setInstagram] = useState('');
  const [googleReview, setGoogleReview] = useState('');

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

  // Created restaurant record after Step 1
  const [createdRestaurant, setCreatedRestaurant] = useState<Restaurant | null>(null);

  const handleCreateOrAdvance = async () => {
    setError(null);

    if (step === 1) {
      if (!name.trim() || name.trim().length < 2) {
        setError('Please enter a valid restaurant name (at least 2 characters).');
        return;
      }

      setLoading(true);
      try {
        const res = await createRestaurant({
          name: name.trim(),
          tagline: tagline.trim(),
          contact: { phone, whatsapp, email: null },
          address: { street, city, state, pincode, google_maps_url: googleMapsUrl },
          social_links: { instagram, facebook: null, google_review: googleReview },
          branding,
          theme,
        });

        if (!res.success || !res.restaurant) {
          throw new Error(res.error || 'Failed to initialize restaurant.');
        }

        setCreatedRestaurant(res.restaurant);
        setStep(2);
      } catch (err: unknown) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 3) {
      // Validate hero video poster rule
      if (branding.hero_media_type === 'video' && branding.hero_media_url && !branding.hero_poster_url) {
        setError('A poster image is required when using a hero video.');
        return;
      }
    }

    if (step < 5) {
      setStep(step + 1);
    }
  };

  // Sample items for step 5 live preview
  const previewCategories: MenuCategory[] = [
    {
      id: 'prev-cat-1',
      restaurant_id: createdRestaurant?.id || 'temp',
      name: 'Chef Specials',
      slug: 'chef-specials',
      description: 'Signature creations from our kitchen',
      position: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const previewItems: MenuItem[] = [
    {
      id: 'prev-itm-1',
      restaurant_id: createdRestaurant?.id || 'temp',
      category_id: 'prev-cat-1',
      name: 'Artisan Signature Dish',
      slug: 'artisan-signature-dish',
      description: 'Slow-cooked with hand-picked spices and fresh cream',
      price_paise: 29000,
      variant_prices: null,
      image_url: null,
      tags: ['Chef Pick', 'Bestseller'],
      allergens: null,
      is_veg: true,
      is_available: true,
      is_signature: true,
      is_most_ordered: true,
      is_monsoon: false,
      custom_tag: 'Signature',
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const simulatedRestaurant: Restaurant = {
    id: createdRestaurant?.id || 'temp',
    owner_profile_id: createdRestaurant?.owner_profile_id || 'temp',
    agent_id: null,
    slug: createdRestaurant?.slug || 'my-restaurant',
    name: name || 'My Restaurant',
    status: 'draft',
    onboarding_source: 'self_serve',
    trial_ends_at: createdRestaurant?.trial_ends_at || new Date().toISOString(),
    published_at: null,
    site_status: 'trialing',
    subscription_end_date: null,
    branding,
    contact: { phone, whatsapp, email: null },
    address: { street, city, state, pincode, google_maps_url: googleMapsUrl },
    social_links: { instagram, facebook: null, google_review: googleReview },
    theme,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Progress Stepper */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200/80 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[
            { num: 1, label: 'Details' },
            { num: 2, label: 'Contact' },
            { num: 3, label: 'Media' },
            { num: 4, label: 'Theme' },
            { num: 5, label: 'Preview' },
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s.num
                    ? 'bg-[#8B4A27] text-white shadow-md'
                    : step > s.num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-100 text-stone-400'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span className="text-[11px] font-medium text-stone-600 mt-1 hidden sm:block">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl">
          {error}
        </div>
      )}

      {/* STEP 1: RESTAURANT DETAILS */}
      {step === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900">Restaurant Basics</h2>
            <p className="text-xs text-stone-500 mt-1">
              Give your restaurant a name and captivating tagline. A unique public URL will be generated.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Restaurant Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Royal Chai &amp; Bites"
              className="w-full text-xs sm:text-sm px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4A27]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Tagline / Bio
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Traditional clay pot chai and gourmet bakery"
              className="w-full text-xs sm:text-sm px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4A27]/20"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleCreateOrAdvance}
              disabled={loading}
              className="px-6 py-2.5 bg-[#8B4A27] hover:bg-[#723b1f] text-white text-xs font-semibold rounded-2xl shadow-sm transition-all disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Continue to Contact →'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CONTACT & SOCIALS */}
      {step === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900">Contact &amp; Location</h2>
            <p className="text-xs text-stone-500 mt-1">
              Enable customers to WhatsApp orders, call for bookings, and locate you on Google Maps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full text-xs px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">WhatsApp Number</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full text-xs px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Pune"
                className="w-full text-xs px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Street Address</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Shop 12, Main Market"
                className="w-full text-xs px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Instagram Profile URL</label>
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/myrestaurant"
                className="w-full text-xs px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Google Review Link</label>
              <input
                type="url"
                value={googleReview}
                onChange={(e) => setGoogleReview(e.target.value)}
                placeholder="https://g.page/r/..."
                className="w-full text-xs px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-stone-100 text-stone-700 text-xs font-medium rounded-xl"
            >
              ← Back
            </button>
            <button
              onClick={handleCreateOrAdvance}
              className="px-6 py-2.5 bg-[#8B4A27] text-white text-xs font-semibold rounded-2xl shadow-sm"
            >
              Continue to Media →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: LOGO & HERO MEDIA */}
      {step === 3 && createdRestaurant && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-6">
          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900">Logo &amp; Hero Media</h2>
            <p className="text-xs text-stone-500 mt-1">
              Upload via Cloudflare R2. Max 5MB for images, max 50MB for video. A poster image is required if you choose video.
            </p>
          </div>

          <div className="space-y-4">
            {/* Logo */}
            <MediaUploader
              restaurantId={createdRestaurant.id}
              purpose="logo"
              currentUrl={branding.logo_url}
              onUploadSuccess={(url) => setBranding({ ...branding, logo_url: url })}
              label="Restaurant Brand Logo (PNG / WEBP)"
              maxSizeMb={5}
            />

            {/* Hero Type Toggle */}
            <div className="pt-4 border-t border-stone-100">
              <label className="block text-xs font-semibold text-stone-700 mb-2">
                Hero Section Media Format
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
                  📷 Still Image
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
                  🎬 Background Video (Max 50MB)
                </button>
              </div>
            </div>

            {/* Hero Media Upload */}
            <MediaUploader
              restaurantId={createdRestaurant.id}
              purpose="hero"
              currentUrl={branding.hero_media_url}
              onUploadSuccess={(url) => setBranding({ ...branding, hero_media_url: url })}
              label={branding.hero_media_type === 'video' ? 'Hero Video (MP4/WebM)' : 'Hero Image'}
              accept={branding.hero_media_type === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp'}
              maxSizeMb={branding.hero_media_type === 'video' ? 50 : 5}
            />

            {/* Poster Upload (Required for Video) */}
            {branding.hero_media_type === 'video' && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <MediaUploader
                  restaurantId={createdRestaurant.id}
                  purpose="poster"
                  currentUrl={branding.hero_poster_url}
                  onUploadSuccess={(url) => setBranding({ ...branding, hero_poster_url: url })}
                  label="Poster Image for Video * (Displayed before video starts)"
                  accept="image/jpeg,image/png,image/webp"
                  maxSizeMb={5}
                />
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-between border-t border-stone-100">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-stone-100 text-stone-700 text-xs font-medium rounded-xl"
            >
              ← Back
            </button>
            <button
              onClick={handleCreateOrAdvance}
              className="px-6 py-2.5 bg-[#8B4A27] text-white text-xs font-semibold rounded-2xl shadow-sm"
            >
              Continue to Theme →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: THEME SELECTION */}
      {step === 4 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-6">
          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900">Color Palette &amp; Style</h2>
            <p className="text-xs text-stone-500 mt-1">
              Pick colors that match your physical ambiance and interior aesthetic.
            </p>
          </div>

          <ThemeCustomizer theme={theme} onChange={(t) => setTheme(t)} />

          <div className="pt-4 flex justify-between border-t border-stone-100">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 bg-stone-100 text-stone-700 text-xs font-medium rounded-xl"
            >
              ← Back
            </button>
            <button
              onClick={handleCreateOrAdvance}
              className="px-6 py-2.5 bg-[#8B4A27] text-white text-xs font-semibold rounded-2xl shadow-sm"
            >
              Preview Live Menu →
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: LIVE PREVIEW & COMPLETE SETUP */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-900">Live Menu Preview</h2>
              <p className="text-xs text-stone-500 mt-1">
                This is exactly how diners will see your restaurant when scanning your QR code.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setStep(4)}
                className="px-4 py-2 bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl"
              >
                Edit Theme
              </button>
              <button
                onClick={() => router.push('/owner')}
                className="px-6 py-2.5 bg-[#8B4A27] text-white text-xs font-bold rounded-2xl shadow-sm"
              >
                Finish &amp; Go to Dashboard →
              </button>
            </div>
          </div>

          {/* Embedded Customer Menu Container */}
          <div className="border border-stone-300 rounded-3xl overflow-hidden shadow-2xl">
            <PublicMenu
              restaurant={simulatedRestaurant}
              categories={previewCategories}
              items={previewItems}
            />
          </div>
        </div>
      )}
    </div>
  );
}
