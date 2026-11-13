import { createClient } from '@/lib/supabase/server';
import { Restaurant, MenuCategory, MenuItem, SiteStatus } from '@/types/database';

export function calculateSiteStatus(
  restaurant: Pick<Restaurant, 'status' | 'trial_ends_at' | 'subscription_end_date'>
): SiteStatus {
  if (restaurant.status === 'suspended') return 'expired';
  if (restaurant.status === 'draft') return 'trialing';

  const now = new Date();

  // If there is an active paid subscription
  if (restaurant.subscription_end_date) {
    const subEnd = new Date(restaurant.subscription_end_date);
    if (subEnd >= now) {
      return 'active';
    }
  }

  const trialEnds = new Date(restaurant.trial_ends_at);
  const gracePeriodHours = Number(process.env.GRACE_PERIOD_HOURS || 24);
  const gracePeriodEnds = new Date(trialEnds.getTime() + gracePeriodHours * 60 * 60 * 1000);

  if (now <= trialEnds) {
    const hoursLeft = (trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursLeft <= 4 ? 'trial_ending' : 'trialing';
  }

  if (now <= gracePeriodEnds) {
    return 'grace_period';
  }

  return 'expired';
}

export function isSitePubliclyLive(status: SiteStatus): boolean {
  return ['trialing', 'trial_ending', 'grace_period', 'active'].includes(status);
}

export interface ResolvedTenantData {
  restaurant: Restaurant;
  categories: MenuCategory[];
  items: MenuItem[];
  siteStatus: SiteStatus;
  isLive: boolean;
}

export async function resolveTenantBySlug(slug: string): Promise<ResolvedTenantData | null> {
  try {
    const supabase = await createClient();

    // 1. Fetch restaurant
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (restError || !restaurant) {
      return getDemoFallbackTenant(slug);
    }

    const typedRestaurant = restaurant as unknown as Restaurant;
    const computedStatus = calculateSiteStatus(typedRestaurant);
    const isLive = isSitePubliclyLive(computedStatus);

    // 2. Fetch categories
    const { data: categories } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', typedRestaurant.id)
      .eq('is_active', true)
      .order('position', { ascending: true });

    // 3. Fetch items
    const { data: items } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', typedRestaurant.id)
      .eq('is_available', true)
      .order('position', { ascending: true });

    return {
      restaurant: typedRestaurant,
      categories: (categories || []) as unknown as MenuCategory[],
      items: (items || []) as unknown as MenuItem[],
      siteStatus: computedStatus,
      isLive,
    };
  } catch (err) {
    console.warn(`Error resolving tenant for slug ${slug}:`, err);
    return getDemoFallbackTenant(slug);
  }
}

// Demo fallback tenant for local preview and template demonstration
export function getDemoFallbackTenant(slug: string): ResolvedTenantData {
  const trialEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const demoRestaurant: Restaurant = {
    id: '00000000-0000-0000-0000-000000000000',
    owner_profile_id: '00000000-0000-0000-0000-000000000001',
    agent_id: null,
    slug: slug || 'demo',
    name: 'Cafe 9:50',
    status: 'published',
    onboarding_source: 'self_serve',
    trial_ends_at: trialEnd,
    published_at: new Date().toISOString(),
    site_status: 'trialing',
    subscription_end_date: null,
    branding: {
      logo_url: null,
      hero_media_type: 'video',
      hero_media_url: 'https://cdn.pixabay.com/video/2016/09/21/5391-183786503_tiny.mp4',
      hero_poster_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=1200',
      tagline: 'Artisanal coffee, freshly brewed memories, and delicious food',
    },
    contact: {
      phone: '+91 98765 43210',
      whatsapp: '+919876543210',
      email: 'hello@cafe950.in',
    },
    address: {
      street: 'Shop 4, Heritage Arcade, FC Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411004',
      google_maps_url: 'https://maps.google.com',
    },
    social_links: {
      instagram: 'https://instagram.com/cafe950',
      facebook: null,
      google_review: 'https://g.page/r/review',
    },
    theme: {
      primary_color: '#8B4A27',
      accent_color: '#D2691E',
      background_color: '#FAF8F5',
      card_style: 'warm_editorial',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const demoCategories: MenuCategory[] = [
    {
      id: 'cat-1',
      restaurant_id: demoRestaurant.id,
      name: 'Coffee & Brews',
      slug: 'coffee-and-brews',
      description: 'Artisanal single origin beans roasted to perfection',
      position: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'cat-2',
      restaurant_id: demoRestaurant.id,
      name: 'Artisan Pizzas',
      slug: 'artisan-pizzas',
      description: 'Hand-stretched sourdough fermented for 48 hours',
      position: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'cat-3',
      restaurant_id: demoRestaurant.id,
      name: 'Desserts & Bakes',
      slug: 'desserts-and-bakes',
      description: 'Freshly baked every morning with French butter',
      position: 2,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const demoItems: MenuItem[] = [
    {
      id: 'item-1',
      restaurant_id: demoRestaurant.id,
      category_id: 'cat-1',
      name: 'Spanish Latte',
      slug: 'spanish-latte',
      description: 'Double espresso with textured condensed milk and cinnamon dust',
      price_paise: 24000,
      variant_prices: null,
      image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=600',
      tags: ['Bestseller', 'Signature'],
      allergens: ['Dairy'],
      is_veg: true,
      is_available: true,
      is_signature: true,
      is_most_ordered: true,
      is_monsoon: false,
      custom_tag: 'Signature Blend',
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'item-2',
      restaurant_id: demoRestaurant.id,
      category_id: 'cat-1',
      name: 'Cold Brew on the Rocks',
      slug: 'cold-brew',
      description: '18-hour slow steeped Karnataka Arabica over crystal ice',
      price_paise: 21000,
      variant_prices: null,
      image_url: null,
      tags: ['Refreshing'],
      allergens: null,
      is_veg: true,
      is_available: true,
      is_signature: false,
      is_most_ordered: false,
      is_monsoon: false,
      custom_tag: null,
      position: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'item-3',
      restaurant_id: demoRestaurant.id,
      category_id: 'cat-2',
      name: 'Truffle Mushroom Sourdough Pizza',
      slug: 'truffle-mushroom-pizza',
      description: 'Shiitake, button mushroom, fior di latte, white truffle oil & parmesan',
      price_paise: 55000,
      variant_prices: {
        ny_style: 55000,
        neapolitan: 65000,
      },
      image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600',
      tags: ['Chef Pick'],
      allergens: ['Dairy', 'Gluten'],
      is_veg: true,
      is_available: true,
      is_signature: true,
      is_most_ordered: false,
      is_monsoon: false,
      custom_tag: 'Chef Special',
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'item-4',
      restaurant_id: demoRestaurant.id,
      category_id: 'cat-3',
      name: 'Basque Burnt Cheesecake',
      slug: 'basque-cheesecake',
      description: 'Caramelized crust with an ultra-creamy, molten center',
      price_paise: 28000,
      variant_prices: null,
      image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=600',
      tags: ['Bestseller'],
      allergens: ['Dairy', 'Eggs'],
      is_veg: false,
      is_available: true,
      is_signature: false,
      is_most_ordered: true,
      is_monsoon: false,
      custom_tag: 'Top Pick',
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  return {
    restaurant: demoRestaurant,
    categories: demoCategories,
    items: demoItems,
    siteStatus: 'trialing',
    isLive: true,
  };
}

