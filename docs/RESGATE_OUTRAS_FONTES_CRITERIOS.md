# Resgate — outras curas e remoções de condição

Fonte: Ordem Paranormal RPG, Livro Base v1.3, p. 31. Ao curar PV ou remover uma condição de um aliado, o Médico de Campo com Resgate concede +5 na Defesa a ambos até o início de seu próximo turno.

## Critérios de aceitação

- Paramédico e Equipe de Trauma conservam o gatilho automático já confirmado pelo servidor. Este lote cobre **outros efeitos já aplicados e registrados** na ficha do aliado; não aplica cura ou remove condições novamente.
- Em combate v2, no turno do médico, o servidor identifica registros confirmados que efetivamente elevaram PV ou removeram ao menos uma condição. Um registro de seleção, tentativa, cura sem PV efetivo, gasto de PE ou simples mudança de metadados não é elegível.
- O mestre vinculado confirma que o médico causou aquele efeito. A confirmação ocorre antes de avançar o turno; o servidor confere campanha, alvo, trilha, NEX, Medicina, kit, turno, registro de origem e autoria do mestre. Não há gasto adicional de PE.
- Se o efeito foi aplicado por uma conjuração com recibo de origem, essa conjuração deve pertencer ao médico; a confirmação do mestre não altera a autoria registrada.
- Uma origem concede o bônus no máximo uma vez. O servidor grava recibos nas duas fichas e a concessão de Defesa na mesma transação. Repetir a mesma operação recupera o recibo; operação diferente para a mesma origem é rejeitada.
- A Defesa é lida do servidor e expira com a mesma regra já existente de Resgate. Recarregar, reconectar ou abrir a ficha do aliado não cria um segundo bônus.
- Eventos antigos sem contexto de turno comprovado, campanhas v1, controle manual, combate sem médico no turno, ou confirmação tardia continuam manuais. O sistema não reconstrói autoria por horário aproximado.
- Ação preparada de Resgate permanece bloqueada: o tracker ainda não registra consumo da ação padrão, gatilho e reordenação de iniciativa em uma transação. Não liberar o uso fora do turno por esta entrega.

## Testes necessários

Verificar cura de PV, remoção de condição, cura sem ganho efetivo, mera edição sem efeito, alvo fora da campanha, jogador sem permissão de mestre, mudança de turno, repetição com mesma chave e com outra chave, históricos de ambas as fichas, bônus nas duas fichas e expiração ao próximo turno do médico. Conferir banco e interface publicada com fichas de QA isoladas.
