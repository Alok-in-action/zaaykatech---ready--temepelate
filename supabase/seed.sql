-- ZaaykaTech Seed Data
-- 1. Default Yearly Subscription Plan (₹2999 = 299900 paise)
INSERT INTO plans (id, name, slug, price_paise, duration_days, features, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'ZaaykaTech Yearly',
    'yearly_2999',
    299900,
    365,
    '{
        "unlimited_categories": true,
        "unlimited_items": true,
        "ai_menu_import": true,
        "custom_branding": true,
        "qr_generator": true,
        "analytics": true,
        "support": "standard"
    }'::jsonb,
    true
)
ON CONFLICT (id) DO NOTHING;

