-- Drop existing trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Recreate function with better error handling
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, business_name, contact_email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'business_name', new.email),
    new.email
  );
  return new;
exception when others then
  raise log 'Error in handle_new_user: %', SQLERRM;
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Drop existing policies
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;

-- Create new policies
create policy "Users can view own profile" 
  on profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on profiles for update 
  using (auth.uid() = id);

create policy "Enable insert for authenticated users only" 
  on profiles for insert 
  with check (auth.uid() = id);

-- Make business_name nullable
alter table profiles
  alter column business_name drop not null;