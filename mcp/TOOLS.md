# Studio MCP tool contract

Supabase is the canonical company-memory backend. ChatGPT already has verified read/write access to the production project, and these tool contracts define the model-agnostic interface that the Studio MCP transport should expose.

## Verified core operations

- `studio.health()` — verify database connectivity.
- `studio.get_student_context(student_slug, lesson_limit=5)` — return a compact student context package (profile, recent lessons, skills, parent updates, student memory, company rules).
- `studio.search_memory(query, limit=8)` — search durable approved memory without loading the full company database.
- `studio.capture(content, input_type="founder_note", classification={})` — capture raw notes into the Universal Inbox.
- `studio.save_memory(payload)` — save a compact durable memory item with provenance and approval state.
- `studio.create_lesson(payload)` — create a structured lesson record.
- `studio.save_decision(payload)` — save a proposed or active company decision.
- `studio.create_content(payload)` — create a content idea/draft with source provenance.

## Current validation status

Production Supabase project: `chongyu-studio-os`

Validated on 2026-09-08:

1. Read database state through the connected Supabase integration.
2. Write a temporary `inbox_items` row.
3. Read the exact row back.
4. Delete the temporary row.
5. Create and query long-term `memory_items`.
6. Create `studio_get_student_context` and verify a compact context package for Kevin.
7. Create `studio_search_memory` for targeted durable-memory retrieval.

This confirms the shared-state path works independently of any embedded website chat UI.

## Security rules

- Never expose raw SQL as a normal model tool.
- Browser roles have no direct Studio-table privileges in V1.
- Server-side service keys stay only in a trusted backend.
- `candidate` memories can be AI-generated; important company truth should be promoted to `active` through founder approval or an explicit founder decision.
- Prefer compact structured write-back over storing full chat transcripts.

## Architecture

```text
ChatGPT now / Claude later
        |
     Studio MCP
        |
  context + write tools
        |
     Supabase
        |
Studio Web (visualize/edit/approve)
```

The AI model is replaceable. The memory and tool contract belong to Chongyu Studio.
