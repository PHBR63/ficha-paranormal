# Condições críticas e avisos de recursos

Complemento identificado durante UAT da entrega `CONDICOES_TRANSICOES_RECURSOS.md`. Fonte conferida: Livro Base v1.3, páginas impressas 88, 310 e 311.

## Correções

- Morrendo não impõe Inconsciente novamente após cura de PV: são condições distintas. Seu texto informa três inícios de turno cumulativos na cena, sem redução por dano recebido.
- Enlouquecendo não bloqueia ações imediatamente. O personagem se torna NPC após os três inícios de turno da cena, que continuam sob conferência manual.
- Inconsciente mantém impedimento de ações e reações e deriva Indefeso. Indefeso aplica −10 na Defesa; não equivale a Defesa fixa 5, a todos os ataques acertarem automaticamente ou a todo dano ser crítico.
- No adaptador compartilhado, Indefeso substitui Desprevenido na expansão, evitando somar −5 e −10. A falha automática em Reflexos e o golpe de misericórdia são informados para resolução manual; não há automatização de seus testes nesta entrega.
- Avisos desktop/mobile indicam saldos zerados e solicitam conferência das condições ativas. Não afirmam que uma condição removida manualmente continua presente apenas porque o saldo ainda é zero.
- O contador de Morrendo ganha nome acessível e dica de conferência da cena. Zero no contador local não certifica morte; removida a animação de salto nesse estado.

## Arquivos, dependências e dados

| Arquivo | Função e comunicação |
|---|---|
| `src/lib/conditions/base-condition-rules.ts` | Fonte comum dos textos, mecânicas e expansão. Recebe listas de IDs e retorna IDs derivados sem duplicação. Consumido por `condition-definitions` e pelo adaptador do SUE. |
| `src/lib/effects/condition-effects-adapter.ts` | Usa o cadastro e a fonte comum; recebe condições/contexto e retorna efeitos para `useUnifiedEffects` e resumos. Remove cópias antigas dos quatro estados críticos. Não escreve no banco. |
| `src/lib/game-engine.ts` | Mantém o contrato legado de modificadores e permissões, alinhando os estados críticos; utilizado por hooks e tracker antigo. Não recebe autoridade da cena. |
| `src/components/character/CharacterSheetHeader.tsx` | Recebe saldos por props e apresenta avisos desktop; alteração apenas nos textos, sem novas gravações. A tela `CharacterSheet` continua fornecendo os recursos. |
| `src/components/character/CombatStatsCard.tsx` | Recebe saldos/callbacks; exibe avisos compartilhados, inclusive mobile. O salvamento continua delegado à tela e ao recurso transacional existente. |
| `src/components/character/ConditionTimer.tsx` | Recebe contador manual por props de `ConditionManager`/`MobileConditionManager`; retorna indicação visual, nome acessível e dica. Não decrementa nem declara consequências no servidor. |
| `src/lib/effects/__tests__/condition-effects-adapter.vitest.ts` | Corrige as expectativas anteriores de bloqueio imediato de Morrendo/Enlouquecendo, preservando os testes de Inconsciente e outros estados. |
| `src/hooks/__tests__/useUnifiedEffects.vitest.ts` | Testa o hook real: estados críticos isolados permitem ações; Inconsciente permanece impeditivo e Indefeso não duplica na composição. |
| `src/lib/rules/__tests__/critical-condition-rules.vitest.ts` | Testa compatibilidade do motor legado, textos, independência das condições e penalidade substituída no adaptador compartilhado. |
| `src/lib/__tests__/conditions.vitest.ts` | Corrige expectativas textuais antigas de três rodadas e Defesa fixa 5. |
| `src/lib/__tests__/sue-integration-e2e.vitest.ts` | Integra cura efetiva, motor de condições, adaptador e consolidação: conserva Morrendo sem recriar impedimentos de Inconsciente. |
| `docs/CONDICOES_CRITICAS_AVISOS.md` | Registra o problema observado no UAT, regras, arquivos, fluxo e limites desta correção. |

## Fluxo

Condições já salvas → serialização existente → `useUnifiedEffects` → adaptador → fonte comum e expansão → modificadores/flags e textos → painéis desktop/mobile. A lista persistida permanece intacta; condições derivadas são calculadas, não adicionadas ao registro original. A confirmação de recursos e o histórico seguem as RPCs da entrega anterior.

## Testes de aceitação

Executar regressão completa, tipos e build; conferir o lint dos módulos alterados. No sistema publicado, usar a ficha exclusiva de QA:

1. Com Morrendo e Enlouquecendo, mas sem Inconsciente, conferir que o SUE não marca incapacidade automática de agir, reagir ou mover.
2. Com Inconsciente, conferir impedimentos e Indefeso com −10; remover/curar Inconsciente mantendo Morrendo e conferir que os impedimentos saem.
3. Curar SAN acima de zero e conferir saída de Enlouquecendo e entrada de Perturbado abaixo da metade.
4. Com recursos em zero após encerramento manual das condições, verificar aviso que manda conferir a lista, sem apresentar NPC ou condição ativa inexistente.
5. Conferir textos e contador em desktop/mobile, histórico após recarga e preservação da condição personalizada. Repor a ficha QA ao estado anterior conservando histórico.

## Limites

Sem migração, sem atualização em massa de fichas e sem novas permissões. As definições atuais são usadas na próxima renderização. Não há cena de regras persistente neste lote, morte/NPC automático, automatização de golpes de misericórdia ou falha automática contextual nos testes de Reflexos. O mapa `/rules` continua parcial. Outras condições e variantes mantêm os limites documentados anteriormente.

## Validação local

Em 06/10/2026: 125 arquivos e 3.127 testes passaram na regressão final. Checagem de tipos e build passaram; lint dos onze arquivos TypeScript alterados neste complemento passou, sem erros ou avisos. Não equivale a lint global limpo: a entrega anterior documenta a dívida das telas grandes. Build conserva os avisos anteriores de tamanho de pacotes/Browserslist. Publicação e UAT são registrados separadamente no relatório de operação do workspace.
