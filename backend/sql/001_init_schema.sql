-- NIRIKSHA initial schema
-- Run this migration in the Supabase SQL Editor or with `supabase db push`.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'Inspector'
    check (lower(role) in ('inspector', 'supervisor', 'admin')),
  region text,
  status text not null default 'Active'
    check (lower(status) in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  manufacturer text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  inspector_id uuid not null references public.profiles(id) on delete restrict,
  category text not null,
  manufacturer text not null,
  retailer_name text not null,
  location text not null,
  notes text,
  status text not null default 'Draft'
    check (lower(status) in ('draft', 'processing', 'verified', 'completed')),
  compliance_score numeric(5, 2)
    check (compliance_score is null or (compliance_score >= 0 and compliance_score <= 100)),
  compliance_status text
    check (
      compliance_status is null
      or lower(compliance_status) in ('compliant', 'minor violations', 'non-compliant')
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inspection_images (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  storage_path text not null,
  quality_check_passed boolean not null default false,
  quality_details jsonb not null default '{}'::jsonb,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.extracted_declarations (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  declaration_type text not null
    check (declaration_type in (
      'MRP',
      'Net Quantity',
      'Mfg Date',
      'Manufacturer',
      'Consumer Care',
      'Country of Origin'
    )),
  extracted_value text,
  normalized_value text,
  confidence_score numeric(5, 2)
    check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 100)),
  bounding_box jsonb not null default '{}'::jsonb,
  source text not null default 'ai'
    check (source in ('ai', 'human_corrected')),
  created_at timestamptz not null default now()
);

create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  rule_name text not null,
  declaration_type text not null,
  applicable_category text not null default 'All',
  validation_type text not null
    check (validation_type in (
      'Presence Check',
      'Format Check',
      'Value Range',
      'Font Size Threshold'
    )),
  threshold_value jsonb not null default '{}'::jsonb,
  severity text not null
    check (severity in ('High', 'Medium', 'Low')),
  legal_reference text not null,
  is_active boolean not null default true,
  version integer not null default 1 check (version > 0),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.rule_versions (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.rules(id) on delete cascade,
  version integer not null check (version > 0),
  snapshot jsonb not null,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now(),
  unique (rule_id, version)
);

create table if not exists public.violations (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  rule_id uuid references public.rules(id) on delete set null,
  declaration_type text not null,
  severity text not null
    check (severity in ('High', 'Medium', 'Low')),
  description text not null,
  evidence_image_path text,
  confidence_score numeric(5, 2)
    check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 100)),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  pdf_storage_path text not null,
  generated_at timestamptz not null default now()
);

create index if not exists idx_inspections_product_id
  on public.inspections(product_id);
create index if not exists idx_inspections_inspector_id
  on public.inspections(inspector_id);
create index if not exists idx_inspection_images_inspection_id
  on public.inspection_images(inspection_id);
create index if not exists idx_extracted_declarations_inspection_id
  on public.extracted_declarations(inspection_id);
create index if not exists idx_rules_created_by
  on public.rules(created_by);
create index if not exists idx_rule_versions_rule_id
  on public.rule_versions(rule_id);
create index if not exists idx_rule_versions_changed_by
  on public.rule_versions(changed_by);
create index if not exists idx_violations_inspection_id
  on public.violations(inspection_id);
create index if not exists idx_violations_rule_id
  on public.violations(rule_id);
create index if not exists idx_reports_inspection_id
  on public.reports(inspection_id);

-- Enable RLS + policies before production; backend uses the service-role key
-- which bypasses RLS, so RLS mainly protects any direct frontend-to-Supabase reads.
--
-- alter table public.profiles enable row level security;
-- alter table public.products enable row level security;
-- alter table public.inspections enable row level security;
-- alter table public.inspection_images enable row level security;
-- alter table public.extracted_declarations enable row level security;
-- alter table public.rules enable row level security;
-- alter table public.rule_versions enable row level security;
-- alter table public.violations enable row level security;
-- alter table public.reports enable row level security;
--
-- Example policy stubs (adapt to the final role and region model):
-- create policy "users can read own profile" on public.profiles
--   for select to authenticated using (id = auth.uid());
-- create policy "authenticated users can read products" on public.products
--   for select to authenticated using (true);
-- create policy "inspectors can read their inspections" on public.inspections
--   for select to authenticated using (inspector_id = auth.uid());
