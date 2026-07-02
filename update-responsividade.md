# Plano: Responsividade + Redesign (Material + Bento)

## Contexto

Duas necessidades, tratadas numa entrega coesa:

1. **Responsividade** — o site é acessado de celulares e tablets, mas hoje não é responsivo: sidebar fixa `w-64` sempre visível, tabelas/grade sem scroll horizontal, padding fixo `px-8`/`p-6`.
2. **Redesign visual** — adotar uma identidade **Material Design + Bento**, seguindo o arquivo `Testemunho Público - Standalone Exemplo design.html` (o app real está em bundle base64; o thumbnail SVG é a referência visual e dele foram extraídos os tokens abaixo).

**Resultado esperado:** app utilizável e bonito em celular, tablet e desktop, com visual coeso Material/Bento em todas as páginas.

Decisões do usuário: navegação mobile = **drawer com hambúrguer** (fixa em desktop); responsividade = **pragmática** (drawer + padding responsivo + scroll horizontal, sem reescrever tabelas como cards); redesign = **completo** (shell + todas as páginas); tokens = **centralizados em `tailwind.config.js`**.

---

## Parte A — Design system (tokens + linguagem visual)

Hoje o projeto usa Tailwind puro com `tailwind.config.js` default e paleta `slate/gray`. Vamos estender o theme com a identidade do exemplo e padronizar componentes.

### A1. Tokens em `tailwind.config.js`

Estender `theme.extend` com paleta, raios e sombras nomeados (referência: thumbnail SVG do exemplo):

- **Cores**
  - `brand` (verde): DEFAULT `#1B6B4E`, `dark` `#0E1C16` (sidebar), `mint` `#A3DEC4` (acento sidebar), `surface` `#E3F5EC` (chip de ícone).
  - `surface`: `bg` `#EDF2EE` (fundo do app), `card` `#FFFFFF`, `subtle` `#F5FAF7` (botões/ações), `border` `#E7EFE9`.
  - `accent`: `blue` `#1558D6`, `green` `#1B6B4E`, `purple` `#6B3AC8`, `orange` `#C85A12` (+ versões `*-soft` para fundo de chip: `#EBF0FD`, `#E3F5EC`, `#F0E9FC`, `#FEF2E8`).
  - `ink`: `#0D1F17` (texto principal escuro esverdeado).
- **Raios**: `rounded-card` = `1rem` (16px, Bento), reaproveitar `rounded-xl`/`2xl`.
- **Sombras (elevação Material)**: `shadow-card` (`0 1px 4px rgba(13,31,23,.06)`), `shadow-card-hover` (`0 4px 16px rgba(13,31,23,.10)`).
- Manter `@media print` em `src/index.css` intacto. Opcional: definir `body { background: theme(surface.bg) }` em `src/index.css`.

### A2. Componentes de UI reutilizáveis (novos, em `src/components/ui/`)

Para evitar repetição de classes e manter consistência Bento/Material:

- `Card.jsx` — superfície branca `rounded-card shadow-card`, prop opcional `accent` que renderiza a **barra de acento superior** (3px) na cor da categoria.
- `IconChip.jsx` — quadrado `40px rounded-[10px]` com fundo tonalizado (`accent.*-soft`) + ícone na cor `accent.*`. Estilo Material.
- `StatCard.jsx` — usa `Card` + `IconChip` + número grande + legenda (para o bento do Dashboard).
- `Button.jsx` (opcional) — variantes `primary` (brand preenchido), `subtle` (`surface.subtle` + borda), `ghost`. Substitui as classes repetidas de botão.

Esses componentes serão usados nas páginas; restyle das telas existentes reaproveita-os.

---

## Parte B — Responsividade (shell)

### B1. Sidebar como drawer + nova identidade

**Arquivos:** `src/App.jsx`, `src/components/Layout/Sidebar.jsx`, `src/components/Layout/Header.jsx`

- Estado `sidebarOpen` no `AppLayout` (`App.jsx:39`), passado a `Sidebar`/`Header`.
- **Sidebar** (`Sidebar.jsx:43`): cor de fundo passa para `brand-dark` (`#0E1C16`); logo num `IconChip` verde; item ativo com `bg-brand-mint/10 text-brand-mint`, inativo `text-white/40`. Comportamento responsivo: desktop `md:static md:translate-x-0`; mobile `fixed inset-y-0 left-0 z-40` com `transform` (`-translate-x-full` fechado / `translate-x-0` aberto). **Overlay** `fixed inset-0 bg-black/50 z-30 md:hidden` que fecha ao clicar. Fechar ao navegar (cada `NavLink` chama `onClose`).
- **Header** (`Header.jsx:32`): fundo branco, texto `ink`; botão **hambúrguer** (`Menu` do `lucide-react`) à esquerda, `md:hidden`, dispara `onMenuClick`. Manter `hidden sm:block` no email/"Sair".
- `<main>` (`App.jsx:45`): `p-6` → `p-4 md:p-6`; fundo `surface-bg`.

### B2. Padding responsivo nas páginas

Padrão repetido: `px-8` → `px-4 md:px-8`; `py-5`/`py-6` → `py-4 md:py-6` quando necessário.

**Arquivos:** `Brothers.jsx`, `Carts.jsx`, `Locations.jsx`, `Schedule.jsx`, `Report.jsx`, `Settings.jsx`, `Admin/Users.jsx`, `Dashboard.jsx`.

### B3. Tabelas com scroll horizontal

Envolver cada `<table>` num container `overflow-x-auto` e dar `min-w-[640px]` à `<table>` (em vez de cortar colunas). **Arquivos:** `Brothers.jsx:82`, `Carts.jsx`, `Admin/Users.jsx`.

### B4. Grade de Programação (Schedule)

`src/pages/Schedule.jsx`: grade num `overflow-x-auto` com `min-w`; toolbar (`Schedule.jsx:115+`) com `flex-wrap gap-2` para quebrar linha no mobile; padding responsivo.

### B5. Modal

`src/components/ui/Modal.jsx`: já tem `p-4` + `max-w-md`; adicionar `max-h-[90vh] overflow-y-auto` ao card e aplicar `rounded-card`/`shadow-card`.

### B6. Report (tela vs. PDF)

`src/pages/Report.jsx`: **não alterar** os `style={{ width: '277mm' }}` (são do PDF/print). Apenas envolver a pré-visualização em `overflow-x-auto`. `data-print-target` permanece intacto.

---

## Parte C — Restyle das páginas (Material + Bento)

Aplicar a nova identidade reaproveitando os componentes da Parte A:

- **Dashboard** (`Dashboard.jsx`): converter em **bento grid** — linha de `StatCard`s (cada um com `IconChip` + barra de acento por categoria: azul/verde/roxo/laranja), card de **ações rápidas** (botões `subtle`) ocupando colspan maior, e card de **destaque** (semana atual) preenchido em `brand` verde com texto claro. Reaproveitar o grid responsivo já existente (`grid-cols-2 ... lg:grid-cols-4`).
- **Tabelas** (Brothers/Carts/Users): envolver em `Card`, cabeçalho `bg-surface-subtle`, linhas com hover suave; badges de status já existentes ganham as cores da paleta.
- **Locations** (accordions) e **Settings** (forms): superfícies em `Card`, inputs com borda `surface-border` e foco `brand`; botões via `Button`.
- **Schedule**: células da grade e cabeçalhos seguindo cards/acentos; botões da toolbar via `Button`.
- **Auth** (`pages/Auth/AuthPage.jsx`): aplicar fundo `surface-bg` e card central no novo estilo (coerência da tela de login).

Substituir progressivamente as cores `slate-*`/`gray-*` hard-coded pelas semânticas (`brand`, `ink`, `surface-*`, `accent-*`).

---

## Arquivos a modificar (resumo)

- **Tokens/config:** `tailwind.config.js`, `src/index.css` (fundo do body; print intacto).
- **Novos componentes:** `src/components/ui/Card.jsx`, `IconChip.jsx`, `StatCard.jsx`, `Button.jsx`.
- **Shell:** `src/App.jsx`, `src/components/Layout/Sidebar.jsx`, `src/components/Layout/Header.jsx`.
- **Páginas:** `Dashboard.jsx`, `Brothers.jsx`, `Carts.jsx`, `Locations.jsx`, `Schedule.jsx`, `Report.jsx`, `Settings.jsx`, `Admin/Users.jsx`, `Auth/AuthPage.jsx`.
- **Modal:** `src/components/ui/Modal.jsx`.

## Verificação

1. `npm run build` — gate de compilação/import (sem ESLint configurado).
2. `npm run dev` e testar em ~375px (celular), ~768px (tablet) e ~1280px (desktop):
   - **Responsividade:** drawer abre/fecha pelo hambúrguer e pelo overlay; navegação fecha o drawer; tabelas e grade da Programação rolam na horizontal sem estourar; modal cabe e rola; desktop mantém sidebar fixa.
   - **Design:** Dashboard em bento grid com stat cards (chips + barras de acento) e card destaque verde; sidebar verde-escura com item ativo em menta; superfícies/sombras/raios coerentes em todas as páginas; cores semânticas aplicadas (sem `slate/gray` soltos relevantes).
3. Comparar visualmente com o thumbnail do `Testemunho Público - Standalone Exemplo design.html`.
4. Conferir que a exportação de PDF do Relatório continua idêntica (não afetada).
