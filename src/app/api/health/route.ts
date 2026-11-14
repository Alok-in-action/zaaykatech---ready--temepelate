import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { validateStagingEnv } from '@/validations/env';

export const dynamic = 'force-dynamic';

const CHECK_TIMEOUT_MS = 3500;

/**
 * Bounded execution wrapper for individual dependency health checks.
 */
async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Check timed out')), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export async function GET() {
  const startDbCheck = Date.now();
  let dbConnected = false;
  let dbLatencyMs = 0;
  let storageAccessible = false;

  // 1. Required: Database query check with bounded timeout
  try {
    const supabase = createServiceClient();
    const { error } = await withTimeout(
      supabase.from('plans').select('id').limit(1),
      CHECK_TIMEOUT_MS
    );
    dbLatencyMs = Date.now() - startDbCheck;
    dbConnected = !error;
  } catch {
    dbConnected = false;
    dbLatencyMs = Date.now() - startDbCheck;
  }

  // 2. Required: Supabase Storage bucket metadata check with bounded timeout
  // NOTE: Successful bucket metadata access verifies the Storage API is responsive
  // and the bucket exists, but does not test active file reads or writes.
  try {
    const serviceClient = createServiceClient();
    const { data, error } = await withTimeout(
      serviceClient.storage.getBucket('zaaykatech-media'),
      CHECK_TIMEOUT_MS
    );
    storageAccessible = !error && Boolean(data);
  } catch {
    storageAccessible = false;
  }

  // 3. Required: Core environment credentials validation
  // NOTE: Valid Razorpay keys confirm required configuration strings are present,
  // but do not test active third-party bank authentication or checkout flows.
  const envReport = validateStagingEnv();

  // All core dependencies must pass for overall healthy status
  const isHealthy = dbConnected && storageAccessible && envReport.isValid;

  // Server-side operational diagnostics (never exposed in public HTTP payload)
  if (!isHealthy) {
    console.error('[HealthCheck UNHEALTHY]', {
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'ok' : 'error',
      dbLatencyMs,
      storage: storageAccessible ? 'ok' : 'error',
      envValid: envReport.isValid,
      missingConfigCount: envReport.missing.length,
    });
  } else {
    console.info('[HealthCheck HEALTHY]', {
      timestamp: new Date().toISOString(),
      dbLatencyMs,
    });
  }

  const responseHeaders = {
    'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  };

  if (!isHealthy) {
    return NextResponse.json(
      { status: 'unhealthy' },
      {
        status: 503,
        headers: responseHeaders,
      }
    );
  }

  return NextResponse.json(
    { status: 'healthy' },
    {
      status: 200,
      headers: responseHeaders,
    }
  );
}
