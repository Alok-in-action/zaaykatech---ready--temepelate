-- Migration: 20261113000002_supabase_storage.sql
-- Create zaaykatech-media storage bucket with tenant isolation RLS policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'zaaykatech-media',
  'zaaykatech-media',
  true,
  52428800, -- 50 MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'application/pdf',
    'text/csv',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Helper function to check restaurant ownership from object path: restaurants/{restaurantId}/...
CREATE OR REPLACE FUNCTION public.can_manage_restaurant_media(object_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.restaurants r
    JOIN public.profiles p ON p.id = r.owner_profile_id
    WHERE p.auth_user_id = auth.uid()
      AND split_part(object_name, '/', 1) = 'restaurants'
      AND r.id::text = split_part(object_name, '/', 2)
  );
$$;

-- Drop previous policies to ensure clean idempotent migration
DROP POLICY IF EXISTS "Public Read zaaykatech-media" ON storage.objects;
DROP POLICY IF EXISTS "Owners can insert media for own restaurant" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update media for own restaurant" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete media for own restaurant" ON storage.objects;

-- 1. Public Read Access for active diners
CREATE POLICY "Public Read zaaykatech-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'zaaykatech-media');

-- 2. Owner Insert (Upload to own restaurant path)
CREATE POLICY "Owners can insert media for own restaurant"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'zaaykatech-media'
  AND public.can_manage_restaurant_media(name)
);

-- 3. Owner Update (Update in own restaurant path)
CREATE POLICY "Owners can update media for own restaurant"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'zaaykatech-media'
  AND public.can_manage_restaurant_media(name)
);

-- 4. Owner Delete (Delete from own restaurant path)
CREATE POLICY "Owners can delete media for own restaurant"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'zaaykatech-media'
  AND public.can_manage_restaurant_media(name)
);
