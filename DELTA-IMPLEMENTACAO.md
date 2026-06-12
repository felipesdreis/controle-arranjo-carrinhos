# Delta de Implementação — Controle de Arranjo de Carrinhos

**Resumo Executivo:** Dois componentes precisam de refatoração crítica (Schedule.jsx e Report.jsx) para alinhar com o modelo de domínio carrinho-centric. Todos os outros artefatos (banco, cadastros) estão alinhados.

---

## 1. Sumário de Mudanças

| Componente | Funcionalidade | Status | Esforço | Dependência |
|-----------|----------------|--------|--------|------------|
| **schema.sql** | Banco de dados | ✅ Alinhado | Nenhum | — |
| **Brothers.jsx** | Cadastro de irmãos | ✅ Alinhado | Nenhum | — |
| **Carts.jsx** | Cadastro de carrinhos | ✅ Alinhado | Nenhum | — |
| **Locations.jsx** | Cadastro de locais + slots | ✅ Alinhado | Nenhum | — |
| **Schedule.jsx** | 🔴 Programação semanal | ❌ Divergência crítica | **ALTO** | Nenhuma |
| **Report.jsx** | 🔴 Relatório PDF | ❌ Divergência crítica | **ALTO** | Schedule.jsx (opcional) |
| **Settings.jsx** | Preferências | ❌ Não implementado | **MÉDIO** | Nenhuma |

**Total de 7 funcionalidades; 3 requerem trabalho.**

---

## 2. Detalhamento das Mudanças

### 2.1 Schedule.jsx — Refatoração da Grade de Programação

#### 2.1.1 Problema Atual

Arquivo: `src/pages/Schedule.jsx`  
Linhas críticas: 33–60 (função `buildGrid()`)

**Estrutura atual:**
```javascript
// Linhas 33–60
const locationMap = {}  // agrupa por location_id
for (const slot of slots) {
  locationMap[location_id].timeBuckets[timeKey] = { days: { ... } }
}
return Object.values(locationMap)  // retorna array de locais
```

**Renderização (linhas 422–487):**
```
Tabela:
├─ Coluna 1: "Local / Horário"
├─ Colunas 2-8: "Seg", "Ter", ..., "Dom"
└─ Linhas: iteração sobre locationMap → timeBuckets → dias
```

**Problema:** Agrupa por **Local** em vez de **Carrinho**; não diferencia períodos.

---

#### 2.1.2 Solução Desejada

**Nova estrutura:**
```javascript
// Novo: agrupa por carrinho como eixo principal
const cartMap = {}
for (const slot of slots) {
  if (!cartMap[slot.cart_id]) cartMap[slot.cart_id] = { periods: {} }
  const period = getPeriodFromTime(slot.start_time)  // "MANHÃ", "TARDE", "NOITE"
  cartMap[slot.cart_id].periods[period] = { days: { ... } }
}
return Object.values(cartMap)  // retorna array de carrinhos
```

**Renderização:**
```
Para cada carrinho:
  Tabela do Carrinho "CASA DIEGO":
  ├─ Linhas: PERÍODO (MANHÃ, TARDE, NOITE — apenas preenchidas)
  ├─ Colunas: SEGUNDA, TERÇA, ..., DOMINGO
  └─ Célula: Designações de irmãos
```

---

#### 2.1.3 Alterações de Código

**Funções a adicionar:**

```javascript
// Derivar período do horário (RB-015)
function getPeriodFromTime(time) {
  if (time < "12:00") return "MANHÃ"
  if (time < "18:00") return "TARDE"
  return "NOITE"
}

// Novo buildGrid: agrupa por carrinho
function buildGridByCart(slots) {
  const cartMap = {}
  
  for (const slot of slots) {
    const cartId = slot.cart_id  // FK para carrinho
    const cartName = slot.cart_name || "Sem Carrinho"
    const period = getPeriodFromTime(slot.start_time)
    
    if (!cartMap[cartId]) {
      cartMap[cartId] = {
        cart_id: cartId,
        cart_name: cartName,
        periods: {}
      }
    }
    
    if (!cartMap[cartId].periods[period]) {
      cartMap[cartId].periods[period] = {
        period,
        days: {}
      }
    }
    
    cartMap[cartId].periods[period].days[slot.day_of_week] = slot
  }
  
  // Converter para array e ordenar períodos
  return Object.values(cartMap).map(cart => ({
    ...cart,
    periods: ["MANHÃ", "TARDE", "NOITE"]
      .map(p => cart.periods[p])
      .filter(Boolean)  // remover períodos vazios
  }))
}
```

**Alterações na renderização (linhas 398–492):**

```javascript
// OLD (linhas 422–487):
{grid.map((loc) =>
  loc.timeBuckets.map((bucket, bi) => (
    <tr key={`${loc.location_id}-${bucket.timeKey}`}>
      <td>{bi === 0 && loc.location_name}</td>
      <td>{bucket.start_time} – {bucket.end_time}</td>
      {/* dias ... */}
    </tr>
  ))
)}

// NEW:
{grid.map((cart) => (
  <div key={cart.cart_id} className="mb-6">
    <h3 className="text-sm font-bold mb-2">{cart.cart_name}</h3>
    <table className="w-full...">
      <tbody>
        {cart.periods.map((period) => (
          <tr key={`${cart.cart_id}-${period.period}`}>
            <td>{period.period}</td>
            {DISPLAY_DAYS.map((d) => {
              const slot = period.days[d]
              if (!slot) return <td>—</td>
              return (
                <td>
                  {/* seletores de irmãos com local + horário */}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
))}
```

**Impacto em outras funções:**

| Função | Linha | Impacto | Ação |
|--------|-------|--------|------|
| `buildConflictSet()` | 62–82 | Nenhum — valida por dia | Manter |
| `autoFill()` | 84–109 | Nenhum — respeita dias | Manter |
| `loadData()` | 150–162 | Usar nova buildGrid | **Atualizar chamada** |
| `groupSlotsByLocation()` | 112–119 | Não mais necessário | **Remover ou deprecar** |

---

#### 2.1.4 Testes (Checklist)

- [ ] Carrinho sem slots não aparece na tabela
- [ ] Período vazio (ex: NOITE) não gera linha se nenhum slot para o carrinho
- [ ] Múltiplos carrinhos geram múltiplas tabelas
- [ ] Designação mantém integridade (UPDATE assignments corretamente)
- [ ] Auto-fill respeita conflitos mesmo com novo layout
- [ ] Navegação semanas funciona
- [ ] "Copiar de semana anterior" mantém lógica

---

### 2.2 Report.jsx — Refatoração do Relatório

#### 2.2.1 Problema Atual

Arquivo: `src/pages/Report.jsx`  
Linhas críticas: 25–63 (função `buildReportGrid()`)

**Estrutura atual:**
```javascript
const locationMap = {}  // agrupa por location_id
for (const slot of slots) {
  locationMap[slot.location_id].timeBuckets[timeKey] = { days: { ... } }
}
return Object.values(locationMap)  // retorna array de locais com horários
```

**Renderização (linhas 245–294):**
```
Tabela por Local:
├─ Linhas: Horários específicos (08:00–10:30, 14:00–16:00, 18:00–20:00, ...)
├─ Colunas: Dias (Seg–Dom)
└─ Célula: Nomes dos irmãos
```

**Problema:** Agrupa por **Local**; exibe **horários específicos** em linhas (não períodos).

---

#### 2.2.2 Solução Desejada

**Nova estrutura:**
```javascript
const cartMap = {}
for (const slot of slots) {
  const cartId = slot.cart_id
  const period = getPeriodFromTime(slot.start_time)
  cartMap[cartId].periods[period].days[day] = { names, location, time }
}
return Object.values(cartMap)  // retorna array de carrinhos
```

**Renderização:**
```
Tabela por Carrinho:
├─ Linhas: Períodos (MANHÃ, TARDE, NOITE — apenas preenchidas)
├─ Colunas: Dias (Seg–Dom)
└─ Célula: Irmãos + Local + Horário (ex: "João / Maria\nPonto A\n08:00–10:30")
```

---

#### 2.2.3 Alterações de Código

**Funções a adicionar:**

```javascript
// Nova função buildReportGridByCart
function buildReportGridByCart(slots, rawAssignments, brothers, carts) {
  const brotherMap = {}
  for (const b of brothers) brotherMap[b.id] = b.name
  
  const cartMap = {}
  for (const c of carts) cartMap[c.id] = c.name
  
  const assignMap = {}
  for (const a of rawAssignments) {
    assignMap[`${a.slot_id}-${a.position}`] = brotherMap[a.brother_id] ?? ''
  }

  // Novo: agrupa por carrinho
  const result = {}
  for (const slot of slots) {
    const cartId = slot.cart_id || null
    const cartName = cartId ? cartMap[cartId] : "Sem Carrinho"
    const period = getPeriodFromTime(slot.start_time)
    
    if (!result[cartId]) {
      result[cartId] = {
        cart_id: cartId,
        cart_name: cartName,
        periods: {}
      }
    }
    
    if (!result[cartId].periods[period]) {
      result[cartId].periods[period] = { period, days: {} }
    }
    
    // Recolher nomes dos irmãos por posição
    const names = []
    for (let pos = 1; pos <= slot.capacity; pos++) {
      names.push(assignMap[`${slot.id}-${pos}`] ?? '')
    }
    while (names.length > 1 && names[names.length - 1] === '') names.pop()
    
    result[cartId].periods[period].days[slot.day_of_week] = {
      names,
      location: slot.location_name,
      time: `${slot.start_time}–${slot.end_time}`
    }
  }

  // Converter para array ordenado por carrinho
  return Object.values(result).map(cart => ({
    ...cart,
    periods: ["MANHÃ", "TARDE", "NOITE"]
      .map(p => cart.periods[p])
      .filter(Boolean)
  }))
}
```

**Alterações na renderização (linhas 208–296):**

```javascript
// OLD (linhas 245–294):
{grid.map((loc) =>
  loc.timeBuckets.map((bucket) => (
    <tr>
      <td>{loc.name}<br/>{bucket.start_time}–{bucket.end_time}</td>
      {/* dias com names */}
    </tr>
  ))
)}

// NEW:
{grid.map((cart) => (
  <div key={cart.cart_id} className="mb-8">
    <h2 className="text-center font-bold mb-2">CARRINHO {cart.cart_name}</h2>
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th>Período</th>
          {REPORT_DAYS.map((d) => <th key={d}>{DAY_LABELS[d]}</th>)}
        </tr>
      </thead>
      <tbody>
        {cart.periods.map((period) => (
          <tr key={period.period}>
            <td>{period.period}</td>
            {REPORT_DAYS.map((d) => {
              const data = period.days[d]
              return (
                <td key={d}>
                  {data ? (
                    <>
                      <div>{data.names.join(' / ')}</div>
                      <div className="text-xs text-slate-500">{data.location}</div>
                      <div className="text-xs font-mono">{data.time}</div>
                    </>
                  ) : (
                    ''
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
```

**Impacto em outras funções:**

| Função | Linha | Impacto | Ação |
|--------|-------|--------|------|
| `maxRows()` | 123–125 | Lógica muda (períodos vs horários) | **Refatorar ou remover** |
| `loadData()` | 81–88 | Chamar nova buildReportGrid | **Atualizar** |
| Import de `carts` | Linha 66 | Necessário para lookup de nomes | **Adicionar** |

---

#### 2.2.4 Testes (Checklist)

- [ ] Relatório com 1 carrinho exibe 1 tabela
- [ ] Relatório com 3+ carrinhos exibe múltiplas tabelas (1 por carrinho)
- [ ] Períodos vazios não geram linhas
- [ ] Célula exibe: irmãos em linha, local abaixo, horário em fonte menor
- [ ] PDF exporta com layout correto (sem quebras indesejadas)
- [ ] Impressão em A4 landscape funciona
- [ ] Navegação semanas atualiza relatório

---

### 2.3 Settings.jsx — Nova Implementação

#### 2.3.1 Funcionalidades

Arquivo: `src/pages/Settings.jsx` (arquivo existe, está vazio)

**Implementar:**

1. **Nome da Congregação**
   - Campo de texto conectado a localStorage
   - Exibido no header do relatório

2. **Exportar Banco**
   - Botão que baixa arquivo `.db` do OPFS
   - Nomeado `backup-YYYY-MM-DD.db`

3. **Importar Banco**
   - Input file que lê `.db`
   - Sobrescreve banco atual (com confirmação)

4. **Limpar Tudo**
   - Botão destrutivo que reseta banco inteiro
   - Confirmação modal obrigatória

5. **Versão da Aplicação**
   - Exibição de versão (de package.json ou hardcoded)
   - Informação: "Versão 1.0.0 | SQLite via sql.js"

---

#### 2.3.2 Estrutura do Componente

```javascript
// src/pages/Settings.jsx
export default function Settings() {
  const { db, persist } = useAppStore()
  const [congregationName, setCongregationName] = useState(
    () => localStorage.getItem('congregationName') || 'Congregação'
  )
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)

  const handleSaveCongregation = () => {
    localStorage.setItem('congregationName', congregationName)
    // Toast: "Salvo com sucesso"
  }

  const handleExportDB = async () => {
    // Exportar db para arquivo .db
    // Usar util para exportar sql.js
  }

  const handleImportDB = async (file) => {
    // Ler arquivo
    // Validar
    // Reinicializar db
    // Reload da página ou resetState
  }

  const handleClearAll = async () => {
    // Modal de confirmação
    // DELETE FROM todas as tabelas
    // persist()
    // Reload
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Preferências</h1>
      
      {/* Seção 1: Congregação */}
      {/* Seção 2: Dados */}
      {/* Seção 3: Sobre */}
    </div>
  )
}
```

---

#### 2.3.3 Testes (Checklist)

- [ ] Salvar nome congregação e verificar em Report
- [ ] Exportar banco gera arquivo `.db` válido
- [ ] Importar banco anterior restaura dados corretamente
- [ ] Limpar tudo remove todos os registros
- [ ] Versão exibida corretamente

---

## 3. Cronograma Estimado

| Tarefa | Esforço | Dependências | Ordem |
|--------|---------|-------------|-------|
| Refatorar Schedule.jsx | 4–6h | Nenhuma | **1º** |
| Refatorar Report.jsx | 3–4h | Schedule (testes) | **2º** |
| Implementar Settings.jsx | 2–3h | Nenhuma | **3º** (paralelo) |
| Testes E2E integrados | 2h | Todos | **4º** |

**Total:** ~11–16 horas de desenvolvimento.

---

## 4. Verificação de Integridade

### Checklist de Validação Final

- [ ] Schema não modificado (ou mudanças mínimas documentadas)
- [ ] Banco de dados carrega sem erros
- [ ] Brothers, Carts, Locations, Locations.slots funcionam igual
- [ ] Schedule exibe carrinhos (não locais) com períodos
- [ ] Schedule permite designação, auto-fill, conflitos
- [ ] Report exibe carrinhos (não locais) com períodos
- [ ] Report PDF exporta e imprime corretamente
- [ ] Settings salva congregação, exporta/importa banco, limpa dados
- [ ] Navegação entre páginas mantém integridade
- [ ] localStorage (congregationName) persiste

---

## 5. Decisões Arquiteturais Documentadas

### D-001: Período como Derivação (não campo no schema)

**Decisão:** Período (MANHÃ/TARDE/NOITE) é **derivado** de `start_time` em tempo de execução.

**Justificativa:** 
- Reduz necessidade de sincronização de dados
- Flex para alterar limites de período sem migração DB
- Regra RB-015 é clara e determinística

**Implementação:** Funções utilitárias `getPeriodFromTime()` em Schedule.jsx e Report.jsx.

---

### D-002: Carrinho como Eixo Principal

**Decisão:** Modelo mental e UI organizam em torno de **Carrinho**, não Local.

**Justificativa:** 
- Requisito do usuário explícito: "Carrinho → Dia → Horário → Irmãos"
- Local é contexto (onde o carrinho é posicionado), não protagonista
- Facilita geração de relatórios por recurso

**Implementação:** 
- buildGridByCart() em Schedule
- buildReportGridByCart() em Report

---

### D-003: Slots sem Carrinho (Nullable cart_id)

**Decisão:** Um turno **pode não ter** carrinho associado (cart_id NULL).

**Justificativa:**
- Schema atual permite (nullable)
- Casos de uso: turno de "coordenação local" sem carrinho

**Implementação:** 
- Tratamento de cartId = null na lógica de agrupamento
- Exibição "Sem Carrinho" para turnos orphans

---

## Apêndice — Referência Rápida de Funções Novas

| Função | Arquivo | Descrição |
|--------|---------|-----------|
| `getPeriodFromTime(time)` | Schedule.jsx, Report.jsx | Deriva período de start_time |
| `buildGridByCart(slots)` | Schedule.jsx | Novo agrupamento por carrinho |
| `buildReportGridByCart(...)` | Report.jsx | Novo agrupamento por carrinho para relatório |

---

**Documento finalizado.** Pronto para compartilhamento com time de desenvolvimento.
