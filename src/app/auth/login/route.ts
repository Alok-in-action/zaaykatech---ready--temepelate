import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
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

  let requestCookies: Array<{ name: string; value: string }> = [];
  try {
    const cookieStore = await cookies();
    requestCookies = cookieStore.getAll();
  } catch {
    // Fallback when executed outside Next.js request store (e.g. unit tests)
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

  // Collect cookies generated during signInWithOAuth
  const pendingCookies: Array<{
    name: string;
    value: string;
    options?: any;
  }> = [];

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
        cookiesToSet.forEach((cookie) => {
          pendingCookies.push(cookie);
        });
      },
    },
  });

  const callbackUrl = `${publicOrigin}/auth/callback?next=${encodeURIComponent(safeNext)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    console.error('OAuth initiation failed:', error?.message);
    const errParam = encodeURIComponent(error?.message || 'oauth_init_failed');
    return NextResponse.redirect(`${publicOrigin}/login?error=${errParam}`);
  }

  // Create 302 redirect response to Google consent screen
  const response = NextResponse.redirect(data.url, { status: 302 });

  // Attach PKCE verifier cookie directly into HTTP Set-Cookie headers
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, {
      ...options,
      path: '/',
      sameSite: 'lax',
      secure: isProd,
    });
  });

  return response;
}
