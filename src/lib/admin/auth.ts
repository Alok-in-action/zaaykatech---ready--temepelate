import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { AdminAuthResult } from './types';
import { headers } from 'next/headers';

/**
 * Returns security and no-cache headers mandatory for all platform admin endpoints.
 */
export function getAdminCacheControlHeaders(): HeadersInit {
  return {
    'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
  };
}

/**
 * Parse server-only configured platform operator allowlist.
 * Matches immutable Supabase Auth user IDs (UUIDs).
 */
export function getPlatformAdminAllowlist(): string[] {
  const envVal = process.env.PLATFORM_ADMIN_USER_IDS?.trim() || '';
  if (!envVal) return [];

  // Support comma-separated or JSON array of UUIDs
  if (envVal.startsWith('[') && envVal.endsWith(']')) {
    try {
      const parsed = JSON.parse(envVal);
      if (Array.isArray(parsed)) {
        return parsed.map((id) => String(id).trim().toLowerCase()).filter(Boolean);
      }
    } catch {
      // Fallback to comma-separated
    }
  }

  return envVal
    .split(',')
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Resolves platform admin authority on the server.
 * Never trusts user-editable metadata or client headers.
 */
export async function verifyPlatformAdmin(): Promise<AdminAuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // In local development or isolated automated tests, allow explicit test admin flag.
  // In live production, test headers and development overrides are strictly forbidden.
  const isLiveProduction =
    process.env.VERCEL_ENV === 'production' ||
    (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_TENANT !== 'true');

  const isDevOrTest =
    !isLiveProduction &&
    (process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test' ||
      process.env.ALLOW_DEMO_TENANT === 'true');
  const allowDevAdmin =
    !isLiveProduction && process.env.ALLOW_DEV_ADMIN === 'true';

  if (!user || authError) {
    if (isDevOrTest) {
      // Check for test operator header or dev mock
      const reqHeaders = await headers().catch(() => null);
      const testRole = reqHeaders?.get('x-test-admin-role');
      const testOwner = reqHeaders?.get('x-test-owner-role');

      if (testRole === 'platform_admin') {
        return {
          authorized: true,
          userId: '00000000-0000-0000-0000-000000000001',
          email: 'admin@zaaykatech.com',
          role: 'super_admin',
        };
      }

      if (testOwner) {
        return {
          authorized: false,
          userId: '00000000-0000-0000-0000-000000000099',
          email: 'owner@zaaykatech.com',
          role: 'restaurant_owner',
          reason: 'unauthorized_account',
        };
      }
    }
    return {
      authorized: false,
      reason: 'unauthenticated',
    };
  }

  const allowlist = getPlatformAdminAllowlist();

  // If no admin identities are configured in production environment, deny by default
  if (allowlist.length === 0) {
    // Check if development allow-flag is enabled
    if (isDevOrTest && allowDevAdmin) {
      return {
        authorized: true,
        userId: user.id,
        email: user.email,
        role: 'super_admin',
      };
    }

    return {
      authorized: false,
      userId: user.id,
      email: user.email,
      reason: 'not_configured',
    };
  }

  const userIdLower = user.id.toLowerCase();
  const isAllowed = allowlist.includes(userIdLower);

  if (!isAllowed) {
    return {
      authorized: false,
      userId: user.id,
      email: user.email,
      reason: 'unauthorized_account',
    };
  }

  // Resolve server-side profile role via service client to bypass RLS
  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  return {
    authorized: true,
    userId: user.id,
    email: user.email,
    role: profile?.role || 'super_admin',
  };
}
