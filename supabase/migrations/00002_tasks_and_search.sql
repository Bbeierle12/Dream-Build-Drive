-- Dream Build Drive - v2: Tasks, Dependencies, and Search
-- Run this in the Supabase SQL Editor

-- ============================================================
-- TABLES
-- ============================================================

create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  part_id uuid references public.parts(id) on delete set null,
  title text not null,
  description text,
  status text default 'backlog' not null check (status in ('backlog','todo','in_progress','in_review','done')),
  priority text default 'medium' not null check (priority in ('low','medium','high','urgent')),
  start_date date,
  due_date date,
  is_milestone boolean default false not null,
  time_estimate_min integer,
  time_actual_min integer,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.task_dependencies (
  task_id uuid references public.tasks(id) on delete cascade not null,
  depends_on_task_id uuid references public.tasks(id) on delete cascade not null,
  primary key (task_id, depends_on_task_id),
  check (task_id <> depends_on_task_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_tasks_project_id on public.tasks(project_id);
create index idx_tasks_category_id on public.tasks(category_id);
create index idx_tasks_status on public.tasks(status);
create index idx_tasks_due_date on public.tasks(due_date);
create index idx_task_deps_depends_on on public.task_dependencies(depends_on_task_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.tasks enable row level security;
alter table public.task_dependencies enable row level security;

-- Tasks: access via project ownership
create policy "Users can view tasks of own projects"
  on public.tasks for select
  using (exists (
    select 1 from public.projects where projects.id = tasks.project_id and projects.user_id = auth.uid()
  ));

create policy "Users can insert tasks in own projects"
  on public.tasks for insert
  with check (exists (
    select 1 from public.projects where projects.id = tasks.project_id and projects.user_id = auth.uid()
  ));

create policy "Users can update tasks in own projects"
  on public.tasks for update
  using (exists (
    select 1 from public.projects where projects.id = tasks.project_id and projects.user_id = auth.uid()
  ));

create policy "Users can delete tasks in own projects"
  on public.tasks for delete
  using (exists (
    select 1 from public.projects where projects.id = tasks.project_id and projects.user_id = auth.uid()
  ));

-- Task Dependencies: access if user owns the task's project
create policy "Users can view dependencies of own tasks"
  on public.task_dependencies for select
  using (exists (
    select 1 from public.tasks
    join public.projects on projects.id = tasks.project_id
    where tasks.id = task_dependencies.task_id and projects.user_id = auth.uid()
  ));

create policy "Users can insert dependencies on own tasks"
  on public.task_dependencies for insert
  with check (exists (
    select 1 from public.tasks
    join public.projects on projects.id = tasks.project_id
    where tasks.id = task_dependencies.task_id and projects.user_id = auth.uid()
  ));

create policy "Users can delete dependencies on own tasks"
  on public.task_dependencies for delete
  using (exists (
    select 1 from public.tasks
    join public.projects on projects.id = tasks.project_id
    where tasks.id = task_dependencies.task_id and projects.user_id = auth.uid()
  ));

-- ============================================================
-- FULL-TEXT SEARCH: tsvector COLUMNS + GIN INDEXES
-- ============================================================

-- Parts: search on name, part_number, vendor, notes
alter table public.parts add column if not exists fts tsvector
  generated always as (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(part_number, '') || ' ' || coalesce(vendor, '') || ' ' || coalesce(notes, ''))
  ) stored;

create index idx_parts_fts on public.parts using gin(fts);

-- Categories: search on name
alter table public.categories add column if not exists fts tsvector
  generated always as (
    to_tsvector('english', coalesce(name, ''))
  ) stored;

create index idx_categories_fts on public.categories using gin(fts);

-- Tasks: search on title, description
alter table public.tasks add column if not exists fts tsvector
  generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored;

create index idx_tasks_fts on public.tasks using gin(fts);

-- Attachments: search on file_name
alter table public.attachments add column if not exists fts tsvector
  generated always as (
    to_tsvector('english', coalesce(file_name, ''))
  ) stored;

create index idx_attachments_fts on public.attachments using gin(fts);
