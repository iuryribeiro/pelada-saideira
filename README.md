# Pelada Saideira

App web para gestão de peladas — controle de jogadores, presenças, pagamentos e avisos.

**Produção:** https://pelada-saideira.vercel.app

---

## Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL + Auth + RLS)
- **Estado:** Zustand + TanStack Query
- **Deploy:** Vercel

---

## Funcionalidades

### Jogadores
- Cadastro de mensalistas (com conta) e avulsos (sem conta)
- Perfil com nome, apelido, posição e nível (1–5)
- Avaliação de nível entre jogadores

### Autenticação
- Login com e-mail e senha
- Recuperação de senha via e-mail (`/esqueci-senha` → `/redefinir-senha`)
- Admin pode vincular e-mail a jogadores avulsos/mensalistas sem conta
- Link de acesso copiável como fallback caso o e-mail não chegue

### Peladas e Jogos
- Configuração de pelada recorrente (dia da semana, horário, quadra, vagas)
- Criação de jogos fixos e extras
- Controle de presença: confirmado, pendente, lista de espera, recusado
- Sorteio de times

### Financeiro
- Registro de pagamentos: mensalidade, avulso, goleiro
- Histórico por jogador

### Avisos
- Publicação de avisos com push notification

### Admin
- Painel administrativo em `/admin`
- Gerenciar jogadores (editar, ativar/desativar, promover admin)
- Vincular e-mail / reenviar link de acesso a jogadores sem conta
- Aprovar presenças de avulsos
- Adicionar convidados ao jogo

---

## Estrutura do projeto

```
src/
├── app/
│   ├── (auth)/             # Login, cadastro, esqueci-senha
│   ├── (dashboard)/        # Páginas protegidas (home, pelada, jogadores, etc.)
│   ├── admin/              # Painel admin e sub-páginas
│   ├── api/admin/          # API Routes protegidas (service role)
│   ├── perfil/             # Perfil do usuário logado
│   └── redefinir-senha/    # Página de criação de senha via link de e-mail
├── lib/supabase/           # Clientes Supabase (client/server) e funções de auth
├── services/               # Funções de acesso ao banco (admin, jogadores, etc.)
├── hooks/                  # React Query hooks
├── store/                  # Zustand (auth, pelada)
├── components/             # Componentes reutilizáveis
└── types/database.ts       # Interfaces TypeScript do banco
```

---

## Banco de dados (Supabase)

### Tabelas principais

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Jogadores. Podem existir sem conta auth (avulsos) |
| `peladas` | Configuração da pelada recorrente |
| `jogos` | Instâncias de jogo (fixo ou extra) |
| `presencas` | Presença de cada jogador em cada jogo |
| `avaliacoes_nivel` | Avaliações de nível entre jogadores |
| `avisos` | Comunicados publicados pelos admins |
| `pagamentos` | Registro de pagamentos por jogador/jogo |
| `push_tokens` | Tokens para push notification |

### Migrações (executar em ordem no SQL Editor do Supabase)

```
supabase/schema.sql                          ← schema inicial
supabase/migration_profiles_standalone.sql   ← perfis sem conta auth
supabase/migration_convidados.sql            ← suporte a convidados
supabase/migration_convidados_retroativo.sql
supabase/migration_invite.sql                ← coluna email + trigger de vínculo
supabase/migration_pagamentos.sql            ← sistema de pagamentos
supabase/migration_pagamentos_convidados.sql
supabase/migration_trigger_fix.sql
supabase/seed-admin.sql                      ← cria conta admin inicial
```

---

## Configuração

### Variáveis de ambiente (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://<projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_APP_URL=https://pelada-saideira.vercel.app
```

> No Vercel, configure as mesmas variáveis em **Settings → Environment Variables**.

### Supabase Dashboard — obrigatório

**Authentication → URL Configuration:**

- **Site URL:** `https://pelada-saideira.vercel.app`
- **Redirect URLs:**
  ```
  https://pelada-saideira.vercel.app/**
  https://pelada-saideira.vercel.app/redefinir-senha
  http://localhost:3000/**
  http://localhost:3000/redefinir-senha
  ```

**Authentication → Email Templates → Reset Password:**
```html
<a href="{{ .ConfirmationURL }}">Redefinir Senha</a>
```
> Não adicionar nenhum caminho extra ao `ConfirmationURL` — ele já inclui o redirect configurado no código.

---

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000
