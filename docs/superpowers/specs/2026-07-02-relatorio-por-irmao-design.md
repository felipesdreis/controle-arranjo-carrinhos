# Design: Relatório "Por irmão"

## Contexto

A página `/report` (`src/pages/Report.jsx`) hoje só oferece uma visão: a grade semanal completa, agrupada por carrinho → período → dia, para uma semana selecionada via navegação ◀ ▶. É usada tanto por `admin` quanto por `user` (sem `RoleRoute`), com exportação em PDF (`html2pdf.js`) e impressão via `window.print()`.

Falta uma forma de um irmão (ou quem monta a programação) consultar rapidamente só as designações de uma pessoa específica, sem precisar vasculhar a grade inteira.

## Objetivo

Adicionar um segundo modo de visualização na mesma página `/report`: filtrar por irmão e ver os turnos em que ele está designado na semana selecionada, incluindo os colegas que dividem o turno com ele.

## Escopo

- Modo "Por irmão" dentro de `/report`, alternável via toggle com o modo "Visão semanal" (padrão, mantém comportamento atual).
- Escopo temporal: apenas a semana selecionada pela navegação ◀ ▶ já existente (não é histórico multi-semana).
- Exportação em PDF e impressão reaproveitadas para os dois modos.

Fora de escopo (não incluído nesta iteração):
- Histórico multi-semana ou filtro por intervalo de datas.
- Nova tabela, API ou query no Supabase.
- Alterações em RBAC/rotas — o modo "Por irmão" segue as mesmas permissões da página `/report` atual (acessível a `admin` e `user`).

## UI

Uma barra de modo, não impressa (`print:hidden`, como os controles existentes), é adicionada entre o header de navegação de semana e a folha de relatório:

- Dois botões: **Visão semanal** (padrão) e **Por irmão**.
- Quando "Por irmão" está ativo, um `<select>` lista os irmãos de `store.brothers` (já carregado pelo `useAppStore`, sem chamada nova). Nenhum irmão pré-selecionado.
- A navegação de semana (◀ ▶) permanece visível e funcional nos dois modos — trocar de semana com "Por irmão" ativo recalcula a lista para a nova semana.
- Trocar de modo ou de irmão não dispara novo carregamento de dados — é filtragem client-side sobre os dados já buscados por `loadData()`.

## Dados

Os dados necessários (`slots` via `getSlotsWithDetails()` e `rawAssignments` via `getAssignmentsByWeek(week.id)`) já são carregados por `loadData()` para a visão semanal. Nenhuma API nova é criada.

Nova função pura `buildBrotherRows(slots, rawAssignments, brothers, brotherId)`, ao lado de `buildReportGridByCart` em `Report.jsx`:

1. Filtra `rawAssignments` por `a.brother_id === brotherId`.
2. Para cada assignment filtrado, localiza o `slot` correspondente (por `slot_id`) em `slots` para obter `day_of_week`, `start_time`, `end_time`, `location_name`, `cart_name`.
3. Monta a lista de colegas: outras entradas de `rawAssignments` com o mesmo `slot_id` (posições diferentes), mapeadas para nome via `brothers` — exclui o próprio irmão selecionado.
4. Retorna um array de linhas `{ day_of_week, time, location, cart_name, colleagues: string[] }`, ordenado primeiro por `REPORT_DAYS` (mesma ordem Seg→Dom usada na grade atual) e depois por `start_time`.

Se um assignment referenciar um `slot_id` que não existe mais em `slots` (slot inativo/removido), a linha é descartada silenciosamente — mesmo comportamento implícito já usado pela grade semanal ao ignorar slots ausentes.

## Impressão / Exportação PDF

O conteúdo dentro de `reportRef` (a folha capturada por `html2pdf` e por `window.print()`) passa a renderizar condicionalmente conforme o modo ativo:

- **Visão semanal:** grade atual, sem alterações.
- **Por irmão:** título "Designações de {nome do irmão} — Semana de {período}" seguido de uma tabela simples com colunas **Dia | Data | Horário | Local | Carrinho | Colegas**, uma linha por turno. "Colegas" mostra os nomes separados por vírgula, ou vazio se o irmão estiver sozinho no turno (capacidade 1).

Os botões "Exportar PDF" e "Imprimir" não mudam de implementação — continuam capturando `reportRef.current`, que já contém o conteúdo certo para o modo ativo.

## Estados vazios

- Modo "Por irmão" sem irmão selecionado: mensagem central "Selecione um irmão para ver as designações." (mesmo estilo visual do estado "Semana sem programação" já existente).
- Irmão selecionado, mas sem nenhuma linha na semana: "Nenhuma designação para {nome} nesta semana."
- Semana sem `schedule_week` cadastrada (`!week`): mantém o estado atual ("Semana sem programação"), independente do modo — não há dados de nenhum tipo para mostrar.

## Testes

Segue o padrão do projeto (sem framework de testes automatizado configurado — build é a verificação, conforme `CLAUDE.md`). Validação manual:

1. `npm run build` passa sem erros.
2. No navegador: alternar para "Por irmão", selecionar um irmão com designações na semana atual → linhas corretas, colegas corretos.
3. Selecionar um irmão sem designações → mensagem de vazio correta.
4. Navegar ◀ ▶ com "Por irmão" ativo e um irmão selecionado → lista recalcula para a nova semana.
5. Exportar PDF e Imprimir em ambos os modos → conteúdo capturado corresponde ao modo ativo.
6. Alternar de volta para "Visão semanal" → grade original intacta, sem regressão.
