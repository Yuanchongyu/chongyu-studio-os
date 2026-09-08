"""Chongyu Studio MCP contract stub.

This file intentionally contains a framework-neutral service layer first.
Wire these functions into FastMCP / the official MCP SDK after Supabase is connected.
The important design choice is the tool contract, not the transport library.
"""
from dataclasses import dataclass
from typing import Any, Dict, Optional

@dataclass
class StudioContext:
    entity: Optional[str]
    task: str
    depth: str = "normal"

class StudioService:
    def get_student_context(self, student_slug: str) -> Dict[str, Any]:
        raise NotImplementedError("Connect to Supabase students/lessons/student_skills/projects")

    def get_lesson_context(self, lesson_id: str) -> Dict[str, Any]:
        raise NotImplementedError("Connect to Supabase lessons + related student/project/brain")

    def get_context(self, entity: Optional[str], task: str, depth: str = "normal") -> Dict[str, Any]:
        raise NotImplementedError("Context Engine: Global + Role + Entity + Task")

    def create_lesson(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("Validate + insert lesson + audit writeback")

    def save_decision(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("Insert proposed decision; founder approval remains separate")

    def search_company_brain(self, query: str, limit: int = 8) -> Dict[str, Any]:
        raise NotImplementedError("Start with full-text; upgrade to pgvector later")

    def create_content(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("Insert content item with source provenance")

TOOLS = {
    "studio.get_student_context": "Read one student's durable context.",
    "studio.get_lesson_context": "Read a lesson and its relevant context.",
    "studio.get_context": "Assemble task-specific context for GPT/Claude.",
    "studio.create_lesson": "Write a structured lesson artifact.",
    "studio.save_decision": "Write a proposed company decision.",
    "studio.search_company_brain": "Search reusable company knowledge.",
    "studio.create_content": "Create a content idea/draft with provenance.",
}
