# Dream Build Drive Roadmap

Imported into the project workspace on March 8, 2026 from the external planning document `DreamBuildDrive-Full-Roadmap.docx`.

## Product Summary

Dream Build Drive is an automotive build project management platform for tracking parts, costs, tasks, and documentation across vehicle restoration and modification projects.

Vision: the single place a builder opens to plan, track, and document every aspect of a vehicle build, from the first part ordered to the final test drive.

Current state as of March 2026:

- MVP shipped and deployed
- refinement work in progress
- v2 planning complete

## Delivery Rules

Each phase follows the same delivery discipline:

- 3-feature gate: no release phase may contain more than 3 core features
- walking skeleton first: deploy a shell before adding feature depth
- fixed time, variable scope
- circuit breaker: if a phase misses its deadline, stop and reassess
- feature promotion gate: anything moved from [FUTURE.md](/home/bbeierle12/Dream%20Build%20Drive/Dream-Build-Drive/FUTURE.md) requires the current phase to be deployed and tested by a real user first

Enforced stack:

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase
- Vercel
- Zustand for state
- Recharts for charts
- `@dnd-kit` for drag-and-drop

## Phase Overview

| Phase | Features | Appetite | Deadline | Status |
| --- | --- | --- | --- | --- |
| v1 | Projects, Parts and Costs, Media | 2 weeks | March 3, 2026 | Shipped |
| v2 | Tasks and Kanban, Calendar, Search | 2 weeks | March 17, 2026 | Active |
| v3 | Specifications, Cost Analytics, Gantt | 3 weeks | TBD | Planned |
| v4+ | Collaboration, Notifications, Mobile, OBD-II | TBD | TBD | Future |

## Phase 1: MVP

Appetite: 2 weeks
Deadline: March 3, 2026
Status: shipped and deployed

Problem:
Vehicle builders usually split work across spreadsheets, notes apps, bookmarks, and photo folders. The MVP proves the core hierarchy works: projects contain categories, categories contain parts, and media attaches to any level.

Shipped features:

- Projects and categories
  - Create build projects such as a `1972 Chevelle SS`
  - Support customizable category breakdowns such as engine, suspension, and interior
  - Provide project-level rollup views
- Parts and cost tracking
  - Track estimated and actual costs
  - Roll up spend by category and project
  - Track part lifecycle such as ordered, received, and installed
  - Store part number, vendor, and notes
- Photo and document uploads
  - Attach media to projects, categories, or parts
  - Use Supabase Storage for hosting
  - Provide gallery and document metadata support

Core data model:

- `projects`: id, name, description, vehicle_year, vehicle_make, vehicle_model, status, created_at
- `categories`: id, project_id, name, sort_order
- `parts`: id, category_id, name, part_number, vendor, status, cost_estimated, cost_actual, notes
- `media`: id, project_id/category_id/part_id, file_url, file_type, title, description

Walking skeleton definition:

- Next.js app deployed to Vercel
- Supabase connected
- empty project list page deployable and reachable
- CI/CD operating via Vercel Git integration

## Phase 2: Task Management and Discoverability

Appetite: 2 weeks
Deadline: March 17, 2026
Status: active
Circuit breaker: reassess if the deadline slips

Problem:
The MVP tracks what a builder has bought but not what they need to do. Users need task planning, blocked-work visibility, and fast search as project data grows.

Active features:

- Task system and Kanban
  - Tasks linked to projects, categories, and optionally parts
  - Status flow: `backlog -> todo -> in_progress -> in_review -> done`
  - Drag-and-drop Kanban board
  - Priority pills, category badges, time estimates, and blocker warnings
- Calendar view
  - Monthly and weekly views
  - Date-range rendering
  - Milestone markers
  - Color coding by priority or category
  - Dependency visualization can degrade gracefully if needed
- Search and filter
  - Persistent search bar in top nav
  - Full-text search across parts, tasks, documents, and categories
  - Group results by entity type
  - Table sorting and filtering

Phase 2 data model additions:

- `tasks`: id, project_id, category_id, part_id, title, description, status, priority, start_date, due_date, is_milestone, time_estimate_min, time_actual_min, created_at, updated_at
- `task_dependencies`: task_id, depends_on_task_id
- `tsvector` search columns on parts, categories, tasks, and media
- GIN indexes for search performance

Planned build order:

1. Tasks schema and CRUD
2. Kanban board
3. Task dependencies and blocker warnings
4. Calendar view
5. Search infrastructure
6. Search UI

Known rabbit holes to avoid:

- Keep drag-and-drop to flat columns
- Avoid a heavy calendar dependency if a simple grid works
- Use simple DFS cycle detection for dependencies
- Use native PostgreSQL ranking before inventing custom search relevance

Success criteria:

- Users can create tasks linked to parts or categories
- users can move tasks across Kanban columns
- tasks render on a calendar
- searching `brake` returns relevant parts, tasks, and documents in under 500 ms
- MVP functionality remains intact

## Phase 3: Specifications and Analytics

Appetite: 3 weeks
Deadline: TBD after v2 ships and is tested
Status: planned

Problem:
Builders constantly reference torque specs, fluid capacities, wire gauges, and clearances during work. Cost visibility also becomes weak as projects expand.

Planned features:

- Specification database
  - Track torque specs, fluid capacities, clearances, wire gauges, and custom specs
  - Link specs to parts and categories
  - Provide quick lookup during task work
  - Support templates for common platforms
- Advanced cost analytics
  - Spend-by-category chart
  - Monthly burn-rate chart
  - Projected versus actual comparison
  - Project and cross-project views
- Gantt chart view
  - Timeline scheduling
  - Dependency arrows
  - Critical path highlighting
  - Drag-to-reschedule tasks

Anticipated data model additions:

- `specifications`: id, part_id, category_id, spec_type, label, value, unit, notes
- `spec_templates`: id, vehicle_platform, spec_type, label, default_value, unit

Decisions deferred to v3 kickoff:

- Gantt library choice
- spec template data sourcing
- exact analytics scope for v3 versus later polish

## Phase 4 and Beyond

Longer-term work is tracked in [FUTURE.md](/home/bbeierle12/Dream%20Build%20Drive/Dream-Build-Drive/FUTURE.md). None of those items are commitments until promoted into an active 3-feature phase.

## Open Research Questions

- Does offline-first meaningfully help the garage-floor use case?
- Is there a lightweight vehicle database API for part numbers and torque specs?
- Could AI provide useful cost estimation from historical project data?
- What is the migration path from a single-user shared schema to multi-tenant collaboration?
- How do competing automotive project trackers handle specifications?

## Technical Architecture

| Layer | Technology | Notes |
| --- | --- | --- |
| Frontend | Next.js 14 and TypeScript | App Router, server components where appropriate |
| Styling | Tailwind CSS | Dark automotive theme with red accent |
| Typography | DM Mono and Space Grotesk | Mono for data, grotesk for UI |
| State | Zustand | Stores in `src/stores/` |
| Charts | Recharts | Analytics and timeline visuals |
| Drag and drop | `@dnd-kit` | Kanban |
| Database | Supabase PostgreSQL | Via Vercel Marketplace integration |
| Auth | Supabase Auth | Single-user for now, expandable later |
| Storage | Supabase Storage | Photos and documents |
| Search | PostgreSQL `tsvector` and GIN | Native full-text search |
| Deployment | Vercel | Git-based CI/CD |
| Testing | Vitest and React Testing Library | Test-first expectation |

Preferred file structure:

- `src/components/`: one component per file, max 300 lines target
- `src/stores/`: Zustand stores
- `src/hooks/`: custom React hooks
- `src/utils/`: pure utilities
- `src/config/`: config objects, not magic numbers
- `src/types/`: type definitions
- `src/app/api/`: API routes

Cumulative schema through v3:

- `projects -> categories -> parts -> media`
- `tasks + task_dependencies`
- `specifications + spec_templates`

## Guardrails

These rules apply to every phase:

- planning is not building: cap planning before implementation starts
- scope stays small: 3-feature limit per phase
- test first: create tests before implementation
- fail loud: validate inputs and return explicit errors
- no monoliths: 300-line warning, 500-line hard limit per file
- no magic numbers: move numeric values into config
- config-driven behavior over hard-coded logic
- docs change with code in the same commit
- use the circuit breaker instead of silently extending scope or timelines
