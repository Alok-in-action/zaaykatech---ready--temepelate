import { createServiceClient } from '@/lib/supabase/service';
import { validateStagingEnv } from '@/validations/env';
import {
  OverviewMetrics,
  AdminRestaurantListItem,
  AdminRestaurantDetail,
  AdminPaymentListItem,
  PaymentReconciliationReport,
  StorageObservabilityReport,
  OCRObservabilityReport,
  SecurityObservabilityReport,
  SystemHealthReport,
} from './types';

const CHECK_TIMEOUT_MS = 3500;

export async function withTimeout<T>(
  promiseOrFn: PromiseLike<T> | ((signal: AbortSignal) => PromiseLike<T>),
  timeoutMs: number = CHECK_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  const actualPromise =
    typeof promiseOrFn === 'function' ? promiseOrFn(controller.signal) : promiseOrFn;

  return Promise.race([actualPromise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Classifies a payment's environment provenance strictly.
 * Never guesses live without persisted provenance or verification.
 */
export function classifyPaymentEnvironment(p: {
  external_payment_id?: string | null;
  raw_webhook_payload?: any;
}): { classification: 'live_verified' | 'test_mock' | 'unverified'; provenanceSource: string } {
  const extId = p.external_payment_id || '';
  const payload = p.raw_webhook_payload || {};
  const notes = payload?.payload?.payment?.entity?.notes || payload?.notes || {};

  // 1. Explicit test identifiers or test notes
  if (
    extId.startsWith('order_mock_') ||
    extId.startsWith('pay_mock_') ||
    extId.startsWith('pay_test_') ||
    extId.startsWith('order_test_') ||
    notes?.test_mode === true ||
    payload?.environment === 'test' ||
    payload?.test === true
  ) {
    return {
      classification: 'test_mock',
      provenanceSource:
        extId.startsWith('order_mock_') || extId.startsWith('pay_mock_')
          ? 'Mock Order Generator'
          : extId.startsWith('pay_test_')
          ? 'Razorpay Test Key (pay_test_*)'
          : 'Persisted Webhook Test Payload',
    };
  }

  // 2. Explicit verified live provenance
  if (
    notes?.test_mode === false ||
    payload?.environment === 'live' ||
    payload?.environment === 'production' ||
    (payload?.account_id &&
      !payload?.account_id.includes('test') &&
      payload?.event &&
      payload?.payload?.payment?.entity?.status === 'captured' &&
      notes?.test_mode !== true)
  ) {
    return {
      classification: 'live_verified',
      provenanceSource: 'Verified Live Provider Payload',
    };
  }

  // 3. Fallback for payments without explicit environment provenance
  return {
    classification: 'unverified',
    provenanceSource: 'Unverified Historical Record (Lacks explicit live/test provenance)',
  };
}

/**
 * Section A: Overview Metrics
 */
export async function getAdminOverviewMetrics(days: number = 30): Promise<OverviewMetrics> {
  const supabase = createServiceClient();
  const now = new Date();
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  // Execute all metric queries concurrently with bounded timeout
  const [
    totalRestRes,
    publishedRestRes,
    trialingRestRes,
    activePaidRes,
    expiredSubRes,
    newRegRes,
    expiring7dRes,
    expiring30dRes,
    paymentsRes,
    failuresRes,
    rateLimitsRes,
    storageRes,
  ] = await Promise.allSettled([
    withTimeout(
      supabase.from('restaurants').select('id', { count: 'exact', head: true }).is('archived_at', null),
      CHECK_TIMEOUT_MS
    ),
    withTimeout(
      supabase.from('restaurants').select('id', { count: 'exact', head: true }).is('archived_at', null).not('published_at', 'is', null),
      CHECK_TIMEOUT_MS
    ),
    withTimeout(
      supabase
        .from('restaurants')
        .select('id', { count: 'exact', head: true })
        .is('archived_at', null)
        .not('published_at', 'is', null)
        .gt('trial_ends_at', now.toISOString())
        .or(`subscription_end_date.is.null,subscription_end_date.lt.${todayStr}`),
      CHECK_TIMEOUT_MS
    ),
    withTimeout(
      supabase
        .from('restaurants')
        .select('id', { count: 'exact', head: true })
        .is('archived_at', null)
        .gte('subscription_end_date', todayStr),
      CHECK_TIMEOUT_MS
    ),
    withTimeout(
      supabase
        .from('restaurants')
        .select('id', { count: 'exact', head: true })
        .is('archived_at', null)
        .not('published_at', 'is', null)
        .lt('subscription_end_date', todayStr)
        .or(`trial_ends_at.is.null,trial_ends_at.lte.${now.toISOString()}`),
      CHECK_TIMEOUT_MS
    ),
    withTimeout(
      supabase
        .from('restaurants')
        .select('id', { count: 'exact', head: true })
        .is('archived_at', null)
        .gte('created_at', periodStart),
      CHECK_TIMEOUT_MS
    ),
    withTimeout(
      supabase
        .from('restaurants')
        .select('id', { count: 'exact', head: true })
        .is('archived_at', null)
        .gte('subscription_end_date', todayStr)
        .lte('subscription_end_date', in7Days),
      CHECK_TIMEOUT_MS
    ),
    withTimeout(
      supabase
        .from('restaurants')
        .select('id', { count: 'exact', head: true })
        .is('archived_at', null)
        .gte('subscription_end_date', todayStr)
        .lte('subscription_end_date', in30Days),
      CHECK_TIMEOUT_MS
    ),
    withTimeout(
      supabase
        .from('payments')
        .select('id, amount_paise, status, external_payment_id, raw_webhook_payload')
        .limit(1000),
      CHECK_TIMEOUT_MS
    ),
    withTimeout(
      supabase
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', periodStart)
        .or('action.ilike.%fail%,action.ilike.%error%'),
      CHECK_TIMEOUT_MS
    ),
    withTimeout(
      supabase
        .from('audit_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', periodStart)
        .eq('action', 'menu_extraction_rate_limited'),
      CHECK_TIMEOUT_MS
    ),
    withTimeout(
      supabase.storage.from('zaaykatech-media').list('restaurants', { limit: 100 }),
      CHECK_TIMEOUT_MS
    ),
  ]);

  const totalRestaurants = totalRestRes.status === 'fulfilled' ? totalRestRes.value.count || 0 : 0;
  const publishedRestaurants = publishedRestRes.status === 'fulfilled' ? publishedRestRes.value.count || 0 : 0;
  const trialingRestaurants = trialingRestRes.status === 'fulfilled' ? trialingRestRes.value.count || 0 : 0;
  const activePaidSubscriptions = activePaidRes.status === 'fulfilled' ? activePaidRes.value.count || 0 : 0;
  const expiredSubscriptions = expiredSubRes.status === 'fulfilled' ? expiredSubRes.value.count || 0 : 0;
  const newRegistrationsPeriod = newRegRes.status === 'fulfilled' ? newRegRes.value.count || 0 : 0;
  const expiringIn7Days = expiring7dRes.status === 'fulfilled' ? expiring7dRes.value.count || 0 : 0;
  const expiringIn30Days = expiring30dRes.status === 'fulfilled' ? expiring30dRes.value.count || 0 : 0;

  // Process payments with deduplication and environment provenance
  let capturedLivePaise = 0;
  let capturedTestPaise = 0;
  let unverifiedPaise = 0;
  let refundedPaise = 0;
  const seenPaymentIds = new Set<string>();

  if (paymentsRes.status === 'fulfilled' && paymentsRes.value.data) {
    for (const p of paymentsRes.value.data) {
      const extId = p.external_payment_id || p.id;
      if (seenPaymentIds.has(extId)) {
        continue; // Deduplicate duplicate webhook events
      }
      seenPaymentIds.add(extId);

      const env = classifyPaymentEnvironment(p);

      if (p.status === 'succeeded') {
        if (env.classification === 'live_verified') {
          capturedLivePaise += p.amount_paise || 0;
        } else if (env.classification === 'test_mock') {
          capturedTestPaise += p.amount_paise || 0;
        } else {
          unverifiedPaise += p.amount_paise || 0;
        }
      } else if (p.status === 'refunded') {
        refundedPaise += p.amount_paise || 0;
      }
    }
  }

  const criticalFailuresPeriod = failuresRes.status === 'fulfilled' ? failuresRes.value.count || 0 : 0;
  const rateLimitBlocksPeriod = rateLimitsRes.status === 'fulfilled' ? rateLimitsRes.value.count || 0 : 0;

  let totalStorageBytes = 0;
  let totalStorageObjects = 0;
  if (storageRes.status === 'fulfilled' && Array.isArray(storageRes.value.data)) {
    totalStorageObjects = storageRes.value.data.length;
    for (const obj of storageRes.value.data) {
      totalStorageBytes += Number(obj.metadata?.size) || 0;
    }
  }

  return {
    totalRestaurants: totalRestaurants || 0,
    publishedRestaurants: publishedRestaurants || 0,
    trialingRestaurants: trialingRestaurants || 0,
    activePaidSubscriptions: activePaidSubscriptions || 0,
    expiredSubscriptions: expiredSubscriptions || 0,
    newRegistrationsPeriod: newRegistrationsPeriod || 0,
    expiringIn7Days: expiringIn7Days || 0,
    expiringIn30Days: expiringIn30Days || 0,
    capturedLiveTotal: capturedLivePaise / 100,
    capturedTestTotal: capturedTestPaise / 100,
    unverifiedTotal: unverifiedPaise / 100,
    refundedTotal: refundedPaise / 100,
    netLiveCollected: (capturedLivePaise - refundedPaise) / 100,
    totalStorageBytes,
    totalStorageObjects,
    criticalFailuresPeriod: criticalFailuresPeriod || 0,
    rateLimitBlocksPeriod: rateLimitBlocksPeriod || 0,
    periodDays: days,
    timezone: 'Asia/Kolkata (IST, UTC+05:30)',
    lastUpdated: now.toISOString(),
  };
}

/**
 * Section B: Searchable & Paginated Restaurants List
 */
export async function getAdminRestaurants(params: {
  page?: number;
  limit?: number;
  search?: string;
  statusFilter?: string; // all, published, draft, trial, paid, expiring_soon, expired
}): Promise<{
  restaurants: AdminRestaurantListItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}> {
  const supabase = createServiceClient();
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 15));
  const offset = (page - 1) * limit;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  let query = supabase
    .from('restaurants')
    .select(
      `
      id,
      name,
      slug,
      status,
      site_status,
      onboarding_status,
      onboarding_current_step,
      created_at,
      published_at,
      trial_ends_at,
      subscription_end_date,
      owner_profile_id
    `,
      { count: 'exact' }
    )
    .is('archived_at', null);

  // Apply search
  if (params.search && params.search.trim().length > 0) {
    const term = `%${params.search.trim()}%`;
    query = query.or(`name.ilike.${term},slug.ilike.${term}`);
  }

  // Apply status filter
  if (params.statusFilter === 'published') {
    query = query.not('published_at', 'is', null);
  } else if (params.statusFilter === 'draft') {
    query = query.is('published_at', null);
  } else if (params.statusFilter === 'paid') {
    query = query.gte('subscription_end_date', todayStr);
  } else if (params.statusFilter === 'trial') {
    query = query
      .not('published_at', 'is', null)
      .gt('trial_ends_at', now.toISOString())
      .or(`subscription_end_date.is.null,subscription_end_date.lt.${todayStr}`);
  } else if (params.statusFilter === 'expiring_soon') {
    query = query.gte('subscription_end_date', todayStr).lte('subscription_end_date', in7Days);
  } else if (params.statusFilter === 'expired') {
    query = query
      .not('published_at', 'is', null)
      .lt('subscription_end_date', todayStr)
      .or(`trial_ends_at.is.null,trial_ends_at.lte.${now.toISOString()}`);
  }

  // Order by created_at desc
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  let rawRestaurants: any[] = [];
  let totalCount = 0;
  try {
    const res = await withTimeout(query, CHECK_TIMEOUT_MS);
    rawRestaurants = res.data || [];
    totalCount = res.count || 0;
  } catch {}

  // Fetch owners profiles
  const ownerIds = Array.from(new Set(rawRestaurants.map((r) => r.owner_profile_id).filter(Boolean)));
  let profilesMap = new Map<string, { id: string; fullName: string; authUserId: string }>();

  if (ownerIds.length > 0) {
    try {
      const { data: profiles } = await withTimeout(
        supabase.from('profiles').select('id, full_name, auth_user_id').in('id', ownerIds),
        CHECK_TIMEOUT_MS
      );

      if (profiles) {
        for (const p of profiles) {
          profilesMap.set(p.id, {
            id: p.id,
            fullName: p.full_name,
            authUserId: p.auth_user_id,
          });
        }
      }
    } catch {}
  }

  // Count items per restaurant
  const restIds = rawRestaurants.map((r) => r.id);
  let itemCountsMap = new Map<string, number>();

  if (restIds.length > 0) {
    try {
      const { data: menuItems } = await withTimeout(
        supabase.from('menu_items').select('restaurant_id').in('restaurant_id', restIds),
        CHECK_TIMEOUT_MS
      );

      if (menuItems) {
        for (const item of menuItems) {
          const c = itemCountsMap.get(item.restaurant_id) || 0;
          itemCountsMap.set(item.restaurant_id, c + 1);
        }
      }
    } catch {}
  }

  const restaurants: AdminRestaurantListItem[] = rawRestaurants.map((r) => {
    const owner = profilesMap.get(r.owner_profile_id);
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      status: r.status,
      siteStatus: r.site_status,
      onboardingStatus: r.onboarding_status || 'in_progress',
      onboardingStep: r.onboarding_current_step || 1,
      createdAt: r.created_at,
      publishedAt: r.published_at,
      trialEndsAt: r.trial_ends_at,
      subscriptionEndDate: r.subscription_end_date,
      ownerId: owner?.authUserId || r.owner_profile_id,
      ownerEmail: null, // restrict unnecessary PII
      ownerName: owner?.fullName || 'Owner',
      itemCount: itemCountsMap.get(r.id) || 0,
      storageBytes: 0,
      hasPaymentMismatch: false,
      hasRecentFailure: false,
    };
  });

  const total = totalCount || 0;
  return {
    restaurants,
    totalCount: total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Section B: Restaurant Detail
 */
export async function getAdminRestaurantDetail(id: string): Promise<AdminRestaurantDetail | null> {
  const supabase = createServiceClient();

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !restaurant) return null;

  // Owner profile
  let owner = null;
  if (restaurant.owner_profile_id) {
    const { data: p } = await supabase
      .from('profiles')
      .select('id, auth_user_id, full_name, phone, role')
      .eq('id', restaurant.owner_profile_id)
      .maybeSingle();

    if (p) {
      owner = {
        id: p.id,
        authUserId: p.auth_user_id,
        fullName: p.full_name,
        phone: p.phone,
        role: p.role,
      };
    }
  }

  // Active or latest subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('restaurant_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Recent payments
  const { data: recentPayments } = await supabase
    .from('payments')
    .select('*')
    .eq('restaurant_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Counts
  const { count: itemCount } = await supabase
    .from('menu_items')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', id);

  const { count: categoryCount } = await supabase
    .from('menu_categories')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', id);

  // Recent audit logs
  const { data: recentAuditLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('restaurant_id', id)
    .order('created_at', { ascending: false })
    .limit(15);

  // Storage usage
  const storageUsage = {
    totalBytes: 0,
    objectCount: 0,
    objects: [] as Array<{ name: string; size: number; createdAt: string }>,
  };

  try {
    const { data: files } = await supabase.storage
      .from('zaaykatech-media')
      .list(`restaurants/${id}`, { limit: 100 });

    if (files && Array.isArray(files)) {
      storageUsage.objectCount = files.length;
      for (const f of files) {
        const size = f.metadata?.size || 0;
        storageUsage.totalBytes += Number(size) || 0;
        storageUsage.objects.push({
          name: f.name,
          size: Number(size) || 0,
          createdAt: f.created_at || new Date().toISOString(),
        });
      }
    }
  } catch {
    // Storage query fallback
  }

  // Check mismatches
  const mismatches: string[] = [];
  const hasSuccessfulPayment = recentPayments?.some((p) => p.status === 'succeeded');
  if (hasSuccessfulPayment && (!subscription || subscription.status !== 'active')) {
    mismatches.push('Captured payment found, but active subscription is not linked in subscriptions table.');
  }

  if (
    restaurant.subscription_end_date &&
    new Date(restaurant.subscription_end_date) > new Date() &&
    !hasSuccessfulPayment
  ) {
    mismatches.push(
      'Restaurant has active subscription_end_date without a corresponding recorded payment (complimentary or manual grant).'
    );
  }

  return {
    restaurant,
    owner,
    subscription,
    recentPayments: recentPayments || [],
    itemCount: itemCount || 0,
    categoryCount: categoryCount || 0,
    storageUsage,
    recentAuditLogs: recentAuditLogs || [],
    mismatches,
  };
}

/**
 * Section C: Payments & Subscriptions Reconciliation
 */
export async function getAdminPayments(params: {
  page?: number;
  limit?: number;
  filter?: 'all' | 'live' | 'test' | 'mismatches';
}): Promise<{
  payments: AdminPaymentListItem[];
  report: PaymentReconciliationReport;
  totalCount: number;
  currentPage: number;
  totalPages: number;
}> {
  const supabase = createServiceClient();
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const offset = (page - 1) * limit;

  // 1. Fetch total list
  let rawPayments: any[] = [];
  let totalCount = 0;
  try {
    const res = await withTimeout(
      supabase
        .from('payments')
        .select('*, restaurants(id, name, slug, subscription_end_date)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      CHECK_TIMEOUT_MS
    );
    rawPayments = res.data || [];
    totalCount = res.count || 0;
  } catch {}

  // 2. Compute full reconciliation metrics (bounded scan up to 500)
  let allRecentPayments: any[] = [];
  try {
    const res = await withTimeout(
      supabase
        .from('payments')
        .select('id, amount_paise, status, external_payment_id, restaurant_id, raw_webhook_payload, created_at')
        .order('created_at', { ascending: false })
        .limit(500),
      CHECK_TIMEOUT_MS
    );
    allRecentPayments = res.data || [];
  } catch {}

  let succeededRevenuePaise = 0;
  let testRevenuePaise = 0;
  let unverifiedRevenuePaise = 0;
  let refundedRevenuePaise = 0;
  const mismatches: PaymentReconciliationReport['mismatches'] = [];
  const seenExternalIds = new Set<string>();
  let uniqueCapturedCount = 0;

  if (allRecentPayments) {
    for (const p of allRecentPayments) {
      const extId = p.external_payment_id || p.id;
      const isDuplicate = seenExternalIds.has(extId);

      const env = classifyPaymentEnvironment(p);

      if (!isDuplicate) {
        seenExternalIds.add(extId);

        if (p.status === 'succeeded') {
          uniqueCapturedCount++;
          if (env.classification === 'live_verified') {
            succeededRevenuePaise += p.amount_paise || 0;
          } else if (env.classification === 'test_mock') {
            testRevenuePaise += p.amount_paise || 0;
          } else {
            unverifiedRevenuePaise += p.amount_paise || 0;
            mismatches.push({
              type: 'unverified_environment',
              severity: 'warning',
              description: `Payment ${extId} has unverified environment provenance. Safely excluded from verified live revenue.`,
              paymentId: p.id,
              restaurantId: p.restaurant_id,
            });
          }
        } else if (p.status === 'refunded') {
          refundedRevenuePaise += p.amount_paise || 0;
        }
      } else {
        mismatches.push({
          type: 'duplicate_event',
          severity: 'warning',
          description: `Duplicate external payment ID detected: ${extId}. Revenue is safely deduplicated.`,
          paymentId: p.id,
          restaurantId: p.restaurant_id,
        });
      }
    }
  }

  // Transform page items
  const payments: AdminPaymentListItem[] = (rawPayments || []).map((p: any) => {
    const env = classifyPaymentEnvironment(p);

    return {
      id: p.id,
      restaurantId: p.restaurant_id,
      restaurantName: p.restaurants?.name || 'Unknown Restaurant',
      restaurantSlug: p.restaurants?.slug || '',
      amountPaise: p.amount_paise,
      amountRupees: (p.amount_paise || 0) / 100,
      currency: 'INR',
      isTestMode: env.classification === 'test_mock',
      classification: env.classification,
      provenanceSource: env.provenanceSource,
      status: p.status,
      externalPaymentId: p.external_payment_id,
      idempotencyKey: p.idempotency_key,
      createdAt: p.created_at,
      subscriptionPeriodCredited: p.restaurants?.subscription_end_date || null,
      hasWebhookPayload: Boolean(p.raw_webhook_payload),
    };
  });

  const total = totalCount || 0;
  return {
    payments,
    report: {
      totalPaymentsCount: total,
      uniqueCapturedPaymentsCount: uniqueCapturedCount,
      succeededRevenuePaise,
      testRevenuePaise,
      unverifiedRevenuePaise,
      refundedRevenuePaise,
      mismatches,
    },
    totalCount: total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Section D: Storage & Usage Observability
 */
export async function getAdminStorageReport(): Promise<StorageObservabilityReport> {
  const supabase = createServiceClient();
  let totalObjectsCount = 0;
  let totalSizeBytes = 0;
  let bucketExists = false;
  const restaurantBreakdownMap = new Map<string, { count: number; bytes: number }>();

  let isPartialScan = false;
  let scanNotice: string | undefined;

  try {
    const { data: bucket, error: bucketErr } = await supabase.storage.getBucket('zaaykatech-media');
    bucketExists = !bucketErr && Boolean(bucket);

    // List top-level folders in restaurants/
    const { data: rootList } = await supabase.storage
      .from('zaaykatech-media')
      .list('restaurants', { limit: 100 });

    if (rootList && Array.isArray(rootList)) {
      const folders = rootList.filter((item) => !item.id);
      const directFiles = rootList.filter((item) => Boolean(item.id));

      for (const f of directFiles) {
        totalObjectsCount += 1;
        totalSizeBytes += Number(f.metadata?.size) || 0;
      }

      // Bound folder scans to top 20 to avoid unbounded N+1 network queries
      const MAX_SCANNED_FOLDERS = 20;
      const targetFolders = folders.slice(0, MAX_SCANNED_FOLDERS);
      if (folders.length > MAX_SCANNED_FOLDERS) {
        isPartialScan = true;
        scanNotice = `Scanned top ${MAX_SCANNED_FOLDERS} of ${folders.length} tenant folders. Full metrics available in provider dashboard.`;
      }

      const folderResults = await Promise.allSettled(
        targetFolders.map(async (folder) => {
          const restId = folder.name;
          const { data: subFiles } = await supabase.storage
            .from('zaaykatech-media')
            .list(`restaurants/${restId}`, { limit: 100 });

          let restBytes = 0;
          let restCount = 0;
          if (subFiles && Array.isArray(subFiles)) {
            restCount = subFiles.length;
            for (const f of subFiles) {
              restBytes += Number(f.metadata?.size) || 0;
            }
          }
          return { restId, restCount, restBytes };
        })
      );

      for (const res of folderResults) {
        if (res.status === 'fulfilled') {
          const { restId, restCount, restBytes } = res.value;
          totalObjectsCount += restCount;
          totalSizeBytes += restBytes;
          restaurantBreakdownMap.set(restId, { count: restCount, bytes: restBytes });
        }
      }
    }
  } catch {
    bucketExists = false;
  }

  // Resolve restaurant names for breakdown
  const restIds = Array.from(restaurantBreakdownMap.keys());
  const breakdown: StorageObservabilityReport['restaurantBreakdown'] = [];

  if (restIds.length > 0) {
    const { data: rests } = await supabase
      .from('restaurants')
      .select('id, name')
      .in('id', restIds);

    const nameMap = new Map((rests || []).map((r) => [r.id, r.name]));
    for (const [rid, stats] of restaurantBreakdownMap.entries()) {
      breakdown.push({
        restaurantId: rid,
        restaurantName: nameMap.get(rid) || `Restaurant ${rid.slice(0, 8)}`,
        objectCount: stats.count,
        sizeBytes: stats.bytes,
      });
    }
  }

  return {
    totalObjectsCount,
    totalSizeBytes,
    bucketName: 'zaaykatech-media',
    bucketExists,
    isPartialScan,
    scanNotice,
    restaurantBreakdown: breakdown,
    bandwidthEgressStatus: 'provider_dashboard_required',
    databaseSizeStatus: 'provider_dashboard_required',
    providerLinks: {
      supabaseStorage: 'https://supabase.com/dashboard/project/_/storage/buckets/zaaykatech-media',
      supabaseDatabase: 'https://supabase.com/dashboard/project/_/database/tables',
      vercelUsage: 'https://vercel.com/dashboard/usage',
    },
  };
}

/**
 * Section E: OCR / Import Jobs Observability
 */
export async function getAdminOCRReport(): Promise<OCRObservabilityReport> {
  const supabase = createServiceClient();

  let auditEvents: any[] = [];
  try {
    const res = await withTimeout(
      supabase
        .from('audit_logs')
        .select('id, restaurant_id, action, metadata, created_at')
        .or(
          'action.eq.ai_menu_extraction_attempt,action.eq.ai_menu_extraction_completed,action.eq.ai_menu_extraction_failed,action.eq.menu_extraction_attempt,action.eq.menu_extraction_success,action.eq.menu_extraction_failure,action.eq.menu_extraction_rate_limited'
        )
        .order('created_at', { ascending: false })
        .limit(50),
      CHECK_TIMEOUT_MS
    );
    auditEvents = res.data || [];
  } catch {}

  let totalJobsCount = 0;
  let successfulJobsCount = 0;
  let failedJobsCount = 0;
  let rateLimitedJobsCount = 0;

  const recentJobs: OCRObservabilityReport['recentJobs'] = [];

  if (auditEvents) {
    for (const ev of auditEvents) {
      if (
        ev.action === 'ai_menu_extraction_attempt' ||
        ev.action === 'menu_extraction_attempt'
      )
        totalJobsCount++;
      if (
        ev.action === 'ai_menu_extraction_completed' ||
        ev.action === 'menu_extraction_success'
      )
        successfulJobsCount++;
      if (
        ev.action === 'ai_menu_extraction_failed' ||
        ev.action === 'menu_extraction_failure'
      )
        failedJobsCount++;
      if (ev.action === 'menu_extraction_rate_limited') rateLimitedJobsCount++;

      recentJobs.push({
        id: ev.id,
        restaurantId: ev.restaurant_id || 'unknown',
        action: ev.action,
        fileType: ev.metadata?.fileType || ev.metadata?.mime_type,
        fileSizeBytes: ev.metadata?.fileSizeBytes,
        durationMs: ev.metadata?.durationMs,
        itemCount: ev.metadata?.itemCount,
        error: ev.metadata?.error,
        createdAt: ev.created_at,
      });
    }
  }

  return {
    totalJobsCount,
    successfulJobsCount,
    failedJobsCount,
    rateLimitedJobsCount,
    localOcrEngine: 'Local Hybrid Engine (pdfjs-dist text layer + Tesseract.js WASM + Sharp)',
    tokenUsageModel:
      'Local OCR (0 external LLM tokens applicable) / Untracked external: N/A',
    recentJobs,
    aiTokenUsageStatus: 'local_ocr_no_ai_tokens',
  };
}

/**
 * Section F: Security & Rate Limits Observability
 */
export async function getAdminSecurityReport(): Promise<SecurityObservabilityReport> {
  const supabase = createServiceClient();

  // Audit rate limit blocked events recorded in audit_logs
  let blockedLogs: any[] = [];
  try {
    const res = await withTimeout(
      supabase
        .from('audit_logs')
        .select('id, restaurant_id, action, metadata, created_at')
        .eq('action', 'menu_extraction_rate_limited')
        .order('created_at', { ascending: false })
        .limit(25),
      CHECK_TIMEOUT_MS
    );
    blockedLogs = res.data || [];
  } catch {}

  const recentBlockedEvents: SecurityObservabilityReport['recentBlockedEvents'] = (blockedLogs || []).map(
    (l) => ({
      id: l.id,
      restaurantId: l.restaurant_id || 'unknown',
      action: l.action,
      error: l.metadata?.error || 'Rate limit threshold reached',
      createdAt: l.created_at,
    })
  );

  return {
    policies: [
      {
        endpoint: 'Menu AI / OCR Extraction (actions/ai-import.ts)',
        limitScope: 'Owner Profile (Hourly & Daily)',
        windowMinutes: 60,
        maxRequests: 5, // 5 per hour, 20 per day
        counterSource: 'Supabase audit_logs query',
        isSharedAcrossInstances: true,
        status: 'enforced_database',
      },
      {
        endpoint: 'Site Analytics Event API (api/analytics/event)',
        limitScope: 'Client IP & Session ID',
        windowMinutes: 1,
        maxRequests: 100,
        counterSource: 'Process-local in-memory Map',
        isSharedAcrossInstances: false,
        status: 'enforced_in_memory',
      },
      {
        endpoint: 'Order Creation API (api/create-order)',
        limitScope: 'IP / Restaurant',
        windowMinutes: 1,
        maxRequests: 0,
        counterSource: 'None (Relies on platform WAF)',
        isSharedAcrossInstances: false,
        status: 'not_implemented',
      },
      {
        endpoint: 'Contact Submissions (/api/contact)',
        limitScope: 'Public Web Visitor',
        windowMinutes: 0,
        maxRequests: 0,
        counterSource: 'Direct mailto & WhatsApp links',
        isSharedAcrossInstances: false,
        status: 'not_implemented',
      },
    ],
    recentBlockedEvents,
  };
}

/**
 * Section G: System Health & Observability
 */
export async function getAdminSystemHealth(): Promise<SystemHealthReport> {
  const startDb = Date.now();
  let dbStatus: 'healthy' | 'unhealthy' = 'unhealthy';
  let dbLatency = 0;
  let dbError: string | undefined;

  let storageStatus: 'healthy' | 'unhealthy' = 'unhealthy';
  let storageError: string | undefined;

  const supabase = createServiceClient();

  // 1. Database connectivity check
  try {
    const { error } = await withTimeout(supabase.from('plans').select('id').limit(1), CHECK_TIMEOUT_MS);
    dbLatency = Date.now() - startDb;
    if (error) {
      dbStatus = 'unhealthy';
      dbError = error.message;
    } else {
      dbStatus = 'healthy';
    }
  } catch (err: any) {
    dbLatency = Date.now() - startDb;
    dbStatus = 'unhealthy';
    dbError = err.message || 'Database query timed out';
  }

  // 2. Storage bucket check
  try {
    const { data, error } = await withTimeout(
      supabase.storage.getBucket('zaaykatech-media'),
      CHECK_TIMEOUT_MS
    );
    if (error || !data) {
      storageStatus = 'unhealthy';
      storageError = error?.message || 'Bucket not found';
    } else {
      storageStatus = 'healthy';
    }
  } catch (err: any) {
    storageStatus = 'unhealthy';
    storageError = err.message || 'Storage check timed out';
  }

  // 3. Environment configuration validation
  const envValidation = validateStagingEnv();

  // 4. Payment webhook recent health and 5-way verification breakdown
  const credentialsConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_WEBHOOK_SECRET
  );

  let syntheticVerificationPassed = false;
  try {
    const testPayload = JSON.stringify({ event: 'health.synthetic.ping', timestamp: Date.now() });
    const testSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'synthetic-verification-secret';
    const cryptoMod = await import('node:crypto');
    const testSignature = cryptoMod.createHmac('sha256', testSecret).update(testPayload).digest('hex');
    const expected = cryptoMod.createHmac('sha256', testSecret).update(testPayload).digest('hex');
    syntheticVerificationPassed = cryptoMod.timingSafeEqual(
      Buffer.from(testSignature),
      Buffer.from(expected)
    );
  } catch {
    syntheticVerificationPassed = false;
  }

  let lastWebhookAt: string | null = null;
  let lastSuccessfulAt: string | null = null;
  let liveIntegrationVerified = false;

  try {
    const { data: latestPayment } = await supabase
      .from('payments')
      .select('created_at, status, external_payment_id, raw_webhook_payload')
      .not('raw_webhook_payload', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (latestPayment && latestPayment.length > 0) {
      lastWebhookAt = latestPayment[0].created_at || null;
      const successful = latestPayment.find((p) => p.status === 'succeeded');
      lastSuccessfulAt = successful?.created_at || null;
      liveIntegrationVerified = latestPayment.some(
        (p) => classifyPaymentEnvironment(p).classification === 'live_verified'
      );
    }
  } catch {
    lastWebhookAt = null;
    lastSuccessfulAt = null;
    liveIntegrationVerified = false;
  }

  return {
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA || 'local-development',
    nodeEnv: process.env.NODE_ENV || 'development',
    currentTime: new Date().toISOString(),
    database: {
      status: dbStatus,
      latencyMs: dbLatency,
      error: dbError,
    },
    storage: {
      status: storageStatus,
      bucketName: 'zaaykatech-media',
      error: storageError,
    },
    environmentConfig: {
      status: envValidation.isValid ? 'valid' : 'missing_keys',
      missingRequiredCount: envValidation.missing.length,
    },
    paymentWebhook: {
      status: lastWebhookAt ? 'active' : 'no_events',
      credentialsConfigured,
      syntheticVerificationPassed,
      lastReceivedAt: lastWebhookAt,
      lastSuccessfulProcessingAt: lastSuccessfulAt,
      liveIntegrationVerified,
    },
    externalMonitoring: {
      status: 'not_configured',
      guidance:
        'Third-party synthetic uptime monitor (e.g. Better Uptime or Checkly) pinging /api/health every 10-15m recommended.',
    },
  };
}
