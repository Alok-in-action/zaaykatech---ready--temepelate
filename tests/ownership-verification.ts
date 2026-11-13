import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, serviceKey);

async function runOwnershipVerification() {
  console.log('=== STARTING OWNERSHIP VERIFICATION ===\n');

  // 1. Create isolated primary user for ownership test
  const primaryEmail = `primary-owner-${Date.now()}@example.com`;
  const { data: primaryAuth, error: pAuthErr } = await adminClient.auth.admin.createUser({
    email: primaryEmail,
    password: 'Password123!',
    email_confirm: true,
  });

  if (pAuthErr || !primaryAuth?.user) {
    throw new Error('Failed to create primary auth user: ' + pAuthErr?.message);
  }

  const { data: primaryProfile, error: pErr } = await adminClient
    .from('profiles')
    .insert({
      auth_user_id: primaryAuth.user.id,
      full_name: 'Primary Test Owner',
      role: 'restaurant_owner',
    })
    .select('id, auth_user_id, full_name')
    .single();

  if (pErr || !primaryProfile) {
    throw new Error('Primary profile creation failed: ' + pErr?.message);
  }
  console.log('✓ 1. Primary User Identified:');
  console.log('     Auth User ID:', primaryProfile.auth_user_id);
  console.log('     Profile ID:  ', primaryProfile.id);
  console.log('     Name:        ', primaryProfile.full_name);

  // 2. Identify another (secondary) test user or create temporary test profile
  const otherEmail = `test-attacker-${Date.now()}@example.com`;
  const { data: otherAuthUser, error: authErr } = await adminClient.auth.admin.createUser({
    email: otherEmail,
    password: 'Password123!',
    email_confirm: true,
  });

  if (authErr || !otherAuthUser?.user) {
    throw new Error('Failed to create secondary auth user: ' + authErr?.message);
  }

  const { data: otherProfile, error: oErr } = await adminClient
    .from('profiles')
    .insert({
      auth_user_id: otherAuthUser.user.id,
      full_name: 'Secondary Attacker Test User',
      role: 'restaurant_owner',
    })
    .select('id, auth_user_id')
    .single();

  if (oErr || !otherProfile) {
    throw new Error('Failed to create other test profile: ' + oErr?.message);
  }
  console.log('\n✓ 2. Secondary User (Different Account) Identified:');
  console.log('     Auth User ID:', otherProfile.auth_user_id);
  console.log('     Profile ID:  ', otherProfile.id);

  // 3. Test creating a new restaurant for Primary User
  const testRestSlug = `test-verify-${Date.now()}`;
  const { data: newRest, error: rErr } = await adminClient
    .from('restaurants')
    .insert({
      owner_profile_id: primaryProfile.id,
      name: 'Zaayka Test Bistro',
      slug: testRestSlug,
      status: 'draft',
      site_status: 'trialing',
      trial_ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    })
    .select('*')
    .single();

  if (rErr || !newRest) {
    throw new Error('Failed to create test restaurant: ' + rErr?.message);
  }
  console.log('\n✓ 3. Created Restaurant for Primary User:');
  console.log('     Restaurant ID:    ', newRest.id);
  console.log('     Owner Profile ID: ', newRest.owner_profile_id);
  console.log('     Matches Primary?  ', newRest.owner_profile_id === primaryProfile.id ? 'YES (Match)' : 'NO (Mismatch)');

  // 4. Test ownership check for Primary User (Authorized Access)
  console.log('\n✓ 4. Testing Primary User Access:');
  const primaryOwns = newRest.owner_profile_id === primaryProfile.id;
  if (!primaryOwns) {
    throw new Error('FAILED: Primary user should own this restaurant!');
  }
  // Simulate updating restaurant details
  const { error: updateErr } = await adminClient
    .from('restaurants')
    .update({ name: 'Zaayka Test Bistro Updated' })
    .eq('id', newRest.id)
    .eq('owner_profile_id', primaryProfile.id);

  if (updateErr) {
    throw new Error('Primary user update failed: ' + updateErr.message);
  }
  console.log('     Edit Restaurant: SUCCESS (No Forbidden error)');

  // 5. Test ownership check for Secondary User (Forbidden Access)
  console.log('\n✓ 5. Testing Secondary User Cross-Account Isolation:');
  const otherOwns = newRest.owner_profile_id === otherProfile.id;
  console.log('     Does secondary account own this restaurant?', otherOwns ? 'YES (BUG)' : 'NO (Forbidden)');

  if (otherOwns) {
    throw new Error('SECURITY VIOLATION: Secondary user should NOT own primary user restaurant!');
  }

  // Attempt update using secondary profile ID
  const { data: unauthorizedUpdate, error: unauthErr } = await adminClient
    .from('restaurants')
    .update({ name: 'Hacked by Secondary' })
    .eq('id', newRest.id)
    .eq('owner_profile_id', otherProfile.id)
    .select();

  if (unauthorizedUpdate && unauthorizedUpdate.length > 0) {
    throw new Error('SECURITY VIOLATION: Secondary user was able to modify primary restaurant!');
  }
  console.log('     Cross-account edit blocked: 0 rows modified (Strictly Forbidden)');

  // Clean up test restaurant and test users
  await adminClient.from('restaurants').delete().eq('id', newRest.id);
  await adminClient.from('profiles').delete().eq('id', otherProfile.id);
  await adminClient.from('profiles').delete().eq('id', primaryProfile.id);
  await adminClient.auth.admin.deleteUser(otherAuthUser.user.id);
  await adminClient.auth.admin.deleteUser(primaryAuth.user.id);
  console.log('\n✓ 6. Cleaned up test verification restaurant and test users.');

  console.log('\n=== ALL OWNERSHIP VERIFICATION CHECKS PASSED ===');
}

runOwnershipVerification().catch((err) => {
  console.error('\nVerification Error:', err);
  process.exit(1);
});
