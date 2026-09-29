const ENV_ERROR =
  'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e ' +
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no arquivo .env.local.';

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(ENV_ERROR);
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost') {
      throw new Error();
    }
  } catch {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL inválida. Use a URL HTTPS exibida no painel do Supabase.',
    );
  }

  return { url, publishableKey };
}
