import { redirect } from 'next/navigation';

import { getPublicTenant } from '@/lib/supabase/tenants-server';
import { normalizeTenantSlug } from '@/lib/tenants';

export default async function LegacyAdminPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const normalizedSlug = normalizeTenantSlug(tenantSlug);

  if (normalizedSlug && tenantSlug !== normalizedSlug) redirect(`/${normalizedSlug}/admin`);

  const tenant = await getPublicTenant(normalizedSlug);
  if (!tenant) {
    return <div className="p-8 text-white bg-cf-black h-screen">Loja não encontrada.</div>;
  }

  return (
    <div className="w-full h-[100dvh] overflow-hidden bg-cf-black">
      <iframe
        src={`/admin.html?tenant=${normalizedSlug}`}
        className="w-full h-full border-none"
        title={`Admin ${tenant.name}`}
      />
    </div>
  );
}
