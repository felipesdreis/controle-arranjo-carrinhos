-- Aplicar manualmente via SQL Editor do Supabase Dashboard
-- EP-09 / US-37 — tabela de perfis de usuário (role + aprovação)
-- Sem RLS — controle de acesso via RBAC na aplicação.

-- tabela user_profiles: vincula 1:1 com auth.users, define role e status de aprovação
create table if not exists public.user_profiles (
    id          uuid        primary key default gen_random_uuid(),
    user_id     uuid        not null unique references auth.users(id) on delete cascade,
    role        text        not null default 'user' check (role in ('admin', 'user')),
    is_approved boolean     not null default false,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- trigger before update mantém updated_at atualizado (reutiliza set_updated_at criada em EP-03)
drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
    before update on public.user_profiles
    for each row
    execute function public.set_updated_at();

-- Estende handle_new_user() para também popular user_profiles.
-- Lógica de bootstrap: primeiro usuário sem admins existentes vira admin aprovado;
-- demais recebem role='user', is_approved=false e aguardam aprovação manual.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_role        text    := 'user';
    v_is_approved boolean := false;
    v_admin_count int;
begin
    -- cria as preferências iniciais do usuário (congregation_name começa nulo)
    insert into public.user_settings (user_id, congregation_name)
    values (new.id, null)
    on conflict (user_id) do nothing;

    -- determina se é o primeiro admin do sistema
    select count(*) into v_admin_count
    from public.user_profiles
    where role = 'admin';

    if v_admin_count = 0 then
        v_role        := 'admin';
        v_is_approved := true;
    end if;

    insert into public.user_profiles (user_id, role, is_approved)
    values (new.id, v_role, v_is_approved)
    on conflict (user_id) do nothing;

    return new;
end;
$$;

-- garante que o trigger existe (pode já existir da migration anterior)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();
