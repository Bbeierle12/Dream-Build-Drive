from __future__ import annotations

import json
import socket
import uuid
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


APP_TITLE = "DBD Desktop Checklist"
SAVE_PATH = Path.home() / ".dbd_desktop_checklist.json"
HEARTBEAT_TIMEOUT_SECONDS = 300


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def make_id() -> str:
    return uuid.uuid4().hex


def make_node(title: str) -> dict:
    return {
        "id": make_id(),
        "title": title,
        "checked": False,
        "collapsed": False,
        "children": [],
    }


def make_session(
    title: str,
    provider: str = "",
    model: str = "",
    terminal: str = "",
    notes: str = "",
    command: str = "",
    cwd: str = "",
    pid: int | None = None,
    source: str = "manual",
    hostname: str = "",
) -> dict:
    opened_at = now_iso()
    return {
        "id": make_id(),
        "title": title,
        "provider": provider,
        "model": model,
        "terminal": terminal,
        "command": command,
        "cwd": cwd,
        "pid": pid,
        "source": source,
        "hostname": hostname or socket.gethostname(),
        "notes": notes,
        "status": "active",
        "opened_at": opened_at,
        "last_heartbeat_at": opened_at,
        "updated_at": opened_at,
        "closed_at": None,
        "exit_code": None,
    }


def default_state() -> dict:
    return {
        "title": "Build Checklist",
        "last_saved_at": None,
        "items": [
            {
                **make_node("Planning"),
                "children": [
                    make_node("Review roadmap"),
                    make_node("Break work into milestones"),
                    make_node("Confirm dependencies and blockers"),
                ],
            },
            {
                **make_node("Implementation"),
                "children": [
                    make_node("Schema and data model"),
                    make_node("UI and workflows"),
                    make_node("Tests and validation"),
                ],
            },
            {
                **make_node("Release"),
                "children": [
                    make_node("Documentation"),
                    make_node("Final QA"),
                    make_node("Deployment readiness"),
                ],
            },
        ],
        "sessions": [
            make_session(
                title="Initial Planning Session",
                provider="Codex",
                model="GPT-5",
                terminal="codex",
                command="codex",
                cwd="",
                source="manual",
                notes="Use this area to track what happened in each AI session.",
            )
        ],
    }


def ensure_node_shape(node: dict) -> dict:
    node.setdefault("id", make_id())
    node.setdefault("title", "Untitled")
    node.setdefault("checked", False)
    node.setdefault("collapsed", False)
    children = node.get("children") or []
    node["children"] = [ensure_node_shape(child) for child in children]
    return node


def ensure_session_shape(session: dict) -> dict:
    session.setdefault("id", make_id())
    session.setdefault("title", "Untitled Session")
    session.setdefault("provider", "")
    session.setdefault("model", "")
    session.setdefault("terminal", "")
    session.setdefault("command", "")
    session.setdefault("cwd", "")
    session.setdefault("pid", None)
    session.setdefault("source", "manual")
    session.setdefault("hostname", socket.gethostname())
    session.setdefault("notes", "")
    session.setdefault("status", "active")
    session.setdefault("opened_at", now_iso())
    session.setdefault("last_heartbeat_at", session["opened_at"])
    session.setdefault("updated_at", session["opened_at"])
    session.setdefault("closed_at", None)
    session.setdefault("exit_code", None)
    return session


def load_state() -> dict:
    if not SAVE_PATH.exists():
        return default_state()

    try:
        raw = json.loads(SAVE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return default_state()

    if not isinstance(raw, dict) or not isinstance(raw.get("items"), list):
        return default_state()

    raw.setdefault("title", "Build Checklist")
    raw.setdefault("last_saved_at", None)
    raw.setdefault("sessions", [])
    raw["items"] = [ensure_node_shape(node) for node in raw["items"]]
    raw["sessions"] = [ensure_session_shape(session) for session in raw["sessions"]]
    return raw


def save_state(state: dict) -> None:
    state["last_saved_at"] = now_iso()
    SAVE_PATH.write_text(json.dumps(state, indent=2), encoding="utf-8")


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def touch_session(session: dict) -> None:
    stamp = now_iso()
    session["last_heartbeat_at"] = stamp
    session["updated_at"] = stamp


def session_last_activity(session: dict) -> datetime | None:
    for key in ("last_heartbeat_at", "updated_at", "opened_at"):
        parsed = parse_iso(session.get(key))
        if parsed is not None:
            return parsed
    return None


def session_effective_status(session: dict, reference: datetime | None = None) -> str:
    explicit = session.get("status") or "active"
    if explicit == "closed":
        return "closed"

    reference = reference or datetime.now()
    last_activity = session_last_activity(session)
    if last_activity is None:
        return explicit

    delta_seconds = (reference - last_activity).total_seconds()
    if delta_seconds > HEARTBEAT_TIMEOUT_SECONDS:
        return "stale"
    return "active"


def active_session_count(sessions: list[dict]) -> int:
    now = datetime.now()
    return sum(1 for session in sessions if session_effective_status(session, now) == "active")


def count_items(nodes: list[dict]) -> tuple[int, int]:
    total = 0
    complete = 0

    def walk(items: list[dict]) -> None:
        nonlocal total, complete
        for item in items:
            total += 1
            if item.get("checked"):
                complete += 1
            walk(item.get("children", []))

    walk(nodes)
    return total, complete


def branch_counts(node: dict) -> tuple[int, int]:
    total = 1
    complete = 1 if node.get("checked") else 0
    for child in node.get("children", []):
        child_total, child_complete = branch_counts(child)
        total += child_total
        complete += child_complete
    return total, complete


def set_checked_recursive(node: dict, checked: bool) -> None:
    node["checked"] = checked
    for child in node.get("children", []):
        set_checked_recursive(child, checked)


def set_collapsed_recursive(nodes: list[dict], collapsed: bool) -> None:
    for node in nodes:
        node["collapsed"] = collapsed
        set_collapsed_recursive(node.get("children", []), collapsed)


@dataclass
class NodeRef:
    node: dict
    siblings: list[dict]
    index: int
    parent: dict | None


def find_node(nodes: list[dict], node_id: str, parent: dict | None = None) -> NodeRef | None:
    for index, node in enumerate(nodes):
        if node["id"] == node_id:
            return NodeRef(node=node, siblings=nodes, index=index, parent=parent)
        nested = find_node(node.get("children", []), node_id, parent=node)
        if nested is not None:
            return nested
    return None


@dataclass
class SessionRef:
    session: dict
    index: int


def find_session(sessions: list[dict], session_id: str) -> SessionRef | None:
    for index, session in enumerate(sessions):
        if session["id"] == session_id:
            return SessionRef(session=session, index=index)
    return None


def find_session_by_pid(sessions: list[dict], pid: int) -> SessionRef | None:
    for index, session in enumerate(sessions):
        if session.get("pid") == pid:
            return SessionRef(session=session, index=index)
    return None
