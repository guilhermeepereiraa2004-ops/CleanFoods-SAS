import { getSupabaseEnv } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

export function GET() {
  const { url, publishableKey } = getSupabaseEnv();
  const script = [
    `window.SUPABASE_URL = ${JSON.stringify(url)};`,
    `window.SUPABASE_ANON_KEY = ${JSON.stringify(publishableKey)};`,
  ].join('\n');

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
