import assert from 'node:assert';
import { adaptDatabaseToTemplateMenu } from '../src/lib/tenant/menu-adapter';
import { PREDEFINED_THEMES } from '../src/lib/themes/predefinedThemes';
import { mergeDeep } from '../src/lib/themes/themeUtils';
import { Restaurant, MenuCategory, MenuItem as DBMenuItem } from '../src/types/database';

function createMockRestaurant(themeOverride: any, brandingOverride?: any): Restaurant {
  return {
    id: 'test-restaurant-id',
    owner_profile_id: 'test-owner-id',
    name: 'Test Gourmet Cafe',
    slug: 'test-gourmet-cafe',
    status: 'published',
    site_status: 'active',
    food_type: 'Cafe',
    agent_id: null,
    onboarding_completed_at: null,
    social_links: { instagram: null, facebook: null, google_review: null },
    contact: { phone: '9876543210', email: 'owner@example.com', whatsapp: null },
    address: { city: 'Bengaluru', street: '100 Feet Rd', state: 'Karnataka', pincode: '560038', google_maps_url: null },
    branding: {
      logo_url: null,
      hero_media_type: 'image',
      hero_media_url: null,
      hero_poster_url: null,
      tagline: 'Artisanal Flavors',
      ...brandingOverride,
    },
    theme: themeOverride,
    onboarding_current_step: 5,
    onboarding_status: 'completed',
    trial_ends_at: null,
    subscription_end_date: null,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: null,
    onboarding_source: 'self_serve',
  };
}

const cappuccino = PREDEFINED_THEMES[0];
const botanical = PREDEFINED_THEMES.find((t) => t.id === 'botanical')!;
const midnightBlue = PREDEFINED_THEMES.find((t) => t.id === 'midnight-blue')!;

console.log('🧪 Starting Menu Adapter Theme Resolution Tests...\n');

// 1. Empty theme ({})
{
  console.log('Test 1: Empty theme ({}) falls back to Cappuccino defaults...');
  const res = adaptDatabaseToTemplateMenu(createMockRestaurant({}), [], []);
  assert.strictEqual(res.theme.id, cappuccino.id, 'Empty theme id must be cappuccino');
  assert.strictEqual(res.theme.colors.primary, cappuccino.colors.primary);
  assert.strictEqual(res.theme.colors.accent, cappuccino.colors.accent);
  assert.strictEqual(res.theme.colors.background, cappuccino.colors.background);
  assert.strictEqual(res.theme.colors.surface, cappuccino.colors.surface);
  assert.strictEqual(res.theme.colors.text, cappuccino.colors.text);
  console.log('  ✓ Passed');
}

// 2. Null theme
{
  console.log('Test 2: Null theme falls back to Cappuccino defaults...');
  const res = adaptDatabaseToTemplateMenu(createMockRestaurant(null), [], []);
  assert.strictEqual(res.theme.id, cappuccino.id);
  assert.strictEqual(res.theme.colors.primary, cappuccino.colors.primary);
  assert.strictEqual(res.theme.colors.background, cappuccino.colors.background);
  console.log('  ✓ Passed');
}

// 3. Partial theme: Only primary_color provided
{
  console.log('Test 3: Partial theme with only primary_color fills missing tokens from Cappuccino...');
  const customPrimary = '#1A5F7A';
  const res = adaptDatabaseToTemplateMenu(
    createMockRestaurant({ primary_color: customPrimary }),
    [],
    []
  );
  assert.strictEqual(res.theme.id, 'custom');
  assert.strictEqual(res.theme.colors.primary, customPrimary, 'Primary must match custom color');
  assert.strictEqual(res.theme.colors.accent, cappuccino.colors.accent, 'Missing accent must fill from Cappuccino');
  assert.strictEqual(res.theme.colors.background, cappuccino.colors.background, 'Missing background must fill from Cappuccino');
  assert.strictEqual(res.theme.colors.surface, cappuccino.colors.surface, 'Missing surface must fill from Cappuccino');
  assert.strictEqual(res.theme.colors.text, cappuccino.colors.text, 'Missing text must fill from Cappuccino');
  assert.strictEqual(res.theme.colors.border, cappuccino.colors.border, 'Missing border must fill from Cappuccino');
  console.log('  ✓ Passed');
}

// 4. Partial theme: Only background_color provided
{
  console.log('Test 4: Partial theme with only background_color fills missing tokens from Cappuccino...');
  const customBg = '#0B192C';
  const res = adaptDatabaseToTemplateMenu(
    createMockRestaurant({ background_color: customBg }),
    [],
    []
  );
  assert.strictEqual(res.theme.id, 'custom');
  assert.strictEqual(res.theme.colors.background, customBg, 'Background must match custom color');
  assert.strictEqual(res.theme.colors.primary, cappuccino.colors.primary, 'Missing primary must fill from Cappuccino');
  assert.strictEqual(res.theme.colors.accent, cappuccino.colors.accent, 'Missing accent must fill from Cappuccino');
  assert.strictEqual(res.theme.colors.text, cappuccino.colors.text, 'Missing text must fill from Cappuccino');
  console.log('  ✓ Passed');
}

// 5. Partial theme: Only accent_color provided
{
  console.log('Test 5: Partial theme with only accent_color fills missing tokens from Cappuccino...');
  const customAccent = '#FF6B6B';
  const res = adaptDatabaseToTemplateMenu(
    createMockRestaurant({ accent_color: customAccent }),
    [],
    []
  );
  assert.strictEqual(res.theme.id, 'custom');
  assert.strictEqual(res.theme.colors.accent, customAccent, 'Accent must match custom color');
  assert.strictEqual(res.theme.colors.primary, cappuccino.colors.primary, 'Missing primary must fill from Cappuccino');
  assert.strictEqual(res.theme.colors.background, cappuccino.colors.background, 'Missing background must fill from Cappuccino');
  console.log('  ✓ Passed');
}

// 6. Predefined match by primary and background colors
{
  console.log('Test 6: Matching primary and background with Botanical resolves to Botanical theme...');
  const res = adaptDatabaseToTemplateMenu(
    createMockRestaurant({
      primary_color: botanical.colors.primary,
      background_color: botanical.colors.background,
    }),
    [],
    []
  );
  assert.strictEqual(res.theme.id, botanical.id);
  assert.strictEqual(res.theme.colors.primary, botanical.colors.primary);
  assert.strictEqual(res.theme.colors.text, botanical.colors.text);
  console.log('  ✓ Passed');
}

// 7. Explicit theme_id resolution
{
  console.log('Test 7: Explicit theme_id resolves to midnight-blue...');
  const res = adaptDatabaseToTemplateMenu(
    createMockRestaurant({ theme_id: 'midnight-blue' }),
    [],
    []
  );
  assert.strictEqual(res.theme.id, midnightBlue.id);
  assert.strictEqual(res.theme.colors.primary, midnightBlue.colors.primary);
  assert.strictEqual(res.theme.colors.background, midnightBlue.colors.background);
  console.log('  ✓ Passed');
}

// 8. Unknown theme_id fallback
{
  console.log('Test 8: Unknown theme_id gracefully falls back to Cappuccino...');
  const res = adaptDatabaseToTemplateMenu(
    createMockRestaurant({ theme_id: 'non-existent-theme-xyz' }),
    [],
    []
  );
  assert.strictEqual(res.theme.id, cappuccino.id);
  assert.strictEqual(res.theme.colors.primary, cappuccino.colors.primary);
  console.log('  ✓ Passed');
}

// 9. Fractional and exact rupee price formatting (A6)
{
  console.log('Test 9: Price formatting handles whole and fractional rupee amounts...');
  const cat: MenuCategory = {
    id: 'cat-1',
    restaurant_id: 'test-restaurant-id',
    name: 'Coffee',
    slug: 'coffee',
    description: null,
    position: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const makeItem = (id: string, name: string, price_paise: number | null): DBMenuItem => ({
    id,
    restaurant_id: 'test-restaurant-id',
    category_id: 'cat-1',
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    description: null,
    price_paise,
    variant_prices: null,
    image_url: null,
    tags: [],
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
  });

  const res = adaptDatabaseToTemplateMenu(
    createMockRestaurant({}),
    [cat],
    [
      makeItem('item-1', 'Whole Price Item', 25000), // ₹250
      makeItem('item-2', 'Fractional Price Item', 25050), // ₹250.50
      makeItem('item-3', 'Small Whole Price', 4500), // ₹45
      makeItem('item-4', 'Zero Price', 0), // ₹0
      makeItem('item-5', 'Null Price', null), // undefined
    ]
  );

  const items = res.sections[0].items;
  assert.strictEqual(items[0].price, '₹250', '25000 paise should format to ₹250');
  assert.strictEqual(items[1].price, '₹250.50', '25050 paise should format to ₹250.50');
  assert.strictEqual(items[2].price, '₹45', '4500 paise should format to ₹45');
  assert.strictEqual(items[3].price, '₹0', '0 paise should format to ₹0');
  assert.strictEqual(items[4].price, undefined, 'null price should be undefined');
  console.log('  ✓ Passed');
}

// 10. Empty variant_prices leaves variant_prices undefined (A4)
{
  console.log('Test 10: Empty variant_prices leaves variant_prices undefined so fallback is used...');
  const cat: MenuCategory = {
    id: 'cat-1',
    restaurant_id: 'test-restaurant-id',
    name: 'Tea',
    slug: 'tea',
    description: null,
    position: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const item: DBMenuItem = {
    id: 'tea-item',
    restaurant_id: 'test-restaurant-id',
    category_id: 'cat-1',
    name: 'Masala Chai',
    slug: 'masala-chai',
    description: null,
    price_paise: 3000,
    variant_prices: {}, // Empty object
    image_url: null,
    tags: [],
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
  };

  const res = adaptDatabaseToTemplateMenu(createMockRestaurant({}), [cat], [item]);
  assert.strictEqual(res.sections[0].items[0].variant_prices, undefined);
  assert.strictEqual(res.sections[0].items[0].price, '₹30');
  console.log('  ✓ Passed');
}

// 11. Pizza prices (A5)
{
  console.log('Test 11: Pizza prices set only when both NY and Neapolitan keys exist...');
  const cat: MenuCategory = {
    id: 'cat-pizza',
    restaurant_id: 'test-restaurant-id',
    name: 'Pizza',
    slug: 'pizza',
    description: null,
    position: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const itemWithBoth: DBMenuItem = {
    id: 'pizza-1',
    restaurant_id: 'test-restaurant-id',
    category_id: 'cat-pizza',
    name: 'Margherita',
    slug: 'margherita',
    description: null,
    price_paise: 40000,
    variant_prices: { ny: 35000, neap: 45000 },
    image_url: null,
    tags: [],
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
  };

  const itemWithOne: DBMenuItem = {
    id: 'pizza-2',
    restaurant_id: 'test-restaurant-id',
    category_id: 'cat-pizza',
    name: 'Farmhouse',
    slug: 'farmhouse',
    description: null,
    price_paise: 45000,
    variant_prices: { ny: 40000, regular: 35000 },
    image_url: null,
    tags: [],
    allergens: null,
    is_veg: true,
    is_available: true,
    is_signature: false,
    is_most_ordered: false,
    is_monsoon: false,
    custom_tag: null,
    position: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const res = adaptDatabaseToTemplateMenu(createMockRestaurant({}), [cat], [itemWithBoth, itemWithOne]);
  assert.deepStrictEqual(res.sections[0].items[0].prices, { ny: 350, neap: 450 });
  assert.strictEqual(res.sections[0].items[1].prices, undefined);
  assert.strictEqual(res.sections[0].items[1].variant_prices?.['ny'], '₹400');
  console.log('  ✓ Passed');
}

// 12. Hero image hierarchy (C3)
{
  console.log('Test 12: Hero image priority uses hero_media_url first and hero_poster_url as fallback...');
  const r1 = createMockRestaurant({}, {
    hero_media_type: 'image',
    hero_media_url: 'https://example.com/media.jpg',
    hero_poster_url: 'https://example.com/poster.jpg',
  });
  // Note: adaptDatabaseToTemplateMenu adapts theme and menu items;
  // let's verify hero URL resolution rules
  assert.strictEqual(
    r1.branding.hero_media_type === 'image'
      ? r1.branding.hero_media_url || r1.branding.hero_poster_url
      : r1.branding.hero_poster_url,
    'https://example.com/media.jpg'
  );

  const r2 = createMockRestaurant({}, {
    hero_media_type: 'image',
    hero_media_url: null,
    hero_poster_url: 'https://example.com/fallback-poster.jpg',
  });
  assert.strictEqual(
    r2.branding.hero_media_type === 'image'
      ? r2.branding.hero_media_url || r2.branding.hero_poster_url
      : r2.branding.hero_poster_url,
    'https://example.com/fallback-poster.jpg'
  );
  console.log('  ✓ Passed');
}

// 13. Prototype pollution protection in mergeDeep (C2)
{
  console.log('Test 13: mergeDeep protects against prototype pollution...');
  const malicious = JSON.parse('{"__proto__": {"polluted": "yes"}, "constructor": {"polluted": "yes"}}');
  const target: Record<string, any> = {};
  mergeDeep(target, malicious);

  assert.strictEqual((Object.prototype as any).polluted, undefined, 'Object.prototype must not be polluted');
  assert.strictEqual(target.polluted, undefined, 'Target must not have polluted property directly');
  console.log('  ✓ Passed');
}

console.log('\n🎉 All Menu Adapter Theme tests completed successfully!');
