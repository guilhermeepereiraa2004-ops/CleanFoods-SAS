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
  const { data: storefrontSettings, error: settingsError } = await supabase
    .from('settings')
    .select('key,value')
    .eq('tenant_id', tenant.id)
    .in('key', [
      'storefront_footer',
      'storefront_contacts',
      'whatsapp',
      'address',
      'instagram',
      'instagram_link',
    ])
    .eq('is_public', true)
    .order('key');

  if (settingsError) {
    console.error('Falha ao carregar as configurações públicas:', settingsError.message);
    return tenant;
  }

  const settingValue = (key: string) => storefrontSettings?.find((setting) => setting.key === key)?.value;
  const footer = settingValue('storefront_footer') as {
    copyright?: unknown;
    cnpj?: unknown;
  } | null;
  const contacts = settingValue('storefront_contacts') as {
    whatsapp?: unknown;
    address?: unknown;
    instagram?: unknown;
    instagramLink?: unknown;
  } | null;
  const legacyText = (key: string) => {
    const value = settingValue(key);
    return typeof value === 'string' ? value : undefined;
  };

  return {
    ...tenant,
    footerCopyright: typeof footer?.copyright === 'string' ? footer.copyright : undefined,
    footerCnpj: typeof footer?.cnpj === 'string' ? footer.cnpj : undefined,
    whatsapp: typeof contacts?.whatsapp === 'string' ? contacts.whatsapp : legacyText('whatsapp'),
    address: typeof contacts?.address === 'string' ? contacts.address : legacyText('address'),
    instagram: typeof contacts?.instagram === 'string' ? contacts.instagram : legacyText('instagram'),
    instagramLink: typeof contacts?.instagramLink === 'string'
      ? contacts.instagramLink
      : legacyText('instagram_link'),
  };
}
