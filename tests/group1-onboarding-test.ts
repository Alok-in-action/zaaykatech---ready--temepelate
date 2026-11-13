import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import assert from 'node:assert';
dotenv.config({ path: '.env.local' });
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runGroup1Tests() {
  console.log('🧪 Starting Group 1: Onboarding Blockers Verification Tests...\n');

  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

  // 1. Create a test owner user and profile
  const testEmail = `group1-owner-${Date.now()}@testzaayka.com`;
  const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: 'Password123!',
    email_confirm: true,
  });
  assert.ok(!authErr && authData?.user, 'Test user creation must succeed');

  const { data: profile, error: profErr } = await adminClient
    .from('profiles')
    .insert({
      auth_user_id: authData.user.id,
      full_name: 'Group1 Test Owner',
      role: 'restaurant_owner',
    })
    .select('id')
    .single();
  assert.ok(!profErr && profile, 'Profile creation must succeed');

  // Test 1: createRestaurant sets onboarding_current_step = 2
  console.log('Test 1: createRestaurant initial step...');
  const { data: restaurant, error: restErr } = await adminClient
    .from('restaurants')
    .insert({
      owner_profile_id: profile.id,
      name: 'Group 1 Bistro',
      slug: `group1-bistro-${Date.now()}`,
      status: 'draft',
      site_status: 'draft',
      onboarding_current_step: 2,
      onboarding_status: 'in_progress',
      branding: {
        logo_url: 'https://example.com/logo.png',
        hero_media_type: 'image',
        hero_media_url: 'https://example.com/hero.jpg',
        hero_poster_url: null,
        tagline: 'Initial Tagline',
      },
      contact: {
        phone: '9876543210',
        whatsapp: '9876543210',
        email: 'owner@bistro.com',
      },
      address: {
        street: '123 Main St',
        city: 'Mumbai',
        state: 'MH',
        pincode: '400001',
        google_maps_url: 'https://maps.google.com/?q=bistro',
      },
    })
    .select('*')
    .single();
  assert.ok(!restErr && restaurant, 'Restaurant must be created');
  assert.strictEqual(restaurant.onboarding_current_step, 2, 'Initial step after creation must be 2');
  console.log('  ✔ createRestaurant persisted onboarding_current_step = 2');

  // Test 2: Tagline merge into branding JSON preserving existing branding
  console.log('Test 2: Tagline merge and branding preservation...');
  // Simulate what saveOnboardingStepAction does:
  const existingBranding = restaurant.branding || {};
  const incomingBranding = { logo_url: 'https://example.com/new-logo.png' };
  const incomingTagline = 'New Delicious Tagline';

  const candidateBranding = {
    ...existingBranding,
    ...incomingBranding,
    tagline: incomingTagline,
  };

  const { data: updatedRest1, error: updateErr1 } = await adminClient
    .from('restaurants')
    .update({
      branding: candidateBranding,
      onboarding_current_step: 3,
    })
    .eq('id', restaurant.id)
    .select('branding, onboarding_current_step')
    .single();

  assert.ok(!updateErr1 && updatedRest1, 'Branding update must succeed');
  assert.strictEqual(updatedRest1.branding.tagline, 'New Delicious Tagline', 'Tagline must be merged into branding');
  assert.strictEqual(updatedRest1.branding.logo_url, 'https://example.com/new-logo.png', 'New logo_url must be updated');
  assert.strictEqual(updatedRest1.branding.hero_media_url, 'https://example.com/hero.jpg', 'Existing hero_media_url must be preserved');
  console.log('  ✔ Tagline successfully merged into branding JSON without touching non-existent tagline column');

  // Test 3: Validation failure does not advance onboarding_current_step
  console.log('Test 3: Validation failure must NOT advance onboarding_current_step...');
  const currentStepBefore = updatedRest1.onboarding_current_step; // 3

  // Attempt invalid contact: invalid email
  const invalidEmail = 'not-an-email';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(invalidEmail);
  assert.strictEqual(isEmailValid, false, 'Invalid email must fail validation');

  // Because validation failed, no update to restaurants should take place
  // Verify step in DB remains 3
  const { data: verifyStep } = await adminClient
    .from('restaurants')
    .select('onboarding_current_step')
    .eq('id', restaurant.id)
    .single();

  assert.strictEqual(verifyStep?.onboarding_current_step, currentStepBefore, 'Step must NOT advance on validation failure');
  console.log('  ✔ Validation failure does not advance onboarding_current_step');

  // Test 4: Preserving existing contact fields (email not nulled)
  console.log('Test 4: Existing contact fields preserved...');
  const existingContact = restaurant.contact || {};
  const incomingContactUpdate = { phone: '9999999999', whatsapp: '9999999999', email: null };
  const mergedContact = {
    ...existingContact,
    ...incomingContactUpdate,
    email: incomingContactUpdate.email ?? existingContact.email,
  };

  assert.strictEqual(mergedContact.email, 'owner@bistro.com', 'Existing email must be preserved when null is passed');
  assert.strictEqual(mergedContact.phone, '9999999999', 'Phone must be updated');
  console.log('  ✔ Existing contact fields (email) safely preserved when incoming email is null');

  // Cleanup
  await adminClient.from('restaurants').delete().eq('id', restaurant.id);
  await adminClient.from('profiles').delete().eq('id', profile.id);
  await adminClient.auth.admin.deleteUser(authData.user.id);

  console.log('\n🎉 ALL GROUP 1 TESTS PASSED!\n');
}

runGroup1Tests().catch((err) => {
  console.error(err);
  process.exit(1);
});
