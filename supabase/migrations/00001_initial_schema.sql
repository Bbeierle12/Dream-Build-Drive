-- Dream Build Drive - Initial Schema
-- Run this in the Supabase SQL Editor

-- ============================================================
-- TABLES
-- ============================================================

create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  year integer,
  make text,
  model text,
  trim text,
  vin text,
  color text,
  budget numeric(10,2),
  notes text,
  cover_image_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.categories (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  sort_order integer default 0 not null,
  created_at timestamptz default now() not null
);

create table public.parts (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references public.categories(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  part_number text,
  vendor text,
  vendor_url text,
  estimated_cost numeric(10,2),
  actual_cost numeric(10,2),
  status text default 'researching' not null check (status in ('researching','planned','ordered','shipped','received','installed')),
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.attachments (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  part_id uuid references public.parts(id) on delete set null,
  file_name text not null,
  file_type text not null,
  file_size integer not null,
  storage_path text not null,
  url text not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_projects_user_id on public.projects(user_id);
create index idx_categories_project_id on public.categories(project_id);
create index idx_parts_category_id on public.parts(category_id);
create index idx_parts_project_id on public.parts(project_id);
create index idx_attachments_project_id on public.attachments(project_id);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

create trigger set_parts_updated_at
  before update on public.parts
  for each row execute function public.handle_updated_at();

-- ============================================================
-- DEFAULT CATEGORIES ON PROJECT INSERT
-- ============================================================

create or replace function public.create_default_categories()
returns trigger as $$
declare
  categories text[] := array['Engine','Suspension','Brakes','Electrical','Interior','Exterior','Fuel','Cooling'];
  i integer;
begin
  for i in 1..array_length(categories, 1) loop
    insert into public.categories (project_id, name, sort_order)
    values (new.id, categories[i], i);
  end loop;
  return new;
end;
$$ language plpgsql;

create trigger create_default_categories_on_project
  after insert on public.projects
  for each row execute function public.create_default_categories();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.projects enable row level security;
alter table public.categories enable row level security;
alter table public.parts enable row level security;
alter table public.attachments enable row level security;

-- Projects: users can only access their own
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Categories: access via project ownership
create policy "Users can view categories of own projects"
  on public.categories for select
  using (exists (
    select 1 from public.projects where projects.id = categories.project_id and projects.user_id = auth.uid()
  ));

create policy "Users can insert categories in own projects"
  on public.categories for insert
  with check (exists (
    select 1 from public.projects where projects.id = categories.project_id and projects.user_id = auth.uid()
  ));

create policy "Users can update categories in own projects"
  on public.categories for update
  using (exists (
    select 1 from public.projects where projects.id = categories.project_id and projects.user_id = auth.uid()
  ));

create policy "Users can delete categories in own projects"
  on public.categories for delete
  using (exists (
    select 1 from public.projects where projects.id = categories.project_id and projects.user_id = auth.uid()
  ));

-- Parts: access via project ownership
create policy "Users can view parts of own projects"
  on public.parts for select
  using (exists (
    select 1 from public.projects where projects.id = parts.project_id and projects.user_id = auth.uid()
  ));

create policy "Users can insert parts in own projects"
  on public.parts for insert
  with check (exists (
    select 1 from public.projects where projects.id = parts.project_id and projects.user_id = auth.uid()
  ));

create policy "Users can update parts in own projects"
  on public.parts for update
  using (exists (
    select 1 from public.projects where projects.id = parts.project_id and projects.user_id = auth.uid()
  ));

create policy "Users can delete parts in own projects"
  on public.parts for delete
  using (exists (
    select 1 from public.projects where projects.id = parts.project_id and projects.user_id = auth.uid()
  ));

-- Attachments: access via project ownership
create policy "Users can view attachments of own projects"
  on public.attachments for select
  using (exists (
    select 1 from public.projects where projects.id = attachments.project_id and projects.user_id = auth.uid()
  ));

create policy "Users can insert attachments in own projects"
  on public.attachments for insert
  with check (exists (
    select 1 from public.projects where projects.id = attachments.project_id and projects.user_id = auth.uid()
  ));

create policy "Users can delete attachments in own projects"
  on public.attachments for delete
  using (exists (
    select 1 from public.projects where projects.id = attachments.project_id and projects.user_id = auth.uid()
  ));

-- ============================================================
-- STORAGE BUCKET
-- ============================================================

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

create policy "Users can upload to attachments bucket"
  on storage.objects for insert
  with check (bucket_id = 'attachments' and auth.role() = 'authenticated');

create policy "Anyone can view attachments"
  on storage.objects for select
  using (bucket_id = 'attachments');

create policy "Users can delete own attachments"
  on storage.objects for delete
  using (bucket_id = 'attachments' and auth.role() = 'authenticated');
