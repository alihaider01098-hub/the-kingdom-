-- تأكد من تشغيل هذا في SQL Editor إذا لم تنفذه سابقًا
create table if not exists orders (
  id bigserial primary key,
  order_number text unique not null,
  customer_name text,
  customer_phone text,
  items jsonb not null default '[]',
  total numeric(12,2) not null default 0,
  status text default 'new',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table orders enable row level security;
drop policy if exists "public insert orders" on orders;
drop policy if exists "public read orders" on orders;
drop policy if exists "public update orders" on orders;
create policy "public insert orders" on orders for insert with check (true);
create policy "public read orders" on orders for select using (true);
create policy "public update orders" on orders for update using (true);
