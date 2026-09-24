'use client';

import { useState, useEffect, use } from 'react';
import { Tenant, getTenantBySlug, saveTenant } from '@/lib/mockStorage';

export default function TenantConfigPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const unwrappedParams = use(params);
  const { tenantSlug } = unwrappedParams;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<'personalizacao' | 'pagamentos'>('personalizacao');

  useEffect(() => {
    setIsClient(true);
    setTenant(getTenantBySlug(tenantSlug));
  }, [tenantSlug]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (tenant) {
      saveTenant(tenant);
      alert('Configurações salvas com sucesso!');
      window.location.href = `/${tenant.slug}/admin`;
    }
  };

  if (!isClient) return null;
  if (!tenant) return <div className="p-8 text-white">Loja não encontrada.</div>;

  return (
    <div className="min-h-screen bg-cf-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b-2 border-cf-gray pb-4">
          <h1 className="font-impact text-4xl text-cf-yellow uppercase">
            Personalizar SaaS: {tenant.name}
          </h1>
          <a href={`/${tenant.slug}/admin`} className="bg-cf-darkgray px-4 py-2 text-sm hover:bg-cf-gray">
            Voltar ao Admin
          </a>
        </div>

        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setActiveTab('personalizacao')}
            className={`px-4 py-2 font-bold uppercase text-sm ${activeTab === 'personalizacao' ? 'bg-cf-yellow text-cf-black' : 'bg-cf-darkgray'}`}
          >
            Personalização (Visual)
          </button>
          <button 
            onClick={() => setActiveTab('pagamentos')}
            className={`px-4 py-2 font-bold uppercase text-sm ${activeTab === 'pagamentos' ? 'bg-cf-yellow text-cf-black' : 'bg-cf-darkgray'}`}
          >
            Integrações (Pagamento)
          </button>
        </div>

        <form onSubmit={handleSave} className="bg-cf-darkgray border-2 border-cf-gray p-6">
          {activeTab === 'personalizacao' && (
            <div className="space-y-6">
                            <div>
                                <label className="block text-xs uppercase font-bold text-cf-yellow mb-2">URL do Logo</label>
                                <input 
                                  type="text" 
                                  value={tenant.logoUrl || ''}
                                  onChange={(e) => setTenant({ ...tenant, logoUrl: e.target.value })}
                                  className="w-full bg-cf-black border border-cf-gray p-2 text-white outline-none focus:border-cf-yellow" 
                                  placeholder="Link direto da imagem (ex: https://site.com/logo.png)"
                                />
                                {tenant.logoUrl && <img src={tenant.logoUrl} alt="Logo Preview" className="h-16 mt-2 object-contain" />}
                            </div>

                            <div>
                                <label className="block text-xs uppercase font-bold text-cf-yellow mb-2 mt-4">URL da Imagem da Página Inicial (Hero Image)</label>
                                <input 
                                  type="text" 
                                  value={tenant.heroImageUrl || ''}
                                  onChange={(e) => setTenant({ ...tenant, heroImageUrl: e.target.value })}
                                  className="w-full bg-cf-black border border-cf-gray p-2 text-white outline-none focus:border-cf-yellow" 
                                  placeholder="Deixe em branco para usar a imagem padrão do sistema"
                                />
                                {tenant.heroImageUrl && <img src={tenant.heroImageUrl} alt="Hero Preview" className="h-32 mt-2 object-contain" />}
                            </div>

                            <div className="bg-cf-black p-4 border border-cf-gray rounded space-y-3 mt-4">
                                <h4 className="font-bold text-sm text-cf-yellow uppercase mb-2">Textos da Página Inicial (Hero)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Palavra 1 (Padrão: Dieta)</label>
                                        <input type="text" value={tenant.heroWord1 || ''} onChange={(e) => setTenant({...tenant, heroWord1: e.target.value})} className="w-full bg-cf-darkgray text-white border border-cf-gray rounded px-2 py-1 text-sm outline-none" placeholder="Dieta" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Palavra 2 (Padrão: LIMPA)</label>
                                        <input type="text" value={tenant.heroWord2 || ''} onChange={(e) => setTenant({...tenant, heroWord2: e.target.value})} className="w-full bg-cf-darkgray text-white border border-cf-gray rounded px-2 py-1 text-sm outline-none" placeholder="LIMPA" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Palavra 3 (Padrão: Treino)</label>
                                        <input type="text" value={tenant.heroWord3 || ''} onChange={(e) => setTenant({...tenant, heroWord3: e.target.value})} className="w-full bg-cf-darkgray text-white border border-cf-gray rounded px-2 py-1 text-sm outline-none" placeholder="Treino" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Palavra 4 (Padrão: PESADO.)</label>
                                        <input type="text" value={tenant.heroWord4 || ''} onChange={(e) => setTenant({...tenant, heroWord4: e.target.value})} className="w-full bg-cf-darkgray text-white border border-cf-gray rounded px-2 py-1 text-sm outline-none" placeholder="PESADO." />
                                    </div>
                                </div>
                            </div>

              <div>
                <label className="block text-xs uppercase font-bold text-cf-yellow mb-2">Tema / Design Base</label>
                <select 
                  value={tenant.theme}
                  onChange={(e) => setTenant({ ...tenant, theme: e.target.value })}
                  className="w-full bg-cf-black border border-cf-gray p-2 text-white outline-none focus:border-cf-yellow"
                >
                  <option value="design1">1. Design Padrão Original (Bordas quadradas com efeito rasgado)</option>
                  <option value="design2">2. Suave e Arredondado (Bordas arredondadas e amigáveis)</option>
                  <option value="design3">3. Minimalista (Sem bordas e fundos limpos, focado em imagens)</option>
                  <option value="design4">4. Lista Compacta (Produtos alinhados em formato de lista)</option>
                  <option value="design5">5. Sombra Elevada (Cartões flutuando com sombras suaves)</option>
                  <option value="design6">6. Neon Cyberpunk (Brilho na cor primária nas bordas e botões)</option>
                  <option value="design7">7. Flat Moderno (Cards sem borda com fundo acinzentado sólido)</option>
                  <option value="design8">8. Tipografia Maximizada (Textos e Preços muito maiores)</option>
                  <option value="design9">9. Retrô Block (Sombras sólidas deslocadas em estilo HQ/Retro)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-cf-yellow mb-2">Cor Primária (Paleta)</label>
                <p className="text-xs text-gray-400 mb-2">O fundo continuará no Padrão Preto, mas esta cor alterará os botões, títulos e detalhes de todo o sistema.</p>
                <div className="flex items-center gap-4">
                  <input 
                    type="color" 
                    value={tenant.primaryColor}
                    onChange={(e) => setTenant({ ...tenant, primaryColor: e.target.value })}
                    className="h-10 w-20 cursor-pointer" 
                  />
                  <span className="font-mono text-sm">{tenant.primaryColor}</span>
                </div>
              </div>

              <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs uppercase font-bold text-cf-yellow mb-2">Tipografia (Títulos)</label>
                    <select 
                      value={tenant.fontFamily}
                      onChange={(e) => setTenant({ ...tenant, fontFamily: e.target.value })}
                      className="w-full bg-cf-black border border-cf-gray p-2 text-white outline-none focus:border-cf-yellow"
                    >
                      <option value="Inter">1. Inter (Moderna / Neutra)</option>
                      <option value="Anton">2. Anton (Ousada / Impacto - Padrão)</option>
                      <option value="Permanent Marker">3. Permanent Marker (Urbana / Street)</option>
                      <option value="Roboto">4. Roboto (Clássica do Google)</option>
                      <option value="Montserrat">5. Montserrat (Geométrica / Elegante)</option>
                      <option value="Poppins">6. Poppins (Arredondada / Amigável)</option>
                      <option value="Lato">7. Lato (Leve e Harmônica)</option>
                      <option value="Oswald">8. Oswald (Alta e Fina / Revista)</option>
                      <option value="Playfair Display">9. Playfair Display (Serifada Clássica)</option>
                      <option value="Fredoka One">10. Fredoka (Descontraída / Fun)</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs uppercase font-bold text-cf-yellow mb-2">Tipografia (Corpo/Cardápio)</label>
                    <select 
                      value={tenant.bodyFontFamily || tenant.fontFamily}
                      onChange={(e) => setTenant({ ...tenant, bodyFontFamily: e.target.value })}
                      className="w-full bg-cf-black border border-cf-gray p-2 text-white outline-none focus:border-cf-yellow"
                    >
                      <option value="Inter">1. Inter (Moderna / Neutra)</option>
                      <option value="Roboto">2. Roboto (Clássica do Google)</option>
                      <option value="Montserrat">3. Montserrat (Geométrica / Elegante)</option>
                      <option value="Poppins">4. Poppins (Arredondada / Amigável)</option>
                      <option value="Lato">5. Lato (Leve e Harmônica)</option>
                      <option value="Oswald">6. Oswald (Alta e Fina)</option>
                      <option value="Arial">7. Arial (Clássica)</option>
                    </select>
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'pagamentos' && (
            <div className="space-y-6">
              <div className="p-4 bg-cf-black border border-cf-gray">
                <h3 className="font-bold text-lg mb-2 text-blue-400"><i className="fa-brands fa-cc-stripe"></i> Mercado Pago</h3>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Public Key</label>
                <input 
                  type="text" 
                  value={tenant.mercadoPagoKey || ''}
                  onChange={(e) => setTenant({ ...tenant, mercadoPagoKey: e.target.value })}
                  className="w-full bg-cf-darkgray border border-cf-gray p-2 text-white outline-none focus:border-blue-400" 
                  placeholder="APP_USR-..."
                />
              </div>
            </div>
          )}

          <div className="mt-8">
            <button type="submit" className="w-full bg-cf-yellow text-cf-black font-bold uppercase py-3 text-lg torn-edge hover:opacity-90 transition-opacity">
              Salvar Configurações
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
