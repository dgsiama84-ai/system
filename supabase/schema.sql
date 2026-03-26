-- ============================================
-- ES CAMELO — SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- PROFILES (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null default 'staff' check (role in ('admin', 'staff'))
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'staff')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- PRODUCTS
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null default 0
);

-- TRANSACTIONS
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  quantity int not null default 1,
  total_price numeric not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- EXPENSES
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- INGREDIENTS
create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null default 'pcs'
);

-- PRODUCT RECIPES
create table if not exists product_recipes (
  product_id uuid references products(id) on delete cascade,
  ingredient_id uuid references ingredients(id) on delete cascade,
  qty numeric not null default 1,
  primary key (product_id, ingredient_id)
);

-- STOCKS
create table if not exists stocks (
  ingredient_id uuid references ingredients(id) on delete cascade primary key,
  qty numeric not null default 0
);

-- STOCK MOVEMENTS
create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid references ingredients(id) on delete cascade,
  qty numeric not null,
  type text not null check (type in ('in', 'out', 'adjustment')),
  created_at timestamptz default now()
);

-- STOCK OPNAME
create table if not exists stock_opname (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid references ingredients(id) on delete cascade,
  system_qty numeric not null,
  real_qty numeric not null,
  difference numeric not null,
  created_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table profiles enable row level security;
alter table products enable row level security;
alter table transactions enable row level security;
alter table expenses enable row level security;
alter table ingredients enable row level security;
alter table product_recipes enable row level security;
alter table stocks enable row level security;
alter table stock_movements enable row level security;
alter table stock_opname enable row level security;

-- Helper: get role of current user
create or replace function get_my_role()
returns text as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

-- PROFILES: user can read own, admin can read all
create policy "profiles_select" on profiles for select
  using (id = auth.uid() or get_my_role() = 'admin');

create policy "profiles_update_own" on profiles for update
  using (id = auth.uid());

-- PRODUCTS: all authenticated users can read
create policy "products_select" on products for select
  to authenticated using (true);

create policy "products_insert" on products for insert
  with check (get_my_role() = 'admin');

create policy "products_update" on products for update
  using (get_my_role() = 'admin');

-- TRANSACTIONS: staff can insert own, admin can read all
create policy "transactions_select_own" on transactions for select
  using (created_by = auth.uid() or get_my_role() = 'admin');

create policy "transactions_insert" on transactions for insert
  with check (created_by = auth.uid());

-- INGREDIENTS + RECIPES: authenticated read, admin write
create policy "ingredients_select" on ingredients for select
  to authenticated using (true);

create policy "ingredients_admin_write" on ingredients for all
  using (get_my_role() = 'admin');

create policy "recipes_select" on product_recipes for select
  to authenticated using (true);

create policy "recipes_admin_write" on product_recipes for all
  using (get_my_role() = 'admin');

-- STOCKS: authenticated read, admin write
create policy "stocks_select" on stocks for select
  to authenticated using (true);

create policy "stocks_admin_write" on stocks for all
  using (get_my_role() = 'admin');

-- Also allow upsert from transactions (needed for stock deduction)
create policy "stocks_upsert_auth" on stocks for insert
  to authenticated with check (true);

create policy "stocks_update_auth" on stocks for update
  to authenticated using (true);

-- STOCK MOVEMENTS: admin read, authenticated insert
create policy "movements_select" on stock_movements for select
  using (get_my_role() = 'admin');

create policy "movements_insert" on stock_movements for insert
  to authenticated with check (true);

-- STOCK OPNAME: admin only
create policy "opname_all" on stock_opname for all
  using (get_my_role() = 'admin');

-- EXPENSES: admin only
create policy "expenses_all" on expenses for all
  using (get_my_role() = 'admin');

-- ============================================
-- SAMPLE DATA (optional, comment out if not needed)
-- ============================================

-- insert into ingredients (id, name, unit) values
--   (gen_random_uuid(), 'Susu UHT', 'ml'),
--   (gen_random_uuid(), 'Gula Pasir', 'gram'),
--   (gen_random_uuid(), 'Es Batu', 'pcs'),
--   (gen_random_uuid(), 'Sirup Camelo', 'ml');
