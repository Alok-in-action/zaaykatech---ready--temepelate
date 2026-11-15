import { NextResponse } from 'next/server';
import { verifyPlatformAdmin, getAdminCacheControlHeaders } from '@/lib/admin/auth';
import { getAdminSystemHealth } from '@/lib/admin/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await verifyPlatformAdmin();

  if (!auth.authorized) {
    const status = auth.reason === 'unauthenticated' ? 401 : 403;
    return NextResponse.json(
      { error: status === 401 ? 'Authentication required' : 'Forbidden: Platform operator access required' },
      { status, headers: getAdminCacheControlHeaders() }
    );
  }

  const health = await getAdminSystemHealth();
  return NextResponse.json(health, {
    headers: getAdminCacheControlHeaders(),
  });
}
