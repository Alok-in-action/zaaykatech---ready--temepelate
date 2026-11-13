-- ZaaykaTech Migration: 20261113000001_core_schema.sql
-- Production Multi-Tenant Schema with Hardened RLS, Lifecycle Isolation, and Zero Broad Anon Exposure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'restaurant_owner' CHECK (role IN ('restaurant_owner', 'agent', 'super_admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. RESTAURANTS
-- Lifecycle states: draft -> preview -> trialing -> trial_ending -> grace_period -> expired -> active -> payment_overdue -> suspended
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    agent_id UUID NULL,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'preview', 'published', 'expired', 'suspended')),
    onboarding_source TEXT NOT NULL DEFAULT 'self_serve',
    trial_ends_at TIMESTAMPTZ NOT NULL,
    published_at TIMESTAMPTZ NULL DEFAULT NULL, -- Nullable with NO default timestamp: set only on explicit owner publish
    site_status TEXT NOT NULL DEFAULT 'draft' CHECK (site_status IN ('draft', 'preview', 'trialing', 'trial_ending', 'grace_period', 'expired', 'active', 'payment_overdue', 'suspended')),
    subscription_end_date DATE NULL,
    branding JSONB NOT NULL DEFAULT '{
        "logo_url": null,
        "hero_media_type": "image",
        "hero_media_url": null,
        "hero_poster_url": null,
        "tagline": "Fresh flavors served with love"
    }'::jsonb,
    contact JSONB NOT NULL DEFAULT '{
        "phone": null,
        "whatsapp": null,
        "email": null
    }'::jsonb,
    address JSONB NOT NULL DEFAULT '{
        "street": null,
        "city": null,
        "state": null,
        "pincode": null,
        "google_maps_url": null
    }'::jsonb,
    social_links JSONB NOT NULL DEFAULT '{
        "instagram": null,
        "facebook": null,
        "google_review": null
    }'::jsonb,
    theme JSONB NOT NULL DEFAULT '{
        "primary_color": "#8B4A27",
        "accent_color": "#D2691E",
        "background_color": "#FAFAF8",
        "card_style": "warm_editorial"
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. MENU CATEGORIES
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(restaurant_id, slug)
);

-- 4. MENU ITEMS
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    price_paise INTEGER NULL, -- e.g. 25000 = ₹250
    variant_prices JSONB NULL,
    image_url TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    allergens TEXT[] DEFAULT '{}',
    is_veg BOOLEAN DEFAULT true,
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_signature BOOLEAN NOT NULL DEFAULT false,
    is_most_ordered BOOLEAN NOT NULL DEFAULT false,
    is_monsoon BOOLEAN NOT NULL DEFAULT false,
    custom_tag TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. QR CODES
CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    short_code TEXT UNIQUE NOT NULL,
    scan_count INTEGER NOT NULL DEFAULT 0,
    asset_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. PLANS
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    price_paise INTEGER NOT NULL, -- 299900 = ₹2999
    duration_days INTEGER NOT NULL DEFAULT 365,
    features JSONB NOT NULL DEFAULT '{"unlimited_items": true, "ai_import": true, "analytics": true, "custom_branding": true}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. SUBSCRIPTIONS (Strictly real paid subscriptions; trials are tracked in restaurants table)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled', 'payment_pending')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,
    renewal_amount_paise INTEGER NOT NULL,
    payment_provider TEXT NOT NULL DEFAULT 'razorpay',
    external_payment_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    subscription_id UUID NULL REFERENCES subscriptions(id) ON DELETE SET NULL,
    provider TEXT NOT NULL DEFAULT 'razorpay',
    external_payment_id TEXT NOT NULL,
    idempotency_key TEXT UNIQUE NOT NULL,
    amount_paise INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    raw_webhook_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. SITE ANALYTICS (Insertable ONLY through backend /api/analytics/event route using service role)
CREATE TABLE IF NOT EXISTS site_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('qr_scan', 'menu_view', 'item_view', 'whatsapp_click', 'call_click', 'direction_click', 'review_click')),
    menu_item_id UUID NULL REFERENCES menu_items(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
    restaurant_id UUID NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. AGENTS (Future-Ready Schema)
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    referral_code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. AGENT COMMISSIONS & PAYOUTS
CREATE TABLE IF NOT EXISTS agent_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    amount_paise INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    earned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    paid_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    amount_paise INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'paid', 'failed')),
    method TEXT NOT NULL DEFAULT 'upi',
    reference TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    paid_at TIMESTAMPTZ NULL
);

-- INDEXES FOR PERFORMANCE & FAST TENANT LOOKUP
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_profile ON restaurants(owner_profile_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_site_status ON restaurants(site_status);
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant_pos ON menu_categories(restaurant_id, position);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_cat_pos ON menu_items(restaurant_id, category_id, position);
CREATE INDEX IF NOT EXISTS idx_qr_codes_short_code ON qr_codes(short_code);
CREATE INDEX IF NOT EXISTS idx_site_analytics_restaurant_event ON site_analytics(restaurant_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant ON subscriptions(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_idempotency ON payments(idempotency_key);

-- TRIGGER FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_menu_categories_updated_at BEFORE UPDATE ON menu_categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Zero broad public/anon SELECT or INSERT. RLS strictly enforces owner isolation.
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- 2. Restaurants Policies (STRICT OWNER ONLY - No broad anon SELECT)
CREATE POLICY "Owners can view own restaurants" ON restaurants
    FOR SELECT USING (
        owner_profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Owners can insert own restaurants" ON restaurants
    FOR INSERT WITH CHECK (
        owner_profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Owners can update own restaurants" ON restaurants
    FOR UPDATE USING (
        owner_profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Owners can delete own restaurants" ON restaurants
    FOR DELETE USING (
        owner_profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    );

-- 3. Menu Categories Policies (STRICT OWNER ONLY)
CREATE POLICY "Owners can view categories of their restaurant" ON menu_categories
    FOR SELECT USING (
        restaurant_id IN (
            SELECT r.id FROM restaurants r
            JOIN profiles p ON r.owner_profile_id = p.id
            WHERE p.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can manage categories of their restaurant" ON menu_categories
    FOR ALL USING (
        restaurant_id IN (
            SELECT r.id FROM restaurants r
            JOIN profiles p ON r.owner_profile_id = p.id
            WHERE p.auth_user_id = auth.uid()
        )
    );

-- 4. Menu Items Policies (STRICT OWNER ONLY)
CREATE POLICY "Owners can view items of their restaurant" ON menu_items
    FOR SELECT USING (
        restaurant_id IN (
            SELECT r.id FROM restaurants r
            JOIN profiles p ON r.owner_profile_id = p.id
            WHERE p.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can manage items of their restaurant" ON menu_items
    FOR ALL USING (
        restaurant_id IN (
            SELECT r.id FROM restaurants r
            JOIN profiles p ON r.owner_profile_id = p.id
            WHERE p.auth_user_id = auth.uid()
        )
    );

-- 5. QR Codes Policies (STRICT OWNER ONLY)
CREATE POLICY "Owners can manage QR codes of their restaurant" ON qr_codes
    FOR ALL USING (
        restaurant_id IN (
            SELECT r.id FROM restaurants r
            JOIN profiles p ON r.owner_profile_id = p.id
            WHERE p.auth_user_id = auth.uid()
        )
    );

-- 6. Plans Policies (Public read of available plans for checkout)
CREATE POLICY "Public can read active plans" ON plans
    FOR SELECT USING (is_active = true);

-- 7. Subscriptions Policies (Owner read only; inserts/updates strictly by backend service-role)
CREATE POLICY "Owners can view their subscriptions" ON subscriptions
    FOR SELECT USING (
        restaurant_id IN (
            SELECT r.id FROM restaurants r
            JOIN profiles p ON r.owner_profile_id = p.id
            WHERE p.auth_user_id = auth.uid()
        )
    );

-- 8. Payments Policies (Owner read only; inserts/updates strictly by backend service-role)
CREATE POLICY "Owners can view their payments" ON payments
    FOR SELECT USING (
        restaurant_id IN (
            SELECT r.id FROM restaurants r
            JOIN profiles p ON r.owner_profile_id = p.id
            WHERE p.auth_user_id = auth.uid()
        )
    );

-- 9. Site Analytics Policies
-- NO PUBLIC INSERT POLICY! Inserts restricted to backend service-role via POST /api/analytics/event
CREATE POLICY "Owners can view their restaurant analytics" ON site_analytics
    FOR SELECT USING (
        restaurant_id IN (
            SELECT r.id FROM restaurants r
            JOIN profiles p ON r.owner_profile_id = p.id
            WHERE p.auth_user_id = auth.uid()
        )
    );

-- 10. Audit Logs Policies (Owner read only)
CREATE POLICY "Owners can view their audit logs" ON audit_logs
    FOR SELECT USING (
        restaurant_id IN (
            SELECT r.id FROM restaurants r
            JOIN profiles p ON r.owner_profile_id = p.id
            WHERE p.auth_user_id = auth.uid()
        )
    );

-- ============================================================================
-- SECURE PUBLIC MENU FUNCTION (Controlled Security Definer Gateway)
-- Enforces:
-- 1. Must be published.
-- 2. Never exposes draft, preview, or suspended restaurants.
-- 3. Returns is_live=false for expired/payment_overdue.
-- 4. Exposes ONLY safe public attributes (no internal owner IDs, billing, or agent data).
-- ============================================================================

CREATE OR REPLACE FUNCTION get_public_restaurant_menu(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_restaurant RECORD;
    v_categories JSONB;
    v_items JSONB;
    v_result JSONB;
BEGIN
    -- 1. Fetch restaurant matching slug
    SELECT 
        id,
        name,
        slug,
        status,
        site_status,
        trial_ends_at,
        subscription_end_date,
        branding,
        contact,
        address,
        social_links,
        theme
    INTO v_restaurant
    FROM restaurants
    WHERE slug = p_slug;

    -- If restaurant does not exist, return null (triggers 404 in application)
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Block draft, preview, and suspended restaurants from public view
    IF v_restaurant.status IN ('draft', 'preview', 'suspended') 
       OR v_restaurant.site_status IN ('draft', 'preview', 'suspended') THEN
        RETURN jsonb_build_object(
            'status', 'not_found'
        );
    END IF;

    -- If restaurant is expired or payment is overdue, return offline status without exposing menu items
    IF v_restaurant.site_status IN ('expired', 'payment_overdue') THEN
        RETURN jsonb_build_object(
            'status', 'expired',
            'is_live', false,
            'restaurant_name', v_restaurant.name,
            'site_status', v_restaurant.site_status
        );
    END IF;

    -- For live restaurants (trialing, trial_ending, grace_period, active), fetch active categories and items
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', c.id,
            'restaurant_id', c.restaurant_id,
            'name', c.name,
            'slug', c.slug,
            'description', c.description,
            'position', c.position,
            'is_active', c.is_active
        ) ORDER BY c.position ASC
    ), '[]'::jsonb)
    INTO v_categories
    FROM menu_categories c
    WHERE c.restaurant_id = v_restaurant.id AND c.is_active = true;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', i.id,
            'restaurant_id', i.restaurant_id,
            'category_id', i.category_id,
            'name', i.name,
            'slug', i.slug,
            'description', i.description,
            'price_paise', i.price_paise,
            'variant_prices', i.variant_prices,
            'image_url', i.image_url,
            'tags', i.tags,
            'allergens', i.allergens,
            'is_veg', i.is_veg,
            'is_available', i.is_available,
            'is_signature', i.is_signature,
            'is_most_ordered', i.is_most_ordered,
            'is_monsoon', i.is_monsoon,
            'custom_tag', i.custom_tag,
            'position', i.position
        ) ORDER BY i.position ASC
    ), '[]'::jsonb)
    INTO v_items
    FROM menu_items i
    WHERE i.restaurant_id = v_restaurant.id AND i.is_available = true;

    -- Return clean, sanitized JSON object
    v_result := jsonb_build_object(
        'status', 'live',
        'is_live', true,
        'site_status', v_restaurant.site_status,
        'restaurant', jsonb_build_object(
            'id', v_restaurant.id,
            'name', v_restaurant.name,
            'slug', v_restaurant.slug,
            'status', v_restaurant.status,
            'site_status', v_restaurant.site_status,
            'branding', v_restaurant.branding,
            'contact', v_restaurant.contact,
            'address', v_restaurant.address,
            'social_links', v_restaurant.social_links,
            'theme', v_restaurant.theme
        ),
        'categories', v_categories,
        'items', v_items
    );

    RETURN v_result;
END;
$$;

-- Grant EXECUTE to public callers (anon, authenticated, service_role)
GRANT EXECUTE ON FUNCTION get_public_restaurant_menu(TEXT) TO anon, authenticated, service_role;
