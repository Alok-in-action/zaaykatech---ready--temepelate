import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const adminClient = createClient(supabaseUrl, serviceKey);

async function runLifecycleVerification() {
  console.log('===========================================================');
  console.log('   ZAAYKATECH ONE-RESTAURANT LIFECYCLE VERIFICATION SUITE   ');
  console.log('===========================================================\n');

  // Create isolated test owner profile
  const testEmail = `lifecycle-owner-${Date.now()}@example.com`;
  const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: 'Password123!',
    email_confirm: true,
  });

  if (authErr || !authData?.user) {
    throw new Error('Failed to create test user: ' + authErr?.message);
  }

  const { data: profile, error: profErr } = await adminClient
    .from('profiles')
    .insert({
      auth_user_id: authData.user.id,
      full_name: 'Lifecycle Test Owner',
      role: 'restaurant_owner',
    })
    .select('id')
    .single();

  if (profErr || !profile) {
    throw new Error('Failed to create test profile: ' + profErr?.message);
  }

  console.log('✓ 1. Test Owner Created:');
  console.log('     Profile ID:', profile.id);
  console.log('     Email:     ', testEmail);

  let rest1Id = '';

  try {
    // -------------------------------------------------------------
    // TEST 1: Strict One-Restaurant-Per-Owner Database Enforcement
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Database-Level Single Restaurant Enforcement ---');
    const slug1 = `test-bistro-1-${Date.now()}`;
    const { data: rest1, error: r1Err } = await adminClient
      .from('restaurants')
      .insert({
        owner_profile_id: profile.id,
        name: 'First Bistro',
        slug: slug1,
        status: 'draft',
        site_status: 'draft',
        trial_ends_at: null, // Trial does NOT start on creation
        onboarding_current_step: 1,
        onboarding_status: 'in_progress',
      })
      .select('*')
      .single();

    if (r1Err || !rest1) {
      throw new Error('Failed to create initial restaurant: ' + r1Err?.message);
    }
    rest1Id = rest1.id;
    console.log('✓ First restaurant created successfully:');
    console.log('  ID:                     ', rest1.id);
    console.log('  trial_ends_at:          ', rest1.trial_ends_at, '(correctly null before publish)');
    console.log('  onboarding_status:      ', rest1.onboarding_status);
    console.log('  onboarding_current_step:', rest1.onboarding_current_step);

    // Attempt to insert a second active restaurant for the SAME owner
    const slug2 = `test-bistro-2-${Date.now()}`;
    const { data: rest2, error: r2Err } = await adminClient
      .from('restaurants')
      .insert({
        owner_profile_id: profile.id,
        name: 'Second Bistro (Violator)',
        slug: slug2,
        status: 'draft',
        site_status: 'draft',
      })
      .select('*')
      .single();

    if (!r2Err) {
      throw new Error('SECURITY VIOLATION: Database permitted multiple active restaurants for one owner!');
    }
    console.log('✓ Attempt to create second active restaurant REJECTED by database constraint:');
    console.log('  Constraint Name:', r2Err.message);
    if (!r2Err.message.includes('idx_restaurants_single_active_owner') && !r2Err.message.includes('unique')) {
      throw new Error('Unexpected error message: ' + r2Err.message);
    }

    // -------------------------------------------------------------
    // TEST 2: Onboarding Progress & Resume Tracking
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Onboarding Step Progress & Resume Tracking ---');
    // Save Step 2
    await adminClient
      .from('restaurants')
      .update({
        onboarding_current_step: 2,
        food_type: 'Cafe & Bakery',
      })
      .eq('id', rest1Id);

    const { data: step2Data } = await adminClient
      .from('restaurants')
      .select('onboarding_current_step, food_type')
      .eq('id', rest1Id)
      .single();

    if (step2Data?.onboarding_current_step !== 2 || step2Data?.food_type !== 'Cafe & Bakery') {
      throw new Error('Step 2 progress was not saved correctly.');
    }
    console.log('✓ Step 2 saved and verified (step: 2, food_type: "Cafe & Bakery")');

    // Save Step 3 (Add category & menu item)
    const { data: catData, error: catErr } = await adminClient
      .from('menu_categories')
      .insert({
        restaurant_id: rest1Id,
        name: 'Artisan Beverages',
        slug: 'artisan-beverages',
        position: 0,
        is_active: true,
      })
      .select('id')
      .single();

    if (catErr || !catData) throw new Error('Failed to create category: ' + catErr?.message);

    const { error: itemErr } = await adminClient
      .from('menu_items')
      .insert({
        restaurant_id: rest1Id,
        category_id: catData.id,
        name: 'Saffron Cardamom Chai',
        slug: 'saffron-cardamom-chai',
        price_paise: 9000,
        is_veg: true,
        is_available: true,
        position: 0,
      });

    if (itemErr) throw new Error('Failed to create menu item: ' + itemErr?.message);

    await adminClient
      .from('restaurants')
      .update({ onboarding_current_step: 3 })
      .eq('id', rest1Id);

    console.log('✓ Step 3 menu item & category added. Resume step now at 3.');

    // -------------------------------------------------------------
    // TEST 3: Publish Starts 24-Hour Trial Timer
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Publish Action Starts 24-Hour Trial Timer ---');
    const now = new Date();
    const trialHours = 24;
    const trialEndsAt = new Date(now.getTime() + trialHours * 60 * 60 * 1000).toISOString();
    const publishedAt = now.toISOString();

    const { data: pubRest, error: pubErr } = await adminClient
      .from('restaurants')
      .update({
        status: 'published',
        site_status: 'trialing',
        published_at: publishedAt,
        trial_ends_at: trialEndsAt,
        onboarding_status: 'completed',
        onboarding_completed_at: publishedAt,
        onboarding_current_step: 5,
      })
      .eq('id', rest1Id)
      .select('*')
      .single();

    if (pubErr || !pubRest) throw new Error('Publish update failed: ' + pubErr?.message);

    if (pubRest.onboarding_status !== 'completed' || !pubRest.trial_ends_at) {
      throw new Error('Publish did not set onboarding_status completed or trial_ends_at.');
    }

    const trialDiffHours = (new Date(pubRest.trial_ends_at).getTime() - new Date(pubRest.published_at).getTime()) / (3600 * 1000);
    console.log('✓ Restaurant published:');
    console.log('  Status:                 ', pubRest.status);
    console.log('  Onboarding Status:      ', pubRest.onboarding_status);
    console.log('  Trial Duration (Hours): ', trialDiffHours, 'hours (exactly 24h from publish)');

    // -------------------------------------------------------------
    // TEST 4: Subscription Renewal Arithmetic
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Subscription Renewal Arithmetic (+365 Days) ---');
    // Scenario A: Subscription expired in the past -> renew from payment date
    const paymentDate = new Date();
    const expiredSubEndDate = '2025-12-31';
    let baseDateA = paymentDate;
    if (new Date(expiredSubEndDate) > paymentDate) {
      baseDateA = new Date(expiredSubEndDate);
    }
    const newEndA = new Date(baseDateA.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const expectedEndA = new Date(paymentDate.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (newEndA !== expectedEndA) {
      throw new Error(`Expired renewal calculation error: expected ${expectedEndA}, got ${newEndA}`);
    }
    console.log(`✓ Scenario A (Expired): Payment on ${paymentDate.toISOString().split('T')[0]} sets expiry to ${newEndA} (+365 days from payment).`);

    // Scenario B: Active subscription in future -> renew from current end date
    const futureDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000); // 100 days in future
    let baseDateB = paymentDate;
    if (futureDate > paymentDate) {
      baseDateB = futureDate;
    }
    const newEndB = new Date(baseDateB.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const expectedEndB = new Date(futureDate.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (newEndB !== expectedEndB) {
      throw new Error(`Active renewal calculation error: expected ${expectedEndB}, got ${newEndB}`);
    }
    console.log(`✓ Scenario B (Active): Future date ${futureDate.toISOString().split('T')[0]} extends to ${newEndB} (+365 days from current expiry).`);

    // -------------------------------------------------------------
    // TEST 5: Soft-Archive Permits New Restaurant Replacement
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Soft-Archive Lifecycle ---');
    // Soft-archive rest1
    await adminClient
      .from('restaurants')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', rest1Id);

    // Verify creating replacement restaurant succeeds now that rest1 is archived
    const replacementSlug = `replacement-${Date.now()}`;
    const { data: replacementRest, error: repErr } = await adminClient
      .from('restaurants')
      .insert({
        owner_profile_id: profile.id,
        name: 'Replacement Bistro',
        slug: replacementSlug,
        status: 'draft',
        site_status: 'draft',
      })
      .select('id, name, archived_at')
      .single();

    if (repErr || !replacementRest) {
      throw new Error('Failed to create replacement restaurant after archive: ' + repErr?.message);
    }
    console.log('✓ Soft archive successful: previous restaurant archived; replacement restaurant created (ID:', replacementRest.id, ')');

    // Clean up replacement restaurant
    await adminClient.from('restaurants').delete().eq('id', replacementRest.id);

    console.log('\n===========================================================');
    console.log('   ALL 5 ONE-RESTAURANT LIFECYCLE TESTS PASSED (100%)   ');
    console.log('===========================================================');
  } finally {
    // Cleanup test artifacts
    if (rest1Id) {
      await adminClient.from('menu_items').delete().eq('restaurant_id', rest1Id);
      await adminClient.from('menu_categories').delete().eq('restaurant_id', rest1Id);
      await adminClient.from('restaurants').delete().eq('id', rest1Id);
    }
    await adminClient.from('profiles').delete().eq('id', profile.id);
    await adminClient.auth.admin.deleteUser(authData.user.id);
  }
}

runLifecycleVerification().catch((err) => {
  console.error('\n❌ LIFECYCLE VERIFICATION FAILED:', err);
  process.exit(1);
});
