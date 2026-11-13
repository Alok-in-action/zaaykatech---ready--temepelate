'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Merge,
  Sparkles,
  ArrowRight,
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { commitExtractedMenu } from '@/actions/ai-import';
import type { AIMenuExtractionOutput, CommitMenuPayload } from '@/validations/ai';

interface ReviewItem {
  tempId: string;
  name: string;
  description: string;
  pricingMode: 'single' | 'variants';
  pricePaise: number;
  variantPrices: Record<string, number>;
  isVeg: boolean | null;
  tags: string[];
  confidence: number;
  selected: boolean;
}

interface ReviewCategory {
  tempId: string;
  name: string;
  description: string;
  items: ReviewItem[];
  isExpanded: boolean;
}

interface ExtractionReviewTableProps {
  initialData: AIMenuExtractionOutput;
  restaurantId: string;
  onCommitted: () => void;
  onCancel: () => void;
}

export function ExtractionReviewTable({
  initialData,
  restaurantId,
  onCommitted,
  onCancel,
}: ExtractionReviewTableProps) {
  // Convert initialData into mutable review state
  const [categories, setCategories] = useState<ReviewCategory[]>(() => {
    return initialData.categories.map((cat, catIdx) => ({
      tempId: `cat-${catIdx}-${Date.now()}`,
      name: cat.name || 'Uncategorized',
      description: cat.description || '',
      isExpanded: true,
      items: cat.items.map((item, itemIdx) => {
        const isLowConf = (item.confidence ?? 1) < 0.7;
        const isSuspicious = item.pricingMode === 'single' ? !item.pricePaise || item.pricePaise <= 0 : !item.variantPrices || Object.keys(item.variantPrices).length === 0;
        return {
          tempId: `item-${catIdx}-${itemIdx}-${Date.now()}`,
          name: item.name || '',
          description: item.description || '',
          pricingMode: item.pricingMode || 'single',
          pricePaise: item.pricePaise ?? 0,
          variantPrices: item.variantPrices || {},
          isVeg: item.isVeg ?? null,
          tags: item.tags || [],
          confidence: item.confidence ?? 0.85,
          selected: !isLowConf && !isSuspicious, // preselect items that look clean
        };
      }),
    }));
  });

  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeSourceCatId, setMergeSourceCatId] = useState<string | null>(null);
  const [mergeTargetCatId, setMergeTargetCatId] = useState<string | null>(null);

  const [commitModalOpen, setCommitModalOpen] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);

  // Computed summary
  const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
  const selectedItemsCount = categories.reduce(
    (acc, cat) => acc + cat.items.filter((i) => i.selected).length,
    0
  );
  const selectedCategoriesCount = categories.filter((cat) =>
    cat.items.some((i) => i.selected)
  ).length;

  const flaggedItemsCount = categories.reduce((acc, cat) => {
    return (
      acc +
      cat.items.filter((i) => {
        const isLowConf = i.confidence < 0.7;
        const isSuspiciousPrice =
          i.pricingMode === 'single'
            ? i.pricePaise <= 0
            : Object.keys(i.variantPrices).length === 0 ||
              Object.values(i.variantPrices).some((p) => p <= 0);
        return isLowConf || isSuspiciousPrice;
      }).length
    );
  }, 0);

  // Category Actions
  const handleToggleCategorySelect = (catTempId: string, selectAll: boolean) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.tempId === catTempId
          ? {
              ...c,
              items: c.items.map((i) => ({ ...i, selected: selectAll })),
            }
          : c
      )
    );
  };

  const handleToggleSelectAllGlobal = (selectAll: boolean) => {
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        items: c.items.map((i) => ({ ...i, selected: selectAll })),
      }))
    );
  };

  const handleRenameCategory = (catTempId: string, newName: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.tempId === catTempId ? { ...c, name: newName } : c))
    );
  };

  const handleDeleteCategory = (catTempId: string) => {
    setCategories((prev) => prev.filter((c) => c.tempId !== catTempId));
  };

  const handleOpenMergeDialog = (sourceCatTempId: string) => {
    setMergeSourceCatId(sourceCatTempId);
    const availableTargets = categories.filter((c) => c.tempId !== sourceCatTempId);
    if (availableTargets.length > 0) {
      setMergeTargetCatId(availableTargets[0].tempId);
      setMergeDialogOpen(true);
    }
  };

  const handleExecuteMerge = () => {
    if (!mergeSourceCatId || !mergeTargetCatId) return;

    setCategories((prev) => {
      const sourceCat = prev.find((c) => c.tempId === mergeSourceCatId);
      if (!sourceCat) return prev;

      return prev
        .filter((c) => c.tempId !== mergeSourceCatId)
        .map((c) => {
          if (c.tempId === mergeTargetCatId) {
            return {
              ...c,
              items: [...c.items, ...sourceCat.items],
            };
          }
          return c;
        });
    });

    setMergeDialogOpen(false);
    setMergeSourceCatId(null);
    setMergeTargetCatId(null);
  };

  // Item Actions
  const handleToggleItemSelect = (catTempId: string, itemTempId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.tempId === catTempId
          ? {
              ...c,
              items: c.items.map((i) =>
                i.tempId === itemTempId ? { ...i, selected: !i.selected } : i
              ),
            }
          : c
      )
    );
  };

  const handleItemFieldChange = (
    catTempId: string,
    itemTempId: string,
    field: keyof ReviewItem,
    value: any
  ) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.tempId === catTempId
          ? {
              ...c,
              items: c.items.map((i) =>
                i.tempId === itemTempId ? { ...i, [field]: value } : i
              ),
            }
          : c
      )
    );
  };

  const handleDeleteItem = (catTempId: string, itemTempId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.tempId === catTempId
          ? {
              ...c,
              items: c.items.filter((i) => i.tempId !== itemTempId),
            }
          : c
      )
    );
  };

  const handleReassignItem = (
    currentCatTempId: string,
    targetCatTempId: string,
    itemTempId: string
  ) => {
    if (currentCatTempId === targetCatTempId) return;

    setCategories((prev) => {
      let movedItem: ReviewItem | null = null;
      const filtered = prev.map((c) => {
        if (c.tempId === currentCatTempId) {
          const item = c.items.find((i) => i.tempId === itemTempId);
          if (item) movedItem = item;
          return {
            ...c,
            items: c.items.filter((i) => i.tempId !== itemTempId),
          };
        }
        return c;
      });

      if (!movedItem) return prev;

      return filtered.map((c) => {
        if (c.tempId === targetCatTempId) {
          return {
            ...c,
            items: [...c.items, movedItem!],
          };
        }
        return c;
      });
    });
  };

  // Variant editing helpers
  const handleUpdateVariantPrice = (
    catTempId: string,
    itemTempId: string,
    variantKey: string,
    newPricePaise: number
  ) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.tempId === catTempId
          ? {
              ...c,
              items: c.items.map((i) => {
                if (i.tempId === itemTempId) {
                  return {
                    ...i,
                    variantPrices: {
                      ...i.variantPrices,
                      [variantKey]: newPricePaise,
                    },
                  };
                }
                return i;
              }),
            }
          : c
      )
    );
  };

  const handleAddVariant = (catTempId: string, itemTempId: string) => {
    const defaultName = prompt('Enter variant option name (e.g. "Full", "Large", "12 Inch"):');
    if (!defaultName || !defaultName.trim()) return;

    setCategories((prev) =>
      prev.map((c) =>
        c.tempId === catTempId
          ? {
              ...c,
              items: c.items.map((i) => {
                if (i.tempId === itemTempId) {
                  return {
                    ...i,
                    pricingMode: 'variants',
                    variantPrices: {
                      ...i.variantPrices,
                      [defaultName.trim()]: 10000,
                    },
                  };
                }
                return i;
              }),
            }
          : c
      )
    );
  };

  const handleRemoveVariant = (catTempId: string, itemTempId: string, variantKey: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.tempId === catTempId
          ? {
              ...c,
              items: c.items.map((i) => {
                if (i.tempId === itemTempId) {
                  const updated = { ...i.variantPrices };
                  delete updated[variantKey];
                  return {
                    ...i,
                    variantPrices: updated,
                    pricingMode: Object.keys(updated).length === 0 ? 'single' : 'variants',
                  };
                }
                return i;
              }),
            }
          : c
      )
    );
  };

  // Commit logic
  const handleExecuteCommit = async () => {
    setCommitError(null);
    setIsCommitting(true);

    try {
      const commitCategories = categories
        .map((cat) => {
          const selectedItems = cat.items
            .filter((i) => i.selected)
            .map((i) => ({
              name: i.name.trim(),
              description: i.description.trim() || null,
              pricingMode: i.pricingMode,
              pricePaise: i.pricingMode === 'single' ? i.pricePaise : null,
              variantPrices: i.pricingMode === 'variants' ? i.variantPrices : null,
              isVeg: i.isVeg,
              tags: i.tags,
              isSignature: false,
              isMostOrdered: false,
              customTag: null,
            }));

          return {
            name: cat.name.trim(),
            description: cat.description.trim() || null,
            items: selectedItems,
          };
        })
        .filter((cat) => cat.items.length > 0);

      if (commitCategories.length === 0) {
        throw new Error('Please select at least one dish to import.');
      }

      const payload: CommitMenuPayload = {
        restaurantId,
        categories: commitCategories,
      };

      const res = await commitExtractedMenu(restaurantId, payload);
      if (!res.success) {
        throw new Error(res.error || 'Failed to save menu items.');
      }

      setCommitModalOpen(false);
      onCommitted();
    } catch (err: any) {
      console.error('Commit failed:', err);
      setCommitError(err.message || 'Failed to import dishes.');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SUMMARY BANNER */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">
                AI Extraction Review & Correction
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Review extracted items, correct prices, resolve flags, and select dishes to import into your menu.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right text-xs">
              <span className="font-bold text-foreground">{selectedItemsCount}</span> of{' '}
              <span className="font-medium text-muted-foreground">{totalItems}</span> dishes selected
              ({selectedCategoriesCount} categories)
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  handleToggleSelectAllGlobal(selectedItemsCount !== totalItems)
                }
              >
                {selectedItemsCount === totalItems ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                type="button"
                onClick={() => setCommitModalOpen(true)}
                disabled={selectedItemsCount === 0}
                className="flex items-center gap-2"
              >
                <span>Save Approved Items</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FLAGGED WARNING BAR */}
      {flaggedItemsCount > 0 && (
        <div className="rounded-lg p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <strong>{flaggedItemsCount} item(s) flagged for attention:</strong> Check items with low confidence or ₹0 prices before selecting them.
            </span>
          </div>
        </div>
      )}

      {/* CATEGORIES ACCORDION / LIST */}
      <div className="space-y-6">
        {categories.map((category) => {
          const categorySelectedCount = category.items.filter((i) => i.selected).length;
          const isAllSelected =
            category.items.length > 0 && categorySelectedCount === category.items.length;

          return (
            <Card key={category.tempId} className="border border-border shadow-sm">
              <CardHeader className="p-4 bg-muted/20 border-b border-border/60">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={(checked) =>
                        handleToggleCategorySelect(category.tempId, !!checked)
                      }
                      aria-label="Select category"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={category.name}
                        onChange={(e) =>
                          handleRenameCategory(category.tempId, e.target.value)
                        }
                        className="font-semibold text-base h-8 max-w-xs bg-background"
                      />
                      <Badge variant="outline" className="text-xs">
                        {category.items.length} items
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {categories.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenMergeDialog(category.tempId)}
                        className="h-8 text-xs flex items-center gap-1.5"
                      >
                        <Merge className="h-3.5 w-3.5" />
                        <span>Merge With...</span>
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.tempId)}
                      className="h-8 text-xs text-destructive hover:text-destructive flex items-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 divide-y divide-border/60">
                {category.items.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No items in this category.
                  </div>
                ) : (
                  category.items.map((item) => {
                    const isLowConf = item.confidence < 0.7;
                    const isSuspiciousPrice =
                      item.pricingMode === 'single'
                        ? item.pricePaise <= 0
                        : Object.keys(item.variantPrices).length === 0 ||
                          Object.values(item.variantPrices).some((p) => p <= 0);

                    return (
                      <div
                        key={item.tempId}
                        className={`p-4 transition-colors ${
                          item.selected ? 'bg-background' : 'bg-muted/10 opacity-75'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                          {/* Selection Checkbox & Basic Info */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Checkbox
                              checked={item.selected}
                              onCheckedChange={() =>
                                handleToggleItemSelect(category.tempId, item.tempId)
                              }
                              className="mt-1"
                              aria-label="Select dish"
                            />

                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Veg/Non-Veg Toggle Button */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleItemFieldChange(
                                      category.tempId,
                                      item.tempId,
                                      'isVeg',
                                      item.isVeg === null ? true : !item.isVeg
                                    )
                                  }
                                  className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${
                                    item.isVeg === true
                                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                                      : item.isVeg === false
                                      ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/40'
                                      : 'border-muted-foreground bg-muted'
                                  }`}
                                  title={
                                    item.isVeg === true
                                      ? 'Vegetarian (Click to switch)'
                                      : item.isVeg === false
                                      ? 'Non-Vegetarian (Click to switch)'
                                      : 'Indeterminate dietary flag'
                                  }
                                >
                                  <span
                                    className={`h-2.5 w-2.5 rounded-full ${
                                      item.isVeg === true
                                        ? 'bg-emerald-600'
                                        : item.isVeg === false
                                        ? 'bg-rose-600'
                                        : 'bg-muted-foreground'
                                    }`}
                                  />
                                </button>

                                <Input
                                  value={item.name}
                                  onChange={(e) =>
                                    handleItemFieldChange(
                                      category.tempId,
                                      item.tempId,
                                      'name',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Dish title"
                                  className="h-8 font-medium text-sm flex-1 min-w-[180px] bg-background"
                                />

                                {/* Confidence Score Badge */}
                                <Badge
                                  variant="outline"
                                  className={`text-[11px] h-6 ${
                                    item.confidence >= 0.8
                                      ? 'text-emerald-700 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-300'
                                      : item.confidence >= 0.7
                                      ? 'text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300'
                                      : 'text-destructive border-destructive/30 bg-destructive/10'
                                  }`}
                                >
                                  {isLowConf && (
                                    <AlertTriangle className="h-3 w-3 mr-1 text-destructive" />
                                  )}
                                  {Math.round(item.confidence * 100)}% match
                                </Badge>

                                {isSuspiciousPrice && (
                                  <Badge
                                    variant="destructive"
                                    className="text-[11px] h-6 flex items-center gap-1"
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>Suspicious Price</span>
                                  </Badge>
                                )}
                              </div>

                              <Input
                                value={item.description}
                                onChange={(e) =>
                                  handleItemFieldChange(
                                    category.tempId,
                                    item.tempId,
                                    'description',
                                    e.target.value
                                  )
                                }
                                placeholder="Description (optional)"
                                className="h-7 text-xs text-muted-foreground bg-background"
                              />
                            </div>
                          </div>

                          {/* Pricing & Controls */}
                          <div className="flex flex-wrap items-center gap-3 self-end lg:self-center pl-7 lg:pl-0">
                            {/* Pricing Mode Controls */}
                            {item.pricingMode === 'single' ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-muted-foreground">₹</span>
                                <Input
                                  type="number"
                                  min={0}
                                  value={item.pricePaise > 0 ? (item.pricePaise / 100).toString() : '0'}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                                    handleItemFieldChange(
                                      category.tempId,
                                      item.tempId,
                                      'pricePaise',
                                      Math.round(val * 100)
                                    );
                                  }}
                                  className="h-8 w-24 text-sm font-semibold bg-background"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddVariant(category.tempId, item.tempId)}
                                  className="h-8 text-xs text-muted-foreground"
                                  title="Switch to multiple sizes/variants"
                                >
                                  + Variants
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {Object.entries(item.variantPrices).map(([vName, vPaise]) => (
                                    <div
                                      key={vName}
                                      className="flex items-center gap-1 bg-muted/40 border rounded px-2 py-0.5 text-xs"
                                    >
                                      <span className="font-medium text-foreground">{vName}:</span>
                                      <span>₹</span>
                                      <input
                                        type="number"
                                        min={1}
                                        value={(vPaise / 100).toString()}
                                        onChange={(e) => {
                                          const val = Math.max(1, parseFloat(e.target.value) || 1);
                                          handleUpdateVariantPrice(
                                            category.tempId,
                                            item.tempId,
                                            vName,
                                            Math.round(val * 100)
                                          );
                                        }}
                                        className="w-14 bg-transparent font-medium focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveVariant(category.tempId, item.tempId, vName)
                                        }
                                        className="text-muted-foreground hover:text-destructive ml-1"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddVariant(category.tempId, item.tempId)}
                                    className="h-6 text-[11px] px-2"
                                  >
                                    + Add Size
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Move to another category */}
                            {categories.length > 1 && (
                              <Select
                                value={category.tempId}
                                onValueChange={(targetId) =>
                                  handleReassignItem(category.tempId, targetId, item.tempId)
                                }
                              >
                                <SelectTrigger className="h-8 text-xs w-32 bg-background">
                                  <SelectValue placeholder="Move to..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((c) => (
                                    <SelectItem key={c.tempId} value={c.tempId}>
                                      {c.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteItem(category.tempId, item.tempId)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel & Upload Again
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {selectedItemsCount} approved dishes will be added to your menu
          </span>
          <Button
            type="button"
            onClick={() => setCommitModalOpen(true)}
            disabled={selectedItemsCount === 0}
            className="flex items-center gap-2"
          >
            <span>Commit Approved Menu</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* MERGE CATEGORY DIALOG */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Categories</DialogTitle>
            <DialogDescription>
              Move all dishes from this category into another category and remove the old category.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm">
              Merge dishes from{' '}
              <strong>
                {categories.find((c) => c.tempId === mergeSourceCatId)?.name}
              </strong>{' '}
              into:
            </p>
            <Select
              value={mergeTargetCatId || ''}
              onValueChange={(val) => setMergeTargetCatId(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination category" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((c) => c.tempId !== mergeSourceCatId)
                  .map((c) => (
                    <SelectItem key={c.tempId} value={c.tempId}>
                      {c.name} ({c.items.length} items)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMergeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleExecuteMerge}>
              Confirm Merge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* COMMIT CONFIRMATION MODAL */}
      <Dialog open={commitModalOpen} onOpenChange={setCommitModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save & Import to Menu</DialogTitle>
            <DialogDescription>
              You are about to import {selectedItemsCount} approved dishes across {selectedCategoriesCount} categories.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="p-3 bg-muted/30 rounded-lg text-xs space-y-2 border">
              <div className="flex justify-between font-medium">
                <span>Categories to import:</span>
                <span className="font-bold">{selectedCategoriesCount}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Dishes to import:</span>
                <span className="font-bold">{selectedItemsCount}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-800 dark:text-amber-300">
              <strong>Safe Draft Mode:</strong> Imported items will be saved to your menu dashboard. Your live QR menu will <strong>NOT</strong> be automatically published. You can publish or edit dishes anytime from Menu Management.
            </div>

            {commitError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg">
                {commitError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCommitModalOpen(false)}
              disabled={isCommitting}
            >
              Keep Reviewing
            </Button>
            <Button
              type="button"
              onClick={handleExecuteCommit}
              disabled={isCommitting || selectedItemsCount === 0}
              className="flex items-center gap-2"
            >
              {isCommitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Importing Dishes...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirm & Import</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
