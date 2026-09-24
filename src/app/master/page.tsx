'use client';

import { useState, useEffect } from 'react';
import { Tenant, getTenants, saveTenant } from '@/lib/mockStorage';

export default function MasterAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [newTenant, setNewTenant] = useState({ name: '', slug: '' });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTenants(getTenants());
  }, []);

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.slug) return;
    
    const tenant: Tenant = {
      id: crypto.randomUUID(),
      name: newTenant.name,
      slug: newTenant.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      theme: 'default',
      primaryColor: '#F6C500',
      fontFamily: '--font-body',
      createdAt: new Date().toISOString()
    };
    
    saveTenant(tenant);
    setTenants(getTenants());
    setNewTenant({ name: '', slug: '' });
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-cf-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-impact text-4xl text-cf-yellow uppercase mb-8">Master Admin - Gestão SaaS</h1>
        
        <div className="bg-cf-darkgray border-2 border-cf-yellow p-6 torn-edge mb-8">
          <h2 className="font-street text-2xl mb-4">Nova Franquia</h2>
          <form onSubmit={handleCreateTenant} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs uppercase font-bold text-cf-yellow mb-1">Nome da Loja</label>
              <input 
                type="text" 
                value={newTenant.name}
                onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                className="w-full bg-cf-black border border-cf-gray p-2 text-white outline-none focus:border-cf-yellow" 
                placeholder="Ex: CleanFoods Bahia"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs uppercase font-bold text-cf-yellow mb-1">Slug (Subdomínio)</label>
              <input 
                type="text" 
                value={newTenant.slug}
                onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value })}
                className="w-full bg-cf-black border border-cf-gray p-2 text-white outline-none focus:border-cf-yellow" 
                placeholder="Ex: bahia"
              />
            </div>
            <button type="submit" className="bg-cf-yellow text-cf-black font-bold uppercase px-6 py-2">
              Criar Loja
            </button>
          </form>
        </div>

        <div className="bg-cf-darkgray border-2 border-cf-gray p-6">
          <h2 className="font-street text-2xl mb-4 text-cf-yellow">Franquias Ativas</h2>
          <div className="grid gap-4">
            {tenants.map(t => (
              <div key={t.id} className="flex justify-between items-center bg-cf-black p-4 border border-cf-gray">
                <div>
                  <h3 className="font-bold text-lg">{t.name}</h3>
                  <p className="text-xs text-gray-400">/{t.slug}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`/${t.slug}/admin`} target="_blank" className="text-sm bg-gray-700 px-3 py-1 hover:bg-gray-600">
                    Acessar Admin
                  </a>
                  <a href={`/${t.slug}`} target="_blank" className="text-sm bg-cf-yellow text-cf-black font-bold px-3 py-1 hover:bg-yellow-400">
                    Ver Loja
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
