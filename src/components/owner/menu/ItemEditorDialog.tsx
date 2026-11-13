'use client';

import React, { useState, useEffect } from 'react';
import { createMenuItem, updateMenuItem } from '@/actions/item';
import { MediaUploader } from '@/components/owner/MediaUploader';
import { MenuItem, MenuCategory } from '@/types/database';

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
    setVariants(variants.filter((_, idx) => idx !== index));
  };

  const handleVariantChange = (index: number, field: 'name' | 'rupees', val: string) => {
    const updated = [...variants];
    updated[index][field] = val;
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError('Item name must be at least 2 characters.');
      return;
    }

    if (!categoryId) {
      setError('Please select a category for this dish.');
      return;
    }

    let pricePaise: number | null = null;
    let variantPrices: Record<string, number> | null = null;

    if (pricingMode === 'single') {
      const parsedRupees = parseFloat(singlePriceRupees);
      if (isNaN(parsedRupees) || parsedRupees < 0) {
        setError('Please enter a valid non-negative price in Rupees.');
        return;
      }
      pricePaise = Math.round(parsedRupees * 100);
      variantPrices = null;
    } else {
      variantPrices = {};
      for (const v of variants) {
        if (!v.name.trim()) {
          setError('Variant name cannot be empty.');
          return;
        }
        const vRupees = parseFloat(v.rupees);
        if (isNaN(vRupees) || vRupees <= 0) {
          setError(`Please enter a valid positive price for variant "${v.name}".`);
          return;
        }
        variantPrices[v.name.trim().toLowerCase()] = Math.round(vRupees * 100);
      }
      pricePaise = null;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const allergens = allergensInput
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    try {
      setLoading(true);

      const payload = {
        name: name.trim(),
        categoryId,
        description: description.trim() || null,
        pricingMode,
        price_paise: pricePaise,
        variant_prices: variantPrices,
        image_url: imageUrl || null,
        tags,
        allergens,
        is_veg: isVeg,
        is_available: isAvailable,
        is_signature: isSignature,
        is_most_ordered: isMostOrdered,
        is_monsoon: isMonsoon,
        custom_tag: customTag.trim() || null,
      };

      if (isEditing && item) {
        const res = await updateMenuItem(item.id, payload);
        if (!res.success) throw new Error(res.error || 'Failed to update item');
      } else {
        const res = await createMenuItem(restaurantId, payload);
        if (!res.success) throw new Error(res.error || 'Failed to create item');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-stone-200 my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-bold text-stone-900">
            {isEditing ? 'Edit Menu Dish' : 'Add New Menu Dish'}
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-sm font-bold p-1">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Dish Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Spanish Latte, Truffle Pizza"
                className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Appetizing description, ingredients, or preparation method..."
              rows={2}
              className="w-full text-xs px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white"
            />
          </div>

          {/* 3. Veg / Non-Veg Indicator */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">Dietary Indicator</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsVeg(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  isVeg
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-stone-200 bg-white text-stone-600'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Vegetarian</span>
              </button>
              <button
                type="button"
                onClick={() => setIsVeg(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  !isVeg
                    ? 'border-rose-600 bg-rose-50 text-rose-800'
                    : 'border-stone-200 bg-white text-stone-600'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span>Non-Vegetarian</span>
              </button>
            </div>
          </div>

          {/* 4. Pricing Mode: Single Price OR Variants (Correction 2 & 3) */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800">Pricing Model</label>
              <div className="flex bg-stone-200/70 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setPricingMode('single')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    pricingMode === 'single' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-600'
                  }`}
                >
                  Single Price
                </button>
                <button
                  type="button"
                  onClick={() => setPricingMode('variants')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    pricingMode === 'variants' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-600'
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
                  <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={singlePriceRupees}
                    onChange={(e) => setSinglePriceRupees(e.target.value)}
                    placeholder="250"
                    className="w-full text-xs pl-7 pr-3 py-2 bg-white border border-stone-300 rounded-xl font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-500">Add size/style variants</span>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="text-[11px] text-[#8B4A27] font-semibold hover:underline"
                  >
                    + Add Variant
                  </button>
                </div>
                {variants.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                      placeholder="e.g. Regular / NY"
                      className="flex-1 text-xs px-3 py-1.5 bg-white border border-stone-300 rounded-xl"
                    />
                    <div className="relative w-28">
                      <span className="absolute left-2.5 top-1.5 text-xs text-stone-400 font-bold">₹</span>
                      <input
                        type="number"
                        min="1"
                        value={v.rupees}
                        onChange={(e) => handleVariantChange(idx, 'rupees', e.target.value)}
                        placeholder="180"
                        className="w-full text-xs pl-6 pr-2 py-1.5 bg-white border border-stone-300 rounded-xl font-mono"
                      />
                    </div>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="text-stone-400 hover:text-rose-600 text-sm px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Optional Dish Image (Cloudflare R2) */}
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
              <label className="flex items-center gap-2 p-2 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={isSignature}
                  onChange={(e) => setIsSignature(e.target.checked)}
                  className="rounded text-[#8B4A27]"
                />
                <span>✨ Signature</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={isMostOrdered}
                  onChange={(e) => setIsMostOrdered(e.target.checked)}
                  className="rounded text-[#8B4A27]"
                />
                <span>★ Bestseller</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={isMonsoon}
                  onChange={(e) => setIsMonsoon(e.target.checked)}
                  className="rounded text-[#8B4A27]"
                />
                <span>🌧️ Monsoon</span>
              </label>
            </div>
          </div>

          {/* 7. Custom Tag, Tags & Allergens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Custom Tag</label>
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="e.g. Barista's Choice, Limited Edition"
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Tags (Comma-separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Spicy, Gluten-Free, Hot"
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
              />
            </div>
          </div>

          {/* 8. Availability Switch */}
          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200">
            <div>
              <span className="text-xs font-semibold text-stone-800 block">Dish In Stock</span>
              <span className="text-[11px] text-stone-400">Turn off if item is sold out for the day</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                isAvailable ? 'bg-emerald-600' : 'bg-stone-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  isAvailable ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#8B4A27] hover:bg-[#723b1f] text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-60"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Dish' : 'Add Dish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
