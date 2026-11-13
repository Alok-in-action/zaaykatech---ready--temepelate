import { z } from 'zod';

export const RestaurantDetailsSchema = z.object({
  name: z.string().trim().min(2, 'Restaurant name must be at least 2 characters').max(80),
  tagline: z.string().trim().max(150).optional().default('Fresh flavors served with love'),
});

export const RestaurantContactSchema = z.object({
  phone: z.string().trim().max(20).optional().nullable(),
  whatsapp: z.string().trim().max(20).optional().nullable(),
  email: z.string().trim().email('Invalid email address').optional().nullable().or(z.literal('')),
});

export const RestaurantAddressSchema = z.object({
  street: z.string().trim().max(150).optional().nullable(),
  city: z.string().trim().max(60).optional().nullable(),
  state: z.string().trim().max(60).optional().nullable(),
  pincode: z.string().trim().max(10).optional().nullable(),
  google_maps_url: z.string().trim().url('Invalid Google Maps URL').optional().nullable().or(z.literal('')),
});

export const RestaurantSocialLinksSchema = z.object({
  instagram: z.string().trim().url('Invalid Instagram URL').optional().nullable().or(z.literal('')),
  facebook: z.string().trim().url('Invalid Facebook URL').optional().nullable().or(z.literal('')),
  google_review: z.string().trim().url('Invalid Google Review URL').optional().nullable().or(z.literal('')),
});

export const RestaurantBrandingSchema = z.object({
  logo_url: z.string().url().optional().nullable().or(z.literal('')),
  hero_media_type: z.enum(['image', 'video']).default('image'),
  hero_media_url: z.string().url().optional().nullable().or(z.literal('')),
  hero_poster_url: z.string().url().optional().nullable().or(z.literal('')),
  tagline: z.string().trim().max(150).optional().default('Fresh flavors served with love'),
}).refine(
  (data) => {
    // If hero media is video, a poster image is mandatory
    if (data.hero_media_type === 'video' && data.hero_media_url) {
      return Boolean(data.hero_poster_url && data.hero_poster_url.trim().length > 0);
    }
    return true;
  },
  {
    message: 'A poster image is required when using a hero video',
    path: ['hero_poster_url'],
  }
);

export const RestaurantThemeSchema = z.object({
  primary_color: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color').default('#8B4A27'),
  accent_color: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color').default('#D2691E'),
  background_color: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color').default('#FAF8F5'),
  card_style: z.enum(['warm_editorial', 'minimalist', 'modern_dark', 'heritage']).default('warm_editorial'),
});

export const CreateRestaurantSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  tagline: z.string().trim().max(150).optional().default('Fresh flavors served with love'),
  contact: RestaurantContactSchema.optional().default({}),
  address: RestaurantAddressSchema.optional().default({}),
  social_links: RestaurantSocialLinksSchema.optional().default({}),
  branding: RestaurantBrandingSchema.optional().default({
    hero_media_type: 'image',
    tagline: 'Fresh flavors served with love',
  }),
  theme: RestaurantThemeSchema.optional().default({
    primary_color: '#8B4A27',
    accent_color: '#D2691E',
    background_color: '#FAF8F5',
    card_style: 'warm_editorial',
  }),
});

export const MediaUploadRequestSchema = z.object({
  restaurantId: z.string().uuid(),
  fileType: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
  ]),
  fileSize: z.number().positive(),
  purpose: z.enum(['logo', 'hero', 'poster', 'dish']),
});

export type CreateRestaurantInput = z.infer<typeof CreateRestaurantSchema>;
export type RestaurantDetailsInput = z.infer<typeof RestaurantDetailsSchema>;
export type RestaurantContactInput = z.infer<typeof RestaurantContactSchema>;
export type RestaurantAddressInput = z.infer<typeof RestaurantAddressSchema>;
export type RestaurantSocialLinksInput = z.infer<typeof RestaurantSocialLinksSchema>;
export type RestaurantBrandingInput = z.infer<typeof RestaurantBrandingSchema>;
export type RestaurantThemeInput = z.infer<typeof RestaurantThemeSchema>;
export type MediaUploadRequest = z.infer<typeof MediaUploadRequestSchema>;
