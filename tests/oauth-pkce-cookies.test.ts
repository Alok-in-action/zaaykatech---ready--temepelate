import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { middleware } from '../src/middleware';
import { GET as authLoginGET } from '../src/app/auth/login/route';

describe('OAuth PKCE Cookie & Domain Canonicalization Verification', () => {
  it('middleware 308 redirects www.zaaykatech.com to canonical apex zaaykatech.com', async () => {
    const req = new NextRequest('https://www.zaaykatech.com/login?next=/owner', {
      headers: { host: 'www.zaaykatech.com' },
    });
    const res = await middleware(req);
    assert.strictEqual(res.status, 308, 'Should issue permanent 308 redirect');
    assert.strictEqual(
      res.headers.get('location'),
      'https://zaaykatech.com/login?next=/owner',
      'Should redirect to apex https://zaaykatech.com'
    );
  });

  it('middleware bypasses session refresh on /auth/callback and /auth/login', async () => {
    const reqCallback = new NextRequest('https://zaaykatech.com/auth/callback?code=test-code', {
      headers: { host: 'zaaykatech.com' },
    });
    const resCallback = await middleware(reqCallback);
    // Should pass through with 200 Next response, not redirect or fail
    assert.strictEqual(resCallback.status, 200);

    const reqLogin = new NextRequest('https://zaaykatech.com/auth/login?next=/owner', {
      headers: { host: 'zaaykatech.com' },
    });
    const resLogin = await middleware(reqLogin);
    assert.strictEqual(resLogin.status, 200);
  });

  it('/auth/login initiates OAuth and sets PKCE verifier cookie on 302 redirect', async () => {
    // Set standard production test environment variables for Supabase
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://hjsonewjxjnbgbzuhlll.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy-anon-key-for-test-purposes';

    const req = new Request('https://zaaykatech.com/auth/login?next=/owner', {
      headers: {
        host: 'zaaykatech.com',
      },
    });

    const res = await authLoginGET(req);
    assert.strictEqual(res.status, 302, 'Should return 302 redirect to OAuth provider');
    const location = res.headers.get('location') || '';
    assert.ok(
      location.includes('accounts.google.com') || location.includes('supabase.co/auth/v1/authorize'),
      `Redirect location must target OAuth provider, got: ${location}`
    );

    // Verify Set-Cookie headers contain code verifier
    const setCookieHeaders = res.headers.getSetCookie();
    assert.ok(setCookieHeaders.length > 0, 'Set-Cookie headers must be present');
    const verifierCookie = setCookieHeaders.find((c) => c.includes('code-verifier'));
    assert.ok(verifierCookie, 'Code verifier cookie must be attached to the response');
    assert.ok(verifierCookie.toLowerCase().includes('path=/'), 'Cookie must have Path=/');
    assert.ok(verifierCookie.toLowerCase().includes('samesite=lax'), 'Cookie must have SameSite=Lax');
  });

  it('/auth/callback redirects safely to login when auth code is missing or provider returns error', async () => {
    const { GET: authCallbackGET } = await import('../src/app/auth/callback/route');
    const reqMissingCode = new Request('https://zaaykatech.com/auth/callback', {
      headers: { host: 'zaaykatech.com' },
    });
    const resMissing = await authCallbackGET(reqMissingCode);
    assert.strictEqual(resMissing.status, 307);
    assert.strictEqual(
      resMissing.headers.get('location'),
      'https://zaaykatech.com/login?error=auth_code_missing'
    );

    const reqProviderError = new Request(
      'https://zaaykatech.com/auth/callback?error=access_denied&error_description=User+cancelled',
      { headers: { host: 'zaaykatech.com' } }
    );
    const resError = await authCallbackGET(reqProviderError);
    assert.strictEqual(resError.status, 307);
    assert.ok(resError.headers.get('location')?.includes('User%20cancelled'));
  });
});
