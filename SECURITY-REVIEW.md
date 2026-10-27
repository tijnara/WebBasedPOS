# Security Review

**Review date:** 2026-10-27  
**Scope:** Checked-out application source, API routes, Supabase client/auth flows, SQL schema and migrations, and Next.js configuration. No live service was contacted.

## Findings

### HIGH — Plaintext password storage and client-side authentication

**Files and lines:** `supabase_schema.sql:7-16,68-79,85-107`; `src/lib/api.js:12-16,26-28`; `src/pages/index.js:124-134`  
**Confidence:** 8/10

The schema stores passwords in plaintext and does not enable row-level security on `public.users`. The app queries that table directly, and registration writes the password into it. If this schema is deployed with the usual Supabase public-schema API grants, an unauthenticated caller may be able to read user records and recover passwords. Writable access could also permit account or role tampering. The checked-in authentication function compares stored plaintext passwords.

**Recommended remediation:** Use Supabase Auth or a server-side authentication service with strong password hashing. Deny anonymous access to the users table, enable RLS with narrowly scoped policies, and never expose password fields through client queries.

### HIGH — Unconditional access policies on gallery and incentives

**File and lines:** `supabase_schema.sql:72-79`  
**Confidence:** 8/10

The `gallery` and `incentives` tables have `FOR ALL` policies with unconditional `USING (true)` and `WITH CHECK (true)`. These policies are not restricted to an authenticated or authorized role, so any API role granted table access can read, insert, update, or delete these records. This could allow gallery tampering and unauthorized changes to incentive or payout records.

**Recommended remediation:** Remove the unconditional policies and replace them with least-privilege policies that restrict writes to verified, authorized administrators.

## Limitations

The repository alone cannot establish whether the checked-in schema and migrations match the deployed database, the live Supabase grants and RLS configuration, deployment environment variables, or production hosting headers. Exposure depends in part on the deployed Supabase grants. Dependency advisories and runtime behavior were not tested.
