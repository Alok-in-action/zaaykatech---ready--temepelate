import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { validateStagingEnv } from '@/validations/env';

const startTime = Date.now();

export async function GET() {
  const startDbCheck = Date.now();
  let dbConnected = false;
  let dbLatencyMs = 0;
  let storageAccessible = false;

  // 1. Check Database connectivity via service client
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('plans').select('id').limit(1);
    dbLatencyMs = Date.now() - startDbCheck;
    dbConnected = !error;
  } catch {
    dbConnected = false;
  }

  // 2. Check Supabase Storage accessibility
  try {
    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient.storage.getBucket('zaaykatech-media');
    storageAccessible = !error && !!data;
  } catch {
    storageAccessible = false;
  }

  // 3. Check Razorpay configuration without exposing secret keys
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const razorpayConfigured = Boolean(
    razorpayKeyId &&
      razorpayKeySecret &&
      razorpayKeyId !== 'placeholder_razorpay_key_id' &&
      razorpayKeySecret !== 'placeholder_razorpay_key_secret'
  );

  const razorpayMode = razorpayKeyId?.startsWith('rzp_test_')
    ? 'test'
    : razorpayKeyId?.startsWith('rzp_live_')
    ? 'live'
    : 'unconfigured';

  const webhookConfigured = Boolean(
    webhookSecret && webhookSecret !== 'placeholder_razorpay_webhook_secret'
  );

  // 4. Validate Environment Variables
  const envReport = validateStagingEnv();

  const isHealthy = dbConnected && storageAccessible && razorpayConfigured && envReport.isValid;
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  const responsePayload = {
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptimeSeconds,
    environment: process.env.NODE_ENV || 'development',
    services: {
      app: {
        status: 'ok',
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
      database: {
        status: dbConnected ? 'ok' : 'error',
        connected: dbConnected,
        latencyMs: dbLatencyMs,
      },
      storage: {
        status: storageAccessible ? 'ok' : 'degraded',
        provider: 'supabase',
        bucket: 'zaaykatech-media',
        accessible: storageAccessible,
      },
      razorpay: {
        status: razorpayConfigured ? 'ok' : 'degraded',
        configured: razorpayConfigured,
        mode: razorpayMode,
        keyIdPrefix: razorpayKeyId ? `${razorpayKeyId.slice(0, 8)}...` : null,
        keySecretConfigured: Boolean(razorpayKeySecret),
        webhookConfigured,
      },
    },
    missingConfig: envReport.missing,
    warnings: envReport.warnings,
  };

  return NextResponse.json(responsePayload, {
    status: dbConnected ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
