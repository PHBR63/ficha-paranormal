# Livro Base v1.3: cobertura, poderes e início de turno

## Escopo adotado

Somente Livro Base v1.3. A mesa mantém o 20 natural que exige total suficiente e o descanso personalizado existente. Nenhum suplemento ou variante foi habilitado. As 39 famílias da página `/rules` são um mapa de comportamento e pendências, não uma porcentagem de fidelidade ao livro.

Fonte: exemplar fornecido pelo usuário, páginas impressas 88 (recursos), 114–116 (poderes) e 310–311 (condições). O arquivo original não faz parte desta entrega. Resumos de regras foram escritos em palavras próprias.

## Comportamento entregue

- NEX 99 representa o vigésimo patamar. PV e PE incluem o atributo em cada patamar, tanto no cálculo principal quanto nos auxiliares. Abrir uma ficha não aplica a correção automática de máximos da auditoria; valores armazenados precisam de revisão explícita.
- Chegar a zero PV inclui Inconsciente e Morrendo. Recuperar PV remove Inconsciente, mas estabilizar Morrendo exige resolução própria. Perturbado usa SAN estritamente abaixo da metade.
- Início de turno mostra os dados antes de confirmar: Sangrando usa Vigor DT 20 e perda de 1d6 sem RD; Em Chamas usa 1d6; veneno exige fórmula informada pela fonte. Fórmulas inválidas são recusadas. Resistência ao fogo/veneno é informada pelo jogador, com limite entre zero e o valor rolado.
- Condições desconhecidas e seus parâmetros são preservados. Um turno sem perda de PV não recoloca Morrendo numa ficha estabilizada que permanece com zero PV.
- A confirmação salva recursos, condições e um evento por ficha na mesma transação. Falha não apresenta sucesso nem atualiza a ficha antecipadamente. Repetir o mesmo pedido aberto conserva UUID e snapshot.
- No mobile, a ficha recebe as condições completas do banco, incluindo datas, contadores e parâmetros. Somente os adaptadores que pedem IDs ou nomes recebem essas representações. Resposta ausente por 30 segundos libera a interface com aviso de confirmação pendente e permite repetir o mesmo UUID; não presume rollback da requisição original.
- O catálogo dos 22 poderes foi confrontado com o Livro Base. Bônus permanentes seguros usam uma fonte compartilhada. Afinidade aprimorada exige duas escolhas do poder e afinidade ativa elegível, não apenas possuir o elemento. Efeitos situacionais têm consulta explícita ao mestre.
- Os nove poderes situacionais do painel agora exibem `Conferir`: consulta não cobra recursos, registra uso ou confirma efeito. Os controles de reset sem efeito ficam ocultos. Isso substitui ativações antigas que afirmavam resultados sem confirmação adequada.

## Arquivos e responsabilidades

Todos os caminhos abaixo são relativos à raiz do repositório. A interface recebe a ficha autenticada; as bibliotecas recebem valores tipados e retornam cálculos, sem acesso direto ao banco.

| Arquivo | Papel, dependências e dados |
| --- | --- |
| `src/lib/rules/base-profile.ts` | Perfil único adotado e avisos; consumido pela cobertura e pelo resolvedor de turno. Não grava configurações por campanha. |
| `src/lib/rules/base-rule-coverage.ts` | Catálogo de cobertura, páginas, limitações e filtros; recebe consulta/filtros, retorna famílias exibidas em RulesCoverage. |
| `src/lib/rules/nex-progression.ts` | Valida NEX e retorna patamar; compartilhado pelos cálculos de recursos e limite de PE. |
| `src/lib/rules/base-paranormal-powers.ts` | Fonte dos 22 poderes e bônus permanentes; alimenta catálogo, adaptador e guia de consulta. |
| `src/lib/rules/condition-turn.ts` | Prepara rolagens, valida perda final e remove apenas índices resolvidos; recebe condições/Vigor/sorteador, retorna resolução e condições. |
| `src/pages/RulesCoverage.tsx` | Página autenticada de busca e filtros; importa catálogo e perfil, não altera banco. |
| `src/App.tsx` | Registra a rota protegida `/rules` com carregamento da página. |
| `src/components/dashboard/DashboardQuickActions.tsx` | Dá acesso à página de regras no painel. |
| `src/components/character/BaseRulesNotice.tsx` | Aviso compartilhado das fichas desktop/mobile e link para limitações. |
| `src/components/character/ConditionTurnResolver.tsx` | Dialog recebe condições, Vigor e preparador de aplicação; congela prévia, mostra dados e aguarda recibo. Cancela antes da confirmação sem gravar. |
| `src/hooks/character/useConditionTurnApplication.ts` | Recebe snapshot da ficha e callback; utiliza serialização, useAutoConditions e serviço; envia RPC com UUID, valores, snapshot e resolução, retorna execução assíncrona. |
| `src/services/character-activity-service.ts` | Contrato tipado da nova RPC, autenticação já fornecida pelo cliente Supabase e validação de identidade do recibo. |
| `src/components/character/ConditionManager.tsx` | Gerenciador desktop chama resolvedor compartilhado; recebe condições e preparador da ficha. |
| `src/components/character/mobile/MobileConditionManager.tsx` | Mesmo fluxo no mobile; contador manual admite zero e pede confirmação narrativa em vez de declarar morte automática. |
| `src/components/character/mobile/MobileOverviewTab.tsx` | Repassa Vigor e preparador ao gerenciador mobile. |
| `src/components/character/MobileCharacterSheet.tsx` | Integra hook, aviso e atualização após confirmação; desliga correção automática de máximos ao abrir. |
| `src/pages/CharacterSheet.tsx` | Integra o fluxo desktop, recibo, refetch e aviso; desliga correção automática de máximos ao abrir. |
| `src/lib/character-activity-presentation.ts` | Converte evento `condition_turn` em resumo de PV, testes e dados para histórico existente. |
| `src/lib/game-engine.ts` | Corrige condições automáticas de PV/SAN; usado por useAutoConditions e fluxos existentes de recursos. |
| `src/lib/conditions/base-condition-rules.ts` | Orientações de encerramento conferidas, consumidas pelo catálogo de condições; dados narrativos, sem remoção automática. |
| `src/lib/conditions/condition-definitions.ts` | Usa as orientações compartilhadas nos gerenciadores e não presume 1d6 no texto de veneno sem fórmula. |
| `src/lib/character-data.ts` | Cálculos principais passam a usar patamar canônico. |
| `src/lib/rules-engine/helpers/class-stats.ts` | Auxiliares de máximos por classe/NEX/atributos, alinhados ao principal. |
| `src/lib/rules-engine/derive-character.ts` | Recursos derivados e detalhamento dos bônus por patamar; recebe ficha normalizada. |
| `src/lib/rules-engine/helpers/resource-bonuses.ts` | Fallback de origens por patamar usa NEX 99 correto. |
| `src/lib/rules-engine/sue-bridge.ts` | Ponte com motor de efeitos usa os mesmos máximos de classe. |
| `src/lib/unified-effects-engine.ts` | Bônus por NEX usam patamar canônico; recebe efeitos e contexto da ficha. |
| `src/lib/dice-roller.ts` | Limite de PE reconhece o vigésimo patamar. |
| `src/hooks/character/useCombatRollSetup.ts` | Preparação de combate usa patamar compartilhado; demais regras de proficiência não foram certificadas nesta entrega. |
| `src/lib/paranormal-powers/power-definitions.ts` | Constrói catálogo da fonte canônica e calcula modificadores; mantém IDs/contratos existentes para seletores e painéis. |
| `src/lib/effects/paranormal-powers-effects-adapter.ts` | Converte escolhas em bônus permanentes, sem duplicar incremento por NEX; preserva escolhas genéricas. |
| `src/hooks/useParanormalEffects.ts` | Usa adaptador compartilhado em vez de repetir regras; devolve resumo de bônus às fichas. |
| `src/hooks/useActivatableParanormalPowers.ts` | Guia de resolução manual dos poderes situacionais; recebe escolhas/afinidade, retorna consultas e descrições, sem mutação de recursos. |
| `src/components/character/ParanormalPowerSelectModal.tsx` | Seletor desktop informa contexto de afinidade à validação de segunda escolha. |
| `src/components/character/mobile/MobileParanormalPowerSelectModal.tsx` | Mesmo contexto no seletor mobile. |
| `src/components/character/ParanormalPowersPanel.tsx` | Exibe aprimoramento somente com segunda escolha elegível. |
| `src/components/character/ParanormalPowersActivationPanel.tsx` | Consulta desktop, descrição expansível e indicação explícita de resolução manual. |
| `src/components/character/mobile/MobileParanormalPowersActivationPanel.tsx` | Consulta mobile com quebra de linha e sem resets fictícios. |
| `supabase/migrations/20261006180000_character_turn_resolution.sql` | Cria somente nova função; valida usuário/valores, trava ficha, reutiliza bundle e grava evento. Nenhuma coluna ou registro existente é excluído. |
| `supabase/tests/character_condition_turn.sql` | Cenários de permissão, concorrência, idempotência e validação em transação com rollback. |

Testes criados: `src/lib/rules/__tests__/base-turn.vitest.ts`, `base-powers.vitest.ts`, `src/components/character/__tests__/ConditionTurnResolver.test.tsx` e `src/hooks/character/__tests__/useConditionTurnApplication.test.tsx`. Exercitam cálculo, interface, erro de servidor, clique duplicado, snapshot congelado, troca de ficha e atualização visual após commit.

Expectativas corrigidas nos testes existentes: `src/hooks/__tests__/useAutoConditions.vitest.ts`, `src/hooks/character/__tests__/useCombatRollSetup.test.ts`, `src/lib/__tests__/paranormal-powers.vitest.ts`, `sue-edge-cases.vitest.ts`, `sue-special-mechanics.vitest.ts` e `src/lib/effects/__tests__/paranormal-powers-effects-adapter.vitest.ts`. Continuam cobrindo condições, NEX e efeitos; não foram ignorados para passar a suíte.

## Fluxo e banco

Ficha → gerenciador de condições → dialog → biblioteca de preparação → hook de aplicação → cliente autenticado → `resolve_character_condition_turn` → `change_character_resources` → `characters` e `character_activity_events` → recibo → atualização da ficha e histórico.

Payload: `p_operation_id`, `p_character_id`, `p_values` (PV/PE/SAN), `p_expected` (recursos máximos/atuais, Vigor e condições), `p_conditions` e `p_resolution` (perfil/revisão, testes, dados e perdas). O token da sessão é tratado pelo cliente existente, nunca incluído em logs. A função usa a autorização já existente para proprietário e mestre de campanha, inclusive compatibilidade v1/v2. Público e anônimo não podem executar.

Snapshot divergente recusa com `40001`; entrada inválida com `22023`; permissão recusada com `42501`; UUID repetido com payload diferente é recusado pelo bundle. Mesmo UUID e payload devolvem o evento confirmado. O registro inclui autor e ficha; a resposta de outra ficha não atualiza a ficha que estiver aberta.

## Limitações explícitas

- O servidor valida a transação e valores informados, mas não sorteia os dados nem certifica sozinho todos os efeitos situacionais.
- O início de turno ainda não possui identidade vinculada ao turno da campanha. Reabrir o dialog cria outro UUID; o jogador precisa confirmar que ainda não resolveu aquele turno. A proteção cobre clique duplicado e retry no mesmo pedido aberto, não toda aplicação repetida após fechar/reabrir.
- Contagem cumulativa de Morrendo/Enlouquecendo por cena, PV/PE temporários, orçamento de ações, dano massivo, resistências situacionais, efeitos e custos dos poderes de consulta e custo paranormal de rituais continuam manuais/parciais. A marcação automática de Machucado ainda não foi entregue.
- Pré-requisitos de escolhas genéricas por elemento, escolhas de Expansão de Conhecimento e efeitos de outros poderes/origens precisam de revisão própria. Nenhum bônus de perícia fictício é concedido por Expansão.
- Não há segunda conta real disponível para UAT entre mestre e jogador. Testes SQL com identidades distintas não substituem esse cenário visual.
- O lint tem erros legados nos arquivos grandes já existentes; comparação com o baseline verificou ausência de novos erros. Não declarar lint global limpo.

## Validação e operação

Executar `npx tsc -p tsconfig.app.json --noEmit`, `npm test -- --maxWorkers=2` e `npm run build`. Executar teste SQL com rollback e verificar grants após migration. Não inserir PDFs, caches de referência, snapshots gerados ou segredos no Git.

Na publicação: conferir `/rules` autenticada, busca e filtros; abrir ficha desktop/mobile; cancelar prévia sem alterar PV; confirmar teste controlado; verificar evento após recarregar; repetir uma falha transitória no mesmo dialog; conferir que `Conferir` dos poderes não afirma ativação. Verificar mestre/jogador reais quando houver segunda conta disponível.

Validação desta entrega (06/10/2026): 122 arquivos de teste e 3.101 testes passaram; checagem de tipos e build passaram. O lint dos arquivos alterados mantém 64 erros anteriores em cinco arquivos existentes, sem erros novos; dois erros anteriores dos painéis foram removidos. O build alerta sobre chunks grandes e dados antigos de Browserslist. Migration instalada e registrada no Lovable Cloud PHZF; testes transacionais com rollback passaram. A publicação e o UAT visual devem ser conferidos separadamente desses resultados locais.

No UAT publicado, a página de regras, filtros e detalhes foram conferidos em 1280×800 e 390×844. Cancelar prévia preservou PV; confirmar no desktop gravou dados e PV 28→22 no histórico, e os PV foram repostos. O teste encontrou perda de metadados no repasse ao mobile: corrigida preservando condições completas e limitando espera sem recibo a 30 segundos. Avisos de encerramento antigos foram substituídos por instruções do livro ou conferência da fonte, sem remoção automática. Uma ficha `[QA] Livro Base — poderes e condições` foi criada exclusivamente para verificar consultas e condições personalizadas; não é uma conta adicional.
