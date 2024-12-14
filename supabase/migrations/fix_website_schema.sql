-- Drop existing policies
drop policy if exists "Users can view own website" on websites;
drop policy if exists "Users can insert own website" on websites;
drop policy if exists "Users can update own website" on websites;
drop policy if exists "Users can delete own website" on websites;

-- Fix RLS policies for websites table
create policy "Users can view own website" 
  on websites 
  for select 
  using (profile_id in (select id from profiles where auth.uid() = profiles.id));

create policy "Users can insert own website" 
  on websites 
  for insert 
  with check (profile_id in (select id from profiles where auth.uid() = profiles.id));

create policy "Users can update own website" 
  on websites 
  for update 
  using (profile_id in (select id from profiles where auth.uid() = profiles.id));

create policy "Users can delete own website" 
  on websites 
  for delete 
  using (profile_id in (select id from profiles where auth.uid() = profiles.id));

-- Drop existing trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Create a function to generate a unique subdomain
create or replace function generate_unique_subdomain(base_name text)
returns text as $$
declare
  result_subdomain text;
  counter integer := 0;
begin
  -- Clean the base name
  result_subdomain := lower(regexp_replace(coalesce(base_name, ''), '[^a-zA-Z0-9]', '', 'g'));
  
  -- If empty, use 'site' as base
  if result_subdomain = '' then
    result_subdomain := 'site';
  end if;
  
  -- Try the base name first
  if not exists (select 1 from websites where websites.subdomain = result_subdomain) then
    return result_subdomain;
  end if;
  
  -- Add numbers until we find a unique subdomain
  while exists (select 1 from websites where websites.subdomain = (result_subdomain || counter::text)) loop
    counter := counter + 1;
  end loop;
  
  return result_subdomain || counter::text;
end;
$$ language plpgsql;

-- Create updated function to handle new users
create or replace function public.handle_new_user() 
returns trigger as $$
declare
  profile_id uuid;
  base_subdomain text;
begin
  -- Create profile
  insert into public.profiles (
    id,
    business_name,
    contact_email
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'business_name', ''),
    new.email
  )
  returning id into profile_id;

  -- Generate base subdomain from business name or email
  base_subdomain := coalesce(
    nullif(new.raw_user_meta_data->>'business_name', ''),
    split_part(new.email, '@', 1)
  );

  -- Create initial website
  insert into public.websites (
    profile_id,
    subdomain,
    content,
    published
  ) values (
    profile_id,
    generate_unique_subdomain(base_subdomain),
    '{
      "businessName": "",
      "aboutUs": "",
      "services": [""],
      "contactInfo": {
        "phone": "",
        "email": "",
        "address": ""
      },
      "leadForm": {
        "enabled": true,
        "fields": {
          "name": true,
          "email": true,
          "phone": true,
          "message": true
        }
      },
      "theme": {
        "primaryColor": "#2563eb",
        "secondaryColor": "#1e40af",
        "fontFamily": "Inter"
      }
    }'::jsonb,
    false
  );

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create initial websites for existing users
do $$
declare
  profile_record record;
  base_subdomain text;
begin
  for profile_record in select * from profiles where not exists (select 1 from websites where websites.profile_id = profiles.id) loop
    -- Generate base subdomain from business name or a default
    base_subdomain := coalesce(nullif(profile_record.business_name, ''), 'site');

    insert into websites (
      profile_id,
      subdomain,
      content,
      published
    ) values (
      profile_record.id,
      generate_unique_subdomain(base_subdomain),
      '{
        "businessName": "",
        "aboutUs": "",
        "services": [""],
        "contactInfo": {
          "phone": "",
          "email": "",
          "address": ""
        },
        "leadForm": {
          "enabled": true,
          "fields": {
            "name": true,
            "email": true,
            "phone": true,
            "message": true
          }
        },
        "theme": {
          "primaryColor": "#2563eb",
          "secondaryColor": "#1e40af",
          "fontFamily": "Inter"
        }
      }'::jsonb,
      false
    );
  end loop;
end;
$$; 