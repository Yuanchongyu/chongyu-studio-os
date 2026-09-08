# Chongyu Studio OS

AI-native personal company operating system for education, student progress tracking, lesson planning, parent feedback, content operations, and shared AI context across GPT and Claude.

## Current status

The bilingual static V1 prototype is now migrated into this repository and can run directly in a browser. This repository is the canonical source of truth from now on — no more ZIP-based handoff.

### Run V1 locally

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

## V1 product areas

- Founder Command Center
- Universal Inbox
- Students
- Lessons
- Content Studio
- Company Brain
- AI Manager directory
- EN / 中文 UI switch
- Auto / GPT / Claude model selector prototype

## Repository structure

```text
.
├── index.html
├── styles.css
├── app.js
├── data/
│   └── seed.js
├── skills/
│   ├── company/
│   ├── content/
│   ├── education/
│   └── parent/
├── supabase/
│   ├── schema.sql
│   └── seed.sql
├── mcp/
│   ├── server.py
│   └── TOOLS.md
└── docs/
    ├── ARCHITECTURE.md
    └── DATABASE_SETUP.md
```

## Planned production architecture

- Web app: Next.js + Tailwind + shadcn/ui
- Database: Supabase Postgres
- File storage: Supabase Storage
- Semantic memory: pgvector
- AI gateway: OpenAI + Anthropic
- Shared tool layer: Studio MCP
- Deployment: Vercel

## Next milestone

Turn the current AI Manager directory into real Manager Workspaces with persistent shared Studio memory, per-manager context packages, model switching, skills/actions, and structured write-back.
