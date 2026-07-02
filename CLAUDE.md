# Controle de Arranjo de Carrinhos

SPA React com Supabase (PostgreSQL) para programação semanal de testemunho público com carrinho.
Sistema de congregação única (não multi-tenant).

## Comandos

```bash
npm run dev      # Dev server em http://localhost:5173
npm run build    # Build de produção em dist/
npm run preview  # Visualizar build localmente
# Sem ESLint configurado — usar `npm run build` para detectar erros de import/compilação
```

## Arquitetura

```
src/
  store/
    useAppStore.js    # Zustand async: estado global + actions CRUD via Supabase API
    useAuthStore.js   # Zustand: sessão Supabase (signIn/signOut/initAuth)
  api/
    client.js         # getSupabaseClient() lazy singleton; retorna null sem .env
    brothers|carts|locations|groups|slots|scheduleWeeks|assignments|userSettings.js  # CRUD por entidade
    userProfiles.js   # CRUD de user_profiles (admin): getAllUsers, updateUserApprovalStatus, updateUserRole
    export.js         # exportAllData() + downloadJSON() — backup JSON
    import.js         # validateImportData() + importDataFromJSON() — restauração JSON
  pages/             # Dashboard, Brothers, Carts, Locations, Schedule, Report, Settings
  components/
    Layout/           # Sidebar + Header
    ui/Modal.jsx      # Modal reutilizável
  hooks/
    useRoleCheck.js   # useRoleCheck(requiredRole?) → boolean; sem arg = só verifica aprovação
```

## Migração Supabase

Guiada por `docs/USER_STORIES_SUPABASE_MIGRATION.md` (EP-01..EP-09). Todos concluídos.

- **useAppStore é Supabase puro** (EP-05): sem `db`/`persist` no estado. Actions async com padrão `set loading → try/catch → update state → finally`. `initializeData()` usa `Promise.allSettled`.
- **useAuthStore** gerencia sessão independentemente. Não misturar os dois stores.
- **Client lazy**: `getSupabaseClient()` em `src/api/client.js` retorna `null` sem `.env` (não há export `supabase` eager). Sempre null-check antes de usar.
- **Auth (EP-02)**: sign-up só cria sessão automática se "Confirm email" estiver **desativado** no projeto Supabase.
- **Schema**: 5 migrations em `supabase/migrations/` (aplicar em ordem numérica via SQL Editor). `user_profiles` tem coluna `email` (populada pelo trigger + backfill).
- **RLS habilitado** (migration `20260614120000_enable_rls_policies.sql`): controle de acesso em **duas camadas** — RBAC client-side (EP-09) + RLS no banco. Modelo: leitura = qualquer aprovado (`is_approved()`); escrita = só admin (`is_admin()`); `user_profiles`/`user_settings` por usuário. Funções helper são `SECURITY DEFINER` (evitam recursão). **Não** é multi-tenant: `user_id` é rastreabilidade, não isolamento. Ao rodar essa migration no SQL Editor, **NÃO** clicar "Run without RLS".
- **Aplicar migrations**: CLI não logada localmente (sem `psql`/DB password). Aplicar manual via SQL Editor do dashboard (na ordem dos arquivos) ou `supabase login`+`link`+`db push`.

## RBAC (EP-09)

- `role='admin'` — acesso total (edição, programação, admin panel)
- `role='user'` — apenas `/report` (visualização geral da congregação)
- `RoleRoute` usa `useRoleCheck('admin')` — redireciona não-admins para `/report`
- `AdminRoute` usa `useRoleCheck('admin')` — redireciona não-admins para `/dashboard`
- **Leituras sem filtro `user_id`**: APIs GET não filtram por usuário (congregação única compartilhada). Escritas (INSERT/UPDATE/DELETE) mantêm `user_id` para rastreabilidade.
- Primeiro usuário a se cadastrar vira admin automaticamente (trigger `handle_new_user`).

## Gotchas críticos

- **`initializeData()` só no App.jsx**: nunca chamar em páginas individuais. O `if (loading)` em App.jsx está fora do `<BrowserRouter>` — qualquer `loading=true` desmonta o router inteiro, causando remontagem infinita se uma page chama `initializeData()` no `useEffect`.
- **congregationName no Supabase**: migrado do localStorage para `user_settings` via `store.saveCongregationName()`.
- **Backup JSON**: Preferências → Exportar dados (JSON) via `exportAllData()`. O `.db` OPFS não é mais o mecanismo principal.

## Gotchas de UI / responsividade mobile

- **Breakpoint único `md` (768px)**: toda a responsividade do app usa só esse ponto de virada (drawer do Sidebar, tabelas, grade do Schedule). Não introduzir `sm`/`lg` como breakpoint de layout — `sm:grid-cols-2` só é usado dentro de formulários em modal.
- **Headers com dois grupos flex** (`flex items-center justify-between` combinando nav + toolbar de botões): o `flex-wrap` precisa estar no container **externo**, não só nos grupos internos — senão a linha estoura horizontalmente em mobile mesmo com wrap interno já presente (bug real encontrado em `Schedule.jsx`).
- **Testar mobile via claude-in-chrome**: `resize_window` não altera `window.innerWidth` neste ambiente (fica travado no tamanho real da janela) — não confiar em screenshots do agente para validar breakpoints; pedir para o usuário testar em dispositivo real ou orientar DevTools manual.
- **Report.jsx — `data-print-target`**: o mesmo elemento serve a três consumidores — tela (fluida), impressão nativa (`@media print` em `src/index.css`, `@page A4 landscape margin 10mm`) e exportação PDF/imagem (`html2pdf`/`html2canvas`). Para a exportação sair em fidelidade desktop independente do dispositivo, usar `windowWidth` em `.set({ html2canvas: {...} })`.

## Gotchas Supabase

- **IDs são UUID string**: nunca usar `Number(id)` para comparar ou passar IDs de entidades.
- **`active` é boolean**: `brother.active === true` (não `=== 1`). `getBrothers()` já filtra `active=true` — o store só contém ativos.
- **Toggle → Delete**: não há `toggleBrotherActive` — use `store.deleteBrother(id)` com `window.confirm()`.
- **getSlotsWithDetails()**: use este (não `getSlots()`) em Schedule.jsx — inclui `location_name` e `cart_name` via join.
- **deleteAssignmentsByWeek(weekId)**: apaga todas as designações de uma semana (usado em "Limpar tudo").
- **Supabase join syntax**: `.select('*, locations(name), carts(name)')` — resultado em `slot.locations.name`, não `slot.location_name` (mapear no módulo).
- **brothers API**: `createBrother({ name, phone, notes })` e `updateBrother(id, { name, phone, notes })` — passar objeto, não só `name`.

## Banco de dados

Tabelas: `brothers`, `carts`, `locations`, `groups`, `slots`, `schedule_weeks`, `assignments`, `user_profiles`, `user_settings`.
Chave de designação: `UNIQUE(week_id, slot_id, position)` — upsert via `ON CONFLICT DO UPDATE`.
`week_start` sempre segunda-feira no formato `YYYY-MM-DD`.
Deleção de usuário em `auth.users` apaga **todos os dados** cadastrados por ele em cascata.

## Dependências notáveis

- `html2pdf.js` — geração de PDF a partir do DOM (tem vulns transitivas inofensivas, não atualizar)
- `date-fns` — manipulação de datas (sem locale pt-BR nos imports — usar strings formatadas manualmente)
