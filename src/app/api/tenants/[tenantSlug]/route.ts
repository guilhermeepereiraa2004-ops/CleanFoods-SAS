import { NextResponse } from 'next/server';

import { getPublicTenant } from '@/lib/supabase/tenants-server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> },
) {
  const { tenantSlug } = await params;
  const tenant = await getPublicTenant(tenantSlug);

  if (!tenant) {
    return NextResponse.json(
      { error: 'Loja não encontrada.' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.json(tenant, { headers: { 'Cache-Control': 'no-store' } });
}
