-- Aplicar manualmente via SQL Editor do Supabase Dashboard
-- Adiciona coluna email à tabela user_profiles e atualiza o trigger

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill para usuários já existentes
UPDATE public.user_profiles
SET email = (SELECT email FROM auth.users WHERE id = user_profiles.user_id)
WHERE email IS NULL;

-- Atualiza o trigger para incluir email nos novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_role        text    := 'user';
    v_is_approved boolean := false;
    v_admin_count int;
BEGIN
    INSERT INTO public.user_settings (user_id, congregation_name)
    VALUES (new.id, null)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT count(*) INTO v_admin_count
    FROM public.user_profiles WHERE role = 'admin';

    IF v_admin_count = 0 THEN
        v_role        := 'admin';
        v_is_approved := true;
    END IF;

    INSERT INTO public.user_profiles (user_id, role, is_approved, email)
    VALUES (new.id, v_role, v_is_approved, new.email)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN new;
END;
$$;
