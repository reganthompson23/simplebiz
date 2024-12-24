-- Drop existing trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Make contact_email nullable
alter table profiles alter column contact_email drop not null;

-- Recreate function with better error handling and logging
create or replace function public.handle_new_user() 
returns trigger as $$
declare
  profile_id uuid;
  base_subdomain text;
begin
  -- Log the start of profile creation
  raise log 'Starting profile creation for user %', new.id;
  
  -- Create profile with proper error handling
  begin
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
    
    raise log 'Profile created successfully for user %', new.id;
  exception when others then
    -- Log the error but don't fail silently
    raise log 'Error creating profile for user %: %', new.id, SQLERRM;
    raise exception 'Failed to create profile: %', SQLERRM;
  end;

  -- Generate base subdomain from business name or email
  base_subdomain := coalesce(
    nullif(new.raw_user_meta_data->>'business_name', ''),
    split_part(new.email, '@', 1)
  );

  -- Create initial website with proper error handling
  begin
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
    
    raise log 'Website created successfully for user %', new.id;
  exception when others then
    -- Log the error but don't fail silently
    raise log 'Error creating website for user %: %', new.id, SQLERRM;
    raise exception 'Failed to create website: %', SQLERRM;
  end;

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a function to fix missing profiles
create or replace function fix_missing_profiles()
returns void as $$
declare
  user_record record;
begin
  -- Find auth users without profiles
  for user_record in 
    select au.id, au.email, au.raw_user_meta_data
    from auth.users au
    left join profiles p on p.id = au.id
    where p.id is null
  loop
    -- Try to create missing profile
    begin
      insert into profiles (
        id,
        business_name,
        contact_email
      ) values (
        user_record.id,
        coalesce(user_record.raw_user_meta_data->>'business_name', ''),
        user_record.email
      );
      
      raise log 'Created missing profile for user %', user_record.id;
    exception when others then
      raise log 'Error creating missing profile for user %: %', user_record.id, SQLERRM;
      continue;
    end;
  end loop;
end;
$$ language plpgsql security definer;

-- Run the fix for existing users
select fix_missing_profiles(); 