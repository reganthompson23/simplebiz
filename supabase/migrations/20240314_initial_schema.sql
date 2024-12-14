-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  business_name text not null,
  contact_email text not null,
  contact_phone text,
  address text,
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create websites table
create table websites (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  subdomain text unique not null,
  content jsonb not null default '{}',
  published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create leads table
create table leads (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  status text not null default 'new',
  notes text,
  source text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create invoices table
create table invoices (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  invoice_number text not null,
  client_name text not null,
  amount decimal(10,2) not null,
  status text not null default 'unpaid',
  due_date date,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create expenses table
create table expenses (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  amount decimal(10,2) not null,
  category text not null,
  description text,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create schedules table
create table schedules (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  customer_name text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table websites enable row level security;
alter table leads enable row level security;
alter table invoices enable row level security;
alter table expenses enable row level security;
alter table schedules enable row level security;

-- Create policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "Users can view own website" on websites for select using (profile_id = auth.uid());
create policy "Users can insert own website" on websites for insert with check (profile_id = auth.uid());
create policy "Users can update own website" on websites for update using (profile_id = auth.uid());
create policy "Users can delete own website" on websites for delete using (profile_id = auth.uid());

create policy "Users can view own leads" on leads for select using (profile_id = auth.uid());
create policy "Users can insert own leads" on leads for insert with check (profile_id = auth.uid());
create policy "Users can update own leads" on leads for update using (profile_id = auth.uid());
create policy "Users can delete own leads" on leads for delete using (profile_id = auth.uid());

create policy "Users can view own invoices" on invoices for select using (profile_id = auth.uid());
create policy "Users can insert own invoices" on invoices for insert with check (profile_id = auth.uid());
create policy "Users can update own invoices" on invoices for update using (profile_id = auth.uid());
create policy "Users can delete own invoices" on invoices for delete using (profile_id = auth.uid());

create policy "Users can view own expenses" on expenses for select using (profile_id = auth.uid());
create policy "Users can insert own expenses" on expenses for insert with check (profile_id = auth.uid());
create policy "Users can update own expenses" on expenses for update using (profile_id = auth.uid());
create policy "Users can delete own expenses" on expenses for delete using (profile_id = auth.uid());

create policy "Users can view own schedules" on schedules for select using (profile_id = auth.uid());
create policy "Users can insert own schedules" on schedules for insert with check (profile_id = auth.uid());
create policy "Users can update own schedules" on schedules for update using (profile_id = auth.uid());
create policy "Users can delete own schedules" on schedules for delete using (profile_id = auth.uid());

-- Create functions
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, business_name, contact_email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'business_name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 