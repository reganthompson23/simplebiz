-- Create schedule table
create table if not exists schedules (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references auth.users(id) not null,
  customer_name text not null,
  customer_address text not null,
  customer_phone text not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  job_description text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS (Row Level Security)
alter table schedules enable row level security;

-- Create policies
create policy "Users can view own schedule entries"
on schedules for select
using (profile_id = auth.uid());

create policy "Users can insert own schedule entries"
on schedules for insert
with check (profile_id = auth.uid());

create policy "Users can update own schedule entries"
on schedules for update
using (profile_id = auth.uid());

create policy "Users can delete own schedule entries"
on schedules for delete
using (profile_id = auth.uid());

-- Create updated_at trigger
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger schedule_updated_at
  before update on schedules
  for each row
  execute function handle_updated_at(); 