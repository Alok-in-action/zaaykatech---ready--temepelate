# ZaaykaTech SaaS — Apple-Inspired UI/UX Redesign System

> **Design Ethos**: Direct manipulation, instantaneous tactile response, physical spring momentum, translucent material depth, and zero decorative noise. Inspired by Apple's WWDC *Designing Fluid Interfaces* guidelines combined with Indian culinary warmth.

---

## 1. Executive Summary

The entire ZaaykaTech SaaS platform has been redesigned from the ground up to embody Apple's web design principles. Every interaction has been audited and refined to kill perceived latency, project physical momentum, and replace legacy web cliches (harsh shadows, high-contrast borders, native emojis) with an understated, tactile, and responsive interface.

### Strict Non-Negotiable Constraints Maintained
- **Zero Database Changes**: PostgreSQL schema, tables, foreign keys, and RLS policies remain untouched.
- **Zero Backend Disruption**: Supabase Storage, Cloudflare CDN paths, Razorpay test payment signatures, Google OAuth, and server actions remain 100% intact.
- **Zero Scope Creep**: No agents, online ordering, customer cart, payouts, or admin panels were introduced.

---

## 2. Design Foundation & Tokens

### 2.1 Color Palette
A warm editorial neutral foundation rooted in natural paper and Indian culinary warmth:

| Token | Hex | Role | Usage |
|---|---|---|---|
| `--apple-bg` | `#FAF8F5` | Background canvas | Warm off-white paper canvas |
| `--apple-surface` | `#FFFFFF` | Surface / Cards | High-contrast card face |
| `--apple-surface-muted` | `#F4F0EA` | Muted surfaces | Input backgrounds, subtle chips |
| `--apple-text` | `#1C1917` | Primary typography | Near-black text (high contrast) |
| `--apple-text-muted` | `#78716C` | Secondary typography | Captions, timestamps, descriptions |
| `--apple-accent` | `#8B4A27` | Primary Accent | Warm saffron / deep terracotta |
| `--apple-accent-hover` | `#723B1F` | Accent Hover | Pressed button state |
| `--apple-highlight` | `#D95B16` | Warm Highlight | Badges, signature ribbons |
| `--apple-success` | `#15803D` | Positive / Active | Veg indicator, active subscription |
| `--apple-warning` | `#B45309` | Attention | Trial countdown, grace period |
| `--apple-error` | `#B91C1C` | Danger / Offline | Non-veg, offline expired notice |

### 2.2 Translucent Material Chrome (`.apple-glass`)
Inspired by macOS Sonoma and iOS 18 translucent navigation headers:
```css
.apple-glass {
  background: rgba(250, 248, 245, 0.85);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
```

### 2.3 Instant Tactile Pointer Feedback (`.apple-press`)
As emphasized in WWDC *Designing Fluid Interfaces*, latency breaks the illusion of direct physical manipulation. All buttons and interactive surfaces now respond on pointer-down:
```css
:active:not(:disabled) {
  transform: scale(0.975);
}
```

### 2.4 Optical Typography
- **Heading Display**: Georgia / Serif for warmth, restaurant identity, and menu headers.
- **Body & UI**: Montserrat / Inter geometric sans with tracking `-0.025em` for titles and `0.01em` for small labels.
- **Font Smoothing**: `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`.

---

## 3. Component Architecture & Patterns

### 3.1 Translucent Owner Header (`OwnerHeader.tsx`)
- Sticky frosted header with blur and saturation boost.
- Interactive multi-restaurant selector with "+ New Restaurant" action.
- Segmented subnavigation with sliding pill indicators.
- Instant sign-out button with subtle hover elevation.

### 3.2 Trial Countdown & Lifecycle Banner (`TrialCountdownBanner.tsx`)
Intelligently displays one of four Apple-grade notification states:
1. **Active Trial**: Soft ambient saffron banner with real-time countdown hours/minutes and upgrade CTA.
2. **Grace Period**: Amber alert with urgent 24-hr reminder before public menu goes offline.
3. **Expired (Offline)**: Rose banner notifying owner that the menu is hidden, with instant reactivate trigger.
4. **Active Pro**: Discreet emerald badge showing annual subscription validity date with extend option.

### 3.3 Restaurant Onboarding Wizard (`OnboardingWizard.tsx`)
- 5-step stepper with Lucide icons (`Store`, `Phone`, `Sparkles`, `Palette`, `Eye`).
- Connected progress track line with smooth active indicators.
- Step 1: Restaurant name, cuisine, and instant slug validation.
- Step 2: Contact number and Google Maps link.
- Step 3: Logo and hero media uploader with direct Cloudflare storage streaming.
- Step 4: Palette presets and card layout style customizer.
- Step 5: Live embedded mobile iframe preview before publishing.

### 3.4 Menu Catalog Manager (`CategoryManager.tsx` & `ItemManager.tsx`)
- Clean category pills with 0-indexed position reordering (`ChevronUp`, `ChevronDown`).
- Delete safeguards with custom modal sheets (no native `window.confirm`).
- Physical iOS-style spring toggle switches for instant item availability (In-stock / Sold-out).
- Segmented single vs variant pricing selector with dynamic variant table rows.
- Veg / Non-Veg square badges with standard Indian regulatory green/red dots.

### 3.5 Media Asset Uploader (`MediaUploader.tsx`)
- Tactile drag & drop zone with border spring transitions on dragover.
- Real-time progress bar with smooth transition.
- 5MB limit for photos and 50MB limit for hero MP4/WebM videos.
- Video poster enforcement: video hero items strictly enforce an accompanying poster image.

### 3.6 Brand & Theme Customizer (`ThemeCustomizer.tsx`)
- 4 curated design presets: *Warm Artisanal*, *Royal Heritage*, *Botanical Bistro*, and *Midnight Velvet*.
- Custom primary, accent, and background color inputs with uppercase hex readouts.
- 4 menu card layout styles: *Warm Editorial*, *Clean Minimalist*, *Modern Dark*, and *Heritage Serif*.

### 3.7 Print-Ready QR Studio (`QRCodeGenerator.tsx`)
- Standee card mockup with rounded squircle geometry and drop shadow depth.
- Instant one-click URL copy with animated checkmark confirmation.
- 1024x1280 high-resolution print-ready PNG download for table tent acrylic stands.
- Vector SVG download for professional offset printing and laser engraving.

### 3.8 Customer Public QR Menu (`/r/[slug]`)
- Sticky category navigation bar with horizontal smooth scroll and active category snapping.
- Video hero banner with frosted play/pause control and ambient vignette gradient.
- Search bar with instant clear button and live filtering.
- Pure Veg, Bestseller, and Signature quick-filter badges.
- Floating contact dock (`ActionFloaters.tsx`) with WhatsApp, Call, Maps, and Instagram actions.
- Polite offline notice screen (`ExpiredNotice.tsx`) when trial or subscription lapses.

---

## 4. Accessibility & Polish

- **Reduced Motion**: Full `@media (prefers-reduced-motion: reduce)` support disabling animations, scales, and transforms for users with vestibular sensitivities.
- **Reduced Transparency**: Full `@media (prefers-reduced-transparency: reduce)` fallback disabling blur and applying solid opaque backgrounds.
- **Touch Target Sizes**: All interactive buttons, chips, and icon triggers enforce minimum `44px x 44px` physical tap bounds.
- **Emoji Replacement**: All native OS emojis (`✏️`, `🗑️`, `✨`, `🍽️`, `📱`, `🎬`, `📷`) replaced with crisp Lucide SVG vector iconography.

---

## 5. Verification Results

All automated verification test suites passed with 100% compliance:
- **TypeScript**: `npm run typecheck` $\rightarrow$ 0 errors.
- **Production Build**: `npm run build` $\rightarrow$ 21/21 routes compiled successfully.
- **Phase 2 Tests**: Slug invariant, R2 upload limits, hero poster rule, QR export $\rightarrow$ **Passed**.
- **Phase 3 Tests**: Category validation, single vs variant price exclusivity, sequential reordering $\rightarrow$ **Passed**.
- **Phase 4 Tests**: AI menu extraction schema, rate limits, confidence flags $\rightarrow$ **Passed**.
- **Phase 5 Tests**: 24-hr trial, grace period, Razorpay ₹2,999 annual plan, webhook idempotency $\rightarrow$ **Passed**.
- **Ownership Verification**: Multi-tenant cross-account isolation and RLS boundaries $\rightarrow$ **Passed**.
- **Local Health Endpoint**: `/api/health` $\rightarrow$ `status: "healthy"`.
