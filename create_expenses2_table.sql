-- Create expenses2 table (exact copy of expenses structure)
create table if not exists expenses2 (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references auth.users(id) not null,
  amount numeric not null,
  category text not null,
  description text,
  date date not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table expenses2 enable row level security;

-- Create policies (same as expenses)
create policy "Users can view own expense2 entries"
on expenses2 for select
using (profile_id = auth.uid());

create policy "Users can insert own expense2 entries"
on expenses2 for insert
with check (profile_id = auth.uid());

create policy "Users can update own expense2 entries"
on expenses2 for update
using (profile_id = auth.uid());

create policy "Users can delete own expense2 entries"
on expenses2 for delete
using (profile_id = auth.uid());

-- Create updated_at trigger
create trigger expenses2_updated_at
  before update on expenses2
  for each row
  execute function handle_updated_at(); 