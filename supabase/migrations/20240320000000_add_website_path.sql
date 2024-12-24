-- Add path column to websites table
alter table websites add column if not exists path text;

-- Create a function to generate path from business name
create or replace function generate_website_path(business_name text)
returns text as $$
begin
  return regexp_replace(
    regexp_replace(
      regexp_replace(
        lower(coalesce(business_name, '')),
        '[^a-z0-9-]', '-', 'g'
      ),
      '-+', '-', 'g'
    ),
    '^-|-$', '', 'g'
  );
end;
$$ language plpgsql;

-- Update existing websites with paths based on business names
update websites
set path = generate_website_path(content->>'businessName')
where path is null;

-- Add unique constraint to path
alter table websites add constraint websites_path_key unique (path);

-- Create an index for faster lookups
create index if not exists websites_path_idx on websites (path);

-- Add trigger to update path when business name changes
create or replace function update_website_path()
returns trigger as $$
begin
  if (new.content->>'businessName' is distinct from old.content->>'businessName') then
    new.path := generate_website_path(new.content->>'businessName');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger website_path_update
  before update on websites
  for each row
  execute function update_website_path(); 