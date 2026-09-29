import { NextResponse } from 'next/server';

import { authorizeTenantRequest } from '@/lib/supabase/tenant-access';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> },
) {
  const { tenantSlug } = await params;
  const access = await authorizeTenantRequest(request, tenantSlug);

  if (!access.ok) {
    return NextResponse.json(
      { authorized: false, error: access.error },
      { status: access.status, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.json(
    { authorized: true, role: access.authorization },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
