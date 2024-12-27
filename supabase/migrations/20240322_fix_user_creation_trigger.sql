-- Drop existing trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Create simplified user handler with better error handling
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  -- Wrap everything in an exception block
  begin
    -- Create profile
    insert into public.profiles (
      id,
      business_name,
      contact_email
    ) values (
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data->>'business_name'), ''), 'My Business'),
      new.email
    );

    -- Create website with safe values
    insert into public.websites (
      profile_id,
      subdomain,
      path,
      content,
      published
    ) values (
      new.id,
      lower(regexp_replace(coalesce(nullif(trim(new.raw_user_meta_data->>'business_name'), ''), 'my-business'), '[^a-zA-Z0-9]', '-', 'g')),
      lower(regexp_replace(coalesce(nullif(trim(new.raw_user_meta_data->>'business_name'), ''), 'my-business'), '[^a-zA-Z0-9]', '-', 'g')),
      jsonb_build_object(
        'businessName', coalesce(nullif(trim(new.raw_user_meta_data->>'business_name'), ''), 'My Business'),
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
      true
    );

    return new;
  exception when others then
    -- Log the error
    raise log 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
    return new;
  end;
end;
$$ language plpgsql security definer;

-- Create trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Make sure constraints exist
alter table websites drop constraint if exists websites_subdomain_key;
alter table websites drop constraint if exists websites_path_key;
alter table websites add constraint websites_subdomain_key unique (subdomain);
alter table websites add constraint websites_path_key unique (path); 