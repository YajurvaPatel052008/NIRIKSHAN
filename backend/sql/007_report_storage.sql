-- Private storage bucket for generated inspection PDF reports.
-- Run this in the Supabase SQL Editor before generating a report.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'inspection-reports',
  'inspection-reports',
  false,
  52428800,
  array['application/pdf']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- The backend uses SUPABASE_SERVICE_ROLE_KEY for uploads and signed URLs.
-- Keep this bucket private; reports are delivered through short-lived URLs.
