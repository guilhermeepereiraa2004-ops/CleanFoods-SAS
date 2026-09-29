'use client';

// Simula um banco de dados SaaS (Multi-tenant) usando LocalStorage
export interface Tenant {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
  theme: string;
  primaryColor: string;
  fontFamily: string;
  bodyFontFamily?: string;
  heroFontFamily?: string;
  mercadoPagoKey?: string;
  createdAt: string;
  // Hero text overrides
  heroWord1?: string;
  heroWord2?: string;
  heroWord3?: string;
  heroWord4?: string;
  heroImageUrl?: string;
  heroFontColor?: string;
  heroFontSize?: string;
  heroImageSize?: string;
  heroSubtitle?: string;
  heroSubtitleFont?: string;
  heroSubtitleSize?: string;
  logoSize?: string;
  
  // Acesso e Cobrança
  adminUser?: string;
  adminPassword?: string;
  paymentDay?: string; // Dia do mês (1 a 31)
  paymentStatus?: 'pago' | 'pendente';
}

export interface MasterConfig {
  pixKey: string;
  pixName: string;
}

export const getMasterConfig = (): MasterConfig => {
  if (typeof window === 'undefined') return { pixKey: '', pixName: '' };
  return JSON.parse(localStorage.getItem('saas_master_config') || '{"pixKey": "", "pixName": ""}');
};

export const saveMasterConfig = (config: MasterConfig) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('saas_master_config', JSON.stringify(config));
  }
};

export const getTenants = (): Tenant[] => {
  if (typeof window === 'undefined') return [];
  const tenants: Tenant[] = JSON.parse(localStorage.getItem('saas_tenants') || '[]');

  return tenants.map(tenant =>
    tenant.theme === 'design1' ? { ...tenant, theme: 'design2' } : tenant
  );
};

export const saveTenant = (tenant: Tenant) => {
  if (typeof window === 'undefined') return;
  const tenants = getTenants();
  const existingIdx = tenants.findIndex(t => t.id === tenant.id || t.slug === tenant.slug);
  
  if (existingIdx >= 0) {
    tenants[existingIdx] = { ...tenants[existingIdx], ...tenant };
  } else {
    tenants.push(tenant);
  }
  
  localStorage.setItem('saas_tenants', JSON.stringify(tenants));
};

export const deleteTenant = (id: string) => {
  if (typeof window === 'undefined') return;
  const tenants = getTenants();
  const newTenants = tenants.filter(t => t.id !== id);
  localStorage.setItem('saas_tenants', JSON.stringify(newTenants));
};

export const getTenantBySlug = (slug: string): Tenant | null => {
  const tenants = getTenants();
  return tenants.find(t => t.slug === slug) || null;
};

// Initialize with a default tenant if empty
if (typeof window !== 'undefined') {
  const tenants = getTenants();
  if (tenants.length === 0) {
    saveTenant({
      id: 'tenant-1',
      slug: 'demo',
      name: 'CleanFoods Demo',
      theme: 'design2',
      primaryColor: '#F6C500',
      fontFamily: '--font-inter',
      createdAt: new Date().toISOString()
    });
  }
}
