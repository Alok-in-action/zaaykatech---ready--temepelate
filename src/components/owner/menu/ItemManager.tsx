'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MenuItem, MenuCategory } from '@/types/database';
import { toggleItemAvailability, deleteMenuItem, reorderMenuItems } from '@/actions/item';
import { VegIndicator, formatPrice } from '@/components/public-menu/MenuItemCard';
import { Search, Plus, ChevronUp, ChevronDown, Edit2, Trash2, UtensilsCrossed } from 'lucide-react';

interface ItemManagerProps {
  categories: MenuCategory[];
  items: MenuItem[];
  selectedCategoryId: string;
  onRefresh: () => void;
  onOpenAddItem: () => void;
  onEditItem: (item: MenuItem) => void;
}

export function ItemManager({
  categories,
  items,
  selectedCategoryId,
  onRefresh,
  onOpenAddItem,
  onEditItem,
}: ItemManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [optimisticAvailability, setOptimisticAvailability] = useState<Record<string, boolean>>({});

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  // Filter items
  const filteredItems = items.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return item.category_id === selectedCategoryId;
  });

  const handleToggleAvailability = async (item: MenuItem) => {
    const current = optimisticAvailability[item.id] ?? item.is_available;
    const nextState = !current;

    setOptimisticAvailability((prev) => ({ ...prev, [item.id]: nextState }));

    try {
      const res = await toggleItemAvailability(item.id, nextState);
      if (!res.success) {
        setOptimisticAvailability((prev) => ({ ...prev, [item.id]: current }));
        alert(res.error || 'Failed to update availability');
      } else {
        onRefresh();
      }
    } catch {
      setOptimisticAvailability((prev) => ({ ...prev, [item.id]: current }));
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete dish "${item.name}"?`)) return;

    try {
      const res = await deleteMenuItem(item.id);
      if (!res.success) {
        alert(res.error || 'Failed to delete dish');
        return;
      }
      onRefresh();
    } catch (err) {
      console.error('Delete dish error:', err);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredItems.length) return;

    const reordered = [...filteredItems];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      await reorderMenuItems(
        selectedCategoryId,
        reordered.map((i) => i.id)
      );
      onRefresh();
    } catch (err) {
      console.error('Failed to reorder items:', err);
    }
  };

  return (
    <div className="apple-card rounded-3xl p-5 sm:p-6 space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-[#8B4A27]" />
            <span>
              {searchQuery
                ? `Search Results (${filteredItems.length})`
                : selectedCategory
                ? `${selectedCategory.name} (${filteredItems.length})`
                : 'All Dishes'}
            </span>
          </h2>
          <p className="text-xs text-stone-500">
            Manage pricing, photography, dietary tags, and daily inventory availability.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Quick Search Bar with Apple Style */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
              className="w-full text-xs pl-8 pr-3 py-2 bg-stone-50/70 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4A27]/20 transition-all"
            />
          </div>

          <button
            onClick={onOpenAddItem}
            disabled={categories.length === 0}
            className="px-3.5 py-2 bg-[#8B4A27] hover:bg-[#743c1e] text-white text-xs font-semibold rounded-xl shadow-xs transition-all apple-press disabled:opacity-40 flex-shrink-0 inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Dish</span>
          </button>
        </div>
      </div>

      {/* Dish List */}
      <div className="space-y-2.5">
        {filteredItems.map((item, idx) => {
          const isAvailable = optimisticAvailability[item.id] ?? item.is_available;
          const priceDisplay = formatPrice(item.price_paise, item.variant_prices);

          return (
            <div
              key={item.id}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                isAvailable
                  ? 'border-black/[0.06] bg-white hover:border-black/[0.12] shadow-2xs'
                  : 'border-stone-200/60 bg-stone-50/70 opacity-70'
              }`}
            >
              {/* Left Details */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Reorder Buttons (Only when not in search mode) */}
                {!searchQuery && (
                  <div className="flex flex-col -space-y-0.5 pt-1 flex-shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="p-0.5 text-stone-400 hover:text-stone-900 disabled:opacity-20 cursor-pointer"
                      title="Move Up"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === filteredItems.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="p-0.5 text-stone-400 hover:text-stone-900 disabled:opacity-20 cursor-pointer"
                      title="Move Down"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Thumbnail with rounded corners */}
                {item.image_url ? (
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 border border-black/[0.06]">
                    <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-stone-100/80 border border-black/[0.05] flex items-center justify-center flex-shrink-0 text-stone-400">
                    <UtensilsCrossed className="w-5 h-5 opacity-40" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <VegIndicator isVeg={item.is_veg} />
                    <h3 className="font-serif text-sm font-semibold text-stone-900 truncate">
                      {item.name}
                    </h3>

                    {item.is_signature && (
                      <span className="text-[9px] bg-amber-500/10 text-amber-800 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        Signature
                      </span>
                    )}
                    {item.is_most_ordered && (
                      <span className="text-[9px] bg-[#8B4A27]/10 text-[#8B4A27] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        Bestseller
                      </span>
                    )}
                    {item.custom_tag && (
                      <span className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        {item.custom_tag}
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-[#8B4A27] font-mono">
                      {priceDisplay || 'Unpriced'}
                    </span>
                    {item.tags?.slice(0, 2).map((t, i) => (
                      <span key={i} className="text-[9px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-md font-medium">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Controls: Availability switch & Edit/Delete */}
              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                {/* Apple-style iOS Toggle Switch */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-semibold ${
                      isAvailable ? 'text-emerald-700' : 'text-stone-400'
                    }`}
                  >
                    {isAvailable ? 'In Stock' : 'Sold Out'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(item)}
                    className={`w-10 h-6 rounded-full transition-colors duration-200 relative p-0.5 cursor-pointer ${
                      isAvailable ? 'bg-emerald-500' : 'bg-stone-300'
                    }`}
                    title={isAvailable ? 'Mark as Sold Out' : 'Mark as In Stock'}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                        isAvailable ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => onEditItem(item)}
                    className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg text-xs cursor-pointer transition-colors"
                    title="Edit Dish"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs cursor-pointer transition-colors"
                    title="Delete Dish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 px-4 border border-dashed border-stone-200 rounded-3xl bg-stone-50/30">
            <UtensilsCrossed className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <h4 className="font-serif text-sm font-bold text-stone-800">No dishes in this category</h4>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto leading-relaxed">
              {categories.length === 0
                ? 'Create a category first to start adding delicious items.'
                : 'Click "+ Add Dish" to add your first menu item to this section.'}
            </p>
            {categories.length > 0 && (
              <button
                onClick={onOpenAddItem}
                className="mt-4 px-4 py-2 bg-[#8B4A27] hover:bg-[#743c1e] text-white text-xs font-semibold rounded-xl shadow-xs apple-press transition-all cursor-pointer"
              >
                + Add Dish Now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
