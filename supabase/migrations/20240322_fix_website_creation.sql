-- Drop existing trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Create simplified user handler
create or replace function public.handle_new_user() 
returns trigger as $$
declare
  new_profile_id uuid;
  business_name text;
begin
  -- Set default business name
  business_name := coalesce(new.raw_user_meta_data->>'business_name', 'My Business');

  -- Create profile first
  insert into public.profiles (id, business_name, contact_email)
  values (new.id, business_name, new.email)
  returning id into new_profile_id;

  -- Immediately create website
  insert into public.websites (
    profile_id,
    subdomain,
    path,
    content,
    published
  ) values (
    new_profile_id,
    generate_unique_subdomain(business_name),  -- Use business name for subdomain
    generate_website_path(business_name),      -- Use business name for path
    jsonb_build_object(
      'businessName', business_name,
      'aboutUs', '',
      'services', array[''],
      'contactInfo', jsonb_build_object(
        'phone', '',
        'email', new.email,
        'address', ''
      ),
      'leadForm', jsonb_build_object(
        'enabled', true,
        'fields', jsonb_build_object(
          'name', true,
          'email', true,
          'phone', true,
          'message', true
        )
      ),
      'theme', jsonb_build_object(
        'primaryColor', '#2563eb',
        'secondaryColor', '#1e40af',
        'fontFamily', 'Inter',
        'topImage', '',
        'overlayOpacity', 80
      )
    ),
    true  -- Always published
  );

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Add a unique index on subdomain if it doesn't exist
drop index if exists websites_subdomain_key;
create unique index websites_subdomain_key on websites (subdomain);

-- Add a unique index on path if it doesn't exist
drop index if exists websites_path_key;
create unique index websites_path_key on websites (path); 