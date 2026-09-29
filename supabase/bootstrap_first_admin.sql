-- Execute depois de criar seu usuário em:
-- Supabase > Authentication > Users > Add user
-- Este script usa automaticamente o usuário criado mais recentemente.

begin;

do $$
declare
  v_user_id uuid;
  v_tenant_id uuid;
begin
  select id
  into v_user_id
  from auth.users
  order by created_at desc
  limit 1;

  if v_user_id is null then
    raise exception 'Nenhum usuário encontrado. Crie um usuário em Authentication > Users antes de executar este SQL.';
  end if;

  insert into public.profiles (user_id, display_name)
  select
    u.id,
    coalesce(u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1))
  from auth.users u
  where u.id = v_user_id
  on conflict (user_id) do nothing;

  insert into public.tenants (slug, name, is_active)
  values ('cleanfoods', 'CleanFoods', true)
  on conflict (slug) do update set
    name = excluded.name,
    is_active = true
  returning id into v_tenant_id;

  insert into public.tenant_memberships (tenant_id, user_id, role)
  values (v_tenant_id, v_user_id, 'owner')
  on conflict (tenant_id, user_id) do update set
    role = excluded.role;

  insert into public.tenant_billing (
    tenant_id,
    payment_day,
    payment_status,
    paid_until
  )
  values (
    v_tenant_id,
    10,
    'paid',
    current_date + interval '1 year'
  )
  on conflict (tenant_id) do update set
    payment_status = excluded.payment_status,
    paid_until = excluded.paid_until;

  insert into public.platform_admins (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;
end;
$$;

commit;

-- Confirmação: deve retornar uma linha.
select
  t.name as loja,
  t.slug,
  t.is_active,
  tm.role,
  tb.payment_status
from public.tenants t
join public.tenant_memberships tm on tm.tenant_id = t.id
join public.tenant_billing tb on tb.tenant_id = t.id
where t.slug = 'cleanfoods';
