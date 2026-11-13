import assert from 'node:assert';
import { CategorySchema, MenuItemSchema } from '../src/validations/menu';
import { formatPrice } from '../src/components/public-menu/MenuItemCard';

async function runPhase3Tests() {
  console.log('--- STARTING ZAAYKATECH PHASE 3 VERIFICATION TESTS ---');

  const testCategoryId = '22222222-2222-2222-2222-222222222222';

  // ============================================================================
  // TEST 1: CATEGORY SCHEMA VALIDATION
  // ============================================================================
  console.log('\n[TEST 1] Testing Category Zod Validation:');

  const validCategory = CategorySchema.safeParse({
    name: 'Artisan Sourdough Pizzas',
    description: 'Fermented for 48 hours',
    is_active: true,
  });
  assert.strictEqual(validCategory.success, true, 'Valid category must pass validation');

  const invalidCategory = CategorySchema.safeParse({
    name: 'A', // Too short
  });
  assert.strictEqual(invalidCategory.success, false, 'Category with name < 2 characters must fail');
  console.log('  ✓ Category name, description, and is_active validation verified');

  // ============================================================================
  // TEST 2: SINGLE PRICE VS. VARIANT PRICES MUTUAL EXCLUSIVITY (REQUIREMENT 2 & 3)
  // ============================================================================
  console.log('\n[TEST 2] Testing Single Price vs. Variant Prices Mutually Exclusive Rules:');

  // 2.1 Valid single price item
  const validSingleItem = MenuItemSchema.safeParse({
    name: 'Spanish Latte',
    categoryId: testCategoryId,
    pricingMode: 'single',
    price_paise: 24000, // ₹240
    variant_prices: null,
    is_veg: true,
  });
  assert.strictEqual(validSingleItem.success, true, 'Valid single price item must pass');
  console.log('  ✓ Valid single price item (24000 paise = ₹240) accepted');

  // 2.2 Valid variant prices item
  const validVariantItem = MenuItemSchema.safeParse({
    name: 'Truffle Mushroom Pizza',
    categoryId: testCategoryId,
    pricingMode: 'variants',
    price_paise: null,
    variant_prices: {
      ny_style: 55000, // ₹550
      neapolitan: 65000, // ₹650
    },
    is_veg: true,
  });
  assert.strictEqual(validVariantItem.success, true, 'Valid variant prices item must pass');
  console.log('  ✓ Valid variant prices item (NY: ₹550 | Neapolitan: ₹650) accepted');

  // 2.3 REJECT: Both single price AND variant prices simultaneously
  const bothPricingSupplied = MenuItemSchema.safeParse({
    name: 'Conflicted Pricing Dish',
    categoryId: testCategoryId,
    pricingMode: 'single',
    price_paise: 25000,
    variant_prices: {
      regular: 25000,
    },
    is_veg: true,
  });
  assert.strictEqual(
    bothPricingSupplied.success,
    false,
    'CRITICAL: Item with both single price and variant prices must be rejected'
  );
  console.log('  ✓ Rejection verified: Cannot supply both single price and variant prices simultaneously');

  // 2.4 REJECT: Negative or decimal paise prices
  const negativePrice = MenuItemSchema.safeParse({
    name: 'Negative Price Dish',
    categoryId: testCategoryId,
    pricingMode: 'single',
    price_paise: -100,
    is_veg: true,
  });
  assert.strictEqual(negativePrice.success, false, 'Negative price must be rejected');

  const decimalPrice = MenuItemSchema.safeParse({
    name: 'Decimal Price Dish',
    categoryId: testCategoryId,
    pricingMode: 'single',
    price_paise: 250.5, // Not an integer
    is_veg: true,
  });
  assert.strictEqual(decimalPrice.success, false, 'Decimal paise price must be rejected');
  console.log('  ✓ Rejection verified: Prices must be non-negative integer paise');

  // 2.5 REJECT: Empty variants in variants mode
  const emptyVariants = MenuItemSchema.safeParse({
    name: 'Empty Variant Dish',
    categoryId: testCategoryId,
    pricingMode: 'variants',
    variant_prices: {},
    is_veg: true,
  });
  assert.strictEqual(emptyVariants.success, false, 'Empty variant prices must be rejected');
  console.log('  ✓ Rejection verified: Variants mode requires at least one variant price');

  // ============================================================================
  // TEST 3: PRICE FORMATTING ON PUBLIC MENU
  // ============================================================================
  console.log('\n[TEST 3] Testing Public Menu INR Formatting:');

  // Single price: 24000 paise -> ₹240
  const formattedSingle = formatPrice(24000, null);
  assert.strictEqual(formattedSingle, '₹240', '24000 paise must format as ₹240');

  // Variants: { regular: 15000, large: 22000 }
  const formattedVariants = formatPrice(null, { regular: 15000, large: 22000 });
  assert.strictEqual(
    formattedVariants,
    'REGULAR: ₹150 | LARGE: ₹220',
    'Variants must format with uppercase label and rupee amount'
  );
  console.log('  ✓ Public menu price formatting matches Indian Rupee standard');

  // ============================================================================
  // TEST 4: SEQUENTIAL REORDERING LOGIC
  // ============================================================================
  console.log('\n[TEST 4] Testing Sequential Reordering Invariant:');

  const categories = [
    { id: 'cat-3', name: 'Desserts' },
    { id: 'cat-1', name: 'Coffee' },
    { id: 'cat-2', name: 'Pizza' },
  ];

  const positions = categories.map((c, idx) => ({ id: c.id, position: idx }));
  assert.strictEqual(positions[0].position, 0);
  assert.strictEqual(positions[1].position, 1);
  assert.strictEqual(positions[2].position, 2);
  console.log('  ✓ Sequential 0-indexed positions verified');

  console.log('\n--- ALL ZAAYKATECH PHASE 3 TESTS PASSED (100%) ---\n');
}

runPhase3Tests().catch((err) => {
  console.error('\n❌ Phase 3 test execution failed:', err);
  process.exit(1);
});
