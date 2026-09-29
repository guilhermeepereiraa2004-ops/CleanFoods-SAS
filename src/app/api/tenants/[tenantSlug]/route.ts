import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getPublicTenant } from '@/lib/supabase/tenants-server';
import { normalizeTenantSlug } from '@/lib/tenants';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> },
) {
  const { tenantSlug } = await params;
  const tenant = await getPublicTenant(tenantSlug);

  if (!tenant) {
    return NextResponse.json(
      { error: 'Loja não encontrada.' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.json(tenant, { headers: { 'Cache-Control': 'no-store' } });
}

type StorefrontConfiguration = {
  logoUrl?: unknown;
  theme?: unknown;
  primaryColor?: unknown;
  fontFamily?: unknown;
  bodyFontFamily?: unknown;
  heroFontFamily?: unknown;
  heroWord1?: unknown;
  heroWord2?: unknown;
  heroWord3?: unknown;
  heroWord4?: unknown;
  heroImageUrl?: unknown;
  heroFontColor?: unknown;
  heroFontSize?: unknown;
  heroImageSize?: unknown;
  heroSubtitle?: unknown;
  heroSubtitleFont?: unknown;
  heroSubtitleSize?: unknown;
  logoSize?: unknown;
  footerCopyright?: unknown;
  footerCnpj?: unknown;
};

const optionalText = (value: unknown) => typeof value === 'string' ? value : null;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> },
) {
  const sessionClient = await createClient();
  const { data: claimsData } = await sessionClient.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) return NextResponse.json({ error: 'Sessão expirada.' }, { status: 401 });

  const { data: platformAdmin } = await sessionClient
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!platformAdmin) return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });

  let input: StorefrontConfiguration;
  try {
    input = await request.json() as StorefrontConfiguration;
  } catch {
    return NextResponse.json({ error: 'Configuração inválida.' }, { status: 400 });
  }

  const { tenantSlug } = await params;
  const slug = normalizeTenantSlug(tenantSlug);
  const theme = typeof input.theme === 'string' && /^design[2-9]$/.test(input.theme)
    ? input.theme
    : 'design2';
  const adminClient = createAdminClient();
  const { data: tenant, error: tenantError } = await adminClient
    .from('tenants')
    .update({
      logo_url: optionalText(input.logoUrl),
      theme,
      primary_color: optionalText(input.primaryColor) || '#F6C500',
      font_family: optionalText(input.fontFamily) || 'Inter',
      body_font_family: optionalText(input.bodyFontFamily),
      hero_font_family: optionalText(input.heroFontFamily),
      hero_word_1: optionalText(input.heroWord1),
      hero_word_2: optionalText(input.heroWord2),
      hero_word_3: optionalText(input.heroWord3),
      hero_word_4: optionalText(input.heroWord4),
      hero_image_url: optionalText(input.heroImageUrl),
      hero_font_color: optionalText(input.heroFontColor),
      hero_font_size: optionalText(input.heroFontSize),
      hero_image_size: optionalText(input.heroImageSize),
      hero_subtitle: optionalText(input.heroSubtitle),
      hero_subtitle_font: optionalText(input.heroSubtitleFont),
      hero_subtitle_size: optionalText(input.heroSubtitleSize),
      logo_size: optionalText(input.logoSize),
    })
    .eq('slug', slug)
    .select('id')
    .single();

  if (tenantError) {
    console.error('Falha ao salvar configuração da vitrine:', tenantError.message);
    return NextResponse.json({ error: 'Não foi possível salvar a configuração.' }, { status: 500 });
  }

  const { error: footerError } = await adminClient.from('settings').upsert(
    {
      tenant_id: tenant.id,
      key: 'storefront_footer',
      value: {
        copyright: optionalText(input.footerCopyright) ?? DEFAULT_FOOTER_COPYRIGHT,
        cnpj: optionalText(input.footerCnpj) ?? DEFAULT_FOOTER_CNPJ,
      },
      is_public: true,
    },
    { onConflict: 'tenant_id,key' },
  );

  if (footerError) {
    console.error('Falha ao salvar rodapé da vitrine:', footerError.message);
    return NextResponse.json({ error: 'Não foi possível salvar o rodapé.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

const DEFAULT_FOOTER_COPYRIGHT =
  '© 2026 Cleanfoods SP. Todos os direitos reservados. Sem glúten, sem lactose.';
const DEFAULT_FOOTER_CNPJ = '66.719.007/0001-76';
