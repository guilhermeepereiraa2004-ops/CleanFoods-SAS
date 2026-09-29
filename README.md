# CleanFoods SaaS

Aplicação multi-tenant construída com Next.js 16 e preparada para acessar o Supabase no navegador e no servidor.

## Desenvolvimento

Requisitos:

- Node.js 22 ou superior
- Um projeto no Supabase

Instale as dependências e inicie o servidor:

```bash
npm install
npm run dev
```

A aplicação ficará disponível em [http://localhost:3000](http://localhost:3000).

## Configuração do Supabase

1. Copie `.env.example` para `.env.local`.
2. No painel do Supabase, abra **Project Settings > API** (ou o diálogo **Connect**).
3. Preencha a URL do projeto e a chave **publishable**:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE_PUBLICA
```

Essas duas variáveis podem ser usadas pelo navegador. Nunca adicione uma chave `secret` ou `service_role` a uma variável `NEXT_PUBLIC_*`.

Operações internas que realmente precisam ignorar RLS podem usar `createAdminClient` de `@/lib/supabase/admin`. Esse cliente aceita `SUPABASE_URL` e `SUPABASE_SECRET_KEY`, existe somente no servidor e deve ser chamado apenas depois de uma verificação explícita de autorização.

### Uso em Server Components, Server Actions e Route Handlers

Crie o cliente dentro da requisição:

```ts
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data, error } = await supabase.from('tabela').select('*');
```

### Uso em Client Components

```ts
'use client';

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
```

Os módulos ficam separados para impedir que APIs exclusivas do servidor sejam importadas pelo navegador. O cliente do servidor é criado por requisição para que cookies e sessões nunca sejam compartilhados entre usuários.

O proxy de renovação de sessão deve ser adicionado junto com as rotas de autenticação. Para consultas ao banco sem sessão de usuário, os clientes acima já estão prontos.

## Estado da migração

A infraestrutura de conexão está pronta, mas as telas atuais ainda usam `src/lib/mockStorage.ts` e `localStorage`. A próxima etapa é definir o schema multi-tenant, criar migrations e políticas RLS, gerar os tipos TypeScript a partir do projeto Supabase e substituir o armazenamento simulado gradualmente.

O schema inicial está em `supabase/cleanfoods_schema.sql`. Ele deve ser executado uma vez no SQL Editor do Supabase e contém tabelas multi-tenant, índices, RLS, privilégios da Data API e o bucket de imagens.

Ao criar tabelas no schema `public`:

- habilite RLS em todas elas;
- crie políticas com isolamento por tenant e usuário;
- confirme se `anon` e `authenticated` possuem acesso à Data API, pois projetos recentes não expõem tabelas novas automaticamente;
- nunca armazene senhas dos administradores em texto puro; use Supabase Auth.
