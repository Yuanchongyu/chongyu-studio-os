# Chongyu Studio OS architecture

## Core rule

GPT and Claude do not synchronize chats with each other. They read and write the same Studio state.

```text
                       Chongyu
                          │
                    Studio Web UI
                          │
                  ┌──── Context API ────┐
                  │                     │
             AI Gateway              MCP Server
              /      \                /      \
            GPT     Claude       ChatGPT   Claude Code
                  │                     │
                  └──── Studio Services ┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
          PostgreSQL    Company Brain    Storage
          structured      retrieval       artifacts
```

## Context levels

1. Global — company identity, teaching philosophy, output rules.
2. Role — Education Manager / Content Manager / Chief of Staff.
3. Entity — a student, lesson, content item or project.
4. Task — the exact current request.

The Context Engine assembles only relevant information instead of dumping the full company history into every model call.

## Shared state vs shared chat

Agents write structured facts, artifacts, decisions and insights back to Studio. Other agents read those approved objects. Agent-private chain-of-thought and raw chats are not the company memory.

## Provenance

Every important output should preserve source IDs: lesson → content draft, lesson → skill update, discussion → decision, evidence → Company Brain insight.
