# Controle de Arranjo de Carrinhos

SPA React sem back-end para programação semanal de testemunho público com carrinho.
Banco de dados SQLite via WebAssembly (sql.js) persistido no browser via OPFS.

## Comandos

```bash
npm run dev      # Dev server em http://localhost:5173
npm run build    # Build de produção em dist/
npm run preview  # Visualizar build localmente
```

## Arquitetura

```
src/
  db/
    init.js          # Inicializa sql.js + OPFS; retorna { db, persist }
    schema.sql        # DDL — copiado para public/schema.sql (carregado via fetch)
    queries/          # Funções puras (db, persist, ...args) → SQL direto
  store/
    useAppStore.js    # Zustand: estado global + actions CRUD síncronas
  pages/             # Dashboard, Brothers, Carts, Locations, Schedule, Report, Settings
  components/
    Layout/           # Sidebar + Header
    ui/Modal.jsx      # Modal reutilizável
```

## Gotchas críticos

- **OPFS exige HTTP**: nunca abrir `index.html` direto (`file://` quebra). Usar `npm run dev`.
- **sql.js no Vite**: `optimizeDeps.exclude: ['sql.js']` em `vite.config.js` é obrigatório.
- **schema.sql em dois lugares**: `src/db/schema.sql` (fonte) e `public/schema.sql` (servido em runtime via `fetch('/schema.sql')`). Manter sincronizados.
- **persist() manual**: sql.js não persiste automaticamente. Toda mutação deve chamar `persist()` após `db.run(...)`.
- **Preferências no localStorage**: nome da congregação fica em `localStorage`, não no banco.
- **Backup**: único mecanismo é Preferências → Exportar banco (.db). OPFS é apagado ao limpar dados do site no navegador.

## Banco de dados

Tabelas: `brothers`, `carts`, `locations`, `groups`, `slots`, `schedule_weeks`, `assignments`.
Chave de designação: `UNIQUE(week_id, slot_id, position)` — upsert via `ON CONFLICT DO UPDATE`.
`week_start` sempre segunda-feira no formato `YYYY-MM-DD`.

## Dependências notáveis

- `sql.js` — SQLite compilado para WASM
- `html2pdf.js` — geração de PDF a partir do DOM (tem vulns transitivas inofensivas, não atualizar)
- `date-fns` — manipulação de datas (sem locale pt-BR nos imports — usar strings formatadas manualmente)
