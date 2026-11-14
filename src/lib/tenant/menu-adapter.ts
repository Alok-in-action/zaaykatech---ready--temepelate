import { Restaurant, MenuCategory, MenuItem as DBMenuItem } from '@/types/database';
import { MenuSection, MenuItem as TemplateMenuItem } from '@/types';
import { ThemeConfig } from '@/lib/themes/themeTypes';
import { PREDEFINED_THEMES } from '@/lib/themes/predefinedThemes';

export interface AdaptedMenuData {
  sections: MenuSection[];
  theme: ThemeConfig;
}

/**
 * Maps Supabase restaurant, categories, and items into the exact data shapes
 * expected by template01's MenuClient component.
 */
export function adaptDatabaseToTemplateMenu(
  restaurant: Restaurant,
  categories: MenuCategory[],
  items: DBMenuItem[]
): AdaptedMenuData {
  // 1. Resolve Theme Config (Fallback to Cappuccino)
  const defaultTheme = PREDEFINED_THEMES[0]; // Cappuccino
  let baseTheme = defaultTheme;

  const savedThemeId = (restaurant.theme as any)?.theme_id;
  if (savedThemeId) {
    const found = PREDEFINED_THEMES.find((t) => t.id === savedThemeId);
    if (found) baseTheme = found;
  } else if (restaurant.theme?.primary_color) {
    // Check if primary and background match any predefined theme
    const matched = PREDEFINED_THEMES.find(
      (t) =>
        t.colors.primary.toLowerCase() === restaurant.theme.primary_color.toLowerCase() &&
        t.colors.background.toLowerCase() === restaurant.theme.background_color.toLowerCase()
    );
    if (matched) {
      baseTheme = matched;
    } else {
      // Build custom theme based on Cappuccino
      baseTheme = {
        ...defaultTheme,
        id: 'custom',
        name: 'Custom',
        colors: {
          ...defaultTheme.colors,
          primary: restaurant.theme.primary_color || defaultTheme.colors.primary,
          accent: restaurant.theme.accent_color || defaultTheme.colors.accent,
          background: restaurant.theme.background_color || defaultTheme.colors.background,
        },
      };
    }
  }

  // Format restaurant physical address
  const addressParts = [
    restaurant.address?.street,
    restaurant.address?.city,
    restaurant.address?.state,
    restaurant.address?.pincode,
  ].filter(Boolean);
  const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : undefined;

  // Construct final ThemeConfig with actual restaurant branding and contact details
  const finalTheme: ThemeConfig = {
    ...baseTheme,
    restaurantName: restaurant.name,
    tagline: restaurant.branding?.tagline || undefined,
    logoUrl: restaurant.branding?.logo_url || undefined,
    heroMediaType: restaurant.branding?.hero_media_type || 'image',
    heroVideoUrl:
      restaurant.branding?.hero_media_type === 'video' && restaurant.branding?.hero_media_url
        ? restaurant.branding.hero_media_url
        : undefined,
    heroPosterUrl: restaurant.branding?.hero_poster_url || undefined,
    showHeroVideo:
      restaurant.branding?.hero_media_type === 'video' &&
      Boolean(restaurant.branding?.hero_media_url),
    mobileNumber: restaurant.contact?.phone || undefined,
    whatsappNumber: restaurant.contact?.whatsapp || undefined,
    address: formattedAddress,
    mapsUrl: restaurant.address?.google_maps_url || undefined,
    instagramUrl: restaurant.social_links?.instagram || undefined,
    reviewUrl: restaurant.social_links?.google_review || undefined,
  };

  // 2. Map Categories and Items into MenuSection[]
  const activeCategories = (categories || [])
    .filter((cat) => cat.is_active !== false)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const sections: MenuSection[] = activeCategories.map((cat) => {
    const catItems = (items || [])
      .filter((item) => item.category_id === cat.id && item.is_available !== false)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const mappedItems: TemplateMenuItem[] = catItems.map((item) => {
      // Format standard price from paise to rupees
      let formattedPrice: string | undefined = undefined;
      if (item.price_paise !== null && item.price_paise !== undefined) {
        formattedPrice = `₹${Math.round(item.price_paise / 100)}`;
      }

      // Format variant prices if present
      let formattedVariantPrices: Record<string, string | number> | undefined = undefined;
      let pizzaPrices: { ny: number; neap: number } | undefined = undefined;

      if (item.variant_prices && typeof item.variant_prices === 'object') {
        formattedVariantPrices = {};
        for (const [key, val] of Object.entries(item.variant_prices)) {
          if (typeof val === 'number') {
            // If stored in paise (e.g. > 1000) or rupees
            const inRupees = val > 1000 ? Math.round(val / 100) : val;
            formattedVariantPrices[key] = `₹${inRupees}`;
            if (!pizzaPrices) {
              pizzaPrices = { ny: inRupees, neap: inRupees };
            }
            if (key.toLowerCase() === 'ny') {
              pizzaPrices.ny = inRupees;
            } else if (key.toLowerCase() === 'neap') {
              pizzaPrices.neap = inRupees;
            }
          } else if (typeof val === 'string') {
            const strVal = val as string;
            formattedVariantPrices[key] = strVal.startsWith('₹') ? strVal : `₹${strVal}`;
          }
        }
      }

      return {
        name: item.name,
        description: item.description || undefined,
        price: formattedPrice,
        prices: pizzaPrices,
        variant_prices: formattedVariantPrices,
        isMostOrdered: Boolean(item.is_most_ordered),
        isSignature: Boolean(item.is_signature),
        customTag: item.custom_tag || undefined,
        isMonsoon: Boolean(item.is_monsoon),
        image_url: item.image_url || undefined,
        is_veg: item.is_veg !== null && item.is_veg !== undefined ? item.is_veg : undefined,
      };
    });

    const slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return {
      id: slug,
      title: cat.name.toLowerCase(),
      subtitle: cat.description || undefined,
      items: mappedItems,
    };
  });

  return {
    sections,
    theme: finalTheme,
  };
}
