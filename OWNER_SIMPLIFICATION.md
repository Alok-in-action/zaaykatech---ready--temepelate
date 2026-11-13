# ZaaykaTech Owner Onboarding Simplification

## 1. Overview
The restaurant onboarding wizard has been redesigned into a focused, **one-question-per-screen** flow with granular sub-steps. This design is optimized for non-technical restaurant owners operating on mobile devices (360px and 390px viewports), while maintaining a clean, centered single column on desktop screens.

---

## 2. Structure & Sub-Step Hierarchy

The onboarding flow preserves the 5 authoritative milestones, subdivided into 13 granular, single-question screens.

### Progress Indicator
- Top banner displays: `"Step X of 5 · Question Y of N"`
- Visual progress bar indicating percentage completion across the sub-steps.
- A quiet, animated `"Saved"` tick indicator confirms progress autosave.

```
Step 1: About you (4 Questions)
├── 1a. Restaurant name (Required, min 2 chars)
├── 1b. What do you serve? (Required, 6 large tap cards: Veg, Non-veg, Cafe, Sweets, Bakery, Other)
├── 1c. Phone number (Required, Indian 10-digit validation: /^[6-9]\d{9}$/, example: 9876543210)
└── 1d. City (Required)

Step 2: Look (3 Questions, All Skippable)
├── 2a. Add your logo (Skippable, with Try Again and Skip for now on failure)
├── 2b. Pick a style (4 preset color cards: Warm Amber, Modern Clean, Midnight Luxury, Royal Heritage)
└── 2c. Add a cover photo (Skippable, hero banner image)

Step 3: Menu (3 Questions)
├── 3a. Add your first category (Chips: Starters, Main Course, Breads, Rice, Drinks, Desserts)
├── 3b. Add your first dish (Name and price in ₹ only)
└── 3c. Next action (Add another dish, Photograph menu / OCR, or Continue to Check; requires >= 1 category & >= 1 dish)

Step 4: Check (1 Question)
└── 4a. Phone preview of the menu with "Edit" links for each section jumping to respective sub-steps

Step 5: Go live (2 Questions)
├── 5a. "Go Live Now" button with 14-day trial notice
└── 5b. Table QR code, Copy link, Share on WhatsApp, Download QR, and Go to Owner Dashboard
```

---

## 3. Database Sub-Step Persistence & Compatibility

To ensure zero database migrations and zero breaking changes to existing restaurants or backend lifecycle logic, sub-steps are mapped to integer values stored in `restaurants.onboarding_current_step`:

| Sub-step | Code | Milestone | Screen Title | Skippable? |
|---|---|---|---|---|
| `1a` | `11` | Step 1 | Restaurant name | No |
| `1b` | `12` | Step 1 | What do you serve? | No |
| `1c` | `13` | Step 1 | Phone number | No |
| `1d` | `14` | Step 1 | City | No |
| `2a` | `21` | Step 2 | Add your logo | Yes |
| `2b` | `22` | Step 2 | Pick a style | Yes |
| `2c` | `23` | Step 2 | Add a cover photo | Yes |
| `3a` | `31` | Step 3 | Add your first category | No |
| `3b` | `32` | Step 3 | Add your first dish | No |
| `3c` | `33` | Step 3 | Menu options / Check | No |
| `4a` | `41` | Step 4 | Phone preview & review | No |
| `5a` | `51` | Step 5 | Go Live Confirmation | No |
| `5b` | `52` | Step 5 | Live Success & QR Code | No |

### Legacy Backwards-Compatibility
Any legacy integer `1..5` is decoded automatically:
- `1` $\rightarrow$ `1a`
- `2` $\rightarrow$ `2a`
- `3` $\rightarrow$ `3a`
- `4` $\rightarrow$ `4a`
- `5` $\rightarrow$ `5a`

---

## 4. Screen Rules, Mobile Ergonomics & Dashboard Patterns

### Mobile Viewport & Layout Rules (Priority 360px & 390px, also 412px & 768px)
1. **Single Centered Column**: Single centered column with 16px side padding (`px-4`). No horizontal scrolling allowed at any width (`document.documentElement.scrollWidth <= window.innerWidth`).
2. **Dynamic Viewport Height (`100dvh`)**: All full-height mobile wrappers use `min-h-[100dvh]` (never `100vh`) to avoid vertical overflow and jumpiness when mobile browser address bars expand/collapse.
3. **Sticky Safe-Area Bottom Bar**: The primary action button is pinned in a sticky bottom bar with backdrop blur (`bg-[#FAF8F5]/95 backdrop-blur-md sticky bottom-0 z-30`) and safe-area inset: `padding-bottom: max(16px, env(safe-area-inset-bottom))`.
4. **Keyboard Visibility & Auto-Scroll**: Every input includes `onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}` so both the focused field and sticky Next button remain visible when the virtual keyboard opens.
5. **Compact Mobile Progress**: Progress is displayed at the top via `"Step X of 5 · Question Y of N"` with a slim progress bar. The 5-circle desktop stepper is completely hidden on mobile.
6. **Mobile Dashboard Bottom Navigation (`OwnerBottomNav.tsx`)**:
   - Hidden during onboarding (`/owner/onboarding`).
   - Post-onboarding mobile view uses a fixed bottom tab bar with 4 items:
     1. **Home** (`/owner`)
     2. **My Menu** (`/owner/menu`)
     3. **QR Code** (`/owner/qr`)
     4. **My Plan** (`/owner/billing`)
   - Main content area includes bottom padding (`pb-24 md:pb-8`) so content is never obscured by the bottom tab bar.
7. **Mobile Bottom Sheet Dialogs**:
   - `CategoryEditorDialog` and `ItemEditorDialog` render as bottom sheets on mobile devices (`items-end sm:items-center`, `rounded-t-3xl sm:rounded-3xl`, max height `90dvh` with a pull handle bar) and center modals on desktop.
8. **Touch-Accessible Reordering**:
   - Menu items and categories provide dedicated touch-accessible Move Up / Move Down buttons (`min-h-[44px] min-w-[44px] active:scale-[0.97] touch-manipulation`) with proper `aria-label`s, removing reliance on drag-and-drop.

### Input Specifications
1. **iOS Safari Auto-Zoom Prevention**: All text inputs, textareas, and selects enforce `font-size: >= 16px` (`text-base` or `text-lg`). Pinch-zoom remains enabled without restricting `maximum-scale` in viewport metadata (`viewportFit: 'cover'`).
2. **Semantic Attributes**:
   - Phone: `type="tel"`, `autoComplete="tel"`, `inputMode="numeric"`, `enterKeyHint="next"`
   - Email: `type="email"`, `autoComplete="email"`
   - URLs / Links: `type="url"`
   - Prices & Numbers: `inputMode="decimal"`
   - Restaurant Name: `autoComplete="organization"`, `enterKeyHint="next"`
   - City: `autoComplete="address-level2"`, `enterKeyHint="done"`
3. **Dimensions & Touch Targets**:
   - Inputs are at least 56px tall (`min-h-[56px]`).
   - Tap cards and buttons are at least 48px tall (`min-h-[48px]`) with $\ge 8$px spacing.
   - Pointer-down press feedback on all interactive elements (`active:scale-[0.97] touch-manipulation`).
4. **Validation & Labels**:
   - Labels sit above the field (never placeholder-only).
   - Validation messages appear beneath the field in plain language without hiding inputs.

### Media & Camera Uploads (`MediaUploader.tsx`)
1. **Native Camera Capture**: Features a dedicated "Take Photo" button (`capture="environment"`, `accept="image/*"`) alongside "Choose from Gallery".
2. **Client-Side Image Compression (`image-compression.ts`)**: Downscales photos in the browser before upload (max 1600px long edge, JPEG/WebP quality 0.85) reducing 5-10MB camera files to ~200-400KB to save owner mobile data.
3. **Upload Feedback**: Real-time upload progress bar, green success checkmark, and a "Try Again" retry action on failure. Non-blocking upload allows owners to skip or continue if optional.

### Performance & Bundle Size
- QR Code generation (`QRCodeGenerator`) is dynamically imported with `next/dynamic` and a skeleton fallback.
- Step 1 initial JS bundle is **126 kB** (well under the 150 kB budget).

---

## 5. Fields Moved Out of Onboarding

The following secondary fields were removed from the onboarding wizard to keep the flow fast and friction-free. They remain fully manageable in the dashboard under **Restaurant Details / Settings**:
- WhatsApp contact number
- Full street address
- Google Maps link
- Tagline (tagline is no longer pre-filled with placeholder text)

---

## 6. Translation Architecture (`src/lib/i18n/onboarding.ts`)

All onboarding strings, question labels, helper hints, option cards, validation errors, and button texts are structured in a centralized dictionary (`src/lib/i18n/onboarding.ts`):
- `en`: Default English dictionary using simple, plain words.
- `hi`: Full Hindi schema structure ready for bilingual rollout.

---

## 7. Verification & Test Suite

All verification tests pass:
1. **Playwright Mobile Responsive Test (`tests/mobile-onboarding.spec.ts`)**:
   - **iPhone 14** (390x844, Safari mobile UA, `hasTouch: true`): Passed
   - **Pixel 7** (412x915, Chrome mobile UA, `hasTouch: true`): Passed
   - **Small mobile** (360x740, `hasTouch: true`): Passed
   - **Tablet** (768x1024, `hasTouch: true`): Passed
   - Asserts on every screen:
     - No horizontal scroll (`document.documentElement.scrollWidth <= window.innerWidth`)
     - Computed font sizes on all inputs $\ge 16$px (prevents iOS auto-zoom)
     - Primary Next/Continue action button is within visible viewport (sticky bottom bar with safe-area padding)
     - Step 1 completion (`1a` $\rightarrow$ `1b` $\rightarrow$ `1c` $\rightarrow$ `1d`) advances to Step 2 (`2a`).
2. `tests/substep-onboarding-test.ts`:
   - Sub-step bidirectional mapping (`11..52` $\leftrightarrow$ `1a..5b`).
   - Exact sub-step resume verification (e.g., resume at 1c or 2b).
   - Strict Indian 10-digit mobile number validation (`/^[6-9]\d{9}$/`).
   - Step 3 menu requirement blocking (requires $\ge 1$ category and $\ge 1$ dish).
   - Step 2 optional skippability verification.
   - Translation dictionary completeness.
3. `tests/group1-onboarding-test.ts`: Creation and branding preservation.
4. `tests/group2-razorpay-test.ts`: Payment confirmation and webhook integrity.
5. `tests/group3-lifecycle-test.ts`: Lifecycle states, trial protection, and DB error handling.
6. `tests/group4-wizard-test.ts`: Live preview construction and fresh publish retention.
7. Full Next.js production build (`npm run build`) and typecheck (`npm run typecheck`).
