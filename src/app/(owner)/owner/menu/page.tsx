'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CategoryManager } from '@/components/owner/menu/CategoryManager';
import { ItemManager } from '@/components/owner/menu/ItemManager';
import { CategoryEditorDialog } from '@/components/owner/menu/CategoryEditorDialog';
import { ItemEditorDialog } from '@/components/owner/menu/ItemEditorDialog';
import { MenuCategory, MenuItem } from '@/types/database';
import { getOwnerRestaurant, getOwnerMenuData } from '@/actions/restaurant';

export default function MenuManagementPage() {
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [restaurantSlug, setRestaurantSlug] = useState<string>('demo');
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dialog states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const loadMenuData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const rRes = await getOwnerRestaurant();
      if (!rRes.success || !rRes.restaurant) {
        setErrorMsg(rRes.error || 'No restaurant found. Please create one in Setup Wizard.');
        return;
      }

      const activeId = rRes.restaurant.id;
      setRestaurantId(activeId);
      setRestaurantSlug(rRes.restaurant.slug);

      const menuRes = await getOwnerMenuData(activeId);
      if (menuRes.success) {
        setCategories(menuRes.categories);
        setItems(menuRes.items);
        if (menuRes.categories.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(menuRes.categories[0].id);
        }
      } else {
        setErrorMsg(menuRes.error || 'Failed to load menu items.');
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    loadMenuData();
  }, [loadMenuData]);

  // Compute item counts by category
  const itemCounts = categories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.id] = items.filter((i) => i.category_id === cat.id).length;
    return acc;
  }, {});

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (cat: MenuCategory) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const handleOpenAddItem = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Menu &amp; Dishes Management</h1>
          <p className="text-xs text-stone-500 mt-1">
            Organize sections, set prices and size variants, toggle stock availability, and upload photos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/owner/menu/ai-import"
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>✨ Import with AI</span>
          </Link>
          <Link
            href="/owner/settings"
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-all"
          >
            Publish Status
          </Link>
          <a
            href={`/r/${restaurantSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#8B4A27] hover:bg-[#723b1f] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            Live Preview ↗
          </a>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs">
          {errorMsg}
        </div>
      )}

      {/* 1. Category Manager */}
      <CategoryManager
        restaurantId={restaurantId}
        categories={categories}
        itemCounts={itemCounts}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={(id) => setSelectedCategoryId(id)}
        onRefresh={loadMenuData}
        onOpenCreateDialog={handleOpenAddCategory}
        onEditCategory={handleEditCategory}
      />

      {/* 2. Item Manager */}
      <ItemManager
        categories={categories}
        items={items}
        selectedCategoryId={selectedCategoryId}
        onRefresh={loadMenuData}
        onOpenAddItem={handleOpenAddItem}
        onEditItem={handleEditItem}
      />

      {/* Category Editor Dialog */}
      <CategoryEditorDialog
        restaurantId={restaurantId}
        category={editingCategory}
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={loadMenuData}
      />

      {/* Item Editor Dialog */}
      <ItemEditorDialog
        restaurantId={restaurantId}
        categories={categories}
        item={editingItem}
        defaultCategoryId={selectedCategoryId}
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSuccess={loadMenuData}
      />
    </div>
  );
}
