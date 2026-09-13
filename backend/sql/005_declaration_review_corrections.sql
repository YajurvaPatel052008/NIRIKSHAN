-- Keep a review trail for terminology variants found during human verification.
-- This supports maintaining declaration_terms.py from real pilot labels.

create table if not exists public.declaration_review_corrections (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  declaration_id uuid references public.extracted_declarations(id) on delete set null,
  declaration_type text not null,
  original_ocr_text text not null,
  corrected_value text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_declaration_review_corrections_type
  on public.declaration_review_corrections(declaration_type);
create index if not exists idx_declaration_review_corrections_inspection
  on public.declaration_review_corrections(inspection_id);
