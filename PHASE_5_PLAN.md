# ZaaykaTech — Phase 5 Plan: Subscriptions, Razorpay Integration & Trial Lifecycle

**Author:** Antigravity Architect & Senior SaaS Engineer  
**Status:** Approved for Implementation  
**Phase:** 5 — 24-Hour Trial Lifecycle, Razorpay Yearly Checkout, Webhooks, Idempotent Activation & Manual Renewal  

---

## 1. Scope & Explicit Exclusions

### Strictly Included in Phase 5:
1. **24-Hour Full-Access Trial Lifecycle**:
   - 24-hour full access trial (`TRIAL_DURATION_HOURS=24`).
   - Configurable 24-hour grace period (`GRACE_PERIOD_HOURS=24`).
   - State transition: `draft` -> `preview` -> `trialing` -> `trial_ending` -> `grace_period` -> `expired` -> `active` -> `payment_overdue` -> `suspended`.
2. **Trial Countdown & Upgrade Banner**:
   - Shows live hours/minutes left in trial or grace period.
   - Upgrade CTA triggering Razorpay modal.
   - Displays subscription status and end date when active (`Active until DD MMM YYYY`).
3. **Grace Period Behavior**:
   - When trial expires ($t > \text{trial\_ends\_at}$), restaurant enters `grace_period` for 24 hours.
   - Public QR menu remains live during grace period.
   - After grace period expires, restaurant enters `expired`.
4. **Expired Public QR Menu State**:
   - `/r/[slug]` renders polite `ExpiredNotice` when status is `expired` or `payment_overdue`.
   - Diners do not see dishes.
   - Owner retains full access to dashboard, menu data, branding, and QR code.
5. **Razorpay Yearly Checkout**:
   - Plan price: ₹2,999 (299,900 paise) for 365 days.
   - Zero recurring auto-debit; manual renewal only.
   - Server-side order creation via Razorpay REST API (`createRazorpayOrder`).
   - Client modal checkout using Razorpay Standard Checkout SDK (`Checkout.js`).
6. **Server-Side Razorpay Webhook Verification**:
   - Endpoint: `POST /api/webhooks/razorpay`.
   - HMAC SHA-256 signature verification using `RAZORPAY_WEBHOOK_SECRET`.
7. **Idempotent Subscription Activation**:
   - Idempotency key derived from Razorpay payment ID (`pay_...`).
   - Prevents duplicate activation or credit on duplicate webhook deliveries.
   - Records payment in `payments` table.
   - Activates subscription in `subscriptions` table.
   - Updates `restaurants` table with `subscription_end_date = now + 365 days` and `site_status = 'active'`.
8. **Manual Renewal Flow**:
   - Owner can renew anytime from dashboard.
   - Early renewal extends existing end date by +365 days.
9. **Reactivation of Same QR Menu**:
   - Same slug and printed QR code immediately become live again without reprinting.

### Explicitly Excluded (Do NOT Implement):
- QR scan tracking
- Menu view tracking
- Item view tracking
- WhatsApp / phone call / direction / review click tracking
- Analytics dashboard or analytics charts
- Analytics API route connectivity (public QR menu must send zero analytics events)
- Agent dashboard, payouts, ordering, or super-admin dashboard

---

## 2. Exact Pages, Components, Server Actions & API Routes

### Pages & Routes
1. `src/app/(owner)/owner/billing/page.tsx`:
   - Subscription management page showing current plan, status, remaining trial time or subscription end date, and "Renew / Upgrade Now" CTA.
2. `src/app/api/webhooks/razorpay/route.ts`:
   - Server-side Razorpay webhook handler with cryptographic signature verification and idempotent activation.

### Components
1. `src/components/owner/TrialCountdownBanner.tsx` (Enhanced):
   - Shows live trial countdown, grace period warning, expired alert, or active subscription badge with renewal button.
2. `src/components/owner/billing/RazorpayCheckoutButton.tsx`:
   - Client-side Razorpay Checkout modal trigger.
   - Loads Razorpay `checkout.js` dynamically.
   - Handles payment success, dismissal, and error states.
3. `src/components/owner/billing/SubscriptionCard.tsx`:
   - Clean summary card showing plan name, status pill, subscription end date, and renewal actions.

### Server Actions & Libs
1. `src/lib/payments/razorpay.ts`:
   - Razorpay API helper for creating orders (`POST https://api.razorpay.com/v1/orders`).
   - HMAC SHA-256 signature verification helper (`verifyRazorpaySignature`).
2. `src/actions/subscription.ts`:
   - `createSubscriptionOrder(restaurantId: string)`: Authenticates owner and generates Razorpay Order.
   - `getRestaurantSubscriptionDetails(restaurantId: string)`: Fetches current subscription and plan info.
   - `handleManualPaymentVerification(restaurantId: string, paymentDetails: ...)`: Client-side completion fallback with service-role verification.

---

## 3. Database Operations & Idempotency

### Idempotency Strategy
```
Razorpay Webhook (payment.captured) 
         │
         ▼
[POST /api/webhooks/razorpay]
         │
         ├─ 1. Verify HMAC SHA-256 signature
         │
         ├─ 2. Extract external_payment_id ("pay_...")
         │
         ├─ 3. Query `payments` table for `external_payment_id`
         │     └─ If already exists with status 'succeeded' -> Return HTTP 200 (Already Processed)
         │
         ├─ 4. Insert payment record into `payments` table with idempotency_key = external_payment_id
         │
         ├─ 5. Insert / update record in `subscriptions` table
         │
         ├─ 6. Update `restaurants`:
         │     - site_status = 'active'
         │     - subscription_end_date = now + 365 days (or existing_end + 365 days)
         │     - status = 'published' (if previously published)
         │
         └─ 7. Record audit log: 'subscription_activated'
```

---

## 4. Test Plan (`tests/phase5-verification.ts`)

1. **Trial Lifecycle & Grace Period Transitions**:
   - Test `calculateSiteStatus` for:
     - Within 24-hour trial ($t < \text{trial\_ends\_at}$) -> `trialing` / `trial_ending`.
     - Within 24-hour grace period ($t < \text{trial\_ends\_at} + 24\text{h}$) -> `grace_period` (Menu remains live).
     - After grace period ($t > \text{trial\_ends\_at} + 24\text{h}$) -> `expired` (Menu offline with ExpiredNotice).
2. **Razorpay Signature Verification**:
   - Valid HMAC SHA-256 signature passes verification.
   - Tampered signature or mismatched secret fails verification.
3. **Idempotent Subscription Activation**:
   - Duplicate payment ID processing is detected and safely deduplicated.
4. **Subscription End Date Calculation**:
   - New subscription sets end date to Payment Date + 365 days.
   - Early renewal extends current end date by +365 days.
5. **Public QR Menu Exclusivity**:
   - Verifies public QR menu serves dishes when `isLive === true` and serves `ExpiredNotice` when `isLive === false`.
   - Verifies zero analytics requests are dispatched.

---

## 5. Files to Create or Modify

- **New Files**:
  - `src/lib/payments/razorpay.ts` (Razorpay order creation & signature verification)
  - `src/actions/subscription.ts` (Server actions for subscription checkout and status)
  - `src/app/api/webhooks/razorpay/route.ts` (Razorpay webhook endpoint)
  - `src/components/owner/billing/RazorpayCheckoutButton.tsx` (Checkout button component)
  - `src/components/owner/billing/SubscriptionCard.tsx` (Subscription details card)
  - `src/app/(owner)/owner/billing/page.tsx` (Billing & renewal dashboard page)
  - `tests/phase5-verification.ts` (Automated Phase 5 test suite)
- **Modified Files**:
  - `src/components/owner/TrialCountdownBanner.tsx` (Add upgrade button and active subscription support)
  - `src/app/(owner)/owner/settings/page.tsx` (Add subscription summary and link to billing)
