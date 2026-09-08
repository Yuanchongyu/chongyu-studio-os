# Chongyu Studio OS

AI-native personal company operating system for education, student progress tracking, lesson planning, parent feedback, content operations, and shared AI context across GPT and Claude.

## Current status

The bilingual V1 is deployed on Vercel and this repository is the canonical source of truth — no more ZIP-based handoff.

The current build includes:

- Founder Command Center
- Universal Inbox
- Students / Lessons / Content Studio / Company Brain
- AI Manager Workspaces
- GPT / Claude model routing UI
- Server-side `/api/chat` AI Gateway
- Supabase-backed context loading and `ai_runs` logging
- `/api/health` deployment diagnostics

### Run locally

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Core principles

- The Studio, not any individual model, owns memory and skills.
- GPT and Claude share structured company state, not raw chat history.
- Skills are model-agnostic.
- PostgreSQL is the source of truth for structured data.
- Important AI outputs are written back as structured artifacts.
- Agents are stateless; company memory is persistent.

## Deployment

Production is connected to Vercel through the `main` branch. Environment-variable changes require a fresh production deployment. This commit intentionally triggers a new deployment after the Studio server-side secrets were configured.

Server-only secrets must stay in Vercel Environment Variables and must never be committed to this repository.

## Repository structure

```text
.
├── index.html
├── styles.css
├── app.js
├── manager-workspace.js
├── manager-ai.js
├── api/
│   ├── chat.js
│   └── health.js
├── data/
│   └── seed.js
├── skills/
├── supabase/
├── mcp/
└── docs/
```

## Production architecture

- Frontend + server functions: Vercel
- Database: Supabase Postgres
- File storage: Supabase Storage
- AI gateway: OpenAI + Anthropic
- Shared tool layer: Studio MCP
- Source of truth: GitHub

## Next milestone

Add authenticated founder access, structured write-back actions, richer manager context manifests, and a full Context Engine / Skills execution layer.
