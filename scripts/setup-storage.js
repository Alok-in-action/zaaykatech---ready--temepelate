const { Client } = require('pg');

async function setupStorage() {
  console.log('🚀 Connecting to Supabase to configure Storage bucket and policies...');

  const client = new Client({
    host: 'db.hjsonewjxjnbgbzuhlll.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'Zaaykatech@123',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    // 1. Create zaaykatech-media bucket
    console.log('📦 Creating zaaykatech-media bucket in storage.buckets...');
    const bucketSql = `
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
    `;
    await client.query(bucketSql);
    console.log('✅ Bucket zaaykatech-media created and set to public.');

    // 2. Helper function to check restaurant ownership from object path
    console.log('🔒 Creating helper function public.can_manage_restaurant_media...');
    const helperSql = `
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
    `;
    await client.query(helperSql);
    console.log('✅ Helper function created.');

    // 3. Drop existing policies on storage.objects for this bucket to ensure idempotency
    const dropPoliciesSql = `
      DROP POLICY IF EXISTS "Public Read zaaykatech-media" ON storage.objects;
      DROP POLICY IF EXISTS "Owners can insert media for own restaurant" ON storage.objects;
      DROP POLICY IF EXISTS "Owners can update media for own restaurant" ON storage.objects;
      DROP POLICY IF EXISTS "Owners can delete media for own restaurant" ON storage.objects;
    `;
    await client.query(dropPoliciesSql);

    // 4. Apply RLS policies
    console.log('🛡️ Creating RLS policies on storage.objects...');
    const rlsSql = `
      -- 1. Public Read Access
      CREATE POLICY "Public Read zaaykatech-media"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'zaaykatech-media');

      -- 2. Owner Insert (Upload)
      CREATE POLICY "Owners can insert media for own restaurant"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'zaaykatech-media'
        AND public.can_manage_restaurant_media(name)
      );

      -- 3. Owner Update
      CREATE POLICY "Owners can update media for own restaurant"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'zaaykatech-media'
        AND public.can_manage_restaurant_media(name)
      );

      -- 4. Owner Delete
      CREATE POLICY "Owners can delete media for own restaurant"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'zaaykatech-media'
        AND public.can_manage_restaurant_media(name)
      );
    `;
    await client.query(rlsSql);
    console.log('✅ Storage RLS policies created successfully.');

    // 5. Verification
    const bucketCheck = await client.query("SELECT * FROM storage.buckets WHERE id = 'zaaykatech-media';");
    console.log('Verified bucket:', bucketCheck.rows[0]);

    const policiesCheck = await client.query("SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';");
    console.log('Verified policies on storage.objects:');
    for (const p of policiesCheck.rows) {
      console.log(`  - ${p.policyname}`);
    }

    console.log('\n🎉 Supabase Storage bucket and tenant RLS setup complete!');
  } catch (err) {
    console.error('Storage setup failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupStorage();
