-- Normalize legacy administrator role values to the backend's canonical role.
-- Run this in the Supabase SQL Editor for existing profiles.

update public.profiles
set role = 'Admin'
where lower(role) in ('administrator', 'admin');
