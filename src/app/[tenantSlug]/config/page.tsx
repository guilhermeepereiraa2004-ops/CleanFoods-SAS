'use client';

import { useState, useEffect, use } from 'react';
import { Tenant, getTenantBySlug, saveTenant, MasterConfig, getMasterConfig } from '@/lib/mockStorage';

export default function TenantConfigPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const unwrappedParams = use(params);
  const { tenantSlug } = unwrappedParams;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<'personalizacao' | 'pagamentos'>('personalizacao');
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [masterConfig, setMasterConfig] = useState<MasterConfig | null>(null);
  
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    setIsClient(true);
    setTenant(getTenantBySlug(tenantSlug));
    setMasterConfig(getMasterConfig());
    const authStatus = localStorage.getItem(`tenant_auth_${tenantSlug}`);
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, [tenantSlug]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (tenant && loginUser === tenant.adminUser && loginPass === tenant.adminPassword) {
      setIsAuthenticated(true);
      localStorage.setItem(`tenant_auth_${tenantSlug}`, 'true');
      setLoginError('');
    } else {
      setLoginError('Usuário ou senha incorretos!');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (tenant) {
      saveTenant(tenant);
      showToast('Configurações salvas com sucesso!');
      setTimeout(() => {
        window.location.href = `/${tenant.slug}/admin`;
      }, 1000);
    }
  };

  if (!isClient) return null;
  if (!tenant) return <div className="p-8 text-white">Loja não encontrada.</div>;

  if (!isAuthenticated && tenant.adminUser) {
    return (
      <div className="min-h-screen bg-cf-black flex items-center justify-center p-4">
        <div className="bg-cf-darkgray border-2 border-cf-yellow p-8 w-full max-w-md torn-edge">
          <h1 className="font-impact text-3xl text-cf-yellow text-center mb-6 uppercase tracking-widest">Painel do Franqueado</h1>
          <p className="text-center text-gray-400 mb-6 font-bold">{tenant.name}</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Usuário</label>
              <input 
                type="text" value={loginUser} onChange={(e) => setLoginUser(e.target.value)}
                className="w-full bg-cf-black border border-cf-gray p-3 text-white outline-none focus:border-cf-yellow" 
                placeholder="Seu usuário..."
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Senha</label>
              <input 
                type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)}
                className="w-full bg-cf-black border border-cf-gray p-3 text-white outline-none focus:border-cf-yellow" 
                placeholder="********"
              />
            </div>
            {loginError && <p className="text-red-500 text-sm font-bold">{loginError}</p>}
            <button type="submit" className="w-full bg-cf-yellow text-cf-black font-bold uppercase py-3 mt-4 hover:bg-white transition-colors">
              Acessar Painel
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Verifica Bloqueio de Fatura
  const currentDay = new Date().getDate();
  const paymentDay = parseInt(tenant.paymentDay || '0', 10);
  const isDue = tenant.paymentStatus === 'pendente' && paymentDay > 0 && currentDay >= paymentDay;

  return (
    <div className="min-h-screen bg-cf-black text-white p-8 relative">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-cf-yellow text-cf-black font-bold px-6 py-3 border-2 border-cf-black shadow-[4px_4px_0_rgba(255,255,255,1)] z-50 flex items-center gap-3">
          <i className="fa-solid fa-circle-check text-xl"></i>
          {toastMessage}
        </div>
      )}

      {isDue && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-cf-darkgray border-2 border-red-500 p-8 max-w-md w-full torn-edge relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
            <div className="text-center mb-6">
              <i className="fa-solid fa-triangle-exclamation text-6xl text-red-500 mb-4"></i>
              <h2 className="font-impact text-3xl uppercase text-red-500">Acesso Bloqueado</h2>
              <p className="text-gray-300 mt-2 font-bold">Mensalidade Pendente</p>
            </div>
            
            <p className="text-sm text-gray-400 text-center mb-6 leading-relaxed">
              Identificamos que o pagamento referente ao dia <strong>{tenant.paymentDay}</strong> ainda consta como pendente em nosso sistema.
            </p>

            <div className="bg-black border border-cf-gray p-4 mb-6 text-center rounded">
              <p className="text-xs uppercase font-bold text-cf-yellow mb-2">Chave PIX para Pagamento</p>
              <p className="font-mono text-lg text-white select-all">{masterConfig?.pixKey || 'Chave PIX não configurada'}</p>
              {masterConfig?.pixName && (
                <p className="text-xs text-gray-500 mt-2 font-bold uppercase">Favorecido: <span className="text-gray-300">{masterConfig.pixName}</span></p>
              )}
            </div>

            <p className="text-xs text-gray-500 text-center">
              Realize o pagamento e envie o comprovante para o administrador liberar seu acesso.
            </p>
          </div>
        </div>
      )}

      <div className={`max-w-4xl mx-auto ${isDue ? 'opacity-20 pointer-events-none blur-sm' : ''}`}>
        <div className="flex justify-between items-center mb-8 border-b-2 border-cf-gray pb-4">
          <h1 className="font-impact text-4xl text-cf-yellow uppercase">
            Personalizar SaaS: {tenant.name}
          </h1>
          <div className="flex gap-4">
            <a href={`/${tenant.slug}`} target="_blank" className="bg-cf-yellow text-cf-black font-bold px-4 py-2 text-sm hover:bg-white">
              Ver Loja
            </a>
            <button onClick={() => {
              localStorage.removeItem(`tenant_auth_${tenantSlug}`);
              window.location.reload();
            }} className="bg-gray-800 text-red-400 font-bold px-4 py-2 text-sm hover:bg-red-900/50">
              Sair
            </button>
          </div>
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
                                <label className="block text-xs uppercase font-bold text-cf-yellow mb-2">Logo da Franquia</label>
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setTenant({ ...tenant, logoUrl: reader.result as string });
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="w-full bg-cf-black border border-cf-gray p-2 text-white outline-none focus:border-cf-yellow cursor-pointer" 
                                />
                                {tenant.logoUrl && (
                                  <div className="mt-4 p-2 bg-black border border-cf-gray rounded inline-block">
                                    <p className="text-xs text-gray-400 mb-2">Preview da Logo:</p>
                                    <img src={tenant.logoUrl} alt="Logo Preview" className="h-16 object-contain bg-white/10 p-2 rounded" />
                                  </div>
                                )}
                                <div className="mt-4">
                                    <label className="block text-xs text-gray-400 mb-1">Tamanho da Logo: {tenant.logoSize || '100'}%</label>
                                    <input type="range" min="50" max="250" step="5" value={tenant.logoSize || '100'} onChange={(e) => setTenant({...tenant, logoSize: e.target.value})} className="w-full max-w-sm accent-cf-yellow cursor-pointer" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase font-bold text-cf-yellow mb-2 mt-4">Imagem da Página Inicial (Hero Image)</label>
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setTenant({ ...tenant, heroImageUrl: reader.result as string });
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="w-full bg-cf-black border border-cf-gray p-2 text-white outline-none focus:border-cf-yellow cursor-pointer" 
                                />
                                {tenant.heroImageUrl && (
                                  <div className="mt-4 p-2 bg-black border border-cf-gray rounded inline-block">
                                    <p className="text-xs text-gray-400 mb-2">Preview:</p>
                                    <img src={tenant.heroImageUrl} alt="Hero Preview" className="h-40 object-contain" />
                                  </div>
                                )}
                                <div className="mt-4">
                                    <label className="block text-xs text-gray-400 mb-1">Tamanho da Imagem: {tenant.heroImageSize || '100'}%</label>
                                    <input type="range" min="50" max="150" step="5" value={tenant.heroImageSize || '100'} onChange={(e) => setTenant({...tenant, heroImageSize: e.target.value})} className="w-full max-w-sm accent-cf-yellow cursor-pointer" />
                                </div>
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
                                <div className="mt-4">
                                    <label className="block text-xs text-gray-400 mb-1">Subtítulo (Abaixo das palavras)</label>
                                    <textarea 
                                      value={tenant.heroSubtitle !== undefined ? tenant.heroSubtitle : 'Marmitas fitness reais para quem treina de verdade. Sem glúten, sem lactose.'} 
                                      onChange={(e) => setTenant({...tenant, heroSubtitle: e.target.value})} 
                                      className="w-full bg-cf-darkgray text-white border border-cf-gray rounded px-2 py-2 text-sm outline-none resize-none" 
                                      rows={2}
                                      placeholder="Marmitas fitness reais..." 
                                    />
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Tipografia do Subtítulo</label>
                                            <select 
                                              value={tenant.heroSubtitleFont || tenant.bodyFontFamily || tenant.fontFamily || 'Inter'}
                                              onChange={(e) => setTenant({ ...tenant, heroSubtitleFont: e.target.value })}
                                              className="w-full bg-cf-darkgray text-white border border-cf-gray rounded px-2 py-1 text-sm outline-none focus:border-cf-yellow"
                                            >
                                              <option value="Inter">Inter (Moderna / Neutra)</option>
                                              <option value="Anton">Anton (Ousada / Impacto)</option>
                                              <option value="Permanent Marker">Permanent Marker (Urbana / Street)</option>
                                              <option value="Roboto">Roboto (Clássica do Google)</option>
                                              <option value="Montserrat">Montserrat (Geométrica / Elegante)</option>
                                              <option value="Poppins">Poppins (Arredondada / Amigável)</option>
                                              <option value="Lato">Lato (Leve e Harmônica)</option>
                                              <option value="Oswald">Oswald (Alta e Fina / Revista)</option>
                                              <option value="Playfair Display">Playfair Display (Serifada Clássica)</option>
                                              <option value="Fredoka One">Fredoka (Descontraída / Fun)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Tamanho: {tenant.heroSubtitleSize || '100'}%</label>
                                            <input type="range" min="50" max="250" step="5" value={tenant.heroSubtitleSize || '100'} onChange={(e) => setTenant({...tenant, heroSubtitleSize: e.target.value})} className="w-full accent-cf-yellow cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-cf-gray mt-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Cor do Texto Principal</label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={tenant.heroFontColor || '#ffffff'} onChange={(e) => setTenant({...tenant, heroFontColor: e.target.value})} className="h-8 w-12 cursor-pointer bg-cf-darkgray border border-cf-gray" />
                                            <span className="text-xs font-mono text-gray-400">{tenant.heroFontColor || '#ffffff'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Tamanho da Fonte: {tenant.heroFontSize || '100'}%</label>
                                        <input type="range" min="50" max="150" step="5" value={tenant.heroFontSize || '100'} onChange={(e) => setTenant({...tenant, heroFontSize: e.target.value})} className="w-full accent-cf-yellow cursor-pointer" />
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
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
                  <div>
                    <label className="block text-xs uppercase font-bold text-cf-yellow mb-2">Tipografia (Corpo/Cardápio)</label>
                    <select 
                      value={tenant.bodyFontFamily || tenant.fontFamily}
                      onChange={(e) => setTenant({ ...tenant, bodyFontFamily: e.target.value })}
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
                  <div>
                    <label className="block text-xs uppercase font-bold text-cf-yellow mb-2">Tipografia (Frase Hero)</label>
                    <select 
                      value={tenant.heroFontFamily || tenant.fontFamily}
                      onChange={(e) => setTenant({ ...tenant, heroFontFamily: e.target.value })}
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
