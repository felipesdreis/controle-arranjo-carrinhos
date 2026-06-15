# Controle de Arranjo de Carrinhos

SPA (Single Page Application) em React para a **programação semanal de testemunho público com carrinho** de uma congregação. Permite cadastrar irmãos, carrinhos, locais e grupos, montar a escala semanal de designações e exportar relatórios em PDF.

Sistema de **congregação única** (não multi-tenant): todos os usuários aprovados compartilham os mesmos dados.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite 5 |
| Estilo | Tailwind CSS 3 |
| Estado | Zustand 4 |
| Roteamento | React Router 6 |
| Backend / Banco | Supabase (PostgreSQL + Auth) |
| Ícones | lucide-react |
| PDF | html2pdf.js |
| Datas | date-fns |

---

## Funcionalidades

- 🔐 **Autenticação** via Supabase (sign-up / sign-in / sessão)
- 👥 **Cadastros**: irmãos, carrinhos, locais e grupos
- 🗓️ **Programação semanal** de designações por slot (local + horário + carrinho)
- 📊 **Relatório** geral da congregação (visível a todos os aprovados)
- 📄 **Exportação em PDF** da programação
- 💾 **Backup/restauração** em JSON (exportar / importar dados)
- 🛡️ **Controle de acesso (RBAC)** em duas camadas: na aplicação + RLS no banco

---

## Papéis de usuário (RBAC)

| Papel | Acesso |
|---|---|
| `admin` | Acesso total: cadastros, programação e painel de administração |
| `user` | Apenas `/report` (visualização geral da congregação) |

O **primeiro usuário** a se cadastrar vira `admin` automaticamente e já fica aprovado. Os demais entram como `user` pendente, aguardando aprovação de um admin no painel de usuários.

---

## Começando

### Pré-requisitos

- Node.js 18+
- Um projeto no [Supabase](https://supabase.com)

### Instalação

```bash
git clone https://github.com/seu-usuario/controle-arranjo-carrinhos.git
cd controle-arranjo-carrinhos
npm install
```

### Variáveis de ambiente

Copie `.env.example` para `.env` e preencha com os dados do seu projeto Supabase
(**Settings → API** no dashboard):

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

> O app funciona sem `.env`, mas o client do Supabase retorna `null` e nenhuma operação de dados ocorre.

### Banco de dados

Aplique as migrations de `supabase/migrations/` **na ordem dos arquivos** (timestamps), via
**SQL Editor** do dashboard Supabase. Veja [supabase/README.md](supabase/README.md) para detalhes.

> ⚠️ Ao aplicar a migration de RLS (`20260614120000_enable_rls_policies.sql`), **não** clique em
> "Run without RLS" — o objetivo é justamente habilitar o RLS.

### Rodar localmente

```bash
npm run dev      # dev server em http://localhost:5173
```

---

## Scripts

```bash
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção em dist/
npm run preview  # visualizar o build localmente
```

> Sem ESLint configurado — use `npm run build` para detectar erros de import/compilação.

---

## Estrutura

```
src/
  store/         # Zustand: useAppStore (dados) e useAuthStore (sessão)
  api/           # CRUD por entidade via Supabase + export/import JSON
  pages/         # Dashboard, Brothers, Carts, Locations, Schedule, Report, Settings, Admin, Auth
  components/    # Layout (Sidebar/Header), ui (Modal), guards de rota
  hooks/         # useRoleCheck (verificação de papel/aprovação)
supabase/
  migrations/    # schema PostgreSQL (5 migrations) + policies RLS
```

---

## Segurança (RLS)

O `anon key` do Supabase é **público** (vai no bundle do navegador). Por isso o controle de acesso
acontece em **duas camadas**:

1. **RBAC client-side** — esconde rotas/ações conforme o papel do usuário.
2. **RLS no banco** (migration `20260614120000_enable_rls_policies.sql`) — impõe as regras no
   PostgreSQL, contornável apenas por quem tem credenciais de serviço:
   - **Leitura**: qualquer usuário logado **e aprovado**.
   - **Escrita**: somente **admin aprovado**.
   - `user_profiles` / `user_settings`: por usuário.

---

## Deploy (Vercel)

1. Suba o repositório no GitHub.
2. Em [vercel.com](https://vercel.com): **Add New Project** → selecione o repositório (o Vercel
   detecta Vite automaticamente).
3. Configure as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em **Environment Variables**.
4. **Deploy**. O [vercel.json](vercel.json) cuida do roteamento SPA (rewrites para `index.html`).
5. No Supabase, em **Authentication → URL Configuration**, adicione a URL do Vercel em
   **Site URL** e **Redirect URLs**.

> Aplique as migrations (incluindo a de RLS) **antes** de expor o app publicamente.
