# V1 MCP tool contract

Expose only a small set first:

- `studio.get_student_context(student_slug)`
- `studio.get_lesson_context(lesson_id)`
- `studio.get_context(entity, task, depth)`
- `studio.create_lesson(payload)`
- `studio.save_decision(payload)`
- `studio.search_company_brain(query, limit)`
- `studio.create_content(payload)`

Claude Code, OpenAI/ChatGPT integrations and the Studio web app should all use the same contracts.

Do not expose raw SQL tools to models.
