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
  }

  // If no predefined theme was matched by id, inspect custom theme color properties
  if (baseTheme === defaultTheme && restaurant.theme && typeof restaurant.theme === 'object') {
    const rawPrimary = restaurant.theme.primary_color?.trim();
    const rawAccent = restaurant.theme.accent_color?.trim();
    const rawBackground = restaurant.theme.background_color?.trim();

    const hasAnyCustomColor = Boolean(rawPrimary || rawAccent || rawBackground);

    if (hasAnyCustomColor) {
      // Check if primary and background match an existing predefined theme exactly
      const matched = PREDEFINED_THEMES.find(
        (t) =>
          rawPrimary &&
          rawBackground &&
          t.colors.primary.toLowerCase() === rawPrimary.toLowerCase() &&
          t.colors.background.toLowerCase() === rawBackground.toLowerCase()
      );

      if (matched) {
        baseTheme = matched;
      } else {
        // Build custom theme: cleanly fill any missing color tokens from default Cappuccino palette
        baseTheme = {
          ...defaultTheme,
          id: 'custom',
          name: 'Custom',
          colors: {
            ...defaultTheme.colors,
            primary: rawPrimary || defaultTheme.colors.primary,
            accent: rawAccent || defaultTheme.colors.accent,
            background: rawBackground || defaultTheme.colors.background,
            surface: (restaurant.theme as any)?.surface_color?.trim() || defaultTheme.colors.surface,
            text: (restaurant.theme as any)?.text_color?.trim() || defaultTheme.colors.text,
            muted: (restaurant.theme as any)?.muted_color?.trim() || defaultTheme.colors.muted,
            border: (restaurant.theme as any)?.border_color?.trim() || defaultTheme.colors.border,
            secondary: (restaurant.theme as any)?.secondary_color?.trim() || defaultTheme.colors.secondary,
          },
        };
      }
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

  // C3: For image heroes, use hero_media_url first and hero_poster_url as fallback; video unchanged
  const isVideo = restaurant.branding?.hero_media_type === 'video';
  const heroPoster = isVideo
    ? (restaurant.branding?.hero_poster_url || undefined)
    : (restaurant.branding?.hero_media_url || restaurant.branding?.hero_poster_url || undefined);

  // Construct final ThemeConfig with actual restaurant branding and contact details
  const finalTheme: ThemeConfig = {
    ...baseTheme,
    restaurantName: restaurant.name,
    tagline: restaurant.branding?.tagline || undefined,
    logoUrl: restaurant.branding?.logo_url || undefined,
    heroMediaType: restaurant.branding?.hero_media_type || 'image',
    heroVideoUrl:
      isVideo && restaurant.branding?.hero_media_url
        ? restaurant.branding.hero_media_url
        : undefined,
    heroPosterUrl: heroPoster,
    showHeroVideo: isVideo && Boolean(restaurant.branding?.hero_media_url),
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
      // A6: Format standard price without rounding, showing decimals only when paise exist
      let formattedPrice: string | undefined = undefined;
      if (item.price_paise !== null && item.price_paise !== undefined) {
        const rupees = item.price_paise / 100;
        formattedPrice = rupees % 1 !== 0 ? `₹${rupees.toFixed(2)}` : `₹${rupees}`;
      }

      // Format variant prices if present
      let formattedVariantPrices: Record<string, string | number> | undefined = undefined;
      let pizzaPrices: { ny: number; neap: number } | undefined = undefined;

      if (item.variant_prices && typeof item.variant_prices === 'object') {
        const entries = Object.entries(item.variant_prices);
        if (entries.length > 0) {
          const tempVariants: Record<string, string | number> = {};
          let rawNy: number | undefined = undefined;
          let rawNeap: number | undefined = undefined;

          for (const [key, val] of entries) {
            const trimmedKey = key.trim();
            if (!trimmedKey) continue;
            const normKey = trimmedKey.toLowerCase();
            const rawVal: unknown = val;

            if (typeof rawVal === 'number') {
              // Magnitude check: if stored in paise (> 1000) or rupees
              const inRupees = rawVal > 1000 ? rawVal / 100 : rawVal;
              const formattedVal = inRupees % 1 === 0 ? String(inRupees) : inRupees.toFixed(2);
              tempVariants[trimmedKey] = `₹${formattedVal}`;

              if (normKey === 'ny' || normKey === 'ny_style' || normKey === 'new york') {
                rawNy = inRupees;
              } else if (normKey === 'neap' || normKey === 'neapolitan') {
                rawNeap = inRupees;
              }
            } else if (typeof rawVal === 'string' && rawVal.trim()) {
              const strVal = rawVal.trim();
              tempVariants[trimmedKey] = strVal.startsWith('₹') ? strVal : `₹${strVal}`;

              const parsedNum = parseFloat(strVal.replace(/[^0-9.]/g, ''));
              if (!isNaN(parsedNum)) {
                if (normKey === 'ny' || normKey === 'ny_style' || normKey === 'new york') {
                  rawNy = parsedNum;
                } else if (normKey === 'neap' || normKey === 'neapolitan') {
                  rawNeap = parsedNum;
                }
              }
            }
          }

          // A4: Leave undefined when variant_prices has no displayable entries
          if (Object.keys(tempVariants).length > 0) {
            formattedVariantPrices = tempVariants;
          }

          // A5: Set pizzaPrices only when BOTH ny and neap variant keys exist
          if (rawNy !== undefined && rawNeap !== undefined) {
            pizzaPrices = { ny: rawNy, neap: rawNeap };
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
