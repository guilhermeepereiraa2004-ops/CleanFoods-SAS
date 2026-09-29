import { redirect } from 'next/navigation';

import { getPublicTenant } from '@/lib/supabase/tenants-server';
import { normalizeTenantSlug } from '@/lib/tenants';

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const normalizedSlug = normalizeTenantSlug(tenantSlug);

  if (normalizedSlug && tenantSlug !== normalizedSlug) redirect(`/${normalizedSlug}`);

  const tenant = await getPublicTenant(normalizedSlug);
  if (!tenant) {
    return <div className="p-8 text-white bg-cf-black h-screen">Loja não encontrada.</div>;
  }

  const storefrontFile = `index-${tenant.theme.replace('design', '')}.html`;

  return (
    <div className="w-full h-screen overflow-hidden bg-cf-black">
      <iframe
        src={`/${storefrontFile}?tenant=${normalizedSlug}`}
        className="w-full h-full border-none"
        title={`Loja ${tenant.name}`}
      />
    </div>
  );
}
