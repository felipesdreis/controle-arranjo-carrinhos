# DOC_SOL_CONTROLE_ARRANJO_CARRINHOS

> **Versão:** 1.0 · **Data:** 2026-07-02 · **Autor:** Claude Code

---

## 1. Visão Geral e Contexto

### Objetivo do Projeto

Elimina o controle manual (planilha/papel) da escala semanal de testemunho público com carrinho de
uma congregação: centraliza cadastro de irmãos, carrinhos e locais/turnos, monta a programação
semanal com detecção automática de conflitos e gera o relatório final (tela, impressão e
exportação em PDF/imagem) para divulgação aos irmãos.

### Escopo

**O que faz:**
- Cadastro de irmãos, carrinhos e locais (com turnos por local: dia da semana, horário, capacidade)
- Montagem da programação semanal por carrinho, com preenchimento automático e detecção de
  conflito (mesmo irmão designado duas vezes no mesmo dia)
- Relatório semanal em duas visões (por carrinho / por irmão), impressão nativa e exportação em
  PDF (relatório completo) ou imagem (card individual do irmão)
- Autenticação por e-mail/senha (Supabase Auth) com aprovação manual de novos cadastros e dois
  papéis de acesso (admin / user)
- Exportação e importação de backup completo dos dados em JSON

**O que NÃO faz:**
- Não é multi-tenant — atende **uma única congregação** por instância/projeto Supabase
- Não envia notificações (e-mail/push/SMS) aos irmãos designados
- Não lida com pagamentos, doações ou qualquer dado financeiro
- Não tem app mobile nativo — é uma SPA web responsiva (desktop e mobile via navegador)

### Público-alvo

| Perfil | Interação |
|---|---|
| Administrador (`role='admin'`) | Cadastra irmãos/carrinhos/locais, monta a programação semanal, aprova novos usuários e gerencia papéis em `/admin/users`, exporta relatórios e backups |
| Usuário aprovado (`role='user'`) | Acesso restrito a `/report` — visão geral (somente leitura) da programação da congregação |
| Novo cadastro (pendente de aprovação) | Cria conta mas fica bloqueado numa tela de espera até um admin aprovar (`is_approved=false`) |

---

## 2. Arquitetura da Solução

### Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────┐
│                 Navegador — SPA React (Vite)               │
│                                                              │
│   ┌───────────────┐   ┌───────────────┐   ┌─────────────┐ │
│   │ useAuthStore   │   │  useAppStore   │   │  pages/*    │ │
│   │  (Zustand)     │   │  (Zustand)     │   │  Dashboard  │ │
│   │  sessão, role,  │   │  brothers,     │   │  Brothers   │ │
│   │  aprovação      │   │  carts, slots, │   │  Carts      │ │
│   └───────┬────────┘   │  assignments…  │   │  Locations  │ │
│           │            └───────┬────────┘   │  Schedule   │ │
│           │                    │             │  Report     │ │
│           └──────────┬─────────┘             │  Settings   │ │
│                       │                       │  Admin/Users│ │
│               src/api/*.js (CRUD por entidade)└─────────────┘ │
└───────────────────────┼──────────────────────────────────────┘
                         │ HTTPS (@supabase/supabase-js)
                         ▼
        ┌───────────────────────────────────────┐
        │              Supabase (BaaS)            │
        │  ┌─────────────┐   ┌─────────────────┐ │
        │  │ PostgreSQL   │   │  Auth (email/pw) │ │
        │  │ + RLS        │   │  is_approved()   │ │
        │  │ (9 tabelas)  │   │  is_admin()       │ │
        │  └─────────────┘   └─────────────────┘ │
        └───────────────────────────────────────┘
                         ▲
                         │ deploy estático (git push)
                ┌────────┴────────┐
                │      Vercel      │
                └──────────────────┘
```

### Stack Tecnológica

| Componente | Tecnologia | Justificativa |
|---|---|---|
| Frontend | React 18 + Vite 5 | SPA leve, build e HMR rápidos |
| Estilo | Tailwind CSS 3 | Utilitário; breakpoint único (`md`, 768px) padronizado em todo o app |
| Estado | Zustand 4 | Dois stores independentes (auth/app) sem boilerplate de Redux |
| Backend/BaaS | Supabase (PostgreSQL + Auth + RLS) | Elimina backend próprio; autorização reforçada no banco via RLS |
| Roteamento | React Router 6 | Client-side routing com guards de papel (`RoleRoute`/`AdminRoute`) |
| PDF/Imagem | html2pdf.js (html2canvas + jsPDF) | Exportação 100% client-side, sem serviço de renderização |
| Ícones | lucide-react | Biblioteca leve de ícones SVG |
| Datas | date-fns | Sem locale pt-BR nos imports — strings formatadas manualmente |
| Deploy | Vercel | Deploy estático a partir do build do Vite, via push no GitHub |

### Fluxo de Dados

1. **Entrada:** o usuário autentica via Supabase Auth (e-mail/senha); dados de cadastro (irmãos,
   carrinhos, locais, turnos) e designações semanais são inseridos por formulários nas páginas.
2. **Processamento:** `useAppStore` chama módulos de `src/api/*.js`, que usam o client lazy
   (`getSupabaseClient()`) para CRUD direto no PostgreSQL, sempre sujeito às policies de RLS.
   `useAuthStore` gerencia sessão, papel e status de aprovação separadamente, via
   `onAuthStateChange`.
3. **Saída/Armazenamento:** os dados persistem nas tabelas do Supabase. O relatório é montado a
   partir do estado em memória e pode ser impresso (`window.print()`), exportado em PDF/imagem
   (`html2pdf.js`/`html2canvas`) ou a base inteira exportada/importada em JSON
   (`exportAllData()`/`importDataFromJSON()`).

---

## 3. Requisitos e Integrações

### Requisitos Funcionais Principais

| # | Requisito | Prioridade |
|---|---|---|
| RF01 | Cadastrar, editar e excluir irmãos, carrinhos e locais (com turnos por local) | Alta |
| RF02 | Montar a programação semanal por carrinho, com preenchimento automático e detecção de conflito (mesmo irmão, mesmo dia) | Alta |
| RF03 | Gerar relatório semanal (por carrinho ou por irmão), imprimir e exportar em PDF/imagem | Alta |
| RF04 | Controlar acesso por papel (admin/user) com aprovação manual de novos cadastros | Alta |
| RF05 | Exportar e importar backup completo dos dados em JSON | Média |

### Integrações Externas

| Sistema | Protocolo | Formato | Autenticação |
|---|---|---|---|
| Supabase (PostgreSQL + Auth) | HTTPS/REST (`@supabase/supabase-js`) | JSON | Anon key no client + sessão de usuário validada por RLS |
| Vercel (deploy) | HTTPS | — | Deploy contínuo via push no repositório GitHub |

---

## 4. Guia de Implementação e Configuração

### Pré-requisitos

- Node.js compatível com Vite 5 / React 18
- Projeto Supabase criado, com as 6 migrations de `supabase/migrations/` aplicadas **em ordem
  numérica** (via SQL Editor do dashboard, ou `supabase login && supabase link && supabase db push`)
- "Confirm email" **desativado** no projeto Supabase (Auth → Settings) — senão o sign-up não cria
  sessão automática

### Variáveis de Ambiente

```env
# URL do projeto Supabase (Settings → API)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co

# Chave pública (anon) do projeto Supabase (Settings → API)
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui

# Não use valores reais neste documento!
```

### Setup Passo a Passo

```bash
# 1. Clone / acesse o projeto
cd controle-arranjo-carrinhos

# 2. Instale dependências
npm install

# 3. Configure as variáveis
cp .env.example .env
# edite .env com a URL e a anon key do seu projeto Supabase

# 4. Aplique as migrations (SQL Editor do Supabase, na ordem dos arquivos em
#    supabase/migrations/) — NÃO clicar em "Run without RLS" na migration de RLS

# 5. Execute em desenvolvimento
npm run dev      # http://localhost:5173

# 6. Build de produção / preview local
npm run build     # gera dist/
npm run preview   # visualiza o build localmente
```

---

## 5. Operação, Monitoramento e Suporte

### Logs e Observabilidade

- **Localização dos logs:** console do navegador (aplicação 100% client-side, sem logging próprio
  de servidor) + logs nativos do dashboard Supabase (Auth, Database, API)
- **Como acessar:** DevTools do navegador em produção; `dashboard.supabase.com` → projeto → *Logs*
- **O que monitorar:** erros de `validateSupabaseConfig()` (env ausente ou timeout de
  conectividade em 5s), falhas de policy RLS (mensagens de permissão negada capturadas pelo
  `catch` das actions de `useAppStore`), erros de carregamento de dados do relatório (logados via
  `console.error` em `Report.jsx`)

### Tratamento de Erros e Resiliência

| Cenário de Falha | Comportamento | Ação Recomendada |
|---|---|---|
| Variáveis de ambiente Supabase ausentes | `getSupabaseClient()` retorna `null`; app exibe `ErrorScreen`/`authError` em vez de quebrar | Conferir `.env` local ou variáveis de ambiente configuradas no Vercel |
| Usuário autenticado mas não aprovado | Tela de "Aguardando aprovação" bloqueia o acesso ao restante do app | Um admin aprova o cadastro em `/admin/users` |
| Falha de policy RLS (escrita sem permissão) | Supabase retorna erro de policy; a action correspondente em `useAppStore` captura no `catch` e expõe `error` na UI | Conferir `role`/`is_approved` do usuário e as policies de `20260614120000_enable_rls_policies.sql` |
| Timeout de conectividade ao validar configuração | `validateSupabaseConfig()` aborta após 5s e retorna `{ ok: false, code: 'timeout' }` | Verificar status/disponibilidade do projeto Supabase |

### Manutenção

```bash
# Backup manual dos dados (JSON) — tela Preferências → "Exportar dados"
# equivalente programático: exportAllData() + downloadJSON() em src/api/export.js

# Restaurar a partir de um backup — tela Preferências → "Importar dados"
# equivalente programático: validateImportData() + importDataFromJSON() em src/api/import.js
```

---

## 6. Segurança e Governança

### Autenticação e Autorização

- **Mecanismo:** Supabase Auth (e-mail/senha) combinado com RBAC em **duas camadas**: guard
  client-side (`useRoleCheck`, componentes `RoleRoute`/`AdminRoute` em `src/App.jsx`) e Row Level
  Security no PostgreSQL (funções `SECURITY DEFINER` `is_approved()`/`is_admin()`, que evitam
  recursão nas policies)
- **Onde configurar:** papel em `user_profiles.role` (`admin`/`user`) e aprovação em
  `user_profiles.is_approved` — ambos editáveis apenas por um admin, na tela `/admin/users`. O
  primeiro usuário a se cadastrar vira admin automaticamente (trigger `handle_new_user`)

### LGPD / Privacidade

- **Dados sensíveis manipulados:** nome e telefone de irmãos (`brothers.name`, `brothers.phone`) e
  e-mail dos usuários do sistema (`user_profiles.email`) — dados pessoais de membros de uma
  congregação religiosa, tratados como sensíveis
- **Retenção:** os dados permanecem até exclusão manual pelo admin; excluir um usuário em
  `auth.users` apaga **em cascata** todos os dados cadastrados por ele
- **Criptografia:** em trânsito via HTTPS (Supabase e Vercel); em repouso, delegada à
  infraestrutura do Supabase — não há criptografia adicional em nível de aplicação

---

## Histórico de Revisões

| Versão | Data | Autor | Alteração |
|---|---|---|---|
| 1.0 | 2026-07-02 | Claude Code | Criação inicial |
