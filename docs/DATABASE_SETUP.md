# Database setup — Supabase

You do **not** need to design the database yourself.

## 1. Create a project

Go to Supabase, create a new project, choose a region near you, and store the database password somewhere safe.

## 2. Create the Studio schema

Open **SQL Editor → New query**.

Paste the entire contents of:

`supabase/schema.sql`

Run it once.

Then open another query and run:

`supabase/lockdown_rls.sql`

This is required before connecting real student/company data. It enables Row-Level Security on every Studio table and removes direct browser-role access for the current server-only V1 security model.

Then open another query, paste:

`supabase/seed.sql`

Run it once.

You should now see tables including `students`, `lessons`, `student_skills`, `content_items`, `company_brain`, `decisions`, and `ai_runs`.

After running the lockdown script, rerun Supabase **Security Advisor**. The Studio tables should no longer be flagged as publicly accessible.

## 3. Create file buckets

Open **Storage** and create three **private** buckets:

- `student-artifacts`
- `lesson-media`
- `content-assets`

Store videos, screenshots, PDFs and student project exports in Storage. Store only metadata/path references in Postgres.

For large class/demo videos, use resumable uploads later rather than forcing binary data into database rows.

## 4. Copy environment values

In Supabase Project Settings / API, copy the project URL and publishable key.

Create a local file named `.env.local` based on `.env.example`.

Never put the Supabase service-role key, OpenAI API key or Anthropic API key into browser JavaScript or GitHub. The service-role key bypasses RLS and must remain server-side only.

## 5. Authentication and browser access come next

The lockdown migration intentionally gives the browser no direct table access yet. This is the safest state while Studio OS is still a personal prototype.

When Supabase Auth is connected, add explicit least-privilege grants and founder-only RLS policies for the browser-facing operations the app actually needs. Do not re-enable broad anonymous access.

## 6. pgvector is optional for V1

V1 can search Company Brain using normal text/metadata filters.

When you are ready for semantic retrieval/RAG, enable the Supabase `vector` extension and add an embedding column. The architecture already separates `Company Brain` from structured business tables so this can be added without redesigning the product.

## 7. What you send me after setup

Do **not** send secret keys in chat.

You only need to tell me:

- “Supabase project is created”
- whether `schema.sql` ran successfully
- whether `lockdown_rls.sql` ran successfully
- whether `seed.sql` ran successfully
- whether Security Advisor is clean

If there is an error, paste the error message (not credentials), and it can be fixed.
