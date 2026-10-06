# Condições nas alterações de recursos — Livro Base v1.3

## Escopo e regras

Esta entrega corrige a atualização de recursos nas fichas desktop/mobile e a aplicação confirmada do início de turno. Fonte: página impressa 88 do Livro Base v1.3 fornecido pelo usuário. O texto do livro e seus PDFs não são incluídos no repositório.

- Machucado entra com metade ou menos dos PV e sai acima da metade; não acrescenta penalidade própria.
- Perder PV até zero inicia Inconsciente e Morrendo. Cura efetiva de PV remove Inconsciente, sem estabilizar Morrendo.
- Perder SAN até zero inicia Enlouquecendo. Cura efetiva de SAN encerra Enlouquecendo; se ainda estiver abaixo da metade, a ficha indica Perturbado.
- Editar apenas PE não recria Morrendo/Enlouquecendo já encerrados, nem remove Inconsciente/Enlouquecendo de outra fonte com recursos positivos.
- Nova perda recorrente de PV informada pelo resolvedor distingue dano com saldo zero de uma alteração sem dano. Isso não certifica a contagem da cena.
- O helper legado de dano enquanto Morrendo conserva o contador. Golpes recebidos não equivalem a inícios de turno.
- O histórico apresenta condições adicionadas e removidas, inclusive se a quantidade total permanece igual. Aceita strings antigas e nomes/IDs do catálogo; condições desconhecidas permanecem identificadas.

Não existe migração nesta entrega. Não há correção em massa de fichas antigas: abrir uma ficha não grava essas condições. A próxima confirmação nos fluxos descritos reconcilia Machucado com o saldo. Outras origens de dano/cura, como efeitos de rituais, ainda exigem conferência própria.

## Arquivos e responsabilidades

| Arquivo | Entrada, saída e dependências |
|---|---|
| `src/lib/game-engine.ts` | Recebe PV/SAN atuais, máximos, IDs ativos e contexto anterior. Retorna IDs a adicionar/remover e avisos; não grava dados. Exporta `ResourceConditionContext`. Usado pelo hook automático e pelo motor legado. |
| `src/hooks/useAutoConditions.ts` | Usa o motor; recebe saldos, objetos de condições, contexto e opção de aviso. Retorna condições completas e mensagens, preservando metadados; `notify=false` evita aviso antes de recibo. Utilizado pelas telas e pelo hook de turno. |
| `src/pages/CharacterSheet.tsx` | Tela desktop: envia saldos anteriores ao hook; envia valores, condições resultantes e snapshot esperado ao recurso transacional. Atualiza tela/avisos/histórico após recibo. |
| `src/components/character/MobileCharacterSheet.tsx` | Recebe ficha por props; segue o mesmo fluxo com serialização compartilhada e callback de atualização. Preserva condições completas no pedido. |
| `src/hooks/character/useConditionTurnApplication.ts` | Usa `useAutoConditions`, serialização, resolvedor e serviço autenticado de atividades. Inclui perda efetiva no contexto; envia UUID, resolução, recursos, condições e snapshot à RPC existente. Retry conserva o pedido. |
| `src/lib/character-activity-presentation.ts` | Recebe um evento confirmado ou antigo; usa `resolveConditionId` para comparar instâncias e retorna texto para histórico compartilhado desktop/mobile. Não modifica payload ou banco. Não inventa diferenças se snapshots estiverem ausentes. |
| `src/lib/rules/base-rule-coverage.ts` | Dados e filtros consumidos por `RulesCoverage` em `/rules`; descrevem os fluxos corrigidos e seus limites, mantendo classificação parcial. |
| `src/hooks/__tests__/resource-condition-transitions.test.tsx` | Testa limites pares/ímpares, estabilização, acalmamento, cura, perda, metadados e ausência de avisos anteriores à confirmação. Usa motor e hook reais. |
| `src/lib/__tests__/character-activity-presentation.test.ts` | Testa texto de eventos, trocas com mesma quantidade, instâncias repetidas, compatibilidade com strings e registros sem snapshots. |
| `src/hooks/__tests__/useAutoConditions.vitest.ts` | Expectativas existentes alinhadas à cura de SAN e ao contador que não avança por dano. Continua cobrindo a API legada. |
| `src/hooks/character/__tests__/useConditionTurnApplication.test.tsx` | Mantém testes de retry, escopo e confirmação. Verifica Machucado com PV zero sem recriar Morrendo. |
| `src/lib/rules/__tests__/base-turn.vitest.ts` | Atualiza a expectativa de condições em zero PV para incluir Machucado; mantém testes de rolagens, fórmulas, RD, NEX e cobertura. |
| `docs/LIVRO_BASE_REGRAS_TURNOS.md` | Atualiza descrição do comportamento e limitações do lote anterior. Sua validação de 3.101 testes corresponde ao lote anterior. |
| `docs/CONDICOES_TRANSICOES_RECURSOS.md` | Documenta esta entrega, arquivos, comunicação e cenários de aceitação. |

## Fluxo de comunicação

1. O usuário confirma recursos na tela, ou confirma uma resolução de início de turno.
2. A tela fornece ao hook saldos novos, condições completas e PV/SAN anteriores. O turno também fornece a perda de PV resolvida.
3. O motor calcula mudanças. O hook preserva os objetos que não mudaram e adiciona as novas condições com data ISO.
4. O serviço autenticado envia `change_character_resources` ou `resolve_character_condition_turn`, com UUID e snapshot esperado.
5. As funções existentes verificam permissão e concorrência; gravam `characters` e `character_activity_events` na mesma transação. O token continua gerenciado pelo cliente existente e não é registrado em logs.
6. Após confirmação, a tela atualiza dados e avisos. O histórico formata `before.conditions` e `after.conditions` do evento, sem criar novos registros.
7. Falha ou conflito não produz sucesso visual; o usuário recebe o tratamento existente de falha, reconciliação ou recuperação do mesmo pedido.

## Testar e critérios de aceitação

Executar checagem de tipos, suíte de regressão e build. O lint dos módulos de domínio/hook/testes deste lote deve passar; arquivos grandes das telas conservam erros legados documentados anteriormente.

Na ficha exclusiva de QA, conferir desktop e mobile:

1. Com máximo 20 PV, confirmar 10 PV: Machucado aparece e o histórico mostra `+Machucado`. Confirmar 11 PV: sai e o histórico mostra `−Machucado`.
2. Confirmar zero PV/SAN: aparecem as condições críticas. Remover Morrendo/Enlouquecendo como resolução manual de estabilização/acalmamento e alterar apenas PE: elas não retornam.
3. Curar 1 PV e 1 SAN: Inconsciente/Enlouquecendo saem; Morrendo permanece se não foi estabilizado e Perturbado aparece com SAN abaixo da metade.
4. Recarregar e comparar tela, recursos e condições salvos. Preservar a condição personalizada, seus parâmetros, data e duração.
5. Repor recursos e condições de QA após o teste, conservando o histórico das ações realizadas.

## Limites

A cena de áudio não identifica a cena de regras. Contagens cumulativas de Morrendo/Enlouquecendo, encerramento por fonte, estabilizações anteriores e uso de Diplomacia exigem uma identidade de cena persistente e definição do mestre. Esta entrega não cria morte automática, NPC automático ou reset por cena. O combate da campanha não dispara automaticamente todos os efeitos da ficha.

Mantidas as decisões anteriores: somente Livro Base; 20 natural exige total; descanso existente; históricos no servidor por ficha; limpar oculta; confirmação do servidor e proteção de retry no mesmo pedido. Uma conta real disponível limita a conferência visual mestre/jogador simultânea.

## Validação local deste lote

Em 06/10/2026: 124 arquivos e 3.116 testes passaram; checagem de tipos e compilação passaram. Os oito módulos centrais de motor, hook, apresentação, cobertura e seus testes passaram no lint. Os demais arquivos de tela/teste existentes têm 57 erros de lint (15 no mobile, 41 na tela desktop e um no teste legado), em trechos anteriores ao ajuste; o lint global não está limpo. Build mantém avisos de tamanho de pacotes e Browserslist antigo. Publicação e UAT são verificações separadas, registradas no relatório de operação do workspace.
