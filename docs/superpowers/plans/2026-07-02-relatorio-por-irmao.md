# Relatório "Por irmão" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um modo "Por irmão" na página `/report`, que filtra as designações da semana selecionada para um irmão específico e mostra colegas de turno, reaproveitando exportação PDF e impressão já existentes.

**Architecture:** Tudo em `src/pages/Report.jsx`. `loadData()` passa a guardar `slots`/`assignments` brutos em estado em vez de já computar a grade; a grade (`grid`) e as linhas do irmão (`brotherRows`) são derivadas via `useMemo`. Um toggle de modo controla o que é renderizado dentro da folha capturada por `reportRef` (usada tanto por `html2pdf` quanto por `window.print()`).

**Tech Stack:** React 18 (hooks), Tailwind (classes utilitárias inline, sem CSS separado), `date-fns` para datas, sem framework de testes.

## Global Constraints

- Sem ESLint e sem framework de testes configurados no projeto (`package.json` só tem `dev`/`build`/`preview`). A verificação "de teste" de cada task é `npm run build` (detecta erros de import/compilação) + verificação manual no navegador (`npm run dev`), conforme `CLAUDE.md`. Não introduzir Vitest/Jest nem novos arquivos de teste.
- IDs de irmãos são UUID string — nunca usar `Number(id)` ou `===` com coerção numérica.
- Nenhuma chamada nova ao Supabase: `buildBrotherRows` opera só sobre `slots`/`assignments` já carregados por `loadData()`.
- Não alterar RBAC/rotas — `/report` continua acessível sem `RoleRoute`.
- Fonte da verdade de todo o design: `docs/superpowers/specs/2026-07-02-relatorio-por-irmao-design.md`.

---

### Task 1: Refatorar carregamento de dados para state bruto + `grid` derivado via `useMemo`

Refatoração pura, sem mudança de comportamento visível. Prepara o terreno para o Task 2 poder derivar `brotherRows` dos mesmos dados brutos sem duplicar chamadas de API.

**Files:**
- Modify: `src/pages/Report.jsx`

**Interfaces:**
- Consumes: `buildReportGridByCart(slots, rawAssignments, brothers)` (já existe em `src/pages/Report.jsx:13`, assinatura inalterada).
- Produces: estado `slots` (array de slots de `getSlotsWithDetails()`) e `assignments` (array de `getAssignmentsByWeek()`) expostos no componente `Report`, e uma constante local `grid` (mesmo formato que antes, calculada via `useMemo`) — o Task 2 consome `slots`, `assignments` e `grid`.

- [ ] **Step 1: Trocar o import de `useState, useEffect, useCallback, useRef` para incluir `useMemo`**

Em `src/pages/Report.jsx:1`, troque:

```js
import { useState, useEffect, useCallback, useRef } from 'react'
```

por:

```js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
```

- [ ] **Step 2: Trocar o estado `grid` por estado bruto `slots`/`assignments`**

Em `src/pages/Report.jsx:64-68`, troque:

```js
  const [monday, setMonday] = useState(getThisMonday)
  const [week, setWeek] = useState(null)
  const [grid, setGrid] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
```

por:

```js
  const [monday, setMonday] = useState(getThisMonday)
  const [week, setWeek] = useState(null)
  const [slots, setSlots] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
```

- [ ] **Step 3: Simplificar `loadData` para só guardar os dados brutos**

Em `src/pages/Report.jsx:74-91`, troque:

```js
  const loadData = useCallback(
    async (w) => {
      setLoading(true)
      try {
        const [slots, rawAssignments] = await Promise.all([
          getSlotsWithDetails(),
          getAssignmentsByWeek(w.id),
        ])
        setGrid(buildReportGridByCart(slots, rawAssignments, brothers))
      } catch (err) {
        console.error('Erro ao carregar relatório:', err)
        setGrid([])
      } finally {
        setLoading(false)
      }
    },
    [brothers]
  )
```

por:

```js
  const loadData = useCallback(async (w) => {
    setLoading(true)
    try {
      const [slotsData, assignmentsData] = await Promise.all([
        getSlotsWithDetails(),
        getAssignmentsByWeek(w.id),
      ])
      setSlots(slotsData)
      setAssignments(assignmentsData)
    } catch (err) {
      console.error('Erro ao carregar relatório:', err)
      setSlots([])
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }, [])
```

- [ ] **Step 4: Atualizar o `useEffect` que reseta os dados quando a semana não existe**

Em `src/pages/Report.jsx:93-101`, troque:

```js
  useEffect(() => {
    const existing = scheduleWeeks.find((w) => w.week_start === weekStart) ?? null
    setWeek(existing)
    if (existing) {
      loadData(existing)
    } else {
      setGrid([])
    }
  }, [scheduleWeeks, weekStart, loadData])
```

por:

```js
  useEffect(() => {
    const existing = scheduleWeeks.find((w) => w.week_start === weekStart) ?? null
    setWeek(existing)
    if (existing) {
      loadData(existing)
    } else {
      setSlots([])
      setAssignments([])
    }
  }, [scheduleWeeks, weekStart, loadData])
```

- [ ] **Step 5: Derivar `grid` via `useMemo` logo após o `useEffect` do Step 4**

Imediatamente depois do bloco do Step 4 (antes de `async function handleExportPDF() {`), adicione:

```js
  const grid = useMemo(
    () => buildReportGridByCart(slots, assignments, brothers),
    [slots, assignments, brothers]
  )
```

- [ ] **Step 6: Rodar o build para verificar que não há erro de compilação/import**

Run: `npm run build`
Expected: build termina sem erros (exit code 0).

- [ ] **Step 7: Verificar manualmente que a Visão semanal continua idêntica**

Run: `npm run dev`, abra `http://localhost:5173/report` no navegador.
Expected: a grade semanal por carrinho/período/dia renderiza exatamente como antes da mudança (mesmos dados, mesmo layout); navegar ◀ ▶ entre semanas continua funcionando; exportar PDF e imprimir continuam funcionando sem erro no console.

- [ ] **Step 8: Commit**

```bash
git add src/pages/Report.jsx
git commit -m "$(cat <<'EOF'
refactor(report): deriva grade semanal via useMemo a partir de dados brutos

Guarda slots/assignments em estado bruto em vez de já computar a grade
dentro de loadData, preparando terreno para o modo "Por irmão" reusar
os mesmos dados sem chamadas novas ao Supabase.
EOF
)"
```

---

### Task 2: Implementar o modo "Por irmão" (toggle, seletor, tabela e estados vazios)

**Files:**
- Modify: `src/pages/Report.jsx`

**Interfaces:**
- Consumes: `slots`, `assignments`, `brothers`, `monday`, `week`, `grid` (todos do Task 1); constantes já existentes `DAY_LABELS`, `REPORT_DAYS`, `DAY_OFFSET` (`src/pages/Report.jsx:9-11`).
- Produces: função pura `buildBrotherRows(slots, rawAssignments, brothers, brotherId)` retornando `Array<{ day_of_week: number, time: string, location: string|null, cart_name: string, colleagues: string[] }>`, ordenado por dia da semana (ordem `REPORT_DAYS`) e depois por horário.

- [ ] **Step 1: Adicionar `buildBrotherRows` logo depois de `buildReportGridByCart`**

Em `src/pages/Report.jsx`, depois do fechamento de `buildReportGridByCart` (linha 58, `}`) e antes de `export default function Report() {` (linha 60), adicione:

```js
function buildBrotherRows(slots, rawAssignments, brothers, brotherId) {
  const brotherMap = {}
  for (const b of brothers) brotherMap[b.id] = b.name

  const slotMap = {}
  for (const slot of slots) slotMap[slot.id] = slot

  const rows = []
  for (const a of rawAssignments) {
    if (a.brother_id !== brotherId) continue
    const slot = slotMap[a.slot_id]
    if (!slot) continue

    const colleagues = rawAssignments
      .filter((other) => other.slot_id === a.slot_id && other.brother_id !== brotherId)
      .map((other) => brotherMap[other.brother_id])
      .filter(Boolean)

    rows.push({
      day_of_week: slot.day_of_week,
      time: `${slot.start_time}–${slot.end_time}`,
      location: slot.location_name,
      cart_name: slot.cart_name || 'Sem Carrinho',
      colleagues,
    })
  }

  return rows.sort((a, b) => {
    const dayDiff = DAY_OFFSET[a.day_of_week] - DAY_OFFSET[b.day_of_week]
    if (dayDiff !== 0) return dayDiff
    return a.time.localeCompare(b.time)
  })
}
```

- [ ] **Step 2: Adicionar estado de modo e irmão selecionado**

Em `src/pages/Report.jsx`, no bloco de estado (resultado do Task 1, Step 2), depois de `const [exporting, setExporting] = useState(false)`, adicione:

```js
  const [mode, setMode] = useState('week')
  const [selectedBrotherId, setSelectedBrotherId] = useState('')
```

- [ ] **Step 3: Derivar `brotherRows` e `selectedBrotherName` via `useMemo`, logo após o `grid` do Task 1**

Depois do bloco:

```js
  const grid = useMemo(
    () => buildReportGridByCart(slots, assignments, brothers),
    [slots, assignments, brothers]
  )
```

adicione:

```js
  const brotherRows = useMemo(
    () => (selectedBrotherId ? buildBrotherRows(slots, assignments, brothers, selectedBrotherId) : []),
    [slots, assignments, brothers, selectedBrotherId]
  )
  const selectedBrotherName = brothers.find((b) => b.id === selectedBrotherId)?.name ?? ''
```

- [ ] **Step 4: Adicionar a barra de modo (toggle + seletor de irmão) entre o header existente e a área de conteúdo**

Em `src/pages/Report.jsx`, entre o `</div>` que fecha o header de navegação de semana (linha 166) e o comentário `{/* Área de conteúdo */}` (linha 168), adicione:

```jsx
      {/* Barra de modo do relatório */}
      <div className="flex items-center gap-3 px-4 md:px-8 py-3 border-b border-gray-200 bg-white shrink-0 print:hidden">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('week')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === 'week' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Visão semanal
          </button>
          <button
            onClick={() => setMode('brother')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === 'brother' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Por irmão
          </button>
        </div>

        {mode === 'brother' && (
          <select
            value={selectedBrotherId}
            onChange={(e) => setSelectedBrotherId(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-slate-700 bg-white"
          >
            <option value="">Selecione um irmão...</option>
            {brothers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>
```

- [ ] **Step 5: Substituir o bloco de renderização da grade por renderização condicional (semanal vs. por irmão)**

Em `src/pages/Report.jsx:208-310`, troque o bloco que começa em:

```jsx
            {/* Tabela do relatório agrupada por carrinho + período */}
            {grid.length === 0 ? (
              <p className="text-center text-slate-400 py-8" style={{ fontSize: '10pt' }}>
                Nenhum turno configurado ou designações vazias.
              </p>
            ) : (
              <div className="space-y-6">
                {grid.map((cart) => (
```

e termina em (fechamento do `grid.map`, antes do comentário `{/* Rodapé */}`):

```jsx
                ))}
              </div>
            )}
```

Pelo seguinte (mantendo o `grid.map(...)` interno **idêntico** ao original — só a condição externa muda, e um novo ramo `mode === 'brother'` é adicionado):

```jsx
            {/* Tabela do relatório: grade semanal ou designações do irmão selecionado */}
            {mode === 'week' ? (
              grid.length === 0 ? (
                <p className="text-center text-slate-400 py-8" style={{ fontSize: '10pt' }}>
                  Nenhum turno configurado ou designações vazias.
                </p>
              ) : (
                <div className="space-y-6">
                  {grid.map((cart) => (
                    <div key={cart.cart_id}>
                      <h2
                        className="text-center font-bold uppercase tracking-wide text-slate-800 mb-1"
                        style={{ fontSize: '11pt' }}
                      >
                        Carrinho {cart.cart_name}
                      </h2>
                      <table
                        className="w-full border-collapse"
                        style={{ fontSize: '9pt', tableLayout: 'fixed' }}
                      >
                        <colgroup>
                          <col style={{ width: '14%' }} />
                          {REPORT_DAYS.map((d) => (
                            <col key={d} style={{ width: `${86 / REPORT_DAYS.length}%` }} />
                          ))}
                        </colgroup>
                        <thead>
                          <tr>
                            <th
                              className="border border-slate-400 bg-slate-700 text-white px-2 py-1 text-left font-semibold"
                              style={{ fontSize: '8.5pt' }}
                            >
                              Período
                            </th>
                            {REPORT_DAYS.map((d) => {
                              const date = addDays(monday, DAY_OFFSET[d])
                              return (
                                <th
                                  key={d}
                                  className="border border-slate-400 bg-slate-700 text-white px-1 py-1 text-center font-semibold"
                                  style={{ fontSize: '8.5pt' }}
                                >
                                  {DAY_LABELS[d]}
                                  <br />
                                  <span style={{ fontSize: '7.5pt', fontWeight: 400 }}>
                                    {format(date, 'dd/MM')}
                                  </span>
                                </th>
                              )
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {cart.periods.map((periodObj) => (
                            <tr key={periodObj.period}>
                              <td
                                className="border border-slate-300 px-2 py-1 font-semibold bg-slate-50 text-slate-700"
                                style={{ fontSize: '8pt' }}
                              >
                                {periodObj.period}
                              </td>
                              {REPORT_DAYS.map((d) => {
                                const dayEntries = periodObj.days[d]
                                return (
                                  <td
                                    key={d}
                                    className="border border-slate-300 px-1 py-1 align-top text-center"
                                    style={{ verticalAlign: 'top' }}
                                  >
                                    {dayEntries && dayEntries.length > 0 ? (
                                      <div className="flex flex-col gap-1">
                                        {dayEntries.map((data, ei) => (
                                          <div key={ei} className={ei > 0 ? 'border-t border-slate-200 pt-1' : ''}>
                                            {data.names.map((name, i) => (
                                              <div
                                                key={i}
                                                className="text-slate-800 leading-snug"
                                                style={{ fontSize: '8.5pt', minHeight: '13pt' }}
                                              >
                                                {name || ''}
                                              </div>
                                            ))}
                                            <div className="text-slate-500" style={{ fontSize: '7pt' }}>
                                              {data.location}
                                            </div>
                                            <div className="text-slate-400 font-mono" style={{ fontSize: '7pt' }}>
                                              {data.time}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div style={{ minHeight: '13pt' }} />
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )
            ) : !selectedBrotherId ? (
              <p className="text-center text-slate-400 py-8" style={{ fontSize: '10pt' }}>
                Selecione um irmão para ver as designações.
              </p>
            ) : brotherRows.length === 0 ? (
              <p className="text-center text-slate-400 py-8" style={{ fontSize: '10pt' }}>
                Nenhuma designação para {selectedBrotherName} nesta semana.
              </p>
            ) : (
              <div>
                <h2
                  className="text-center font-bold uppercase tracking-wide text-slate-800 mb-1"
                  style={{ fontSize: '11pt' }}
                >
                  Designações de {selectedBrotherName}
                </h2>
                <table className="w-full border-collapse" style={{ fontSize: '9pt' }}>
                  <thead>
                    <tr>
                      <th className="border border-slate-400 bg-slate-700 text-white px-2 py-1 text-left font-semibold" style={{ fontSize: '8.5pt' }}>
                        Dia
                      </th>
                      <th className="border border-slate-400 bg-slate-700 text-white px-2 py-1 text-left font-semibold" style={{ fontSize: '8.5pt' }}>
                        Data
                      </th>
                      <th className="border border-slate-400 bg-slate-700 text-white px-2 py-1 text-left font-semibold" style={{ fontSize: '8.5pt' }}>
                        Horário
                      </th>
                      <th className="border border-slate-400 bg-slate-700 text-white px-2 py-1 text-left font-semibold" style={{ fontSize: '8.5pt' }}>
                        Local
                      </th>
                      <th className="border border-slate-400 bg-slate-700 text-white px-2 py-1 text-left font-semibold" style={{ fontSize: '8.5pt' }}>
                        Carrinho
                      </th>
                      <th className="border border-slate-400 bg-slate-700 text-white px-2 py-1 text-left font-semibold" style={{ fontSize: '8.5pt' }}>
                        Colegas
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {brotherRows.map((row, i) => (
                      <tr key={i}>
                        <td className="border border-slate-300 px-2 py-1 text-slate-800" style={{ fontSize: '8.5pt' }}>
                          {DAY_LABELS[row.day_of_week]}
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-slate-800" style={{ fontSize: '8.5pt' }}>
                          {format(addDays(monday, DAY_OFFSET[row.day_of_week]), 'dd/MM')}
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-slate-800 font-mono" style={{ fontSize: '8.5pt' }}>
                          {row.time}
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-slate-800" style={{ fontSize: '8.5pt' }}>
                          {row.location}
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-slate-800" style={{ fontSize: '8.5pt' }}>
                          {row.cart_name}
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-slate-800" style={{ fontSize: '8.5pt' }}>
                          {row.colleagues.join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
```

- [ ] **Step 6: Rodar o build para verificar que não há erro de compilação/import**

Run: `npm run build`
Expected: build termina sem erros (exit code 0).

- [ ] **Step 7: Verificar manualmente o fluxo completo no navegador**

Run: `npm run dev`, abra `http://localhost:5173/report`.

Expected (checklist manual, todos devem passar):
1. Clicar em "Por irmão" mostra o `<select>` de irmãos; "Visão semanal" continua funcionando e volta a esconder o `<select>`.
2. Com "Por irmão" ativo e nenhum irmão selecionado: mensagem "Selecione um irmão para ver as designações."
3. Selecionar um irmão com designações na semana atual: tabela aparece com Dia/Data/Horário/Local/Carrinho/Colegas corretos; conferir contra a Visão semanal que os dados batem.
4. Selecionar um irmão que divide um turno com outro (slot com `capacity > 1`): coluna "Colegas" mostra o nome do outro irmão.
5. Selecionar um irmão sem nenhuma designação na semana: mensagem "Nenhuma designação para {nome} nesta semana."
6. Navegar ◀ ▶ para outra semana com um irmão selecionado: a tabela recalcula para a nova semana (ou mostra a mensagem de vazio, se for o caso).
7. Clicar "Exportar PDF" e "Imprimir" nos dois modos: o conteúdo capturado corresponde ao que está na tela (grade ou tabela do irmão).
8. Voltar para "Visão semanal": grade original intacta, sem regressão visual.

- [ ] **Step 8: Commit**

```bash
git add src/pages/Report.jsx
git commit -m "$(cat <<'EOF'
feat(report): adiciona modo "Por irmão" ao relatório

Permite filtrar as designações da semana selecionada por um irmão
específico, mostrando dia, horário, local, carrinho e colegas de
turno. Reaproveita exportação PDF e impressão já existentes.
EOF
)"
```
