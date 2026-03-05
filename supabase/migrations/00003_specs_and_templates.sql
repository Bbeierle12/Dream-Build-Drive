-- Dream Build Drive - v3: Specifications & Spec Templates
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

create table public.specifications (
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

create table public.spec_templates (
  id uuid default gen_random_uuid() primary key,
  vehicle_platform text not null,
  spec_type text not null check (spec_type in ('torque', 'fluid', 'clearance', 'wire_gauge', 'pressure', 'custom')),
  category_name text not null,
  label text not null,
  default_value text not null,
  unit text,
  created_at timestamptz default now() not null
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_specs_project_id on public.specifications(project_id);
create index idx_specs_part_id on public.specifications(part_id);
create index idx_specs_category_id on public.specifications(category_id);
create index idx_specs_type on public.specifications(spec_type);
create index idx_spec_templates_platform on public.spec_templates(vehicle_platform);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create trigger set_specifications_updated_at
  before update on public.specifications
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.specifications enable row level security;

create policy "Users can view specs of own projects"
  on public.specifications for select
  using (exists (
    select 1 from public.projects where projects.id = specifications.project_id and projects.user_id = auth.uid()
  ));

create policy "Users can insert specs in own projects"
  on public.specifications for insert
  with check (exists (
    select 1 from public.projects where projects.id = specifications.project_id and projects.user_id = auth.uid()
  ));

create policy "Users can update specs in own projects"
  on public.specifications for update
  using (exists (
    select 1 from public.projects where projects.id = specifications.project_id and projects.user_id = auth.uid()
  ));

create policy "Users can delete specs in own projects"
  on public.specifications for delete
  using (exists (
    select 1 from public.projects where projects.id = specifications.project_id and projects.user_id = auth.uid()
  ));

-- Spec templates are read-only for all authenticated users
alter table public.spec_templates enable row level security;

create policy "Authenticated users can view spec templates"
  on public.spec_templates for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- FULL-TEXT SEARCH
-- ============================================================

alter table public.specifications add column if not exists fts tsvector
  generated always as (
    to_tsvector('english', coalesce(label, '') || ' ' || coalesce(value, '') || ' ' || coalesce(notes, ''))
  ) stored;

create index idx_specs_fts on public.specifications using gin(fts);

-- ============================================================
-- SEED: Common Spec Templates
-- ============================================================

insert into public.spec_templates (vehicle_platform, spec_type, category_name, label, default_value, unit) values
  -- Universal Engine specs
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
  -- Universal Suspension specs
  ('universal', 'torque', 'Suspension', 'Lug Nuts', '80-100', 'ft-lbs'),
  ('universal', 'torque', 'Suspension', 'Control Arm Bolts', '75-100', 'ft-lbs'),
  ('universal', 'torque', 'Suspension', 'Strut Mount Nuts', '30-40', 'ft-lbs'),
  ('universal', 'torque', 'Suspension', 'Sway Bar End Links', '35-50', 'ft-lbs'),
  ('universal', 'torque', 'Suspension', 'Tie Rod End Nuts', '35-50', 'ft-lbs'),
  ('universal', 'clearance', 'Suspension', 'Ride Height (Front)', 'varies', 'in'),
  ('universal', 'clearance', 'Suspension', 'Ride Height (Rear)', 'varies', 'in'),
  ('universal', 'pressure', 'Suspension', 'Tire Pressure (Front)', '32-35', 'psi'),
  ('universal', 'pressure', 'Suspension', 'Tire Pressure (Rear)', '32-35', 'psi'),
  -- Universal Brakes specs
  ('universal', 'torque', 'Brakes', 'Caliper Bracket Bolts', '75-100', 'ft-lbs'),
  ('universal', 'torque', 'Brakes', 'Caliper Slide Bolts', '25-35', 'ft-lbs'),
  ('universal', 'torque', 'Brakes', 'Brake Line Fittings', '10-15', 'ft-lbs'),
  ('universal', 'torque', 'Brakes', 'Bleeder Screws', '7-10', 'ft-lbs'),
  ('universal', 'fluid', 'Brakes', 'Brake Fluid Type', 'DOT 3/4', ''),
  ('universal', 'clearance', 'Brakes', 'Min Rotor Thickness (Front)', 'varies', 'mm'),
  ('universal', 'clearance', 'Brakes', 'Min Pad Thickness', '2-3', 'mm'),
  -- Universal Electrical specs
  ('universal', 'wire_gauge', 'Electrical', 'Battery Cable', '4-2', 'AWG'),
  ('universal', 'wire_gauge', 'Electrical', 'Headlight Circuit', '12-14', 'AWG'),
  ('universal', 'wire_gauge', 'Electrical', 'Tail/Signal Lights', '16-18', 'AWG'),
  ('universal', 'wire_gauge', 'Electrical', 'Fuel Pump Circuit', '12-14', 'AWG'),
  ('universal', 'wire_gauge', 'Electrical', 'General Accessories', '16-18', 'AWG'),
  ('universal', 'pressure', 'Electrical', 'Charging Voltage', '13.5-14.5', 'V'),
  -- Universal Fuel specs
  ('universal', 'pressure', 'Fuel', 'Fuel Pressure (Carbureted)', '4-7', 'psi'),
  ('universal', 'pressure', 'Fuel', 'Fuel Pressure (EFI)', '30-60', 'psi'),
  ('universal', 'fluid', 'Fuel', 'Fuel Tank Capacity', 'varies', 'gallons'),
  -- Universal Cooling specs
  ('universal', 'pressure', 'Cooling', 'Radiator Cap Pressure', '13-16', 'psi'),
  ('universal', 'fluid', 'Cooling', 'Coolant Type', '50/50 mix', ''),
  ('universal', 'torque', 'Cooling', 'Thermostat Housing Bolts', '15-20', 'ft-lbs'),
  ('universal', 'torque', 'Cooling', 'Water Pump Bolts', '15-22', 'ft-lbs');
