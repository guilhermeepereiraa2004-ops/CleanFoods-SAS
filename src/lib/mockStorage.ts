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
  mercadoPagoKey?: string;
  createdAt: string;
  // Hero text overrides
  heroWord1?: string;
  heroWord2?: string;
  heroWord3?: string;
  heroWord4?: string;
  heroImageUrl?: string;
}

export const getTenants = (): Tenant[] => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('saas_tenants') || '[]');
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
      theme: 'design1',
      primaryColor: '#F6C500',
      fontFamily: '--font-inter',
      createdAt: new Date().toISOString()
    });
  }
}
