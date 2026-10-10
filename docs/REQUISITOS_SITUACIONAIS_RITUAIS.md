# Grimório e Amaldiçoar Arma — critérios do lote

Referência: Livro Base v1.3, página impressa 35. Escopo: requisitos e custo da conjuração, confirmação no servidor, apresentação e histórico; não inclui um motor geral de disponibilidade de ações.

## Critérios de aceitação definidos antes da automação

| ID | Cenário | Resultado obrigatório |
| --- | --- | --- |
| G01 | Ritual aprendido apenas pelo Grimório Ritualístico | Identificar sua fonte pelos registros da criação; não tratar todos os rituais do Graduado como rituais do grimório. |
| G02 | Grimório ausente do inventário | Bloquear a conjuração pela fonte grimório, sem consumir PE/SAN. Não confundir Grimório Vivo com Grimório Ritualístico. |
| G03 | Grimório presente | Exigir confirmação específica de empunhar o item e de ter gasto a ação completa folheando-o para esta conjuração. |
| G04 | Preparação do grimório confirmada | Manter a execução própria do ritual: a ação completa de consulta é anterior e não substitui sua execução. Não cobrar PE pela consulta. |
| G05 | Mudança de ritual, ficha ou nova abertura do modal | Não reaproveitar as confirmações situacionais de outra conjuração. |
| G06 | Fonte histórica ausente | Expor a lacuna; não inferir silenciosamente que o ritual é memorizado. Registrar a resolução antes de habilitar a automação. |
| A01 | Amaldiçoar Arma sem Lâmina Maldita | Preservar execução padrão; não oferecer redução para movimento. |
| A02 | Lâmina Maldita, mas ritual aprendido pela própria habilidade | Não conceder redução de ação automaticamente. |
| A03 | Conhecimento anterior à Lâmina Maldita confirmado | Oferecer opção explícita de gastar +1 PE para execução de movimento; desmarcada por padrão. |
| A04 | Opção de movimento selecionada | Somar +1 PE ao custo final, sem cobrar duas vezes nem tratar como custo mínimo do ritual. Validar saldo normal/temporário e limite do turno. |
| A05 | Pedido adulterado ou requisito ausente | Servidor rejeita sem consumo de PE/SAN ou criação de evento parcial. |
| H01 | Conjuração confirmada | Histórico conserva fonte, preparação declarada, execução final, adicional de Lâmina Maldita e custo total confirmado. |
| H02 | Repetição após resposta perdida | Mesma operação devolve o recibo; não repete PE, SAN, preparação ou benefícios. |
| H03 | Confirmação falha ou concentração falha | Falha de requisitos não cobra recursos; falha de concentração mantém o comportamento já aprovado de consumir PE e bloquear efeitos. |
| V01 | Desktop e celular | Mesmo contrato, rótulos claros, alvos de toque adequados, requisitos visíveis e nenhuma mensagem de sucesso antes do servidor. |

O sistema registra a declaração das ações narrativas e exige os requisitos verificáveis. Não inventa turnos, ações extras ou disponibilidade de mãos. O controle geral de ações permanece explicitamente manual; este lote não o declara automatizado.

## Confirmação de informações históricas

Decisão confirmada pelo usuário: **o mestre confirma uma vez; o servidor libera o benefício**. Somente o mestre de uma campanha v1 ou v2 legitimamente vinculada à ficha pode registrar a conferência. O jogador não se autoaprova. Cada ritual tem seu registro; conferir uma versão elemental não libera todas as outras. Uma revisão posterior conserva os eventos anteriores, registra a justificativa e substitui o estado vigente.

Para a fonte, registros preservados e verificáveis da criação distinguem o grimório dos rituais memorizados. Fontes históricas ausentes exigem conferência explícita. O NEX atual, a ordem da lista de rituais e a presença isolada de Lâmina Maldita não provam conhecimento anterior.

## Arquivos e responsabilidades

| Arquivo | Papel e dependências |
| --- | --- |
| `src/lib/rituals/situational-requirements.ts` | Tipos do contexto e das declarações; validação da interface, execução e adicional de +1 PE. Usado pelos modais e pelo serviço. |
| `src/lib/rituals/casting-concentration.ts` | Transporta a declaração situacional junto do contexto de concentração já existente. Não substitui a resolução de Vontade. |
| `src/services/ritual-situational-service.ts` | Consulta contexto e registra conferência pela API. Valida identificação da ficha/ritual e recibo específico; usa o cliente de atividade. |
| `src/services/character-activity-service.ts` | Contratos das novas consultas e mensagens de erro sem expor detalhes internos. |
| `src/services/ritual-application-service.ts` | Exige marcador de resolução situacional no recibo antes de liberar o fluxo de efeitos. |
| `src/hooks/character/useRitualSituationalContext.ts` | Leitura por ficha/ritual, estado de aprovação, operação idempotente e proteção contra resposta tardia de outra ficha. |
| `src/hooks/character/useRitualConfirmation.ts` | Trava clique duplicado e congela a tentativa. A seleção de ficha/ritual impede iniciar efeitos em outra seleção após uma resposta atrasada. |
| `src/hooks/character/useCharacterActivity.ts` | Reconexão e alterações de histórico invalidam também a consulta situacional da ficha. |
| `src/components/character/RitualSituationalForm.tsx` | Formulário compartilhado: seleção do grimório, declarações e conferência histórica do mestre, com justificativa. |
| `src/components/character/RitualCastModal.tsx` | Preparação desktop; recebe contexto, calcula o custo e envia a declaração no último argumento de confirmação. |
| `src/components/character/mobile/MobileRitualCastModal.tsx` | Mesmo contrato no celular, com controles de toque e envio condicionado à confirmação. |
| `src/pages/CharacterSheet.tsx` | Liga a ficha desktop ao hook, modal e gravação atômica da conjuração. |
| `src/components/character/MobileCharacterSheet.tsx` | Liga os mesmos dados e serviços ao fluxo móvel. |
| `src/lib/character-activity-presentation.ts` | Traduz recibos: fonte, consulta declarada, execução, adicional incluído no total e conferência histórica. Recibos antigos continuam legíveis sem inventar dados. |
| `src/lib/rules/base-rule-coverage.ts` | Explica na página de regras a parte conferida e a disponibilidade de ações que continua manual. |
| `supabase/migrations/20261010040000_ritual_situational_requirements.sql` | Tabela privada de conferências, contexto autorizado, aprovação do mestre, proteção da proveniência e validação anterior ao débito de PE/SAN. |
| `supabase/tests/ritual_situational_requirements.sql` | Contratos do banco com usuários isolados, campanhas v1/v2, adulterações, orçamento e repetição; tudo revertido. |
| `supabase/tests/casting_concentration.sql` | Mantém os casos de concentração usando o contrato vigente do Custo do Paranormal. |
| `src/components/character/__tests__/RitualSituationalRules.test.tsx` | Exercita os modais reais desktop e mobile com fonte, item, consulta, movimento e conferência negativa. |
| `src/services/__tests__/ritual-situational-service.test.ts` | Rejeita resposta incompleta, ficha/ritual divergentes e ausência de confirmação do servidor. |
| `src/hooks/character/__tests__/useRitualSituationalContext.test.tsx` | Verifica recuperação da mesma conferência, falha de leitura posterior e isolamento entre fichas. |
| `src/lib/__tests__/character-activity-presentation.test.ts` | Confere apresentação de novos recibos e compatibilidade dos antigos. |

## Fluxo e dados

1. A ficha abre o ritual e consulta o servidor com `characterId` e `ritualId`. A API autoriza dono/mestre vinculado, resolve fonte, inventário, trilha/NEX e conferência histórica.
2. O modal recebe o contexto. O usuário seleciona o item e declara a preparação quando a fonte é grimório; a opção de movimento aparece somente com benefício confirmado.
3. A confirmação envia a declaração e o custo anterior ao adicional, junto do pedido já idempotente de conjuração, orçamento, concentração e Custo do Paranormal.
4. O servidor reconfere os requisitos atuais **antes** de consumir recursos. A cadeia anterior mantém débito normal/temporário, limite de turno, concentração e SAN na mesma transação.
5. O recibo salva fonte, execução final, adicional e preparação declarada. A interface exige confirmação antes de prosseguir para os efeitos; o histórico apresenta os valores salvos.
6. A aprovação do mestre usa operação própria: fonte, conhecimento anterior e justificativa de 10–500 caracteres. A tabela privada mantém o estado vigente e cada conferência gera um evento sem consumo de PE/SAN.

## Patch e impacto no banco

`character_ritual_knowledge` tem chave composta ficha/ritual, fonte, confirmação anterior, autor e evento da conferência. Ela referencia `characters` e `character_activity_events`; não permite leitura/escrita direta pelo cliente. As funções públicas validam os vínculos de campanhas v1/v2. A execução anterior de conjuração permanece privada para preservar hashes, recibos e repetição sem cobrança.

O gatilho protege `characters.creation_data` de inserção/alteração direta pelo cliente. A criação validada no servidor continua podendo gravar esse campo. Edição normal da ficha e alterações de inventário/recursos continuam compatíveis; conferências posteriores não reescrevem o formulário original. A migration não exclui nem reconstrói fichas antigas.

## Como testar

Executar a suíte dos modais, serviços, hooks e histórico; verificar tipos e build. No banco, executar a migration em transação de ensaio junto de `ritual_situational_requirements.sql`, revertendo inclusive as definições ao final. Repetir os contratos de orçamento, concentração, sustentação de arma e criação validada.

No publicado, usar fichas sintéticas: Graduado com rituais normais e de grimório; Lâmina com confirmação pendente e depois aprovada pelo mestre vinculado. Verificar bloqueio, custo, reabertura, histórico após recarregar e largura móvel. O resultado da publicação e as evidências reais de cada execução ficam no relatório da entrega; esta especificação não é uma declaração de aprovação em produção.
