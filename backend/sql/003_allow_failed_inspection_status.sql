alter table public.inspections
  drop constraint if exists inspections_status_check;

alter table public.inspections
  add constraint inspections_status_check
  check (lower(status) in ('draft', 'processing', 'verified', 'completed', 'failed'));
