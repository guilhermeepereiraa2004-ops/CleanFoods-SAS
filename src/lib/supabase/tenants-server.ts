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

  return data ? mapTenantRow(data as unknown as TenantRow) : null;
}
