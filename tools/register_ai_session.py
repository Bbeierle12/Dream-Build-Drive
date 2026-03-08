#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import threading
import time

from checklist_store import (
    find_session,
    find_session_by_pid,
    load_state,
    make_session,
    now_iso,
    save_state,
    session_effective_status,
    touch_session,
)


def load_and_resolve(session_id: str | None, pid: int | None):
    state = load_state()
    ref = None
    if session_id:
        ref = find_session(state.get("sessions", []), session_id)
    elif pid is not None:
        ref = find_session_by_pid(state.get("sessions", []), pid)
    return state, ref


def update_session_metadata(session: dict, args: argparse.Namespace) -> None:
    if getattr(args, "title", None):
        session["title"] = args.title
    if getattr(args, "provider", None):
        session["provider"] = args.provider
    if getattr(args, "model", None):
        session["model"] = args.model
    if getattr(args, "terminal", None):
        session["terminal"] = args.terminal
    if getattr(args, "command", None):
        session["command"] = args.command
    if getattr(args, "cwd", None):
        session["cwd"] = args.cwd
    if getattr(args, "source", None):
        session["source"] = args.source
    if getattr(args, "hostname", None):
        session["hostname"] = args.hostname
    if getattr(args, "notes", None) is not None:
        session["notes"] = args.notes
    if getattr(args, "pid", None) is not None:
        session["pid"] = args.pid


def cmd_open(args: argparse.Namespace) -> int:
    state = load_state()
    session = make_session(
        title=args.title,
        provider=args.provider or "",
        model=args.model or "",
        terminal=args.terminal or "",
        command=args.command or "",
        cwd=args.cwd or os.getcwd(),
        pid=args.pid,
        source=args.source or "manual",
        hostname=args.hostname or socket.gethostname(),
        notes=args.notes or "",
    )
    state.setdefault("sessions", []).insert(0, session)
    save_state(state)
    print(session["id"])
    return 0


def cmd_heartbeat(args: argparse.Namespace) -> int:
    state, ref = load_and_resolve(args.session_id, args.pid)
    if ref is None:
        target = args.session_id if args.session_id else f"pid={args.pid}"
        print(f"Session not found: {target}")
        return 1

    update_session_metadata(ref.session, args)
    ref.session["status"] = "active"
    ref.session["closed_at"] = None
    touch_session(ref.session)
    save_state(state)
    print(ref.session["id"])
    return 0


def cmd_close(args: argparse.Namespace) -> int:
    state, ref = load_and_resolve(args.session_id, args.pid)
    if ref is None:
        target = args.session_id if args.session_id else f"pid={args.pid}"
        print(f"Session not found: {target}")
        return 1

    update_session_metadata(ref.session, args)
    ref.session["status"] = "closed"
    ref.session["closed_at"] = now_iso()
    ref.session["updated_at"] = ref.session["closed_at"]
    ref.session["exit_code"] = args.exit_code
    save_state(state)
    print(ref.session["id"])
    return 0


def cmd_activate(args: argparse.Namespace) -> int:
    state, ref = load_and_resolve(args.session_id, args.pid)
    if ref is None:
        target = args.session_id if args.session_id else f"pid={args.pid}"
        print(f"Session not found: {target}")
        return 1

    update_session_metadata(ref.session, args)
    ref.session["status"] = "active"
    ref.session["closed_at"] = None
    ref.session["exit_code"] = None
    touch_session(ref.session)
    save_state(state)
    print(ref.session["id"])
    return 0


def cmd_list(_args: argparse.Namespace) -> int:
    state = load_state()
    for session in state.get("sessions", []):
        payload = {
            "id": session.get("id"),
            "title": session.get("title"),
            "provider": session.get("provider"),
            "model": session.get("model"),
            "terminal": session.get("terminal"),
            "command": session.get("command"),
            "cwd": session.get("cwd"),
            "pid": session.get("pid"),
            "source": session.get("source"),
            "hostname": session.get("hostname"),
            "status": session.get("status"),
            "effective_status": session_effective_status(session),
            "opened_at": session.get("opened_at"),
            "last_heartbeat_at": session.get("last_heartbeat_at"),
            "closed_at": session.get("closed_at"),
            "exit_code": session.get("exit_code"),
        }
        print(json.dumps(payload))
    return 0


def heartbeat_loop(stop_event: threading.Event, session_id: str, interval_seconds: int) -> None:
    while not stop_event.wait(interval_seconds):
        heartbeat_args = argparse.Namespace(
            session_id=session_id,
            pid=None,
            title=None,
            provider=None,
            model=None,
            terminal=None,
            command=None,
            cwd=None,
            source=None,
            hostname=None,
            notes=None,
        )
        cmd_heartbeat(heartbeat_args)


def cmd_wrap(args: argparse.Namespace) -> int:
    command = args.command
    if command and command[0] == "--":
        command = command[1:]
    if not command:
        print("No wrapped command provided.")
        return 2

    cwd = args.cwd or os.getcwd()
    process = subprocess.Popen(command, cwd=cwd)

    session = make_session(
        title=args.title or Path(command[0]).name,
        provider=args.provider or "",
        model=args.model or "",
        terminal=args.terminal or command[0],
        command=" ".join(command),
        cwd=cwd,
        pid=process.pid,
        source=args.source or "wrapped",
        hostname=args.hostname or socket.gethostname(),
        notes=args.notes or "",
    )
    state = load_state()
    state.setdefault("sessions", []).insert(0, session)
    save_state(state)
    print(session["id"], flush=True)

    stop_event = threading.Event()
    thread = threading.Thread(
        target=heartbeat_loop,
        args=(stop_event, session["id"], args.heartbeat_interval),
        daemon=True,
    )
    thread.start()

    try:
        return_code = process.wait()
    except KeyboardInterrupt:
        process.terminate()
        return_code = process.wait()
    finally:
        stop_event.set()
        thread.join(timeout=1.0)

    close_args = argparse.Namespace(
        session_id=session["id"],
        pid=None,
        title=None,
        provider=None,
        model=None,
        terminal=None,
        command=None,
        cwd=None,
        source=None,
        hostname=None,
        notes=None,
        exit_code=return_code,
    )
    cmd_close(close_args)
    return return_code


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="True session tracker for Codex, Claude, Ollama, and other AI terminal workflows."
    )
    subparsers = parser.add_subparsers(dest="command_name", required=True)

    open_parser = subparsers.add_parser("open", help="Register a new session")
    open_parser.add_argument("--title", required=True)
    open_parser.add_argument("--provider", default="")
    open_parser.add_argument("--model", default="")
    open_parser.add_argument("--terminal", default="")
    open_parser.add_argument("--command", default="")
    open_parser.add_argument("--cwd", default="")
    open_parser.add_argument("--pid", type=int, default=None)
    open_parser.add_argument("--source", default="manual")
    open_parser.add_argument("--hostname", default="")
    open_parser.add_argument("--notes", default="")
    open_parser.set_defaults(func=cmd_open)

    heartbeat_parser = subparsers.add_parser("heartbeat", help="Heartbeat an existing session")
    heartbeat_parser.add_argument("--session-id")
    heartbeat_parser.add_argument("--pid", type=int)
    heartbeat_parser.add_argument("--title")
    heartbeat_parser.add_argument("--provider")
    heartbeat_parser.add_argument("--model")
    heartbeat_parser.add_argument("--terminal")
    heartbeat_parser.add_argument("--command")
    heartbeat_parser.add_argument("--cwd")
    heartbeat_parser.add_argument("--source")
    heartbeat_parser.add_argument("--hostname")
    heartbeat_parser.add_argument("--notes")
    heartbeat_parser.set_defaults(func=cmd_heartbeat)

    close_parser = subparsers.add_parser("close", help="Close a session")
    close_parser.add_argument("--session-id")
    close_parser.add_argument("--pid", type=int)
    close_parser.add_argument("--exit-code", type=int, default=0)
    close_parser.add_argument("--notes")
    close_parser.set_defaults(func=cmd_close)

    activate_parser = subparsers.add_parser("activate", help="Mark a session active")
    activate_parser.add_argument("--session-id")
    activate_parser.add_argument("--pid", type=int)
    activate_parser.add_argument("--title")
    activate_parser.add_argument("--provider")
    activate_parser.add_argument("--model")
    activate_parser.add_argument("--terminal")
    activate_parser.add_argument("--command")
    activate_parser.add_argument("--cwd")
    activate_parser.add_argument("--source")
    activate_parser.add_argument("--hostname")
    activate_parser.add_argument("--notes")
    activate_parser.set_defaults(func=cmd_activate)

    list_parser = subparsers.add_parser("list", help="List sessions")
    list_parser.set_defaults(func=cmd_list)

    wrap_parser = subparsers.add_parser("wrap", help="Run a command and track it as a real session")
    wrap_parser.add_argument("--title", default="")
    wrap_parser.add_argument("--provider", default="")
    wrap_parser.add_argument("--model", default="")
    wrap_parser.add_argument("--terminal", default="")
    wrap_parser.add_argument("--cwd", default="")
    wrap_parser.add_argument("--source", default="wrapped")
    wrap_parser.add_argument("--hostname", default="")
    wrap_parser.add_argument("--notes", default="")
    wrap_parser.add_argument("--heartbeat-interval", type=int, default=30)
    wrap_parser.add_argument("command", nargs=argparse.REMAINDER)
    wrap_parser.set_defaults(func=cmd_wrap)

    return parser


def validate_args(args: argparse.Namespace) -> int | None:
    if args.command_name in {"heartbeat", "close", "activate"}:
        if not getattr(args, "session_id", None) and getattr(args, "pid", None) is None:
            print("Provide either --session-id or --pid.")
            return 2
    return None


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    validation_error = validate_args(args)
    if validation_error is not None:
        return validation_error
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
