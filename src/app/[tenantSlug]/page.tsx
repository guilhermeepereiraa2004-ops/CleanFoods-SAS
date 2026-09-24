'use client';

import { use, useEffect, useState } from 'react';
import { Tenant, getTenantBySlug } from '@/lib/mockStorage';

export default function StorefrontPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const unwrappedParams = use(params);
  const { tenantSlug } = unwrappedParams;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTenant(getTenantBySlug(tenantSlug));
  }, [tenantSlug]);

  if (!isClient) return null;
  if (!tenant) return <div className="p-8 text-white bg-cf-black h-screen">Loja não encontrada.</div>;

  return (
    <div className="w-full h-screen overflow-hidden bg-cf-black">
      {/* 
        A URL passa o tenantSlug para o HTML poder aplicar o tema dinâmico via JS.
        Dependendo da configuração de design, carregamos um HTML estruturalmente diferente.
      */}
      <iframe 
        src={`/${tenant.theme === 'design1' ? 'index.html' : `index-${tenant.theme.replace('design', '')}.html`}?tenant=${tenantSlug}`} 
        className="w-full h-full border-none"
        title={`Loja ${tenant.name}`}
      />
    </div>
  );
}
