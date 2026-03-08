#!/usr/bin/env python3
from __future__ import annotations

import json
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import sys
import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog, ttk

from checklist_store import (
    APP_TITLE,
    HEARTBEAT_TIMEOUT_SECONDS,
    SAVE_PATH,
    active_session_count,
    branch_counts,
    count_items,
    default_state,
    ensure_node_shape,
    ensure_session_shape,
    find_node,
    find_session,
    load_state,
    make_node,
    make_session,
    now_iso,
    save_state,
    session_effective_status,
    session_last_activity,
    set_checked_recursive,
    set_collapsed_recursive,
    touch_session,
)


class ChecklistApp:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title(APP_TITLE)
        self.root.geometry("1320x820")
        self.root.minsize(980, 620)

        self.state = load_state()
        self.title_var = tk.StringVar(value=self.state["title"])
        self.total_var = tk.StringVar(value="0")
        self.complete_var = tk.StringVar(value="0")
        self.progress_var = tk.StringVar(value="0%")
        self.saved_var = tk.StringVar(value="Never")
        self.session_count_var = tk.StringVar(value="0")
        self.active_session_var = tk.StringVar(value="0")
        self.selection_var = tk.StringVar(value="No checklist item selected")
        self.session_summary_var = tk.StringVar(value="No session selected")
        self.session_path_var = tk.StringVar(value=str(SAVE_PATH))
        self.notes_dirty_after_id: str | None = None
        self.loading_notes = False
        self.last_loaded_mtime = self.store_mtime()
        self.tool_dir = Path(__file__).resolve().parent
        self.current_page = tk.StringVar(value="checklist")
        self.sidebar_sections: dict[str, dict[str, object]] = {}
        self.page_buttons: dict[str, tk.Button] = {}
        self.page_frames: dict[str, tk.Frame] = {}

        self.build_ui()
        self.refresh()
        self.root.after(2000, self.poll_store)

    def build_ui(self) -> None:
        self.root.configure(bg="#0f141a")

        style = ttk.Style()
        style.theme_use("clam")
        style.configure(
            "Treeview",
            rowheight=28,
            fieldbackground="#151b22",
            background="#151b22",
            foreground="#f3f4f6",
        )
        style.configure("Treeview.Heading", background="#1f2731", foreground="#f3f4f6")

        outer = tk.Frame(self.root, bg="#0f141a")
        outer.pack(fill="both", expand=True, padx=18, pady=18)

        shell = tk.Frame(outer, bg="#0f141a")
        shell.pack(fill="both", expand=True)

        sidebar = tk.Frame(shell, bg="#121820", bd=1, relief="solid", width=320)
        sidebar.pack(side="left", fill="y", padx=(0, 16))
        sidebar.pack_propagate(False)

        content = tk.Frame(shell, bg="#0f141a")
        content.pack(side="left", fill="both", expand=True)

        self.build_sidebar(sidebar)
        self.build_pages(content)
        self.show_page("checklist")

        footer = tk.Frame(outer, bg="#0f141a")
        footer.pack(fill="x", pady=(12, 0))
        tk.Label(
            footer,
            textvariable=self.saved_var,
            bg="#0f141a",
            fg="#9ca3af",
            font=("Segoe UI", 9),
        ).pack(side="left")
        tk.Label(
            footer,
            textvariable=self.session_path_var,
            bg="#0f141a",
            fg="#6b7280",
            font=("Segoe UI", 9),
        ).pack(side="right")

    def build_sidebar(self, parent: tk.Frame) -> None:
        title_card = tk.Frame(parent, bg="#151b22", bd=1, relief="solid")
        title_card.pack(fill="x", padx=12, pady=12)

        tk.Label(
            title_card,
            text="DBD Session Tracker",
            bg="#151b22",
            fg="#f9fafb",
            font=("Segoe UI", 16, "bold"),
        ).pack(anchor="w", padx=14, pady=(14, 2))
        tk.Label(
            title_card,
            text="Checklist-first workspace with tracked AI sessions and focused detail pages.",
            bg="#151b22",
            fg="#9ca3af",
            wraplength=260,
            justify="left",
            font=("Segoe UI", 9),
        ).pack(anchor="w", padx=14, pady=(0, 14))

        workspace_body = self.build_sidebar_section(parent, "Workspace", expanded=True)
        tk.Label(
            workspace_body,
            text="Workspace Title",
            bg="#151b22",
            fg="#9ca3af",
            font=("Segoe UI", 9, "bold"),
        ).pack(anchor="w")

        title_entry = tk.Entry(
            workspace_body,
            textvariable=self.title_var,
            bg="#10161d",
            fg="#f9fafb",
            insertbackground="#f9fafb",
            relief="flat",
            font=("Segoe UI", 14, "bold"),
        )
        title_entry.pack(fill="x", pady=(6, 10))
        title_entry.bind("<KeyRelease>", self.on_title_change)

        self.make_sidebar_metric(workspace_body, "Items / Done", self.total_var, self.complete_var)
        self.make_sidebar_metric(workspace_body, "Progress / Active Sessions", self.progress_var, self.active_session_var)
        self.make_sidebar_metric(workspace_body, "All Sessions / Saved", self.session_count_var, self.saved_var)

        pages_body = self.build_sidebar_section(parent, "Pages", expanded=True)
        self.page_buttons["checklist"] = self.make_button(
            pages_body,
            "Checklist Focus",
            lambda: self.show_page("checklist"),
            primary=True,
        )
        self.page_buttons["checklist"].pack(fill="x", pady=(0, 8))
        self.page_buttons["sessions"] = self.make_button(
            pages_body,
            "Sessions & Notes",
            lambda: self.show_page("sessions"),
        )
        self.page_buttons["sessions"].pack(fill="x")

        checklist_body = self.build_sidebar_section(parent, "Checklist Actions", expanded=True)
        self.make_button(checklist_body, "Add Main Category", self.add_root, primary=True).pack(fill="x", pady=(0, 8))
        self.make_button(checklist_body, "Add Child", self.add_child).pack(fill="x", pady=(0, 8))
        self.make_button(checklist_body, "Add Sibling", self.add_sibling).pack(fill="x", pady=(0, 8))
        self.make_button(checklist_body, "Rename Item", self.rename_selected).pack(fill="x", pady=(0, 8))
        self.make_button(checklist_body, "Toggle Complete", self.toggle_selected).pack(fill="x", pady=(0, 8))
        self.make_button(checklist_body, "Expand All", self.expand_all).pack(fill="x", pady=(0, 8))
        self.make_button(checklist_body, "Collapse All", self.collapse_all).pack(fill="x", pady=(0, 8))
        self.make_button(checklist_body, "Delete Item", self.delete_selected, danger=True).pack(fill="x")

        session_body = self.build_sidebar_section(parent, "Session Actions", expanded=False)
        self.make_button(session_body, "New Session", self.add_session, primary=True).pack(fill="x", pady=(0, 8))
        self.make_button(session_body, "Edit Session", self.edit_session).pack(fill="x", pady=(0, 8))
        self.make_button(session_body, "Mark Active", self.mark_session_active).pack(fill="x", pady=(0, 8))
        self.make_button(session_body, "Close Session", self.close_session).pack(fill="x", pady=(0, 8))
        self.make_button(session_body, "Delete Session", self.delete_session, danger=True).pack(fill="x")

        launch_body = self.build_sidebar_section(parent, "Launch Sessions", expanded=True)
        self.make_button(launch_body, "Launch Codex", self.launch_codex, primary=True).pack(fill="x", pady=(0, 8))
        self.make_button(launch_body, "Launch Claude", self.launch_claude, primary=True).pack(fill="x", pady=(0, 8))
        self.make_button(launch_body, "Launch Ollama", self.launch_ollama, primary=True).pack(fill="x", pady=(0, 8))
        self.make_button(launch_body, "Launch Custom", self.launch_custom, primary=True).pack(fill="x")

        data_body = self.build_sidebar_section(parent, "Data", expanded=False)
        self.make_button(data_body, "Reload Store", self.reload_from_disk).pack(fill="x", pady=(0, 8))
        self.make_button(data_body, "Export JSON", self.export_json).pack(fill="x", pady=(0, 8))
        self.make_button(data_body, "Import JSON", self.import_json).pack(fill="x", pady=(0, 8))
        self.make_button(data_body, "Reset Workspace", self.reset_state, danger=True).pack(fill="x")

    def build_sidebar_section(self, parent: tk.Frame, title: str, expanded: bool) -> tk.Frame:
        section = tk.Frame(parent, bg="#151b22", bd=1, relief="solid")
        section.pack(fill="x", padx=12, pady=(0, 12))

        header_button = tk.Button(
            section,
            text="",
            command=lambda key=title: self.toggle_sidebar_section(key),
            bg="#1a222c",
            fg="#f9fafb",
            activebackground="#232d39",
            activeforeground="#f9fafb",
            relief="flat",
            bd=0,
            padx=14,
            pady=10,
            anchor="w",
            cursor="hand2",
            font=("Segoe UI", 10, "bold"),
        )
        header_button.pack(fill="x")

        body = tk.Frame(section, bg="#151b22")
        body.pack(fill="x", padx=12, pady=12)

        self.sidebar_sections[title] = {
            "button": header_button,
            "body": body,
            "expanded": expanded,
        }
        self.refresh_sidebar_section(title)
        return body

    def refresh_sidebar_section(self, title: str) -> None:
        section = self.sidebar_sections[title]
        header_button = section["button"]
        body = section["body"]
        expanded = bool(section["expanded"])
        header_button.configure(text=f"[{'-' if expanded else '+'}] {title}")
        if expanded:
            if not body.winfo_manager():
                body.pack(fill="x", padx=12, pady=12)
        elif body.winfo_manager():
            body.pack_forget()

    def toggle_sidebar_section(self, title: str) -> None:
        section = self.sidebar_sections[title]
        section["expanded"] = not bool(section["expanded"])
        self.refresh_sidebar_section(title)

    def make_sidebar_metric(
        self,
        parent: tk.Widget,
        label: str,
        primary_var: tk.StringVar,
        secondary_var: tk.StringVar,
    ) -> None:
        frame = tk.Frame(parent, bg="#10161d")
        frame.pack(fill="x", pady=(0, 8))
        tk.Label(
            frame,
            text=label,
            bg="#10161d",
            fg="#9ca3af",
            font=("Segoe UI", 8, "bold"),
        ).pack(anchor="w", padx=10, pady=(8, 2))
        tk.Label(
            frame,
            textvariable=primary_var,
            bg="#10161d",
            fg="#f9fafb",
            font=("Segoe UI", 12, "bold"),
        ).pack(anchor="w", padx=10)
        tk.Label(
            frame,
            textvariable=secondary_var,
            bg="#10161d",
            fg="#9ca3af",
            font=("Segoe UI", 8),
        ).pack(anchor="w", padx=10, pady=(0, 8))

    def build_pages(self, parent: tk.Frame) -> None:
        stack = tk.Frame(parent, bg="#0f141a")
        stack.pack(fill="both", expand=True)
        stack.grid_rowconfigure(0, weight=1)
        stack.grid_columnconfigure(0, weight=1)

        checklist_page = tk.Frame(stack, bg="#0f141a")
        sessions_page = tk.Frame(stack, bg="#0f141a")
        checklist_page.grid(row=0, column=0, sticky="nsew")
        sessions_page.grid(row=0, column=0, sticky="nsew")

        self.page_frames["checklist"] = checklist_page
        self.page_frames["sessions"] = sessions_page

        self.build_checklist_page(checklist_page)
        self.build_sessions_page(sessions_page)

    def build_checklist_page(self, parent: tk.Frame) -> None:
        panel = tk.Frame(parent, bg="#151b22", bd=1, relief="solid")
        panel.pack(fill="both", expand=True)

        top = tk.Frame(panel, bg="#151b22")
        top.pack(fill="x", padx=18, pady=(18, 12))

        tk.Label(
            top,
            text="Checklist Focus",
            bg="#151b22",
            fg="#f9fafb",
            font=("Segoe UI", 20, "bold"),
        ).pack(anchor="w")
        tk.Label(
            top,
            text="Standalone plan and build view with the full checklist visible at once.",
            bg="#151b22",
            fg="#9ca3af",
            font=("Segoe UI", 10),
        ).pack(anchor="w", pady=(4, 0))
        tk.Label(
            top,
            textvariable=self.selection_var,
            bg="#151b22",
            fg="#9ca3af",
            font=("Segoe UI", 9),
        ).pack(anchor="w", pady=(8, 0))

        stats = tk.Frame(panel, bg="#151b22")
        stats.pack(fill="x", padx=18, pady=(0, 12))
        self.make_stat(stats, "Total Items", self.total_var).pack(side="left", fill="x", expand=True, padx=(0, 8))
        self.make_stat(stats, "Completed", self.complete_var).pack(side="left", fill="x", expand=True, padx=8)
        self.make_stat(stats, "Progress", self.progress_var).pack(side="left", fill="x", expand=True, padx=8)
        self.make_stat(stats, "Sessions", self.session_count_var).pack(side="left", fill="x", expand=True, padx=8)
        self.make_stat(stats, "Active Sessions", self.active_session_var).pack(side="left", fill="x", expand=True, padx=(8, 0))

        tree_wrap = tk.Frame(panel, bg="#151b22")
        tree_wrap.pack(fill="both", expand=True, padx=18, pady=(0, 18))

        self.tree = ttk.Treeview(
            tree_wrap,
            columns=("progress",),
            show="tree headings",
            selectmode="browse",
        )
        self.tree.heading("#0", text="Plan / Build Items")
        self.tree.heading("progress", text="Branch Progress")
        self.tree.column("#0", width=840, stretch=True)
        self.tree.column("progress", width=160, anchor="center", stretch=False)
        self.tree.pack(side="left", fill="both", expand=True)

        scrollbar = ttk.Scrollbar(tree_wrap, orient="vertical", command=self.tree.yview)
        scrollbar.pack(side="right", fill="y")
        self.tree.configure(yscrollcommand=scrollbar.set)

        self.tree.bind("<<TreeviewSelect>>", self.on_tree_select)
        self.tree.bind("<Double-1>", self.on_double_click)
        self.tree.bind("<space>", self.on_space_toggle)
        self.tree.bind("<Return>", self.on_return_rename)
        self.tree.bind("<<TreeviewOpen>>", self.on_tree_open)
        self.tree.bind("<<TreeviewClose>>", self.on_tree_close)

    def build_sessions_page(self, parent: tk.Frame) -> None:
        panel = tk.Frame(parent, bg="#151b22", bd=1, relief="solid")
        panel.pack(fill="both", expand=True)

        top = tk.Frame(panel, bg="#151b22")
        top.pack(fill="x", padx=18, pady=(18, 12))
        tk.Label(
            top,
            text="Sessions & Notes",
            bg="#151b22",
            fg="#f9fafb",
            font=("Segoe UI", 20, "bold"),
        ).pack(anchor="w")
        tk.Label(
            top,
            text="Tracked AI sessions across Codex, Claude, Ollama, and any custom terminal workflow.",
            bg="#151b22",
            fg="#9ca3af",
            font=("Segoe UI", 10),
        ).pack(anchor="w", pady=(4, 0))

        session_layout = tk.PanedWindow(panel, orient="vertical", bg="#151b22", sashwidth=8)
        session_layout.pack(fill="both", expand=True, padx=18, pady=(0, 18))

        top_panel = tk.Frame(session_layout, bg="#151b22")
        bottom_panel = tk.Frame(session_layout, bg="#151b22")
        session_layout.add(top_panel, minsize=260)
        session_layout.add(bottom_panel, minsize=240)

        tree_wrap = tk.Frame(top_panel, bg="#151b22")
        tree_wrap.pack(fill="both", expand=True)

        self.sessions_tree = ttk.Treeview(
            tree_wrap,
            columns=("provider", "status"),
            show="tree headings",
            selectmode="browse",
        )
        self.sessions_tree.heading("#0", text="Session")
        self.sessions_tree.heading("provider", text="Provider / Model / PID")
        self.sessions_tree.heading("status", text="Status")
        self.sessions_tree.column("#0", width=260, stretch=True)
        self.sessions_tree.column("provider", width=380, stretch=True)
        self.sessions_tree.column("status", width=140, anchor="center", stretch=False)
        self.sessions_tree.pack(side="left", fill="both", expand=True)

        scroll = ttk.Scrollbar(tree_wrap, orient="vertical", command=self.sessions_tree.yview)
        scroll.pack(side="right", fill="y")
        self.sessions_tree.configure(yscrollcommand=scroll.set)
        self.sessions_tree.bind("<<TreeviewSelect>>", self.on_session_select)

        details = tk.Frame(bottom_panel, bg="#151b22")
        details.pack(fill="both", expand=True)
        tk.Label(
            details,
            text="Session Details",
            bg="#151b22",
            fg="#f9fafb",
            font=("Segoe UI", 11, "bold"),
        ).pack(anchor="w", pady=(0, 6))
        tk.Label(
            details,
            textvariable=self.session_summary_var,
            bg="#151b22",
            fg="#9ca3af",
            justify="left",
            anchor="w",
            wraplength=860,
            font=("Segoe UI", 9),
        ).pack(fill="x", pady=(0, 12))

        tk.Label(
            details,
            text="Session Notes",
            bg="#151b22",
            fg="#f9fafb",
            font=("Segoe UI", 11, "bold"),
        ).pack(anchor="w", pady=(0, 6))

        self.notes_text = tk.Text(
            details,
            bg="#10161d",
            fg="#f3f4f6",
            insertbackground="#f3f4f6",
            relief="flat",
            wrap="word",
            height=14,
            font=("Consolas", 10),
        )
        self.notes_text.pack(fill="both", expand=True)
        self.notes_text.bind("<KeyRelease>", self.on_notes_change)

    def show_page(self, page: str) -> None:
        if page not in self.page_frames:
            return
        self.current_page.set(page)
        self.page_frames[page].tkraise()
        self.refresh_page_buttons()

    def refresh_page_buttons(self) -> None:
        for page, button in self.page_buttons.items():
            is_active = page == self.current_page.get()
            button.configure(
                bg="#c0392b" if is_active else "#202731",
                activebackground="#9f2f24" if is_active else "#2a3340",
            )

    def make_button(self, parent: tk.Widget, text: str, command, primary: bool = False, danger: bool = False) -> tk.Button:
        bg = "#c0392b" if primary else "#202731"
        fg = "#ffffff"
        active_bg = "#9f2f24" if primary else "#2a3340"
        if danger:
            bg = "#3a1f22"
            active_bg = "#53262b"
        return tk.Button(
            parent,
            text=text,
            command=command,
            bg=bg,
            fg=fg,
            activebackground=active_bg,
            activeforeground=fg,
            relief="flat",
            bd=0,
            padx=12,
            pady=8,
            cursor="hand2",
            font=("Segoe UI", 10, "bold"),
        )

    def make_stat(self, parent: tk.Widget, label: str, variable: tk.StringVar) -> tk.Frame:
        frame = tk.Frame(parent, bg="#151b22", bd=1, relief="solid")
        tk.Label(frame, text=label, bg="#151b22", fg="#9ca3af", font=("Segoe UI", 9, "bold")).pack(
            anchor="w",
            padx=12,
            pady=(10, 2),
        )
        tk.Label(frame, textvariable=variable, bg="#151b22", fg="#f9fafb", font=("Segoe UI", 15, "bold")).pack(
            anchor="w",
            padx=12,
            pady=(0, 10),
        )
        return frame

    def store_mtime(self) -> float | None:
        try:
            return SAVE_PATH.stat().st_mtime
        except FileNotFoundError:
            return None

    def current_selection_ids(self) -> tuple[str | None, str | None]:
        checklist_id = self.tree.selection()[0] if self.tree.selection() else None
        session_id = self.sessions_tree.selection()[0] if self.sessions_tree.selection() else None
        return checklist_id, session_id

    def restore_selection(self, checklist_id: str | None, session_id: str | None) -> None:
        if checklist_id and self.tree.exists(checklist_id):
            self.tree.selection_set(checklist_id)
        if session_id and session_id in self.sessions_tree.get_children():
            self.sessions_tree.selection_set(session_id)

    def save(self) -> None:
        self.flush_notes()
        self.state["title"] = self.title_var.get().strip() or "Build Checklist"
        save_state(self.state)
        self.last_loaded_mtime = self.store_mtime()

    def refresh_stats(self) -> None:
        total, complete = count_items(self.state["items"])
        percent = 0 if total == 0 else round((complete / total) * 100)
        sessions = self.state.get("sessions", [])
        active_sessions = active_session_count(sessions)

        self.total_var.set(str(total))
        self.complete_var.set(str(complete))
        self.progress_var.set(f"{percent}%")
        self.session_count_var.set(str(len(sessions)))
        self.active_session_var.set(str(active_sessions))
        self.saved_var.set(f"Last saved: {self.state.get('last_saved_at') or 'Never'}")

    def refresh_checklist_tree(self) -> None:
        self.tree.delete(*self.tree.get_children())

        def insert_nodes(nodes: list[dict], parent: str = "") -> None:
            for node in nodes:
                branch_total, branch_complete = branch_counts(node)
                prefix = "[x]" if node.get("checked") else "[ ]"
                label = f"{prefix} {node.get('title', 'Untitled')}"
                tree_id = self.tree.insert(
                    parent,
                    "end",
                    iid=node["id"],
                    text=label,
                    values=(f"{branch_complete}/{branch_total}",),
                    open=not node.get("collapsed", False),
                )
                insert_nodes(node.get("children", []), tree_id)

        insert_nodes(self.state["items"])

    def refresh_sessions_tree(self) -> None:
        current = self.sessions_tree.selection()
        selected_id = current[0] if current else None
        self.sessions_tree.delete(*self.sessions_tree.get_children())

        for session in self.state.get("sessions", []):
            provider_model = " / ".join(
                part for part in [session.get("provider"), session.get("model")] if part
            )
            pid = session.get("pid")
            if pid:
                provider_model = f"{provider_model or '-'} / pid:{pid}"
            effective_status = session_effective_status(session)
            self.sessions_tree.insert(
                "",
                "end",
                iid=session["id"],
                text=session.get("title", "Untitled Session"),
                values=(provider_model or "-", effective_status),
            )

        if selected_id and selected_id in self.sessions_tree.get_children():
            self.sessions_tree.selection_set(selected_id)
        self.sync_session_details()

    def render(self) -> None:
        self.refresh_stats()
        self.refresh_checklist_tree()
        self.refresh_sessions_tree()
        self.selection_var.set(self.selection_text())

    def refresh(self) -> None:
        checklist_id, session_id = self.current_selection_ids()
        self.save()
        self.render()
        self.restore_selection(checklist_id, session_id)

    def selection_text(self) -> str:
        selected = self.current_ref()
        if selected is None:
            return "No checklist item selected"
        branch_total, branch_complete = branch_counts(selected.node)
        return f"Selected: {selected.node['title']}  |  Branch progress: {branch_complete}/{branch_total}"

    def current_ref(self):
        selected = self.tree.selection()
        if not selected:
            return None
        return find_node(self.state["items"], selected[0])

    def current_session_ref(self):
        selected = self.sessions_tree.selection()
        if not selected:
            return None
        return find_session(self.state.get("sessions", []), selected[0])

    def sync_session_details(self) -> None:
        selected = self.current_session_ref()
        self.loading_notes = True
        self.notes_text.delete("1.0", tk.END)

        if selected is None:
            self.session_summary_var.set("No session selected")
            self.loading_notes = False
            return

        session = selected.session
        effective_status = session_effective_status(session)
        last_activity = session_last_activity(session)
        last_activity_text = last_activity.isoformat(timespec="seconds") if last_activity else "-"
        summary = (
            f"Provider: {session.get('provider') or '-'}  |  "
            f"Model: {session.get('model') or '-'}  |  "
            f"Terminal: {session.get('terminal') or '-'}\n"
            f"Status: {effective_status}  |  "
            f"PID: {session.get('pid') or '-'}  |  "
            f"Source: {session.get('source') or '-'}\n"
            f"CWD: {session.get('cwd') or '-'}\n"
            f"Command: {session.get('command') or '-'}\n"
            f"Opened: {session.get('opened_at') or '-'}  |  "
            f"Heartbeat: {session.get('last_heartbeat_at') or '-'}  |  "
            f"Last activity: {last_activity_text}\n"
            f"Closed: {session.get('closed_at') or '-'}  |  "
            f"Exit: {session.get('exit_code') if session.get('exit_code') is not None else '-'}"
        )
        self.session_summary_var.set(summary)
        self.notes_text.insert("1.0", session.get("notes", ""))
        self.loading_notes = False

    def flush_notes(self) -> None:
        if self.loading_notes:
            return
        selected = self.current_session_ref()
        if selected is None:
            return
        selected.session["notes"] = self.notes_text.get("1.0", tk.END).rstrip()

    def schedule_notes_save(self) -> None:
        if self.notes_dirty_after_id is not None:
            self.root.after_cancel(self.notes_dirty_after_id)
        self.notes_dirty_after_id = self.root.after(400, self.commit_notes)

    def commit_notes(self) -> None:
        self.notes_dirty_after_id = None
        checklist_id, session_id = self.current_selection_ids()
        self.save()
        self.render()
        self.restore_selection(checklist_id, session_id)

    def on_title_change(self, _event=None) -> None:
        self.state["title"] = self.title_var.get().strip() or "Build Checklist"
        self.refresh()

    def on_notes_change(self, _event=None) -> None:
        if self.loading_notes:
            return
        self.flush_notes()
        self.schedule_notes_save()

    def on_tree_select(self, _event=None) -> None:
        self.selection_var.set(self.selection_text())

    def on_session_select(self, _event=None) -> None:
        self.sync_session_details()

    def reload_from_disk(self) -> None:
        checklist_id, session_id = self.current_selection_ids()
        self.state = load_state()
        self.title_var.set(self.state["title"])
        self.last_loaded_mtime = self.store_mtime()
        self.render()
        self.restore_selection(checklist_id, session_id)

    def poll_store(self) -> None:
        try:
            current_mtime = self.store_mtime()
            if (
                current_mtime is not None
                and self.last_loaded_mtime is not None
                and current_mtime > self.last_loaded_mtime
                and self.notes_dirty_after_id is None
            ):
                self.reload_from_disk()
        finally:
            self.root.after(2000, self.poll_store)

    def on_double_click(self, _event=None) -> None:
        self.toggle_selected()

    def on_space_toggle(self, _event=None) -> str:
        self.toggle_selected()
        return "break"

    def on_return_rename(self, _event=None) -> str:
        self.rename_selected()
        return "break"

    def on_tree_open(self, _event=None) -> None:
        selected = self.current_ref()
        if selected is not None:
            selected.node["collapsed"] = False
            self.refresh()

    def on_tree_close(self, _event=None) -> None:
        selected = self.current_ref()
        if selected is not None:
            selected.node["collapsed"] = True
            self.refresh()

    def prompt(self, prompt: str, initial: str = "") -> str | None:
        return simpledialog.askstring(APP_TITLE, prompt, initialvalue=initial, parent=self.root)

    def default_launch_cwd(self) -> str:
        selected = self.current_session_ref()
        if selected and selected.session.get("cwd"):
            return selected.session["cwd"]
        return str(Path.cwd())

    def detect_terminal_emulator(self) -> list[str] | None:
        candidates = [
            ("x-terminal-emulator", ["x-terminal-emulator", "-e"]),
            ("gnome-terminal", ["gnome-terminal", "--"]),
            ("konsole", ["konsole", "-e"]),
            ("kitty", ["kitty", "-e"]),
            ("alacritty", ["alacritty", "-e"]),
            ("xfce4-terminal", ["xfce4-terminal", "-x"]),
            ("xterm", ["xterm", "-e"]),
        ]
        for binary, command in candidates:
            if shutil.which(binary):
                return command
        return None

    def launch_wrapped_session(
        self,
        *,
        title: str,
        provider: str,
        model: str,
        terminal: str,
        command: list[str],
        cwd: str,
        notes: str = "",
    ) -> None:
        terminal_cmd = self.detect_terminal_emulator()
        if terminal_cmd is None:
            messagebox.showerror(
                APP_TITLE,
                "No supported terminal emulator was found. Install gnome-terminal, xterm, konsole, kitty, alacritty, or x-terminal-emulator.",
                parent=self.root,
            )
            return

        register_script = self.tool_dir / "register_ai_session.py"
        wrapper_parts = [
            sys.executable,
            str(register_script),
            "wrap",
            "--title",
            title,
            "--provider",
            provider,
            "--model",
            model,
            "--terminal",
            terminal,
            "--cwd",
            cwd,
        ]
        if notes:
            wrapper_parts.extend(["--notes", notes])
        wrapper_parts.append("--")
        wrapper_parts.extend(command)

        shell_command = " ".join(shlex.quote(part) for part in wrapper_parts)
        spawn_command = terminal_cmd + ["bash", "-lc", shell_command]

        try:
            subprocess.Popen(
                spawn_command,
                cwd=cwd,
                start_new_session=True,
            )
        except Exception as exc:
            messagebox.showerror(
                APP_TITLE,
                f"Could not launch tracked session:\n{exc}",
                parent=self.root,
            )
            return

        self.root.after(1200, self.reload_from_disk)

    def launch_codex(self) -> None:
        title = self.prompt("Session title:", "Codex Session")
        if not title:
            return
        cwd = self.prompt("Working directory:", self.default_launch_cwd())
        if not cwd:
            return
        self.launch_wrapped_session(
            title=title.strip(),
            provider="Codex",
            model="GPT-5",
            terminal="codex",
            command=["codex"],
            cwd=cwd.strip(),
        )

    def launch_claude(self) -> None:
        title = self.prompt("Session title:", "Claude Session")
        if not title:
            return
        model = self.prompt("Model label:", "Sonnet") or "Sonnet"
        cwd = self.prompt("Working directory:", self.default_launch_cwd())
        if not cwd:
            return
        self.launch_wrapped_session(
            title=title.strip(),
            provider="Claude",
            model=model.strip(),
            terminal="claude",
            command=["claude"],
            cwd=cwd.strip(),
        )

    def launch_ollama(self) -> None:
        title = self.prompt("Session title:", "Ollama Session")
        if not title:
            return
        model = self.prompt("Ollama model:", "mistral")
        if not model:
            return
        cwd = self.prompt("Working directory:", self.default_launch_cwd())
        if not cwd:
            return
        self.launch_wrapped_session(
            title=title.strip(),
            provider="Ollama",
            model=model.strip(),
            terminal=f"ollama run {model.strip()}",
            command=["ollama", "run", model.strip()],
            cwd=cwd.strip(),
        )

    def launch_custom(self) -> None:
        title = self.prompt("Session title:", "Custom Session")
        if not title:
            return
        provider = self.prompt("Provider / tool:", "Custom") or "Custom"
        model = self.prompt("Model label:", "") or ""
        terminal = self.prompt("Terminal label:", provider) or provider
        command_text = self.prompt("Command to run:", "")
        if not command_text:
            return
        cwd = self.prompt("Working directory:", self.default_launch_cwd())
        if not cwd:
            return
        notes = self.prompt("Notes:", "") or ""
        try:
            command = shlex.split(command_text)
        except ValueError as exc:
            messagebox.showerror(APP_TITLE, f"Invalid command:\n{exc}", parent=self.root)
            return
        if not command:
            messagebox.showerror(APP_TITLE, "Command cannot be empty.", parent=self.root)
            return
        self.launch_wrapped_session(
            title=title.strip(),
            provider=provider.strip(),
            model=model.strip(),
            terminal=terminal.strip(),
            command=command,
            cwd=cwd.strip(),
            notes=notes.strip(),
        )

    def add_root(self) -> None:
        title = self.prompt("Main category name:", "New Main Category")
        if not title:
            return
        self.state["items"].append(make_node(title.strip()))
        self.refresh()

    def add_child(self) -> None:
        selected = self.current_ref()
        if selected is None:
            messagebox.showinfo(APP_TITLE, "Select a checklist item first.")
            return
        title = self.prompt("Child item name:", "New Subitem")
        if not title:
            return
        selected.node.setdefault("children", []).append(make_node(title.strip()))
        selected.node["collapsed"] = False
        self.refresh()
        self.tree.selection_set(selected.node["id"])

    def add_sibling(self) -> None:
        selected = self.current_ref()
        if selected is None:
            messagebox.showinfo(APP_TITLE, "Select a checklist item first.")
            return
        title = self.prompt("Sibling item name:", "New Item")
        if not title:
            return
        selected.siblings.insert(selected.index + 1, make_node(title.strip()))
        self.refresh()

    def rename_selected(self) -> None:
        selected = self.current_ref()
        if selected is None:
            messagebox.showinfo(APP_TITLE, "Select a checklist item first.")
            return
        title = self.prompt("Rename item:", selected.node["title"])
        if not title:
            return
        selected.node["title"] = title.strip()
        self.refresh()

    def toggle_selected(self) -> None:
        selected = self.current_ref()
        if selected is None:
            messagebox.showinfo(APP_TITLE, "Select a checklist item first.")
            return
        set_checked_recursive(selected.node, not selected.node.get("checked", False))
        self.refresh()
        self.tree.selection_set(selected.node["id"])

    def delete_selected(self) -> None:
        selected = self.current_ref()
        if selected is None:
            messagebox.showinfo(APP_TITLE, "Select a checklist item first.")
            return
        confirmed = messagebox.askyesno(
            APP_TITLE,
            f"Delete '{selected.node['title']}' and all of its children?",
            parent=self.root,
        )
        if not confirmed:
            return
        selected.siblings.pop(selected.index)
        self.refresh()

    def expand_all(self) -> None:
        set_collapsed_recursive(self.state["items"], False)
        self.refresh()

    def collapse_all(self) -> None:
        set_collapsed_recursive(self.state["items"], True)
        self.refresh()

    def add_session(self) -> None:
        title = self.prompt("Session title:", "New AI Session")
        if not title:
            return
        provider = self.prompt("Provider / tool:", "Codex") or ""
        model = self.prompt("Model:", "") or ""
        terminal = self.prompt("Terminal command or launcher:", "") or ""
        command = self.prompt("Command:", terminal) or ""
        cwd = self.prompt("Working directory:", str(Path.cwd())) or ""
        session = make_session(
            title=title.strip(),
            provider=provider.strip(),
            model=model.strip(),
            terminal=terminal.strip(),
            command=command.strip(),
            cwd=cwd.strip(),
            source="manual",
        )
        self.state.setdefault("sessions", []).insert(0, session)
        self.refresh()
        self.sessions_tree.selection_set(session["id"])
        self.sync_session_details()

    def edit_session(self) -> None:
        selected = self.current_session_ref()
        if selected is None:
            messagebox.showinfo(APP_TITLE, "Select a session first.")
            return
        session = selected.session
        title = self.prompt("Session title:", session.get("title", ""))
        if not title:
            return
        provider = self.prompt("Provider / tool:", session.get("provider", "")) or ""
        model = self.prompt("Model:", session.get("model", "")) or ""
        terminal = self.prompt("Terminal command or launcher:", session.get("terminal", "")) or ""
        command = self.prompt("Command:", session.get("command", "")) or ""
        cwd = self.prompt("Working directory:", session.get("cwd", "")) or ""

        session["title"] = title.strip()
        session["provider"] = provider.strip()
        session["model"] = model.strip()
        session["terminal"] = terminal.strip()
        session["command"] = command.strip()
        session["cwd"] = cwd.strip()
        touch_session(session)
        self.refresh()
        self.sessions_tree.selection_set(session["id"])
        self.sync_session_details()

    def mark_session_active(self) -> None:
        selected = self.current_session_ref()
        if selected is None:
            messagebox.showinfo(APP_TITLE, "Select a session first.")
            return
        selected.session["status"] = "active"
        selected.session["closed_at"] = None
        selected.session["exit_code"] = None
        touch_session(selected.session)
        self.refresh()

    def close_session(self) -> None:
        selected = self.current_session_ref()
        if selected is None:
            messagebox.showinfo(APP_TITLE, "Select a session first.")
            return
        selected.session["status"] = "closed"
        stamp = now_iso()
        selected.session["closed_at"] = stamp
        selected.session["updated_at"] = stamp
        self.refresh()

    def delete_session(self) -> None:
        selected = self.current_session_ref()
        if selected is None:
            messagebox.showinfo(APP_TITLE, "Select a session first.")
            return
        confirmed = messagebox.askyesno(
            APP_TITLE,
            f"Delete session '{selected.session['title']}'?",
            parent=self.root,
        )
        if not confirmed:
            return
        self.state["sessions"].pop(selected.index)
        self.refresh()

    def export_json(self) -> None:
        target = filedialog.asksaveasfilename(
            parent=self.root,
            title="Export checklist workspace",
            defaultextension=".json",
            filetypes=[("JSON files", "*.json")],
            initialfile=f"{self.state['title'].strip().replace(' ', '-').lower() or 'dbd-workspace'}.json",
        )
        if not target:
            return
        self.flush_notes()
        Path(target).write_text(json.dumps(self.state, indent=2), encoding="utf-8")
        messagebox.showinfo(APP_TITLE, f"Exported workspace to:\n{target}", parent=self.root)

    def import_json(self) -> None:
        source = filedialog.askopenfilename(
            parent=self.root,
            title="Import checklist workspace",
            filetypes=[("JSON files", "*.json")],
        )
        if not source:
            return
        try:
            raw = json.loads(Path(source).read_text(encoding="utf-8"))
            if not isinstance(raw, dict) or not isinstance(raw.get("items"), list):
                raise ValueError("Invalid workspace JSON")
            self.state = {
                "title": raw.get("title", "Imported Checklist"),
                "last_saved_at": None,
                "items": [ensure_node_shape(node) for node in raw["items"]],
                "sessions": [ensure_session_shape(session) for session in raw.get("sessions", [])],
            }
            self.title_var.set(self.state["title"])
            self.refresh()
        except Exception as exc:
            messagebox.showerror(APP_TITLE, f"Import failed:\n{exc}", parent=self.root)

    def reset_state(self) -> None:
        confirmed = messagebox.askyesno(
            APP_TITLE,
            "Reset the full workspace to the default starter template?",
            parent=self.root,
        )
        if not confirmed:
            return
        self.state = default_state()
        self.title_var.set(self.state["title"])
        self.refresh()


def main() -> None:
    root = tk.Tk()
    ChecklistApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
