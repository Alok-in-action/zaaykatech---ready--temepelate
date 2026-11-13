import assert from 'node:assert';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { POST as createOrderRoute } from '../src/app/api/create-order/route';
import { POST as verifyPaymentRoute } from '../src/app/api/verify-payment/route';
import { POST as webhookRoute } from '../src/app/api/webhooks/razorpay/route';
import { GET as healthRoute } from '../src/app/api/health/route';
import { NextRequest } from 'next/server';

function createMockRequest(url: string, body: any, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

async function runRazorpayVerificationTests() {
  console.log('================================================================');
  console.log('   RAZORPAY STANDARD WEB CHECKOUT VERIFICATION TESTS');
  console.log('================================================================\n');

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'placeholder_razorpay_webhook_secret';

  // ---------------------------------------------------------------------------
  // TEST 1: ENVIRONMENT & CREDENTIAL HYGIENE
  // ---------------------------------------------------------------------------
  console.log('[TEST 1] Verifying Environment Variables & Security Hygiene:');
  assert.ok(keyId && keyId.startsWith('rzp_test_'), 'RAZORPAY_KEY_ID must be a valid test key (rzp_test_*)');
  assert.ok(keySecret && keySecret.length >= 16, 'RAZORPAY_KEY_SECRET must be configured');
  assert.ok(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 'NEXT_PUBLIC_RAZORPAY_KEY_ID must be set for client frontend');
  assert.strictEqual(
    (process.env as any).NEXT_PUBLIC_RAZORPAY_KEY_SECRET,
    undefined,
    'SECURITY: RAZORPAY_KEY_SECRET must NEVER have a NEXT_PUBLIC_ prefix'
  );
  console.log('  ✓ Test credentials loaded safely');
  console.log('  ✓ Frontend key isolation verified (KEY_SECRET never exposed to client)');

  // ---------------------------------------------------------------------------
  // TEST 2: CREATE ORDER ENDPOINT (/api/create-order) - INPUT VALIDATION
  // ---------------------------------------------------------------------------
  console.log('\n[TEST 2] Testing /api/create-order Input Validations:');

  // 2.1 Rejection of amount < 100 paise
  const lowAmountReq = createMockRequest('http://localhost:3000/api/create-order', {
    amount: 50, // 50 paise (< 100)
    currency: 'INR',
  });
  const lowAmountRes = await createOrderRoute(lowAmountReq);
  assert.strictEqual(lowAmountRes.status, 400, 'Must reject amount < 100 paise with status 400');
  const lowAmountJson = await lowAmountRes.json();
  assert.match(lowAmountJson.error, /at least 100 paise/, 'Error must explain minimum 100 paise');
  console.log('  ✓ Amount < 100 paise rejected with HTTP 400');

  // 2.2 Rejection of missing/invalid amount
  const missingAmountReq = createMockRequest('http://localhost:3000/api/create-order', {});
  const missingAmountRes = await createOrderRoute(missingAmountReq);
  assert.strictEqual(missingAmountRes.status, 400, 'Must reject missing amount with status 400');
  console.log('  ✓ Missing amount rejected with HTTP 400');

  // 2.3 Handling API auth errors or successful response from Razorpay
  const validOrderReq = createMockRequest('http://localhost:3000/api/create-order', {
    amount: 299900, // ₹2,999 in paise
    currency: 'INR',
    receipt: 'rcpt_test_unit_1',
  });
  const validOrderRes = await createOrderRoute(validOrderReq);
  assert.ok(
    [200, 401].includes(validOrderRes.status),
    `Status must be 200 or 401 (handled gracefully), got ${validOrderRes.status}`
  );
  if (validOrderRes.status === 401) {
    const resJson = await validOrderRes.json();
    assert.match(resJson.error, /authentication failed/i, 'Auth failure returned clean 401 message');
    console.log('  ✓ Razorpay gateway auth status 401 handled cleanly with descriptive JSON error');
  } else {
    const resJson = await validOrderRes.json();
    assert.ok(resJson.order_id, 'Returned JSON must contain order_id');
    assert.strictEqual(resJson.amount, 299900, 'Returned JSON must contain amount');
    assert.strictEqual(resJson.currency, 'INR', 'Returned JSON must contain currency');
    console.log('  ✓ Live Razorpay order generated successfully: ' + resJson.order_id);
  }

  // ---------------------------------------------------------------------------
  // TEST 3: VERIFY PAYMENT SIGNATURE ENDPOINT (/api/verify-payment)
  // ---------------------------------------------------------------------------
  console.log('\n[TEST 3] Testing /api/verify-payment Cryptographic Validation:');

  const testOrderId = 'order_DAvL379WjP1234';
  const testPaymentId = 'pay_DAvP567AbC5678';

  // 3.1 Missing fields check
  const missingFieldsReq = createMockRequest('http://localhost:3000/api/verify-payment', {
    order_id: testOrderId,
  });
  const missingFieldsRes = await verifyPaymentRoute(missingFieldsReq);
  assert.strictEqual(missingFieldsRes.status, 400, 'Must return 400 when fields are missing');
  const missingJson = await missingFieldsRes.json();
  assert.strictEqual(missingJson.success, false, 'Must indicate success: false on missing fields');
  console.log('  ✓ Missing verification fields rejected with HTTP 400');

  // 3.2 Tampered / invalid signature check
  const tamperedSigReq = createMockRequest('http://localhost:3000/api/verify-payment', {
    order_id: testOrderId,
    payment_id: testPaymentId,
    signature: 'bad_forged_signature_000000000000000000000000000000000000000000000000',
  });
  const tamperedRes = await verifyPaymentRoute(tamperedSigReq);
  assert.strictEqual(tamperedRes.status, 400, 'Tampered signature must return HTTP 400');
  const tamperedJson = await tamperedRes.json();
  assert.strictEqual(tamperedJson.success, false, 'Tampered signature must result in success: false');
  console.log('  ✓ Tampered signature rejected with HTTP 400 and NOT marked as paid');

  // 3.3 Valid cryptographic signature test: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
  const validSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${testOrderId}|${testPaymentId}`)
    .digest('hex');

  const validVerifyReq = createMockRequest('http://localhost:3000/api/verify-payment', {
    razorpay_order_id: testOrderId,
    razorpay_payment_id: testPaymentId,
    razorpay_signature: validSignature,
  });
  const validVerifyRes = await verifyPaymentRoute(validVerifyReq);
  assert.strictEqual(validVerifyRes.status, 200, 'Valid signature must return HTTP 200');
  const validVerifyJson = await validVerifyRes.json();
  assert.strictEqual(validVerifyJson.success, true, 'Valid signature must result in success: true');
  assert.strictEqual(validVerifyJson.order_id, testOrderId, 'Response includes verified order_id');
  assert.strictEqual(validVerifyJson.payment_id, testPaymentId, 'Response includes verified payment_id');
  console.log('  ✓ Valid HMAC-SHA256 signature verified successfully with HTTP 200');

  // ---------------------------------------------------------------------------
  // TEST 4: WEBHOOK SIGNATURE & EVENT HANDLING (/api/webhooks/razorpay)
  // ---------------------------------------------------------------------------
  console.log('\n[TEST 4] Testing /api/webhooks/razorpay Security & Idempotency:');

  // 4.1 Missing signature rejection
  const noSigReq = createMockRequest('http://localhost:3000/api/webhooks/razorpay', { event: 'payment.captured' });
  const noSigRes = await webhookRoute(noSigReq);
  assert.strictEqual(noSigRes.status, 400, 'Missing x-razorpay-signature header must return 400');
  console.log('  ✓ Missing webhook signature rejected with HTTP 400');

  // 4.2 Invalid signature rejection
  const badSigReq = createMockRequest(
    'http://localhost:3000/api/webhooks/razorpay',
    { event: 'payment.captured' },
    { 'x-razorpay-signature': 'invalid_signature_hex' }
  );
  const badSigRes = await webhookRoute(badSigReq);
  assert.strictEqual(badSigRes.status, 401, 'Invalid webhook signature must return 401');
  console.log('  ✓ Forged webhook signature rejected with HTTP 401');

  // 4.3 Valid signature handling for payment.failed
  const failedEventPayload = JSON.stringify({
    event: 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: 'pay_failed_test_123',
          amount: 299900,
          error_code: 'BAD_REQUEST_ERROR',
          error_description: 'Payment was cancelled or card declined',
        },
      },
    },
  });

  const validWebhookSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(failedEventPayload)
    .digest('hex');

  const failedWebhookReq = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': validWebhookSig,
    },
    body: failedEventPayload,
  });

  const failedWebhookRes = await webhookRoute(failedWebhookReq);
  assert.strictEqual(failedWebhookRes.status, 200, 'Valid webhook for payment.failed must return HTTP 200');
  const failedJson = await failedWebhookRes.json();
  assert.strictEqual(failedJson.received, true, 'Webhook must report received: true');
  console.log('  ✓ payment.failed webhook event processed safely with HTTP 200');

  // ---------------------------------------------------------------------------
  // TEST 5: DEPLOYMENT READINESS HEALTH CHECK (/api/health)
  // ---------------------------------------------------------------------------
  console.log('\n[TEST 5] Testing Deployment Readiness Health Endpoint (/api/health):');
  const healthRes = await healthRoute();
  assert.strictEqual(healthRes.status, 200, 'Health check must return HTTP 200');
  const healthJson = await healthRes.json();

  assert.strictEqual(healthJson.status, 'healthy', 'System status must be healthy');
  assert.strictEqual(healthJson.services.database.status, 'ok', 'Database service must be ok');
  assert.strictEqual(healthJson.services.storage.status, 'ok', 'Supabase storage must be ok');
  assert.strictEqual(healthJson.services.razorpay.status, 'ok', 'Razorpay service must be ok');
  assert.strictEqual(healthJson.services.razorpay.mode, 'test', 'Razorpay mode must report test');
  assert.strictEqual(
    healthJson.services.razorpay.keySecret,
    undefined,
    'SECURITY: Razorpay keySecret must NEVER be returned in health response'
  );
  console.log('  ✓ /api/health reports healthy with database, storage, and Razorpay');
  console.log('  ✓ Zero secret leakage verified');

  console.log('\n================================================================');
  console.log('  ALL RAZORPAY & STAGING VERIFICATION TESTS PASSED! (5/5)');
  console.log('================================================================\n');
}

runRazorpayVerificationTests().catch((err) => {
  console.error('\n❌ Razorpay verification failed:', err);
  process.exit(1);
});
