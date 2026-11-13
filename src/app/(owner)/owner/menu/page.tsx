'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CategoryManager } from '@/components/owner/menu/CategoryManager';
import { ItemManager } from '@/components/owner/menu/ItemManager';
import { CategoryEditorDialog } from '@/components/owner/menu/CategoryEditorDialog';
import { ItemEditorDialog } from '@/components/owner/menu/ItemEditorDialog';
import { MenuCategory, MenuItem } from '@/types/database';

export default function MenuManagementPage() {
  const [restaurantId, setRestaurantId] = useState<string>('00000000-0000-0000-0000-000000000000');
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const loadMenuData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch categories & items (or initialize with initial demo categories if local test)
      // For local development resilience:
      if (categories.length === 0) {
        const initialCats: MenuCategory[] = [
          {
            id: 'cat-coffee',
            restaurant_id: restaurantId,
            name: 'Artisan Coffee',
            slug: 'artisan-coffee',
            description: 'Single-origin brews and espresso creations',
            position: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'cat-bakery',
            restaurant_id: restaurantId,
            name: 'Fresh Bakery',
            slug: 'fresh-bakery',
            description: 'Handcrafted croissants and desserts',
            position: 1,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        const initialItems: MenuItem[] = [
          {
            id: 'itm-1',
            restaurant_id: restaurantId,
            category_id: 'cat-coffee',
            name: 'Spanish Latte',
            slug: 'spanish-latte',
            description: 'Espresso textured with sweetened condensed milk',
            price_paise: 24000,
            variant_prices: null,
            image_url: null,
            tags: ['Bestseller'],
            allergens: ['Dairy'],
            is_veg: true,
            is_available: true,
            is_signature: true,
            is_most_ordered: true,
            is_monsoon: false,
            custom_tag: 'Barista Choice',
            position: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'itm-2',
            restaurant_id: restaurantId,
            category_id: 'cat-bakery',
            name: 'Almond Croissant',
            slug: 'almond-croissant',
            description: 'Twice-baked butter croissant filled with rich almond cream',
            price_paise: 21000,
            variant_prices: null,
            image_url: null,
            tags: ['Fresh Baked'],
            allergens: ['Gluten', 'Nuts', 'Dairy'],
            is_veg: true,
            is_available: true,
            is_signature: false,
            is_most_ordered: true,
            is_monsoon: false,
            custom_tag: null,
            position: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        setCategories(initialCats);
        setItems(initialItems);
        setSelectedCategoryId(initialCats[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [categories.length, restaurantId]);

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
            href="/r/demo"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#8B4A27] hover:bg-[#723b1f] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            Live Preview ↗
          </a>
        </div>
      </div>

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
