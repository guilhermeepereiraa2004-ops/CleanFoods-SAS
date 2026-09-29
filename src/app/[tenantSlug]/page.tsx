import { redirect } from 'next/navigation';

import { getPublicTenant } from '@/lib/supabase/tenants-server';
import { normalizeTenantSlug } from '@/lib/tenants';

export default async function StorefrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ theme?: string | string[] }>;
}) {
  const { tenantSlug } = await params;
  const { theme: requestedTheme } = await searchParams;
  const normalizedSlug = normalizeTenantSlug(tenantSlug);
  const themeQuery = Array.isArray(requestedTheme) ? requestedTheme[0] : requestedTheme;
  const previewTheme = typeof themeQuery === 'string' && /^design[2-9]$/.test(themeQuery)
    ? themeQuery
    : null;

  if (normalizedSlug && tenantSlug !== normalizedSlug) {
    redirect(`/${normalizedSlug}${previewTheme ? `?theme=${previewTheme}` : ''}`);
  }

  const tenant = await getPublicTenant(normalizedSlug);
  if (!tenant) {
    return <div className="p-8 text-white bg-cf-black h-screen">Loja não encontrada.</div>;
  }

  const selectedTheme = previewTheme || tenant.theme;
  const storefrontFile = `index-${selectedTheme.replace('design', '')}.html`;

  return (
    <div className="w-full h-screen overflow-hidden bg-cf-black">
      <iframe
        src={`/${storefrontFile}?tenant=${normalizedSlug}&theme=${selectedTheme}`}
        className="w-full h-full border-none"
        title={`Loja ${tenant.name}`}
      />
    </div>
  );
}
