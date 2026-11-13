import { z } from 'zod';

export const CategorySchema = z.object({
  name: z.string().trim().min(2, 'Category name must be at least 2 characters').max(80),
  description: z.string().trim().max(250).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const MenuItemSchema = z
  .object({
    name: z.string().trim().min(2, 'Item name must be at least 2 characters').max(100),
    categoryId: z.string().uuid('Valid category must be selected'),
    description: z.string().trim().max(500).optional().nullable(),
    pricingMode: z.enum(['single', 'variants']),
    price_paise: z.number().int('Price must be an integer in paise').nonnegative('Price cannot be negative').optional().nullable(),
    variant_prices: z.record(z.string().min(1), z.number().int().positive('Variant price must be positive integer paise')).optional().nullable(),
    image_url: z.string().url('Invalid image URL').optional().nullable().or(z.literal('')),
    tags: z.array(z.string().trim().max(30)).default([]),
    allergens: z.array(z.string().trim().max(30)).default([]),
    is_veg: z.boolean().default(true),
    is_available: z.boolean().default(true),
    is_signature: z.boolean().default(false),
    is_most_ordered: z.boolean().default(false),
    is_monsoon: z.boolean().default(false),
    custom_tag: z.string().trim().max(30).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.pricingMode === 'single') {
      if (data.price_paise === null || data.price_paise === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Single price is required when pricing mode is single',
          path: ['price_paise'],
        });
      }
      if (data.variant_prices && Object.keys(data.variant_prices).length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cannot have variant prices when pricing mode is single',
          path: ['variant_prices'],
        });
      }
    } else if (data.pricingMode === 'variants') {
      if (!data.variant_prices || Object.keys(data.variant_prices).length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least one variant price is required when pricing mode is variants',
          path: ['variant_prices'],
        });
      }
      if (data.price_paise !== null && data.price_paise !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cannot have a single price when pricing mode is variants',
          path: ['price_paise'],
        });
      }
    }
  });

export type CategoryInput = z.input<typeof CategorySchema>;
export type MenuItemInput = z.input<typeof MenuItemSchema>;
