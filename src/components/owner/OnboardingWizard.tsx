'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createRestaurant,
  saveOnboardingStepAction,
  publishRestaurantAction,
  getOwnerMenuData,
} from '@/actions/restaurant';
import { createCategory } from '@/actions/category';
import { createMenuItem } from '@/actions/item';
import { MediaUploader } from './MediaUploader';
import { ThemeCustomizer } from './ThemeCustomizer';
import PublicMenu from '@/components/public-menu/PublicMenu';
import {
  Restaurant,
  RestaurantTheme,
  RestaurantBranding,
  MenuCategory,
  MenuItem,
} from '@/types/database';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  Store,
  Phone,
  MapPin,
  Palette,
  Eye,
  UtensilsCrossed,
  QrCode,
  ExternalLink,
  Copy,
  Plus,
  Check,
  AlertCircle,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

interface OnboardingWizardProps {
  initialRestaurant: Restaurant | null;
  initialStep: number;
  initialCategories: MenuCategory[];
  initialItems: MenuItem[];
}

export function OnboardingWizard({
  initialRestaurant,
  initialStep = 1,
  initialCategories = [],
  initialItems = [],
}: OnboardingWizardProps) {
  const router = useRouter();

  // Active step state (1 to 5)
  const [step, setStep] = useState<number>(initialStep || 1);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(initialRestaurant);
  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories);
  const [items, setItems] = useState<MenuItem[]>(initialItems);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // STEP 1 STATE: Identity & Basics
  const [name, setName] = useState(initialRestaurant?.name || '');
  const [foodType, setFoodType] = useState(initialRestaurant?.food_type || '');
  const [tagline, setTagline] = useState(
    initialRestaurant?.branding?.tagline || 'Fresh flavors served with love'
  );
  const [phone, setPhone] = useState(initialRestaurant?.contact?.phone || '');
  const [whatsapp, setWhatsapp] = useState(initialRestaurant?.contact?.whatsapp || '');
  const [street, setStreet] = useState(initialRestaurant?.address?.street || '');
  const [city, setCity] = useState(initialRestaurant?.address?.city || '');
  const [state, setState] = useState(initialRestaurant?.address?.state || '');
  const [pincode, setPincode] = useState(initialRestaurant?.address?.pincode || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(
    initialRestaurant?.address?.google_maps_url || ''
  );

  // STEP 2 STATE: Branding & Theme
  const [branding, setBranding] = useState<RestaurantBranding>(
    initialRestaurant?.branding || {
      logo_url: null,
      hero_media_type: 'image',
      hero_media_url: null,
      hero_poster_url: null,
      tagline: 'Fresh flavors served with love',
    }
  );

  const [theme, setTheme] = useState<RestaurantTheme>(
    initialRestaurant?.theme || {
      primary_color: '#8B4A27',
      accent_color: '#D2691E',
      background_color: '#FAF8F5',
      card_style: 'warm_editorial',
    }
  );

  // STEP 3 STATE: Inline Category & Item creation
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemIsVeg, setNewItemIsVeg] = useState(true);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  // STEP 5 STATE: Publish result
  const [publishedData, setPublishedData] = useState<{
    publishedAt: string;
    trialEndsAt: string;
  } | null>(
    initialRestaurant?.status === 'published' && initialRestaurant?.published_at && initialRestaurant?.trial_ends_at
      ? {
          publishedAt: initialRestaurant.published_at,
          trialEndsAt: initialRestaurant.trial_ends_at,
        }
      : null
  );

  // Refresh categories & items from server
  const refreshMenuData = async (restId: string) => {
    const res = await getOwnerMenuData(restId);
    if (res.success) {
      setCategories(res.categories);
      setItems(res.items);
      if (res.categories.length > 0 && !newItemCategory) {
        setNewItemCategory(res.categories[0].id);
      }
    }
  };

  // Step 1 Validation & Submission
  const handleStep1Submit = async () => {
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter a valid restaurant name (at least 2 characters).');
      return;
    }
    if (!foodType.trim()) {
      setError('Please specify the food type or cuisine (e.g. Pure Veg, Cafe, Multi-cuisine).');
      return;
    }
    if (!phone.trim()) {
      setError('Please provide a contact phone number for diner inquiries.');
      return;
    }
    if (!city.trim()) {
      setError('Please provide your restaurant city location.');
      return;
    }

    setLoading(true);
    try {
      if (!restaurant) {
        // Create new restaurant
        const res = await createRestaurant({
          name: name.trim(),
          food_type: foodType.trim(),
          tagline: tagline.trim(),
          contact: {
            ...(initialRestaurant?.contact || {}),
            phone: phone.trim(),
            whatsapp: whatsapp.trim() || null,
            email: initialRestaurant?.contact?.email || null,
          },
          address: {
            street: street.trim() || null,
            city: city.trim(),
            state: state.trim() || null,
            pincode: pincode.trim() || null,
            google_maps_url: googleMapsUrl.trim() || null,
          },
          social_links: { instagram: null, facebook: null, google_review: null },
          branding: { ...branding, tagline: tagline.trim() },
          theme,
        });

        if (!res.success || !res.restaurant) {
          throw new Error(res.error || 'Failed to initialize restaurant.');
        }

        setRestaurant(res.restaurant as unknown as Restaurant);
        setStep(2);
      } else {
        // Update existing restaurant and advance step
        const res = await saveOnboardingStepAction(restaurant.id, 2, {
          name: name.trim(),
          food_type: foodType.trim(),
          tagline: tagline.trim(),
          contact: {
            ...(restaurant.contact || {}),
            phone: phone.trim(),
            whatsapp: whatsapp.trim() || null,
            email: restaurant.contact?.email || null,
          },
          address: {
            street: street.trim() || null,
            city: city.trim(),
            state: state.trim() || null,
            pincode: pincode.trim() || null,
            google_maps_url: googleMapsUrl.trim() || null,
          },
        });

        if (!res.success) {
          throw new Error(res.error || 'Failed to save changes.');
        }

        setStep(2);
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Validation & Submission (Branding & Theme)
  const handleStep2Submit = async () => {
    setError(null);
    if (!restaurant) return;

    if (branding.hero_media_type === 'video' && branding.hero_media_url && !branding.hero_poster_url) {
      setError('A poster image is required when using a background hero video.');
      return;
    }

    setLoading(true);
    try {
      const res = await saveOnboardingStepAction(restaurant.id, 3, {
        branding: { ...branding, tagline: tagline.trim() },
        theme,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to save branding.');
      }

      await refreshMenuData(restaurant.id);
      setStep(3);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3 Category Creation
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !newCatName.trim()) return;

    setError(null);
    setAddingCategory(true);
    try {
      const res = await createCategory(restaurant.id, {
        name: newCatName.trim(),
        description: newCatDesc.trim() || undefined,
        is_active: true,
      });

      if (!res.success) throw new Error(res.error || 'Failed to add category');

      setNewCatName('');
      setNewCatDesc('');
      await refreshMenuData(restaurant.id);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setAddingCategory(false);
    }
  };

  // Step 3 Item Creation
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    const targetCatId = newItemCategory || (categories.length > 0 ? categories[0].id : '');
    if (!targetCatId) {
      setError('Please select or create a category first.');
      return;
    }

    if (!newItemName.trim()) {
      setError('Please enter a dish name.');
      return;
    }

    const price = parseFloat(newItemPrice);
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid price in rupees.');
      return;
    }

    setError(null);
    setAddingItem(true);
    try {
      const res = await createMenuItem(restaurant.id, {
        categoryId: targetCatId,
        name: newItemName.trim(),
        pricingMode: 'single',
        price_paise: Math.round(price * 100),
        is_veg: newItemIsVeg,
        description: newItemDesc.trim() || undefined,
        is_available: true,
        is_signature: false,
        is_most_ordered: false,
        is_monsoon: false,
        tags: [],
        allergens: [],
      });

      if (!res.success) throw new Error(res.error || 'Failed to add dish');

      setNewItemName('');
      setNewItemPrice('');
      setNewItemDesc('');
      await refreshMenuData(restaurant.id);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setAddingItem(false);
    }
  };

  // Step 3 Advance to Step 4
  const handleStep3Submit = async () => {
    setError(null);
    if (!restaurant) return;

    if (categories.length === 0) {
      setError('Please add at least one category (e.g. Starters, Main Course) to continue.');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one dish item to your menu before proceeding.');
      return;
    }

    setLoading(true);
    try {
      const res = await saveOnboardingStepAction(restaurant.id, 4, {});
      if (!res.success) {
        throw new Error(res.error || 'Failed to save menu progress.');
      }
      setStep(4);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Step 4 Advance to Step 5
  const handleStep4Submit = async () => {
    if (!restaurant) return;
    setLoading(true);
    try {
      const res = await saveOnboardingStepAction(restaurant.id, 5, {});
      if (!res.success) {
        throw new Error(res.error || 'Failed to advance to step 5.');
      }
      setStep(5);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Step 5 Publish Action
  const handlePublish = async () => {
    if (!restaurant) return;
    setError(null);
    setLoading(true);
    try {
      const res = await publishRestaurantAction(restaurant.id);
      if (!res.success) {
        throw new Error(res.error || 'Failed to publish restaurant menu.');
      }

      setPublishedData({
        publishedAt: res.publishedAt || new Date().toISOString(),
        trialEndsAt: res.trialEndsAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, label: 'Basics', icon: Store },
    { num: 2, label: 'Branding', icon: Palette },
    { num: 3, label: 'Menu Setup', icon: UtensilsCrossed },
    { num: 4, label: 'Review', icon: Eye },
    { num: 5, label: 'Publish', icon: QrCode },
  ];

  // Constructed restaurant for previewing
  const previewRestaurant: Restaurant = restaurant || {
    id: 'temp',
    owner_profile_id: 'temp',
    agent_id: null,
    slug: 'my-restaurant',
    name: name || 'My Restaurant',
    food_type: foodType,
    status: 'draft',
    onboarding_source: 'self_serve',
    onboarding_current_step: step,
    onboarding_completed_at: null,
    onboarding_status: 'in_progress',
    archived_at: null,
    trial_ends_at: null,
    published_at: null,
    site_status: 'draft',
    subscription_end_date: null,
    branding,
    contact: { phone, whatsapp, email: null },
    address: { street, city, state, pincode, google_maps_url: googleMapsUrl },
    social_links: { instagram: null, facebook: null, google_review: null },
    theme,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const publicUrl = restaurant ? `/r/${restaurant.slug}` : '/r/preview';
  const qrCodeUrl = `/api/qr/${restaurant?.id || 'temp'}?format=png&size=512`;

  return (
    <div className="space-y-6">
      {/* 1. Focused Wizard Stepper Header */}
      <div className="apple-card rounded-3xl p-4 sm:p-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto relative">
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-stone-200/80 -z-0" />

          {stepsList.map((s) => {
            const Icon = s.icon;
            const isCurrent = step === s.num;
            const isCompleted = step > s.num;
            const canNavigate = restaurant && s.num < step;

            return (
              <button
                key={s.num}
                type="button"
                disabled={!canNavigate}
                onClick={() => canNavigate && setStep(s.num)}
                className={`flex flex-col items-center relative z-10 transition-transform ${
                  canNavigate ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isCurrent
                      ? 'bg-[#8B4A27] text-white ring-4 ring-[#8B4A27]/20 shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-stone-300 text-stone-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[11px] font-semibold mt-1.5 hidden sm:block ${
                    isCurrent ? 'text-stone-900' : 'text-stone-400'
                  }`}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: RESTAURANT BASICS */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="apple-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B4A27] bg-[#8B4A27]/10 px-3 py-1 rounded-full mb-2">
              <Store className="w-3.5 h-3.5" />
              <span>Step 1 of 5 • Basics</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
              Restaurant Identity &amp; Contact
            </h2>
            <p className="text-xs text-stone-500 mt-1 max-w-xl">
              Tell diners who you are, where you are located, and what kind of appetizing dishes you serve.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
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
                Food Type / Cuisine *
              </label>
              <input
                type="text"
                value={foodType}
                onChange={(e) => setFoodType(e.target.value)}
                placeholder="e.g. Pure Veg North Indian, Cafe &amp; Bakery"
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
                placeholder="e.g. Fresh flavors served with love"
                className="w-full text-xs sm:text-sm px-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4A27]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Primary Phone Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full text-xs sm:text-sm px-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4A27]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                WhatsApp Order Number
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+91 98765 43210 (optional)"
                className="w-full text-xs sm:text-sm px-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4A27]/20 transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Street Address
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Shop 12, Main Street, Near Clock Tower"
                className="w-full text-xs sm:text-sm px-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4A27]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                City / Town *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Pune"
                className="w-full text-xs sm:text-sm px-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4A27]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Google Maps Location URL
              </label>
              <input
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/?q=..."
                className="w-full text-xs sm:text-sm px-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4A27]/20 transition-all"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end border-t border-stone-100">
            <button
              onClick={handleStep1Submit}
              disabled={loading}
              className="px-6 py-3 bg-[#8B4A27] hover:bg-[#743c1e] text-white text-xs font-semibold rounded-2xl shadow-xs transition-all apple-press disabled:opacity-60 inline-flex items-center gap-1.5 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Saving...' : 'Continue to Branding'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: BRANDING & THEME */}
      {/* ========================================================================= */}
      {step === 2 && restaurant && (
        <div className="apple-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B4A27] bg-[#8B4A27]/10 px-3 py-1 rounded-full mb-2">
              <Palette className="w-3.5 h-3.5" />
              <span>Step 2 of 5 • Branding &amp; Visual Style</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
              Upload Logo, Header Media &amp; Choose Theme
            </h2>
            <p className="text-xs text-stone-500 mt-1 max-w-xl">
              Give your digital QR menu an inviting atmosphere that matches your dining room ambiance.
            </p>
          </div>

          <div className="space-y-6">
            {/* Logo */}
            <MediaUploader
              restaurantId={restaurant.id}
              purpose="logo"
              currentUrl={branding.logo_url}
              onUploadSuccess={(url) => setBranding({ ...branding, logo_url: url })}
              label="Restaurant Brand Logo (PNG / WEBP)"
              accept="image/png,image/jpeg,image/webp"
              maxSizeMb={5}
            />

            {/* Media Type Toggle */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-2">
                Hero Header Media Type
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => setBranding({ ...branding, hero_media_type: 'image' })}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-semibold transition-all apple-press cursor-pointer ${
                    branding.hero_media_type === 'image'
                      ? 'border-[#8B4A27] bg-[#8B4A27]/10 text-[#8B4A27]'
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
                      ? 'border-[#8B4A27] bg-[#8B4A27]/10 text-[#8B4A27]'
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
                restaurantId={restaurant.id}
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
                  restaurantId={restaurant.id}
                  purpose="hero"
                  currentUrl={branding.hero_media_url}
                  onUploadSuccess={(url) => setBranding({ ...branding, hero_media_url: url })}
                  label="Hero Video (MP4 / WebM, max 50MB)"
                  accept="video/mp4,video/webm"
                  maxSizeMb={50}
                />
                <MediaUploader
                  restaurantId={restaurant.id}
                  purpose="poster"
                  currentUrl={branding.hero_poster_url}
                  onUploadSuccess={(url) => setBranding({ ...branding, hero_poster_url: url })}
                  label="Poster Image for Video * (Displayed before video plays)"
                  accept="image/jpeg,image/png,image/webp"
                  maxSizeMb={5}
                />
              </div>
            )}

            {/* Theme Customizer */}
            <div className="pt-4 border-t border-stone-100">
              <label className="block text-xs font-semibold text-stone-800 mb-3">
                Select Color Palette &amp; Card Presentation Style
              </label>
              <ThemeCustomizer theme={theme} onChange={(t) => setTheme(t)} />
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
              onClick={handleStep2Submit}
              disabled={loading}
              className="px-6 py-2.5 bg-[#8B4A27] hover:bg-[#743c1e] text-white text-xs font-semibold rounded-2xl shadow-xs transition-all apple-press inline-flex items-center gap-1.5 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Continue to Menu Setup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: MENU SETUP */}
      {/* ========================================================================= */}
      {step === 3 && restaurant && (
        <div className="apple-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B4A27] bg-[#8B4A27]/10 px-3 py-1 rounded-full mb-2">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Step 3 of 5 • Menu Setup</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
                Add Categories &amp; Dishes
              </h2>
              <p className="text-xs text-stone-500 mt-1 max-w-xl">
                Add at least one category and one dish to launch. You can add more dishes or use AI OCR import anytime.
              </p>
            </div>

            {/* Optional AI Import link */}
            <Link
              href="/owner/menu/ai-import"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-all self-start sm:self-center"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Import Menu from Photo/PDF</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Left: Add Category & Dish Forms */}
            <div className="space-y-6">
              {/* Category Form */}
              <form onSubmit={handleCreateCategory} className="p-4 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-3">
                <h3 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#8B4A27]" />
                  <span>1. Add a Category</span>
                </h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Starters, Main Course, Shakes"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#8B4A27]/20"
                  />
                  <input
                    type="text"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="Short description (optional)"
                    className="w-full text-xs px-3.5 py-2 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#8B4A27]/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingCategory || !newCatName.trim()}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                >
                  {addingCategory && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Add Category</span>
                </button>
              </form>

              {/* Item Form */}
              <form onSubmit={handleCreateItem} className="p-4 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-3">
                <h3 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#8B4A27]" />
                  <span>2. Add a Dish Item</span>
                </h3>
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                      className="text-xs px-3 py-2 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#8B4A27]/20"
                    >
                      {categories.length === 0 && <option value="">Add a category first</option>}
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-xl">
                      <label className="text-xs text-stone-700 flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newItemIsVeg}
                          onChange={(e) => setNewItemIsVeg(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-[11px] font-semibold">{newItemIsVeg ? '🟢 Veg' : '🔴 Non-Veg'}</span>
                      </label>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Dish Name (e.g. Paneer Butter Masala)"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#8B4A27]/20"
                  />

                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-stone-400">₹</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      placeholder="Price in Rupees (e.g. 240)"
                      className="w-full text-xs pl-7 pr-3.5 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#8B4A27]/20"
                    />
                  </div>

                  <input
                    type="text"
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    placeholder="Description (e.g. Creamy tomato gravy with fresh paneer)"
                    className="w-full text-xs px-3.5 py-2 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#8B4A27]/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addingItem || categories.length === 0 || !newItemName.trim() || !newItemPrice}
                  className="px-4 py-2 bg-[#8B4A27] hover:bg-[#743c1e] text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                >
                  {addingItem && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Add Dish to Menu</span>
                </button>
              </form>
            </div>

            {/* Right: Current Menu Summary */}
            <div className="p-5 bg-white rounded-2xl border border-stone-200/80 flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-sm font-bold text-stone-900 mb-3 flex items-center justify-between">
                  <span>Current Menu Summary</span>
                  <span className="text-[11px] font-sans font-semibold bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full">
                    {categories.length} Categories • {items.length} Dishes
                  </span>
                </h3>

                {categories.length === 0 ? (
                  <div className="text-center py-8 text-stone-400 text-xs">
                    No categories created yet. Add your first category on the left.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {categories.map((cat) => {
                      const catItems = items.filter((i) => i.category_id === cat.id);
                      return (
                        <div key={cat.id} className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                          <div className="flex items-center justify-between font-semibold text-xs text-stone-800">
                            <span>{cat.name}</span>
                            <span className="text-[10px] text-stone-500">{catItems.length} items</span>
                          </div>
                          {catItems.length > 0 && (
                            <ul className="mt-1.5 space-y-1">
                              {catItems.map((itm) => (
                                <li key={itm.id} className="text-[11px] text-stone-600 flex items-center justify-between">
                                  <span>• {itm.name}</span>
                                  <span className="font-medium text-stone-900">
                                    ₹{itm.price_paise ? itm.price_paise / 100 : 0}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {categories.length > 0 && items.length > 0 && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ready! You have added enough items to publish your menu.</span>
                </div>
              )}
            </div>
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
              onClick={handleStep3Submit}
              disabled={loading || categories.length === 0 || items.length === 0}
              className="px-6 py-2.5 bg-[#8B4A27] hover:bg-[#743c1e] text-white text-xs font-semibold rounded-2xl shadow-xs transition-all apple-press disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Continue to Review</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: REVIEW & LIVE PREVIEW */}
      {/* ========================================================================= */}
      {step === 4 && restaurant && (
        <div className="space-y-6">
          <div className="apple-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B4A27] bg-[#8B4A27]/10 px-3 py-1 rounded-full mb-2">
                <Eye className="w-3.5 h-3.5" />
                <span>Step 4 of 5 • Review &amp; Live Mobile Preview</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
                Review Your Restaurant &amp; Menu
              </h2>
              <p className="text-xs text-stone-500 mt-1 max-w-xl">
                Check all information before publishing. Guests will see this exact design upon scanning your QR code.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-all"
              >
                Edit Basics
              </button>
              <button
                onClick={() => setStep(2)}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-all"
              >
                Edit Branding
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-all"
              >
                Edit Dishes
              </button>
            </div>
          </div>

          {/* Embedded Customer Menu Container with Apple Device Framing */}
          <div className="border border-black/[0.08] rounded-3xl overflow-hidden shadow-2xl bg-white max-w-md mx-auto">
            <PublicMenu
              restaurant={previewRestaurant}
              categories={categories}
              items={items}
            />
          </div>

          <div className="apple-card rounded-3xl p-4 flex justify-between">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl apple-press transition-all inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={handleStep4Submit}
              disabled={loading}
              className="px-6 py-2.5 bg-[#8B4A27] hover:bg-[#743c1e] text-white text-xs font-semibold rounded-2xl shadow-xs transition-all apple-press inline-flex items-center gap-1.5 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Ready to Publish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: PUBLISH & QR LAUNCH */}
      {/* ========================================================================= */}
      {step === 5 && restaurant && (
        <div className="apple-card rounded-3xl p-6 sm:p-8 space-y-6">
          {!publishedData ? (
            <div className="max-w-xl mx-auto text-center space-y-5 py-4">
              <div className="w-16 h-16 bg-[#8B4A27]/10 text-[#8B4A27] rounded-3xl flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-stone-900 tracking-tight">
                Launch Your Restaurant Menu
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Publishing starts your <strong>24-Hour Free Trial</strong> with full access to QR codes, unlimited dish updates, and custom branding.
              </p>

              <div className="pt-2">
                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#8B4A27] hover:bg-[#743c1e] text-white text-sm font-bold rounded-2xl shadow-md transition-all apple-press disabled:opacity-60 inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Publishing Your Menu...' : 'Publish & Start 24-Hour Trial →'}</span>
                </button>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setStep(4)}
                  className="text-xs text-stone-500 hover:text-stone-800 underline"
                >
                  ← Go back to preview
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="font-serif text-3xl font-bold text-stone-900 tracking-tight">
                  Congratulations! Your Menu is Live
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-1">
                  Your 24-hour full-access trial has started. Diners can now scan your QR code or visit your link directly.
                </p>
              </div>

              {/* Public URL Box */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 text-left">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-stone-400">Public Menu Link</p>
                  <p className="text-xs font-mono font-semibold text-stone-900 truncate">
                    {publicUrl}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}${publicUrl}`);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }
                    }}
                    className="p-2 bg-white border border-stone-200 rounded-xl text-stone-700 hover:bg-stone-100 transition-all text-xs flex items-center gap-1 cursor-pointer"
                    title="Copy Link"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>

                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-[#8B4A27] text-white rounded-xl text-xs hover:bg-[#723b1f] transition-all flex items-center gap-1"
                  >
                    <span>Visit</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Primary Dashboard Redirect */}
              <div className="pt-2">
                <button
                  onClick={() => router.push('/owner')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold rounded-2xl shadow-md transition-all apple-press inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Go to Management Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
