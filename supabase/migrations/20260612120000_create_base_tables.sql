-- EP-03 / US-11 — schema base PostgreSQL (Supabase)
-- Adapta as 7 tabelas de src/db/schema.sql (fonte de verdade das colunas) para PostgreSQL multi-tenant.
-- Cada tabela de dados ganha user_id -> auth.users(id) on delete cascade.
-- DECISAO ARQUITETURAL: isolamento de dados e controle de acesso sao feitos via RBAC na aplicacao (EP-09).
--   NAO habilitamos RLS nem criamos policies aqui. Os indices idx_<tabela>_user apoiam os filtros por usuario.
-- US-10: auth.users e provisionada automaticamente pelo Supabase Auth (sem DDL neste arquivo).

-- gen_random_uuid() ja existe no Supabase; garantimos pgcrypto para portabilidade/robustez.
create extension if not exists pgcrypto;

-- US-11: irmaos
create table if not exists public.brothers (
    id          uuid        primary key default gen_random_uuid(),
    user_id     uuid        not null references auth.users(id) on delete cascade,
    name        text        not null,
    phone       text,
    notes       text,
    active      boolean     not null default true,
    created_at  timestamptz not null default now()
);

-- US-11: carrinhos
create table if not exists public.carts (
    id          uuid        primary key default gen_random_uuid(),
    user_id     uuid        not null references auth.users(id) on delete cascade,
    name        text        not null,
    description text,
    active      boolean     not null default true,
    created_at  timestamptz not null default now()
);

-- US-11: pontos/locais
create table if not exists public.locations (
    id          uuid        primary key default gen_random_uuid(),
    user_id     uuid        not null references auth.users(id) on delete cascade,
    name        text        not null,
    address     text,
    notes       text,
    active      boolean     not null default true,
    created_at  timestamptz not null default now()
);

-- US-11: grupos (responsible_id aponta para um irmao; set null se o irmao for removido)
create table if not exists public.groups (
    id              uuid        primary key default gen_random_uuid(),
    user_id         uuid        not null references auth.users(id) on delete cascade,
    name            text        not null,
    responsible_id  uuid        references public.brothers(id) on delete set null,
    active          boolean     not null default true,
    created_at      timestamptz not null default now()
);

-- US-11: turnos/horarios (location obrigatorio; cart/group opcionais com set null)
create table if not exists public.slots (
    id          uuid        primary key default gen_random_uuid(),
    user_id     uuid        not null references auth.users(id) on delete cascade,
    location_id uuid        not null references public.locations(id) on delete cascade,
    cart_id     uuid        references public.carts(id) on delete set null,
    group_id    uuid        references public.groups(id) on delete set null,
    day_of_week int         not null check (day_of_week between 0 and 6),
    start_time  text        not null,
    end_time    text        not null,
    capacity    int         not null default 2,
    active      boolean     not null default true,
    created_at  timestamptz not null default now()
);

-- US-11: semanas de programacao
-- Nota multi-tenant: no SQLite week_start era UNIQUE global; aqui passa a ser unique por usuario.
create table if not exists public.schedule_weeks (
    id          uuid        primary key default gen_random_uuid(),
    user_id     uuid        not null references auth.users(id) on delete cascade,
    week_start  text        not null,
    notes       text,
    created_at  timestamptz not null default now(),
    unique (user_id, week_start)
);

-- US-11: designacoes (chave de negocio: week_id + slot_id + position)
-- brother_id usa ON DELETE RESTRICT (igual ao legado SQLite, que nao tinha acao = NO ACTION):
--   protege o historico de programacao — deletar um irmao com designacoes e bloqueado.
--   A aplicacao deve usar soft-delete (active = false) ou tratar o erro na UI antes de remover.
create table if not exists public.assignments (
    id          uuid        primary key default gen_random_uuid(),
    user_id     uuid        not null references auth.users(id) on delete cascade,
    week_id     uuid        not null references public.schedule_weeks(id) on delete cascade,
    slot_id     uuid        not null references public.slots(id) on delete cascade,
    brother_id  uuid        not null references public.brothers(id) on delete restrict,
    position    int         not null default 1 check (position >= 1),
    created_at  timestamptz not null default now(),
    unique (week_id, slot_id, position)
);

-- Indices equivalentes ao schema SQLite
create index if not exists idx_slots_day        on public.slots(day_of_week);
create index if not exists idx_slots_location   on public.slots(location_id);
create index if not exists idx_assignments_week on public.assignments(week_id);
create index if not exists idx_assignments_slot on public.assignments(slot_id);

-- Indices em user_id para apoiar os filtros por usuario do RBAC (EP-09)
create index if not exists idx_brothers_user        on public.brothers(user_id);
create index if not exists idx_carts_user           on public.carts(user_id);
create index if not exists idx_locations_user       on public.locations(user_id);
create index if not exists idx_groups_user          on public.groups(user_id);
create index if not exists idx_slots_user           on public.slots(user_id);
create index if not exists idx_schedule_weeks_user  on public.schedule_weeks(user_id);
create index if not exists idx_assignments_user     on public.assignments(user_id);
