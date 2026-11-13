'use client';

import React from 'react';
import { MenuCategory } from '@/types/database';

interface CategoryNavProps {
  categories: MenuCategory[];
  activeCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

export function CategoryNav({
  categories,
  activeCategoryId,
  onSelectCategory,
}: CategoryNavProps) {
  return (
    <nav
      className="sticky top-0 z-30 apple-glass py-3 px-4 border-b border-stone-200/60 shadow-xs"
      aria-label="Menu categories"
    >
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        {categories.map((category) => {
          const isActive = category.id === activeCategoryId;
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 apple-press shrink-0 ${
                isActive
                  ? 'bg-[#8B4A27] text-white shadow-xs'
                  : 'bg-white/80 text-stone-700 border border-stone-200/80 hover:bg-white'
              }`}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
