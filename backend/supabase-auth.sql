-- Public signup may create inspector or supervisor accounts only.
-- Administrator profiles must be provisioned by a trusted admin workflow.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'inspector');

  insert into public.profiles (
    id,
    full_name,
    role,
    region
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'NIRIKSHA Officer'),
    case
      when requested_role in ('inspector', 'supervisor') then requested_role
      else 'inspector'
    end,
    null
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();
