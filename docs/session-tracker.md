# Session Tracker

This workspace includes a provider-agnostic AI session tracker for terminal-based workflows such as Codex, Claude, Ollama, or any other command you want to wrap.

## Files

- [desktop_checklist.py](/home/bbeierle12/Dream%20Build%20Drive/Dream-Build-Drive/tools/desktop_checklist.py): desktop UI
- [register_ai_session.py](/home/bbeierle12/Dream%20Build%20Drive/Dream-Build-Drive/tools/register_ai_session.py): lifecycle CLI
- [checklist_store.py](/home/bbeierle12/Dream%20Build%20Drive/Dream-Build-Drive/tools/checklist_store.py): shared store and session model

## Storage

The tracker persists to:

```bash
~/.dbd_desktop_checklist.json
```

The desktop app polls this store, so externally tracked sessions show up in the UI without manual re-entry.

## Launch The Desktop App

```bash
python3 tools/desktop_checklist.py
```

## UI-First Workflow

You do not need to run terminal commands manually for normal use.

From the desktop app toolbar you can now launch:

- `Launch Codex`
- `Launch Claude`
- `Launch Ollama`
- `Launch Custom`

Each of those starts a tracked session through the UI and the session will appear in the sessions panel automatically.

## Manual Session Commands

Open a session:

```bash
python3 tools/register_ai_session.py open \
  --title "Auth fixes" \
  --provider Codex \
  --model GPT-5 \
  --terminal codex \
  --command codex \
  --cwd "$PWD"
```

Heartbeat an active session:

```bash
python3 tools/register_ai_session.py heartbeat --session-id <session-id>
```

Close a session:

```bash
python3 tools/register_ai_session.py close --session-id <session-id> --exit-code 0
```

List sessions:

```bash
python3 tools/register_ai_session.py list
```

## Wrapped Session Tracking

Use `wrap` when you want the tracker to manage the lifecycle automatically from terminal or scripts. The desktop UI launch buttons already use this flow behind the scenes.

Codex:

```bash
python3 tools/register_ai_session.py wrap \
  --title "Codex work" \
  --provider Codex \
  --model GPT-5 \
  --terminal codex \
  -- codex
```

Claude:

```bash
python3 tools/register_ai_session.py wrap \
  --title "Claude work" \
  --provider Claude \
  --model Sonnet \
  --terminal claude \
  -- claude
```

Ollama:

```bash
python3 tools/register_ai_session.py wrap \
  --title "Local planning" \
  --provider Ollama \
  --model mistral \
  --terminal "ollama run mistral" \
  -- ollama run mistral
```

## True Session Model

Tracked session fields include:

- explicit open time
- last heartbeat time
- explicit close time
- effective status (`active`, `stale`, `closed`)
- provider and model
- terminal and command
- working directory
- host name
- process id when available
- notes and exit code

The tracker marks an open session as `stale` if it has not heartbeated within 5 minutes.

## Practical Recommendation

If you want consistent cross-tool tracking, wrap each AI launcher with `register_ai_session.py wrap` instead of opening the AI command directly.
