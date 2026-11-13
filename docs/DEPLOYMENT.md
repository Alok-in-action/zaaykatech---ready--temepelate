# ZaaykaTech Deployment & Zero-Downtime Runbook

## 1. Environments Overview

| Environment | Purpose | Database | Public Domain |
|---|---|---|---|
| **Local** | Feature development | Local Supabase Docker or Dev project | `localhost:3000` |
| **Staging** | QA, smoke testing, webhooks verification | Supabase Staging Project | `staging.zaaykatech.com` |
| **Production** | Live restaurant customer menus & subscriptions | Supabase Production Project | `zaaykatech.com` & `*.zaaykatech.com` |

---

## 2. Database Migration Rules (Zero Downtime)

1. **Additive Migrations Only**:
   - Never drop or rename columns in the same release that consumes them.
   - All migrations live in `supabase/migrations/` in numerical timestamp order (`20261113000001_core_schema.sql`).
2. **Applying Migrations**:
   ```bash
   # Link project
   supabase link --project-ref <production-or-staging-project-ref>

   # Apply pending migrations
   supabase db push
   ```
3. **Seeding Core Plans**:
   ```bash
   # Executes default ₹2999 yearly plan
   supabase db execute --file supabase/seed.sql
   ```

---

## 3. Deployment Workflow (GitHub Actions & Hosting)

1. **Branching Model**:
   - Open feature branch `feat/<feature-name>`.
   - Submit Pull Request to `main`.
2. **Automated CI Validation**:
   - `.github/workflows/ci.yml` automatically executes:
     - Dependency install
     - TypeScript typechecking (`npm run typecheck`)
     - Optimized Next.js production build (`npm run build`)
3. **Staging Smoke Test**:
   - Verify `/api/health` returns `HTTP 200` and `status: "healthy"`.
   - Verify demo public QR menu loads at `/r/demo`.
   - Test Google sign-in flow at `/login`.
4. **Production Release**:
   - Trigger production deployment.
   - Run health check:
     ```bash
     curl -s https://zaaykatech.com/api/health | jq .
     ```

---

## 4. Instant Rollback Procedure

If production health checks or Sentry alerts indicate an issue:
1. **Immediate Rollback**:
   - Navigate to Vercel / Cloudflare dashboard -> Deployments.
   - Select the previous stable deployment and click **Instant Rollback**.
2. **Database Schema State**:
   - Because all database migrations are strictly additive, old application versions can safely run alongside the latest database schema without errors.
3. **Incident Log**:
   - Record incident details, error logs, and remediation timeline in `docs/INCIDENT_LOGS.md`.

