'use client';

import React, { useState, useEffect } from 'react';
import { createCategory, updateCategory } from '@/actions/category';
import { MenuCategory } from '@/types/database';
import { X, Loader2 } from 'lucide-react';

interface CategoryEditorDialogProps {
  restaurantId: string;
  category?: MenuCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryEditorDialog({
  restaurantId,
  category,
  isOpen,
  onClose,
  onSuccess,
}: CategoryEditorDialogProps) {
  const isEditing = Boolean(category);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || '');
      setIsActive(category.is_active);
    } else {
      setName('');
      setDescription('');
      setIsActive(true);
    }
    setError(null);
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError('Category name must be at least 2 characters.');
      return;
    }

    try {
      setLoading(true);
      if (isEditing && category) {
        const res = await updateCategory(category.id, {
          name: name.trim(),
          description: description.trim() || null,
          is_active: isActive,
        });
        if (!res.success) throw new Error(res.error || 'Failed to update category');
      } else {
        const res = await createCategory(restaurantId, {
          name: name.trim(),
          description: description.trim() || null,
          is_active: isActive,
        });
        if (!res.success) throw new Error(res.error || 'Failed to create category');
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-md animate-in fade-in">
      <div className="apple-card rounded-t-3xl sm:rounded-3xl p-5 sm:p-8 max-w-md w-full shadow-2xl relative max-h-[90dvh] overflow-y-auto" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        {/* Mobile bottom-sheet handle */}
        <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif text-lg font-bold text-stone-900 tracking-tight">
            {isEditing ? 'Edit Category' : 'Create New Category'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-stone-400 hover:text-stone-700 p-2 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-[0.97]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Artisanal Brews, Sourdough Pizzas"
              className="w-full text-base px-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4A27]/20 transition-all min-h-[52px]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description for this section"
              rows={2}
              className="w-full text-base px-4 py-3 bg-stone-50/70 border border-stone-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4A27]/20 transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-stone-50/70 rounded-2xl border border-stone-200/80">
            <div>
              <span className="text-sm font-semibold text-stone-800 block">Category Active</span>
              <span className="text-xs text-stone-500">Visible on public menu when enabled</span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-12 h-7 rounded-full transition-colors duration-200 relative p-0.5 cursor-pointer active:scale-[0.97] ${
                isActive ? 'bg-[#8B4A27]' : 'bg-stone-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="min-h-[48px] px-5 py-2.5 text-stone-600 hover:text-stone-900 text-sm font-semibold rounded-2xl transition-all cursor-pointer active:scale-[0.97]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="min-h-[48px] px-6 py-2.5 bg-[#8B4A27] hover:bg-[#743c1e] text-white text-sm font-semibold rounded-2xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.97]"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEditing ? 'Save Changes' : 'Create Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
