# Requisitos de treinamento — critérios do lote

Fonte: Livro Base v1.3, páginas 28, 40 e tabela 2.1 da página 41.

## Critérios de aceitação
- T01: as 28 perícias respeitam a tabela: Medicina não exige treino genérico; Profissão exige. Usos específicos de Medicina continuam sob conferência do mestre.
- T02: perícia somente treinada sem grau válido não gera sorteio, resultado, gasto de PE ou entrada de histórico pelo fluxo normal, mesmo com bônus de item/poder. A interface explica o impedimento antes da execução.
- T03: graus 1, 2 e 3 permitem o teste; nomes legados com acentos são reconhecidos; zero canônico prevalece sobre nomes duplicados. Não alterar treinamento salvo.
- T04: Eclético selecionado concede treinamento temporário somente para o teste e preserva a confirmação de PE já existente. Sem seleção não libera o requisito; sem confirmação não entrega resultado. Troca de perícia valida o treinamento da perícia efetivamente usada.
- T05: desktop e mobile usam a mesma validação. Testes de atributo sem perícia não recebem bloqueio indevido. Rótulo de requisito aparece nas listas e aviso no modal, sem depender de tooltip.
- T06: checagem de tipos, testes de bloqueio/liberação/Eclético e regressão das rolagens passam; publicação e conferência visual são verificações separadas.

## Limites explícitos
Kits, novas tentativas, graus exigidos por usos específicos, exceção da proteção discreta para ocultá-la com Crime e demais contextos não são inferidos num teste genérico. A página de regras permanece parcial. Este lote valida o fluxo da ficha; não transforma o registro genérico de histórico em um motor de autorização de toda ação de jogo.

## Arquivos e caminho dos dados
- `src/lib/character-data.ts`: catálogo comum usado pela criação, seleção de treino e ficha; corrige os dois marcadores, sem alterar dados salvos.
- `src/lib/skill-test-requirements.ts`: recebe nome/ID, graus persistidos e bônus temporário de Eclético; usa catálogo e `skill-training.ts`; retorna aviso ou null aos dois modais. Não grava dados.
- `src/components/character/SkillsByAttribute.tsx`: lista desktop recebe skills, atributos e bônus; lê graus normalizados, mostra requisito e encaminha a seleção ao CharacterSheet.
- `src/components/character/mobile/MobileSkillsTab.tsx`: lista móvel recebe skills e callback; apresenta requisito sem exigir hover; encaminha seleção à ficha móvel.
- `src/pages/CharacterSheet.tsx` e `src/components/character/MobileCharacterSheet.tsx`: passam `character.skills` separadamente dos bônus para seus modais de dados. Nenhuma alteração de treinamento ou recurso nessa passagem.
- `src/components/dice/DiceRollModal.tsx` e `src/components/character/mobile/MobileDiceRollModal.tsx`: recebem graus reais, conferem perícia efetiva antes de sortear e desabilitam o botão com explicação. Eclético continua pelo painel de poderes e pelo fluxo existente `useConfirmedDiceRoll`; confirmação falha não entrega resultado. Sem bloqueio, resultado segue aos callbacks e ao histórico existente da ficha.
- `src/lib/rules/base-rule-coverage.ts`: expõe na página /rules a cobertura real e as exceções ainda manuais.
- `src/components/dice/__tests__/SkillTrainingRequirements.test.tsx`: verifica catálogo, legados, bloqueios e resultado somente após PE confirmado, nos dois modais montados.
- Este documento define critérios, limites e responsabilidades antes da implementação.

Fluxo: ficha carregada → seleção da perícia → modal recebe graus e bônus separados → validação compartilhada → [impedimento sem sorteio/gasto/histórico OU rolagem válida] → confirmação de PE quando houver poder → callback de resultado → histórico existente. Não há tabela nova nem migration; registros e históricos anteriores são preservados. A conferência no navegador não substitui autorização de regras no servidor e não certifica usos narrativos de perícias.
