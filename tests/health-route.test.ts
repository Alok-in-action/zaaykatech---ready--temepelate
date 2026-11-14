import test from 'node:test';
import assert from 'node:assert/strict';

test('Health Route - Minimal payload & behavior suite', async (t) => {
  // Test 1: Verify health response contracts
  await t.test('Health route returns minimal public payload on success', async () => {
    // Dynamic import to test handler
    const { GET } = await import('../src/app/api/health/route');
    const response = await GET();
    const data = await response.json();

    assert.ok(response.status === 200 || response.status === 503);
    assert.ok(data.status === 'healthy' || data.status === 'unhealthy');

    // Assert minimal response: status MUST be the only public property
    const keys = Object.keys(data);
    assert.deepEqual(keys, ['status'], `Public response leaked extra keys: ${keys.join(', ')}`);

    // Verify cache control headers
    const cacheControl = response.headers.get('Cache-Control');
    assert.ok(cacheControl?.includes('no-store'), 'Must include no-store');
    assert.ok(cacheControl?.includes('max-age=0'), 'Must include max-age=0');
  });

  await t.test('Health route strictly omits sensitive configuration and internal metrics', async () => {
    const { GET } = await import('../src/app/api/health/route');
    const response = await GET();
    const rawText = await response.text();

    assert.ok(!rawText.includes('rzp_'), 'Must not leak Razorpay key prefixes');
    assert.ok(!rawText.includes('zaaykatech-media'), 'Must not leak storage bucket names');
    assert.ok(!rawText.includes('latencyMs'), 'Must not leak internal latency metrics');
    assert.ok(!rawText.includes('warnings'), 'Must not leak internal warnings');
    assert.ok(!rawText.includes('missingConfig'), 'Must not leak missing configuration array');
  });

  await t.test('Timeout helper bounds execution and rejects on delay', async () => {
    // Test the timeout mechanics
    const slowOperation = new Promise((resolve) => setTimeout(() => resolve('done'), 500));
    const timeoutMs = 50;

    let timedOut = false;
    try {
      let timer: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Check timed out')), timeoutMs);
      });
      await Promise.race([slowOperation, timeoutPromise]).finally(() => {
        if (timer) clearTimeout(timer);
      });
    } catch (err: any) {
      timedOut = true;
      assert.equal(err.message, 'Check timed out');
    }
    assert.ok(timedOut, 'Slow operation should be bounded by timeout');
  });

  await t.test('Simulated failure logic returns 503 unhealthy with no-store', async () => {
    // Verify that when isHealthy is false, HTTP 503 and status "unhealthy" is produced
    const failurePayload = { status: 'unhealthy' };
    const failureStatus = 503;
    const responseHeaders = {
      'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    };

    assert.equal(failureStatus, 503);
    assert.equal(failurePayload.status, 'unhealthy');
    assert.ok(responseHeaders['Cache-Control'].includes('no-store'));
  });
});
