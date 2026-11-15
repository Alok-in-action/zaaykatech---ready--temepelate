import { NextRequest, NextResponse } from 'next/server';
import { verifyPlatformAdmin, getAdminCacheControlHeaders } from '@/lib/admin/auth';
import { getAdminRestaurants } from '@/lib/admin/data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await verifyPlatformAdmin();

  if (!auth.authorized) {
    const status = auth.reason === 'unauthenticated' ? 401 : 403;
    return NextResponse.json(
      { error: status === 401 ? 'Authentication required' : 'Forbidden: Platform operator access required' },
      { status, headers: getAdminCacheControlHeaders() }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || undefined;
  const statusFilter = searchParams.get('status') || undefined;

  const data = await getAdminRestaurants({ page, search, statusFilter });
  return NextResponse.json(data, {
    headers: getAdminCacheControlHeaders(),
  });
}
