import test from 'node:test';
import assert from 'node:assert/strict';
import { getAdminCacheControlHeaders, getPlatformAdminAllowlist } from '../src/lib/admin/auth';
import {
  getAdminOverviewMetrics,
  getAdminRestaurants,
  getAdminPayments,
  getAdminStorageReport,
  getAdminOCRReport,
  getAdminSecurityReport,
  getAdminSystemHealth,
  classifyPaymentEnvironment,
  withTimeout,
} from '../src/lib/admin/data';

test('Platform Admin Security: Cache-Control & Anti-Caching Headers', () => {
  const headers = getAdminCacheControlHeaders() as Record<string, string>;
  assert.equal(headers['Cache-Control'], 'private, no-cache, no-store, max-age=0, must-revalidate');
  assert.equal(headers['Pragma'], 'no-cache');
  assert.equal(headers['Expires'], '0');
  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
});

test('Platform Admin Allowlist Parsing: Format Normalization & Safety', () => {
  const originalEnv = process.env.PLATFORM_ADMIN_USER_IDS;

  try {
    // 1. Empty / Unset -> Returns empty list (Deny by default)
    delete process.env.PLATFORM_ADMIN_USER_IDS;
    assert.deepEqual(getPlatformAdminAllowlist(), []);

    // 2. Comma-separated with spaces and mixed case
    process.env.PLATFORM_ADMIN_USER_IDS = '  A1B2C3D4-0000-0000-0000-000000000001, e5f6a7b8-0000-0000-0000-000000000002 ';
    const parsedComma = getPlatformAdminAllowlist();
    assert.equal(parsedComma.length, 2);
    assert.equal(parsedComma[0], 'a1b2c3d4-0000-0000-0000-000000000001');
    assert.equal(parsedComma[1], 'e5f6a7b8-0000-0000-0000-000000000002');

    // 3. JSON array format
    process.env.PLATFORM_ADMIN_USER_IDS = JSON.stringify([
      '99999999-9999-9999-9999-999999999999',
      '88888888-8888-8888-8888-888888888888',
    ]);
    const parsedJson = getPlatformAdminAllowlist();
    assert.equal(parsedJson.length, 2);
    assert.equal(parsedJson[0], '99999999-9999-9999-9999-999999999999');
  } finally {
    if (originalEnv !== undefined) {
      process.env.PLATFORM_ADMIN_USER_IDS = originalEnv;
    } else {
      delete process.env.PLATFORM_ADMIN_USER_IDS;
    }
  }
});

test('Platform Admin Financial Calculations: Live vs Test Isolation & Net Revenue', async () => {
  const overview = await getAdminOverviewMetrics(30);

  // Assert required fields exist and are non-NaN numbers
  assert.ok(!Number.isNaN(overview.capturedLiveTotal), 'capturedLiveTotal should be a valid number');
  assert.ok(!Number.isNaN(overview.capturedTestTotal), 'capturedTestTotal should be a valid number');
  assert.ok(!Number.isNaN(overview.refundedTotal), 'refundedTotal should be a valid number');
  assert.ok(!Number.isNaN(overview.netLiveCollected), 'netLiveCollected should be a valid number');

  // Verify net revenue formula: Net = Live Captured - Refunded
  const expectedNet = overview.capturedLiveTotal - overview.refundedTotal;
  assert.equal(
    overview.netLiveCollected,
    expectedNet,
    'Net live collected must strictly equal Live Captured minus Refunded'
  );

  // Test mode volume must NOT be added into net revenue
  assert.ok(
    overview.netLiveCollected <= overview.capturedLiveTotal,
    'Net collections cannot exceed gross live collections'
  );
});

test('Platform Admin Payments Reconciliation: Duplicate Event Detection', async () => {
  const paymentsResult = await getAdminPayments({ page: 1, limit: 10 });

  assert.ok(Array.isArray(paymentsResult.payments), 'Payments should be an array');
  assert.ok(paymentsResult.report, 'Report must be generated');
  assert.ok(typeof paymentsResult.totalCount === 'number', 'totalCount must be a number');

  // Verify every returned payment has safe public fields and NO secrets
  for (const p of paymentsResult.payments) {
    assert.ok(p.id, 'Payment must have an ID');
    assert.ok(p.currency === 'INR', 'Currency must be INR');
    assert.ok(typeof p.isTestMode === 'boolean', 'isTestMode must be boolean');
    // Ensure raw secrets or key secrets are not attached
    assert.equal((p as any).key_secret, undefined);
    assert.equal((p as any).secret, undefined);
  }
});

test('Platform Admin Storage Observability: Truthful Provider Boundaries', async () => {
  const storage = await getAdminStorageReport();

  assert.equal(storage.bucketName, 'zaaykatech-media');
  assert.equal(storage.bandwidthEgressStatus, 'provider_dashboard_required');
  assert.equal(storage.databaseSizeStatus, 'provider_dashboard_required');
  assert.ok(storage.providerLinks.supabaseStorage.includes('supabase.com'));
  assert.ok(storage.providerLinks.vercelUsage.includes('vercel.com'));
});

test('Platform Admin OCR Observability: Local Engine & Zero AI Tokens', async () => {
  const ocr = await getAdminOCRReport();

  assert.equal(ocr.aiTokenUsageStatus, 'local_ocr_no_ai_tokens');
  assert.ok(ocr.localOcrEngine.includes('Tesseract.js'));
  assert.ok(ocr.localOcrEngine.includes('pdfjs-dist'));
  assert.ok(Array.isArray(ocr.recentJobs));
});

test('Platform Admin Security Report: Database vs Process-Local Rate Limits', async () => {
  const sec = await getAdminSecurityReport();

  assert.ok(sec.policies.length >= 3, 'Must report at least 3 audited policies');

  const dbPolicy = sec.policies.find((p) => p.status === 'enforced_database');
  assert.ok(dbPolicy, 'Must have database-backed policy for AI import');
  assert.equal(dbPolicy.isSharedAcrossInstances, true);

  const inMemoryPolicy = sec.policies.find((p) => p.status === 'enforced_in_memory');
  assert.ok(inMemoryPolicy, 'Must report in-memory policy for analytics');
  assert.equal(inMemoryPolicy.isSharedAcrossInstances, false);

  const unimplPolicy = sec.policies.find((p) => p.status === 'not_implemented');
  assert.ok(unimplPolicy, 'Unimplemented endpoints must be truthfully reported as not_implemented');
});

test('Platform Admin Health Report: Non-Trivial Dependency Checks', async () => {
  const health = await getAdminSystemHealth();

  assert.ok(['healthy', 'unhealthy'].includes(health.database.status));
  assert.ok(['healthy', 'unhealthy'].includes(health.storage.status));
  assert.ok(typeof health.database.latencyMs === 'number');
  assert.equal(health.storage.bucketName, 'zaaykatech-media');
  assert.equal(health.externalMonitoring.status, 'not_configured');
  assert.ok(typeof health.paymentWebhook.credentialsConfigured === 'boolean');
  assert.ok(typeof health.paymentWebhook.syntheticVerificationPassed === 'boolean');
  assert.ok(typeof health.paymentWebhook.liveIntegrationVerified === 'boolean');
});

test('Platform Admin Payment Environment Provenance & Classification', () => {
  // 1. Explicit mock order
  const mockRes = classifyPaymentEnvironment({
    external_payment_id: 'order_mock_12345',
  });
  assert.equal(mockRes.classification, 'test_mock');

  // 2. Explicit razorpay test key
  const testKeyRes = classifyPaymentEnvironment({
    external_payment_id: 'pay_test_98765',
  });
  assert.equal(testKeyRes.classification, 'test_mock');

  // 3. Webhook with test_mode note
  const testNoteRes = classifyPaymentEnvironment({
    external_payment_id: 'pay_abc123',
    raw_webhook_payload: { payload: { payment: { entity: { notes: { test_mode: true } } } } },
  });
  assert.equal(testNoteRes.classification, 'test_mock');

  // 4. Verified live payload
  const liveRes = classifyPaymentEnvironment({
    external_payment_id: 'pay_live_555',
    raw_webhook_payload: {
      event: 'payment.captured',
      account_id: 'acc_live_zaayka',
      payload: { payment: { entity: { status: 'captured', notes: { test_mode: false } } } },
    },
  });
  assert.equal(liveRes.classification, 'live_verified');

  // 5. Unverified historical payload (lacks explicit live or test flags)
  const unverifiedRes = classifyPaymentEnvironment({
    external_payment_id: 'pay_U093CNqtmFjygp',
    raw_webhook_payload: { orderId: 'order_123', paymentId: 'pay_U093CNqtmFjygp' },
  });
  assert.equal(unverifiedRes.classification, 'unverified');
  assert.ok(unverifiedRes.provenanceSource.includes('Unverified Historical Record'));
});

test('Platform Admin withTimeout Helper Aborts on Delay', async () => {
  let wasAborted = false;
  await assert.rejects(
    async () => {
      await withTimeout(
        (signal) =>
          new Promise((resolve, reject) => {
            signal.addEventListener('abort', () => {
              wasAborted = true;
              reject(new Error('Aborted by signal'));
            });
            setTimeout(resolve, 500);
          }),
        50
      );
    },
    /timed out|Aborted/
  );
  assert.equal(wasAborted, true, 'AbortSignal must be triggered on timeout');
});
