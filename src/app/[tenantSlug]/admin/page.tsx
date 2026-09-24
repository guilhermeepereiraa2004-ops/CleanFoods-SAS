'use client';

import { use, useEffect, useState } from 'react';
import { Tenant, getTenantBySlug } from '@/lib/mockStorage';

export default function LegacyAdminPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
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
        O iframe carrega o arquivo HTML original (Vanilla JS e CSS exato) do Admin.
        O saas-injector.js rodando dentro do iframe adicionará um botão "Configurar Franquia (SaaS)"
        que redirecionará para a tela de configurações /config
      */}
      <iframe 
        src={`/admin.html?tenant=${tenantSlug}`} 
        className="w-full h-full border-none"
        title={`Admin ${tenant.name}`}
      />
    </div>
  );
}
