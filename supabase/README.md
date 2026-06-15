# Supabase — Schema PostgreSQL

Esta pasta contém as migrations que definem o schema PostgreSQL do projeto no Supabase
(migração do banco SQLite/sql.js legado — ver `docs/USER_STORIES_SUPABASE_MIGRATION.md`, EP-03).

As migrations ficam em `supabase/migrations/` com nome `<timestamp>_<descricao>.sql`.
A ordem lexicográfica dos arquivos define a ordem de aplicação.

## US-10 — Autenticação

A tabela `auth.users` é provisionada **automaticamente** pelo Supabase Auth.
Não há DDL para criá-la; as tabelas de dados apenas referenciam `auth.users(id)` via FK
(`user_id ... references auth.users(id) on delete cascade`).

## Controle de acesso — RLS (role + aprovação) + RBAC na aplicação

**RLS está habilitado** (migration `20260614120000_enable_rls_policies.sql`) como camada de
segurança no banco, **além** do RBAC client-side (EP-09). Motivo: o `anon key` é público (vai no
bundle do browser); sem RLS, ele permite acesso direto ao banco contornando o RBAC da app.

Modelo (congregação única, **não** multi-tenant — `user_id` é rastreabilidade, não isolamento):

- **Leitura** (`SELECT`): qualquer usuário logado **e aprovado** vê os dados compartilhados da
  congregação — via função `public.is_approved()`.
- **Escrita** (`INSERT`/`UPDATE`/`DELETE`): somente **admin aprovado** — via `public.is_admin()`.
- **`user_profiles`**: cada um lê o próprio perfil; admin lê/gerencia todos. INSERT é feito só pelo
  trigger `handle_new_user` (`SECURITY DEFINER`).
- **`user_settings`**: cada usuário lê/edita apenas as próprias (`user_id = auth.uid()`).

As funções helper são `SECURITY DEFINER` para evitar recursão de RLS ao consultar `user_profiles`.
Cada tabela mantém `user_id` e o índice `idx_<tabela>_user` para rastreabilidade.

## Como aplicar

Sem credenciais de banco neste repositório — aplicar manualmente:

- **Dashboard**: SQL Editor do projeto Supabase → colar o conteúdo da migration e executar
  (na ordem dos arquivos).
- **CLI**: `supabase db push` (requer projeto vinculado via `supabase link`).

## Migrations

Aplicar **na ordem da tabela** (lexicográfica dos timestamps):

| Arquivo | Descrição |
|---|---|
| `20260612120000_create_base_tables.sql` | US-11 — cria as 7 tabelas base (`brothers`, `carts`, `locations`, `groups`, `slots`, `schedule_weeks`, `assignments`) com `id uuid`, `user_id` (FK `auth.users`), tipos PostgreSQL (uuid/boolean/timestamptz), FKs entre tabelas, constraints de negócio e índices (inclusive `idx_<tabela>_user`). Habilita a extensão `pgcrypto`. |
| `20260612120100_create_user_settings.sql` | US-12 — cria `user_settings` (`UNIQUE(user_id)` garantindo 1:1, `congregation_name`, `created_at`/`updated_at`) + função `set_updated_at()` e trigger `BEFORE UPDATE` para manter `updated_at`. |
| `20260612120200_create_user_settings_trigger.sql` | US-13 — função `handle_new_user()` (`SECURITY DEFINER`) + trigger `on_auth_user_created` (`AFTER INSERT` em `auth.users`) que inicializa automaticamente o registro de `user_settings` no signup. |
| `20260614000000_add_email_to_user_profiles.sql` | Adiciona coluna `email` a `user_profiles` (backfill + populada pelo trigger `handle_new_user`). |
| `20260614120000_enable_rls_policies.sql` | Habilita RLS + policies em todas as tabelas. Funções `is_approved()`/`is_admin()` (`SECURITY DEFINER`); leitura = aprovado, escrita = admin; `user_profiles`/`user_settings` por usuário. Idempotente (`drop policy if exists`). Ao rodar no SQL Editor, **NÃO** usar "Run without RLS". |
