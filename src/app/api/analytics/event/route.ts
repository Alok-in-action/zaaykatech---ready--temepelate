import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/service';

// 1. Zod validation schema
const AnalyticsEventSchema = z.object({
  eventType: z.enum([
    'qr_scan',
    'menu_view',
    'item_view',
    'whatsapp_click',
    'call_click',
    'direction_click',
    'review_click',
  ]),
  restaurantId: z.string().uuid(),
  menuItemId: z.string().uuid().optional().nullable(),
  sessionId: z.string().min(1).max(128),
  metadata: z.record(z.unknown()).optional().default({}),
  turnstileToken: z.string().optional(),
});

// 2. In-memory Rate Limiter (sliding window per minute)
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function isRateLimited(key: string, limit = 30, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || entry.expiresAt <= now) {
    rateLimitMap.set(key, { count: 1, expiresAt: now + windowMs });
    return false;
  }

  if (entry.count >= limit) {
    return true;
  }

  entry.count += 1;
  return false;
}

// Periodic cleanup of expired rate-limit records
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.expiresAt <= now) {
      rateLimitMap.delete(key);
    }
  }
}, 300000);

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      '127.0.0.1';

    // Rate limiting by client IP
    if (isRateLimited(`ip:${ip}`, 40)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parseResult = AnalyticsEventSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid analytics payload', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const event = parseResult.data;

    // Secondary rate limiting by session ID
    if (isRateLimited(`sess:${event.sessionId}`, 30)) {
      return NextResponse.json(
        { error: 'Session event limit exceeded.' },
        { status: 429 }
      );
    }

    // Optional Cloudflare Turnstile verification
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret && event.turnstileToken) {
      const verifyRes = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: turnstileSecret,
            response: event.turnstileToken,
            remoteip: ip,
          }),
        }
      );
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return NextResponse.json(
          { error: 'Turnstile challenge failed' },
          { status: 403 }
        );
      }
    }

    // Insert using privileged service-role client ONLY after validation
    const supabaseService = createServiceClient();
    const { data, error } = await supabaseService
      .from('site_analytics')
      .insert({
        restaurant_id: event.restaurantId,
        event_type: event.eventType,
        menu_item_id: event.menuItemId || null,
        session_id: event.sessionId,
        metadata: {
          ...event.metadata,
          ip: ip !== '127.0.0.1' ? ip : undefined,
          user_agent: request.headers.get('user-agent') || undefined,
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('Analytics insertion error:', error);
      return NextResponse.json(
        { error: 'Failed to record analytics event' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, eventId: data.id },
      { status: 201 }
    );
  } catch (err) {
    console.error('Unexpected error in analytics handler:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
