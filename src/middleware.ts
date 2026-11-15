import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 0. Forward root requests with an auth code directly to /auth/callback
  if (url.pathname === '/' && url.searchParams.has('code')) {
    const callbackUrl = new URL('/auth/callback', request.url);
    callbackUrl.search = url.search;
    return NextResponse.redirect(callbackUrl);
  }

  // 1. Session refresh with Supabase SSR
  const { response, user } = await updateSession(request);

  // 1b. If user is already authenticated and visits /login, route to dashboard or safe next
  if (url.pathname === '/login' && user) {
    const rawNext = url.searchParams.get('next') || '/owner';
    const safeNext = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/owner';
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  // 2. Subdomain routing for multi-tenant custom domains / subdomains
  // e.g. "mycafe.zaaykatech.com" -> rewrite to "/r/mycafe"
  // Never rewrite platform domains: localhost, *.vercel.app, *.now.sh, *.netlify.app
  const isPlatformHost =
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1') ||
    hostname.endsWith('.vercel.app') ||
    hostname.includes('vercel.app') ||
    hostname.endsWith('.now.sh') ||
    hostname.endsWith('.netlify.app') ||
    hostname.includes('netlify.app');

  let subdomain: string | null = null;

  if (!isPlatformHost) {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const candidate = parts[0].toLowerCase();
      if (!['www', 'app', 'admin', 'api', 'staging'].includes(candidate)) {
        subdomain = candidate;
      }
    }
  }

  if (subdomain && !url.pathname.startsWith('/r/') && !url.pathname.startsWith('/api/')) {
    const rewriteUrl = new URL(`/r/${subdomain}${url.pathname}`, request.url);
    return NextResponse.rewrite(rewriteUrl, {
      headers: response.headers,
    });
  }

  // 3. Protected route enforcement for owner dashboard and platform admin
  if (url.pathname.startsWith('/owner') || url.pathname.startsWith('/admin')) {
    const isLiveProduction =
      process.env.VERCEL_ENV === 'production' ||
      (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_TENANT !== 'true');

    const isTestHeader =
      !isLiveProduction &&
      (request.headers.has('x-test-admin-role') || request.headers.has('x-test-owner-role'));

    if (!user && !isTestHeader) {
      // In development or demo mode without live Supabase credentials configured,
      // allow testing the owner dashboard preview
      const isDevWithoutSupabase =
        (process.env.NODE_ENV === 'development' || process.env.ALLOW_DEMO_TENANT === 'true') &&
        (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder'));

      if (!isDevWithoutSupabase) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('next', url.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // 3b. Anti-caching headers for sensitive admin portals
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/admin')) {
    response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  // 4. Production Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)',
  ],
};

