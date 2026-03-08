# Dream Build Drive

Dream Build Drive is a Next.js + Supabase app for managing car builds end to end. It combines project planning, parts tracking, task management, media uploads, specifications, analytics, search, and export flows in a single dashboard.

## Stack

- Next.js App Router
- React 18
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, Row Level Security, and Storage
- Vitest for unit tests

## Core Features

- Authenticated multi-project garage dashboard
- Parts tracking with category rollups and budget summaries
- Task management with table, kanban, calendar, and gantt views
- Media uploads backed by Supabase Storage
- Specifications and reusable spec templates
- Global search across project data
- CSV export and printable reports

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and fill in your Supabase values:

```bash
cp .env.example .env.local
```

Required variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. Apply the SQL migrations in `supabase/migrations` to your Supabase project in order:

- `00001_initial_schema.sql`
- `00002_tasks_and_search.sql`
- `00003_specs_and_templates.sql`
- `00004_harden_attachment_storage_policies.sql`

4. Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev`: start the app locally
- `npm run clean`: remove `.next` and `tsconfig.tsbuildinfo`
- `npm run build`: run a clean production build
- `npm run lint`: run Next.js ESLint checks
- `npm run typecheck`: run TypeScript without emitting
- `npm test`: run the Vitest suite
- `npm run check`: run lint, typecheck, and tests together

## Project Structure

- `src/app`: routes and layouts
- `src/actions`: server actions for mutations and fetch helpers
- `src/components`: UI and feature components
- `src/lib`: shared utilities, types, constants, and Supabase clients
- `src/__tests__`: unit tests
- `docs/roadmap.md`: formal product roadmap and phase plan
- `docs/roadmap-audit-checklist.md`: implementation audit of roadmap items vs repo state
- `docs/session-tracker.md`: usage guide for the desktop checklist and true AI session tracker
- `FUTURE.md`: deferred backlog outside the active phase
- `tools/desktop-checklist.html`: standalone desktop checklist app for planning/build sessions
- `tools/desktop_checklist.py`: native Python desktop checklist app with autosave, sessions, and nested items
- `tools/register_ai_session.py`: CLI helper to log Codex, Claude, Ollama, or other AI sessions into the desktop app store
- `supabase/migrations`: schema and policy migrations

## Data Model Overview

- `projects`: root entity for each build
- `categories`: project-specific grouping for parts and specs
- `parts`: cost and procurement tracking
- `attachments`: uploaded photos and documents
- `tasks`: work tracking with dates, priorities, and milestones
- `task_dependencies`: task blocking relationships
- `specifications`: project specs, optionally linked to a category or part
- `spec_templates`: reusable spec seeds

## Quality Gates

This repo now has a GitHub Actions workflow at `.github/workflows/ci.yml` that runs:

1. `npm ci`
2. `npm run check`
3. `npm run build`

Local changes should meet the same bar before merge.

## Deployment Notes

- The app expects Supabase Auth and Storage to be configured.
- The `attachments` storage bucket must exist.
- Auth callback routing uses `/auth/callback`.
- Production deploys should apply all migrations before shipping the app build.

## Deployment Checklist

1. Use Node.js 20.x in CI and hosting.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the hosting environment.
3. Apply every SQL migration in `supabase/migrations` before deploying the app.
4. Confirm the `attachments` bucket exists in Supabase Storage.
5. Add auth redirect URLs for both local and production:
   - `http://localhost:3000/auth/callback`
   - `https://your-production-domain/auth/callback`
6. Run `npm run check` and `npm run build` before release.
7. Deploy only after the production environment points at the migrated Supabase project.

## Current Stabilization Baseline

Part one of the stabilization pass focused on:

- deterministic builds
- aligned Next.js and ESLint versions
- CI coverage for lint, typecheck, tests, and production build
- stronger attachment storage policies
- first-pass mutation error handling in tasks, specs, media, and project settings

Further product completion work should build on that baseline rather than bypass it.
