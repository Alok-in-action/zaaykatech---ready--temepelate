'use server';

import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceClient as createServiceRoleClient } from '@/lib/supabase/service';
import { createPresignedUploadUrl, getR2Object } from '@/lib/storage/r2';
import {
  AIMenuExtractionOutputSchema,
  CommitMenuPayloadSchema,
  type AIMenuExtractionOutput,
  type CommitMenuPayload,
} from '@/validations/ai';
import { slugify } from '@/lib/utils';
import { parseMenuText, parseMenuCsv } from '@/lib/ocr/parser';
import { revalidatePath } from 'next/cache';
import crypto from 'node:crypto';

/**
 * Checks and enforces owner rate limits (Max 5/hr, Max 20/day) using audit_logs in Supabase.
 */
async function checkAndEnforceAIRateLimits(profileId: string): Promise<void> {
  const serviceClient = createServiceRoleClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // 1. Hourly check (Max 5 per hour)
  const { count: hourlyCount, error: hourlyError } = await serviceClient
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('actor_id', profileId)
    .eq('action', 'ai_menu_extraction_attempt')
    .gte('created_at', oneHourAgo);

  if (!hourlyError && typeof hourlyCount === 'number' && hourlyCount >= 5) {
    throw new Error('Rate limit exceeded: You can only perform 5 menu extractions per hour. Please wait before trying again.');
  }

  // 2. Daily check (Max 20 per day)
  const { count: dailyCount, error: dailyError } = await serviceClient
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('actor_id', profileId)
    .eq('action', 'ai_menu_extraction_attempt')
    .gte('created_at', oneDayAgo);

  if (!dailyError && typeof dailyCount === 'number' && dailyCount >= 20) {
    throw new Error('Daily limit reached: You have reached the maximum of 20 menu extractions for today. Please try tomorrow.');
  }
}

/**
 * Logs an AI/OCR audit event to audit_logs using the service role client.
 */
async function logAIAuditEvent(params: {
  actorId: string | null;
  restaurantId: string;
  action: string;
  metadata: Record<string, any>;
}) {
  try {
    const serviceClient = createServiceRoleClient();
    await serviceClient.from('audit_logs').insert({
      actor_id: params.actorId,
      restaurant_id: params.restaurantId,
      action: params.action,
      metadata: params.metadata,
    });
  } catch (err) {
    console.error('Failed to write OCR audit log:', err);
  }
}

/**
 * Generates a presigned Cloudflare R2 upload URL for AI/OCR menu import files.
 * Target path: restaurants/{restaurantId}/ai-imports/{uploadId}/
 */
export async function requestAIImportUploadUrl(
  restaurantId: string,
  fileType: string,
  fileSize: number
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Please log in to import menus.' };
  }

  // Resolve authenticated user's profile
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (profileErr || !profile) {
    return { success: false, error: 'Unauthorized: Owner profile not found.' };
  }

  // Verify ownership
  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('id, owner_profile_id')
    .eq('id', restaurantId)
    .is('archived_at', null)
    .single();

  if (restError || !restaurant || restaurant.owner_profile_id !== profile.id) {
    return { success: false, error: 'Unauthorized: You do not own this restaurant.' };
  }

  try {
    const uploadId = crypto.randomUUID();
    const result = await createPresignedUploadUrl({
      restaurantId,
      purpose: 'ai-import',
      fileType,
      fileSize,
      uploadId,
    });

    return {
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        publicUrl: result.publicUrl,
        key: result.key,
        uploadId: result.uploadId,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to generate upload URL.' };
  }
}

export interface ExtractMenuSourceParams {
  type: 'r2_file' | 'text' | 'csv' | 'direct_base64';
  r2Key?: string;
  textContent?: string;
  mimeType?: string;
  base64Data?: string;
}

/**
 * Extracts a restaurant menu using local OCR (Tesseract.js + Sharp + pdf-parse)
 * with deterministic rule-based parsing. Does not require any external AI API key.
 */
export async function extractMenuFromSource(
  restaurantId: string,
  source: ExtractMenuSourceParams
): Promise<{ success: boolean; data?: AIMenuExtractionOutput; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Please log in to continue.' };
  }

  // Resolve authenticated user's profile
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (profileErr || !profile) {
    return { success: false, error: 'Unauthorized: Owner profile not found.' };
  }

  // Verify ownership
  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('id, owner_profile_id, name')
    .eq('id', restaurantId)
    .is('archived_at', null)
    .single();

  if (restError || !restaurant || restaurant.owner_profile_id !== profile.id) {
    return { success: false, error: 'Unauthorized: You do not own this restaurant.' };
  }

  // 1. Enforce rate limiting
  try {
    await checkAndEnforceAIRateLimits(profile.id);
  } catch (rateLimitErr: any) {
    await logAIAuditEvent({
      actorId: profile.id,
      restaurantId,
      action: 'menu_extraction_rate_limited',
      metadata: { error: rateLimitErr.message },
    });
    return { success: false, error: rateLimitErr.message };
  }

  // 2. Log extraction attempt
  await logAIAuditEvent({
    actorId: profile.id,
    restaurantId,
    action: 'menu_extraction_attempt',
    metadata: {
      source_type: source.type,
      mime_type: source.mimeType || null,
      r2_key: source.r2Key || null,
      timestamp: new Date().toISOString(),
    },
  });

  try {
    let extractedResult: AIMenuExtractionOutput;

    // A. PASTED TEXT
    if (source.type === 'text') {
      if (!source.textContent || source.textContent.trim().length === 0) {
        throw new Error('Menu text cannot be empty.');
      }
      extractedResult = parseMenuText(source.textContent, 'text', 0.95);
    }
    // B. CSV SPREADSHEET
    else if (source.type === 'csv') {
      if (!source.textContent || source.textContent.trim().length === 0) {
        throw new Error('CSV content cannot be empty.');
      }
      extractedResult = parseMenuCsv(source.textContent);
    }
    // C. IMAGE OR PDF VIA BASE64 OR R2
    else {
      let fileBuffer: Buffer | null = null;
      let effectiveMime = source.mimeType || 'image/jpeg';

      if (source.type === 'direct_base64' && source.base64Data) {
        fileBuffer = Buffer.from(source.base64Data, 'base64');
      } else if (source.type === 'r2_file' && source.r2Key) {
        const r2Obj = await getR2Object(source.r2Key);
        if (r2Obj) {
          fileBuffer = r2Obj.buffer;
          effectiveMime = r2Obj.contentType;
        }
      }

      if (!fileBuffer) {
        throw new Error('Could not retrieve uploaded file buffer for OCR scanning.');
      }

      // Check PDF vs Image
      const isPdf = effectiveMime === 'application/pdf' || (source.r2Key && source.r2Key.endsWith('.pdf'));

      if (isPdf) {
        const { extractTextFromPdf } = await import('@/lib/ocr/engine');
        const pdfOcr = await extractTextFromPdf(fileBuffer);
        if (!pdfOcr.text || pdfOcr.text.trim().length < 15) {
          throw new Error('We could not read this menu reliably. Please upload a clearer photo, PDF, CSV, or paste the menu text.');
        }
        extractedResult = parseMenuText(pdfOcr.text, 'pdf', pdfOcr.confidence);
      } else {
        // Image processing with Sharp and Tesseract.js
        const { extractTextFromImage } = await import('@/lib/ocr/engine');
        const imgOcr = await extractTextFromImage(fileBuffer);
        if (!imgOcr.text || imgOcr.text.trim().length < 15) {
          throw new Error('We could not read this menu reliably. Please upload a clearer photo, PDF, CSV, or paste the menu text.');
        }
        extractedResult = parseMenuText(imgOcr.text, 'image', imgOcr.confidence);
      }
    }

    // Attach restaurant name
    extractedResult.restaurantName = restaurant.name;

    // 3. Fallback check: Did we extract any items?
    const totalItems = extractedResult.categories.reduce((acc, cat) => acc + cat.items.length, 0);
    if (totalItems === 0) {
      throw new Error('We could not read this menu reliably. Please upload a clearer photo, PDF, CSV, or paste the menu text.');
    }

    // 4. Validate output strictly with Zod
    const validated = AIMenuExtractionOutputSchema.safeParse(extractedResult);
    if (!validated.success) {
      const issues = validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new Error(`Extraction parser returned invalid schema: ${issues}`);
    }

    // 5. Log success
    await logAIAuditEvent({
      actorId: profile.id,
      restaurantId,
      action: 'menu_extraction_success',
      metadata: {
        source_type: source.type,
        category_count: validated.data.categories.length,
        item_count: totalItems,
        confidence: validated.data.confidence,
      },
    });

    return {
      success: true,
      data: validated.data,
    };
  } catch (err: any) {
    console.error('Menu OCR extraction failed:', err);
    await logAIAuditEvent({
      actorId: profile.id,
      restaurantId,
      action: 'menu_extraction_failure',
      metadata: { error: err.message },
    });
    return {
      success: false,
      error: err.message || 'We could not read this menu reliably. Please upload a clearer photo, PDF, CSV, or paste the menu text.',
    };
  }
}

/**
 * Commits approved categories and dishes to Supabase.
 * - Saves in draft state (does NOT auto-publish).
 * - Maintains sequential positions.
 * - Prevents duplicate dish names within the same category.
 */
export async function commitExtractedMenu(
  restaurantId: string,
  payload: CommitMenuPayload
): Promise<{ success: boolean; importedCategories?: number; importedItems?: number; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Please log in to commit menu.' };
  }

  // Resolve authenticated user's profile
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (profileErr || !profile) {
    return { success: false, error: 'Unauthorized: Owner profile not found.' };
  }

  // Verify ownership
  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('id, owner_profile_id')
    .eq('id', restaurantId)
    .is('archived_at', null)
    .single();

  if (restError || !restaurant || restaurant.owner_profile_id !== profile.id) {
    return { success: false, error: 'Unauthorized: You do not own this restaurant.' };
  }

  // Validate payload
  const parsed = CommitMenuPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: `Invalid payload: ${parsed.error.issues[0]?.message}` };
  }

  try {
    // 1. Fetch current max category position
    const { data: existingCategories } = await supabase
      .from('menu_categories')
      .select('id, name, position')
      .eq('restaurant_id', restaurantId)
      .order('position', { ascending: false });

    let nextCategoryPos = (existingCategories?.[0]?.position ?? -1) + 1;
    const categoryMap = new Map<string, string>();

    if (existingCategories) {
      for (const cat of existingCategories) {
        categoryMap.set(cat.name.trim().toLowerCase(), cat.id);
      }
    }

    let importedCategoriesCount = 0;
    let importedItemsCount = 0;

    for (const catData of parsed.data.categories) {
      const normalizedName = catData.name.trim().toLowerCase();
      let categoryId = categoryMap.get(normalizedName);

      if (!categoryId) {
        const catSlug = slugify(catData.name) || `cat-${Date.now()}`;
        const { data: newCat, error: catErr } = await supabase
          .from('menu_categories')
          .insert({
            restaurant_id: restaurantId,
            name: catData.name.trim(),
            slug: `${catSlug}-${crypto.randomBytes(3).toString('hex')}`,
            description: catData.description || null,
            position: nextCategoryPos++,
            is_active: true,
          })
          .select('id')
          .single();

        if (catErr || !newCat) {
          throw new Error(`Failed to create category "${catData.name}": ${catErr?.message}`);
        }

        categoryId = newCat.id;
        categoryMap.set(normalizedName, newCat.id as string);
        importedCategoriesCount++;
      }

      const effectiveCatId = categoryId as string;

      // Fetch existing items for this category to determine next item position and prevent duplicates
      const { data: existingItems } = await supabase
        .from('menu_items')
        .select('name, position')
        .eq('category_id', effectiveCatId)
        .order('position', { ascending: false });

      let nextItemPos = (existingItems?.[0]?.position ?? -1) + 1;
      const existingItemNames = new Set(
        ((existingItems as Array<{ name: string; position: number }> | null) || []).map((i) =>
          i.name.trim().toLowerCase()
        )
      );

      for (const item of catData.items) {
        const itemLower = item.name.trim().toLowerCase();
        // Skip duplicate items if already present in this category
        if (existingItemNames.has(itemLower)) {
          continue;
        }

        const itemSlug = `${slugify(item.name) || 'item'}-${crypto.randomBytes(3).toString('hex')}`;
        const { error: itemErr } = await supabase
          .from('menu_items')
          .insert({
            restaurant_id: restaurantId,
            category_id: effectiveCatId,
            name: item.name.trim(),
            slug: itemSlug,
            description: item.description || null,
            price_paise: item.pricingMode === 'single' ? item.pricePaise : null,
            variant_prices: item.pricingMode === 'variants' ? item.variantPrices : null,
            is_veg: item.isVeg ?? null,
            tags: item.tags || [],
            is_available: true,
            is_signature: item.isSignature || false,
            is_most_ordered: item.isMostOrdered || false,
            custom_tag: item.customTag || null,
            position: nextItemPos++,
          });

        if (itemErr) {
          throw new Error(`Failed to insert item "${item.name}": ${itemErr.message}`);
        }

        existingItemNames.add(itemLower);
        importedItemsCount++;
      }
    }

    // 2. Log commit audit event
    await logAIAuditEvent({
      actorId: profile.id,
      restaurantId,
      action: 'menu_committed',
      metadata: {
        imported_categories: importedCategoriesCount,
        imported_items: importedItemsCount,
      },
    });

    revalidatePath('/owner/menu');

    return {
      success: true,
      importedCategories: importedCategoriesCount,
      importedItems: importedItemsCount,
    };
  } catch (err: any) {
    console.error('Failed to commit menu:', err);
    return { success: false, error: err.message || 'Failed to save menu items.' };
  }
}
