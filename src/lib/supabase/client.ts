import 'client-only';

import { createBrowserClient } from '@supabase/ssr';

import { getSupabaseEnv } from './env';

/**
 * Cliente para Client Components e assinaturas Realtime no navegador.
 * O createBrowserClient mantém uma única instância por aba.
 */
export function createClient() {
  const { url, publishableKey } = getSupabaseEnv();

  return createBrowserClient(url, publishableKey);
}
