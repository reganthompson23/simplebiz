-- Fix profiles access
drop policy if exists "Profiles are publicly viewable" on profiles;
drop policy if exists "Profiles are viewable by owner" on profiles;

-- Enable RLS on profiles
alter table profiles enable row level security;

-- Create policies for profiles
create policy "Profiles are viewable by owner"
on profiles
for all
to authenticated
using (id = auth.uid());

create policy "Profiles are publicly viewable for published websites"
on profiles
for select
to public
using (
  exists (
    select 1 
    from websites 
    where websites.profile_id = profiles.id 
    and websites.published = true
  )
);

-- Fix websites access
drop policy if exists "Websites are publicly viewable" on websites;
drop policy if exists "Websites are fully accessible by owner" on websites;

-- Enable RLS on websites
alter table websites enable row level security;

-- Create policies for websites
create policy "Websites are fully accessible by owner"
on websites
for all
to authenticated
using (profile_id = auth.uid());

create policy "Websites are publicly viewable when published"
on websites
for select
to public
using (published = true);

-- Ensure proper permissions
grant usage on schema public to anon, authenticated;
grant select on websites to anon, authenticated;
grant select on profiles to anon, authenticated;
grant all on websites to authenticated;
grant all on profiles to authenticated; 