import 'server-only';

import { normalizeTenantSlug } from '@/lib/tenants';
import { createAdminClient } from './admin';
import { createClient } from './server';

export type TenantAccessResult =
  | {
      ok: true;
      tenantId: string;
      slug: string;
      authorization: 'platform_admin' | 'owner' | 'admin';
    }
  | {
      ok: false;
      slug: string;
      status: 401 | 403 | 404 | 500;
      error: string;
    };

function getBearerToken(request: Request) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  return authorization.slice('Bearer '.length).trim() || null;
}

async function getAuthenticatedUserId(request: Request) {
  const sessionClient = await createClient();
  const bearerToken = getBearerToken(request);

  if (bearerToken) {
    const { data, error } = await sessionClient.auth.getUser(bearerToken);
    if (!error && data.user) return data.user.id;
  }

  const { data: claimsData, error: claimsError } = await sessionClient.auth.getClaims();
  if (claimsError) return null;
  return claimsData?.claims?.sub || null;
}

export async function authorizeTenantRequest(
  request: Request,
  tenantSlug: string,
): Promise<TenantAccessResult> {
  const slug = normalizeTenantSlug(tenantSlug);
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return {
      ok: false,
      slug,
      status: 401,
      error: 'Sua sessão expirou. Entre novamente no painel.',
    };
  }

  const adminClient = createAdminClient();
  const { data: tenant, error: tenantError } = await adminClient
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (tenantError) {
    return { ok: false, slug, status: 500, error: 'Não foi possível validar a loja.' };
  }
  if (!tenant) return { ok: false, slug, status: 404, error: 'Loja não encontrada.' };

  const [platformAdminResult, membershipResult] = await Promise.all([
    adminClient
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle(),
    adminClient
      .from('tenant_memberships')
      .select('role')
      .eq('tenant_id', tenant.id)
      .eq('user_id', userId)
      .in('role', ['owner', 'admin'])
      .maybeSingle(),
  ]);

  if (platformAdminResult.error || membershipResult.error) {
    return {
      ok: false,
      slug,
      status: 500,
      error: 'Não foi possível validar sua permissão.',
    };
  }

  const authorization = platformAdminResult.data
    ? 'platform_admin'
    : membershipResult.data?.role;
  if (authorization !== 'platform_admin' && authorization !== 'owner' && authorization !== 'admin') {
    return {
      ok: false,
      slug,
      status: 403,
      error: 'Você não possui permissão para alterar esta loja.',
    };
  }

  return { ok: true, tenantId: tenant.id, slug, authorization };
}
