import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  calculateSiteStatus,
  isSitePubliclyLive,
  shouldShowExpiredNotice,
  resolveTenantBySlug,
} from '../src/lib/tenant/resolver';
import { SiteStatus, Restaurant } from '../src/types/database';

async function runAllTests() {
  console.log('--- STARTING ZAAYKATECH SECURITY & LIFECYCLE TESTS ---');

  // ============================================================================
  // TEST 1: 9-STATE RESTAURANT LIFECYCLE LOGIC
  // ============================================================================
  console.log('\n[TEST 1] Testing Unified 9-State Lifecycle Transitions:');

  const baseRestaurant: Pick<Restaurant, 'status' | 'site_status' | 'trial_ends_at' | 'subscription_end_date'> = {
    status: 'published',
    site_status: 'trialing',
    trial_ends_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    subscription_end_date: null,
  };

  // 1.1 Draft state
  const draftRest = { ...baseRestaurant, status: 'draft' as const, site_status: 'draft' as const };
  assert.strictEqual(calculateSiteStatus(draftRest), 'draft', 'Draft restaurant must have status draft');
  assert.strictEqual(isSitePubliclyLive('draft'), false, 'Draft restaurant must NOT be publicly live');
  assert.strictEqual(shouldShowExpiredNotice('draft'), false, 'Draft restaurant must NOT show expired notice');
  console.log('  ✓ Draft state verified (Not live, Not expired notice)');

  // 1.2 Preview state
  const previewRest = { ...baseRestaurant, status: 'preview' as const, site_status: 'preview' as const };
  assert.strictEqual(calculateSiteStatus(previewRest), 'preview', 'Preview restaurant must have status preview');
  assert.strictEqual(isSitePubliclyLive('preview'), false, 'Preview restaurant must NOT be publicly live');
  console.log('  ✓ Preview state verified (Not live)');

  // 1.3 Trialing state (> 4 hours remaining)
  const trialingRest = {
    ...baseRestaurant,
    status: 'published' as const,
    site_status: 'trialing' as const,
    trial_ends_at: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
  };
  assert.strictEqual(calculateSiteStatus(trialingRest), 'trialing', 'Must be trialing when > 4h left');
  assert.strictEqual(isSitePubliclyLive('trialing'), true, 'Trialing restaurant MUST be publicly live');
  console.log('  ✓ Trialing state verified (Publicly live)');

  // 1.4 Trial Ending state (<= 4 hours remaining)
  const trialEndingRest = {
    ...baseRestaurant,
    status: 'published' as const,
    site_status: 'trialing' as const,
    trial_ends_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  };
  assert.strictEqual(calculateSiteStatus(trialEndingRest), 'trial_ending', 'Must be trial_ending when <= 4h left');
  assert.strictEqual(isSitePubliclyLive('trial_ending'), true, 'Trial ending restaurant MUST be publicly live');
  console.log('  ✓ Trial Ending state verified (Publicly live with urgency indicator)');

  // 1.5 Grace Period state (trial ended < 24h ago)
  const gracePeriodRest = {
    ...baseRestaurant,
    status: 'published' as const,
    site_status: 'trialing' as const,
    trial_ends_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  };
  assert.strictEqual(calculateSiteStatus(gracePeriodRest), 'grace_period', 'Must be grace_period when within 24h after trial');
  assert.strictEqual(isSitePubliclyLive('grace_period'), true, 'Grace period restaurant MUST be publicly live');
  console.log('  ✓ Grace Period state verified (Publicly live)');

  // 1.6 Expired state (trial ended > 24h ago)
  const expiredRest = {
    ...baseRestaurant,
    status: 'published' as const,
    site_status: 'trialing' as const,
    trial_ends_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
  };
  assert.strictEqual(calculateSiteStatus(expiredRest), 'expired', 'Must be expired when grace period ends');
  assert.strictEqual(isSitePubliclyLive('expired'), false, 'Expired restaurant must NOT be publicly live');
  assert.strictEqual(shouldShowExpiredNotice('expired'), true, 'Expired restaurant MUST show ExpiredNotice');
  console.log('  ✓ Expired state verified (Offline, Shows ExpiredNotice)');

  // 1.7 Active Paid Subscription
  const activeRest = {
    ...baseRestaurant,
    status: 'published' as const,
    site_status: 'active' as const,
    subscription_end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  };
  assert.strictEqual(calculateSiteStatus(activeRest), 'active', 'Must be active when paid subscription is valid');
  assert.strictEqual(isSitePubliclyLive('active'), true, 'Active restaurant MUST be publicly live');
  console.log('  ✓ Active paid state verified (Publicly live)');

  // 1.8 Payment Overdue (paid subscription ended within grace period)
  const overdueRest = {
    ...baseRestaurant,
    status: 'published' as const,
    site_status: 'active' as const,
    subscription_end_date: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString().split('T')[0],
  };
  assert.strictEqual(calculateSiteStatus(overdueRest), 'payment_overdue', 'Must be payment_overdue within grace period');
  assert.strictEqual(isSitePubliclyLive('payment_overdue'), false, 'Payment overdue restaurant must NOT be live');
  assert.strictEqual(shouldShowExpiredNotice('payment_overdue'), true, 'Payment overdue MUST show ExpiredNotice');
  console.log('  ✓ Payment Overdue state verified (Offline, Shows ExpiredNotice)');

  // 1.9 Suspended
  const suspendedRest = { ...baseRestaurant, status: 'suspended' as const, site_status: 'suspended' as const };
  assert.strictEqual(calculateSiteStatus(suspendedRest), 'suspended', 'Must be suspended');
  assert.strictEqual(isSitePubliclyLive('suspended'), false, 'Suspended restaurant must NOT be live');
  assert.strictEqual(shouldShowExpiredNotice('suspended'), false, 'Suspended restaurant must NOT show public notice (404)');
  console.log('  ✓ Suspended state verified (Blocked from public view)');

  // ============================================================================
  // TEST 2: DEMO TENANT STRICT PRODUCTION ISOLATION
  // ============================================================================
  console.log('\n[TEST 2] Testing Demo Tenant Fallback Behavior in Production:');

  // Test Production mode:
  (process.env as Record<string, string>).NODE_ENV = 'production';
  const prodResult = await resolveTenantBySlug('demo');
  assert.strictEqual(
    prodResult,
    null,
    'CRITICAL: In NODE_ENV=production, resolveTenantBySlug("demo") MUST return null (404), never demo data!'
  );
  console.log('  ✓ PRODUCTION VERIFIED: resolveTenantBySlug("demo") returns null (triggers 404 in production)');

  const unknownSlugProd = await resolveTenantBySlug('unknown-slug-xyz');
  assert.strictEqual(
    unknownSlugProd,
    null,
    'CRITICAL: In production, unknown slugs must return null (404)'
  );
  console.log('  ✓ PRODUCTION VERIFIED: Unknown slug returns null (404)');

  // Test Development mode:
  (process.env as Record<string, string>).NODE_ENV = 'development';
  delete process.env.NEXT_PUBLIC_SUPABASE_URL; // Simulate local unconfigured dev environment
  const devResult = await resolveTenantBySlug('demo');
  assert.notStrictEqual(devResult, null, 'In development mode, demo slug should return demo tenant');
  assert.strictEqual(devResult?.restaurant.name, 'Cafe 9:50', 'Dev demo should return sample restaurant');
  console.log('  ✓ DEVELOPMENT VERIFIED: Demo tenant operates only as local dev fallback');

  // ============================================================================
  // TEST 3: SQL MIGRATION & RLS AUDIT
  // ============================================================================
  console.log('\n[TEST 3] Auditing SQL Migration for Security Rules:');

  const sqlPath = path.join(__dirname, '../supabase/migrations/20261113000001_core_schema.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // 3.1 Check RLS is enabled on all tables
  const expectedTables = [
    'profiles',
    'restaurants',
    'menu_categories',
    'menu_items',
    'qr_codes',
    'plans',
    'subscriptions',
    'payments',
    'site_analytics',
    'audit_logs',
    'agents',
    'agent_commissions',
    'payouts',
  ];

  for (const table of expectedTables) {
    const rlsRegex = new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`, 'i');
    assert.ok(rlsRegex.test(sqlContent), `Table ${table} must have RLS explicitly enabled`);
  }
  console.log(`  ✓ Verified: RLS enabled on all ${expectedTables.length} tables`);

  // 3.2 Ensure NO public/anon INSERT on site_analytics
  const publicAnalyticsInsert = /CREATE POLICY.*ON site_analytics.*FOR INSERT/i.test(sqlContent);
  assert.strictEqual(
    publicAnalyticsInsert,
    false,
    'CRITICAL SECURITY: site_analytics must NOT have any public/anon INSERT policy!'
  );
  console.log('  ✓ Verified: site_analytics has ZERO public INSERT policies (Service-role only)');

  // 3.3 Ensure NO broad public/anon SELECT on restaurants, menu_categories, menu_items
  const publicRestSelect =
    /CREATE POLICY.*ON restaurants.*FOR SELECT USING \(\s*true\s*\)/i.test(sqlContent) ||
    /CREATE POLICY "Public can view published active restaurants"/i.test(sqlContent);
  assert.strictEqual(
    publicRestSelect,
    false,
    'CRITICAL SECURITY: restaurants must NOT have broad public SELECT policy!'
  );

  const publicCatSelect = /CREATE POLICY "Public can view categories of active restaurants"/i.test(sqlContent);
  assert.strictEqual(
    publicCatSelect,
    false,
    'CRITICAL SECURITY: menu_categories must NOT have broad public SELECT policy!'
  );

  const publicItemSelect = /CREATE POLICY "Public can view items of active restaurants"/i.test(sqlContent);
  assert.strictEqual(
    publicItemSelect,
    false,
    'CRITICAL SECURITY: menu_items must NOT have broad public SELECT policy!'
  );
  console.log('  ✓ Verified: Direct public SELECT policies on restaurants, menu_categories, and menu_items REMOVED');

  // 3.4 Verify published_at has NO default timestamp
  const publishedAtRegex = /published_at\s+TIMESTAMPTZ\s+NULL\s+DEFAULT\s+NULL/i;
  assert.ok(publishedAtRegex.test(sqlContent), 'published_at must be nullable with DEFAULT NULL');
  console.log('  ✓ Verified: published_at is nullable with NO default timestamp');

  // 3.5 Verify subscriptions status check does not contain 'trial'
  const subStatusRegex =
    /status\s+TEXT\s+NOT\s+NULL\s+CHECK\s*\(\s*status\s+IN\s*\('active',\s*'expired',\s*'cancelled',\s*'payment_pending'\)\s*\)/i;
  assert.ok(
    subStatusRegex.test(sqlContent),
    'subscriptions status check must separate trials and only accept real paid statuses'
  );
  console.log('  ✓ Verified: Subscriptions table separated from trial state (No trial status in subscriptions)');

  // 3.6 Verify get_public_restaurant_menu exists with SECURITY DEFINER
  assert.ok(
    sqlContent.includes('CREATE OR REPLACE FUNCTION get_public_restaurant_menu') &&
      sqlContent.includes('SECURITY DEFINER'),
    'get_public_restaurant_menu must be declared with SECURITY DEFINER'
  );
  console.log('  ✓ Verified: Secure stored function get_public_restaurant_menu configured with SECURITY DEFINER');

  console.log('\n--- ALL ZAAYKATECH SECURITY & LIFECYCLE TESTS PASSED (100%) ---\n');
}

runAllTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
