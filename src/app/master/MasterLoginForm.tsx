'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import {
  loginMaster,
  type MasterLoginState,
} from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 w-full bg-cf-yellow py-3 font-bold uppercase text-cf-black transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? 'Entrando...' : 'Entrar'}
    </button>
  );
}

export default function MasterLoginForm({
  initialError = '',
}: {
  initialError?: string;
}) {
  const initialState: MasterLoginState = {
    error: initialError,
  };
  const [state, formAction] = useActionState(loginMaster, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cf-black p-4">
      <div className="torn-edge w-full max-w-md border-2 border-cf-yellow bg-cf-darkgray p-5 sm:p-8">
        <h1 className="mb-6 text-center font-impact text-3xl uppercase tracking-widest text-cf-yellow">
          Master Admin
        </h1>
        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label htmlFor="master-email" className="mb-1 block text-xs font-bold uppercase text-gray-400">
              E-mail
            </label>
            <input
              id="master-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full border border-cf-gray bg-cf-black p-3 text-white outline-none focus:border-cf-yellow"
              placeholder="Seu e-mail..."
            />
          </div>
          <div>
            <label htmlFor="master-password" className="mb-1 block text-xs font-bold uppercase text-gray-400">
              Senha
            </label>
            <input
              id="master-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full border border-cf-gray bg-cf-black p-3 text-white outline-none focus:border-cf-yellow"
              placeholder="********"
            />
          </div>
          {state.error && (
            <p role="alert" className="text-sm font-bold text-red-500">
              {state.error}
            </p>
          )}
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
