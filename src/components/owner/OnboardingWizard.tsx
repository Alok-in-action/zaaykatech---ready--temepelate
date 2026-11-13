'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRestaurant, publishRestaurantAction } from '@/actions/restaurant';
import { MediaUploader } from './MediaUploader';
import { ThemeCustomizer } from './ThemeCustomizer';
import PublicMenu from '@/components/public-menu/PublicMenu';
import { Restaurant, RestaurantTheme, RestaurantBranding, MenuCategory, MenuItem } from '@/types/database';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Sparkles, Store, Phone, MapPin, Palette, Eye } from 'lucide-react';

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

  const stepsList = [
    { num: 1, label: 'Identity', icon: Store },
    { num: 2, label: 'Contact', icon: Phone },
    { num: 3, label: 'Media', icon: Sparkles },
    { num: 4, label: 'Theme', icon: Palette },
    { num: 5, label: 'Preview', icon: Eye },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Progress Stepper */}
      <div className="apple-card rounded-3xl p-4 sm:p-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto relative">
          {/* Subtle connecting track line */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-stone-200/80 -z-0" />

          {stepsList.map((s) => {
            const Icon = s.icon;
            const isCurrent = step === s.num;
            const isCompleted = step > s.num;
            return (
              <div key={s.num} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isCurrent
                      ? 'bg-[#8B4A27] text-white shadow-xs ring-4 ring-[#8B4A27]/15'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-stone-300 text-stone-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span className={`text-[11px] font-semibold mt-1.5 hidden sm:block ${
                  isCurrent ? 'text-stone-900' : 'text-stone-400'
                }`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl">
          {error}
        </div>
      )}

      {/* STEP 1: RESTAURANT DETAILS */}
      {step === 1 && (
        <div className="apple-card rounded-3xl p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Restaurant Identity
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Give your restaurant a distinct name and appetizing tagline. A unique mobile QR address will be reserved for you.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Restaurant Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Chai &amp; Bites"
                className="w-full text-xs sm:text-sm px-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4A27]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Tagline / Bio
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Traditional clay pot chai and gourmet bakery"
                className="w-full text-xs sm:text-sm px-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4A27]/20 transition-all"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end border-t border-stone-100">
            <button
              onClick={handleCreateOrAdvance}
              disabled={loading}
              className="px-6 py-3 bg-[#8B4A27] hover:bg-[#743c1e] text-white text-xs font-semibold rounded-2xl shadow-xs transition-all apple-press disabled:opacity-60 inline-flex items-center gap-1.5 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Creating...' : 'Continue to Contact'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CONTACT & SOCIALS */}
      {step === 2 && (
        <div className="apple-card rounded-3xl p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Contact &amp; Location
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Enable diners to WhatsApp orders, call for reservations, and find you on Google Maps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full text-xs px-4 py-2.5 bg-stone-50/70 border border-stone-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#8B4A27]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">WhatsApp Number</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full text-xs px-4 py-2.5 bg-stone-50/70 border border-stone-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#8B4A27]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Pune"
                className="w-full text-xs px-4 py-2.5 bg-stone-50/70 border border-stone-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#8B4A27]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">Street Address</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Shop 12, Main Market"
                className="w-full text-xs px-4 py-2.5 bg-stone-50/70 border border-stone-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#8B4A27]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">Instagram Profile URL</label>
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/myrestaurant"
                className="w-full text-xs px-4 py-2.5 bg-stone-50/70 border border-stone-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#8B4A27]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">Google Review Link</label>
              <input
                type="url"
                value={googleReview}
                onChange={(e) => setGoogleReview(e.target.value)}
                placeholder="https://g.page/r/..."
                className="w-full text-xs px-4 py-2.5 bg-stone-50/70 border border-stone-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#8B4A27]/20 transition-all"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-between border-t border-stone-100">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl apple-press transition-all inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={handleCreateOrAdvance}
              className="px-6 py-2.5 bg-[#8B4A27] hover:bg-[#743c1e] text-white text-xs font-semibold rounded-2xl shadow-xs transition-all apple-press inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Continue to Media</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: LOGO & HERO MEDIA */}
      {step === 3 && createdRestaurant && (
        <div className="apple-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Logo &amp; Hero Media
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Upload high-definition branding assets directly. A poster image is required if you choose background video.
            </p>
          </div>

          <div className="space-y-5">
            {/* Logo */}
            <MediaUploader
              restaurantId={createdRestaurant.id}
              purpose="logo"
              currentUrl={branding.logo_url}
              onUploadSuccess={(url) => setBranding({ ...branding, logo_url: url })}
              label="Restaurant Brand Logo (PNG / WEBP)"
              accept="image/png,image/jpeg,image/webp"
              maxSizeMb={5}
            />

            {/* Hero Media Type Toggle */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-stone-700 mb-2">
                Hero Header Media Type
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => setBranding({ ...branding, hero_media_type: 'image' })}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-semibold transition-all apple-press cursor-pointer ${
                    branding.hero_media_type === 'image'
                      ? 'border-[#8B4A27] bg-[#8B4A27]/10 text-[#8B4A27] shadow-2xs'
                      : 'border-stone-200 bg-stone-50 text-stone-600'
                  }`}
                >
                  Static Image Hero
                </button>
                <button
                  type="button"
                  onClick={() => setBranding({ ...branding, hero_media_type: 'video' })}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-semibold transition-all apple-press cursor-pointer ${
                    branding.hero_media_type === 'video'
                      ? 'border-[#8B4A27] bg-[#8B4A27]/10 text-[#8B4A27] shadow-2xs'
                      : 'border-stone-200 bg-stone-50 text-stone-600'
                  }`}
                >
                  Cinematic Video Hero
                </button>
              </div>
            </div>

            {/* Hero Image or Video */}
            {branding.hero_media_type === 'image' ? (
              <MediaUploader
                restaurantId={createdRestaurant.id}
                purpose="hero"
                currentUrl={branding.hero_media_url}
                onUploadSuccess={(url) => setBranding({ ...branding, hero_media_url: url })}
                label="Hero Background Photo"
                accept="image/jpeg,image/png,image/webp"
                maxSizeMb={5}
              />
            ) : (
              <div className="space-y-4">
                <MediaUploader
                  restaurantId={createdRestaurant.id}
                  purpose="hero"
                  currentUrl={branding.hero_media_url}
                  onUploadSuccess={(url) => setBranding({ ...branding, hero_media_url: url })}
                  label="Hero Video (MP4 / WebM, max 50MB)"
                  accept="video/mp4,video/webm"
                  maxSizeMb={50}
                />
                <MediaUploader
                  restaurantId={createdRestaurant.id}
                  purpose="poster"
                  currentUrl={branding.hero_poster_url}
                  onUploadSuccess={(url) => setBranding({ ...branding, hero_poster_url: url })}
                  label="Poster Image for Video * (Displayed before video plays)"
                  accept="image/jpeg,image/png,image/webp"
                  maxSizeMb={5}
                />
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-between border-t border-stone-100">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl apple-press transition-all inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={handleCreateOrAdvance}
              className="px-6 py-2.5 bg-[#8B4A27] hover:bg-[#743c1e] text-white text-xs font-semibold rounded-2xl shadow-xs transition-all apple-press inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Continue to Theme</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: THEME SELECTION */}
      {step === 4 && (
        <div className="apple-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Color Palette &amp; Card Style
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Select palette combinations that reflect your restaurant&apos;s physical atmosphere and lighting.
            </p>
          </div>

          <ThemeCustomizer theme={theme} onChange={(t) => setTheme(t)} />

          <div className="pt-4 flex justify-between border-t border-stone-100">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl apple-press transition-all inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={handleCreateOrAdvance}
              className="px-6 py-2.5 bg-[#8B4A27] hover:bg-[#743c1e] text-white text-xs font-semibold rounded-2xl shadow-xs transition-all apple-press inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Preview Live Menu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: LIVE PREVIEW & COMPLETE SETUP */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="apple-card rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Live Menu Preview
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                This is exactly how guests will experience your dishes on mobile devices when scanning your QR code.
              </p>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => setStep(4)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl apple-press transition-all cursor-pointer"
              >
                Edit Theme
              </button>
              <button
                onClick={() => router.push('/owner')}
                className="px-6 py-2.5 bg-[#8B4A27] hover:bg-[#743c1e] text-white text-xs font-bold rounded-2xl shadow-xs transition-all apple-press inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Finish &amp; Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Embedded Customer Menu Container with Apple Device Framing */}
          <div className="border border-black/[0.08] rounded-3xl overflow-hidden shadow-2xl bg-white max-w-md mx-auto">
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
