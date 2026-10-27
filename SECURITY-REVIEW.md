# Security Review

**Review date:** 2026-10-27  
**Scope:** Rechecked the current authentication changes and Supabase schema/policies. No live services were contacted.

## Findings

### HIGH — Plaintext password storage and missing user-table RLS

**Files and lines:** `supabase_schema.sql:7-16,86-104`
**Confidence:** 9/10

The schema still stores passwords in `public.users.password` as plaintext, and `authenticate_user` compares them directly. Row-level security is not enabled on `public.users`; if the table has standard Supabase anonymous grants, unauthenticated clients may be able to query user rows and obtain passwords. The landing page now calls an RPC instead of selecting the user row directly, but this does not address the underlying storage or table-access risk.

**Recommended remediation:** Use Supabase Auth or a server-side authentication service with strong password hashing. Deny direct anonymous access to the users table and enable restrictive RLS.

### HIGH — Unconditional access policies on gallery and incentives

**File and lines:** `supabase_schema.sql:75,79`
**Confidence:** 9/10

The `gallery` and `incentives` policies still grant `FOR ALL` access with unconditional `USING (true)` and `WITH CHECK (true)`. These policies are not restricted to authenticated or authorized users, so roles with table grants can read, insert, update, and delete these records, including incentive data.

**Recommended remediation:** Replace the unconditional policies with least-privilege policies tied to authenticated users and server-verified roles.

## Change status and limitations

The landing page no longer directly selects users or compares passwords in the browser; it now calls `authenticate_user` (`src/lib/api.js:27-32`). This improves the client-side access path but does not remediate plaintext password storage or missing RLS.

The registration code calls `create_new_user` (`src/lib/api.js:94-103`), which is not defined in the checked-in repository. Its password hashing and server-side enforcement of admin/approval flags could not be verified. The deployed database's actual schema, grants, policies, and production configuration also could not be confirmed from repository files alone.
