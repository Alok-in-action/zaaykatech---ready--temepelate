import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { getPlatformAdminAllowlist } from '@/lib/admin/auth';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const hostname = rawHost.split(':')[0].toLowerCase();

  // Canonical apex domain redirect in production to prevent cookie segregation between www and apex
  if (hostname === 'www.zaaykatech.com') {
    const canonicalUrl = new URL(url.pathname + url.search, 'https://zaaykatech.com');
    return NextResponse.redirect(canonicalUrl, 308);
  }

  // 0. Forward root requests with an auth code directly to /auth/callback
  if (url.pathname === '/' && url.searchParams.has('code')) {
    const callbackUrl = new URL('/auth/callback', 'https://zaaykatech.com');
    callbackUrl.search = url.search;
    return NextResponse.redirect(callbackUrl);
  }

  // 0b. Bypass session refresh for authentication handshake endpoints
  // Crucial: running getUser() or mutating request headers on /auth/callback can consume or invalidate PKCE verifier state
  if (url.pathname.startsWith('/auth/callback') || url.pathname.startsWith('/auth/login')) {
    const bypassResponse = NextResponse.next();
    bypassResponse.headers.set('X-Content-Type-Options', 'nosniff');
    bypassResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
    bypassResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return bypassResponse;
  }

  // 1. Session refresh with Supabase SSR
  const { response, user } = await updateSession(request);

  // 1b. If user is already authenticated and visits /login, route to appropriate portal
  if (url.pathname === '/login' && user) {
    const rawNext = url.searchParams.get('next');
    const safeNext = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : null;
    const adminAllowlist = getPlatformAdminAllowlist();
    const isPlatformAdmin = adminAllowlist.includes(user.id.toLowerCase());

    const destination = isPlatformAdmin ? (safeNext || '/admin') : (safeNext || '/owner');
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // 1c. If authenticated user is an allowlisted platform admin, route /owner and /owner/* to /admin
  if (url.pathname.startsWith('/owner') && user) {
    const adminAllowlist = getPlatformAdminAllowlist();
    const isPlatformAdmin = adminAllowlist.includes(user.id.toLowerCase());
    if (isPlatformAdmin) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
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

