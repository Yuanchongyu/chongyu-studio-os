# Chongyu Studio OS

AI-native personal company operating system for education, student progress tracking, lesson planning, parent feedback, content operations, and durable company memory.

## Current operating model

The bilingual V1 is deployed on Vercel and this repository is the canonical source of truth — no ZIP-based handoff.

For the current phase, **ChatGPT is the primary AI operator** and **Supabase is the canonical company memory**. Claude Code is intentionally deferred until a concrete engineering task benefits from adding a second model/tooling surface.

The website is a visual workspace for the same data; it is not intended to become a separate memory silo.

```text
Founder
  |
ChatGPT (primary AI operator)
  |
Studio context + write tools
  |
Supabase (canonical memory)
  |
Studio Web (view / capture / edit / approve)
```

## Verified production state

Verified on 2026-09-08:

- Production Supabase project `chongyu-studio-os` is healthy.
- Core Studio tables have RLS enabled and browser roles have no direct V1 table privileges.
- ChatGPT → Supabase read/write/delete path has been tested end to end.
- `memory_items` was added for compact durable memory instead of storing whole chats.
- `studio_get_student_context` returns task-sized student context packages.
- `studio_search_memory` supports targeted durable-memory retrieval.
- Security-definer helper access was hardened and mutable function search-path warning was fixed.
- Missing foreign-key indexes were added.
- Vercel automatically deploys `main` commits.
- The Vercel project now has a server-side Supabase secret configured; this commit triggers a fresh Production deployment so runtime connectivity can be verified.

## Product areas

- Founder Command Center
- Universal Inbox
- Students
- Lessons
- Content Studio
- Company Brain
- AI Manager Workspaces (UI retained, embedded AI chat is not the current priority)

## Memory model

Structured operational facts live in domain tables such as:

- `students`
- `lessons`
- `student_skills`
- `projects`
- `parent_updates`
- `content_items`
- `decisions`

Reusable long-term AI memory lives in:

- `company_brain` — approved principles / insights
- `memory_items` — compact durable memories with entity scope, importance, provenance and approval state

Raw capture lands in:

- `inbox_items`

The rule is: **save approved outcomes, not entire conversations**.

## Studio tool contract

See `mcp/TOOLS.md`.

Core operations:

- `studio.health`
- `studio.get_student_context`
- `studio.search_memory`
- `studio.capture`
- `studio.save_memory`
- `studio.create_lesson`
- `studio.save_decision`
- `studio.create_content`

The service implementation in `mcp/server.py` is already Supabase-backed. A future remote MCP transport can wrap it without changing the tool contract.

## Website live-data path

The repository now includes:

- `api/studio-data.js` — authenticated Vercel server endpoint for Studio data
- `studio-live.js` — hydrates the current V1 UI from Supabase and writes Capture items to the real Inbox
- `/api/health` — reports whether the memory backend is ready

The server-side Supabase key lives only in Vercel (`SUPABASE_SECRET_KEY` or legacy `SUPABASE_SERVICE_ROLE_KEY`). It must never be committed to GitHub or sent through chat.

## Security posture

- RLS is enabled on all Studio tables.
- V1 intentionally has no browser-facing table policies; this is why the security advisor may show informational `RLS Enabled No Policy` entries.
- Service keys are server-only.
- The website server API is additionally protected by `STUDIO_ACCESS_TOKEN`.
- The automatic RLS helper is not executable by public/authenticated browser roles.

## Repository structure

```text
.
├── index.html
├── styles.css
├── app.js
├── studio-live.js
├── manager-workspace.js
├── api/
│   ├── studio-data.js
│   ├── chat.js
│   └── health.js
├── data/
│   └── seed.js
├── skills/
├── supabase/
│   └── migrations/
├── mcp/
│   ├── server.py
│   └── TOOLS.md
└── docs/
```

## Next milestones

1. Verify Vercel runtime can reach Supabase with the new server secret.
2. Replace remaining demo-only UI assumptions with CRUD against Supabase.
3. Add founder approval flows for `candidate` memories / decisions.
4. Add richer task-specific context helpers instead of loading broad database slices.
5. Add Claude Code later only when it materially improves a workflow.
