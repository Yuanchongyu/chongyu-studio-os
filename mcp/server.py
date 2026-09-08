"""Supabase-backed service layer for Chongyu Studio MCP.

The service layer is the durable contract. ChatGPT can operate the same production
Supabase project directly today; a standard MCP transport can wrap this module later
without changing the company-memory model or migrating data.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, Optional

DEFAULT_SUPABASE_URL = "https://lclkojyfyqhefwmkmgym.supabase.co"


class StudioError(RuntimeError):
    pass


@dataclass
class StudioContext:
    entity: Optional[str]
    task: str
    depth: str = "normal"


class StudioService:
    def __init__(self, supabase_url: Optional[str] = None, service_key: Optional[str] = None):
        # Production intentionally defaults to the dedicated Studio project instead
        # of inheriting an unrelated NEXT_PUBLIC_SUPABASE_URL from another app.
        self.base_url = (supabase_url or os.getenv("SUPABASE_URL") or DEFAULT_SUPABASE_URL).rstrip("/")
        self.service_key = service_key or os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""
        if not self.service_key:
            raise StudioError("A server-side Supabase key is required (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY).")

    def _headers(self, extra: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        headers = {"apikey": self.service_key, "Content-Type": "application/json"}
        if self.service_key.startswith("eyJ"):
            headers["Authorization"] = f"Bearer {self.service_key}"
        if extra:
            headers.update(extra)
        return headers

    def _request(self, method: str, path: str, payload: Any = None, extra_headers: Optional[Dict[str, str]] = None) -> Any:
        body = None if payload is None else json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}{path}",
            data=body,
            headers=self._headers(extra_headers),
            method=method,
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as response:
                raw = response.read().decode("utf-8")
                return json.loads(raw) if raw else None
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:800]
            raise StudioError(f"Supabase HTTP {exc.code}: {detail}") from exc
        except urllib.error.URLError as exc:
            raise StudioError(f"Supabase request failed: {exc}") from exc

    def _rpc(self, name: str, payload: Dict[str, Any]) -> Any:
        return self._request("POST", f"/rest/v1/rpc/{name}", payload)

    def _select(self, table: str, query: str = "") -> Any:
        suffix = f"?{query}" if query else ""
        return self._request("GET", f"/rest/v1/{table}{suffix}") or []

    def _insert(self, table: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        rows = self._request(
            "POST",
            f"/rest/v1/{table}",
            payload,
            {"Prefer": "return=representation"},
        ) or []
        return rows[0] if rows else {}

    def _patch(self, table: str, query: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        rows = self._request(
            "PATCH",
            f"/rest/v1/{table}?{query}",
            payload,
            {"Prefer": "return=representation"},
        ) or []
        return rows[0] if rows else {}

    def health(self) -> Dict[str, Any]:
        rows = self._select("students", "select=id&limit=1")
        return {"ok": True, "database": "connected", "sample_rows": len(rows)}

    # ------------------------------ Context reads ------------------------------
    def get_student_context(self, student_slug: str, lesson_limit: int = 5) -> Dict[str, Any]:
        result = self._rpc(
            "studio_get_student_context",
            {"p_slug": student_slug, "p_lesson_limit": max(1, min(lesson_limit, 20))},
        )
        return result or {}

    def get_company_context(self, limit: int = 20) -> Dict[str, Any]:
        result = self._rpc("studio_get_company_context", {"p_limit": max(1, min(limit, 100))})
        return result or {}

    def get_content_context(self, limit: int = 20) -> Dict[str, Any]:
        result = self._rpc("studio_get_content_context", {"p_limit": max(1, min(limit, 100))})
        return result or {}

    def get_weekly_snapshot(self, days: int = 30) -> Dict[str, Any]:
        result = self._rpc("studio_get_weekly_snapshot", {"p_days": max(1, min(days, 365))})
        return result or {}

    def search_memory(self, query: str, limit: int = 8) -> Any:
        return self._rpc(
            "studio_search_memory",
            {"p_query": query, "p_limit": max(1, min(limit, 30))},
        )

    def get_inbox(self, status: str = "new", limit: int = 20) -> Any:
        if status not in {"new", "processed", "archived", "all"}:
            raise StudioError("Inbox status must be new, processed, archived or all.")
        clauses = ["select=id,input_type,raw_content,classification,status,created_at", "order=created_at.desc", f"limit={max(1, min(limit, 100))}"]
        if status != "all":
            clauses.append(f"status=eq.{urllib.parse.quote(status)}")
        return self._select("inbox_items", "&".join(clauses))

    # ------------------------------ Write-backs -------------------------------
    def capture(self, content: str, input_type: str = "founder_note", classification: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not content.strip():
            raise StudioError("Capture content cannot be empty.")
        return self._insert(
            "inbox_items",
            {
                "input_type": input_type[:80],
                "raw_content": content[:50000],
                "classification": classification or {},
                "status": "new",
            },
        )

    def mark_inbox_processed(self, item_id: str, classification: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not item_id:
            raise StudioError("Inbox item id is required.")
        payload: Dict[str, Any] = {"status": "processed"}
        if classification is not None:
            payload["classification"] = classification
        return self._patch("inbox_items", f"id=eq.{urllib.parse.quote(item_id)}", payload)

    def save_memory(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        required = ["memory_type", "title", "summary"]
        missing = [field for field in required if not payload.get(field)]
        if missing:
            raise StudioError(f"Missing memory fields: {', '.join(missing)}")
        clean = {
            "memory_type": payload["memory_type"],
            "entity_type": payload.get("entity_type") or "company",
            "entity_ref": payload.get("entity_ref"),
            "title": payload["title"],
            "summary": payload["summary"],
            "details": payload.get("details") or {},
            "source_type": payload.get("source_type"),
            "source_ref": payload.get("source_ref"),
            "importance": max(1, min(int(payload.get("importance", 3)), 5)),
            "status": payload.get("status", "candidate"),
            "created_by": payload.get("created_by", "AI"),
            "approved_by": payload.get("approved_by"),
        }
        return self._insert("memory_items", clean)

    def create_lesson(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self._insert("lessons", payload)

    def save_decision(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self._insert("decisions", payload)

    def create_content(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self._insert("content_items", payload)


TOOLS = {
    "studio.health": "Verify the Studio database connection.",
    "studio.get_student_context": "Read compact durable context for one student.",
    "studio.get_company_context": "Read current company principles, decisions and durable memory.",
    "studio.get_content_context": "Read a compact content pipeline context package.",
    "studio.get_weekly_snapshot": "Read an executive snapshot for the requested recent time window.",
    "studio.search_memory": "Search approved long-term Studio memory.",
    "studio.get_inbox": "Read unprocessed or historical Universal Inbox items.",
    "studio.capture": "Capture a raw founder note into the Universal Inbox.",
    "studio.mark_inbox_processed": "Mark an Inbox item processed and attach classification metadata.",
    "studio.save_memory": "Save a compact durable memory item with provenance.",
    "studio.create_lesson": "Write a structured lesson artifact.",
    "studio.save_decision": "Write a company decision or proposal.",
    "studio.create_content": "Create a content idea/draft with provenance.",
}
