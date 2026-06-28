-- FORGED — anti-fraud write-off trust system
-- Initial schema migration.
--
-- RLS is intentionally NOT enabled on any table below. Every table here is
-- read/written exclusively by the Next.js server using the Supabase
-- SERVICE ROLE key (see src/lib/supabase/admin.ts). The service role bypasses
-- RLS anyway, and the anon/public key is never used against these tables, so
-- enabling RLS would add no protection while inviting accidental lockouts.
-- Do not expose NEXT_PUBLIC_SUPABASE_ANON_KEY access to these tables.

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  role text not null check (role in ('employee', 'reviewer', 'admin', 'owner')),
  store_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_users_updated_at
  before update on users
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- stores
-- ---------------------------------------------------------------------------
create table stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  iiko_organization_id text,
  iiko_warehouse_id text,
  latitude numeric,
  longitude numeric,
  created_at timestamptz not null default now()
);

alter table users
  add constraint users_store_id_fkey foreign key (store_id) references stores(id) on delete set null;

-- ---------------------------------------------------------------------------
-- employees
-- ---------------------------------------------------------------------------
create table employees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  store_id uuid references stores(id) on delete cascade,
  position text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_employees_store_id on employees(store_id);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  unit text not null,
  estimated_price numeric not null default 0,
  iiko_product_id text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- writeoff_requests
-- ---------------------------------------------------------------------------
create table writeoff_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique,
  store_id uuid not null references stores(id),
  product_id uuid not null references products(id),
  sender_id uuid not null references users(id),
  quantity numeric not null check (quantity > 0),
  unit text not null,
  reason text not null,
  writeoff_type text not null check (writeoff_type in ('no_deduction', 'employee_deduction')),
  deduction_employee_id uuid references employees(id),
  comment text not null,
  photo_url text not null,
  photo_storage_path text not null,
  captured_at timestamptz,
  capture_latitude numeric,
  capture_longitude numeric,
  source text not null default 'pwa',
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected')),
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  fraud_risk text not null default 'low' check (fraud_risk in ('low', 'medium', 'high')),
  duplicate_detected boolean not null default false,
  duplicate_match_percent numeric not null default 0,
  duplicate_request_id uuid references writeoff_requests(id),
  ai_verdict jsonb,
  reviewer_id uuid references users(id),
  reviewer_comment text,
  reviewed_at timestamptz,
  iiko_status text not null default 'not_synced' check (iiko_status in ('not_synced', 'pending', 'synced', 'failed')),
  iiko_document_id text,
  iiko_external_number text,
  iiko_payload jsonb,
  iiko_response jsonb,
  iiko_error text,
  iiko_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_deduction_employee_required check (
    writeoff_type <> 'employee_deduction' or deduction_employee_id is not null
  )
);

create trigger trg_writeoff_requests_updated_at
  before update on writeoff_requests
  for each row execute function set_updated_at();

create index idx_writeoff_requests_status on writeoff_requests(status);
create index idx_writeoff_requests_store_id on writeoff_requests(store_id);
create index idx_writeoff_requests_product_id on writeoff_requests(product_id);
create index idx_writeoff_requests_sender_id on writeoff_requests(sender_id);
create index idx_writeoff_requests_risk_score on writeoff_requests(risk_score desc);
create index idx_writeoff_requests_created_at on writeoff_requests(created_at desc);
create index idx_writeoff_requests_fraud_risk on writeoff_requests(fraud_risk);

-- ---------------------------------------------------------------------------
-- photo_fingerprints
-- ---------------------------------------------------------------------------
create table photo_fingerprints (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references writeoff_requests(id) on delete cascade,
  hash text not null,
  hash_algorithm text not null default 'dhash',
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

create index idx_photo_fingerprints_request_id on photo_fingerprints(request_id);
create index idx_photo_fingerprints_hash on photo_fingerprints(hash);

-- ---------------------------------------------------------------------------
-- audit_logs (append-only, never deleted by application code)
-- ---------------------------------------------------------------------------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references writeoff_requests(id) on delete set null,
  actor_id uuid references users(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_request_id on audit_logs(request_id);
create index idx_audit_logs_actor_id on audit_logs(actor_id);
create index idx_audit_logs_created_at on audit_logs(created_at desc);

-- ---------------------------------------------------------------------------
-- writeoff_norms
-- ---------------------------------------------------------------------------
create table writeoff_norms (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  avg_daily_quantity numeric not null default 0,
  avg_daily_value numeric not null default 0,
  request_count integer not null default 0,
  last_calculated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (store_id, product_id)
);

-- ---------------------------------------------------------------------------
-- risk_events
-- ---------------------------------------------------------------------------
create table risk_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references writeoff_requests(id) on delete cascade,
  type text not null,
  severity text not null check (severity in ('low', 'medium', 'high')),
  message text not null,
  score_delta integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_risk_events_request_id on risk_events(request_id);

-- ---------------------------------------------------------------------------
-- iiko_sync_logs
-- ---------------------------------------------------------------------------
create table iiko_sync_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references writeoff_requests(id) on delete cascade,
  mode text not null check (mode in ('real', 'sandbox')),
  endpoint text,
  request_payload jsonb,
  response_payload jsonb,
  status text not null check (status in ('success', 'failed')),
  error text,
  created_at timestamptz not null default now()
);

create index idx_iiko_sync_logs_request_id on iiko_sync_logs(request_id);
