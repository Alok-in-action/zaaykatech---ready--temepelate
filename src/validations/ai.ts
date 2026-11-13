import { z } from 'zod';

export const AIExtractedItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name cannot be empty'),
  description: z.string().trim().nullable().optional(),
  pricingMode: z.enum(['single', 'variants']).default('single'),
  pricePaise: z.number().int().nonnegative().nullable().optional(),
  variantPrices: z.record(z.string(), z.number().int().positive()).nullable().optional(),
  isVeg: z.boolean().nullable().optional(),
  tags: z.array(z.string().trim()).default([]),
  confidence: z.number().min(0).max(1).default(0.85),
});

export const AIExtractedCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name cannot be empty'),
  description: z.string().trim().nullable().optional(),
  items: z.array(AIExtractedItemSchema).default([]),
});

export const AIMenuExtractionOutputSchema = z.object({
  restaurantName: z.string().trim().nullable().optional(),
  categories: z.array(AIExtractedCategorySchema).default([]),
});

// Commit payload validated before persisting to Supabase
export const CommitMenuItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required'),
  description: z.string().trim().nullable().optional(),
  pricingMode: z.enum(['single', 'variants']),
  pricePaise: z.number().int().nonnegative().nullable().optional(),
  variantPrices: z.record(z.string(), z.number().int().positive()).nullable().optional(),
  isVeg: z.boolean().nullable().optional(),
  tags: z.array(z.string().trim()).default([]),
  isSignature: z.boolean().default(false),
  isMostOrdered: z.boolean().default(false),
  customTag: z.string().trim().nullable().optional(),
}).refine((data) => {
  if (data.pricingMode === 'single') {
    return data.pricePaise !== null && data.pricePaise !== undefined && data.pricePaise >= 0;
  }
  if (data.pricingMode === 'variants') {
    return (
      data.variantPrices !== null &&
      data.variantPrices !== undefined &&
      Object.keys(data.variantPrices).length > 0 &&
      Object.values(data.variantPrices).every((p) => typeof p === 'number' && p > 0)
    );
  }
  return false;
}, {
  message: 'Item must have either a valid single price or valid variant prices',
});

export const CommitCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required'),
  description: z.string().trim().nullable().optional(),
  items: z.array(CommitMenuItemSchema).min(1, 'Category must have at least one dish selected'),
});

export const CommitMenuPayloadSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  categories: z.array(CommitCategorySchema).min(1, 'At least one category must be selected for import'),
});

export type AIExtractedItem = z.infer<typeof AIExtractedItemSchema>;
export type AIExtractedCategory = z.infer<typeof AIExtractedCategorySchema>;
export type AIMenuExtractionOutput = z.infer<typeof AIMenuExtractionOutputSchema>;
export type CommitMenuItem = z.infer<typeof CommitMenuItemSchema>;
export type CommitCategory = z.infer<typeof CommitCategorySchema>;
export type CommitMenuPayload = z.infer<typeof CommitMenuPayloadSchema>;
