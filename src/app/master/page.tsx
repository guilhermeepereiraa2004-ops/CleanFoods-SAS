'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Tenant, getTenants, saveTenant, deleteTenant, MasterConfig, getMasterConfig, saveMasterConfig } from '@/lib/mockStorage';
import { normalizeTenantSlug } from '@/lib/tenants';
import {
  deleteMasterTenant,
  loadMasterTenants,
  logoutMaster,
  saveMasterTenant,
  type MasterTenantInput,
} from './actions';

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function toMasterTenantInput(tenant: Tenant): MasterTenantInput {
  return {
    id: tenant.id, slug: tenant.slug, name: tenant.name, logoUrl: tenant.logoUrl,
    theme: tenant.theme, primaryColor: tenant.primaryColor, fontFamily: tenant.fontFamily,
    bodyFontFamily: tenant.bodyFontFamily, heroFontFamily: tenant.heroFontFamily,
    heroWord1: tenant.heroWord1, heroWord2: tenant.heroWord2, heroWord3: tenant.heroWord3,
    heroWord4: tenant.heroWord4, heroImageUrl: tenant.heroImageUrl,
    heroFontColor: tenant.heroFontColor, heroFontSize: tenant.heroFontSize,
    heroImageSize: tenant.heroImageSize, heroSubtitle: tenant.heroSubtitle,
    heroSubtitleFont: tenant.heroSubtitleFont, heroSubtitleSize: tenant.heroSubtitleSize,
    logoSize: tenant.logoSize, paymentDay: tenant.paymentDay, paymentStatus: tenant.paymentStatus,
  };
}

export default function MasterAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>(getTenants);
  const [masterConfig, setMasterConfig] = useState<MasterConfig>(getMasterConfig);
  const isClient = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [activeModule, setActiveModule] = useState<'franquias' | 'nova' | 'cobranca' | 'config'>('franquias');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    let cancelled = false;

    async function synchronizeTenants() {
      const localTenants = getTenants();
      const legacyTenants = localTenants
        .filter((tenant) => tenant.id !== 'tenant-1')
        .map(toMasterTenantInput);

      try {
        const databaseTenants = await loadMasterTenants(legacyTenants);
        if (cancelled) return;

        const synchronized = databaseTenants.map((databaseTenant) => {
          const localTenant = localTenants.find(
            (tenant) => normalizeTenantSlug(tenant.slug) === databaseTenant.slug,
          );
          const tenant: Tenant = {
            ...databaseTenant,
            adminUser: localTenant?.adminUser,
            adminPassword: localTenant?.adminPassword,
            mercadoPagoKey: localTenant?.mercadoPagoKey,
          };
          saveTenant(tenant);
          return tenant;
        });

        setTenants(synchronized);
        if (legacyTenants.length > 0) showToast('Lojas sincronizadas com o Supabase!');
      } catch (error) {
        if (!cancelled) {
          showToast(error instanceof Error ? error.message : 'Falha ao sincronizar as lojas.');
        }
      }
    }

    void synchronizeTenants();
    return () => { cancelled = true; };
  }, []);

  // Form states
  const [newTenant, setNewTenant] = useState({ 
    name: '', slug: '', adminUser: '', adminPassword: '', paymentDay: '' 
  });
  
  // Edit states
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [editTenantForm, setEditTenantForm] = useState({
    name: '', slug: '', adminUser: '', adminPassword: '', paymentDay: ''
  });

  // Delete states
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.slug || !newTenant.adminUser || !newTenant.adminPassword) return;
    
    const tenant: Tenant = {
      id: crypto.randomUUID(),
      name: newTenant.name,
      slug: normalizeTenantSlug(newTenant.slug),
      theme: 'design2',
      primaryColor: '#F6C500',
      fontFamily: 'Inter',
      adminUser: newTenant.adminUser,
      adminPassword: newTenant.adminPassword,
      paymentDay: newTenant.paymentDay || '15',
      paymentStatus: 'pago',
      createdAt: new Date().toISOString()
    };
    
    try {
      const savedTenant = await saveMasterTenant(toMasterTenantInput(tenant));
      saveTenant({ ...savedTenant, adminUser: tenant.adminUser, adminPassword: tenant.adminPassword });
      setTenants(getTenants().filter((item) => item.id !== 'tenant-1'));
      setNewTenant({ name: '', slug: '', adminUser: '', adminPassword: '', paymentDay: '' });
      setActiveModule('franquias');
      showToast('Franquia criada com sucesso!');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Não foi possível criar a franquia.');
    }
  };

  const togglePaymentStatus = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      const novoStatus = tenant.paymentStatus === 'pago' ? 'pendente' : 'pago';
      const updatedTenant: Tenant = { ...tenant, paymentStatus: novoStatus };
      try {
        const savedTenant = await saveMasterTenant(toMasterTenantInput(updatedTenant));
        saveTenant({
          ...savedTenant,
          adminUser: tenant.adminUser,
          adminPassword: tenant.adminPassword,
          mercadoPagoKey: tenant.mercadoPagoKey,
        });
        setTenants(getTenants().filter((item) => item.id !== 'tenant-1'));
        showToast(`Status alterado para ${novoStatus.toUpperCase()}`);
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Não foi possível alterar o status.');
      }
    }
  };

  const handleStartEdit = (t: Tenant) => {
    setEditingTenantId(t.id);
    setEditTenantForm({
      name: t.name,
      slug: t.slug,
      adminUser: t.adminUser || '',
      adminPassword: t.adminPassword || '',
      paymentDay: t.paymentDay || ''
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenantId) return;

    const tenant = tenants.find(t => t.id === editingTenantId);
    if (tenant) {
      const updatedTenant: Tenant = {
        ...tenant,
        name: editTenantForm.name,
        slug: normalizeTenantSlug(editTenantForm.slug),
        adminUser: editTenantForm.adminUser,
        adminPassword: editTenantForm.adminPassword || tenant.adminPassword,
        paymentDay: editTenantForm.paymentDay,
      };
      try {
        const savedTenant = await saveMasterTenant(toMasterTenantInput(updatedTenant));
        saveTenant({
          ...savedTenant,
          adminUser: updatedTenant.adminUser,
          adminPassword: updatedTenant.adminPassword,
          mercadoPagoKey: tenant.mercadoPagoKey,
        });
        setTenants(getTenants().filter((item) => item.id !== 'tenant-1'));
        setEditingTenantId(null);
        showToast('Dados da loja atualizados!');
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Não foi possível atualizar a loja.');
      }
    }
  };

  const handleDeleteTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tenantToDelete && deleteConfirmation === tenantToDelete.slug) {
      try {
        await deleteMasterTenant(tenantToDelete.id);
        deleteTenant(tenantToDelete.id);
        setTenants(getTenants().filter((item) => item.id !== 'tenant-1'));
        setTenantToDelete(null);
        setDeleteConfirmation('');
        setDeleteError('');
        showToast('Franquia deletada com sucesso!');
      } catch (error) {
        setDeleteError(error instanceof Error ? error.message : 'Não foi possível apagar a loja.');
      }
    } else {
      setDeleteError('Digite o slug exato da loja para confirmar.');
    }
  };

  const handleSaveMasterConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveMasterConfig(masterConfig);
    showToast('Configurações do Master atualizadas!');
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-cf-black text-white flex relative">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-cf-yellow text-cf-black font-bold px-6 py-3 border-2 border-cf-black shadow-[4px_4px_0_rgba(255,255,255,1)] z-50 flex items-center gap-3">
          <i className="fa-solid fa-circle-check text-xl"></i>
          {toastMessage}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {tenantToDelete && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-cf-darkgray border-2 border-red-500 p-8 max-w-md w-full torn-edge">
            <h2 className="font-impact text-3xl uppercase text-red-500 mb-4">Atenção!</h2>
            <p className="text-gray-300 mb-6">
              Você está prestes a apagar a loja <strong>{tenantToDelete.name}</strong>. Esta ação não pode ser desfeita.
            </p>
            <form onSubmit={handleDeleteTenant} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs uppercase font-bold text-gray-400 mb-1">
                  Digite {tenantToDelete.slug} para confirmar
                </label>
                <input 
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full bg-cf-black border border-cf-gray p-3 text-white outline-none focus:border-red-500" 
                  placeholder={tenantToDelete.slug}
                />
              </div>
              {deleteError && <p className="text-red-500 text-sm font-bold">{deleteError}</p>}
              <div className="flex gap-2 mt-4">
                <button type="submit" className="flex-1 bg-red-600 text-white font-bold uppercase py-3 hover:bg-red-500">
                  Apagar Loja
                </button>
                <button type="button" onClick={() => { setTenantToDelete(null); setDeleteConfirmation(''); setDeleteError(''); }} className="flex-1 bg-gray-600 text-white font-bold uppercase py-3 hover:bg-gray-500">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar / Menu */}
      <div className="w-64 bg-cf-darkgray border-r border-cf-gray flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-cf-gray">
          <h1 className="font-impact text-2xl text-cf-yellow uppercase">CleanFoods</h1>
          <p className="text-xs text-gray-400 uppercase font-bold">Painel Master</p>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <button 
            onClick={() => setActiveModule('franquias')}
            className={`text-left px-4 py-3 font-bold uppercase text-sm ${activeModule === 'franquias' ? 'bg-cf-yellow text-cf-black' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            <i className="fa-solid fa-store mr-2"></i> Lojas Ativas
          </button>
          <button 
            onClick={() => setActiveModule('nova')}
            className={`text-left px-4 py-3 font-bold uppercase text-sm ${activeModule === 'nova' ? 'bg-cf-yellow text-cf-black' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            <i className="fa-solid fa-plus mr-2"></i> Nova Franquia
          </button>
          <button 
            onClick={() => setActiveModule('cobranca')}
            className={`text-left px-4 py-3 font-bold uppercase text-sm ${activeModule === 'cobranca' ? 'bg-cf-yellow text-cf-black' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            <i className="fa-solid fa-file-invoice-dollar mr-2"></i> Cobrança
          </button>
          <button 
            onClick={() => setActiveModule('config')}
            className={`text-left px-4 py-3 font-bold uppercase text-sm ${activeModule === 'config' ? 'bg-cf-yellow text-cf-black' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            <i className="fa-solid fa-gear mr-2"></i> Configurações
          </button>
        </nav>
        <div className="p-4 border-t border-cf-gray">
          <form action={logoutMaster}>
            <button type="submit" className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 uppercase font-bold">
              <i className="fa-solid fa-right-from-bracket mr-2"></i> Sair
            </button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* MODULE: Franquias Ativas */}
        {activeModule === 'franquias' && (
          <div>
            <h2 className="font-impact text-4xl mb-8 uppercase text-cf-yellow">Franquias Ativas</h2>
            <div className="grid gap-4">
              {tenants.map(t => (
                <div key={t.id} className="bg-cf-darkgray p-5 border border-cf-gray rounded shadow-lg">
                  {editingTenantId === t.id ? (
                    <form onSubmit={handleSaveEdit} className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Nome da Loja</label>
                        <input type="text" required value={editTenantForm.name} onChange={(e) => setEditTenantForm({ ...editTenantForm, name: e.target.value })} className="w-full bg-cf-black border border-cf-gray p-2 text-white outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Slug</label>
                        <input type="text" required value={editTenantForm.slug} onChange={(e) => setEditTenantForm({ ...editTenantForm, slug: e.target.value })} className="w-full bg-cf-black border border-cf-gray p-2 text-white outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Usuário / Login</label>
                        <input type="text" value={editTenantForm.adminUser} onChange={(e) => setEditTenantForm({ ...editTenantForm, adminUser: e.target.value })} className="w-full bg-cf-black border border-cf-gray p-2 text-white outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Senha</label>
                        <input type="text" value={editTenantForm.adminPassword} onChange={(e) => setEditTenantForm({ ...editTenantForm, adminPassword: e.target.value })} className="w-full bg-cf-black border border-cf-gray p-2 text-white outline-none" placeholder="Deixe em branco para manter" />
                      </div>
                      <div>
                        <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Dia do Vencimento</label>
                        <input type="number" min="1" max="31" value={editTenantForm.paymentDay} onChange={(e) => setEditTenantForm({ ...editTenantForm, paymentDay: e.target.value })} className="w-full bg-cf-black border border-cf-gray p-2 text-white outline-none" />
                      </div>
                      <div className="flex items-end gap-2">
                        <button type="submit" className="bg-green-600 text-white font-bold px-4 py-2 hover:bg-green-500 rounded">Salvar</button>
                        <button type="button" onClick={() => setEditingTenantId(null)} className="bg-gray-600 text-white font-bold px-4 py-2 hover:bg-gray-500 rounded">Cancelar</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-xl">{t.name}</h3>
                        <p className="text-sm text-gray-400 font-mono mt-1">cleanfoodsp.com.br/{t.slug}</p>
                        <p className="text-xs text-cf-yellow mt-2"><i className="fa-solid fa-user"></i> {t.adminUser || 'Sem login'}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <div className="flex gap-2">
                          <button onClick={() => setTenantToDelete(t)} className="text-sm bg-red-900/50 text-red-400 border border-red-900 font-bold px-3 py-2 hover:bg-red-600 hover:text-white rounded min-w-[40px]">
                            <i className="fa-solid fa-trash"></i>
                          </button>
                          <button onClick={() => handleStartEdit(t)} className="text-sm bg-blue-600 text-white font-bold px-4 py-2 hover:bg-blue-500 rounded min-w-[80px]">
                            Editar
                          </button>
                          <a href={`/${t.slug}/admin`} target="_blank" className="text-sm bg-gray-700 text-white font-bold px-4 py-2 hover:bg-gray-600 rounded text-center min-w-[120px]">
                            Acessar Painel
                          </a>
                        </div>
                        <a href={`/${t.slug}`} target="_blank" className="text-sm bg-cf-yellow text-cf-black font-bold px-4 py-2 hover:bg-white rounded text-center w-full">
                          Ver Loja
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {tenants.length === 0 && <p className="text-gray-500">Nenhuma loja cadastrada ainda.</p>}
            </div>
          </div>
        )}

        {/* MODULE: Nova Franquia */}
        {activeModule === 'nova' && (
          <div>
            <h2 className="font-impact text-4xl mb-8 uppercase text-cf-yellow">Criar Nova Franquia</h2>
            <form onSubmit={handleCreateTenant} className="bg-cf-darkgray border border-cf-gray p-6 max-w-2xl">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Nome da Loja</label>
                  <input type="text" required value={newTenant.name} onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })} className="w-full bg-cf-black border border-cf-gray p-3 text-white outline-none focus:border-cf-yellow" placeholder="CleanFoods Bahia" />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Slug (URL)</label>
                  <input type="text" required value={newTenant.slug} onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value })} className="w-full bg-cf-black border border-cf-gray p-3 text-white outline-none focus:border-cf-yellow" placeholder="bahia" />
                </div>
              </div>
              
              <div className="border-t border-cf-gray pt-6 mb-6">
                <h3 className="font-bold text-cf-yellow mb-4 uppercase text-sm"><i className="fa-solid fa-lock mr-2"></i> Credenciais de Acesso (Dono da Loja)</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Usuário / Login</label>
                    <input type="text" required value={newTenant.adminUser} onChange={(e) => setNewTenant({ ...newTenant, adminUser: e.target.value })} className="w-full bg-cf-black border border-cf-gray p-3 text-white outline-none focus:border-cf-yellow" placeholder="bahia_admin" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Senha</label>
                    <input type="text" required value={newTenant.adminPassword} onChange={(e) => setNewTenant({ ...newTenant, adminPassword: e.target.value })} className="w-full bg-cf-black border border-cf-gray p-3 text-white outline-none focus:border-cf-yellow" placeholder="senha123" />
                  </div>
                </div>
              </div>

              <div className="border-t border-cf-gray pt-6 mb-6">
                <h3 className="font-bold text-cf-yellow mb-4 uppercase text-sm"><i className="fa-solid fa-money-bill mr-2"></i> Faturamento (Mensalidade)</h3>
                <div>
                  <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Dia do Vencimento (1 a 31)</label>
                  <input type="number" min="1" max="31" required value={newTenant.paymentDay} onChange={(e) => setNewTenant({ ...newTenant, paymentDay: e.target.value })} className="w-full bg-cf-black border border-cf-gray p-3 text-white outline-none focus:border-cf-yellow" placeholder="Ex: 15" />
                </div>
              </div>

              <button type="submit" className="w-full bg-cf-yellow text-cf-black font-bold uppercase py-4 hover:bg-white transition-colors mt-2 text-lg">
                Cadastrar Loja e Gerar Acessos
              </button>
            </form>
          </div>
        )}

        {/* MODULE: Cobrança */}
        {activeModule === 'cobranca' && (
          <div>
            <h2 className="font-impact text-4xl mb-8 uppercase text-cf-yellow">Gestão de Cobranças</h2>
            
            <div className="bg-cf-darkgray border border-cf-gray rounded overflow-hidden shadow-lg">
              <table className="w-full text-left">
                <thead className="bg-[#111] border-b border-cf-gray">
                  <tr>
                    <th className="p-4 font-bold uppercase text-xs text-gray-400">Franquia</th>
                    <th className="p-4 font-bold uppercase text-xs text-gray-400">Dia de Vencimento</th>
                    <th className="p-4 font-bold uppercase text-xs text-gray-400">Status</th>
                    <th className="p-4 font-bold uppercase text-xs text-gray-400 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => (
                    <tr key={t.id} className="border-b border-[#222] hover:bg-[#1a1a1a]">
                      <td className="p-4">
                        <div className="font-bold">{t.name}</div>
                        <div className="text-xs text-gray-500 font-mono mt-1">/{t.slug}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-cf-yellow">Dia {t.paymentDay || 'Não definido'}</div>
                      </td>
                      <td className="p-4">
                        {t.paymentStatus === 'pago' ? (
                          <span className="bg-green-900/50 text-green-400 text-xs font-bold px-3 py-1 rounded-full uppercase border border-green-800">Pago</span>
                        ) : (
                          <span className="bg-red-900/50 text-red-400 text-xs font-bold px-3 py-1 rounded-full uppercase border border-red-800">Pendente</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => togglePaymentStatus(t.id)}
                          className={`text-xs font-bold uppercase px-4 py-2 rounded ${t.paymentStatus === 'pago' ? 'bg-gray-700 text-white hover:bg-red-600' : 'bg-cf-yellow text-cf-black hover:bg-white'}`}
                        >
                          {t.paymentStatus === 'pago' ? 'Marcar Pendente' : 'Marcar Pago'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tenants.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">Nenhuma franquia ativa no momento.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODULE: Configurações do Master */}
        {activeModule === 'config' && (
          <div>
            <h2 className="font-impact text-4xl mb-8 uppercase text-cf-yellow">Configurações do Master</h2>
            <form onSubmit={handleSaveMasterConfig} className="bg-cf-darkgray border border-cf-gray p-6 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Chave PIX (Mensalidades)</label>
                  <input 
                    type="text" 
                    value={masterConfig.pixKey} 
                    onChange={(e) => setMasterConfig({ ...masterConfig, pixKey: e.target.value })} 
                    className="w-full bg-cf-black border border-cf-gray p-3 text-white outline-none focus:border-cf-yellow font-mono" 
                    placeholder="Ex: 11999999999" 
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Nome do Beneficiário</label>
                  <input 
                    type="text" 
                    value={masterConfig.pixName} 
                    onChange={(e) => setMasterConfig({ ...masterConfig, pixName: e.target.value })} 
                    className="w-full bg-cf-black border border-cf-gray p-3 text-white outline-none focus:border-cf-yellow" 
                    placeholder="Ex: Guilherme Pereira" 
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-6">Estes dados serão mostrados automaticamente para as lojas inadimplentes em um popup bloqueando o painel delas.</p>
              
              <button type="submit" className="bg-cf-yellow text-cf-black font-bold uppercase px-8 py-3 hover:bg-white transition-colors">
                Salvar Configurações
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
