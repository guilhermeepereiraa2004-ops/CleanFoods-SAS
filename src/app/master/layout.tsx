import type { ReactNode } from 'react';

import { createClient } from '@/lib/supabase/server';

import MasterLoginForm from './MasterLoginForm';

export default async function MasterLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return <MasterLoginForm />;
  }

  const { data: platformAdmin, error } = await supabase
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !platformAdmin) {
    return (
      <MasterLoginForm initialError="Sua sessão não possui permissão de Master Admin." />
    );
  }

  return children;
}
