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
      className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md py-3 px-4 border-b border-stone-200/60 shadow-sm"
      aria-label="Menu categories"
    >
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        {categories.map((category) => {
          const isActive = category.id === activeCategoryId;
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex-shrink-0 ${
                isActive
                  ? 'bg-[#8B4A27] text-white shadow-sm font-semibold'
                  : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50'
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

