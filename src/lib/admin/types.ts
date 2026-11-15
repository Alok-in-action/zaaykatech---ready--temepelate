import { Restaurant, Payment, Subscription, AuditLog, Profile } from '@/types/database';

export interface AdminAuthResult {
  authorized: boolean;
  userId?: string;
  email?: string;
  role?: string;
  reason?: 'unauthenticated' | 'unauthorized_account' | 'not_configured';
}

export interface OverviewMetrics {
  // Restaurant counts
  totalRestaurants: number;
  publishedRestaurants: number;
  trialingRestaurants: number;
  activePaidSubscriptions: number;
  expiredSubscriptions: number;
  newRegistrationsPeriod: number;

  // Expiry horizons
  expiringIn7Days: number;
  expiringIn30Days: number;

  // Financial totals (in INR rupees, converted from paise)
  capturedLiveTotal: number;
  capturedTestTotal: number;
  refundedTotal: number;
  netLiveCollected: number;

  // Storage summary
  totalStorageBytes: number;
  totalStorageObjects: number;

  // Failures & Security
  criticalFailuresPeriod: number;
  rateLimitBlocksPeriod: number;

  // Metadata
  periodDays: number;
  timezone: string;
  lastUpdated: string;
}

export interface AdminRestaurantListItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  siteStatus: string;
  onboardingStatus: string;
  onboardingStep: number;
  createdAt: string;
  publishedAt: string | null;
  trialEndsAt: string | null;
  subscriptionEndDate: string | null;
  ownerId: string;
  ownerEmail: string | null;
  ownerName: string | null;
  itemCount: number;
  storageBytes: number;
  hasPaymentMismatch: boolean;
  hasRecentFailure: boolean;
}

export interface AdminRestaurantDetail {
  restaurant: Restaurant;
  owner: {
    id: string;
    authUserId: string;
    fullName: string;
    phone: string | null;
    role: string;
  } | null;
  subscription: Subscription | null;
  recentPayments: Payment[];
  itemCount: number;
  categoryCount: number;
  storageUsage: {
    totalBytes: number;
    objectCount: number;
    objects: Array<{
      name: string;
      size: number;
      createdAt: string;
    }>;
  };
  recentAuditLogs: AuditLog[];
  mismatches: string[];
}

export interface AdminPaymentListItem {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  amountPaise: number;
  amountRupees: number;
  currency: string;
  isTestMode: boolean;
  status: string;
  externalPaymentId: string;
  idempotencyKey: string;
  createdAt: string;
  subscriptionPeriodCredited: string | null;
  hasWebhookPayload: boolean;
  mismatchType?: 'captured_without_sub' | 'duplicate_event' | 'webhook_failed';
}

export interface PaymentReconciliationReport {
  totalPaymentsCount: number;
  capturedPaymentsCount: number;
  succeededRevenuePaise: number;
  testRevenuePaise: number;
  refundedRevenuePaise: number;
  mismatches: Array<{
    type: string;
    severity: 'warning' | 'error';
    description: string;
    paymentId?: string;
    restaurantId?: string;
    restaurantName?: string;
  }>;
}

export interface StorageObservabilityReport {
  totalObjectsCount: number;
  totalSizeBytes: number;
  bucketName: string;
  bucketExists: boolean;
  restaurantBreakdown: Array<{
    restaurantId: string;
    restaurantName: string;
    objectCount: number;
    sizeBytes: number;
  }>;
  bandwidthEgressStatus: 'provider_dashboard_required';
  databaseSizeStatus: 'provider_dashboard_required';
  providerLinks: {
    supabaseStorage: string;
    supabaseDatabase: string;
    vercelUsage: string;
  };
}

export interface OCRObservabilityReport {
  totalJobsCount: number;
  successfulJobsCount: number;
  failedJobsCount: number;
  rateLimitedJobsCount: number;
  localOcrEngine: string;
  recentJobs: Array<{
    id: string;
    restaurantId: string;
    restaurantName?: string;
    action: string;
    fileType?: string;
    fileSizeBytes?: number;
    durationMs?: number;
    itemCount?: number;
    error?: string;
    createdAt: string;
  }>;
  aiTokenUsageStatus: 'local_ocr_no_ai_tokens';
}

export interface SecurityObservabilityReport {
  policies: Array<{
    endpoint: string;
    limitScope: string;
    windowMinutes: number;
    maxRequests: number;
    counterSource: string;
    isSharedAcrossInstances: boolean;
    status: 'enforced_database' | 'enforced_in_memory' | 'not_implemented';
  }>;
  recentBlockedEvents: Array<{
    id: string;
    restaurantId: string;
    action: string;
    error: string;
    createdAt: string;
  }>;
}

export interface SystemHealthReport {
  environment: string;
  commitSha: string;
  nodeEnv: string;
  currentTime: string;
  database: {
    status: 'healthy' | 'unhealthy';
    latencyMs: number;
    error?: string;
  };
  storage: {
    status: 'healthy' | 'unhealthy';
    bucketName: string;
    error?: string;
  };
  environmentConfig: {
    status: 'valid' | 'missing_keys';
    missingRequiredCount: number;
  };
  paymentWebhook: {
    status: 'active' | 'inactive' | 'no_events';
    lastReceivedAt: string | null;
  };
  externalMonitoring: {
    status: 'not_configured';
    guidance: string;
  };
}
