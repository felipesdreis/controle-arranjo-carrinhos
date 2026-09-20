# Graph Report - controle-arranjo-carrinhos  (2026-09-13)

## Corpus Check
- Corpus is ~35,876 words - fits in a single context window. You may not need a graph.

## Summary
- 323 nodes · 730 edges · 42 communities (15 shown, 25 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.85)
- Token cost: 147,189 input · 0 output

## Community Hubs (Navigation)
- API de Designacoes e Irmaos
- Relatorio e Agenda Semanal
- Componentes UI Reutilizaveis
- Dependencias do Projeto
- App Shell e Admin de Usuarios
- Documentacao RBAC/RLS
- Fluxo de Autenticacao
- API de Autenticacao Supabase
- Tipos TypeScript do Supabase
- Pagina de Irmaos (handlers)
- Pagina de Carrinhos (handlers)
- Documentacao do Projeto
- Spec Relatorio Por Irmao
- Pagina de Localizacoes (handlers)
- Migracao do Store Zustand
- Backup e Importacao JSON
- Infraestrutura Supabase (EP-01)
- Impressao/PDF do Relatorio
- Requisitos Funcionais e RBAC
- Remocao de sql.js/OPFS
- README: Schema PostgreSQL
- Configuracao Vercel (rewrites)
- Gotcha: Breakpoint Unico md
- Dependencia date-fns
- Dependencia html2pdf.js
- Gotcha: initializeData() no App
- Gotcha: Guarda is_approved
- Gotcha: Rota /reset-password
- Diagrama de Componentes
- Fluxo de Dados do Sistema
- LGPD e Privacidade
- Visao Geral do Projeto
- Stack Tecnologica
- UI Modo Por Irmao
- EP-02: Autenticacao
- EP-04: Camada de API
- EP-06: Migracao de Pages
- Deploy no Vercel
- Seguranca RLS (anon key)
- Migration: Email em user_profiles

## God Nodes (most connected - your core abstractions)
1. `requireAuthedClient()` - 47 edges
2. `useAppStore` - 28 edges
3. `Schedule()` - 26 edges
4. `useAuthStore` - 20 edges
5. `lucide-react` - 16 edges
6. `react` - 16 edges
7. `importDataFromJSON()` - 13 edges
8. `exportAllData()` - 12 edges
9. `getSupabaseClient()` - 11 edges
10. `Card()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Segurança e Governança (RBAC duas camadas)` --semantically_similar_to--> `RBAC em duas camadas (client-side + RLS)`  [INFERRED] [semantically similar]
  DOC_SOL_CONTROLE_ARRANJO_CARRINHOS.md → CLAUDE.md
- `Report.jsx data-print-target (tela/impressão/PDF)` --semantically_similar_to--> `Impressão/Exportação PDF condicional por modo (reportRef)`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/superpowers/specs/2026-07-02-relatorio-por-irmao-design.md
- `Banco de dados: brothers, carts, locations, groups, slots, schedule_weeks, assignments, user_profiles, user_settings` --semantically_similar_to--> `20260612120000_create_base_tables.sql`  [INFERRED] [semantically similar]
  CLAUDE.md → supabase/README.md
- `Papéis de usuário (RBAC): admin/user` --semantically_similar_to--> `Requisitos Funcionais RF01-RF05`  [INFERRED] [semantically similar]
  README.md → DOC_SOL_CONTROLE_ARRANJO_CARRINHOS.md
- `Segurança e Governança (RBAC duas camadas)` --semantically_similar_to--> `Modelo RLS: leitura=aprovado, escrita=admin`  [INFERRED] [semantically similar]
  DOC_SOL_CONTROLE_ARRANJO_CARRINHOS.md → supabase/README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Padrão de segurança RBAC em duas camadas (client-side + RLS)** — claude_rbac, readme_rls_security, doc_sol_controle_arranjo_carrinhos_seguranca, supabase_readme_rls_model, docs_user_stories_supabase_migration_ep09 [INFERRED 0.85]
- **Fluxo de implementação da feature "Por irmão" no Relatório** — docs_superpowers_plans_2026_07_02_relatorio_por_irmao_plan, docs_superpowers_specs_2026_07_02_relatorio_por_irmao_design_doc, docs_superpowers_plans_2026_07_02_relatorio_por_irmao_task1, docs_superpowers_plans_2026_07_02_relatorio_por_irmao_task2, docs_superpowers_plans_2026_07_02_relatorio_por_irmao_buildbrotherrows [EXTRACTED 1.00]
- **Migrations e schema que implementam o controle de acesso do EP-09** — docs_user_stories_supabase_migration_us37, supabase_readme_enable_rls_policies, supabase_readme_add_email_to_user_profiles, claude_rls_migration [INFERRED 0.85]

## Communities (42 total, 25 thin omitted)

### Community 0 - "API de Designacoes e Irmaos"
Cohesion: 0.13
Nodes (39): deleteAssignment(), getAssignments(), getAssignmentsByWeek(), createBrother(), deleteBrother(), getBrothers(), updateBrother(), createCart() (+31 more)

### Community 1 - "Relatorio e Agenda Semanal"
Cohesion: 0.08
Nodes (34): date-fns, html2pdf.js, deleteAssignmentsByWeek(), upsertAssignment(), createScheduleWeek(), getSlotsWithDetails(), getPeriodFromTime(), getThisMonday() (+26 more)

### Community 2 - "Componentes UI Reutilizaveis"
Cohesion: 0.11
Nodes (18): lucide-react, Badge(), Button(), variants, Card(), IconChip(), Modal(), StatCard() (+10 more)

### Community 3 - "Dependencias do Projeto"
Cohesion: 0.06
Nodes (33): dependencies, date-fns, html2pdf.js, lucide-react, react, react-dom, react-router-dom, @supabase/supabase-js (+25 more)

### Community 4 - "App Shell e Admin de Usuarios"
Cohesion: 0.11
Nodes (22): react-router-dom, validateSupabaseConfig(), getAllUsers(), getPendingUsers(), updateUserApprovalStatus(), updateUserRole(), AdminRoute(), App() (+14 more)

### Community 5 - "Documentacao RBAC/RLS"
Cohesion: 0.13
Nodes (19): Banco de dados: brothers, carts, locations, groups, slots, schedule_weeks, assignments, user_profiles, user_settings, RBAC em duas camadas (client-side + RLS), Migration RLS (20260614120000_enable_rls_policies.sql), useAuthStore, useRoleCheck hook, Segurança e Governança (RBAC duas camadas), EP-03 — Schema PostgreSQL no Supabase, EP-09 — Controle de Acesso (Aprovação e Roles) (+11 more)

### Community 6 - "Fluxo de Autenticacao"
Cohesion: 0.34
Nodes (13): react, validateEmail(), validatePassword(), validatePasswordMatch(), ForgotPassword(), handleSubmit(), SignIn(), handleSubmit() (+5 more)

### Community 7 - "API de Autenticacao Supabase"
Cohesion: 0.47
Nodes (9): isEmailAlreadyRegistered(), mapErrorMessage(), requestPasswordReset(), signInWithPassword(), signOut(), signUp(), updatePassword(), getSupabaseClient() (+1 more)

### Community 8 - "Tipos TypeScript do Supabase"
Cohesion: 0.29
Nodes (6): Database, DayOfWeek, Json, Tables, TablesInsert, TablesUpdate

### Community 9 - "Pagina de Irmaos (handlers)"
Cohesion: 0.40
Nodes (3): Brothers(), closeModal(), handleSubmit()

### Community 10 - "Pagina de Carrinhos (handlers)"
Cohesion: 0.40
Nodes (3): Carts(), closeModal(), handleSubmit()

### Community 11 - "Documentacao do Projeto"
Cohesion: 0.50
Nodes (5): Controle de Arranjo de Carrinhos (Projeto), Plano: Relatório "Por irmão", Design: Relatório "Por irmão", Migração para Supabase — User Stories, index.html (entry point SPA)

### Community 12 - "Spec Relatorio Por Irmao"
Cohesion: 0.50
Nodes (5): buildBrotherRows(slots, rawAssignments, brothers, brotherId), buildReportGridByCart(slots, rawAssignments, brothers), Task 1: Refatorar loadData para state bruto + grid via useMemo, Task 2: Implementar modo "Por irmão" (toggle, seletor, tabela), Especificação de buildBrotherRows (regras de filtragem/ordenação)

### Community 14 - "Migracao do Store Zustand"
Cohesion: 0.67
Nodes (3): useAppStore, EP-05 — Migração do Store (Zustand), US-23 — Refatorar useAppStore para operações async

### Community 15 - "Backup e Importacao JSON"
Cohesion: 1.00
Nodes (3): EP-07 — Backup e Importação de Dados, US-32 — Exportação de dados em JSON (exportAllData), US-33 — Importação de dados em JSON (importDataFromJSON)

## Knowledge Gaps
- **81 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+76 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 123 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Fluxo de Autenticacao` to `Relatorio e Agenda Semanal`, `Componentes UI Reutilizaveis`, `Dependencias do Projeto`, `App Shell e Admin de Usuarios`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `useAppStore` connect `API de Designacoes e Irmaos` to `Relatorio e Agenda Semanal`, `Componentes UI Reutilizaveis`, `App Shell e Admin de Usuarios`, `Pagina de Irmaos (handlers)`, `Pagina de Carrinhos (handlers)`, `Pagina de Localizacoes (handlers)`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `Componentes UI Reutilizaveis` to `Relatorio e Agenda Semanal`, `Dependencias do Projeto`, `App Shell e Admin de Usuarios`, `Fluxo de Autenticacao`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _81 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API de Designacoes e Irmaos` be split into smaller, more focused modules?**
  _Cohesion score 0.1313497822931785 - nodes in this community are weakly interconnected._
- **Should `Relatorio e Agenda Semanal` be split into smaller, more focused modules?**
  _Cohesion score 0.08130081300813008 - nodes in this community are weakly interconnected._
- **Should `Componentes UI Reutilizaveis` be split into smaller, more focused modules?**
  _Cohesion score 0.10952380952380952 - nodes in this community are weakly interconnected._