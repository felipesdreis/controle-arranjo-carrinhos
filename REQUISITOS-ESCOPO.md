# Documento de Requisitos — Controle de Arranjo de Carrinhos

**Data:** 08 de junho de 2026  
**Versão:** 1.0  
**Status:** Aprovação Pendente

---

## 1. Histórias de Usuário

### US-01 — Cadastro de Irmãos

**Como** coordenador de grupo,  
**Quero** registrar e gerenciar a lista de irmãos voluntários,  
**Para que** eu possa designá-los aos turnos de testemunho público.

**Valor de negócio:** Alto  
**Status:** ✅ Implementado

---

#### Critérios de Aceite

**Cenário 1: Adicionar um novo irmão**
- **Dado** que estou na tela de Cadastro de Irmãos
- **Quando** clico em "+ Novo Irmão" e preencho nome, telefone (opcional) e anotações (opcional)
- **Então** o irmão é registrado no banco de dados e a lista é atualizada

**Cenário 2: Editar dados de um irmão**
- **Dado** que existe um irmão já cadastrado
- **Quando** clico em editar, altero um ou mais campos (nome, telefone, anotações)
- **Então** as mudanças são salvas e refletidas na lista

**Cenário 3: Desativar um irmão**
- **Dado** que existe um irmão cadastrado
- **Quando** clico em desativar
- **Então** o irmão fica marcado como inativo (não aparece em listas de seleção na programação) mas o registro permanece no banco

**Cenário 4: Filtrar irmãos por nome**
- **Dado** que há vários irmãos cadastrados
- **Quando** digito um nome na caixa de busca
- **Então** apenas os irmãos cujo nome contém o texto aparecem na lista

**Cenário 5: Exibir apenas irmãos ativos**
- **Dado** que existem irmãos ativos e inativos
- **Quando** ativo a opção "Mostrar apenas ativos"
- **Então** inativos desaparecem da lista

---

#### Regras de Negócio
- RB-001: O nome do irmão é obrigatório
- RB-002: Irmãos inativos não aparecem como opção de designação em Schedule
- RB-003: Um irmão pode ter telefone e anotações, mas não são obrigatórios

#### Fora do Escopo
- Envio de mensagens SMS ou notificações aos irmãos
- Integração com WhatsApp ou Telegram
- Histórico de edições (auditoria)

---

### US-02 — Cadastro de Carrinhos

**Como** coordenador de grupo,  
**Quero** registrar e gerenciar os carrinhos disponíveis para testemunho público,  
**Para que** eu possa associá-los aos locais e horários de programação.

**Valor de negócio:** Alto  
**Status:** ✅ Implementado

---

#### Critérios de Aceite

**Cenário 1: Adicionar um novo carrinho**
- **Dado** que estou na tela de Cadastro de Carrinhos
- **Quando** clico em "+ Novo Carrinho" e preencho nome e descrição (opcional)
- **Então** o carrinho é registrado

**Cenário 2: Editar dados de um carrinho**
- **Dado** que existe um carrinho cadastrado
- **Quando** edito nome ou descrição
- **Então** as mudanças são salvas

**Cenário 3: Desativar um carrinho**
- **Dado** que existe um carrinho cadastrado
- **Quando** desativo
- **Então** fica marcado como inativo (não aparece em listagens de seleção) mas permanece no banco

**Cenário 4: Listar todos os carrinhos**
- **Dado** que existem carrinhos cadastrados
- **Quando** abro a tela
- **Então** vejo lista com nome, descrição e status (ativo/inativo)

---

#### Regras de Negócio
- RB-004: Nome do carrinho é obrigatório
- RB-005: Carrinhos inativos não aparecem em listas de seleção durante programação
- RB-006: Carrinho é a entidade central no modelo de domínio (carrinho → turno → designações)

#### Fora do Escopo
- Rastreamento de manutenção ou reparos de carrinhos
- Fotos ou documentação visual dos carrinhos

---

### US-03 — Cadastro de Locais

**Como** coordenador de grupo,  
**Quero** registrar e gerenciar os locais/endereços onde os carrinhos ficarão posicionados,  
**Para que** eu tenha clareza sobre onde cada testemunho ocorre.

**Valor de negócio:** Alto  
**Status:** ✅ Implementado

---

#### Critérios de Aceite

**Cenário 1: Adicionar um novo local**
- **Dado** que estou na tela de Cadastro de Locais
- **Quando** clico em "+ Novo Local" e preencho nome, endereço e anotações (opcional)
- **Então** o local é registrado

**Cenário 2: Editar dados de um local**
- **Dado** que existe um local cadastrado
- **Quando** edito nome, endereço ou anotações
- **Então** as mudanças são salvas

**Cenário 3: Desativar um local**
- **Dado** que existe um local cadastrado
- **Quando** desativo
- **Então** fica marcado como inativo (não aparece em seleções) mas permanece no banco

**Cenário 4: Gerenciar turnos/slots associados a um local**
- **Dado** que estou editando um local
- **Quando** acesso a seção de "Turnos deste Local"
- **Então** vejo lista de todos os turnos (Local + Dia + Horário) e posso adicionar/editar/remover

---

#### Regras de Negócio
- RB-007: Nome do local é obrigatório
- RB-008: Um local pode ter múltiplos turnos em dias/horários diferentes
- RB-009: Ao deletar um local, todos seus turnos são deletados em cascata

#### Fora do Escopo
- Geolocalização ou mapa de endereços
- Integração com Google Maps

---

### US-04 — Configuração de Turnos/Slots

**Como** coordenador de grupo,  
**Quero** configurar turnos disponíveis em cada local (dia da semana, horário, capacidade),  
**Para que** eu tenha estrutura para designar irmãos à programação.

**Valor de negócio:** Alto  
**Status:** ✅ Implementado (em Locations.jsx e Schedule.jsx)

---

#### Critérios de Aceite

**Cenário 1: Adicionar um novo turno a um local**
- **Dado** que estou gerenciando um local
- **Quando** clico em "+ Novo Turno" e preencho dia da semana, horário início, horário fim, capacidade (opcional: carrinho)
- **Então** o turno é criado e aparece na lista

**Cenário 2: Editar um turno existente**
- **Dado** que existe um turno cadastrado
- **Quando** edito dia, horário ou capacidade
- **Então** as mudanças são salvas

**Cenário 3: Deletar um turno**
- **Dado** que existe um turno cadastrado
- **Quando** clico em deletar
- **Então** o turno é removido do banco (e todas suas designações em qualquer semana)

**Cenário 4: Validar horários**
- **Dado** que estou criando/editando um turno
- **Quando** coloco horário de início igual ou posterior ao horário de fim
- **Então** recebo mensagem de erro: "Horário de início deve ser anterior ao fim"

**Cenário 5: Validar capacidade**
- **Dado** que estou criando/editando um turno
- **Quando** coloco capacidade menor que 1
- **Então** recebo mensagem de erro: "Capacidade mínima é 1"

---

#### Regras de Negócio
- RB-010: Um turno tem obrigatoriamente: local, dia da semana, horário início, horário fim
- RB-011: Capacidade padrão é 2 pessoas; mínimo 1, máximo 10
- RB-012: Um turno pode ser associado a um carrinho (opcional) ou ficar sem carrinho associado
- RB-013: Dia da semana: 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
- RB-014: Horários são strings no formato HH:MM (24h), ex: "08:00", "14:30"

#### Restrições Técnicas
- start_time < end_time (validado no formulário)
- capacity BETWEEN 1 AND 10
- day_of_week BETWEEN 0 AND 6

#### Fora do Escopo
- Feriados ou datas especiais (não há tratamento de exceção de dias)
- Turnos recorrentes (cada turno é criado manualmente)

---

### US-05 — Tela de Programação (Designação Semanal)

**Como** coordenador de grupo,  
**Quero** programar designações de irmãos aos turnos semana a semana,  
**Para que** eu tenha clareza de quem está designado para cada turno e local.

**Valor de negócio:** Alto  
**Status:** 🟡 Implementado com Divergência (ver seção 2)

---

#### Critérios de Aceite (Estado DESEJADO)

**Cenário 1: Navegar entre semanas**
- **Dado** que estou na tela de Programação
- **Quando** clico em " < " e " > " para navegar semanas
- **Então** a data exibida muda (sempre segunda-feira como início da semana) e os dados carregam

**Cenário 2: Criar uma nova semana de programação**
- **Dado** que escolho uma semana que ainda não tem programação
- **Quando** clico em "Criar semana vazia" ou "Copiar de semana anterior"
- **Então** a semana é criada e posso começar a designar

**Cenário 3: Estrutura de Grid — Carrinho como eixo principal**
- **Dado** que tenho carrinhos e turnos cadastrados
- **Quando** abro uma semana programada
- **Então** vejo uma tabela onde:
  - Linhas representam PERÍODOS (MANHÃ, TARDE, NOITE)
  - Colunas representam DIAS (Seg–Dom)
  - Cada célula contém designações de irmãos para aquele carrinho+período+dia

**Cenário 4: Agrupar por Carrinho (em abas ou seções)**
- **Dado** que existem múltiplos carrinhos
- **Quando** abro a programação
- **Então** vejo uma seção/aba por carrinho (ex: "CARRINHO CASA DIEGO", "CARRINHO CENTRO")

**Cenário 5: Designar irmãos a um turno**
- **Dado** que estou vendo uma célula (carrinho+período+dia) vazia
- **Quando** clico e seleciono um irmão ativo na lista
- **Então** o irmão é designado àquele turno

**Cenário 6: Atualizar designação**
- **Dado** que um irmão já está designado a um turno
- **Quando** clico e seleciono outro irmão ou deixo vazio
- **Então** a designação é atualizada

**Cenário 7: Validar conflitos (mesmo irmão em múltiplos turnos no mesmo dia)**
- **Dado** que designei um irmão a um turno
- **Quando** tento designar o mesmo irmão a outro turno no mesmo dia
- **Então** recebo aviso visual (cor de alerta: âmbar) indicando conflito

**Cenário 8: Auto-preenchimento de designações**
- **Dado** que ainda há várias posições vazias
- **Quando** clico em "Gerar automático"
- **Então** o sistema preenche aleatoriamente, respeitando: não repetir irmão no mesmo dia

**Cenário 9: Limpar todas as designações de uma semana**
- **Dado** que estou em uma semana já programada
- **Quando** clico em "Limpar tudo"
- **Então** todas as designações são removidas (e preciso confirmar em diálogo)

---

#### Regras de Negócio
- RB-015: Período (MANHÃ, TARDE, NOITE) é derivado do horário de início:
  - MANHÃ: start_time < "12:00"
  - TARDE: start_time >= "12:00" E start_time < "18:00"
  - NOITE: start_time >= "18:00"
- RB-016: Um irmão não pode estar em dois turnos diferentes no mesmo dia
- RB-017: Irmãos inativos não aparecem como opção de seleção
- RB-018: Um turno pode ter múltiplas posições (baseado em capacity); cada posição pode ter um irmão diferente
- RB-019: week_start é sempre uma segunda-feira no formato YYYY-MM-DD

#### Dependências Técnicas
- Requer schema de turnos (slots) com start_time, end_time, capacity
- Requer tabela assignments com (week_id, slot_id, position, brother_id)
- Requer mapeamento de horários → períodos

#### Fora do Escopo
- Permitir designação de irmãos inativos
- Modificar turnos enquanto a programação está aberta (fazer na aba "Gerenciar Turnos" separadamente)

---

### US-06 — Relatório de Designações (PDF)

**Como** coordenador de grupo,  
**Quero** gerar um relatório visual das designações organizadas por carrinho e período,  
**Para que** eu possa imprimir e compartilhar com os irmãos.

**Valor de negócio:** Alto  
**Status:** 🟡 Implementado com Divergência Crítica (ver seção 2)

---

#### Critérios de Aceite (Estado DESEJADO)

**Cenário 1: Exibir relatório da semana atual**
- **Dado** que estou na tela de Relatório
- **Quando** a página carrega
- **Então** vejo um relatório da semana atual (se programada) com título "ARRANJO DE TESTEMUNHO PÚBLICO COM O CARRINHO"

**Cenário 2: Navegar entre semanas**
- **Dado** que estou no relatório
- **Quando** clico em " < " e " > "
- **Então** navego para semana anterior/próxima e o relatório é atualizado

**Cenário 3: Estrutura de Relatório — Carrinho como entidade principal**
- **Dado** que uma semana está programada
- **Quando** abro o relatório
- **Então** vejo múltiplas tabelas, uma para cada carrinho ativo designado naquela semana

**Cenário 4: Tabela por Carrinho (layout esperado)**
- **Dado** que existem designações para um carrinho
- **Quando** abro o relatório
- **Então** vejo tabela com:
  - Título: "CARRINHO [nome do carrinho]"
  - Linhas: MANHÃ, TARDE, NOITE (apenas períodos que têm turno para este carrinho)
  - Colunas: SEGUNDA, TERÇA, QUARTA, QUINTA, SEXTA, SÁBADO, DOMINGO
  - Célula: Lista de irmãos designados, local do turno, horário (HH:MM–HH:MM)

**Cenário 5: Exibir dados da célula corretamente**
- **Dado** que há uma designação
- **Quando** clico em uma célula da tabela ou visualizo no relatório
- **Então** vejo: "Nome1 / Nome2\nLocal_Name\nHora_Inicio-Hora_Fim"

**Cenário 6: Supressão de colunas vazias**
- **Dado** que uma semana tem designações apenas Seg–Sex
- **Quando** abro o relatório
- **Então** as colunas de Sáb e Dom não aparecem (ou aparecem vazias — definir no design)

**Cenário 7: Imprimir relatório**
- **Dado** que estou vendo o relatório
- **Quando** clico em "Imprimir"
- **Então** a caixa de diálogo print() do navegador abre com o relatório formatado para A4 landscape

**Cenário 8: Exportar para PDF**
- **Dado** que estou vendo o relatório
- **Quando** clico em "Exportar PDF"
- **Então** o arquivo PDF é baixado com nome `testemunho_[YYYY-MM-DD].pdf`

**Cenário 9: Adicionar rodapé e metadados**
- **Dado** que gero um PDF
- **Quando** abro o arquivo
- **Então** vejo:
  - Título: "ARRANJO DE TESTEMUNHO PÚBLICO COM O CARRINHO"
  - Nome da congregação (do localStorage)
  - Período: "Semana: DD/MM/YYYY a DD/MM/YYYY"
  - Data/hora de geração no rodapé

**Cenário 10: Exibir mensagem se semana vazia**
- **Dado** que navego para uma semana sem programação
- **Quando** abro o relatório
- **Então** vejo mensagem: "Semana sem programação - Acesse a tela de Programação para criar"

---

#### Regras de Negócio
- RB-020: Cada carrinho recebe uma tabela separada no relatório
- RB-021: Períodos exibidos são: MANHÃ, TARDE, NOITE
- RB-022: Períodos vazios de um carrinho não geram linha (ex: se carrinho só tem MANHÃ, não mostra TARDE/NOITE)
- RB-023: Dias exibidos: SEGUNDA a DOMINGO (7 dias fixos)
- RB-024: Célula vazia quando não há designação naquele período+dia
- RB-025: Nome da congregação vem de localStorage.congregationName (padrão: "Congregação")
- RB-026: Relatório é snapshot da semana; não atualiza em tempo real se programação mudar (usuário recarrega página)

#### Validações
- Não pode gerar PDF se semana não tem programação
- Não pode gerar PDF se não há carrinhos ativos

#### Fora do Escopo
- Múltiplas semanas em um único PDF
- Customização de logo ou cores da congregação no relatório
- Envio de PDF por e-mail automático

---

### US-07 — Exportação e Impressão do Relatório

**Como** coordenador de grupo,  
**Quero** exportar o relatório em PDF e imprimir,  
**Para que** eu possa compartilhar fisicamente ou digitalmente com os irmãos.

**Valor de negócio:** Médio  
**Status:** ✅ Implementado (html2pdf.js + print())

---

#### Critérios de Aceite

**Cenário 1: Exportar para PDF**
- **Dado** que estou vendo um relatório de uma semana programada
- **Quando** clico em "Exportar PDF"
- **Então** um arquivo PDF é baixado automaticamente

**Cenário 2: Nomeação do arquivo PDF**
- **Dado** que exporto um PDF
- **Quando** o arquivo é baixado
- **Então** o nome é `testemunho_YYYY-MM-DD.pdf` (onde YYYY-MM-DD é week_start)

**Cenário 3: Qualidade de impressão**
- **Dado** que um PDF é gerado
- **Quando** abro em visualizador ou imprimo
- **Então** as tabelas aparecem legíveis, com fontes nítidas (escala 2x no html2canvas)

**Cenário 4: Botão desabilitado quando sem programação**
- **Dado** que não há programação para a semana
- **Quando** clico em "Exportar PDF"
- **Então** o botão fica desabilitado (opacidade 50%) e não responde

**Cenário 5: Indicador de progresso**
- **Dado** que clico em "Exportar PDF"
- **Quando** está gerando
- **Então** o botão exibe "Gerando PDF..." e fica desabilitado

**Cenário 6: Imprimir via navegador**
- **Dado** que estou vendo um relatório
- **Quando** clico em "Imprimir"
- **Então** a caixa de diálogo de impressão abre (Ctrl+P) com o relatório pronto

**Cenário 7: Layout para impressão**
- **Dado** que imprimo o relatório em A4 landscape
- **Quando** abro a impressão
- **Então** vejo tabelas bem estruturadas, sem quebras indesejadas no meio de tabelas

---

#### Regras de Negócio
- RB-027: PDF deve usar formato A4 landscape (297mm × 210mm)
- RB-028: Margens padrão: 8mm em todos os lados
- RB-029: Qualidade de imagem: 98% JPEG
- RB-030: Botão de exportação é desabilitado quando não há programação ou durante geração

#### Dependências Técnicas
- Biblioteca `html2pdf.js` (já presente no projeto)
- CSS print media queries (@media print) para formatação

#### Fora do Escopo
- Customização avançada de layout (cores, fontes do usuário)
- Sincronização com cloud ou banco remoto

---

---

## 2. Mapeamento de Delta (O que Muda)

### 2.1 Estado Atual vs. Estado Desejado

| Artefato | Componente | Status Atual | Status Desejado | Ação Necessária |
|----------|-----------|-------------|-----------------|-----------------|
| Cadastro de Irmãos | Brothers.jsx | ✅ OK | ✅ OK | Nenhuma |
| Cadastro de Carrinhos | Carts.jsx | ✅ OK | ✅ OK | Nenhuma |
| Cadastro de Locais | Locations.jsx | ✅ OK | ✅ OK | Nenhuma |
| Configuração de Turnos | Schedule.jsx + Locations.jsx | ✅ OK | ✅ OK | Nenhuma |
| **Tela de Programação** | **Schedule.jsx** | 🟡 **Grid Local × Dia** | 🔴 **Grid Carrinho × Período × Dia** | **REFATORAÇÃO** |
| **Relatório** | **Report.jsx** | 🟡 **Agrupa por Local → Horário** | 🔴 **Agrupa por Carrinho → Período → Dia** | **REFATORAÇÃO** |
| Exportação PDF | Report.jsx | ✅ OK | ✅ OK | Nenhuma |
| Impressão | Report.jsx | ✅ OK | ✅ OK | Nenhuma |
| Settings | Settings.jsx | ❌ Vazio | ✅ Implementar | **NOVA FUNCIONALIDADE** |

---

### 2.2 Divergências Críticas

#### 2.2.1 Estrutura da Tela de Programação

**Problema Atual:**
```
Grid = Tabela[Local][Horário] × Dias
└─ Colunas: SEGUNDA, TERÇA, QUARTA, ...
└─ Linhas: Local "PONTO A" → Horários (08:00–10:30, 14:00–16:00, ...)
```

**Estado Desejado:**
```
Grid = Uma tabela por Carrinho
├─ Carrinho "CASA DIEGO"
│  ├─ Linhas: MANHÃ, TARDE, NOITE (períodos derivados do start_time)
│  ├─ Colunas: SEGUNDA, TERÇA, QUARTA, ..., DOMINGO
│  └─ Célula: Irmãos designados + Local + Horário
├─ Carrinho "CENTRO COMERCIAL"
│  └─ Similar...
```

**Impacto:**
- `buildGrid()` deve agrupar por carrinho, não por local
- Periodicidade (MANHÃ/TARDE/NOITE) deve ser derivada de start_time, não hard-coded
- Estrutura de dados retornada muda

**Dependências de Schema:**
- Slot deve ter FK para carrinho (já existe: `cart_id`)
- Período é derivado de `start_time` (regra RB-015)

---

#### 2.2.2 Estrutura do Relatório

**Problema Atual:**
```
Tabela por Local:
├─ LOCAL "PONTO A"
│  ├─ Linhas: Horários (08:00–10:30, 14:00–16:00)
│  ├─ Colunas: Dias (Seg–Dom)
│  └─ Célula: Irmãos
├─ LOCAL "PONTO B"
│  └─ Similar...
```

**Estado Desejado:**
```
Tabela por Carrinho:
├─ CARRINHO "CASA DIEGO"
│  ├─ Linhas: MANHÃ, TARDE, NOITE (apenas linhas com dados)
│  ├─ Colunas: SEGUNDA, TERÇA, QUARTA, ..., DOMINGO
│  └─ Célula: Irmãos + Local + Horário
├─ CARRINHO "CENTRO COMERCIAL"
│  └─ Similar...
```

**Impacto:**
- `buildReportGrid()` deve agrupar por carrinho (novo agrupamento)
- Linhas devem ser períodos (MANHÃ/TARDE/NOITE), não horários específicos
- Célula deve incluir local e horário detalhado
- Períodos vazios não devem gerar linhas

**Validação:**
- Se um carrinho não tem nenhuma designação na semana, sua tabela não aparece
- Se um período (ex: NOITE) não tem turno para um carrinho, a linha não aparece

---

### 2.3 Mudanças no Schema (se necessário)

**Avaliação:** Nenhuma mudança obrigatória no schema. 

O schema já suporta:
- Associação Carrinho ↔ Slot (`cart_id` em slots)
- Horários explícitos (`start_time`, `end_time`)
- Múltiplas posições por slot (`position` em assignments, multiplicidade por capacity)

**Derivações necessárias (lógica de aplicação):**
- Função `getPeriodFromTime(start_time: string): "MANHÃ" | "TARDE" | "NOITE"`
  ```javascript
  // RB-015
  const getPeriodFromTime = (time) => {
    if (time < "12:00") return "MANHÃ"
    if (time < "18:00") return "TARDE"
    return "NOITE"
  }
  ```

---

## 3. Modelo de Domínio

### Conceitos e Relacionamentos

```
┌─────────────────────────────────────────────────────────────┐
│                    MODELO DE DOMÍNIO                         │
└─────────────────────────────────────────────────────────────┘

ENTIDADE: Brother (Irmão)
├─ Atributos: id, name*, phone, notes, active, created_at
├─ Restrições: name obrigatório
└─ Relacionamentos:
   └─ 1:N → Assignments (um irmão em múltiplas designações)

ENTIDADE: Cart (Carrinho)
├─ Atributos: id, name*, description, active, created_at
├─ Restrições: name obrigatório
└─ Relacionamentos:
   └─ 1:N → Slots (um carrinho pode ter múltiplos turnos)

ENTIDADE: Location (Local)
├─ Atributos: id, name*, address, notes, active, created_at
├─ Restrições: name obrigatório
└─ Relacionamentos:
   └─ 1:N → Slots (um local pode ter múltiplos turnos)

ENTIDADE: Slot (Turno)
├─ Atributos: 
│  ├─ id (PK)
│  ├─ location_id (FK Location)*
│  ├─ cart_id (FK Cart) [opcional]
│  ├─ day_of_week [0-6]*
│  ├─ start_time [HH:MM]*
│  ├─ end_time [HH:MM]*
│  ├─ capacity [1-10, default 2]
│  └─ active
├─ Restrições:
│  ├─ start_time < end_time
│  ├─ Cada local+dia+horário é único (para evitar duplicação)
│  └─ Um slot DEVE ter um local; pode ou não ter carrinho
├─ Derivações:
│  └─ period = getPeriodFromTime(start_time) → "MANHÃ" | "TARDE" | "NOITE"
└─ Relacionamentos:
   ├─ N:1 → Location
   ├─ N:1 → Cart [opcional]
   └─ 1:N → Assignments (um turno tem múltiplas designações por position)

ENTIDADE: ScheduleWeek (Semana de Programação)
├─ Atributos: id, week_start [YYYY-MM-DD, segunda-feira]*, notes, created_at
├─ Restrições:
│  ├─ week_start é unique
│  └─ week_start sempre representa segunda-feira
└─ Relacionamentos:
   └─ 1:N → Assignments (uma semana tem múltiplas designações)

ENTIDADE: Assignment (Designação)
├─ Atributos:
│  ├─ id (PK)
│  ├─ week_id (FK ScheduleWeek)*
│  ├─ slot_id (FK Slot)*
│  ├─ brother_id (FK Brother)*
│  ├─ position [1..N, baseado em capacity do slot]*
│  └─ created_at
├─ Restrições:
│  ├─ UNIQUE(week_id, slot_id, position) — uma posição por turno por semana
│  ├─ position <= slot.capacity
│  └─ brother é sempre ativo
├─ Regra de Negócio:
│  └─ Não pode haver duplicate (week, slot, position) — upsert via ON CONFLICT
└─ Relacionamentos:
   ├─ N:1 → ScheduleWeek
   ├─ N:1 → Slot
   └─ N:1 → Brother

FLUXO PRINCIPAL: Programação
┌─────────────────────────────────────────────────┐
│ 1. Usuário escolhe semana (ScheduleWeek)        │
│ 2. Sistema carrega Slots ativos dessa semana    │
│ 3. Sistema agrupa Slots por Carrinho            │
│ 4. Para cada Carrinho:                          │
│    ├─ Agrupa Slots por Período (MANHÃ/TARDE/...) │
│    └─ Para cada Período×Dia: exibe Assignments │
│ 5. Usuário designa Brothers às posições         │
│ 6. Cada designação é INSERT/UPDATE em Assignment│
│ 7. Sistema valida:                              │
│    ├─ Irmão não repetido no mesmo dia           │
│    └─ Irmão ativo                               │
└─────────────────────────────────────────────────┘

FLUXO PRINCIPAL: Relatório
┌─────────────────────────────────────────────────┐
│ 1. Usuário escolhe semana (ScheduleWeek)        │
│ 2. Sistema carrega Carrinhos com Slots dessa sem│
│ 3. Para cada Carrinho:                          │
│    ├─ Extrai Slots + Assignments                │
│    ├─ Agrupa por Período                        │
│    └─ Renderiza tabela: Período × Dias          │
│ 4. Usuário clica "Imprimir" ou "Exportar PDF"  │
│ 5. Navegador executa print() ou html2pdf()      │
└─────────────────────────────────────────────────┘
```

---

## 4. Regras de Negócio (Consolidadas)

### 4.1 Cadastro e Dados Base

| ID | Descrição | Aplicável a |
|----|-----------|-------------|
| RB-001 | Nome do irmão é obrigatório | Brother |
| RB-002 | Irmãos inativos não aparecem em seleções de designação | Brother |
| RB-003 | Telefone e anotações do irmão são opcionais | Brother |
| RB-004 | Nome do carrinho é obrigatório | Cart |
| RB-005 | Carrinhos inativos não aparecem em seleções | Cart |
| RB-006 | Carrinho é a entidade central do modelo (carrinho → turno → designações) | Cart, Architecture |
| RB-007 | Nome do local é obrigatório | Location |
| RB-008 | Um local pode ter múltiplos turnos | Location, Slot |
| RB-009 | Deletar local deleta todos seus turnos em cascata | Location, Slot |
| RB-010 | Turno requer: local, dia, horário início, horário fim | Slot |
| RB-011 | Capacidade padrão 2; mínimo 1, máximo 10 | Slot |
| RB-012 | Todo turno obrigatoriamente tem um carrinho (`cart_id` obrigatório) | Slot, Cart |
| RB-013 | Dia: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb | Slot |
| RB-014 | Horários são strings HH:MM em formato 24h | Slot |

### 4.2 Programação e Designações

| ID | Descrição | Aplicável a |
|----|-----------|-------------|
| RB-015 | **Período derivado de start_time:** MANHÃ (< 12:00), TARDE (12:00–18:00), NOITE (≥ 18:00) | Slot, Schedule, Report |
| RB-016 | Um irmão não pode estar em dois turnos diferentes no mesmo dia (conflito) | Schedule, Validation |
| RB-017 | Irmãos inativos não aparecem em opções de seleção | Schedule, Data Integrity |
| RB-018 | Um turno pode ter múltiplas posições (1 a capacity); cada posição → irmão diferente | Slot, Assignment |
| RB-019 | week_start é sempre segunda-feira no formato YYYY-MM-DD | ScheduleWeek |

### 4.3 Relatório

| ID | Descrição | Aplicável a |
|----|-----------|-------------|
| RB-020 | Cada carrinho com designações recebe uma tabela separada no relatório | Report |
| RB-021 | Períodos exibidos: MANHÃ, TARDE, NOITE | Report |
| RB-022 | Períodos vazios de um carrinho não geram linhas | Report |
| RB-023 | Dias exibidos: SEGUNDA a DOMINGO (7 dias) | Report |
| RB-024 | Célula vazia quando não há designação naquele período+dia | Report |
| RB-025 | Nome da congregação vem de localStorage.congregationName | Report |
| RB-026 | Relatório é snapshot (não atualiza em tempo real); reload necessário | Report |

### 4.4 Exportação e Impressão

| ID | Descrição | Aplicável a |
|----|-----------|-------------|
| RB-027 | PDF usa formato A4 landscape (297 × 210 mm) | Export |
| RB-028 | Margens padrão: 8mm em todos os lados | Export |
| RB-029 | Qualidade de imagem: 98% JPEG, escala 2× (html2canvas) | Export |
| RB-030 | Botão exportar desabilitado quando sem programação ou durante geração | Export, UI |

---

## 5. Questões em Aberto e Ambiguidades

### 5.1 ~~Semana e Fins de Semana~~ — ✅ RESOLVIDO

**Decisão (08/06/2026):** O relatório exibe **Segunda a Domingo (7 dias)**.

**Impacto:** `REPORT_DAYS = [1, 2, 3, 4, 5, 6, 0]` — coluna Domingo sempre presente.

---

### 5.2 ~~Horários Padrão vs. Customizados~~ — ✅ RESOLVIDO

**Decisão (08/06/2026):** Qualquer horário customizado é permitido (ex.: 08h–10h30). O período (MANHÃ/TARDE/NOITE) é exibido junto ao horário como rótulo derivado (RB-015).

---

### 5.3 ~~Turnos sem Carrinho~~ — ✅ RESOLVIDO

**Decisão (08/06/2026):** Todo turno obrigatoriamente tem um carrinho. `cart_id` passa a ser campo obrigatório no formulário.

**Impacto:** Validação no formulário de slot; `cart_id NOT NULL` pode ser reforçado no schema futuramente.

---

### 5.4 ~~Conflito de Designação~~ — ✅ RESOLVIDO

**Decisão (08/06/2026):** Apenas aviso visual (destaque âmbar). A designação conflitante é salva normalmente; não há bloqueio.

---

### 5.5 ~~Exclusão de Dados~~ — ✅ RESOLVIDO

**Decisão (08/06/2026):** Apenas inativação (soft-delete). Nenhum registro é apagado. Irmãos, carrinhos, locais e turnos são marcados como `active = 0` e preservados no banco.

---

### 5.6 ~~Sincronização Multi-usuário~~ — ✅ RESOLVIDO

**Decisão (08/06/2026):** Haverá apenas um coordenador. Multi-usuário fora do escopo. Banco local (OPFS) é suficiente.

---

## 6. Critérios de Aceitação Técnicos

### 6.1 Refatoração de Schedule.jsx

**Deve passar em:**
- [ ] Grid agrupa por carrinho (não local)
- [ ] Linhas representam períodos (MANHÃ/TARDE/NOITE)
- [ ] Períodos são derivados de start_time via RB-015
- [ ] Visualização mantém: navegação semanas, criar semana, copiar, auto-fill, limpar
- [ ] Validação de conflito (irmão repetido no dia) mantida
- [ ] Modal "Gerenciar Turnos" funciona sem alteração

**Testes:**
- [ ] Abrir uma semana com múltiplos carrinhos
- [ ] Verificar agrupamento correto
- [ ] Designar irmão e confirmar reflexo em Assignment
- [ ] Gerar automático e validar conflitos
- [ ] Copiar de semana anterior

---

### 6.2 Refatoração de Report.jsx

**Deve passar em:**
- [ ] Relatório agrupa por carrinho (não local)
- [ ] Linhas representam períodos (MANHÃ/TARDE/NOITE)
- [ ] Períodos vazios não geram linhas
- [ ] Célula exibe: irmãos + local + horário
- [ ] PDF exporta com estrutura correta
- [ ] Impressão funciona em A4 landscape
- [ ] Navegação semanas mantida

**Testes:**
- [ ] Gerar relatório com 1 carrinho, múltiplos períodos
- [ ] Gerar relatório com 3+ carrinhos
- [ ] Exportar PDF e validar layout
- [ ] Imprimir e validar quebras de página

---

### 6.3 Implementação de Settings.jsx

**Funcionalidades esperadas:**
- [ ] Campo "Nome da congregação" (localStorage)
- [ ] Botão "Exportar banco" (download .db)
- [ ] Botão "Importar banco" (upload e merge)
- [ ] Botão "Limpar tudo" (com confirmação)
- [ ] Versão da aplicação exibida

**Testes:**
- [ ] Salvar nome congregação e confirmar em Report
- [ ] Exportar e reimportar banco
- [ ] Limpar dados e verificar banco vazio

---

## Apêndice A — Validações de Formulário

### Turnos (Slot)

| Campo | Tipo | Obrigatório | Validação | Mensagem de Erro |
|-------|------|-------------|-----------|-----------------|
| location_id | Select | Sim | Não nulo | "Selecione um local" |
| day_of_week | Select | Sim | 0–6 | (automático) |
| start_time | Time Input | Sim | HH:MM, válido | "Formato inválido" |
| end_time | Time Input | Sim | HH:MM, > start_time | "Horário fim deve ser posterior ao início" |
| cart_id | Select | Não | Se preenchido, válido | (automático) |
| capacity | Number | Sim | 1–10 | "Capacidade deve ser entre 1 e 10" |

### Irmãos (Brother)

| Campo | Tipo | Obrigatório | Validação | Mensagem de Erro |
|-------|------|-------------|-----------|-----------------|
| name | Text | Sim | Não vazio | "Nome obrigatório" |
| phone | Text | Não | Formato livre | (nenhuma) |
| notes | Textarea | Não | Qualquer texto | (nenhuma) |

### Carrinhos (Cart)

| Campo | Tipo | Obrigatório | Validação | Mensagem de Erro |
|-------|------|-------------|-----------|-----------------|
| name | Text | Sim | Não vazio | "Nome obrigatório" |
| description | Textarea | Não | Qualquer texto | (nenhuma) |

### Locais (Location)

| Campo | Tipo | Obrigatório | Validação | Mensagem de Erro |
|-------|------|-------------|-----------|-----------------|
| name | Text | Sim | Não vazio | "Nome obrigatório" |
| address | Text | Não | Qualquer texto | (nenhuma) |
| notes | Textarea | Não | Qualquer texto | (nenhuma) |

---

## Apêndice B — Glossário de Termos

| Termo | Significado | Exemplo |
|-------|-----------|---------|
| **Irmão / Brother** | Voluntário da congregação disponível para programação | João da Silva |
| **Carrinho / Cart** | Recurso físico para testemunho público | "Carrinho Casa Diego", "Carrinho Centro" |
| **Local / Location** | Ponto de posicionamento do carrinho | "Ponto Novo", "Praça Central", "Shopping" |
| **Turno / Slot** | Agendamento de um local em um dia/horário específico com capacidade | "Ponto Novo, Seg 08:00–10:30, cap. 2" |
| **Período** | Faixa de tempo derivada do horário (MANHÃ/TARDE/NOITE) | MANHÃ = < 12:00 |
| **Designação / Assignment** | Alocação de um irmão a um turno em uma semana específica | João designado à Ponto Novo, Seg 08:00, semana de 08/06 |
| **Semana de Programação / ScheduleWeek** | Conjunto de designações de uma semana (Seg–Dom) | Semana de 08/06/2026 |
| **Conflito** | Mesmo irmão em dois turnos diferentes no mesmo dia | João em dois locais na Seg |
| **Capacidade / Capacity** | Número máximo de irmãos por turno | 2 pessoas por turno |

---

**Documento finalizado.** Pronto para análise e aprovação pelo coordenador.
