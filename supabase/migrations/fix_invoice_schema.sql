-- Drop existing invoice items table first (due to foreign key constraint)
drop table if exists invoice_items;

-- Drop and recreate invoices table
drop table if exists invoices;

create table invoices (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  invoice_number text not null,
  from_details jsonb default '{}',
  to_details jsonb default '{}',
  payment_terms text,
  issue_date date default current_date,
  due_date date,
  subtotal decimal(10,2) default 0,
  discount_type text check (discount_type in ('percentage', 'fixed')),
  discount_value decimal(10,2),
  tax_rate decimal(5,2) default 10.00,
  total decimal(10,2) default 0,
  notes text,
  terms text,
  status text default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  -- Ensure invoice numbers are unique per company
  unique(profile_id, invoice_number)
);

-- Recreate invoice items table
create table invoice_items (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references invoices(id) on delete cascade not null,
  description text,
  quantity decimal(10,2) default 1,
  unit_price decimal(10,2) default 0,
  amount decimal(10,2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Add RLS policies
alter table invoices enable row level security;
alter table invoice_items enable row level security;

create policy "Users can view own invoices"
  on invoices for select
  using (profile_id = auth.uid());

create policy "Users can insert own invoices"
  on invoices for insert
  with check (profile_id = auth.uid());

create policy "Users can update own invoices"
  on invoices for update
  using (profile_id = auth.uid());

create policy "Users can delete own invoices"
  on invoices for delete
  using (profile_id = auth.uid());

-- Invoice items policies (based on invoice ownership)
create policy "Users can view own invoice items"
  on invoice_items for select
  using (invoice_id in (
    select id from invoices where profile_id = auth.uid()
  ));

create policy "Users can insert own invoice items"
  on invoice_items for insert
  with check (invoice_id in (
    select id from invoices where profile_id = auth.uid()
  ));

create policy "Users can update own invoice items"
  on invoice_items for update
  using (invoice_id in (
    select id from invoices where profile_id = auth.uid()
  ));

create policy "Users can delete own invoice items"
  on invoice_items for delete
  using (invoice_id in (
    select id from invoices where profile_id = auth.uid()
  )); 