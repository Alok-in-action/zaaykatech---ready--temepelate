# ZaaykaTech Owner Lifecycle & Onboarding Architecture

This document specifies the complete product lifecycle, state machine, onboarding wizard flow, database constraints, and payment lifecycle for restaurant owners on ZaaykaTech.

---

## 1. Core Architecture Principles

1. **One Restaurant Per Owner**:
   - Each authenticated owner account (`profiles.id` resolved from `auth_user_id`) can create and own exactly **one** active restaurant (`archived_at IS NULL`).
   - Multiple restaurant creation is prevented at three independent levels:
     - **Database**: Partial unique index `UNIQUE(owner_profile_id) WHERE archived_at IS NULL`.
     - **Server Actions**: `createRestaurant()` verifies caller has no non-archived restaurant before proceeding.
     - **UI**: Multi-restaurant switchers and "+ New Restaurant" CTAs are removed.
   - Deletion of restaurants is performed via soft archive (`archived_at = timezone('utc'::text, now())`). Historical data is never hard deleted.

2. **Trial Timing**:
   - The 24-hour free trial timer **does not** start upon initial restaurant registration or draft creation.
   - The trial starts strictly upon owner publication (`published_at`), setting `trial_ends_at = now() + 24 hours` and `status = 'published'`.

3. **Persistent Onboarding Resumption**:
   - Onboarding is broken into a focused, one-step-at-a-time 5-step wizard.
   - Progress is committed to the database after each step (`onboarding_current_step`).
   - If an owner logs out, closes their tab, or switches devices, logging back in routes them to the exact step where they left off.
   - Once onboarding is completed and published (`onboarding_status = 'completed'`), subsequent logins bypass onboarding and open the management dashboard directly.

4. **Authoritative Server Resolution**:
   - Active restaurant resolution does not depend on mutable cookies or browser `localStorage`.
   - The server queries `restaurants WHERE owner_profile_id = profile.id AND archived_at IS NULL` as the single authoritative source of truth.

5. **Post-Payment Routing & Polling**:
   - After successful Razorpay checkout, the client initiates up to 30 seconds of polling to confirm database activation before routing to the dashboard.
   - Successful checkout directs owners straight to `/owner` (dashboard), never back to onboarding.

---

## 2. Owner Lifecycle State Machine

The owner lifecycle evaluator (`getOwnerLifecycle()`) computes one of 6 distinct states:

```
[ Unauthenticated / No Restaurant ]
              │
              ▼
       [ no_restaurant ] ─────────► Redirects to /owner/onboarding (Step 1)
              │
       (Completes Step 1)
              ▼
   [ onboarding_in_progress ] ────► Resumes /owner/onboarding (Step 2..5)
              │
       (Completes Step 5: Publish)
              ▼
        [ trial_active ] ────────► Dashboard access; 24h trial countdown banner
              │
         (24h elapses)
              │
              ├──► [ grace_period ] (Next 24h courtesy) ──► Dashboard access; urgent renewal CTA
              │         │
              │   (Grace elapses)
              │         ▼
              └──► [ expired ] ────────────────────────► Public menu offline; renewal banner/card
                        │
                  (Pays ₹2,999)
                        ▼
             [ subscription_active ] ──────────────────► Dashboard access; 365 days added
```

### State Summary Table

| State | Condition | Public Menu Status | Route / Behavior |
|---|---|---|---|
| `no_restaurant` | No non-archived restaurant record | 404 Not Found | Redirects to `/owner/onboarding` (Step 1) |
| `onboarding_in_progress` | Restaurant exists; `onboarding_status != 'completed'` or `status != 'published'` | 404 Not Found | Redirects to `/owner/onboarding` at `onboarding_current_step` |
| `trial_active` | `published_at` set, `now <= trial_ends_at` | Live Online (`trialing`) | Allows `/owner` dashboard; displays trial countdown banner |
| `grace_period` | Within 24 hours after trial or subscription expiry | Live Online (`grace_period`) | Allows `/owner` dashboard; displays grace period alert & renew CTA |
| `subscription_active` | Paid yearly plan, `now <= subscription_end_date` | Live Online (`active`) | Allows `/owner` dashboard; displays days remaining & renewal date |
| `expired` | Past trial & grace period, or past subscription & grace | Offline Notice (`expired`) | Shows prominent renewal card on `/owner` and `/owner/billing` |

---

## 3. Onboarding Steps Breakdown

The wizard renders only the current step on screen with a progress indicator and allows jumping back to any previously completed step:

### Step 1 — Restaurant Basics
- **Fields**: Restaurant name (min 2 chars), Food type/cuisine, Tagline, Phone number, WhatsApp number, Street, City, State, Pincode, Google Maps URL.
- **Validation**: Name, Food type, Phone, and City are mandatory.
- **Action**: Creates the draft restaurant (or updates if resuming) with `onboarding_status = 'in_progress'` and `onboarding_current_step = 1`. `trial_ends_at` remains `null`.
- **Next**: Advances to Step 2.

### Step 2 — Branding & Visual Theme
- **Uploads**:
  - Logo upload (PNG / WEBP, up to 5MB) via Supabase Storage / R2.
  - Hero background media: static image or cinematic background video (up to 50MB).
  - Video poster image (mandatory if video hero is selected).
- **Theme Selection**:
  - Color palette selection (Warm Artisanal, Royal Heritage, Botanical Bistro, Midnight Velvet).
  - Card style selection (`warm_editorial`, `heritage`, `minimalist`, `modern_dark`).
- **Action**: Calls `saveOnboardingStepAction(restaurantId, 3, { branding, theme })`.
- **Next**: Advances to Step 3.

### Step 3 — Menu Setup
- **Category Creation**: Add at least one menu category (e.g. Starters, Main Course, Beverages).
- **Dish Creation**: Add at least one dish (Name, Category, Price in ₹, Veg/Non-Veg toggle, Description).
- **AI OCR Import**: Option to launch menu extractor from photos/PDFs.
- **Guard**: Must have at least 1 active category and 1 available dish before advancing.
- **Action**: Calls `saveOnboardingStepAction(restaurantId, 4, {})`.
- **Next**: Advances to Step 4.

### Step 4 — Review & Live Mobile Preview
- **Summary**: Displays restaurant identity, location, contact, branding, and menu item count.
- **Interactive Preview**: Live customer preview rendered inside Apple-framed mobile container using `<PublicMenu />`.
- **Edit Controls**: Fast edit buttons jump back to Step 1, 2, or 3 as desired.
- **Next**: Advances to Step 5.

### Step 5 — Publish & QR Launch
- **Action**: Calls `publishRestaurantAction(restaurantId)`.
- **State Transition**:
  - `status = 'published'`
  - `published_at = now()`
  - `trial_ends_at = now() + 24 hours` (Starts 24-hour trial timer)
  - `onboarding_status = 'completed'`
  - `onboarding_completed_at = now()`
  - `onboarding_current_step = 5`
- **Output**:
  - Generates & displays high-resolution printable QR code.
  - Displays public URL (`https://.../r/[slug]`) with quick copy and visit buttons.
  - Primary button: "Go to Management Dashboard" (`router.push('/owner')`).

---

## 4. Subscription Renewal Arithmetic

Subscription renewals extend access by **365 calendar days** (`YEARLY_PLAN_DURATION_DAYS = 365`):

1. **Active Subscription (Early Renewal)**:
   - If the restaurant has an active subscription expiring in the future (`existing_end > now`):
   - `new_end_date = existing_end + 365 days`
   - Example: Subscription expiring `2027-04-15` renewed on `2027-01-10` is extended to `2028-04-15`.

2. **Expired Subscription or Trial (Reactivation)**:
   - If the restaurant is expired or in trial (`existing_end <= now` or null):
   - `new_end_date = payment_date + 365 days`
   - Example: Expired restaurant paying on `2026-11-14` is extended to `2027-11-14`.

3. **Webhook & Server Idempotency**:
   - Payment signatures are cryptographically verified using HMAC-SHA256 (`crypto.timingSafeEqual`).
   - Each payment ID (`external_payment_id`) is checked against the `payments` table.
   - Replay webhooks or duplicate client calls return HTTP 200 without double-extending the subscription.

---

## 5. Security & Isolation Model

- **Profile-Based Ownership**: All ownership validations compare `restaurants.owner_profile_id` against the caller's resolved `profiles.id` (never comparing auth UUID directly to profile UUID).
- **Database Unique Constraint**: `idx_restaurants_single_active_owner` guarantees zero possibility of duplicate active restaurants even under concurrent requests.
- **Secret Hygiene**: Razorpay key secrets are never sent to browser clients. Only `NEXT_PUBLIC_RAZORPAY_KEY_ID` is returned to client checkout components.
- **Production Isolation**: Demo mock tenants are strictly gated to development mode and never served in production.
