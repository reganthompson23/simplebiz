-- Create schedule table with JSONB content
create table if not exists schedule (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references auth.users(id),
  content jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table schedule enable row level security;

-- Add RLS policies
create policy "Users can view own schedule entries"
  on schedule for select
  to public
  using (auth.uid() = profile_id);

create policy "Users can insert own schedule entries"
  on schedule for insert
  to public
  with check (auth.uid() = profile_id);

create policy "Users can delete own schedule entries"
  on schedule for delete
  to public
  using (auth.uid() = profile_id);

-- Add updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_schedule_updated_at
  before update on schedule
  for each row
  execute function update_updated_at_column(); 