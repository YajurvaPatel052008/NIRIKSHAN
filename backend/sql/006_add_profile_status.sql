-- Add account status enforcement support to existing deployments.
-- Run this in the Supabase SQL Editor before using deactivate/reactivate.

alter table public.profiles
  add column if not exists status text not null default 'Active';

update public.profiles
set status = 'Active'
where status is null;

alter table public.profiles
  drop constraint if exists profiles_status_check;

alter table public.profiles
  add constraint profiles_status_check
  check (lower(status) in ('active', 'inactive'));
