'use client';

import React, { useState, useMemo } from 'react';
import { Restaurant, MenuCategory, MenuItem } from '@/types/database';
import { HeroBanner } from './HeroBanner';
import { CategoryNav } from './CategoryNav';
import { MenuItemCard } from './MenuItemCard';
import { ActionFloaters } from './ActionFloaters';

interface PublicMenuProps {
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
}

export default function PublicMenu({ restaurant, categories, items }: PublicMenuProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Group items by category
  const itemsByCategoryId = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    categories.forEach((cat) => map.set(cat.id, []));

    items.forEach((item) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const matchesTag = item.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matchesName && !matchesDesc && !matchesTag) return;
      }

      // Veg filter
      if (vegOnly && !item.is_veg) {
        return;
      }

      // Tag filter
      if (selectedTag) {
        if (selectedTag === 'signature' && !item.is_signature) return;
        if (selectedTag === 'bestseller' && !item.is_most_ordered) return;
      }

      const list = map.get(item.category_id);
      if (list) {
        list.push(item);
      }
    });

    return map;
  }, [categories, items, searchQuery, vegOnly, selectedTag]);

  const scrollToCategory = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    const element = document.getElementById(`cat-section-${categoryId}`);
    if (element) {
      const yOffset = -70;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className="min-h-screen text-stone-900 pb-28"
      style={{
        backgroundColor: restaurant.theme?.background_color || '#FAF8F5',
      }}
    >
      <div className="max-w-xl mx-auto min-h-screen bg-transparent flex flex-col">
        {/* 1. Hero Banner */}
        <HeroBanner restaurant={restaurant} />

        {/* 2. Search & Dietary Quick Filters */}
        <div className="px-4 pt-4 pb-2">
          {/* Search Bar */}
          <div className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, drinks, ingredients..."
              className="w-full bg-white text-xs sm:text-sm pl-9 pr-8 py-2.5 rounded-2xl border border-stone-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B4A27]/30 transition-all placeholder:text-stone-400"
            />
            <span className="absolute left-3 top-2.5 text-stone-400 text-sm">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Badges */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                vegOnly
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Pure Veg</span>
            </button>

            <button
              onClick={() => setSelectedTag(selectedTag === 'bestseller' ? null : 'bestseller')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedTag === 'bestseller'
                  ? 'bg-[#8B4A27] text-white shadow-sm'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              ★ Bestsellers
            </button>

            <button
              onClick={() => setSelectedTag(selectedTag === 'signature' ? null : 'signature')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedTag === 'signature'
                  ? 'bg-[#8B4A27] text-white shadow-sm'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              ✨ Signatures
            </button>
          </div>
        </div>

        {/* 3. Sticky Category Navigation */}
        {categories.length > 0 && (
          <CategoryNav
            categories={categories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={scrollToCategory}
          />
        )}

        {/* 4. Menu Body: Category Sections */}
        <main className="px-4 py-4 space-y-8 flex-1">
          {categories.map((category) => {
            const categoryItems = itemsByCategoryId.get(category.id) || [];
            if (categoryItems.length === 0) return null;

            return (
              <section
                key={category.id}
                id={`cat-section-${category.id}`}
                className="scroll-mt-20"
              >
                <div className="mb-3">
                  <h3 className="font-serif text-lg font-bold text-stone-900 tracking-tight">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                      {category.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoryItems.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Empty search state */}
          {items.length > 0 && Array.from(itemsByCategoryId.values()).every((arr) => arr.length === 0) && (
            <div className="text-center py-12 px-4">
              <span className="text-3xl mb-2 block">🍽️</span>
              <h4 className="font-serif text-base font-semibold text-stone-800">No dishes match your filter</h4>
              <p className="text-xs text-stone-500 mt-1">Try clearing your search query or filters.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setVegOnly(false);
                  setSelectedTag(null);
                }}
                className="mt-4 px-4 py-1.5 bg-[#8B4A27] text-white text-xs font-medium rounded-full shadow-sm"
              >
                Reset Filters
              </button>
            </div>
          )}
        </main>

        {/* 5. Footer & Back to top */}
        <footer className="text-center py-8 px-4 border-t border-stone-200/60 mt-auto">
          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 mb-4 transition-colors"
          >
            <span>↑</span>
            <span>Back to top</span>
          </button>
          <div className="text-[11px] text-stone-400">
            Powered by{' '}
            <a
              href="https://zaaykatech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-stone-600 hover:text-[#8B4A27] transition-colors"
            >
              ZaaykaTech
            </a>{' '}
            • Digital Restaurant Menus
          </div>
        </footer>

        {/* 6. Sticky Bottom Action Floaters */}
        <ActionFloaters
          contact={restaurant.contact}
          socialLinks={restaurant.social_links}
          address={restaurant.address}
        />
      </div>
    </div>
  );
}

