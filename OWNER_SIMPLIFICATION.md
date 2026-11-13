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

## 4. Screen Rules & Mobile Ergonomics

1. **One Question Per Screen**: Each screen presents exactly one question and one primary action button at the bottom of the screen.
2. **Input Dimensions**:
   - Inputs are at least 56px tall (`min-h-[56px]`).
   - Font sizes: 18px text (`text-lg`), 16px helper text (`text-base`).
   - High-contrast borders and active focus rings.
3. **Plain Language & Examples**:
   - Plain words only; example hints appear directly beneath each input field (e.g. `Example: 9876543210`, `e.g., Royal Biryani House`).
4. **Validation**:
   - Friendly error messages appear beside/beneath the field.
   - Advancing is strictly blocked on invalid data.
5. **Autosave & Quiet Tick**:
   - Saving occurs automatically upon completing each question.
   - A quiet `"Saved"` tick with checkmark icon appears in the top header.
   - Resuming returns to the exact sub-step previously saved.
6. **Navigation Constraints**:
   - Back link is always visible (`subStep !== '1a'`).
   - Skip link is rendered only on optional questions (2a, 2b, 2c).
   - Top navigation tabs are completely hidden during onboarding; header renders only the ZaaykaTech Owner logo, `"Need help? WhatsApp"` button, and `"Sign Out"`.
7. **Accessibility & Design Standards**:
   - Lucide icons only (no raw emojis).
   - Respects user motion preferences (`motion-reduce:transition-none`).

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
1. `tests/substep-onboarding-test.ts`:
   - Sub-step bidirectional mapping (`11..52` $\leftrightarrow$ `1a..5b`).
   - Exact sub-step resume verification (e.g., resume at 1c or 2b).
   - Strict Indian 10-digit mobile number validation (`/^[6-9]\d{9}$/`).
   - Step 3 menu requirement blocking (requires $\ge 1$ category and $\ge 1$ dish).
   - Step 2 optional skippability verification.
   - Translation dictionary completeness.
2. `tests/group1-onboarding-test.ts`: Creation and branding preservation.
3. `tests/group2-razorpay-test.ts`: Payment confirmation and webhook integrity.
4. `tests/group3-lifecycle-test.ts`: Lifecycle states, trial protection, and DB error handling.
5. `tests/group4-wizard-test.ts`: Live preview construction and fresh publish retention.
6. Full Next.js production build (`npm run build`) and typecheck (`npm run typecheck`).
