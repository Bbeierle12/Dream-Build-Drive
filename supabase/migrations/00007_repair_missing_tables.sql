-- Repair: migrations 00002 and 00003 were recorded but never applied.
-- This re-creates the missing tables, indexes, triggers, RLS, and FTS columns.

-- ============================================================
-- TASKS TABLE
-- ============================================================

create table if not exists public.tasks (
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

create table if not exists public.task_dependencies (
  task_id uuid references public.tasks(id) on delete cascade not null,
  depends_on_task_id uuid references public.tasks(id) on delete cascade not null,
  primary key (task_id, depends_on_task_id),
  check (task_id <> depends_on_task_id)
);

-- Indexes (IF NOT EXISTS not supported for indexes before PG 14, use DO block)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_project_id') THEN
    CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_category_id') THEN
    CREATE INDEX idx_tasks_category_id ON public.tasks(category_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_status') THEN
    CREATE INDEX idx_tasks_status ON public.tasks(status);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_due_date') THEN
    CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_task_deps_depends_on') THEN
    CREATE INDEX idx_task_deps_depends_on ON public.task_dependencies(depends_on_task_id);
  END IF;
END $$;

-- Trigger
DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view tasks of own projects') THEN
    CREATE POLICY "Users can view tasks of own projects" ON public.tasks FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert tasks in own projects') THEN
    CREATE POLICY "Users can insert tasks in own projects" ON public.tasks FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update tasks in own projects') THEN
    CREATE POLICY "Users can update tasks in own projects" ON public.tasks FOR UPDATE
      USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete tasks in own projects') THEN
    CREATE POLICY "Users can delete tasks in own projects" ON public.tasks FOR DELETE
      USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view dependencies of own tasks') THEN
    CREATE POLICY "Users can view dependencies of own tasks" ON public.task_dependencies FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.tasks JOIN public.projects ON projects.id = tasks.project_id WHERE tasks.id = task_dependencies.task_id AND projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert dependencies on own tasks') THEN
    CREATE POLICY "Users can insert dependencies on own tasks" ON public.task_dependencies FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM public.tasks JOIN public.projects ON projects.id = tasks.project_id WHERE tasks.id = task_dependencies.task_id AND projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete dependencies on own tasks') THEN
    CREATE POLICY "Users can delete dependencies on own tasks" ON public.task_dependencies FOR DELETE
      USING (EXISTS (SELECT 1 FROM public.tasks JOIN public.projects ON projects.id = tasks.project_id WHERE tasks.id = task_dependencies.task_id AND projects.user_id = auth.uid()));
  END IF;
END $$;

-- ============================================================
-- SPECIFICATIONS TABLE
-- ============================================================

create table if not exists public.specifications (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  part_id uuid references public.parts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  spec_type text not null check (spec_type in ('torque', 'fluid', 'clearance', 'wire_gauge', 'pressure', 'custom')),
  label text not null,
  value text not null,
  unit text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.spec_templates (
  id uuid default gen_random_uuid() primary key,
  vehicle_platform text not null,
  spec_type text not null check (spec_type in ('torque', 'fluid', 'clearance', 'wire_gauge', 'pressure', 'custom')),
  category_name text not null,
  label text not null,
  default_value text not null,
  unit text,
  created_at timestamptz default now() not null
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_specs_project_id') THEN
    CREATE INDEX idx_specs_project_id ON public.specifications(project_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_specs_part_id') THEN
    CREATE INDEX idx_specs_part_id ON public.specifications(part_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_specs_category_id') THEN
    CREATE INDEX idx_specs_category_id ON public.specifications(category_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_specs_type') THEN
    CREATE INDEX idx_specs_type ON public.specifications(spec_type);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_spec_templates_platform') THEN
    CREATE INDEX idx_spec_templates_platform ON public.spec_templates(vehicle_platform);
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_specifications_updated_at ON public.specifications;
CREATE TRIGGER set_specifications_updated_at
  BEFORE UPDATE ON public.specifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spec_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view specs of own projects') THEN
    CREATE POLICY "Users can view specs of own projects" ON public.specifications FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = specifications.project_id AND projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert specs in own projects') THEN
    CREATE POLICY "Users can insert specs in own projects" ON public.specifications FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = specifications.project_id AND projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update specs in own projects') THEN
    CREATE POLICY "Users can update specs in own projects" ON public.specifications FOR UPDATE
      USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = specifications.project_id AND projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete specs in own projects') THEN
    CREATE POLICY "Users can delete specs in own projects" ON public.specifications FOR DELETE
      USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = specifications.project_id AND projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view spec templates') THEN
    CREATE POLICY "Authenticated users can view spec templates" ON public.spec_templates FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================================
-- FULL-TEXT SEARCH COLUMNS
-- ============================================================

ALTER TABLE public.parts ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(part_number, '') || ' ' || coalesce(vendor, '') || ' ' || coalesce(notes, ''))
  ) STORED;

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, ''))
  ) STORED;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED;

ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(file_name, '') || ' ' || coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED;

ALTER TABLE public.specifications ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(label, '') || ' ' || coalesce(value, '') || ' ' || coalesce(notes, ''))
  ) STORED;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_parts_fts') THEN
    CREATE INDEX idx_parts_fts ON public.parts USING gin(fts);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_categories_fts') THEN
    CREATE INDEX idx_categories_fts ON public.categories USING gin(fts);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_fts') THEN
    CREATE INDEX idx_tasks_fts ON public.tasks USING gin(fts);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_attachments_fts') THEN
    CREATE INDEX idx_attachments_fts ON public.attachments USING gin(fts);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_specs_fts') THEN
    CREATE INDEX idx_specs_fts ON public.specifications USING gin(fts);
  END IF;
END $$;

-- ============================================================
-- SEED: Spec Templates (skip if already populated)
-- ============================================================

INSERT INTO public.spec_templates (vehicle_platform, spec_type, category_name, label, default_value, unit)
SELECT * FROM (VALUES
  ('universal', 'torque', 'Engine', 'Spark Plugs', '15-25', 'ft-lbs'),
  ('universal', 'torque', 'Engine', 'Valve Cover Bolts', '7-10', 'ft-lbs'),
  ('universal', 'torque', 'Engine', 'Intake Manifold Bolts', '15-25', 'ft-lbs'),
  ('universal', 'torque', 'Engine', 'Exhaust Manifold Bolts', '20-30', 'ft-lbs'),
  ('universal', 'torque', 'Engine', 'Oil Drain Plug', '25-35', 'ft-lbs'),
  ('universal', 'torque', 'Engine', 'Oil Filter', '15-20', 'ft-lbs'),
  ('universal', 'torque', 'Engine', 'Timing Cover Bolts', '15-22', 'ft-lbs'),
  ('universal', 'fluid', 'Engine', 'Engine Oil Capacity', '4-6', 'quarts'),
  ('universal', 'fluid', 'Engine', 'Coolant Capacity', '10-16', 'quarts'),
  ('universal', 'clearance', 'Engine', 'Spark Plug Gap', '0.028-0.035', 'in'),
  ('universal', 'clearance', 'Engine', 'Valve Lash (Intake)', '0.006-0.010', 'in'),
  ('universal', 'clearance', 'Engine', 'Valve Lash (Exhaust)', '0.010-0.014', 'in'),
  ('universal', 'torque', 'Suspension', 'Lug Nuts', '80-100', 'ft-lbs'),
  ('universal', 'torque', 'Suspension', 'Control Arm Bolts', '75-100', 'ft-lbs'),
  ('universal', 'torque', 'Suspension', 'Strut Mount Nuts', '30-40', 'ft-lbs'),
  ('universal', 'torque', 'Suspension', 'Sway Bar End Links', '35-50', 'ft-lbs'),
  ('universal', 'torque', 'Suspension', 'Tie Rod End Nuts', '35-50', 'ft-lbs'),
  ('universal', 'clearance', 'Suspension', 'Ride Height (Front)', 'varies', 'in'),
  ('universal', 'clearance', 'Suspension', 'Ride Height (Rear)', 'varies', 'in'),
  ('universal', 'pressure', 'Suspension', 'Tire Pressure (Front)', '32-35', 'psi'),
  ('universal', 'pressure', 'Suspension', 'Tire Pressure (Rear)', '32-35', 'psi'),
  ('universal', 'torque', 'Brakes', 'Caliper Bracket Bolts', '75-100', 'ft-lbs'),
  ('universal', 'torque', 'Brakes', 'Caliper Slide Bolts', '25-35', 'ft-lbs'),
  ('universal', 'torque', 'Brakes', 'Brake Line Fittings', '10-15', 'ft-lbs'),
  ('universal', 'torque', 'Brakes', 'Bleeder Screws', '7-10', 'ft-lbs'),
  ('universal', 'fluid', 'Brakes', 'Brake Fluid Type', 'DOT 3/4', ''),
  ('universal', 'clearance', 'Brakes', 'Min Rotor Thickness (Front)', 'varies', 'mm'),
  ('universal', 'clearance', 'Brakes', 'Min Pad Thickness', '2-3', 'mm'),
  ('universal', 'wire_gauge', 'Electrical', 'Battery Cable', '4-2', 'AWG'),
  ('universal', 'wire_gauge', 'Electrical', 'Headlight Circuit', '12-14', 'AWG'),
  ('universal', 'wire_gauge', 'Electrical', 'Tail/Signal Lights', '16-18', 'AWG'),
  ('universal', 'wire_gauge', 'Electrical', 'Fuel Pump Circuit', '12-14', 'AWG'),
  ('universal', 'wire_gauge', 'Electrical', 'General Accessories', '16-18', 'AWG'),
  ('universal', 'pressure', 'Electrical', 'Charging Voltage', '13.5-14.5', 'V'),
  ('universal', 'pressure', 'Fuel', 'Fuel Pressure (Carbureted)', '4-7', 'psi'),
  ('universal', 'pressure', 'Fuel', 'Fuel Pressure (EFI)', '30-60', 'psi'),
  ('universal', 'fluid', 'Fuel', 'Fuel Tank Capacity', 'varies', 'gallons'),
  ('universal', 'pressure', 'Cooling', 'Radiator Cap Pressure', '13-16', 'psi'),
  ('universal', 'fluid', 'Cooling', 'Coolant Type', '50/50 mix', ''),
  ('universal', 'torque', 'Cooling', 'Thermostat Housing Bolts', '15-20', 'ft-lbs'),
  ('universal', 'torque', 'Cooling', 'Water Pump Bolts', '15-22', 'ft-lbs')
) AS t(vehicle_platform, spec_type, category_name, label, default_value, unit)
WHERE NOT EXISTS (SELECT 1 FROM public.spec_templates LIMIT 1);
