import { z } from 'zod';

export const envSchema = z.object({
  // Supabase (Core database, Auth, Storage)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required for server actions'),

  // Application Settings
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  TRIAL_DURATION_HOURS: z.coerce.number().default(24),
  GRACE_PERIOD_HOURS: z.coerce.number().default(24),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().min(1, 'RAZORPAY_KEY_ID is required'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'RAZORPAY_KEY_SECRET is required'),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1, 'NEXT_PUBLIC_RAZORPAY_KEY_ID is required for client checkout'),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Cloudflare R2 (Optional - superseded by Supabase Storage)
  CLOUDFLARE_R2_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().optional(),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_R2_BUCKET_NAME: z.string().optional(),
  CLOUDFLARE_R2_PUBLIC_URL: z.string().url().optional(),

  // Optional External Integrations
  TURNSTILE_SECRET_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export interface StagingValidationReport {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  services: {
    database: boolean;
    storage: boolean;
    razorpay: boolean;
  };
}

/**
 * Validates staging and production environment variables.
 * Returns clear diagnostic error messages for missing configuration.
 */
export function validateStagingEnv(): StagingValidationReport {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Required Supabase credentials
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL (Missing or placeholder URL)');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY (Missing or placeholder anon key)');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY (Required for server actions and storage isolation)');
  }

  // Required Razorpay credentials
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'placeholder_razorpay_key_id') {
    missing.push('RAZORPAY_KEY_ID (Required for order creation)');
  }
  if (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET === 'placeholder_razorpay_key_secret') {
    missing.push('RAZORPAY_KEY_SECRET (Required for payment signature verification)');
  }
  if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
    warnings.push('NEXT_PUBLIC_RAZORPAY_KEY_ID not set; client checkout will fallback to RAZORPAY_KEY_ID');
  }
  if (!process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET === 'placeholder_razorpay_webhook_secret') {
    warnings.push('RAZORPAY_WEBHOOK_SECRET is using placeholder; live webhooks will fail signature validation');
  }

  const databaseConfigured = !missing.some((m) => m.includes('SUPABASE'));
  const storageConfigured = databaseConfigured; // Supabase Storage utilizes Supabase service client
  const razorpayConfigured = !missing.some((m) => m.includes('RAZORPAY'));

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    services: {
      database: databaseConfigured,
      storage: storageConfigured,
      razorpay: razorpayConfigured,
    },
  };
}

export function getValidatedEnv(): Partial<Env> {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.warn('Environment validation notice:', result.error.format());
    return process.env as unknown as Partial<Env>;
  }
  return result.data;
}
