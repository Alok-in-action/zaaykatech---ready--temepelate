import assert from 'node:assert';
import { adaptDatabaseToTemplateMenu } from '../src/lib/tenant/menu-adapter';
import { PREDEFINED_THEMES } from '../src/lib/themes/predefinedThemes';
import { Restaurant } from '../src/types/database';

function createMockRestaurant(themeOverride: any): Restaurant {
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

console.log('\n🎉 All Menu Adapter Theme tests completed successfully!');
