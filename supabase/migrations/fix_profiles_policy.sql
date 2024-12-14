-- Drop existing policies
drop policy if exists "Users can insert own profile" on profiles;

-- Create new policy that allows users to insert their own profile
create policy "Users can insert own profile"
on profiles for insert
with check (auth.uid() = id);

-- Also ensure users can create their initial profile
alter table profiles
alter column business_name drop not null; 