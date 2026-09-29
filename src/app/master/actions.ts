'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  mapTenantRow,
  normalizeTenantSlug,
  PUBLIC_TENANT_COLUMNS,
  type PublicTenant,
  type TenantRow,
} from '@/lib/tenants';

export type MasterLoginState = {
  error: string;
};

export async function loginMaster(
  _previousState: MasterLoginState,
  formData: FormData,
): Promise<MasterLoginState> {
  const emailValue = formData.get('email');
  const passwordValue = formData.get('password');

  if (typeof emailValue !== 'string' || typeof passwordValue !== 'string') {
    return { error: 'Informe seu e-mail e sua senha.' };
  }

  const email = emailValue.trim().toLowerCase();

  if (!email || !passwordValue) {
    return { error: 'Informe seu e-mail e sua senha.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: passwordValue,
  });

  if (error || !data.user) {
    if (error?.code === 'email_not_confirmed') {
      return { error: 'Confirme seu e-mail antes de entrar.' };
    }

    return { error: 'E-mail ou senha inválidos.' };
  }

  const { data: platformAdmin, error: authorizationError } = await supabase
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (authorizationError) {
    console.error('Falha ao validar o acesso Master Admin:', authorizationError.message);
    await supabase.auth.signOut();
    return { error: 'Não foi possível validar sua permissão. Tente novamente.' };
  }

  if (!platformAdmin) {
    await supabase.auth.signOut();
    return { error: 'Este usuário não possui permissão de Master Admin.' };
  }

  redirect('/master');
}

export async function logoutMaster() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/master');
}

export type MasterTenantInput = {
  id?: string;
  slug: string;
  name: string;
  isActive?: boolean;
  logoUrl?: string;
  theme?: string;
  primaryColor?: string;
  fontFamily?: string;
  bodyFontFamily?: string;
  heroFontFamily?: string;
  heroWord1?: string;
  heroWord2?: string;
  heroWord3?: string;
  heroWord4?: string;
  heroImageUrl?: string;
  heroFontColor?: string;
  heroFontSize?: string;
  heroImageSize?: string;
  heroSubtitle?: string;
  heroSubtitleFont?: string;
  heroSubtitleSize?: string;
  logoSize?: string;
  footerCopyright?: string;
  footerCnpj?: string;
  paymentDay?: string;
  paymentStatus?: 'pago' | 'pendente';
};

export type MasterTenant = PublicTenant & {
  paymentDay?: string;
  paymentStatus: 'pago' | 'pendente';
};

async function requirePlatformAdmin() {
  const sessionClient = await createClient();
  const { data: claimsData, error: claimsError } = await sessionClient.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) throw new Error('Sessão Master expirada. Entre novamente.');

  const { data: platformAdmin, error } = await sessionClient
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !platformAdmin) throw new Error('Acesso não autorizado.');
  return createAdminClient();
}

function tenantPayload(input: MasterTenantInput) {
  const slug = normalizeTenantSlug(input.slug);
  const name = input.name.trim();

  if (!slug || !name) throw new Error('Informe um nome e um subdomínio válidos.');

  return {
    slug,
    name,
    is_active: input.isActive ?? true,
    logo_url: input.logoUrl ?? null,
    theme: input.theme === 'design1' ? 'design2' : (input.theme || 'design2'),
    primary_color: input.primaryColor || '#F6C500',
    font_family: input.fontFamily || 'Inter',
    body_font_family: input.bodyFontFamily ?? null,
    hero_font_family: input.heroFontFamily ?? null,
    hero_word_1: input.heroWord1 ?? null,
    hero_word_2: input.heroWord2 ?? null,
    hero_word_3: input.heroWord3 ?? null,
    hero_word_4: input.heroWord4 ?? null,
    hero_image_url: input.heroImageUrl ?? null,
    hero_font_color: input.heroFontColor ?? null,
    hero_font_size: input.heroFontSize ?? null,
    hero_image_size: input.heroImageSize ?? null,
    hero_subtitle: input.heroSubtitle ?? null,
    hero_subtitle_font: input.heroSubtitleFont ?? null,
    hero_subtitle_size: input.heroSubtitleSize ?? null,
    logo_size: input.logoSize ?? null,
  };
}

async function saveBilling(
  adminClient: ReturnType<typeof createAdminClient>,
  tenantId: string,
  input: MasterTenantInput,
) {
  const paymentDay = Number.parseInt(input.paymentDay || '', 10);
  const { error } = await adminClient.from('tenant_billing').upsert({
    tenant_id: tenantId,
    payment_day: Number.isInteger(paymentDay) && paymentDay >= 1 && paymentDay <= 31
      ? paymentDay
      : null,
    payment_status: input.paymentStatus === 'pendente' ? 'pending' : 'paid',
  });

  if (error) throw new Error(`Não foi possível salvar a cobrança: ${error.message}`);
}

async function saveStorefrontFooter(
  adminClient: ReturnType<typeof createAdminClient>,
  tenantId: string,
  input: MasterTenantInput,
) {
  const { error } = await adminClient.from('settings').upsert(
    {
      tenant_id: tenantId,
      key: 'storefront_footer',
      value: {
        copyright: input.footerCopyright
          ?? '© 2026 Cleanfoods SP. Todos os direitos reservados. Sem glúten, sem lactose.',
        cnpj: input.footerCnpj ?? '66.719.007/0001-76',
      },
      is_public: true,
    },
    { onConflict: 'tenant_id,key' },
  );

  if (error) throw new Error(`Não foi possível salvar o rodapé: ${error.message}`);
}

async function listMasterTenants(
  adminClient: ReturnType<typeof createAdminClient>,
): Promise<MasterTenant[]> {
  const [
    { data: tenantRows, error: tenantsError },
    { data: billingRows, error: billingError },
    { data: footerRows, error: footerError },
  ] =
    await Promise.all([
      adminClient.from('tenants').select(PUBLIC_TENANT_COLUMNS).order('created_at'),
      adminClient.from('tenant_billing').select('tenant_id,payment_day,payment_status'),
      adminClient
        .from('settings')
        .select('tenant_id,value')
        .eq('key', 'storefront_footer')
        .eq('is_public', true),
    ]);

  if (tenantsError) throw new Error(`Não foi possível carregar as lojas: ${tenantsError.message}`);
  if (billingError) throw new Error(`Não foi possível carregar as cobranças: ${billingError.message}`);
  if (footerError) throw new Error(`Não foi possível carregar os rodapés: ${footerError.message}`);

  const billingByTenant = new Map(
    (billingRows || []).map((billing) => [billing.tenant_id, billing]),
  );
  const footerByTenant = new Map(
    (footerRows || []).map((setting) => [setting.tenant_id, setting.value]),
  );

  return (tenantRows || []).map((row) => {
    const tenant = mapTenantRow(row as unknown as TenantRow);
    const billing = billingByTenant.get(tenant.id);
    const footer = footerByTenant.get(tenant.id) as {
      copyright?: unknown;
      cnpj?: unknown;
    } | undefined;
    return {
      ...tenant,
      paymentDay: billing?.payment_day?.toString(),
      paymentStatus: billing?.payment_status === 'paid' ? 'pago' : 'pendente',
      footerCopyright: typeof footer?.copyright === 'string' ? footer.copyright : undefined,
      footerCnpj: typeof footer?.cnpj === 'string' ? footer.cnpj : undefined,
    };
  });
}

export async function loadMasterTenants(
  legacyTenants: MasterTenantInput[],
): Promise<MasterTenant[]> {
  const adminClient = await requirePlatformAdmin();

  for (const legacyTenant of legacyTenants.slice(0, 100)) {
    const payload = tenantPayload(legacyTenant);
    const { data, error } = await adminClient
      .from('tenants')
      .upsert(payload, { onConflict: 'slug' })
      .select('id')
      .single();

    if (error) throw new Error(`Não foi possível sincronizar ${payload.name}: ${error.message}`);
    await saveBilling(adminClient, data.id, legacyTenant);
    await saveStorefrontFooter(adminClient, data.id, legacyTenant);
  }

  return listMasterTenants(adminClient);
}

export async function saveMasterTenant(input: MasterTenantInput): Promise<MasterTenant> {
  const adminClient = await requirePlatformAdmin();
  const payload = tenantPayload(input);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    input.id || '',
  );

  const query = isUuid
    ? adminClient.from('tenants').update(payload).eq('id', input.id as string)
    : adminClient.from('tenants').upsert(payload, { onConflict: 'slug' });
  const { data, error } = await query.select(PUBLIC_TENANT_COLUMNS).single();

  if (error) throw new Error(`Não foi possível salvar a loja: ${error.message}`);
  const tenantId = (data as unknown as TenantRow).id;
  await saveBilling(adminClient, tenantId, input);
  await saveStorefrontFooter(adminClient, tenantId, input);

  const allTenants = await listMasterTenants(adminClient);
  const savedTenant = allTenants.find((tenant) => tenant.id === tenantId);
  if (!savedTenant) throw new Error('A loja foi salva, mas não pôde ser recarregada.');
  return savedTenant;
}

export async function deleteMasterTenant(tenantId: string): Promise<void> {
  const adminClient = await requirePlatformAdmin();
  const { error } = await adminClient.from('tenants').delete().eq('id', tenantId);
  if (error) throw new Error(`Não foi possível apagar a loja: ${error.message}`);
}
