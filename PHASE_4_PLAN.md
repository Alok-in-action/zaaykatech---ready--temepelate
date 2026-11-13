# ZaaykaTech — Phase 4 Plan: AI Menu Import (Google Gemini + Genkit)

**Author:** Antigravity Architect & Senior SaaS Engineer  
**Status:** Approved for Implementation  
**Phase:** 4 — AI Multi-Modal Menu Extraction, Review & Correction UI, R2 Media Vault, and Safe Commit Pipeline  

---

## 1. Exact Pages, Components, Server Actions, API Routes & Zod Schemas

### Pages & Routes
1. `/owner/menu/ai-import` (`src/app/(owner)/owner/menu/ai-import/page.tsx`):
   - Multi-modal upload stage (Image, PDF, Pasted Text, CSV)
   - Real-time extraction status with progress indicators & transient failure retries
   - Side-by-side Review & Correction interface
   - Selection checkboxes (import only approved categories & items)
   - Category rename, merge, delete, reassign
   - Item inline edits, confidence score indicators, suspicious price highlights
   - Save / Commit confirmation modal (persists to Supabase without auto-publishing)
2. `POST /api/ai/extract-menu` (`src/app/api/ai/extract-menu/route.ts`):
   - Server-side API route for multi-modal Gemini extraction
   - Rate limiting: Max 5/hr, max 20/day per owner profile
   - Audit logging for extraction attempts

### Components
1. `src/components/owner/ai/MenuSourceUploader.tsx`:
   - Tabbed inputs:
     - Tab 1: Image Upload (JPG, PNG, WebP up to 10MB)
     - Tab 2: PDF Upload (Document up to 10MB)
     - Tab 3: Pasted Text (Raw text area)
     - Tab 4: CSV File Upload (Spreadsheet up to 2MB)
   - Uploads binary files directly to Cloudflare R2 under `restaurants/{restaurantId}/ai-imports/{uploadId}/`
2. `src/components/owner/ai/ExtractionReviewTable.tsx`:
   - Interactive review screen:
     - Category headers with edit/delete/merge controls and selective checkbox
     - Item cards/rows with inline edits for name, description, veg flag, single price or variants, and tags
     - Confidence indicators:
       - Green: High confidence (>= 0.8)
       - Yellow: Medium confidence (0.5 - 0.79)
       - Red: Low confidence (< 0.5) with warning badge
     - Suspicious price badges (e.g. ₹0 or unpriced items highlighted with exclamation)
     - Quick "Select All" / "Deselect All"
3. `src/components/owner/ai/CommitSummaryModal.tsx`:
   - Confirmation dialog before saving:
     - Shows total selected categories and dishes to be imported
     - Warning: "This action will add items to your menu in Draft status and will not publish automatically"

### Server Actions
Located in `src/actions/ai-import.ts`:
1. `requestAIImportUploadUrl(restaurantId: string, fileType: string, fileSize: number)`:
   - Verifies owner authorization.
   - Enforces size limits: 10MB for image/PDF, 2MB for CSV.
   - Generates R2 key: `restaurants/{restaurantId}/ai-imports/{uploadId}/{timestamp}-{random}.ext`.
   - Returns presigned PUT URL.
2. `extractMenuFromSource(restaurantId: string, source: { type: 'r2_file' | 'text' | 'csv'; r2Key?: string; textContent?: string; mimeType?: string })`:
   - Checks owner rate limits (5/hr, 20/day).
   - Calls Genkit Gemini 2.5 Flash with structured Zod schema output.
   - Implements exponential backoff retry (up to 3 attempts) for transient 429/503 errors.
   - Validates output with `AIMenuExtractionOutputSchema`.
   - Records audit log in `audit_logs`.
   - Returns validated JSON structure.
3. `commitExtractedMenu(restaurantId: string, payload: CommitMenuPayload)`:
   - Verifies owner authorization.
   - Validates payload with `CommitMenuPayloadSchema`.
   - Prevents duplicate item names within the same category.
   - Sequentially assigns position values to categories and items.
   - Inserts records into `menu_categories` and `menu_items`.
   - Does NOT publish the menu automatically.
   - Records audit log.

---

## 2. Genkit / Gemini Integration Flow

```
[Owner Dashboard: /owner/menu/ai-import]
       │
       │ 1. Uploads file to R2 or submits pasted text
       ▼
[Next.js Server: extractMenuFromSource]
       │
       │ 2. Check rate limits (Max 5/hr, 20/day per owner)
       │ 3. Fetch image/PDF from R2 as buffer or read text/CSV
       │ 4. Call Genkit Gemini (gemini-2.5-flash) with structured Zod output
       │    - Exponential backoff retry (1s, 2s, 4s) on transient errors
       │
       ▼
[Zod Output Validation: AIMenuExtractionOutputSchema]
       │
       │ 5. Returns validated JSON with confidence scores & pricingMode
       ▼
[Review & Correction Screen]
       │
       │ 6. Owner inspects, edits uncertain items, selects items to import
       │ 7. Owner clicks "Save & Commit to Menu"
       ▼
[Next.js Server: commitExtractedMenu]
       │
       │ 8. Deduplicates & inserts categories and dishes into Supabase
       │ 9. Menu saved in draft state (NOT published automatically)
```

---

## 3. Extraction Output Zod Schema (`src/validations/ai.ts`)

```ts
export const AIExtractedItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name cannot be empty'),
  description: z.string().trim().nullable().optional(),
  pricingMode: z.enum(['single', 'variants']).default('single'),
  pricePaise: z.number().int().nonnegative().nullable().optional(),
  variantPrices: z.record(z.string(), z.number().int().positive()).nullable().optional(),
  isVeg: z.boolean().nullable().optional(),
  tags: z.array(z.string().trim()).default([]),
  confidence: z.number().min(0).max(1).default(0.85),
});

export const AIExtractedCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name cannot be empty'),
  description: z.string().trim().nullable().optional(),
  items: z.array(AIExtractedItemSchema).default([]),
});

export const AIMenuExtractionOutputSchema = z.object({
  restaurantName: z.string().trim().nullable().optional(),
  categories: z.array(AIExtractedCategorySchema).default([]),
});
```

---

## 4. AI Prompt Design

The system instruction explicitly directs Gemini:
- Parse all categories, dishes, ingredients, dietary flags (veg/non-veg), and prices.
- Identify single prices (convert Rupees to integer paise, e.g. ₹250 -> 25000 paise).
- Identify size/style variants (e.g., Half/Full, Regular/Large, NY/Neapolitan) and store under `variantPrices` with integer paise.
- Assign a confidence score (`0.0` to `1.0`) reflecting OCR legibility.
- Never invent food items not present on the document.

---

## 5. Rate Limits, Retries & Fallback Strategy

1. **Rate Limiting**:
   - 5 extraction attempts per owner per hour.
   - 20 extraction attempts per owner per day.
   - In production, backed by database audit logs / Redis; in development, managed with sliding window rate limiting.
2. **Transient Error Retries**:
   - Uses exponential backoff (attempt 1: immediate, attempt 2: +1000ms, attempt 3: +2000ms) for transient HTTP 429/500/503 errors from the AI API.
3. **Local Dev Mock Fallback**:
   - If `GEMINI_API_KEY` is not configured or in development mode, returns a high-fidelity parsed menu draft so the review-and-correction UI can be tested end-to-end.

---

## 6. Security and Abuse-Prevention Plan

- **Ownership Authorization**: Every request validates `restaurant.owner_profile_id === profile.id`.
- **R2 Storage Isolation**: Files stored strictly under `restaurants/{restaurantId}/ai-imports/{uploadId}/`.
- **File Validation**: Max 10MB for images/PDFs, max 2MB for CSV. Allowed MIME types enforced.
- **Audit Logs**: Every extraction and commit event is logged to `audit_logs` with timestamps, file size, and IP.
- **Zero Auto-Publish**: Extracted data is saved as draft dishes; owner must explicitly publish in settings.

---

## 7. Test Plan (`tests/phase4-verification.ts`)

1. **Zod Validation**:
   - Valid AI extraction output passes schema.
   - Invalid or malformed structures are rejected.
2. **Price Conversion & Variant Validation**:
   - Single price in Rupees properly converts to integer paise.
   - Variant prices correctly map to integer paise dictionary.
3. **Duplicate Dish Detection**:
   - Commit action detects and skips/merges duplicate item names in the same category.
4. **Rate Limiting**:
   - Requests exceeding 5/hour per owner are rejected with HTTP 429.
5. **Commit Flow**:
   - Only selected categories and items are committed to the database.
   - `published_at` and `status` remain untouched (no auto-publish).

---

## 8. Files to Create or Modify

- **New Files**:
  - `src/validations/ai.ts` (Zod schemas for AI extraction and commit payloads)
  - `src/actions/ai-import.ts` (Server actions for upload URL, extraction, and commit)
  - `src/components/owner/ai/MenuSourceUploader.tsx` (Multi-modal uploader)
  - `src/components/owner/ai/ExtractionReviewTable.tsx` (Review & correction screen)
  - `src/app/(owner)/owner/menu/ai-import/page.tsx` (AI import route)
  - `tests/phase4-verification.ts` (Automated Phase 4 test suite)
- **Modified Files**:
  - `src/lib/storage/r2.ts` (Support `ai-import` upload purpose and 10MB PDF limit)
  - `src/app/(owner)/owner/menu/page.tsx` (Add quick CTA link to AI Import)
