# ZaaykaTech — Phase 2 Plan: Owner Onboarding and Branding

**Author:** Antigravity Architect & Senior SaaS Engineer  
**Status:** Approved for Implementation  
**Phase:** 2 — Owner Onboarding, Branding, R2 Uploads, QR Generator, and Publish Flow  

---

## 1. Exact Pages and Components

### Pages
1. `/owner/onboarding` (`src/app/(owner)/owner/onboarding/page.tsx`):
   - Multi-step onboarding wizard for owners who don't have a restaurant yet or want to complete initial setup:
     - Step 1: Restaurant Details (Name, Tagline)
     - Step 2: Contact, Address & Socials (Phone, WhatsApp, Street, City, State, Pincode, Maps URL, Instagram, Google Review)
     - Step 3: Logo & Hero Media Upload (Direct R2 Presigned Uploads)
     - Step 4: Theme Selection (Colors & Card Style)
     - Step 5: Live Interactive Preview
     - Step 6: Confirmation & Publish
2. `/owner/branding` (`src/app/(owner)/owner/branding/page.tsx`):
   - Dedicated branding & theme editor for already created restaurants:
     - Logo upload with preview
     - Hero media type toggle (Image vs. Video)
     - Video / Image upload with poster preview
     - Color pickers: Primary, Accent, Background
     - Card style selector (Warm Editorial, Minimalist, Modern Dark, Royal Heritage)
     - Real-time side-by-side or tabbed preview
3. `/owner/qr` (`src/app/(owner)/owner/qr/page.tsx`):
   - Dynamic QR Code center:
     - Live SVG and Canvas rendering of restaurant's public URL
     - Download as PNG (High-res 1024x1024 print ready)
     - Download as SVG (Vector format for printing)
     - One-click copy public link
     - Print preview card template (Standee / Table Tent styling)
4. `/owner/settings` (`src/app/(owner)/owner/settings/page.tsx`):
   - Restaurant Profile & Publish Status management:
     - Contact & Social Links editor
     - Address editor
     - **Publish / Unpublish toggle button**
     - Slug display and live status indicators
5. `/owner/preview` or modal preview:
   - Uses existing `PublicMenu` component with typed props for zero divergence between dashboard preview and live menu.

### Reusable Components
- `src/components/owner/OnboardingWizard.tsx`: Multi-step form controller with validation, progress indicator, and state management.
- `src/components/owner/MediaUploader.tsx`: Drag-and-drop file uploader that requests a presigned URL, validates MIME type and file size, uploads directly to Cloudflare R2, and displays upload progress.
- `src/components/owner/ThemeCustomizer.tsx`: Color palette select, live color inputs, and card style preview.
- `src/components/owner/QRCodeGenerator.tsx`: SVG/Canvas QR renderer with high-res PNG download, SVG download, copy link, and print format preview.
- `src/components/owner/TrialCountdownBanner.tsx`: Real-time remaining hours and minutes counter with persistent upgrade CTA.
- `src/components/owner/PublishStatusSwitch.tsx`: Safe toggle to switch between `published` and `draft` (unpublish) with confirmation.

---

## 2. Server Actions

Located in `src/actions/`:
1. `src/actions/restaurant.ts`:
   - `createRestaurant(input: CreateRestaurantInput)`:
     - Verifies authenticated user and loads profile.
     - Generates unique slug (using `slugify` with collision check and numeric suffix).
     - Calculates `trial_ends_at = now + TRIAL_DURATION_HOURS` (default 24h).
     - Sets `status = 'draft'`, `site_status = 'trialing'`, `onboarding_source = 'self_serve'`, `published_at = null`.
     - Automatically creates initial default categories (`Bestsellers`, `Beverages`).
     - Inserts default `qr_codes` record with generated short code.
   - `updateRestaurantProfile(restaurantId: string, input: UpdateRestaurantProfileInput)`:
     - Verifies owner authorization.
     - Updates name, tagline, contact, address, social links.
   - `updateBrandingAndTheme(restaurantId: string, input: UpdateBrandingThemeInput)`:
     - Verifies owner authorization.
     - Updates `branding` and `theme` JSONB fields.
   - `publishRestaurantAction(restaurantId: string)`:
     - Verifies owner authorization.
     - Sets `status = 'published'` and `published_at = timezone('utc'::text, now())`.
     - Recalculates `site_status` (trialing/active).
   - `unpublishRestaurantAction(restaurantId: string)`:
     - Verifies owner authorization.
     - Sets `status = 'draft'`.
     - Public menu becomes offline (returns 404).
     - Preserves all menu items, branding, and QR records.
2. `src/actions/media.ts`:
   - `getPresignedUploadUrl(restaurantId: string, fileType: string, fileSize: number, purpose: 'logo' | 'hero' | 'poster' | 'dish')`:
     - Verifies owner authorization for `restaurantId`.
     - Validates MIME type (`image/png`, `image/jpeg`, `image/webp`, `video/mp4`, `video/webm`).
     - Validates size limit (Max 5MB for images, Max 30MB for hero videos).
     - Generates safe key: `restaurants/{restaurantId}/{purpose}-{timestamp}-{random}.ext`.
     - Generates presigned PUT URL via AWS S3 SDK (configured for Cloudflare R2).
     - Returns `{ uploadUrl, publicUrl, key }`.

---

## 3. Supabase Tables and Fields Used

1. **`profiles`**:
   - `id`, `auth_user_id`, `full_name`, `phone`, `role`.
2. **`restaurants`**:
   - `id`, `owner_profile_id`, `slug`, `name`, `status`, `onboarding_source`, `trial_ends_at`, `published_at`, `site_status`, `branding`, `contact`, `address`, `social_links`, `theme`, `updated_at`.
3. **`qr_codes`**:
   - `id`, `restaurant_id`, `short_code`, `scan_count`, `asset_url`.
4. **`menu_categories`**:
   - Initial starter categories populated upon restaurant creation.

---

## 4. Cloudflare R2 Upload Flow

```
[Browser / Owner Dashboard]
       │
       │ 1. Request presigned upload URL with file metadata (MIME, size, purpose)
       ▼
[Next.js Server Action: getPresignedUploadUrl]
       │ - Authenticate session via Supabase Auth
       │ - Verify ownership: caller profile must match restaurant.owner_profile_id
       │ - Validate MIME type & enforce size limits (Image <= 5MB, Video <= 30MB)
       │ - Generate unique key: restaurants/{restaurantId}/{purpose}-{uuid}.{ext}
       │ - Generate presigned S3 PUT URL via @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner
       │
       ▼ Returns { uploadUrl, publicUrl } (service-role & R2 secrets stay strictly on server)
[Browser]
       │
       │ 2. PUT binary data directly to Cloudflare R2 via uploadUrl with Content-Type header
       ▼
[Cloudflare R2 Bucket]
       │
       ▼ 3. On 200 OK, Browser passes publicUrl to updateBrandingAndTheme server action
[Next.js Server Action]
       │ - Persists publicUrl in restaurants.branding JSONB
```

---

## 5. Zod Schemas (`src/validations/restaurant.ts`)

- `RestaurantDetailsSchema`: `name` (2-80 chars), `tagline` (max 150 chars).
- `RestaurantContactSchema`: `phone`, `whatsapp`, `email`.
- `RestaurantAddressSchema`: `street`, `city`, `state`, `pincode`, `google_maps_url`.
- `RestaurantSocialLinksSchema`: `instagram`, `facebook`, `google_review`.
- `RestaurantBrandingSchema`: `logo_url`, `hero_media_type` ('image' | 'video'), `hero_media_url`, `hero_poster_url`, `tagline`.
- `RestaurantThemeSchema`: `primary_color` (hex), `accent_color` (hex), `background_color` (hex), `card_style` (enum).
- `CreateRestaurantInputSchema`: Combines details, contact, address, branding, theme.
- `MediaUploadRequestSchema`: `restaurantId`, `fileType`, `fileSize`, `purpose`.

---

## 6. Trial & Site-Status Behavior in Phase 2

- **Initial Restaurant Creation**:
  - `status = 'draft'`
  - `site_status = 'trialing'`
  - `trial_ends_at = now() + 24 hours`
  - `published_at = null`
  - While in `status = 'draft'`, public visitors cannot view the menu (returns 404). Owner sees full live preview inside dashboard.
- **On Explicit Owner Publish**:
  - `status = 'published'`
  - `published_at = now()`
  - Public menu becomes instantly accessible at `/r/[slug]` or `[slug].zaaykatech.com`.
- **On Owner Unpublish**:
  - `status = 'draft'`
  - Public menu returns 404 / unavailable immediately.
  - Owner dashboard remains completely accessible with all menu and media data preserved.
- **Trial Countdown Banner**:
  - Displayed prominently in dashboard header showing hours/minutes remaining until trial expiry.
  - Shows "Upgrade to Yearly (₹2999)" CTA.

---

## 7. Test Plan

1. **Restaurant Creation & Slug Uniqueness**:
   - Creating a restaurant generates slug from name.
   - Creating a duplicate name appends numeric suffix (`cafe-pune`, `cafe-pune-2`).
   - Verifies `status = 'draft'`, `site_status = 'trialing'`, `published_at = null`.
2. **Owner Authorization Guard**:
   - Profile B cannot update or publish Profile A's restaurant.
3. **Upload Authorization & Validation**:
   - Non-owner cannot request presigned URL for another restaurant.
   - Disallowed MIME types (e.g. `.exe`, `.html`, `.js`) are rejected.
   - Oversized files (> 5MB images, > 30MB videos) are rejected.
4. **Publish / Unpublish Lifecycle**:
   - `publishRestaurant` sets `published_at` and `status = 'published'`.
   - `unpublishRestaurant` sets `status = 'draft'`.
   - Public resolver blocks draft restaurants.
5. **QR Code Generation**:
   - Short code generation and public URL resolution verification.

---

## 8. Files to Create or Modify

- **New Files**:
  - `src/validations/restaurant.ts` (Zod schemas)
  - `src/lib/storage/r2.ts` (Cloudflare R2 client & presigned URL generator)
  - `src/actions/restaurant.ts` (Server actions for create, update, publish, unpublish)
  - `src/actions/media.ts` (Presigned upload URL server action)
  - `src/components/owner/OnboardingWizard.tsx` (Multi-step setup wizard)
  - `src/components/owner/MediaUploader.tsx` (Direct R2 drag-drop upload component)
  - `src/components/owner/ThemeCustomizer.tsx` (Colors and card styling editor)
  - `src/components/owner/QRCodeGenerator.tsx` (QR renderer, SVG/PNG download, print kit)
  - `src/components/owner/TrialCountdownBanner.tsx` (Real-time trial countdown alert)
  - `src/app/(owner)/owner/onboarding/page.tsx` (Onboarding page)
  - `src/app/(owner)/owner/branding/page.tsx` (Branding page)
  - `src/app/(owner)/owner/qr/page.tsx` (QR code center)
  - `src/app/(owner)/owner/settings/page.tsx` (Settings & Publish/Unpublish toggle)
  - `tests/phase2-verification.ts` (Automated integration & security tests)
- **Modified Files**:
  - `src/app/(owner)/owner/page.tsx` (Connect wizard CTA if no restaurant, show live QR preview)
  - `src/app/(owner)/owner/layout.tsx` (Integrate TrialCountdownBanner)
  - `package.json` (Add `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` for Cloudflare R2, `qrcode` for SVG/PNG generation)
