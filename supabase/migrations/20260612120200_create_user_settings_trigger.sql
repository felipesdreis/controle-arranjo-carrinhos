-- EP-03 / US-13 — inicialização automática de preferências no signup
-- Ao criar um usuário em auth.users, insere automaticamente a linha em public.user_settings.
-- Decisão arquitetural: SEM RLS — isolamento via RBAC na aplicação (EP-09).

-- função executada após o cadastro de um novo usuário (US-13)
-- SECURITY DEFINER: roda com privilégios do owner para poder gravar em public.user_settings
-- a partir do schema auth; set search_path = public evita resolução ambígua/maliciosa de nomes.
-- NOTA (EP-09/US-37): esta função será ESTENDIDA para também popular public.user_profiles
--   (papel/role do usuário). Manter o corpo simples e aditivo: basta acrescentar outro INSERT abaixo.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    -- cria as preferências iniciais do usuário (congregation_name começa nulo)
    insert into public.user_settings (user_id, congregation_name)
    values (new.id, null);

    -- EP-09/US-37: futuro insert em public.user_profiles entra aqui.

    return new;
end;
$$;

-- trigger after insert em auth.users dispara a inicialização (US-13)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();
