-- CleanFoods SaaS - schema inicial multi-tenant para Supabase
-- Execute UMA VEZ no Supabase Dashboard > SQL Editor.
-- Depois execute separadamente o bloco de bootstrap no fim deste arquivo.

begin;

create extension if not exists pgcrypto;
create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Funções internas e gatilhos
-- ---------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Identidade, plataforma e tenants
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  logo_url text,
  theme text not null default 'design2',
  primary_color text not null default '#F6C500',
  font_family text not null default '--font-inter',
  body_font_family text,
  hero_font_family text,
  hero_word_1 text,
  hero_word_2 text,
  hero_word_3 text,
  hero_word_4 text,
  hero_image_url text,
  hero_font_color text,
  hero_font_size text,
  hero_image_size text,
  hero_subtitle text,
  hero_subtitle_font text,
  hero_subtitle_size text,
  logo_size text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenants_slug_format_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint tenants_name_not_blank_check
    check (length(btrim(name)) > 0)
);

create table public.tenant_memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id),
  constraint tenant_memberships_role_check
    check (role in ('owner', 'admin', 'staff'))
);

create index tenant_memberships_user_id_idx
  on public.tenant_memberships (user_id, tenant_id);

create table public.tenant_billing (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  payment_day smallint,
  payment_status text not null default 'pending',
  blocked_reason text,
  paid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_billing_payment_day_check
    check (payment_day is null or payment_day between 1 and 31),
  constraint tenant_billing_payment_status_check
    check (payment_status in ('pending', 'paid', 'overdue', 'suspended'))
);

-- Contém credenciais de gateways. Sem políticas = apenas service_role/secret key.
-- Para produção de maior criticidade, considere migrar os valores para Vault.
create table public.tenant_secrets (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  mercado_pago_access_token text,
  cielo_merchant_id text,
  cielo_merchant_key text,
  asaas_api_key text,
  updated_at timestamptz not null default now()
);

create table public.platform_settings (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now(),
  constraint platform_settings_key_not_blank_check
    check (length(btrim(key)) > 0)
);

-- ---------------------------------------------------------------------------
-- Operação das lojas
-- ---------------------------------------------------------------------------

create table public.dishes (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  id text not null,
  name text not null,
  category text not null,
  price_p numeric(12, 2),
  price_g numeric(12, 2),
  available boolean not null default true,
  image text,
  description text,
  ingredients jsonb not null default '[]'::jsonb,
  nutrition jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, id),
  constraint dishes_id_not_blank_check check (length(btrim(id)) > 0),
  constraint dishes_name_not_blank_check check (length(btrim(name)) > 0),
  constraint dishes_category_not_blank_check check (length(btrim(category)) > 0),
  constraint dishes_price_p_check check (price_p is null or price_p >= 0),
  constraint dishes_price_g_check check (price_g is null or price_g >= 0)
);

create index dishes_storefront_idx
  on public.dishes (tenant_id, available, category, sort_order);

create table public.settings (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  key text not null,
  value jsonb not null default 'null'::jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, key),
  constraint settings_key_not_blank_check check (length(btrim(key)) > 0)
);

create index settings_public_idx
  on public.settings (tenant_id, key)
  where is_public = true;

create table public.coupons (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code text not null,
  discount numeric(5, 2) not null,
  day text,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses integer,
  use_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code),
  constraint coupons_code_normalized_check
    check (code = upper(btrim(code)) and length(code) > 0),
  constraint coupons_discount_check check (discount > 0 and discount <= 100),
  constraint coupons_day_check check (
    day is null or day in (
      'Todo Dia',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
      'Domingo'
    )
  ),
  constraint coupons_max_uses_check check (max_uses is null or max_uses > 0),
  constraint coupons_use_count_check check (use_count >= 0),
  constraint coupons_period_check check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index coupons_active_lookup_idx
  on public.coupons (tenant_id, code)
  where active = true;

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  quantity numeric(12, 3) not null default 0,
  price numeric(12, 2) not null default 0,
  unit text not null default 'un',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_name_not_blank_check check (length(btrim(name)) > 0),
  constraint inventory_quantity_check check (quantity >= 0),
  constraint inventory_price_check check (price >= 0)
);

create index inventory_tenant_name_idx
  on public.inventory (tenant_id, name);

create table public.orders (
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  id text not null,
  client_name text not null,
  client_phone text not null,
  address text,
  client_address text,
  client_number text,
  client_complement text,
  payment text,
  payment_method text,
  payment_status text,
  notes text,
  delivery_date date,
  delivery_time text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  status text not null default 'Pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, id),
  constraint orders_id_not_blank_check check (length(btrim(id)) > 0),
  constraint orders_client_name_not_blank_check check (length(btrim(client_name)) > 0),
  constraint orders_client_phone_not_blank_check check (length(btrim(client_phone)) > 0),
  constraint orders_subtotal_check check (subtotal >= 0),
  constraint orders_discount_check check (discount >= 0),
  constraint orders_total_check check (total >= 0),
  constraint orders_status_check
    check (status in ('Pendente', 'Em Preparo', 'Enviado', 'Concluído', 'Cancelado', 'pending')),
  constraint orders_payment_status_check
    check (
      payment_status is null or
      payment_status in ('pending', 'approved', 'rejected', 'cancelled', 'in_process')
    )
);

create index orders_tenant_created_at_idx
  on public.orders (tenant_id, created_at desc);

create index orders_tenant_status_created_at_idx
  on public.orders (tenant_id, status, created_at desc);

create index orders_pending_payment_idx
  on public.orders (tenant_id, created_at desc)
  where payment_status in ('pending', 'in_process');

create table public.transactions (
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  id text not null,
  order_id text,
  type text not null,
  description text not null,
  value numeric(12, 2) not null,
  date timestamptz not null default now(),
  category text not null default 'Manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, id),
  constraint transactions_order_fkey
    foreign key (tenant_id, order_id)
    references public.orders(tenant_id, id)
    on delete restrict,
  constraint transactions_type_check check (type in ('Entrada', 'Saída')),
  constraint transactions_description_not_blank_check check (length(btrim(description)) > 0),
  constraint transactions_value_check check (value >= 0)
);

create index transactions_tenant_date_idx
  on public.transactions (tenant_id, date desc);

create index transactions_tenant_type_date_idx
  on public.transactions (tenant_id, type, date desc);

create index transactions_order_idx
  on public.transactions (tenant_id, order_id)
  where order_id is not null;

-- ---------------------------------------------------------------------------
-- Perfil automático para usuários do Supabase Auth
-- ---------------------------------------------------------------------------

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

insert into public.profiles (user_id, display_name)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1))
from auth.users u
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Gatilhos de updated_at
-- ---------------------------------------------------------------------------

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger tenants_set_updated_at
  before update on public.tenants
  for each row execute function private.set_updated_at();

create trigger tenant_billing_set_updated_at
  before update on public.tenant_billing
  for each row execute function private.set_updated_at();

create trigger tenant_secrets_set_updated_at
  before update on public.tenant_secrets
  for each row execute function private.set_updated_at();

create trigger platform_settings_set_updated_at
  before update on public.platform_settings
  for each row execute function private.set_updated_at();

create trigger dishes_set_updated_at
  before update on public.dishes
  for each row execute function private.set_updated_at();

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function private.set_updated_at();

create trigger coupons_set_updated_at
  before update on public.coupons
  for each row execute function private.set_updated_at();

create trigger inventory_set_updated_at
  before update on public.inventory
  for each row execute function private.set_updated_at();

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function private.set_updated_at();

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.platform_admins enable row level security;
alter table public.platform_admins force row level security;
alter table public.tenants enable row level security;
alter table public.tenants force row level security;
alter table public.tenant_memberships enable row level security;
alter table public.tenant_memberships force row level security;
alter table public.tenant_billing enable row level security;
alter table public.tenant_billing force row level security;
alter table public.tenant_secrets enable row level security;
alter table public.tenant_secrets force row level security;
alter table public.platform_settings enable row level security;
alter table public.platform_settings force row level security;
alter table public.dishes enable row level security;
alter table public.dishes force row level security;
alter table public.settings enable row level security;
alter table public.settings force row level security;
alter table public.coupons enable row level security;
alter table public.coupons force row level security;
alter table public.inventory enable row level security;
alter table public.inventory force row level security;
alter table public.orders enable row level security;
alter table public.orders force row level security;
alter table public.transactions enable row level security;
alter table public.transactions force row level security;

create policy profiles_select_own
  on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);

create policy profiles_update_own
  on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy platform_admins_select_own
  on public.platform_admins for select to authenticated
  using ((select auth.uid()) = user_id);

create policy memberships_select_own
  on public.tenant_memberships for select to authenticated
  using ((select auth.uid()) = user_id);

create policy tenants_public_read
  on public.tenants for select to anon
  using (is_active = true);

create policy tenants_authenticated_read
  on public.tenants for select to authenticated
  using (
    is_active = true
    or exists (
      select 1
      from public.tenant_memberships tm
      where tm.tenant_id = tenants.id
        and tm.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.platform_admins pa
      where pa.user_id = (select auth.uid())
    )
  );

create policy tenants_admin_update
  on public.tenants for update to authenticated
  using (
    exists (
      select 1
      from public.tenant_memberships tm
      where tm.tenant_id = tenants.id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.tenant_memberships tm
      where tm.tenant_id = tenants.id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  );

create policy tenant_billing_member_read
  on public.tenant_billing for select to authenticated
  using (
    exists (
      select 1
      from public.tenant_memberships tm
      where tm.tenant_id = tenant_billing.tenant_id
        and tm.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.platform_admins pa
      where pa.user_id = (select auth.uid())
    )
  );

create policy platform_settings_admin_read
  on public.platform_settings for select to authenticated
  using (
    exists (
      select 1 from public.platform_admins pa
      where pa.user_id = (select auth.uid())
    )
  );

create policy platform_settings_admin_insert
  on public.platform_settings for insert to authenticated
  with check (
    exists (
      select 1 from public.platform_admins pa
      where pa.user_id = (select auth.uid())
    )
  );

create policy platform_settings_admin_update
  on public.platform_settings for update to authenticated
  using (
    exists (
      select 1 from public.platform_admins pa
      where pa.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.platform_admins pa
      where pa.user_id = (select auth.uid())
    )
  );

create policy platform_settings_admin_delete
  on public.platform_settings for delete to authenticated
  using (
    exists (
      select 1 from public.platform_admins pa
      where pa.user_id = (select auth.uid())
    )
  );

create policy dishes_public_read
  on public.dishes for select to anon
  using (
    available = true
    and exists (
      select 1 from public.tenants t
      where t.id = dishes.tenant_id and t.is_active = true
    )
  );

create policy dishes_member_read
  on public.dishes for select to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = dishes.tenant_id
        and tm.user_id = (select auth.uid())
    )
    or (
      available = true
      and exists (
        select 1 from public.tenants t
        where t.id = dishes.tenant_id and t.is_active = true
      )
    )
  );

create policy dishes_staff_insert
  on public.dishes for insert to authenticated
  with check (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = dishes.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'staff')
    )
  );

create policy dishes_staff_update
  on public.dishes for update to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = dishes.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'staff')
    )
  )
  with check (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = dishes.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'staff')
    )
  );

create policy dishes_admin_delete
  on public.dishes for delete to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = dishes.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  );

create policy settings_public_read
  on public.settings for select to anon
  using (
    is_public = true
    and exists (
      select 1 from public.tenants t
      where t.id = settings.tenant_id and t.is_active = true
    )
  );

create policy settings_member_read
  on public.settings for select to authenticated
  using (
    (
      is_public = true
      and exists (
        select 1 from public.tenants t
        where t.id = settings.tenant_id and t.is_active = true
      )
    )
    or exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = settings.tenant_id
        and tm.user_id = (select auth.uid())
    )
  );

create policy settings_admin_insert
  on public.settings for insert to authenticated
  with check (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = settings.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  );

create policy settings_admin_update
  on public.settings for update to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = settings.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = settings.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  );

create policy settings_admin_delete
  on public.settings for delete to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = settings.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  );

create policy coupons_public_read
  on public.coupons for select to anon
  using (
    active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
    and (max_uses is null or use_count < max_uses)
    and exists (
      select 1 from public.tenants t
      where t.id = coupons.tenant_id and t.is_active = true
    )
  );

create policy coupons_member_read
  on public.coupons for select to authenticated
  using (
    (
      active = true
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at > now())
      and (max_uses is null or use_count < max_uses)
      and exists (
        select 1 from public.tenants t
        where t.id = coupons.tenant_id and t.is_active = true
      )
    )
    or exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = coupons.tenant_id
        and tm.user_id = (select auth.uid())
    )
  );

create policy coupons_admin_insert
  on public.coupons for insert to authenticated
  with check (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = coupons.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  );

create policy coupons_admin_update
  on public.coupons for update to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = coupons.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = coupons.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  );

create policy coupons_admin_delete
  on public.coupons for delete to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = coupons.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  );

create policy inventory_member_read
  on public.inventory for select to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = inventory.tenant_id
        and tm.user_id = (select auth.uid())
    )
  );

create policy inventory_staff_insert
  on public.inventory for insert to authenticated
  with check (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = inventory.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'staff')
    )
  );

create policy inventory_staff_update
  on public.inventory for update to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = inventory.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'staff')
    )
  )
  with check (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = inventory.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'staff')
    )
  );

create policy inventory_admin_delete
  on public.inventory for delete to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = inventory.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  );

create policy orders_member_read
  on public.orders for select to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = orders.tenant_id
        and tm.user_id = (select auth.uid())
    )
  );

create policy orders_staff_insert
  on public.orders for insert to authenticated
  with check (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = orders.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'staff')
    )
  );

create policy orders_staff_update
  on public.orders for update to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = orders.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'staff')
    )
  )
  with check (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = orders.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'staff')
    )
  );

create policy orders_admin_delete
  on public.orders for delete to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = orders.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  );

create policy transactions_admin_read
  on public.transactions for select to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = transactions.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  );

create policy transactions_admin_insert
  on public.transactions for insert to authenticated
  with check (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = transactions.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  );

create policy transactions_admin_update
  on public.transactions for update to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = transactions.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = transactions.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  );

create policy transactions_admin_delete
  on public.transactions for delete to authenticated
  using (
    exists (
      select 1 from public.tenant_memberships tm
      where tm.tenant_id = transactions.tenant_id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- Privilégios explícitos para a Data API
-- ---------------------------------------------------------------------------

revoke all on table
  public.profiles,
  public.platform_admins,
  public.tenants,
  public.tenant_memberships,
  public.tenant_billing,
  public.tenant_secrets,
  public.platform_settings,
  public.dishes,
  public.settings,
  public.coupons,
  public.inventory,
  public.orders,
  public.transactions
from public, anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on table
  public.tenants,
  public.dishes,
  public.settings,
  public.coupons
to anon;

grant select, update on table public.profiles to authenticated;
grant select on table public.platform_admins to authenticated;
grant select on table public.tenant_memberships to authenticated;
grant select on table public.tenant_billing to authenticated;

grant select on table public.tenants to authenticated;
grant update (
  name,
  logo_url,
  theme,
  primary_color,
  font_family,
  body_font_family,
  hero_font_family,
  hero_word_1,
  hero_word_2,
  hero_word_3,
  hero_word_4,
  hero_image_url,
  hero_font_color,
  hero_font_size,
  hero_image_size,
  hero_subtitle,
  hero_subtitle_font,
  hero_subtitle_size,
  logo_size
) on public.tenants to authenticated;

grant select, insert, update, delete on table
  public.dishes,
  public.settings,
  public.coupons,
  public.inventory,
  public.orders,
  public.transactions,
  public.platform_settings
to authenticated;

grant usage, select on sequence
  public.settings_id_seq,
  public.coupons_id_seq
to authenticated;

grant all on table
  public.profiles,
  public.platform_admins,
  public.tenants,
  public.tenant_memberships,
  public.tenant_billing,
  public.tenant_secrets,
  public.platform_settings,
  public.dishes,
  public.settings,
  public.coupons,
  public.inventory,
  public.orders,
  public.transactions
to service_role;

grant usage, select on sequence
  public.settings_id_seq,
  public.coupons_id_seq
to service_role;

-- ---------------------------------------------------------------------------
-- Storage público para imagens dos produtos
-- Caminho obrigatório: <tenant_uuid>/<nome-do-arquivo>
-- ---------------------------------------------------------------------------

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists product_images_member_insert on storage.objects;
create policy product_images_member_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and exists (
      select 1
      from public.tenant_memberships tm
      where tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'staff')
        and tm.tenant_id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists product_images_member_update on storage.objects;
create policy product_images_member_update
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1
      from public.tenant_memberships tm
      where tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'staff')
        and tm.tenant_id::text = (storage.foldername(name))[1]
    )
  )
  with check (
    bucket_id = 'product-images'
    and exists (
      select 1
      from public.tenant_memberships tm
      where tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin', 'staff')
        and tm.tenant_id::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1
      from public.tenant_memberships tm
      where tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
        and tm.tenant_id::text = (storage.foldername(name))[1]
    )
  );

notify pgrst, 'reload schema';

commit;

-- ==========================================================================
-- BOOTSTRAP - EXECUTE SEPARADAMENTE DEPOIS DE CRIAR O USUÁRIO EM AUTH
-- ==========================================================================
-- 1. Supabase Dashboard > Authentication > Users > Add user.
-- 2. Troque os dois valores abaixo e execute apenas este bloco.
--
-- do $$
-- declare
--   v_email text := 'SEU_EMAIL_AQUI';
--   v_tenant_slug text := 'demo';
--   v_tenant_name text := 'CleanFoods Demo';
--   v_user_id uuid;
--   v_tenant_id uuid;
-- begin
--   select id into v_user_id
--   from auth.users
--   where lower(email) = lower(v_email);
--
--   if v_user_id is null then
--     raise exception 'Usuário % não encontrado em Authentication > Users', v_email;
--   end if;
--
--   insert into public.tenants (slug, name)
--   values (v_tenant_slug, v_tenant_name)
--   on conflict (slug) do update set name = excluded.name
--   returning id into v_tenant_id;
--
--   insert into public.tenant_memberships (tenant_id, user_id, role)
--   values (v_tenant_id, v_user_id, 'owner')
--   on conflict (tenant_id, user_id) do update set role = 'owner';
--
--   insert into public.tenant_billing (tenant_id, payment_status)
--   values (v_tenant_id, 'paid')
--   on conflict (tenant_id) do nothing;
--
--   insert into public.platform_admins (user_id)
--   values (v_user_id)
--   on conflict (user_id) do nothing;
-- end;
-- $$;
