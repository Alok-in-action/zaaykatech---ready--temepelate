-- ZaaykaTech Migration: 20261113000001_core_schema.sql
-- Production Multi-Tenant Schema with RLS, Constraints, and Indexes

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
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    agent_id UUID NULL,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'preview', 'published', 'expired', 'suspended')),
    onboarding_source TEXT NOT NULL DEFAULT 'self_serve',
    trial_ends_at TIMESTAMPTZ NOT NULL,
    published_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    site_status TEXT NOT NULL DEFAULT 'trialing' CHECK (site_status IN ('trialing', 'trial_ending', 'grace_period', 'expired', 'active', 'payment_overdue')),
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
    price_paise INTEGER NULL,
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
    price_paise INTEGER NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 365,
    features JSONB NOT NULL DEFAULT '{"unlimited_items": true, "ai_import": true, "analytics": true, "custom_branding": true}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('trial', 'active', 'expired', 'cancelled')),
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

-- 9. SITE ANALYTICS
CREATE TABLE IF NOT EXISTS site_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('qr_scan', 'menu_view', 'item_view', 'whatsapp_click', 'call_click', 'direction_click', 'review_click')),
    menu_item_id UUID NULL REFERENCES menu_items(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
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

-- 11. AGENTS
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

-- ROW LEVEL SECURITY (RLS) POLICIES
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

-- 2. Restaurants Policies
CREATE POLICY "Public can view published active restaurants" ON restaurants
    FOR SELECT USING (
        status = 'published' AND site_status IN ('trialing', 'trial_ending', 'grace_period', 'active')
    );

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

-- 3. Menu Categories Policies
CREATE POLICY "Public can view categories of active restaurants" ON menu_categories
    FOR SELECT USING (
        is_active = true AND restaurant_id IN (
            SELECT id FROM restaurants WHERE status = 'published' AND site_status IN ('trialing', 'trial_ending', 'grace_period', 'active')
        )
    );

CREATE POLICY "Owners can view all categories of their restaurant" ON menu_categories
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

-- 4. Menu Items Policies
CREATE POLICY "Public can view items of active restaurants" ON menu_items
    FOR SELECT USING (
        is_available = true AND restaurant_id IN (
            SELECT id FROM restaurants WHERE status = 'published' AND site_status IN ('trialing', 'trial_ending', 'grace_period', 'active')
        )
    );

CREATE POLICY "Owners can view all items of their restaurant" ON menu_items
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

-- 5. QR Codes Policies
CREATE POLICY "Public can lookup QR code" ON qr_codes
    FOR SELECT USING (true);

CREATE POLICY "Owners can manage QR codes of their restaurant" ON qr_codes
    FOR ALL USING (
        restaurant_id IN (
            SELECT r.id FROM restaurants r
            JOIN profiles p ON r.owner_profile_id = p.id
            WHERE p.auth_user_id = auth.uid()
        )
    );

-- 6. Plans Policies
CREATE POLICY "Public can read active plans" ON plans
    FOR SELECT USING (is_active = true);

-- 7. Subscriptions Policies
CREATE POLICY "Owners can view their subscriptions" ON subscriptions
    FOR SELECT USING (
        restaurant_id IN (
            SELECT r.id FROM restaurants r
            JOIN profiles p ON r.owner_profile_id = p.id
            WHERE p.auth_user_id = auth.uid()
        )
    );

-- 8. Payments Policies
CREATE POLICY "Owners can view their payments" ON payments
    FOR SELECT USING (
        restaurant_id IN (
            SELECT r.id FROM restaurants r
            JOIN profiles p ON r.owner_profile_id = p.id
            WHERE p.auth_user_id = auth.uid()
        )
    );

-- 9. Site Analytics Policies
CREATE POLICY "Public can insert analytics events" ON site_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners can view their restaurant analytics" ON site_analytics
    FOR SELECT USING (
        restaurant_id IN (
            SELECT r.id FROM restaurants r
            JOIN profiles p ON r.owner_profile_id = p.id
            WHERE p.auth_user_id = auth.uid()
        )
    );

-- 10. Audit Logs Policies
CREATE POLICY "Owners can view their audit logs" ON audit_logs
    FOR SELECT USING (
        restaurant_id IN (
            SELECT r.id FROM restaurants r
            JOIN profiles p ON r.owner_profile_id = p.id
            WHERE p.auth_user_id = auth.uid()
        )
    );

