-- Drop existing trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Recreate function with auto-publishing and path generation
create or replace function public.handle_new_user() 
returns trigger as $$
declare
  profile_id uuid;
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

    -- Only try to create website if profile creation succeeded
    declare
      base_subdomain text;
      business_name text;
    begin
      business_name := coalesce(new.raw_user_meta_data->>'business_name', 'My Business');
      base_subdomain := coalesce(
        nullif(new.raw_user_meta_data->>'business_name', ''),
        split_part(new.email, '@', 1)
      );

      insert into public.websites (
        profile_id,
        subdomain,
        path,
        content,
        published
      ) values (
        profile_id,
        generate_unique_subdomain(base_subdomain),
        generate_website_path(business_name),
        '{
          "businessName": "' || business_name || '",
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
            "fontFamily": "Inter",
            "topImage": "",
            "overlayOpacity": 80
          }
        }'::jsonb,
        true  -- Set published to true by default
      );
      
      raise log 'Website created successfully for user %', new.id;
    exception when others then
      -- Log website creation error but don't fail the whole process
      raise log 'Error creating website for user %: %', new.id, SQLERRM;
    end;

    return new;
  exception when others then
    -- Log the error and re-raise it
    raise log 'Error creating profile for user %: %', new.id, SQLERRM;
    raise;
  end;
end;
$$ language plpgsql security definer;

-- Create trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Fix any existing unpublished websites
update websites 
set published = true 
where published = false; 