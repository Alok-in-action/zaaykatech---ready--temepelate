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

  // 3. Protected route enforcement for owner dashboard
  if (url.pathname.startsWith('/owner')) {
    if (!user) {
      // In development or demo mode without live Supabase credentials configured,
      // allow testing the owner dashboard preview
      const isDevWithoutSupabase =
        process.env.NODE_ENV === 'development' &&
        (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder'));

      if (!isDevWithoutSupabase) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('next', url.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }
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

