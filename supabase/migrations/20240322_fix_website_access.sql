-- Drop any existing RLS policies for websites
drop policy if exists "Websites are viewable by owner" on websites;
drop policy if exists "Websites are publicly viewable" on websites;

-- Enable RLS on websites table if not already enabled
alter table websites enable row level security;

-- Create policy for public read access to published websites
create policy "Websites are publicly viewable"
on websites
for select
to public
using (published = true);

-- Create policy for owner access (they can see unpublished too)
create policy "Websites are fully accessible by owner"
on websites
for all
to authenticated
using (profile_id = auth.uid());

-- Grant necessary permissions
grant usage on schema public to anon;
grant select on websites to anon;
grant select on profiles to anon;

-- Add policy for public access to profiles linked to published websites
drop policy if exists "Profiles are publicly viewable" on profiles;
create policy "Profiles are publicly viewable"
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