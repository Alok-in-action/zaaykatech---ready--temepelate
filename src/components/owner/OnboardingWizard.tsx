'use client';

import React, { useState, useEffect, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  createRestaurant,
  saveOnboardingStepAction,
  publishRestaurantAction,
  getOwnerMenuData,
} from '@/actions/restaurant';
import { createCategory } from '@/actions/category';
import { createMenuItem } from '@/actions/item';
import { MediaUploader } from './MediaUploader';
import { ONBOARDING_I18N, OnboardingStrings } from '@/lib/i18n/onboarding';
import { PREDEFINED_THEMES } from '@/lib/themes/predefinedThemes';
import { THEME_CARD_STYLES } from './ThemeCustomizer';

export const ONBOARDING_THEME_PRESETS = PREDEFINED_THEMES.map((t) => ({
  id: t.id,
  name: t.name,
  desc: t.description,
  primary: t.colors.primary,
  accent: t.colors.accent,
  bg: t.colors.background,
  cardStyle: THEME_CARD_STYLES[t.id] || 'warm_editorial',
}));

const QRCodeGenerator = dynamic(
  () => import('./QRCodeGenerator').then((mod) => mod.QRCodeGenerator),
  {
    loading: () => (
      <div className="w-full h-48 flex flex-col items-center justify-center bg-stone-50 rounded-2xl animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin text-[#8B4A27]" />
        <span className="text-xs text-stone-500 mt-2 font-medium">Generating QR code...</span>
      </div>
    ),
    ssr: false,
  }
);
import {
  SubStepId,
  SUB_STEPS,
  stepNumberToSubStep,
  subStepToStepNumber,
  getSubStepConfig,
  getNextSubStep,
  getPreviousSubStep,
  isValidIndianPhone,
} from '@/lib/onboarding-substeps';
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
  Check,
  Loader2,
  Sparkles,
  Store,
  Phone,
  MapPin,
  Palette,
  Eye,
  UtensilsCrossed,
  Leaf,
  Coffee,
  Cake,
  MoreHorizontal,
  Plus,
  Camera,
  ExternalLink,
  Copy,
  Download,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Edit2,
  FileSpreadsheet,
} from 'lucide-react';

interface OnboardingWizardProps {
  initialRestaurant: Restaurant | null;
  initialStep: number;
  initialCategories: MenuCategory[];
  initialItems: MenuItem[];
  isFreshPublish?: boolean;
  onCreateRestaurant?: (input: { name: string; onboarding_current_step: number }) => Promise<{ success: boolean; restaurant?: Restaurant; error?: string }>;
  onSaveStep?: (restaurantId: string, step: number, data: any) => Promise<{ success: boolean; error?: string }>;
}

export function OnboardingWizard({
  initialRestaurant,
  initialStep = 1,
  initialCategories = [],
  initialItems = [],
  isFreshPublish = false,
  onCreateRestaurant,
  onSaveStep,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Strings dictionary (English default, Hindi ready)
  const t: OnboardingStrings = ONBOARDING_I18N.en;

  // Derive initial sub-step from integer initialStep (composite or legacy)
  let initialSubStepId: SubStepId = isFreshPublish
    ? '5b'
    : stepNumberToSubStep(initialRestaurant?.onboarding_current_step || initialStep);

  // If minimum valid menu requirement is already satisfied (>= 1 category and >= 1 item),
  // resume at Review ('4a') instead of asking for a first category or dish.
  if (!isFreshPublish && initialCategories.length >= 1 && initialItems.length >= 1) {
    if (initialSubStepId === '3a' || initialSubStepId === '3b' || initialSubStepId === '3c') {
      initialSubStepId = '4a';
    }
  }

  const [subStep, setSubStep] = useState<SubStepId>(initialSubStepId);
  const [returnToReview, setReturnToReview] = useState<boolean>(false);

  // Entities state
  const [restaurant, setRestaurant] = useState<Restaurant | null>(initialRestaurant);
  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories);
  const [items, setItems] = useState<MenuItem[]>(initialItems);

  // Status feedback
  const [saving, setSaving] = useState(false);
  const [showSavedTick, setShowSavedTick] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showManualMenuSetup, setShowManualMenuSetup] = useState(false);

  // --- Step 1 state ---
  const [name, setName] = useState(initialRestaurant?.name || '');
  const [foodType, setFoodType] = useState(initialRestaurant?.food_type || '');
  const [otherFoodType, setOtherFoodType] = useState('');
  const [phone, setPhone] = useState(initialRestaurant?.contact?.phone || '');
  const [city, setCity] = useState(initialRestaurant?.address?.city || '');

  // Pre-fill selected cuisine option
  const isPresetFoodType = ['Pure Veg', 'Veg & Non-Veg', 'Cafe', 'Sweets', 'Bakery'].includes(
    initialRestaurant?.food_type || ''
  );
  const [selectedFoodTypeOption, setSelectedFoodTypeOption] = useState<string>(
    isPresetFoodType
      ? initialRestaurant?.food_type || ''
      : initialRestaurant?.food_type
      ? 'Other'
      : ''
  );

  useEffect(() => {
    if (selectedFoodTypeOption === 'Other' && !otherFoodType && initialRestaurant?.food_type) {
      setOtherFoodType(initialRestaurant.food_type);
    }
  }, [selectedFoodTypeOption, otherFoodType, initialRestaurant?.food_type]);

  // --- Step 2 state (Look & Style) ---
  const [logoUrl, setLogoUrl] = useState<string | null>(
    initialRestaurant?.branding?.logo_url || null
  );
  const [coverUrl, setCoverUrl] = useState<string | null>(
    initialRestaurant?.branding?.hero_media_url || null
  );

  const defaultTheme: RestaurantTheme = {
    theme_id: 'cappuccino',
    primary_color: '#914C2B',
    accent_color: '#B86B3D',
    background_color: '#F5EBDD',
    card_style: 'warm_editorial',
  };

  const [theme, setTheme] = useState<RestaurantTheme>(initialRestaurant?.theme || defaultTheme);

  // --- Step 3 state (Menu) ---
  const [categoryName, setCategoryName] = useState('');
  const [dishName, setDishName] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id || ''
  );
  const [dishSuccessMessage, setDishSuccessMessage] = useState<string | null>(null);

  // Active sub-step metadata
  const currentConfig = getSubStepConfig(subStep);
  const mainStep = currentConfig.mainStep;
  const subIndex = currentConfig.subStepIndex;
  const totalSub = currentConfig.totalSubSteps;

  // Flash saved tick for 2.5 seconds
  const flashSavedTick = () => {
    setShowSavedTick(true);
    setTimeout(() => {
      setShowSavedTick(false);
    }, 2500);
  };

  // -------------------------------------------------------------
  // Navigation & Saving Helpers
  // -------------------------------------------------------------
  const advanceToSubStep = async (nextStep: SubStepId, stepCode: number, autoSaveData?: Record<string, unknown>) => {
    setError(null);
    if (returnToReview) {
      // If we jumped back from step 4 review, return directly to review
      setSubStep('4a');
      setReturnToReview(false);
      return;
    }

    // Advance UI immediately for instant, snappy feel (0ms screen lag)
    setSubStep(nextStep);

    if (restaurant && autoSaveData) {
      setSaving(true);
      const saveFn = onSaveStep || saveOnboardingStepAction;
      saveFn(restaurant.id, stepCode, autoSaveData)
        .then((res) => {
          if (!res.success) {
            setError(res.error || 'Failed to save progress.');
          } else {
            flashSavedTick();
          }
        })
        .catch((err: unknown) => {
          console.error('Auto-save error:', err);
        })
        .finally(() => {
          setSaving(false);
        });
    }
  };

  // Back button handler
  const handleBack = () => {
    setError(null);
    if (returnToReview) {
      setSubStep('4a');
      setReturnToReview(false);
      return;
    }

    const prev = getPreviousSubStep(subStep);
    if (prev) {
      setSubStep(prev);
    }
  };

  // Jump from Review to a specific sub-step
  const handleJumpToEdit = (targetStep: SubStepId) => {
    setReturnToReview(true);
    setSubStep(targetStep);
  };

  // -------------------------------------------------------------
  // Step 1 Sub-step Submissions
  // -------------------------------------------------------------
  // 1a: Restaurant Name
  const handleStep1aContinue = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError(t.step1.name.errorRequired);
      return;
    }
    setError(null);

    if (!restaurant) {
      setLoading(true);
      try {
        const createFn = onCreateRestaurant || createRestaurant;
        const res = await createFn({
          name: trimmed,
          onboarding_current_step: 12, // Move to 1b
        });
        if (!res.success || !res.restaurant) {
          setError(res.error || 'Failed to create restaurant. Please try again.');
          return;
        }
        setRestaurant(res.restaurant);
        flashSavedTick();
        setSubStep('1b');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    } else {
      await advanceToSubStep('1b', 12, { name: trimmed });
    }
  };

  // 1b: Food Type
  const handleStep1bContinue = async () => {
    const effectiveFoodType =
      selectedFoodTypeOption === 'Other'
        ? otherFoodType.trim()
        : selectedFoodTypeOption.trim();

    if (!effectiveFoodType) {
      setError(t.step1.foodType.errorRequired);
      return;
    }
    setError(null);
    setFoodType(effectiveFoodType);
    await advanceToSubStep('1c', 13, { food_type: effectiveFoodType });
  };

  // 1c: Phone Number
  const handleStep1cContinue = async () => {
    const trimmed = phone.trim();
    if (!isValidIndianPhone(trimmed)) {
      setError(t.step1.phone.errorInvalid);
      return;
    }
    setError(null);
    await advanceToSubStep('1d', 14, {
      contact: {
        ...(restaurant?.contact || {}),
        phone: trimmed,
      },
    });
  };

  // 1d: City
  const handleStep1dContinue = async () => {
    const trimmed = city.trim();
    if (!trimmed) {
      setError(t.step1.city.errorRequired);
      return;
    }
    setError(null);
    await advanceToSubStep('2a', 21, {
      address: {
        ...(restaurant?.address || {}),
        city: trimmed,
      },
    });
  };

  // -------------------------------------------------------------
  // Step 2 Sub-step Submissions (Look & Style - all skippable)
  // -------------------------------------------------------------
  // 2a: Logo
  const handleStep2aContinue = async () => {
    await advanceToSubStep('2b', 22, {
      branding: {
        ...(restaurant?.branding || {}),
        logo_url: logoUrl,
      },
    });
  };

  // 2b: Preset Style Selection
  const handlePresetSelect = (presetId: string) => {
    const selected = ONBOARDING_THEME_PRESETS.find((p) => p.id === presetId);
    if (!selected) return;

    const newTheme: RestaurantTheme = {
      theme_id: selected.id,
      primary_color: selected.primary,
      accent_color: selected.accent,
      background_color: selected.bg,
      card_style: selected.cardStyle,
    };
    setTheme(newTheme);
  };

  const handleStep2bContinue = async () => {
    await advanceToSubStep('2c', 23, { theme });
  };

  // 2c: Cover Photo
  const handleStep2cContinue = async () => {
    await advanceToSubStep('3a', 31, {
      branding: {
        ...(restaurant?.branding || {}),
        logo_url: logoUrl,
        hero_media_url: coverUrl,
        hero_media_type: 'image',
      },
    });
  };

  // -------------------------------------------------------------
  // Step 3 Sub-step Submissions (Menu)
  // -------------------------------------------------------------
  // 3a: First Category
  const handleStep3aContinue = async () => {
    const trimmed = categoryName.trim();
    if (!trimmed && categories.length === 0) {
      setError(t.step3.category.errorRequired);
      return;
    }
    setError(null);

      if (trimmed && restaurant) {
        setLoading(true);
        try {
          const catRes = await createCategory(restaurant.id, {
            name: trimmed,
          });
          if (catRes.success && catRes.category) {
            const updatedCategories = [...categories, catRes.category];
            setCategories(updatedCategories);
            setSelectedCategoryId(catRes.category.id);
            flashSavedTick();
          }
        } catch (err: unknown) {
          console.error('Failed to create category:', err);
        } finally {
          setLoading(false);
        }
      }

      await advanceToSubStep('3b', 32);
    };

    // 3b: First Dish
    const handleStep3bContinue = async () => {
      const trimmedDish = dishName.trim();
      const parsedPrice = parseFloat(dishPrice);

      if (!trimmedDish) {
        setError(t.step3.dish.errorName);
        return;
      }
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        setError(t.step3.dish.errorPrice);
        return;
      }

      if (!restaurant) return;

      // Ensure we have a category
      let targetCatId = selectedCategoryId;
      if (!targetCatId) {
        if (categories.length > 0) {
          targetCatId = categories[0].id;
        } else {
          const fallbackCat = await createCategory(restaurant.id, {
            name: 'Main Course',
          });
          if (fallbackCat.success && fallbackCat.category) {
            targetCatId = fallbackCat.category.id;
            setCategories([fallbackCat.category]);
          }
        }
      }

      setLoading(true);
      try {
        const itemRes = await createMenuItem(restaurant.id, {
          name: trimmedDish,
          categoryId: targetCatId,
          pricingMode: 'single',
          price_paise: Math.round(parsedPrice * 100),
        });

        if (!itemRes.success || !itemRes.item) {
          setError(itemRes.error || 'Failed to add dish.');
          return;
        }

        setItems((prev) => [...prev, itemRes.item]);
        setDishSuccessMessage(t.step3.dish.dishAddedSuccess);
        setDishName('');
        setDishPrice('');
        flashSavedTick();

      // Refresh menu data
      const menuData = await getOwnerMenuData(restaurant.id);
      if (menuData.success) {
        setCategories(menuData.categories);
        setItems(menuData.items);
      }

      await advanceToSubStep('3c', 33);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add dish.');
    } finally {
      setLoading(false);
    }
  };

  // 3c: Add More / OCR / Check requirement
  const handleStep3cProceed = async () => {
    setError(null);
    if (categories.length === 0 || items.length === 0) {
      setError(t.step3.more.requirementWarning);
      return;
    }
    await advanceToSubStep('4a', 41);
  };

  // -------------------------------------------------------------
  // Step 4: Check & Review
  // -------------------------------------------------------------
  const handleStep4Continue = async () => {
    if (categories.length === 0 || items.length === 0) {
      setError(t.step3.more.requirementWarning);
      return;
    }
    await advanceToSubStep('5a', 51);
  };

  // -------------------------------------------------------------
  // Step 5: Go Live
  // -------------------------------------------------------------
  const handlePublish = async () => {
    if (!restaurant) return;
    setLoading(true);
    setError(null);

    try {
      const res = await publishRestaurantAction(restaurant.id);
      if (!res.success) {
        setError(res.error || 'Failed to publish menu.');
        return;
      }
      setRestaurant((prev) =>
        prev
          ? {
              ...prev,
              status: 'published',
              site_status: 'trialing',
              published_at: res.publishedAt,
              trial_ends_at: res.trialEndsAt,
              onboarding_status: 'completed',
            }
          : null
      );
      setSubStep('5b');
      flashSavedTick();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to go live.');
    } finally {
      setLoading(false);
    }
  };

  const publicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/r/${restaurant?.slug}`
      : `https://zaaykatech.com/r/${restaurant?.slug || ''}`;

  const copyMenuLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Compute overall progress percentage (13 total granular sub-steps)
  const currentSubStepIndex = SUB_STEPS.findIndex((s) => s.id === subStep);
  const progressPercent = Math.round(
    ((currentSubStepIndex + 1) / SUB_STEPS.length) * 100
  );

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-3 flex flex-col min-h-[100dvh] justify-between overflow-x-hidden">
      {/* ---------------- Top Bar: Step Indicator & Saved Tick ---------------- */}
      <div className="w-full mb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs sm:text-sm font-semibold tracking-wide text-stone-600">
            {t.header.stepFormat(mainStep, subIndex, totalSub)}
          </span>

          <div className="flex items-center gap-2">
            {saving && (
              <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t.header.saving}
              </span>
            )}
            {showSavedTick && !saving && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full transition-all">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                {t.header.saved}
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-neutral-200/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-neutral-900 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ---------------- Main Question Content Area ---------------- */}
      <div className="flex-1 flex flex-col justify-center my-auto py-2">
        {/* ================= STEP 1: ABOUT YOU ================= */}
        {subStep === '1a' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-11 h-11 rounded-2xl bg-amber-100/90 border border-amber-300/70 text-[#8B4A27] flex items-center justify-center shadow-xs">
                  <Store className="w-5 h-5 animate-pulse" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
                  Restaurant Basics
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                {t.step1.name.question}
              </h1>
              <p className="text-base text-stone-600 mt-2">
                {t.step1.name.helper}
              </p>
            </div>

            <div className="pt-2">
              <label htmlFor="restaurant-name" className="block text-sm font-semibold text-stone-800 mb-1.5">
                Restaurant Name
              </label>
              <input
                id="restaurant-name"
                type="text"
                autoComplete="organization"
                enterKeyHint="next"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                placeholder={t.step1.name.placeholder}
                className="w-full min-h-[56px] h-14 text-base sm:text-lg px-4 bg-white border-2 border-stone-300 rounded-2xl focus:outline-hidden focus:border-[#8B4A27] transition-colors"
                autoFocus
              />
              <p className="text-sm text-stone-500 mt-1.5">{t.step1.name.example}</p>
            </div>
          </div>
        )}

        {subStep === '1b' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100/90 border border-emerald-300/70 text-emerald-800 flex items-center justify-center shadow-xs">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
                  Food &amp; Dining
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                {t.step1.foodType.question}
              </h1>
              <p className="text-base text-stone-600 mt-2">
                {t.step1.foodType.helper}
              </p>
            </div>

            <div className="pt-1">
              <span className="block text-sm font-semibold text-stone-800 mb-2">
                Choose food type
              </span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    key: 'Pure Veg',
                    label: t.step1.foodType.options.veg.label,
                    desc: t.step1.foodType.options.veg.desc,
                    icon: Leaf,
                    iconColor: 'text-emerald-700',
                  },
                  {
                    key: 'Veg & Non-Veg',
                    label: t.step1.foodType.options.nonveg.label,
                    desc: t.step1.foodType.options.nonveg.desc,
                    icon: UtensilsCrossed,
                    iconColor: 'text-amber-700',
                  },
                  {
                    key: 'Cafe',
                    label: t.step1.foodType.options.cafe.label,
                    desc: t.step1.foodType.options.cafe.desc,
                    icon: Coffee,
                    iconColor: 'text-amber-800',
                  },
                  {
                    key: 'Sweets',
                    label: t.step1.foodType.options.sweets.label,
                    desc: t.step1.foodType.options.sweets.desc,
                    icon: Sparkles,
                    iconColor: 'text-orange-600',
                  },
                  {
                    key: 'Bakery',
                    label: t.step1.foodType.options.bakery.label,
                    desc: t.step1.foodType.options.bakery.desc,
                    icon: Cake,
                    iconColor: 'text-rose-700',
                  },
                  {
                    key: 'Other',
                    label: t.step1.foodType.options.other.label,
                    desc: t.step1.foodType.options.other.desc,
                    icon: MoreHorizontal,
                    iconColor: 'text-stone-700',
                  },
                ].map((opt) => {
                  const isSelected = selectedFoodTypeOption === opt.key;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setSelectedFoodTypeOption(opt.key);
                        setError(null);
                      }}
                      className={`min-h-[56px] p-3.5 rounded-2xl border-2 text-left transition-all active:scale-[0.97] touch-manipulation flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#8B4A27] bg-[#8B4A27]/5 shadow-xs'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon className={`w-5 h-5 ${opt.iconColor}`} />
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#8B4A27] text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <div className="font-semibold text-base text-stone-900">{opt.label}</div>
                        <div className="text-xs text-stone-500 mt-0.5 line-clamp-1">{opt.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedFoodTypeOption === 'Other' && (
              <div className="pt-2 animate-in fade-in">
                <label htmlFor="other-cuisine" className="block text-sm font-semibold text-stone-800 mb-1.5">
                  Describe your food
                </label>
                <input
                  id="other-cuisine"
                  type="text"
                  enterKeyHint="next"
                  value={otherFoodType}
                  onChange={(e) => setOtherFoodType(e.target.value)}
                  onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  placeholder={t.step1.foodType.otherPlaceholder}
                  className="w-full min-h-[56px] h-14 text-base sm:text-lg px-4 bg-white border-2 border-stone-300 rounded-2xl focus:outline-hidden focus:border-[#8B4A27]"
                  autoFocus
                />
              </div>
            )}
          </div>
        )}

        {subStep === '1c' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-11 h-11 rounded-2xl bg-blue-100/90 border border-blue-300/70 text-blue-800 flex items-center justify-center shadow-xs relative">
                  <Phone className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/80">
                  Customer Phone
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                {t.step1.phone.question}
              </h1>
              <p className="text-base text-stone-600 mt-2">
                {t.step1.phone.helper}
              </p>
            </div>

            <div className="pt-2">
              <label htmlFor="phone-number" className="block text-sm font-semibold text-stone-800 mb-1.5">
                Mobile Phone Number
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-base font-semibold text-stone-500">
                  +91
                </span>
                <input
                  id="phone-number"
                  type="tel"
                  autoComplete="tel"
                  inputMode="numeric"
                  enterKeyHint="next"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  placeholder={t.step1.phone.placeholder}
                  className="w-full min-h-[56px] h-14 text-base sm:text-lg pl-14 pr-4 bg-white border-2 border-stone-300 rounded-2xl focus:outline-hidden focus:border-[#8B4A27] transition-colors"
                  autoFocus
                />
              </div>
              <p className="text-sm text-stone-500 mt-1.5">{t.step1.phone.example}</p>
            </div>
          </div>
        )}

        {subStep === '1d' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-11 h-11 rounded-2xl bg-rose-100/90 border border-rose-300/70 text-rose-800 flex items-center justify-center shadow-xs">
                  <MapPin className="w-5 h-5 animate-pulse" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-900 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/80">
                  City &amp; Location
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                {t.step1.city.question}
              </h1>
              <p className="text-base text-stone-600 mt-2">
                {t.step1.city.helper}
              </p>
            </div>

            <div className="pt-2">
              <label htmlFor="restaurant-city" className="block text-sm font-semibold text-stone-800 mb-1.5">
                City Location
              </label>
              <input
                id="restaurant-city"
                type="text"
                autoComplete="address-level2"
                enterKeyHint="done"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                placeholder={t.step1.city.placeholder}
                className="w-full min-h-[56px] h-14 text-base sm:text-lg px-4 bg-white border-2 border-stone-300 rounded-2xl focus:outline-hidden focus:border-[#8B4A27] transition-colors"
                autoFocus
              />
              <p className="text-sm text-stone-500 mt-1.5">{t.step1.city.example}</p>
            </div>
          </div>
        )}

        {/* ================= STEP 2: LOOK (ALL SKIPPABLE) ================= */}
        {subStep === '2a' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-11 h-11 rounded-2xl bg-purple-100/90 border border-purple-300/70 text-purple-800 flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200/80">
                  Logo &amp; Brand
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                {t.step2.logo.question}
              </h1>
              <p className="text-base text-stone-600 mt-2">
                {t.step2.logo.helper}
              </p>
            </div>

            <div className="pt-2">
              {restaurant && (
                <MediaUploader
                  restaurantId={restaurant.id}
                  purpose="logo"
                  currentUrl={logoUrl}
                  onUploadSuccess={(url) => {
                    setLogoUrl(url);
                    flashSavedTick();
                  }}
                  label={t.step2.logo.uploadLabel}
                />
              )}
            </div>
          </div>
        )}

        {subStep === '2b' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-11 h-11 rounded-2xl bg-amber-100/90 border border-amber-300/70 text-amber-800 flex items-center justify-center shadow-xs">
                  <Palette className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
                  Visual Style (10 Curated Themes)
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                {t.step2.style.question}
              </h1>
              <p className="text-base text-stone-600 mt-2">
                {t.step2.style.helper}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-h-[460px] overflow-y-auto pr-1">
              {ONBOARDING_THEME_PRESETS.map((preset) => {
                const isSelected =
                  theme.theme_id === preset.id ||
                  (theme.primary_color?.toLowerCase() === preset.primary.toLowerCase() &&
                    theme.background_color?.toLowerCase() === preset.bg.toLowerCase());

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer relative ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/25 shadow-xs ring-1 ring-indigo-600/30'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 mb-2.5">
                      <span
                        className="w-5 h-5 rounded-full border border-black/10 shadow-xs shrink-0"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs shrink-0"
                        style={{ backgroundColor: preset.accent }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs shrink-0"
                        style={{ backgroundColor: preset.bg }}
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-sm sm:text-base text-stone-900">{preset.name}</div>
                      <div className="text-xs text-stone-500 mt-1 leading-snug">{preset.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {subStep === '2c' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-11 h-11 rounded-2xl bg-sky-100/90 border border-sky-300/70 text-sky-800 flex items-center justify-center shadow-xs">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-900 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200/80">
                  Cover Photo
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                {t.step2.cover.question}
              </h1>
              <p className="text-base text-stone-600 mt-2">
                {t.step2.cover.helper}
              </p>
            </div>

            <div className="pt-2">
              {restaurant && (
                <MediaUploader
                  restaurantId={restaurant.id}
                  purpose="hero"
                  currentUrl={coverUrl}
                  onUploadSuccess={(url) => {
                    setCoverUrl(url);
                    flashSavedTick();
                  }}
                  label={t.step2.cover.uploadLabel}
                />
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 3: MENU ================= */}
        {subStep === '3a' && !showManualMenuSetup && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-11 h-11 rounded-2xl bg-indigo-100/90 border border-indigo-300/70 text-indigo-700 flex items-center justify-center shadow-xs">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/80">
                  Step 3 · Menu Setup
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                How would you like to build your menu?
              </h1>
              <p className="text-base text-stone-600 mt-2">
                Choose the fastest way to get your items online. You can edit dishes, photos, and prices anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 pt-2">
              {/* Option 1: AI / OCR Import */}
              <Link
                href={`/owner/menu/ai-import?from=onboarding${restaurant ? `&restaurantId=${restaurant.id}` : ''}`}
                className="group p-5 bg-white border-2 border-stone-200 hover:border-indigo-600 rounded-3xl transition-all shadow-xs hover:shadow-md active:scale-[0.99] flex items-start gap-4 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-indigo-700 transition-colors">
                      Snap Photo or Upload PDF
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                      AI Instant OCR
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-relaxed">
                    Upload photos of your printed menu or PDF. Our AI automatically extracts categories, dish names, and prices in seconds.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all self-center shrink-0" />
              </Link>

              {/* Option 2: CSV Spreadsheet Import */}
              <Link
                href={`/owner/menu/ai-import?tab=csv&from=onboarding${restaurant ? `&restaurantId=${restaurant.id}` : ''}`}
                className="group p-5 bg-white border-2 border-stone-200 hover:border-indigo-600 rounded-3xl transition-all shadow-xs hover:shadow-md active:scale-[0.99] flex items-start gap-4 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-indigo-700 transition-colors">
                      Upload CSV Spreadsheet
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                      Bulk Upload
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-relaxed">
                    Have your menu in Excel or Google Sheets? Export to CSV and import your entire catalog at once.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all self-center shrink-0" />
              </Link>

              {/* Option 3: Manual Entry */}
              <button
                type="button"
                onClick={() => setShowManualMenuSetup(true)}
                className="group p-5 bg-white border-2 border-stone-200 hover:border-indigo-600 rounded-3xl transition-all shadow-xs hover:shadow-md active:scale-[0.99] flex items-start gap-4 text-left cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 text-stone-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Edit2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-indigo-700 transition-colors">
                      Enter Dishes Manually
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 shrink-0">
                      Step by Step
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-relaxed">
                    Add categories and dishes one by one. Ideal if you want to start with just your top 2 or 3 bestsellers.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all self-center shrink-0" />
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => advanceToSubStep('4a', 41)}
                className="text-xs font-semibold text-stone-500 hover:text-stone-800 hover:underline py-2 cursor-pointer"
              >
                Skip menu for now (setup later from dashboard) →
              </button>
            </div>
          </div>
        )}

        {subStep === '3a' && showManualMenuSetup && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-100/90 border border-indigo-300/70 text-indigo-700 flex items-center justify-center shadow-xs">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/80">
                    Menu Category
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualMenuSetup(false)}
                  className="text-xs font-semibold text-indigo-700 hover:underline cursor-pointer"
                >
                  ← All menu options
                </button>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                {t.step3.category.question}
              </h1>
              <p className="text-base text-stone-600 mt-2">
                {t.step3.category.helper}
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <div>
                <label htmlFor="category-name" className="block text-sm font-semibold text-stone-800 mb-1.5">
                  Category Name
                </label>
                <input
                  id="category-name"
                  type="text"
                  enterKeyHint="next"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  placeholder={t.step3.category.placeholder}
                  className="w-full min-h-[56px] h-14 text-base sm:text-lg px-4 bg-white border-2 border-stone-300 rounded-2xl focus:outline-hidden focus:border-[#4338CA]"
                  autoFocus
                />
              </div>

              {/* Suggestion Chips */}
              <div>
                <span className="text-xs font-semibold uppercase text-stone-500 tracking-wider">
                  Suggestions:
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {t.step3.category.chips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setCategoryName(chip)}
                      className="min-h-[44px] px-4 py-2 text-sm font-medium bg-white border border-stone-300 hover:border-indigo-600 hover:bg-indigo-50 text-stone-800 rounded-full transition-all active:scale-[0.97] touch-manipulation cursor-pointer"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {categories.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {categories.length} category added: {categories.map((c) => c.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {subStep === '3b' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-11 h-11 rounded-2xl bg-orange-100/90 border border-orange-300/70 text-orange-800 flex items-center justify-center shadow-xs">
                  <Cake className="w-5 h-5 animate-pulse" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-900 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200/80">
                  First Dish
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                {t.step3.dish.question}
              </h1>
              <p className="text-base text-stone-600 mt-2">
                {t.step3.dish.helper}
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <div>
                <label htmlFor="dish-name" className="block text-sm font-semibold text-stone-800 mb-1">
                  {t.step3.dish.nameLabel}
                </label>
                <input
                  id="dish-name"
                  type="text"
                  enterKeyHint="next"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  placeholder={t.step3.dish.namePlaceholder}
                  className="w-full min-h-[56px] h-14 text-base sm:text-lg px-4 bg-white border-2 border-stone-300 rounded-2xl focus:outline-hidden focus:border-[#8B4A27]"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="dish-price" className="block text-sm font-semibold text-stone-800 mb-1">
                  {t.step3.dish.priceLabel}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-base font-semibold text-stone-500">
                    ₹
                  </span>
                  <input
                    id="dish-price"
                    type="text"
                    inputMode="decimal"
                    enterKeyHint="done"
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    placeholder={t.step3.dish.pricePlaceholder}
                    className="w-full min-h-[56px] h-14 text-base sm:text-lg pl-9 pr-4 bg-white border-2 border-stone-300 rounded-2xl focus:outline-hidden focus:border-[#8B4A27]"
                  />
                </div>
              </div>

              {categories.length > 1 && (
                <div>
                  <label htmlFor="dish-category" className="block text-sm font-semibold text-stone-800 mb-1">
                    {t.step3.dish.categoryLabel}
                  </label>
                  <select
                    id="dish-category"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full min-h-[56px] h-14 text-base px-4 bg-white border-2 border-stone-300 rounded-2xl focus:outline-hidden focus:border-[#8B4A27]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {subStep === '3c' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100/90 border border-emerald-300/70 text-emerald-800 flex items-center justify-center shadow-xs">
                  <Check className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
                  Menu In Progress
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                {t.step3.more.question}
              </h1>
              <p className="text-base text-stone-600 mt-2">
                {t.step3.more.helper}
              </p>
            </div>

            {dishSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                {dishSuccessMessage}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setSubStep('3b')}
                className="w-full min-h-[56px] px-4 py-3 bg-white hover:bg-stone-50 border-2 border-stone-300 hover:border-[#8B4A27] text-stone-900 font-semibold text-base rounded-2xl transition-all active:scale-[0.97] touch-manipulation flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#8B4A27]" />
                  {t.step3.more.addAnotherDish}
                </span>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </button>

              <Link
                href={`/owner/menu/ai-import?from=onboarding${restaurant?.id ? `&restaurant_id=${restaurant.id}` : ''}`}
                className="w-full min-h-[56px] px-4 py-3 bg-white hover:bg-stone-50 border-2 border-stone-300 hover:border-[#8B4A27] text-stone-900 font-semibold text-base rounded-2xl transition-all active:scale-[0.97] touch-manipulation flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-700" />
                  {t.step3.more.photographMenu}
                </span>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </Link>

              <button
                type="button"
                onClick={handleStep3cProceed}
                className="w-full min-h-[56px] px-4 py-3 bg-[#8B4A27]/10 hover:bg-[#8B4A27]/20 border-2 border-[#8B4A27]/30 text-[#8B4A27] font-semibold text-base rounded-2xl transition-all active:scale-[0.97] touch-manipulation flex items-center justify-between cursor-pointer"
              >
                <span>{t.step3.more.doThisLater}</span>
                <ArrowRight className="w-4 h-4 text-[#8B4A27]" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: CHECK & REVIEW ================= */}
        {subStep === '4a' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-11 h-11 rounded-2xl bg-indigo-100/90 border border-indigo-300/70 text-indigo-800 flex items-center justify-center shadow-xs">
                  <Eye className="w-5 h-5 animate-pulse" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/80">
                  Live Preview
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                {t.step4.review.question}
              </h1>
              <p className="text-base text-stone-600 mt-2">
                {t.step4.review.helper}
              </p>
            </div>

            {/* Phone Mockup Frame */}
            <div className="pt-2">
              <div className="w-full max-w-[340px] mx-auto bg-white rounded-3xl border-4 border-stone-800 shadow-xl overflow-hidden text-stone-900">
                {/* Simulated Phone Top Bar */}
                <div className="bg-stone-800 text-white text-[11px] px-4 py-1.5 flex justify-between items-center font-mono">
                  <span>9:41</span>
                  <div className="w-16 h-3 bg-stone-700 rounded-full" />
                  <span>5G</span>
                </div>

                {/* Section 1: Header / Details */}
                <div className="p-4 border-b border-stone-100 bg-[#FAF8F5]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-serif text-lg font-bold text-stone-900">
                        {name || 'Restaurant Name'}
                      </h2>
                      <p className="text-xs text-stone-600 mt-0.5">
                        {foodType || 'Cuisine'} • {city || 'City'}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Tel: +91 {phone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleJumpToEdit('1a')}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8B4A27] hover:underline cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      {t.step4.review.editSection}
                    </button>
                  </div>
                </div>

                {/* Section 2: Look & Theme */}
                <div className="p-3 border-b border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-black/10"
                      style={{ backgroundColor: theme.primary_color }}
                    />
                    <span className="text-xs text-stone-600">
                      Theme:{' '}
                      <strong className="text-stone-800">
                        {ONBOARDING_THEME_PRESETS.find((p) => p.id === theme.theme_id)?.name ||
                          theme.card_style ||
                          'Cappuccino'}
                      </strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJumpToEdit('2b')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8B4A27] hover:underline cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    {t.step4.review.editSection}
                  </button>
                </div>

                {/* Section 3: Menu Categories & Dishes */}
                <div className="p-4 max-h-[200px] overflow-y-auto space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      {t.step4.review.categoriesCount(categories.length)} •{' '}
                      {t.step4.review.dishesCount(items.length)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleJumpToEdit('3b')}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8B4A27] hover:underline cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      {t.step4.review.editSection}
                    </button>
                  </div>

                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-1 text-sm border-b border-stone-50"
                    >
                      <span className="font-medium text-stone-800 truncate max-w-[180px]">
                        {item.name}
                      </span>
                      <span className="font-semibold text-stone-900">
                        ₹{item.price_paise ? Math.round(item.price_paise / 100) : 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: GO LIVE ================= */}
        {subStep === '5a' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5 animate-bounce" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Ready to Publish
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                {t.step5.ready.question}
              </h1>
              <p className="text-base text-stone-600 mt-2">
                {t.step5.ready.helper}
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-900 mt-4 leading-relaxed">
              <span className="font-bold block mb-1">24-Hour Free Trial</span>
              {t.step5.ready.notice}
            </div>
          </div>
        )}

        {subStep === '5b' && (
          <div className="space-y-5 animate-in fade-in duration-200 text-center">
            <div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-2">
                <Check className="w-6 h-6" />
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                {t.step5.live.question}
              </h1>
              <p className="text-sm text-stone-600 mt-1 max-w-md mx-auto">
                {t.step5.live.helper}
              </p>
            </div>

            {/* Table QR Code Card */}
            {restaurant && (
              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm max-w-sm mx-auto">
                <QRCodeGenerator
                  restaurantName={restaurant.name}
                  slug={restaurant.slug}
                  primaryColor={theme.primary_color}
                />
              </div>
            )}

            {/* Quick Share Links */}
            <div className="flex flex-col gap-2 max-w-sm mx-auto">
              <button
                type="button"
                onClick={copyMenuLink}
                className="w-full min-h-[50px] px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-900 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? t.step5.live.copied : t.step5.live.copyLink}
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  t.step5.live.whatsAppShareMessage(restaurant?.name || '', publicUrl)
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[50px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                {t.step5.live.shareWhatsApp}
              </a>

              <Link
                href="/owner"
                className="w-full min-h-[50px] px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs mt-2"
              >
                {t.step5.live.goToDashboard}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Error message beside/below field */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-800 flex items-center gap-2 mt-4">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* ---------------- Bottom Bar: Navigation Actions ---------------- */}
      {subStep !== '5b' && (
        <div
          className="w-full pt-3 bg-[#FAF8F5]/95 backdrop-blur-md sticky bottom-0 z-30 border-t border-neutral-200/80 mt-auto"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          <div className="flex flex-col gap-2">
            {/* Primary Action Button (at least 56px tall) */}
            {subStep === '1a' && (
              <button
                type="button"
                onClick={handleStep1aContinue}
                disabled={loading}
                className="w-full min-h-[56px] text-lg font-semibold bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] touch-manipulation text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.navigation.continue}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            )}

            {subStep === '1b' && (
              <button
                type="button"
                onClick={handleStep1bContinue}
                className="w-full min-h-[56px] text-lg font-semibold bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] touch-manipulation text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {t.navigation.continue}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            {subStep === '1c' && (
              <button
                type="button"
                onClick={handleStep1cContinue}
                className="w-full min-h-[56px] text-lg font-semibold bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] touch-manipulation text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {t.navigation.continue}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            {subStep === '1d' && (
              <button
                type="button"
                onClick={handleStep1dContinue}
                className="w-full min-h-[56px] text-lg font-semibold bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] touch-manipulation text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {t.navigation.continue}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            {subStep === '2a' && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleStep2aContinue}
                  className="w-full min-h-[56px] text-lg font-semibold bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] touch-manipulation text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {t.navigation.continue}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleStep2aContinue}
                  className="text-sm font-medium text-neutral-500 hover:text-neutral-800 active:scale-[0.98] touch-manipulation py-1 text-center cursor-pointer"
                >
                  {t.navigation.skip}
                </button>
              </div>
            )}

            {subStep === '2b' && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleStep2bContinue}
                  className="w-full min-h-[56px] text-lg font-semibold bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] touch-manipulation text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {t.navigation.continue}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleStep2bContinue}
                  className="text-sm font-medium text-neutral-500 hover:text-neutral-800 active:scale-[0.98] touch-manipulation py-1 text-center cursor-pointer"
                >
                  {t.navigation.skip}
                </button>
              </div>
            )}

            {subStep === '2c' && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleStep2cContinue}
                  className="w-full min-h-[56px] text-lg font-semibold bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] touch-manipulation text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {t.navigation.continue}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleStep2cContinue}
                  className="text-sm font-medium text-neutral-500 hover:text-neutral-800 active:scale-[0.98] touch-manipulation py-1 text-center cursor-pointer"
                >
                  {t.navigation.skip}
                </button>
              </div>
            )}

            {subStep === '3a' && showManualMenuSetup && (
              <button
                type="button"
                onClick={handleStep3aContinue}
                disabled={loading}
                className="w-full min-h-[56px] text-lg font-semibold bg-[#4338CA] hover:bg-[#3730A3] active:bg-[#312E81] touch-manipulation text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.navigation.continue}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            )}

            {subStep === '3b' && (
              <button
                type="button"
                onClick={handleStep3bContinue}
                disabled={loading}
                className="w-full min-h-[56px] text-lg font-semibold bg-[#4338CA] hover:bg-[#3730A3] active:bg-[#312E81] touch-manipulation text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Dish & Continue'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            )}

            {subStep === '3c' && (
              <div className="flex items-center justify-center py-1">
                {/* 3c has choice cards inside the body */}
              </div>
            )}

            {subStep === '4a' && (
              <button
                type="button"
                onClick={handleStep4Continue}
                className="w-full min-h-[56px] text-lg font-semibold bg-[#4338CA] hover:bg-[#3730A3] active:bg-[#312E81] touch-manipulation text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                {t.step4.review.continueToGoLive}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            {subStep === '5a' && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={loading}
                className="w-full min-h-[56px] text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] touch-manipulation text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.navigation.goLive}
                {!loading && <Sparkles className="w-5 h-5" />}
              </button>
            )}

            {/* Back link always visible when not on first screen */}
            {subStep !== '1a' && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 active:scale-[0.97] touch-manipulation py-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.navigation.back}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
