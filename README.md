# 🧊 Es Camelo — Internal System

Internal management app for Es Camelo beverage business.

## Stack
- **Next.js 15** (App Router, Server Actions)
- **Tailwind CSS** — dark, mobile-first UI
- **Supabase** — Auth, Postgres, RLS

---

## Setup

### 1. Clone & install
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.local.example .env.local
```
Fill in your Supabase project URL and anon key.

### 3. Set up database
Run `supabase/schema.sql` in your Supabase SQL Editor.

### 4. Create users
Go to Supabase → Authentication → Users → Add user.

After creation, manually set their role in the `profiles` table:
```sql
update profiles set role = 'admin' where email = 'admin@escamelo.com';
```

### 5. Add products & ingredients
Insert products and set up recipes in the Supabase Table Editor or SQL:
```sql
insert into products (name, price) values ('Es Camelo Original', 15000);
insert into ingredients (name, unit) values ('Susu UHT', 'ml');
-- then add to stocks and product_recipes
```

### 6. Run dev server
```bash
npm run dev
```

---

## Features

| Feature | Staff | Admin |
|---|---|---|
| Login | ✅ | ✅ |
| Input Transaksi | ✅ | ✅ |
| Dashboard | — | ✅ |
| Inventori | — | ✅ |
| Stock Opname | — | ✅ |
| Laporan | — | ✅ |

## Business Logic

**Auto Stock Deduction** — On every transaction:
1. Fetch recipe from `product_recipes`
2. For each ingredient: `new_qty = current_qty - (recipe_qty × quantity_sold)`
3. Insert `stock_movements` with `type = 'out'`

**Stock Opname Adjustment**:
1. Compare `real_qty` vs `system_qty` from `stocks`
2. `difference = real_qty - system_qty`
3. Update `stocks.qty` to `real_qty`
4. Insert `stock_movements` with `type = 'adjustment'`
