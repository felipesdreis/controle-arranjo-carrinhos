-- =============================================================================
-- Habilita Row Level Security (RLS) + policies em todas as tabelas públicas.
--
-- Modelo (congregação única, não multi-tenant):
--   - Leitura  (SELECT): qualquer usuário logado E aprovado vê os dados compartilhados.
--   - Escrita  (INSERT/UPDATE/DELETE): somente admin aprovado.
--   - user_profiles: cada um lê o próprio; admin lê/gerencia todos.
--   - user_settings: cada um lê/edita só as próprias (congregation_name é do user).
--
-- O anon key é público (vai no bundle do browser). Sem RLS, ele dá acesso direto
-- ao banco contornando o RBAC client-side. Esta migration fecha esse vetor.
--
-- Idempotente: pode ser reaplicada no SQL Editor sem erro.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Funções helper (SECURITY DEFINER — ignoram RLS ao consultar user_profiles,
--    evitando recursão infinita nas policies da própria user_profiles).
-- -----------------------------------------------------------------------------

create or replace function public.is_approved()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_profiles
    where user_id = auth.uid() and is_approved = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_profiles
    where user_id = auth.uid() and role = 'admin' and is_approved = true
  );
$$;

-- -----------------------------------------------------------------------------
-- 2. Tabelas de dados compartilhados:
--    brothers, carts, locations, groups, slots, schedule_weeks, assignments
--    Leitura = aprovado | Escrita = admin
-- -----------------------------------------------------------------------------

-- brothers
alter table public.brothers enable row level security;
drop policy if exists "approved_read_brothers"  on public.brothers;
drop policy if exists "admin_insert_brothers"   on public.brothers;
drop policy if exists "admin_update_brothers"   on public.brothers;
drop policy if exists "admin_delete_brothers"   on public.brothers;
create policy "approved_read_brothers" on public.brothers
  for select using (public.is_approved());
create policy "admin_insert_brothers" on public.brothers
  for insert with check (public.is_admin());
create policy "admin_update_brothers" on public.brothers
  for update using (public.is_admin()) with check (public.is_admin());
create policy "admin_delete_brothers" on public.brothers
  for delete using (public.is_admin());

-- carts
alter table public.carts enable row level security;
drop policy if exists "approved_read_carts" on public.carts;
drop policy if exists "admin_insert_carts"  on public.carts;
drop policy if exists "admin_update_carts"  on public.carts;
drop policy if exists "admin_delete_carts"  on public.carts;
create policy "approved_read_carts" on public.carts
  for select using (public.is_approved());
create policy "admin_insert_carts" on public.carts
  for insert with check (public.is_admin());
create policy "admin_update_carts" on public.carts
  for update using (public.is_admin()) with check (public.is_admin());
create policy "admin_delete_carts" on public.carts
  for delete using (public.is_admin());

-- locations
alter table public.locations enable row level security;
drop policy if exists "approved_read_locations" on public.locations;
drop policy if exists "admin_insert_locations"  on public.locations;
drop policy if exists "admin_update_locations"  on public.locations;
drop policy if exists "admin_delete_locations"  on public.locations;
create policy "approved_read_locations" on public.locations
  for select using (public.is_approved());
create policy "admin_insert_locations" on public.locations
  for insert with check (public.is_admin());
create policy "admin_update_locations" on public.locations
  for update using (public.is_admin()) with check (public.is_admin());
create policy "admin_delete_locations" on public.locations
  for delete using (public.is_admin());

-- groups
alter table public.groups enable row level security;
drop policy if exists "approved_read_groups" on public.groups;
drop policy if exists "admin_insert_groups"  on public.groups;
drop policy if exists "admin_update_groups"  on public.groups;
drop policy if exists "admin_delete_groups"  on public.groups;
create policy "approved_read_groups" on public.groups
  for select using (public.is_approved());
create policy "admin_insert_groups" on public.groups
  for insert with check (public.is_admin());
create policy "admin_update_groups" on public.groups
  for update using (public.is_admin()) with check (public.is_admin());
create policy "admin_delete_groups" on public.groups
  for delete using (public.is_admin());

-- slots
alter table public.slots enable row level security;
drop policy if exists "approved_read_slots" on public.slots;
drop policy if exists "admin_insert_slots"  on public.slots;
drop policy if exists "admin_update_slots"  on public.slots;
drop policy if exists "admin_delete_slots"  on public.slots;
create policy "approved_read_slots" on public.slots
  for select using (public.is_approved());
create policy "admin_insert_slots" on public.slots
  for insert with check (public.is_admin());
create policy "admin_update_slots" on public.slots
  for update using (public.is_admin()) with check (public.is_admin());
create policy "admin_delete_slots" on public.slots
  for delete using (public.is_admin());

-- schedule_weeks
alter table public.schedule_weeks enable row level security;
drop policy if exists "approved_read_schedule_weeks" on public.schedule_weeks;
drop policy if exists "admin_insert_schedule_weeks"  on public.schedule_weeks;
drop policy if exists "admin_update_schedule_weeks"  on public.schedule_weeks;
drop policy if exists "admin_delete_schedule_weeks"  on public.schedule_weeks;
create policy "approved_read_schedule_weeks" on public.schedule_weeks
  for select using (public.is_approved());
create policy "admin_insert_schedule_weeks" on public.schedule_weeks
  for insert with check (public.is_admin());
create policy "admin_update_schedule_weeks" on public.schedule_weeks
  for update using (public.is_admin()) with check (public.is_admin());
create policy "admin_delete_schedule_weeks" on public.schedule_weeks
  for delete using (public.is_admin());

-- assignments
alter table public.assignments enable row level security;
drop policy if exists "approved_read_assignments" on public.assignments;
drop policy if exists "admin_insert_assignments"  on public.assignments;
drop policy if exists "admin_update_assignments"  on public.assignments;
drop policy if exists "admin_delete_assignments"  on public.assignments;
create policy "approved_read_assignments" on public.assignments
  for select using (public.is_approved());
create policy "admin_insert_assignments" on public.assignments
  for insert with check (public.is_admin());
create policy "admin_update_assignments" on public.assignments
  for update using (public.is_admin()) with check (public.is_admin());
create policy "admin_delete_assignments" on public.assignments
  for delete using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 3. user_profiles — leitura do próprio perfil + gestão por admin.
--    INSERT é feito pelo trigger handle_new_user (security definer → bypassa RLS);
--    não criamos policy de INSERT para bloquear inserção manual via anon key.
-- -----------------------------------------------------------------------------
alter table public.user_profiles enable row level security;
drop policy if exists "read_own_or_admin_profiles" on public.user_profiles;
drop policy if exists "admin_update_profiles"       on public.user_profiles;
drop policy if exists "admin_delete_profiles"       on public.user_profiles;
create policy "read_own_or_admin_profiles" on public.user_profiles
  for select using (user_id = auth.uid() or public.is_admin());
create policy "admin_update_profiles" on public.user_profiles
  for update using (public.is_admin()) with check (public.is_admin());
create policy "admin_delete_profiles" on public.user_profiles
  for delete using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. user_settings — cada usuário só vê/edita as próprias settings.
--    INSERT inicial também é feito pelo trigger; a policy de insert cobre o
--    upsert via app (store.saveCongregationName).
-- -----------------------------------------------------------------------------
alter table public.user_settings enable row level security;
drop policy if exists "own_select_settings" on public.user_settings;
drop policy if exists "own_update_settings" on public.user_settings;
drop policy if exists "own_insert_settings" on public.user_settings;
create policy "own_select_settings" on public.user_settings
  for select using (user_id = auth.uid());
create policy "own_update_settings" on public.user_settings
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_insert_settings" on public.user_settings
  for insert with check (user_id = auth.uid());
