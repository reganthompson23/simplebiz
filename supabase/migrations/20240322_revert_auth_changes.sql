-- Disable RLS temporarily to restore functionality
alter table profiles disable row level security;
alter table websites disable row level security;

-- Drop all the policies we added that might be causing issues
drop policy if exists "Profiles are publicly viewable" on profiles;
drop policy if exists "Profiles are viewable by owner" on profiles;
drop policy if exists "Profiles are publicly viewable for published websites" on profiles;
drop policy if exists "Websites are publicly viewable" on websites;
drop policy if exists "Websites are fully accessible by owner" on websites;
drop policy if exists "Websites are publicly viewable when published" on websites;

-- Restore basic permissions
grant usage on schema public to anon, authenticated;
grant all on profiles to authenticated;
grant all on websites to authenticated;
grant select on profiles to anon;
grant select on websites to anon; 