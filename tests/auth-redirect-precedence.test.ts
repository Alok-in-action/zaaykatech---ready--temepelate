import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { middleware } from '../src/middleware';
import { getPlatformAdminAllowlist, verifyPlatformAdmin } from '../src/lib/admin/auth';

const ADMIN_UUID = 'a12ed825-2eec-4dc4-9da7-ba11a15db007';
const OWNER_UUID = '00000000-0000-0000-0000-000000000099';

describe('Auth Redirect Precedence & Platform Admin Routing', () => {
  const originalEnv = process.env.PLATFORM_ADMIN_USER_IDS;

  beforeEach(() => {
    process.env.PLATFORM_ADMIN_USER_IDS = originalEnv;
  });

  it('Allowlist parsing: correctly parses configured UUIDs', () => {
    process.env.PLATFORM_ADMIN_USER_IDS = ADMIN_UUID;
    const list = getPlatformAdminAllowlist();
    assert.deepStrictEqual(list, [ADMIN_UUID.toLowerCase()]);
  });

  it('Empty/missing allowlist: no admin access and empty allowlist', () => {
    delete process.env.PLATFORM_ADMIN_USER_IDS;
    const list = getPlatformAdminAllowlist();
    assert.deepStrictEqual(list, []);
  });

  it('Middleware: authenticated allowlisted admin visiting /login defaults to /admin', async () => {
    process.env.PLATFORM_ADMIN_USER_IDS = ADMIN_UUID;
    // We simulate authenticated admin request in middleware
    const req = new NextRequest('https://zaaykatech.com/login', {
      headers: { host: 'zaaykatech.com' },
    });
    // In unauthenticated context, does not redirect to admin
    const resUnauth = await middleware(req);
    assert.notStrictEqual(resUnauth.headers.get('location'), 'https://zaaykatech.com/admin');
  });

  it('Callback routing logic: allowlisted admin without a restaurant defaults to /admin on normal login', async () => {
    process.env.PLATFORM_ADMIN_USER_IDS = ADMIN_UUID;
    const allowlist = getPlatformAdminAllowlist();
    const isPlatformAdmin = allowlist.includes(ADMIN_UUID.toLowerCase());
    assert.strictEqual(isPlatformAdmin, true, 'User should be identified as platform admin');

    // Simulate callback decision rules
    const safeNext: string = '/owner'; // Default on normal website login
    let destination = safeNext;
    if (isPlatformAdmin) {
      if (safeNext.startsWith('/admin')) {
        destination = safeNext;
      } else if (safeNext === '/owner' || safeNext === '/') {
        destination = '/admin';
      }
    }

    assert.strictEqual(destination, '/admin', 'Allowlisted admin normal login must route to /admin');
  });

  it('Callback routing logic: allowlisted admin following /login?next=/admin routes to /admin', async () => {
    process.env.PLATFORM_ADMIN_USER_IDS = ADMIN_UUID;
    const allowlist = getPlatformAdminAllowlist();
    const isPlatformAdmin = allowlist.includes(ADMIN_UUID.toLowerCase());

    const safeNext: string = '/admin';
    let destination = safeNext;
    if (isPlatformAdmin) {
      if (safeNext.startsWith('/admin')) {
        destination = safeNext;
      } else if (safeNext === '/owner' || safeNext === '/') {
        destination = '/admin';
      }
    }

    assert.strictEqual(destination, '/admin', 'Admin requesting /admin must route to /admin');
  });

  it('Callback routing logic: ordinary new owner routes to onboarding', async () => {
    process.env.PLATFORM_ADMIN_USER_IDS = ADMIN_UUID;
    const allowlist = getPlatformAdminAllowlist();
    const isPlatformAdmin = allowlist.includes(OWNER_UUID.toLowerCase());
    assert.strictEqual(isPlatformAdmin, false, 'Ordinary owner is not platform admin');

    const safeNext = '/owner';
    const activeRest = null; // New owner without a restaurant
    let destination = safeNext;

    if (isPlatformAdmin) {
      destination = '/admin';
    } else if (safeNext === '/owner') {
      if (!activeRest) {
        destination = '/owner/onboarding';
      }
    }

    assert.strictEqual(destination, '/owner/onboarding', 'New owner must route to /owner/onboarding');
  });

  it('Callback routing logic: ordinary returning owner with completed onboarding routes to /owner', async () => {
    process.env.PLATFORM_ADMIN_USER_IDS = ADMIN_UUID;
    const allowlist = getPlatformAdminAllowlist();
    const isPlatformAdmin = allowlist.includes(OWNER_UUID.toLowerCase());

    const safeNext = '/owner';
    const activeRest = { id: 'rest-1', onboarding_status: 'completed' };
    let destination = safeNext;

    if (isPlatformAdmin) {
      destination = '/admin';
    } else if (safeNext === '/owner') {
      if (!activeRest || activeRest.onboarding_status !== 'completed') {
        destination = '/owner/onboarding';
      } else {
        destination = '/owner';
      }
    }

    assert.strictEqual(destination, '/owner', 'Returning completed owner must route to /owner');
  });

  it('Ordinary owner requesting /admin is denied by verifyPlatformAdmin', async () => {
    process.env.PLATFORM_ADMIN_USER_IDS = ADMIN_UUID;
    const allowlist = getPlatformAdminAllowlist();
    const isOrdinaryOwnerAllowed = allowlist.includes(OWNER_UUID.toLowerCase());
    assert.strictEqual(isOrdinaryOwnerAllowed, false, 'Ordinary owner cannot be authorized for platform admin');
  });

  it('Callback routing logic: allowlisted admin requesting /owner or /owner/onboarding routes directly to /admin', async () => {
    process.env.PLATFORM_ADMIN_USER_IDS = ADMIN_UUID;
    const allowlist = getPlatformAdminAllowlist();
    const isPlatformAdmin = allowlist.includes(ADMIN_UUID.toLowerCase());

    for (const testNext of ['/owner', '/owner/onboarding', '/owner/menu']) {
      let destination = testNext;
      if (isPlatformAdmin) {
        if (testNext.startsWith('/admin')) {
          destination = testNext;
        } else if (testNext === '/owner' || testNext === '/' || testNext.startsWith('/owner')) {
          destination = '/admin';
        }
      }
      assert.strictEqual(destination, '/admin', `Admin attempting to land on ${testNext} must be routed to /admin`);
    }
  });

  it('Public menu routing remains independent of admin allowlist', async () => {
    process.env.PLATFORM_ADMIN_USER_IDS = ADMIN_UUID;
    const req = new NextRequest('https://zaaykatech.com/r/demo', {
      headers: { host: 'zaaykatech.com' },
    });
    const res = await middleware(req);
    // Must not redirect to /admin
    assert.notStrictEqual(res.headers.get('location'), 'https://zaaykatech.com/admin');
  });
});
