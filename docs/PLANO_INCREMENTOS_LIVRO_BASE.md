# Incrementos e critérios de aceite — Livro Base v1.3

Este documento organiza a continuidade da auditoria. Não é uma declaração de cobertura completa. O inventário executável está em `src/lib/rules/base-rule-coverage.ts`, apresentado na página de regras.

## Decisões já estabelecidas

- Somente Livro Base v1.3; manter as personalizações aprovadas de 20 natural e descanso.
- Históricos no servidor, vinculados à ficha. Limpar oculta registros, sem excluí-los.
- Jogador altera a própria ficha; mestre atua nas fichas vinculadas à campanha conforme autorização do servidor.
- Conjuração interrompida após consumo mantém registro e efeito pendente, sem estorno automático.
- Manutenção sustentada mostra custo e efeitos e exige confirmação explícita.
- Concentração usa Vontade e bônus atuais; falha consome PE e bloqueia efeitos.
- Cicatrização exige idade cadastrada antes de aplicar envelhecimento.
- Limite acumulado de PE somente com controle ativo de turnos, incluindo turno manual no servidor. Fora dele registrar gasto sem criar turnos.

## Ordem de implementação

| Prioridade | Entrega | Critério de aceite |
|---|---|---|
| 1 | Confirmação de ataques no desktop e mobile | Sem resultado ou dano liberado antes de aceitar PE; falha visível; repetição preserva sorteio e custo; clique duplicado bloqueado. Técnicas são cobradas no ataque, não na preparação. |
| 2 | Orçamento de poderes e habilidades no servidor | Custos identificados por habilidade e configuração validadas; compartilhar orçamento com rituais; respeitar exceção do custo mínimo e bônus específicos; não converter ajuste manual de recursos em habilidade. |
| 3 | Recibo conjunto de ataque, custo e histórico | Uma operação identifica a intenção; concorrência e reconexão não duplicam custos nem registros. Confirmar separadamente armazenamento do custo e do histórico até essa integração existir. |
| 4 | Consumo de munição, recarga e equipamentos | Validar quantidade e tipo, impedir valores negativos, conciliar disparo com recurso confirmado; preservar equipamentos existentes. |
| 5 | Ações, reações e duração | Validar controle ativo e identidade do turno; evitar dupla reação; expirar efeitos na duração correta; mostrar itens que exigem decisão do mestre. |
| 6 | Dano, resistência, redução e cura | Mostrar cálculo e origem de cada parcela; evitar dupla redução; validar imunidades, dano não letal, recursos temporários e idade; confirmar resultado no alvo autorizado. |
| 7 | Condições e efeitos cumulativos | Preservar condições desconhecidas; explicar bônus e penalidades; comprovar acúmulo, substituição e remoção em ficha e campanha. |
| 8 | Progressão, trilhas e poderes | Validar requisitos de NEX, treinamento, pré-requisitos e afinidade; apontar incompatibilidade sem remover escolhas históricas automaticamente. |
| 9 | Perícias e recursos narrativos | Conferir kits, penalidades, testes opostos e prolongados. Separar cálculo automatizado de circunstâncias que dependem do mestre. |
| 10 | Revisão visual e operacional | Desktop/mobile com avisos, tooltips, fontes dos bônus, filtros, paginação, reconexão e sincronização mestre/jogador. |

## Ciclo obrigatório por entrega

1. Identificar o fluxo ativo e a origem da regra no livro; distinguir regra oficial, personalização e resolução manual.
2. Reproduzir a falha com uma ficha de teste isolada.
3. Implementar uma alteração pequena, preservando compatibilidade e dados existentes.
4. Validar entrada, autorização, falhas de rede, concorrência e repetição quando houver gravação.
5. Executar testes relevantes, checagem de tipos e compilação; rever regressões relacionadas.
6. Integrar e publicar a alteração autorizada; verificar a versão efetivamente servida e o comportamento autenticado.
7. Remover somente os registros de teste criados para a entrega e registrar resultados e limitações.

## Evidência necessária para declarar conclusão

Uma regra listada ou um teste local aprovado não provam funcionamento publicado. Cada entrega deve registrar separadamente código/testes, migração aplicada quando necessária, autorização no banco, publicação e conferência autenticada. Regras narrativas com resolução manual precisam de instrução e registro claros; sua ausência de automação não é, por si só, uma falha.

## Fluxo atual das entregas 1 a 3

`CharacterSheet` / `MobileCharacterSheet` fornecem PE normais, temporários, contexto de turno e callback. Os modais calculam a seleção e sorteiam uma vez. `useConfirmedDiceRoll` conserva a intenção nas falhas de conexão. `combat-attack-service` envia uma única operação a `confirm_character_combat_attack`, que valida classe, NEX, arma equipada, custo e orçamento, consome temporários primeiro e grava saldo, histórico e gasto na mesma transação. Recusa explícita permite corrigir a seleção; resposta incerta mantém UUID e sorteio.

Cobertura desta integração: Ataque Especial, técnicas do Aniquilador, Ataque Furtivo e Disparo Letal. Outros poderes pagos, requisitos circunstanciais, frequência de uso, ações, reações, munição e dano aplicado ao alvo ainda exigem os próximos incrementos. A entrega 2 permanece parcial para o conjunto completo de habilidades. Detalhes: `COMBATE_ORCAMENTO_SERVIDOR.md`.
