import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const startTime = Date.now();

export async function GET() {
  const startDbCheck = Date.now();
  let dbConnected = false;
  let dbLatencyMs = 0;

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('plans').select('id').limit(1);
    dbLatencyMs = Date.now() - startDbCheck;
    dbConnected = !error;
  } catch {
    dbConnected = false;
  }

  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptimeSeconds,
      database: {
        connected: dbConnected,
        latencyMs: dbLatencyMs,
      },
      environment: process.env.NODE_ENV || 'development',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

