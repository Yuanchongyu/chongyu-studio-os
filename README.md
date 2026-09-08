# Chongyu Studio OS

AI-native personal company operating system for education, student progress tracking, lesson planning, parent feedback, content operations, and shared AI context across GPT and Claude.

## Core principles

- The Studio, not any individual model, owns memory and skills.
- GPT and Claude share structured company state, not raw chat history.
- Skills are model-agnostic.
- PostgreSQL is the source of truth for structured data.
- Important AI outputs are written back as structured artifacts.
- Agents are stateless; company memory is persistent.

## Planned architecture

- Web app: Next.js + Tailwind + shadcn/ui
- Database: Supabase Postgres
- File storage: Supabase Storage
- Semantic memory: pgvector
- AI gateway: OpenAI + Anthropic
- Shared tool layer: Studio MCP
- Deployment: Vercel

## Initial product areas

- Founder Command Center
- Universal Inbox
- Students
- Lessons
- Content Studio
- Company Brain
- AI Manager Workspaces

## Repository status

This repository is now the canonical source of truth for Chongyu Studio OS. The next migration step is to move the existing bilingual V1 prototype into this repo and progressively replace the static prototype with the full-stack implementation.
