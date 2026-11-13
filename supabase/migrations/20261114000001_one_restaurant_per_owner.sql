-- ==============================================================================
-- ZaaykaTech Migration: 20261114000001_one_restaurant_per_owner.sql
-- Description:
-- 1. Adds onboarding tracking columns and soft archive column (archived_at)
-- 2. Makes trial_ends_at nullable so 24h trial timer only begins on publish
-- 3. Safely archives duplicate restaurants for owners with multiple active records
-- 4. Backfills onboarding status for existing published restaurants
-- 5. Creates partial unique index enforcing one active restaurant per owner
-- 6. Updates get_public_restaurant_menu function to exclude archived restaurants
-- ==============================================================================

-- 1. Add onboarding and soft-archive columns
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL DEFAULT NULL,
ADD COLUMN IF NOT EXISTS onboarding_current_step INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ NULL DEFAULT NULL,
ADD COLUMN IF NOT EXISTS onboarding_status TEXT NOT NULL DEFAULT 'in_progress' CHECK (onboarding_status IN ('in_progress', 'completed')),
ADD COLUMN IF NOT EXISTS food_type TEXT NULL DEFAULT NULL;

-- 2. Allow trial_ends_at to be NULL while restaurant is in draft / onboarding
ALTER TABLE public.restaurants ALTER COLUMN trial_ends_at DROP NOT NULL;
ALTER TABLE public.restaurants ALTER COLUMN trial_ends_at SET DEFAULT NULL;

-- 3. Safely archive older duplicate restaurants for owners with > 1 active records (never hard-delete)
WITH ranked_restaurants AS (
  SELECT id,
         owner_profile_id,
         ROW_NUMBER() OVER (
           PARTITION BY owner_profile_id 
           ORDER BY 
             CASE WHEN status = 'published' THEN 1 ELSE 2 END,
             published_at DESC NULLS LAST,
             updated_at DESC
         ) as rank_num
  FROM public.restaurants
  WHERE archived_at IS NULL
)
UPDATE public.restaurants
SET archived_at = timezone('utc'::text, now())
WHERE id IN (
  SELECT id FROM ranked_restaurants WHERE rank_num > 1
);

-- 4. Backfill onboarding completion for already published restaurants
UPDATE public.restaurants
SET onboarding_status = 'completed',
    onboarding_completed_at = COALESCE(published_at, updated_at, timezone('utc'::text, now())),
    onboarding_current_step = 5
WHERE (status = 'published' OR published_at IS NOT NULL)
  AND onboarding_status != 'completed';

-- 5. Enforce strict single active restaurant per owner at database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_single_active_owner 
ON public.restaurants (owner_profile_id) 
WHERE archived_at IS NULL;

-- 6. Update get_public_restaurant_menu security definer function to exclude archived restaurants
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
    -- Fetch active (non-archived) restaurant matching slug
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
    WHERE slug = p_slug AND archived_at IS NULL;

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

    -- Evaluate active vs expired based on subscription or trial (including 24h grace period matching calculateSiteStatus)
    IF v_restaurant.subscription_end_date IS NOT NULL THEN
        -- Allow 24 hours grace period after subscription date (converted to timestamp)
        IF (v_restaurant.subscription_end_date::timestamp + interval '24 hours') < timezone('utc'::text, now()) THEN
            RETURN jsonb_build_object(
                'status', 'expired',
                'site_status', 'expired',
                'restaurant_name', v_restaurant.name
            );
        END IF;
    ELSIF v_restaurant.trial_ends_at IS NOT NULL THEN
        -- Allow 24 hours grace period after trial ends
        IF (v_restaurant.trial_ends_at + interval '24 hours') < timezone('utc'::text, now()) THEN
            RETURN jsonb_build_object(
                'status', 'expired',
                'site_status', 'expired',
                'restaurant_name', v_restaurant.name
            );
        END IF;
    ELSE
        -- No subscription and no trial: return expired
        RETURN jsonb_build_object(
            'status', 'expired',
            'site_status', 'expired',
            'restaurant_name', v_restaurant.name
        );
    END IF;

    -- Fetch active menu categories
    SELECT COALESCE(jsonb_agg(to_jsonb(c) ORDER BY c.position ASC), '[]'::jsonb)
    INTO v_categories
    FROM menu_categories c
    WHERE c.restaurant_id = v_restaurant.id AND c.is_active = true;

    -- Fetch available menu items
    SELECT COALESCE(jsonb_agg(to_jsonb(i) ORDER BY i.position ASC), '[]'::jsonb)
    INTO v_items
    FROM menu_items i
    WHERE i.restaurant_id = v_restaurant.id AND i.is_available = true;

    RETURN jsonb_build_object(
        'status', 'live',
        'site_status', v_restaurant.site_status,
        'restaurant', to_jsonb(v_restaurant),
        'categories', v_categories,
        'items', v_items
    );
END;
$$;
