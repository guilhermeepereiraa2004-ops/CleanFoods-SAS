'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export type MasterLoginState = {
  error: string;
};

export const initialMasterLoginState: MasterLoginState = {
  error: '',
};

export async function loginMaster(
  _previousState: MasterLoginState,
  formData: FormData,
): Promise<MasterLoginState> {
  const emailValue = formData.get('email');
  const passwordValue = formData.get('password');

  if (typeof emailValue !== 'string' || typeof passwordValue !== 'string') {
    return { error: 'Informe seu e-mail e sua senha.' };
  }

  const email = emailValue.trim().toLowerCase();

  if (!email || !passwordValue) {
    return { error: 'Informe seu e-mail e sua senha.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: passwordValue,
  });

  if (error || !data.user) {
    if (error?.code === 'email_not_confirmed') {
      return { error: 'Confirme seu e-mail antes de entrar.' };
    }

    return { error: 'E-mail ou senha inválidos.' };
  }

  const { data: platformAdmin, error: authorizationError } = await supabase
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (authorizationError) {
    console.error('Falha ao validar o acesso Master Admin:', authorizationError.message);
    await supabase.auth.signOut();
    return { error: 'Não foi possível validar sua permissão. Tente novamente.' };
  }

  if (!platformAdmin) {
    await supabase.auth.signOut();
    return { error: 'Este usuário não possui permissão de Master Admin.' };
  }

  redirect('/master');
}

export async function logoutMaster() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/master');
}
