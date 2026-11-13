'use client';

import React, { useState, useEffect } from 'react';
import { createMenuItem, updateMenuItem } from '@/actions/item';
import { MediaUploader } from '@/components/owner/MediaUploader';
import { MenuItem, MenuCategory } from '@/types/database';
import { X, Loader2, Plus, Trash2, Sparkles, Star, CloudRain } from 'lucide-react';

interface ItemEditorDialogProps {
  restaurantId: string;
  categories: MenuCategory[];
  item?: MenuItem | null;
  defaultCategoryId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ItemEditorDialog({
  restaurantId,
  categories,
  item,
  defaultCategoryId,
  isOpen,
  onClose,
  onSuccess,
}: ItemEditorDialogProps) {
  const isEditing = Boolean(item);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [pricingMode, setPricingMode] = useState<'single' | 'variants'>('single');
  const [singlePriceRupees, setSinglePriceRupees] = useState<string>('');
  const [variants, setVariants] = useState<Array<{ name: string; rupees: string }>>([
    { name: 'Regular', rupees: '' },
    { name: 'Large', rupees: '' },
  ]);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isVeg, setIsVeg] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isSignature, setIsSignature] = useState(false);
  const [isMostOrdered, setIsMostOrdered] = useState(false);
  const [isMonsoon, setIsMonsoon] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [allergensInput, setAllergensInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategoryId(item.category_id);
      setDescription(item.description || '');
      setImageUrl(item.image_url || null);
      setIsVeg(item.is_veg !== false);
      setIsAvailable(item.is_available);
      setIsSignature(item.is_signature);
      setIsMostOrdered(item.is_most_ordered);
      setIsMonsoon(item.is_monsoon);
      setCustomTag(item.custom_tag || '');
      setTagsInput(item.tags?.join(', ') || '');
      setAllergensInput(item.allergens?.join(', ') || '');

      if (item.variant_prices && Object.keys(item.variant_prices).length > 0) {
        setPricingMode('variants');
        setSinglePriceRupees('');
        setVariants(
          Object.entries(item.variant_prices).map(([k, paise]) => ({
            name: k,
            rupees: String(Math.round(paise / 100)),
          }))
        );
      } else {
        setPricingMode('single');
        setSinglePriceRupees(item.price_paise ? String(Math.round(item.price_paise / 100)) : '');
        setVariants([
          { name: 'Regular', rupees: '' },
          { name: 'Large', rupees: '' },
        ]);
      }
    } else {
      setName('');
      setCategoryId(defaultCategoryId || categories[0]?.id || '');
      setDescription('');
      setPricingMode('single');
      setSinglePriceRupees('');
      setVariants([
        { name: 'Regular', rupees: '' },
        { name: 'Large', rupees: '' },
      ]);
      setImageUrl(null);
      setIsVeg(true);
      setIsAvailable(true);
      setIsSignature(false);
      setIsMostOrdered(false);
      setIsMonsoon(false);
      setCustomTag('');
      setTagsInput('');
      setAllergensInput('');
    }
    setError(null);
  }, [item, defaultCategoryId, categories, isOpen]);

  if (!isOpen) return null;

  const handleAddVariant = () => {
    setVariants([...variants, { name: '', rupees: '' }]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: 'name' | 'rupees', val: string) => {
    const updated = [...variants];
    updated[index][field] = val;
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Dish name is required.');
      return;
    }
    if (!categoryId) {
      setError('Please select a category for this dish.');
      return;
    }

    let price_paise: number | null = null;
    let variant_prices: Record<string, number> | null = null;

    if (pricingMode === 'single') {
      const p = parseFloat(singlePriceRupees);
      if (isNaN(p) || p < 0) {
        setError('Please enter a valid price in rupees (e.g. 250).');
        return;
      }
      price_paise = Math.round(p * 100);
      variant_prices = null;
    } else {
      const vMap: Record<string, number> = {};
      for (const v of variants) {
        if (!v.name.trim()) {
          setError('Variant names cannot be empty.');
          return;
        }
        const rup = parseFloat(v.rupees);
        if (isNaN(rup) || rup < 0) {
          setError(`Invalid price for variant "${v.name}".`);
          return;
        }
        vMap[v.name.trim()] = Math.round(rup * 100);
      }
      if (Object.keys(vMap).length === 0) {
        setError('Please add at least one variant price.');
        return;
      }
      price_paise = null;
      variant_prices = vMap;
    }

    const tags = tagsInput
      ? tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    const allergens = allergensInput
      ? allergensInput
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean)
      : [];

    try {
      setLoading(true);

      const payload = {
        categoryId,
        pricingMode,
        name: name.trim(),
        description: description.trim() || null,
        price_paise,
        variant_prices,
        image_url: imageUrl || null,
        is_veg: isVeg,
        is_available: isAvailable,
        is_signature: isSignature,
        is_most_ordered: isMostOrdered,
        is_monsoon: isMonsoon,
        custom_tag: customTag.trim() || null,
        tags,
        allergens,
      };

      if (isEditing && item) {
        const res = await updateMenuItem(item.id, payload);
        if (!res.success) throw new Error(res.error || 'Failed to update dish');
      } else {
        const res = await createMenuItem(restaurantId, payload);
        if (!res.success) throw new Error(res.error || 'Failed to create dish');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div
        className="apple-card rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[92dvh] overflow-y-auto no-scrollbar"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        {/* Mobile bottom-sheet handle */}
        <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between mb-5 sticky top-0 bg-white/95 backdrop-blur-md pb-2 z-10 border-b border-stone-100">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 tracking-tight">
              {isEditing ? 'Edit Dish Details' : 'Add New Dish'}
            </h3>
            <p className="text-xs text-stone-500">Configure dish information, pricing, and photography.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-stone-400 hover:text-stone-700 p-2 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-[0.97]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Category Assignment */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-base px-3.5 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4A27]/20 transition-all cursor-pointer min-h-[48px]"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Dish Name & Description */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Dish Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Truffle Sourdough Toast"
              className="w-full text-base px-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4A27]/20 transition-all min-h-[48px]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Flavor notes, ingredients, dietary information..."
              rows={2}
              className="w-full text-base px-4 py-2.5 bg-stone-50/70 border border-stone-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4A27]/20 transition-all resize-none"
            />
          </div>

          {/* 3. Veg / Non-Veg Indicator */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Dietary Type
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsVeg(true)}
                className={`py-2 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all apple-press cursor-pointer ${
                  isVeg
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                    : 'border-stone-200 bg-stone-50 text-stone-600'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Vegetarian</span>
              </button>
              <button
                type="button"
                onClick={() => setIsVeg(false)}
                className={`py-2 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all apple-press cursor-pointer ${
                  !isVeg
                    ? 'border-rose-600 bg-rose-50 text-rose-800 shadow-2xs'
                    : 'border-stone-200 bg-stone-50 text-stone-600'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span>Non-Vegetarian</span>
              </button>
            </div>
          </div>

          {/* 4. Pricing Mode: Single Price OR Variants */}
          <div className="p-4 bg-stone-50/70 rounded-2xl border border-stone-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800">Pricing Model</label>
              <div className="flex bg-stone-200/60 p-0.5 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setPricingMode('single')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    pricingMode === 'single' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-500'
                  }`}
                >
                  Single Price
                </button>
                <button
                  type="button"
                  onClick={() => setPricingMode('variants')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    pricingMode === 'variants' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-500'
                  }`}
                >
                  Variants
                </button>
              </div>
            </div>

            {pricingMode === 'single' ? (
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Price in Rupees (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-sm text-stone-400 font-bold">₹</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={singlePriceRupees}
                    onChange={(e) => setSinglePriceRupees(e.target.value)}
                    placeholder="250"
                    className="w-full text-base pl-8 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl font-mono focus:ring-2 focus:ring-[#8B4A27]/20 focus:outline-none min-h-[48px]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-600 font-medium">Add size/style variants</span>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="text-xs text-[#8B4A27] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer min-h-[36px] px-2 active:scale-[0.97]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>
                {variants.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                      placeholder="e.g. Regular / Large"
                      className="flex-1 text-base px-3 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#8B4A27]/20 focus:outline-none min-h-[48px]"
                    />
                    <div className="relative w-32">
                      <span className="absolute left-2.5 top-3 text-sm text-stone-400 font-bold">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={v.rupees}
                        onChange={(e) => handleVariantChange(idx, 'rupees', e.target.value)}
                        placeholder="180"
                        className="w-full text-base pl-7 pr-3 py-2.5 bg-white border border-stone-200 rounded-xl font-mono focus:ring-2 focus:ring-[#8B4A27]/20 focus:outline-none min-h-[48px]"
                      />
                    </div>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove Variant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Dish Photo (Supabase Storage) */}
          <div>
            <MediaUploader
              restaurantId={restaurantId}
              purpose="dish"
              currentUrl={imageUrl}
              onUploadSuccess={(url) => setImageUrl(url)}
              label="Dish Photo (Optional, Max 5MB, JPEG/PNG/WebP)"
              maxSizeMb={5}
            />
          </div>

          {/* 6. Promotional Badges */}
          <div className="pt-2 border-t border-stone-100">
            <label className="block text-xs font-semibold text-stone-700 mb-2">Highlight Badges</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <label className="flex items-center gap-2 p-2.5 bg-stone-50/70 rounded-xl border border-stone-200/80 cursor-pointer text-xs hover:bg-stone-100/60 transition-colors">
                <input
                  type="checkbox"
                  checked={isSignature}
                  onChange={(e) => setIsSignature(e.target.checked)}
                  className="rounded text-[#8B4A27] focus:ring-[#8B4A27]"
                />
                <span className="flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3 text-amber-600" /> Signature
                </span>
              </label>
              <label className="flex items-center gap-2 p-2.5 bg-stone-50/70 rounded-xl border border-stone-200/80 cursor-pointer text-xs hover:bg-stone-100/60 transition-colors">
                <input
                  type="checkbox"
                  checked={isMostOrdered}
                  onChange={(e) => setIsMostOrdered(e.target.checked)}
                  className="rounded text-[#8B4A27] focus:ring-[#8B4A27]"
                />
                <span className="flex items-center gap-1 font-medium">
                  <Star className="w-3 h-3 text-[#8B4A27]" /> Bestseller
                </span>
              </label>
              <label className="flex items-center gap-2 p-2.5 bg-stone-50/70 rounded-xl border border-stone-200/80 cursor-pointer text-xs hover:bg-stone-100/60 transition-colors">
                <input
                  type="checkbox"
                  checked={isMonsoon}
                  onChange={(e) => setIsMonsoon(e.target.checked)}
                  className="rounded text-[#8B4A27] focus:ring-[#8B4A27]"
                />
                <span className="flex items-center gap-1 font-medium">
                  <CloudRain className="w-3 h-3 text-sky-600" /> Monsoon
                </span>
              </label>
            </div>
          </div>

          {/* 7. Custom Tag, Tags & Allergens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Custom Tag</label>
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="e.g. Barista's Choice"
                className="w-full text-xs px-3 py-2 bg-stone-50/70 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8B4A27]/20 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Tags (Comma-separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Spicy, Gluten-Free"
                className="w-full text-xs px-3 py-2 bg-stone-50/70 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#8B4A27]/20 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* 8. Availability Switch */}
          <div className="flex items-center justify-between p-3.5 bg-stone-50/70 rounded-2xl border border-stone-200/80">
            <div>
              <span className="text-xs font-semibold text-stone-800 block">Dish In Stock</span>
              <span className="text-[11px] text-stone-400">Turn off if item is sold out for the day</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`w-10 h-6 rounded-full transition-colors duration-200 relative p-0.5 cursor-pointer ${
                isAvailable ? 'bg-emerald-500' : 'bg-stone-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                  isAvailable ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-3 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl apple-press transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#8B4A27] hover:bg-[#743c1e] text-white text-xs font-bold rounded-xl shadow-xs transition-all apple-press disabled:opacity-60 inline-flex items-center gap-1.5 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Saving...' : isEditing ? 'Update Dish' : 'Add Dish'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
