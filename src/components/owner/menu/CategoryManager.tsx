'use client';

import React, { useState } from 'react';
import { MenuCategory } from '@/types/database';
import { toggleCategoryActive, deleteCategory, reorderCategories } from '@/actions/category';
import { ChevronUp, ChevronDown, Edit2, Trash2, AlertTriangle, Plus, FolderKanban } from 'lucide-react';

interface CategoryManagerProps {
  restaurantId: string;
  categories: MenuCategory[];
  itemCounts: Record<string, number>;
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  onRefresh: () => void;
  onOpenCreateDialog: () => void;
  onEditCategory: (cat: MenuCategory) => void;
}

export function CategoryManager({
  restaurantId,
  categories,
  itemCounts,
  selectedCategoryId,
  onSelectCategory,
  onRefresh,
  onOpenCreateDialog,
  onEditCategory,
}: CategoryManagerProps) {
  const [deleteSafeguard, setDeleteSafeguard] = useState<{
    category: MenuCategory;
    itemCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent, cat: MenuCategory) => {
    e.stopPropagation();
    try {
      await toggleCategoryActive(cat.id, !cat.is_active);
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle category:', err);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const reordered = [...categories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      await reorderCategories(
        restaurantId,
        reordered.map((c) => c.id)
      );
      onRefresh();
    } catch (err) {
      console.error('Failed to reorder categories:', err);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, cat: MenuCategory) => {
    e.stopPropagation();
    const count = itemCounts[cat.id] || 0;
    if (count > 0) {
      setDeleteSafeguard({ category: cat, itemCount: count });
    } else {
      if (confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
        confirmDelete(cat.id, false);
      }
    }
  };

  const confirmDelete = async (categoryId: string, cascade: boolean) => {
    try {
      setLoading(true);
      const res = await deleteCategory(categoryId, cascade);
      if (!res.success) {
        alert(res.error || 'Failed to delete category');
        return;
      }
      setDeleteSafeguard(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete category:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="apple-card rounded-3xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-[#8B4A27]" />
            <span>Menu Categories</span>
          </h2>
          <p className="text-xs text-stone-500">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} configured
          </p>
        </div>

        <button
          onClick={onOpenCreateDialog}
          className="px-3.5 py-1.5 bg-[#8B4A27] hover:bg-[#743c1e] text-white text-xs font-semibold rounded-xl shadow-xs transition-all apple-press inline-flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Pill/List Bar */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat, idx) => {
          const isSelected = cat.id === selectedCategoryId;
          const count = itemCounts[cat.id] || 0;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs cursor-pointer transition-all flex-shrink-0 apple-press ${
                isSelected
                  ? 'border-[#8B4A27] bg-[#8B4A27]/10 text-[#8B4A27] font-bold shadow-2xs'
                  : 'border-stone-200 bg-stone-50/70 hover:bg-stone-100 text-stone-700'
              }`}
            >
              {/* Up/Down Reorder Buttons */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMove(idx, 'up');
                  }}
                  className="min-h-[24px] min-w-[24px] p-0.5 flex items-center justify-center text-stone-500 hover:text-stone-900 disabled:opacity-20 cursor-pointer rounded-sm hover:bg-stone-200/60 active:scale-[0.97] touch-manipulation"
                  title="Move Left"
                  aria-label="Move category left"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === categories.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMove(idx, 'down');
                  }}
                  className="min-h-[24px] min-w-[24px] p-0.5 flex items-center justify-center text-stone-500 hover:text-stone-900 disabled:opacity-20 cursor-pointer rounded-sm hover:bg-stone-200/60 active:scale-[0.97] touch-manipulation"
                  title="Move Right"
                  aria-label="Move category right"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <span>{cat.name}</span>

              {/* Item Count Badge */}
              <span className="text-[10px] px-2 py-0.5 bg-stone-200/80 text-stone-700 rounded-full font-mono font-semibold">
                {count}
              </span>

              {/* Status indicator */}
              {!cat.is_active && (
                <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-bold uppercase">
                  Inactive
                </span>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-0.5 pl-1.5 border-l border-stone-200/80">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCategory(cat);
                  }}
                  className="text-stone-400 hover:text-stone-900 p-1 rounded-md hover:bg-stone-200/50 cursor-pointer transition-colors"
                  title="Edit Category"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteClick(e, cat)}
                  className="text-stone-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 cursor-pointer transition-colors"
                  title="Delete Category"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {categories.length === 0 && (
          <div className="w-full text-center py-6 text-xs text-stone-400 border border-dashed border-stone-200 rounded-2xl">
            No categories created yet. Click &quot;+ Add Category&quot; to start organizing your menu.
          </div>
        )}
      </div>

      {/* Category Deletion Safeguard Modal */}
      {deleteSafeguard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in">
          <div className="apple-card rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">
              Category Contains {deleteSafeguard.itemCount} Dishes
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-6">
              Category <strong>&quot;{deleteSafeguard.category.name}&quot;</strong> has{' '}
              {deleteSafeguard.itemCount} menu item(s). Deleting this category will permanently remove all dishes inside it.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteSafeguard(null)}
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl apple-press transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(deleteSafeguard.category.id, true)}
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs apple-press transition-all cursor-pointer"
              >
                {loading ? 'Deleting...' : 'Delete Category & Dishes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
