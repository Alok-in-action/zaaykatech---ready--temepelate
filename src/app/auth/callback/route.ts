import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/service';
import { cookies } from 'next/headers';
import { getPlatformAdminAllowlist } from '@/lib/admin/auth';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');
  const rawNext = searchParams.get('next') || '/owner';
  // Strictly enforce safe internal redirect path (no protocol, no double slashes)
  const safeNext = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/owner';

  // Determine canonical public origin
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const isLocalEnv = process.env.NODE_ENV === 'development';
  let publicOrigin = isLocalEnv
    ? origin
    : forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : origin;

  if (!isLocalEnv && (publicOrigin.includes('zaaykatech.com') || publicOrigin.includes('vercel.app'))) {
    publicOrigin = 'https://zaaykatech.com';
  }

  if (errorParam) {
    const message = errorDesc || errorParam;
    return NextResponse.redirect(`${publicOrigin}/login?error=${encodeURIComponent(message)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${publicOrigin}/login?error=auth_code_missing`);
  }

  let cookieStore: any = null;
  let requestCookies: Array<{ name: string; value: string }> = [];
  try {
    cookieStore = await cookies();
    requestCookies = cookieStore.getAll();
  } catch {
    const rawCookie = request.headers.get('cookie') || '';
    requestCookies = rawCookie
      .split(';')
      .map((c) => c.trim())
      .filter(Boolean)
      .map((cookie) => {
        const eqIdx = cookie.indexOf('=');
        return eqIdx === -1
          ? { name: cookie, value: '' }
          : { name: cookie.slice(0, eqIdx).trim(), value: cookie.slice(eqIdx + 1).trim() };
      });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isProd = process.env.NODE_ENV === 'production';

  // Prepare redirect response upfront so cookies from exchangeCodeForSession are written directly into its headers
  const redirectResponse = NextResponse.redirect(new URL(safeNext, publicOrigin));

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      path: '/',
      sameSite: 'lax',
      secure: isProd,
    },
    cookies: {
      getAll() {
        return requestCookies;
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          if (cookieStore) {
            try {
              cookieStore.set(name, value, {
                ...options,
                path: '/',
                sameSite: 'lax',
                secure: isProd,
              });
            } catch {
              // Ignore if called in read-only scope
            }
          }
          redirectResponse.cookies.set(name, value, {
            ...options,
            path: '/',
            sameSite: 'lax',
            secure: isProd,
          });
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error('Auth code exchange error:', error?.message);
    const errParam = encodeURIComponent(error?.message || 'auth_exchange_failed');
    return NextResponse.redirect(`${publicOrigin}/login?error=${errParam}`);
  }

  const { user } = data;

  // Use service client to idempotently ensure profile exists without RLS conflicts or race conditions
  const serviceClient = createServiceClient();
  let profileId: string | null = null;

  try {
    const { data: existingProfile } = await serviceClient
      .from('profiles')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (existingProfile) {
      profileId = existingProfile.id;
    } else {
      // Upsert to handle concurrent trigger creation safely
      const { data: newProfile, error: upsertErr } = await serviceClient
        .from('profiles')
        .upsert(
          {
            auth_user_id: user.id,
            full_name:
              user.user_metadata?.full_name || user.email?.split('@')[0] || 'Restaurant Owner',
            phone: user.phone || null,
            role: 'restaurant_owner',
          },
          { onConflict: 'auth_user_id', ignoreDuplicates: false }
        )
        .select('id')
        .single();

      if (!upsertErr && newProfile) {
        profileId = newProfile.id;
      } else {
        // Fallback lookup if trigger beat the insert
        const { data: retryProfile } = await serviceClient
          .from('profiles')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        profileId = retryProfile?.id || null;
      }
    }
  } catch (profileErr) {
    console.warn('Profile resolution warning in callback (continuing):', profileErr);
  }

  // Check if user is a designated Platform Admin
  const adminAllowlist = getPlatformAdminAllowlist();
  const isPlatformAdmin = adminAllowlist.includes(user.id.toLowerCase());

  // Determine intelligent destination:
  // PRECEDENCE 1: Platform Admin Authority
  // Evaluated BEFORE owner onboarding flow.
  // Platform admins NEVER require a restaurant or subscription to enter /admin.
  if (isPlatformAdmin) {
    // If admin explicitly requested a specific safe internal admin subpath (e.g. /admin/payments), honor it
    if (safeNext.startsWith('/admin')) {
      redirectResponse.headers.set('Location', `${publicOrigin}${safeNext}`);
      return redirectResponse;
    }

    // For a normal website login or any owner path, route allowlisted admin directly to /admin
    if (safeNext === '/owner' || safeNext === '/' || safeNext.startsWith('/owner')) {
      redirectResponse.headers.set('Location', `${publicOrigin}/admin`);
      return redirectResponse;
    }

    // If an admin explicitly requested another safe internal page (e.g. /pricing), honor that safe next
    redirectResponse.headers.set('Location', `${publicOrigin}${safeNext}`);
    return redirectResponse;
  }

  // PRECEDENCE 2: Standard Restaurant Owner Lifecycle
  if (safeNext === '/owner' && profileId) {
    const { data: activeRest } = await serviceClient
      .from('restaurants')
      .select('id, onboarding_status, status')
      .eq('owner_profile_id', profileId)
      .is('archived_at', null)
      .maybeSingle();

    if (!activeRest) {
      // New owner: continue onboarding
      redirectResponse.headers.set('Location', `${publicOrigin}/owner/onboarding`);
      return redirectResponse;
    }

    if (activeRest.onboarding_status !== 'completed') {
      // In-progress onboarding: resume onboarding
      redirectResponse.headers.set('Location', `${publicOrigin}/owner/onboarding`);
      return redirectResponse;
    }

    // Onboarded owner: proceed to dashboard
    redirectResponse.headers.set('Location', `${publicOrigin}/owner`);
    return redirectResponse;
  }

  // If explicit destination was requested, redirect there
  redirectResponse.headers.set('Location', `${publicOrigin}${safeNext}`);
  return redirectResponse;
}
