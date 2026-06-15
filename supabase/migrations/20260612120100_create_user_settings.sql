-- EP-03 / US-12 — tabela de preferências por usuário (user_settings)
-- Substitui o uso de localStorage para congregationName (ver CLAUDE.md "Preferências no localStorage").
-- Relação 1:1 com auth.users garantida pela constraint UNIQUE(user_id).
-- Decisão arquitetural: SEM RLS — isolamento via RBAC na aplicação (EP-09).

-- tabela de configurações do usuário (US-12)
create table if not exists public.user_settings (
    id                uuid        primary key default gen_random_uuid(),
    -- vínculo 1:1 com o usuário autenticado; UNIQUE força no máximo 1 linha por usuário
    user_id           uuid        not null unique references auth.users(id) on delete cascade,
    -- nome da congregação (antes em localStorage); pode ser nulo até o usuário preencher
    congregation_name text,
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);

-- função genérica para manter updated_at em sincronia (US-12)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- trigger before update mantém updated_at atualizado a cada alteração
drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at
    before update on public.user_settings
    for each row
    execute function public.set_updated_at();
