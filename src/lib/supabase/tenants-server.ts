import 'server-only';

import { createClient } from '@/lib/supabase/server';
import {
  mapTenantRow,
  normalizeTenantSlug,
  PUBLIC_TENANT_COLUMNS,
  type PublicTenant,
  type TenantRow,
} from '@/lib/tenants';

export async function getPublicTenant(slug: string): Promise<PublicTenant | null> {
  const normalizedSlug = normalizeTenantSlug(slug);
  if (!normalizedSlug) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tenants')
    .select(PUBLIC_TENANT_COLUMNS)
    .eq('slug', normalizedSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Falha ao carregar loja pública:', error.message);
    return null;
  }

  if (!data) return null;

  const tenant = mapTenantRow(data as unknown as TenantRow);
  const { data: footerSetting, error: footerError } = await supabase
    .from('settings')
    .select('value')
    .eq('tenant_id', tenant.id)
    .eq('key', 'storefront_footer')
    .eq('is_public', true)
    .maybeSingle();

  if (footerError) {
    console.error('Falha ao carregar o rodapé público:', footerError.message);
    return tenant;
  }

  const footer = footerSetting?.value as {
    copyright?: unknown;
    cnpj?: unknown;
  } | null;

  return {
    ...tenant,
    footerCopyright: typeof footer?.copyright === 'string' ? footer.copyright : undefined,
    footerCnpj: typeof footer?.cnpj === 'string' ? footer.cnpj : undefined,
  };
}
