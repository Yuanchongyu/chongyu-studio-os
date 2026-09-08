# Studio MCP tool contract

Supabase is the canonical company-memory backend. ChatGPT already has verified read/write access to the production project. These contracts define the model-agnostic Studio interface; a standard MCP transport can expose the same operations to Claude Code or another model later without migrating memory.

## Context reads

- `studio.health()` — verify database connectivity.
- `studio.get_student_context(student_slug, lesson_limit=5)` — profile + recent lessons + skills + parent updates + student memory + relevant company rules.
- `studio.get_company_context(limit=20)` — compact company principles, active decisions and durable memory.
- `studio.get_content_context(limit=20)` — compact content pipeline and source-provenance context.
- `studio.get_weekly_snapshot(days=30)` — executive snapshot: student activity, recent lessons, content pipeline, decisions and Inbox pressure.
- `studio.search_memory(query, limit=8)` — targeted durable-memory retrieval without loading the whole database.
- `studio.get_inbox(status="new", limit=20)` — read raw captures awaiting processing or historical Inbox items.

## Write-backs

- `studio.capture(content, input_type="founder_note", classification={})` — raw capture into Universal Inbox.
- `studio.mark_inbox_processed(item_id, classification={})` — close the raw capture after structured write-backs are completed.
- `studio.save_memory(payload)` — compact durable memory with entity scope, provenance, importance and approval state.
- `studio.create_lesson(payload)` — structured lesson artifact.
- `studio.save_decision(payload)` — proposed or active company decision.
- `studio.create_content(payload)` — content idea/draft with source provenance.

## Core workflow

```text
Founder capture / conversation
          |
          v
     inbox_items (raw)
          |
    ChatGPT processes
          |
  +-------+--------+---------+----------+
  |       |        |         |          |
lesson  decision  content  memory   parent update
  |       |        |         |          |
  +-------+--------+---------+----------+
          |
 mark Inbox processed
```

The rule is **structured outcomes over chat transcripts**. A 30-turn conversation should normally become a small number of durable records, not 30 messages of permanent context.

## Current validation status

Production Supabase project: `chongyu-studio-os`

Validated on 2026-09-08:

1. ChatGPT can read production Studio state.
2. Temporary `inbox_items` write → exact read-back → delete succeeded.
3. `memory_items` supports compact durable memory.
4. `studio_get_student_context` returned a compact Kevin context package.
5. `studio_search_memory` supports targeted retrieval.
6. Company/content/weekly context RPCs were created and tested.
7. Vercel `/api/health` reports `memory_ready` and `database=connected`.
8. Vercel server-side Supabase access uses a secret key and the required `service_role` SQL privileges.
9. Studio Web can load real Supabase data through `/api/studio-data` after founder unlock.
10. Browser founder unlock now uses an HttpOnly derived session cookie; the raw `STUDIO_ACCESS_TOKEN` is not stored in page JavaScript.

## Security rules

- Never expose raw SQL as a normal model tool.
- Browser roles have no direct Studio-table privileges in V1.
- Supabase secret/service-role keys stay server-side only.
- Studio Web data APIs require a founder session.
- `candidate` memories can be AI-generated; important company truth should be promoted to `active` through founder approval or an explicit founder decision.
- Prefer compact structured write-back over storing full chat transcripts.

## Architecture

```text
Founder
  |
ChatGPT (primary AI operator now)
  |
Studio tool contract / context helpers
  |
Supabase (canonical company memory)
  ^
  |
Studio Web (view / capture / approve)

Claude Code or another model can be added later
by implementing the same Studio tool contract.
```

The AI model is replaceable. The memory and tool contract belong to Chongyu Studio.
