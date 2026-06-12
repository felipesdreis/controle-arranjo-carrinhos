# SDD — App de Programação de Testemunho Público com Carrinho

**Versão:** 1.0  
**Data:** Junho 2026  
**Stack:** React + Vite + sql.js (SQLite via WASM) + OPFS + html2pdf.js

---

## 1. Visão Geral

Aplicação web single-page (SPA) que roda localmente no navegador, sem back-end. Permite gerenciar a programação semanal de testemunho público com carrinho: cadastro de irmãos, carrinhos, locais e geração de relatório imprimível em PDF.

### 1.1 Objetivos

- Substituir planilhas manuais por uma interface intuitiva
- Persistência 100% local (sem servidor, sem nuvem)
- Geração de relatório semanal em PDF para compartilhar

### 1.2 Público-alvo

Superintendente de Testemunho Público da congregação.

---

## 2. Stack Técnica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| UI | React 18 + Vite | SPA moderna, hot-reload no dev |
| Estilo | Tailwind CSS v3 | Utilitário, sem configuração extra |
| Banco | sql.js (SQLite WASM) | SQLite real no browser |
| Persistência | OPFS (Origin Private File System) | Arquivo `.db` persistido pelo browser |
| PDF | html2pdf.js | Gera PDF direto do DOM |
| Ícones | Lucide React | Leve e consistente |
| Estado global | Zustand | Leve, sem boilerplate |
| Build | Vite | Bundle otimizado, dev rápido |

> **Nota sobre persistência:** OPFS persiste o arquivo `carrinho.db` na sandbox do browser (Chrome/Edge 102+). O usuário pode exportar/importar o `.db` manualmente para backup.

---

## 3. Estrutura de Pastas

```
src/
├── db/
│   ├── init.js          # Inicializa sql.js + OPFS
│   ├── schema.sql        # DDL completo
│   └── queries/
│       ├── brothers.js
│       ├── carts.js
│       ├── locations.js
│       ├── slots.js
│       └── assignments.js
├── store/
│   └── useAppStore.js    # Zustand store global
├── pages/
│   ├── Dashboard.jsx
│   ├── Brothers.jsx
│   ├── Carts.jsx
│   ├── Locations.jsx
│   ├── Schedule.jsx
│   └── Report.jsx
├── components/
│   ├── Layout/
│   │   ├── Sidebar.jsx
│   │   └── Header.jsx
│   ├── Table/
│   │   ├── DataTable.jsx
│   │   └── TableActions.jsx
│   ├── Forms/
│   │   ├── BrotherForm.jsx
│   │   ├── CartForm.jsx
│   │   ├── LocationForm.jsx
│   │   └── SlotForm.jsx
│   ├── Schedule/
│   │   ├── WeekGrid.jsx
│   │   ├── DayColumn.jsx
│   │   └── AssignmentCell.jsx
│   └── Report/
│       ├── ReportPreview.jsx
│       └── ReportTable.jsx
├── hooks/
│   ├── useDB.js
│   └── usePDF.js
└── main.jsx
```

---

## 4. Schema SQLite

```sql
-- ============================================================
-- TABELA: irmãos
-- ============================================================
CREATE TABLE IF NOT EXISTS brothers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    phone       TEXT,
    notes       TEXT,
    active      INTEGER NOT NULL DEFAULT 1,  -- 1=ativo, 0=inativo
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- TABELA: carrinhos
-- ============================================================
CREATE TABLE IF NOT EXISTS carts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,             -- ex: "Carrinho Azul", "Carrinho 1"
    description TEXT,
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- TABELA: locais
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,             -- ex: "Ponto Novo", "Baixada"
    address     TEXT,
    notes       TEXT,
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- TABELA: grupos (casas responsáveis)
-- ============================================================
CREATE TABLE IF NOT EXISTS groups (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,        -- ex: "Casa Diego", "Casa Lazara"
    responsible_id  INTEGER REFERENCES brothers(id),
    active          INTEGER NOT NULL DEFAULT 1
);

-- ============================================================
-- TABELA: slots (template semanal recorrente)
-- Representa um turno fixo: local + dia da semana + horário
-- ============================================================
CREATE TABLE IF NOT EXISTS slots (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    cart_id     INTEGER REFERENCES carts(id),
    group_id    INTEGER REFERENCES groups(id),
    day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
                -- 0=domingo, 1=segunda, ..., 6=sábado
    start_time  TEXT    NOT NULL,            -- formato "HH:MM"
    end_time    TEXT    NOT NULL,            -- formato "HH:MM"
    capacity    INTEGER NOT NULL DEFAULT 2,  -- nº de irmãos por turno
    active      INTEGER NOT NULL DEFAULT 1
);

-- ============================================================
-- TABELA: semanas de programação
-- ============================================================
CREATE TABLE IF NOT EXISTS schedule_weeks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start      TEXT    NOT NULL UNIQUE, -- formato "YYYY-MM-DD" (sempre segunda-feira)
    notes           TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- TABELA: designações
-- Uma entrada por irmão por turno por semana
-- ============================================================
CREATE TABLE IF NOT EXISTS assignments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    week_id         INTEGER NOT NULL REFERENCES schedule_weeks(id) ON DELETE CASCADE,
    slot_id         INTEGER NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
    brother_id      INTEGER NOT NULL REFERENCES brothers(id),
    position        INTEGER NOT NULL DEFAULT 1 CHECK(position >= 1), -- 1º ou 2º irmão
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(week_id, slot_id, position)
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_slots_day        ON slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_slots_location   ON slots(location_id);
CREATE INDEX IF NOT EXISTS idx_assignments_week ON assignments(week_id);
CREATE INDEX IF NOT EXISTS idx_assignments_slot ON assignments(slot_id);
```

---

## 5. Telas e Funcionalidades

### 5.1 Dashboard

**Rota:** `/`

- Cards de resumo: total de irmãos ativos, carrinhos, locais, turnos configurados
- Calendário do mês atual com indicação visual de dias com / sem programação
- Botão rápido "Nova semana" → abre tela de Schedule com a próxima semana vazia

---

### 5.2 Irmãos (`/brothers`)

**Listagem:**
- Tabela: Nome | Telefone | Anotações | Ativo | Ações
- Filtro por nome
- Toggle ativo/inativo sem excluir

**Formulário (modal):**
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Nome completo | text | ✅ |
| Telefone | text | ❌ |
| Anotações | textarea | ❌ |
| Ativo | checkbox | ✅ |

**Validações:**
- Nome não pode ser vazio
- Nome único (case-insensitive)

---

### 5.3 Carrinhos (`/carts`)

**Listagem:**
- Tabela: Nome | Descrição | Ativo | Ações

**Formulário (modal):**
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Nome | text | ✅ |
| Descrição | text | ❌ |
| Ativo | checkbox | ✅ |

---

### 5.4 Locais (`/locations`)

**Listagem:**
- Tabela: Nome | Endereço | Anotações | Ativo | Ações
- Ao expandir uma linha: mostra os turnos configurados para aquele local

**Formulário (modal):**
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Nome | text | ✅ |
| Endereço / descrição | text | ❌ |
| Anotações | textarea | ❌ |
| Ativo | checkbox | ✅ |

---

### 5.5 Configuração de Turnos (`/locations/:id/slots`)

Esta tela aparece dentro da tela de Locais, em painel lateral ou modal expandido.

**Grade semanal de turnos:**

Exibe um grid `dia_da_semana × turno` onde cada célula mostra o horário configurado.

**Formulário de turno:**
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Dia da semana | select (seg–dom) | ✅ |
| Horário início | time picker | ✅ |
| Horário fim | time picker | ✅ |
| Carrinho | select (da lista) | ❌ |
| Grupo responsável | select (grupos) | ❌ |
| Capacidade (nº irmãos) | number (1–4) | ✅ default 2 |

**Regra de negócio:** Não permitir dois turnos no mesmo local + dia + faixa de horário sobrepostos.

---

### 5.6 Programação Semanal (`/schedule`)

Esta é a tela principal de uso semanal.

**Header:**
- Seletor de semana (arrows prev/next + date picker)
- Botão "Gerar automaticamente" (preenche slots vazios aleatoriamente respeitando disponibilidade)
- Botão "Ver relatório"

**Grade semanal:**

```
         SEG   TER   QUA   QUI   SEX   SAB   DOM
Ponto    [──] [──]  [──] [──]  [──]  [──]  [──]
Novo
 08–10   [Irmão A] [Irmão B]  ...
         [Irmão C] [──]

Baixada  
 14–16   [──]  [Irmão D]  ...
```

- Cada célula de designação é um `<select>` populado com irmãos ativos
- Cor: cinza = vazio | verde = preenchido | amarelo = mesmo irmão no mesmo dia em outro turno (conflito)
- Ao selecionar um irmão, salva imediatamente no banco

**Criação de semana:**
- Ao navegar para uma semana sem registro, app pergunta: "Criar programação para esta semana?" → cria `schedule_week` + todas as `assignment` vazias baseadas nos `slots` ativos

---

### 5.7 Relatório (`/report`)

**Header:**
- Seletor de semana
- Botão "Exportar PDF"

**Layout do relatório (para impressão):**

```
┌─────────────────────────────────────────────────────────┐
│  ARRANJO DE TESTEMUNHO PÚBLICO COM O CARRINHO           │
│  Semana: 09/06/2026 a 14/06/2026                        │
├────────────┬──────┬──────┬──────┬──────┬──────┬────────┤
│            │ SEG  │ TER  │ QUA  │ QUI  │ SEX  │  SAB   │
├────────────┼──────┼──────┼──────┼──────┼──────┼────────┤
│ PONTO NOVO │      │      │      │      │      │        │
│  08–10:30  │ Nome │ Nome │ Nome │ Nome │ Nome │  Nome  │
│            │ Nome │ Nome │      │ Nome │      │  Nome  │
├────────────┼──────┼──────┼──────┼──────┼──────┼────────┤
│ BAIXADA    │      │      │      │      │      │        │
│  14–16:00  │      │ Nome │      │      │      │        │
└────────────┴──────┴──────┴──────┴──────┴──────┴────────┘
```

- Estrutura agrupada por local
- Cabeçalho com nome da congregação (configurável nas preferências)
- Rodapé com data de geração
- Formatado para A4 landscape

**Geração PDF:**
```js
import html2pdf from 'html2pdf.js';

const exportPDF = () => {
  const element = document.getElementById('report-preview');
  html2pdf()
    .set({
      margin:       [10, 10, 10, 10],
      filename:     `testemunho_${weekStart}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    })
    .from(element)
    .save();
};
```

---

### 5.8 Preferências (`/settings`)

| Campo | Tipo | Default |
|-------|------|---------|
| Nome da congregação | text | "Congregação" |
| Cidade | text | — |
| Dia padrão de início da semana | select (seg/dom) | Segunda |
| Idioma do relatório | select | Português |

---

## 6. Gerenciamento de Estado (Zustand)

```js
// store/useAppStore.js
{
  db: null,           // instância sql.js inicializada
  brothers: [],
  carts: [],
  locations: [],
  slots: [],
  currentWeek: null,  // { id, week_start, assignments: [] }

  // actions
  initDB: async () => {},
  loadBrothers: () => {},
  saveBrother: (data) => {},
  deleteBrother: (id) => {},
  // ... análogos para carts, locations, slots
  loadWeek: (weekStart) => {},
  setAssignment: (slotId, position, brotherId) => {},
}
```

---

## 7. Inicialização do Banco (OPFS)

```js
// db/init.js
import initSqlJs from 'sql.js';
import sqlWasm from 'sql.js/dist/sql-wasm.wasm?url';

const DB_FILE = 'carrinho.db';

export async function initDB() {
  const SQL = await initSqlJs({ locateFile: () => sqlWasm });

  // Tenta carregar banco existente via OPFS
  const opfsRoot = await navigator.storage.getDirectory();
  let dbData = null;
  try {
    const fileHandle = await opfsRoot.getFileHandle(DB_FILE);
    const file = await fileHandle.getFile();
    dbData = new Uint8Array(await file.arrayBuffer());
  } catch {
    // Banco ainda não existe — será criado
  }

  const db = dbData ? new SQL.Database(dbData) : new SQL.Database();

  // Aplica schema
  const schema = await fetch('/schema.sql').then(r => r.text());
  db.run(schema);

  // Persiste após cada mutação
  const persist = () => {
    const data = db.export();
    opfsRoot.getFileHandle(DB_FILE, { create: true }).then(fh => {
      fh.createWritable().then(w => {
        w.write(data);
        w.close();
      });
    });
  };

  return { db, persist };
}
```

> **Fallback:** Se OPFS não estiver disponível (Firefox < 111), usar `localStorage` com a db serializada em Base64.

---

## 8. Navegação (React Router v6)

```
/                    → Dashboard
/brothers            → Listagem de irmãos
/carts               → Listagem de carrinhos
/locations           → Listagem de locais + sub-rota de turnos
/locations/:id/slots → Configuração de turnos do local
/schedule            → Programação semanal
/schedule/:weekStart → Semana específica (ex: /schedule/2026-06-08)
/report              → Geração de relatório
/settings            → Preferências
```

---

## 9. Regras de Negócio

| Regra | Descrição |
|-------|-----------|
| RN-01 | Um irmão não pode ter duas designações no mesmo dia/horário |
| RN-02 | Ao deletar um local, seus turnos são removidos (CASCADE) |
| RN-03 | Ao deletar um turno, suas designações são removidas (CASCADE) |
| RN-04 | Irmão inativo não aparece nas opções de designação |
| RN-05 | Semana começa na segunda-feira (configurável) |
| RN-06 | Capacidade mínima por turno: 1; máximo: 4 |
| RN-07 | O relatório só pode ser gerado para semanas com ao menos um slot designado |

---

## 10. Plano de Implementação

### Fase 1 — Fundação (2–3h)
- [ ] Scaffold Vite + React + Tailwind
- [ ] Integrar sql.js + OPFS
- [ ] Aplicar schema SQL
- [ ] Layout base (Sidebar + Header)
- [ ] Zustand store com `initDB`

### Fase 2 — Cadastros (2h)
- [ ] CRUD Irmãos
- [ ] CRUD Carrinhos
- [ ] CRUD Locais
- [ ] CRUD Turnos (slots por local)

### Fase 3 — Programação Semanal (3h)
- [ ] Seletor de semana
- [ ] Grade semanal
- [ ] Designação por célula (select + save)
- [ ] Validação de conflito (RN-01)
- [ ] Cores de status

### Fase 4 — Relatório (1h)
- [ ] Layout HTML do relatório
- [ ] Integrar html2pdf.js
- [ ] Export PDF landscape A4

### Fase 5 — Polimento (1h)
- [ ] Dashboard com cards
- [ ] Preferências (nome da congregação)
- [ ] Export/import do arquivo `.db`
- [ ] Responsividade mínima

---

## 11. Dependências do package.json

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0",
    "zustand": "^4.5.0",
    "sql.js": "^1.12.0",
    "html2pdf.js": "^0.10.2",
    "lucide-react": "^0.383.0",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

---

## 12. Considerações de Deploy

Como a app roda localmente, o usuário tem duas opções:

**Opção A — Dev server (recomendado para uso contínuo):**
```bash
npm install
npm run dev
# Abre http://localhost:5173
```

**Opção B — Build estático:**
```bash
npm run build
# Serve a pasta dist/ com qualquer servidor HTTP
# ex: npx serve dist
```

> **Importante:** OPFS requer que a página seja servida via `http://` (não `file://`). O dev server do Vite já resolve isso.

---

*Fim do documento — SDD v1.0*
