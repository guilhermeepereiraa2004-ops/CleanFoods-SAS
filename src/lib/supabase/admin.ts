import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente privilegiado para operações internas e previamente autorizadas.
 * Ele ignora RLS: nunca importe este módulo em Client Components e nunca
 * devolva a chave ou este cliente para o navegador.
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      'Supabase administrativo não configurado. Defina SUPABASE_URL e ' +
        'SUPABASE_SECRET_KEY no ambiente do servidor.',
    );
  }

  return createSupabaseClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
