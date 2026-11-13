const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Connecting to Supabase Project: zaaykatech-dev (hjsonewjxjnbgbzuhlll)...');

  const client = new Client({
    host: 'db.hjsonewjxjnbgbzuhlll.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'Zaaykatech@123',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Connected to Postgres database directly.');

  try {
    // 1. Read and apply core migration
    const migrationPath = path.join(__dirname, '../supabase/migrations/20261113000001_core_schema.sql');
    console.log(`\n📄 Reading migration file: ${migrationPath}`);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('⏳ Applying core schema migration (tables, RLS policies, indexes, security definer function)...');
    await client.query(sql);
    console.log('✅ Core schema migration applied successfully!');

    // 2. Seed the ₹2,999 yearly plan
    console.log('\n🌱 Seeding ₹2,999 yearly launch plan...');
    const seedPlanSql = `
      INSERT INTO public.plans (name, slug, price_paise, duration_days, features, is_active)
      VALUES (
        'Yearly Pro Plan',
        'yearly-launch',
        299900,
        365,
        '{"unlimited_items": true, "ai_import": true, "custom_branding": true, "qr_generator": true}'::jsonb,
        true
      )
      ON CONFLICT (slug) DO UPDATE
      SET price_paise = EXCLUDED.price_paise,
          duration_days = EXCLUDED.duration_days,
          features = EXCLUDED.features,
          is_active = true;
    `;
    await client.query(seedPlanSql);
    console.log('✅ Seeded ₹2,999 yearly plan (slug: yearly-launch, price_paise: 299900, duration: 365 days).');

    // 3. Verification: Tables & Row Level Security
    console.log('\n🔍 Verifying all created tables and Row Level Security (RLS)...');
    const tablesQuery = `
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    const tablesRes = await client.query(tablesQuery);
    console.log('Found public tables:');
    for (const row of tablesRes.rows) {
      console.log(`  - ${row.tablename.padEnd(20)} [RLS: ${row.rowsecurity ? 'ENABLED ✅' : 'DISABLED ❌'}]`);
    }

    // 4. Verification: Indexes
    console.log('\n🔍 Verifying indexes...');
    const indexesQuery = `
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `;
    const indexesRes = await client.query(indexesQuery);
    console.log(`Found ${indexesRes.rows.length} custom performance indexes:`);
    for (const row of indexesRes.rows) {
      console.log(`  - ${row.indexname} on ${row.tablename}`);
    }

    // 5. Verification: get_public_restaurant_menu Function
    console.log('\n🔍 Verifying get_public_restaurant_menu security definer function...');
    const funcQuery = `
      SELECT routine_name, routine_type, security_type
      FROM information_schema.routines
      WHERE specific_schema = 'public' AND routine_name = 'get_public_restaurant_menu';
    `;
    const funcRes = await client.query(funcQuery);
    if (funcRes.rows.length > 0) {
      console.log(`  - Function: ${funcRes.rows[0].routine_name} [Security Type: ${funcRes.rows[0].security_type} ✅]`);
    } else {
      throw new Error('Function get_public_restaurant_menu was not found in schema!');
    }

    // 6. Verification: Seeded Plan Details
    console.log('\n🔍 Verifying plans table content...');
    const planRes = await client.query('SELECT * FROM public.plans WHERE slug = $1', ['yearly-launch']);
    if (planRes.rows.length > 0) {
      const p = planRes.rows[0];
      console.log(`  - Plan: ${p.name} | Price: ₹${p.price_paise / 100} (${p.price_paise} paise) | Duration: ${p.duration_days} days | Active: ${p.is_active} ✅`);
    } else {
      throw new Error('Yearly launch plan verification failed!');
    }

    console.log('\n🎉 ALL MIGRATIONS AND VERIFICATIONS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
