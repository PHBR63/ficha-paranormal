# Médico de Campo — critérios deste lote

Fonte: **Ordem Paranormal RPG, Livro Base v1.3, p. 31**. Para Machucado e Morrendo, consultar também a p. 88. Este lote não altera a regra personalizada de 20 natural.

## Equipe de Trauma

- Médico de Campo NEX 40%+, treinado em Medicina e com kit de Medicina; Versatilidade não concede esta habilidade.
- O jogador declara uma ação padrão e que o **aliado** está adjacente. A própria ficha e um alvo apenas narrativo não são elegíveis para uma aplicação automática.
- Custa 2 PE. O servidor só oferece condições negativas conhecidas do Livro Base. Morrendo, estados derivados de PV/SAN e condições personalizadas ficam para revisão da mesa; Inconsciente pode ser removida se o aliado ainda tiver PV acima de zero. Uma ocorrência é removida, 2 PE são debitados e recibos são gravados nas duas fichas na mesma transação.
- Uma condição alterada, alvo desvinculado, turno mudado, saldo insuficiente ou chave reutilizada com outro pedido não pode produzir sucesso parcial. Repetir a mesma chave devolve o mesmo recibo.
- Aceite: testar aliado em campanha v1 e v2, falhas acima, dois envios simultâneos, recuperação após perda de resposta e histórico após reconexão. Fora do próprio turno, uma declaração de ação preparada sem recibo do servidor deve ser rejeitada sem cobrança.

## Resgate

- Médico de Campo NEX 65%+, Medicina treinada e kit. Movimento livre uma vez por rodada até aliado machucado ou morrendo em alcance curto, se o deslocamento normal permitir. A mesa declara alcance e caminho; o servidor confere vínculo, condição e uso no turno ativo. A chave de uso em combate contém campanha, cena e rodada, sem o combatente ativo; outro turno na mesma rodada não libera novo uso.
- Cura **efetiva de PV do aliado** ou remoção confirmada de condição dele concede +5 Defesa ao médico e ao aliado até o início do próximo turno do médico. Cura própria não ativa o bônus; concessões simultâneas não somam +10.
- O bônus é lido do servidor nas duas fichas. Em combate, expira quando começa o próximo turno do médico, inclusive se receber outro turno na mesma rodada. No controle manual, pausar não encerra o bônus; ele expira quando o contador do médico avança. Sem controle de turnos, a mesa aplica e encerra a Defesa manualmente; nenhum turno artificial é criado. O Livro Base, p. 84–85, diz que ação livre só pode ocorrer no próprio turno; a frequência especial de Resgate é **uma vez por rodada**, inclusive se houver mais de um turno na rodada. Sem contador de rodada no modo manual, a mesa declara que ainda não houve uso naquela rodada.
- Ao carregar uma pessoa, o médico conta metade dos espaços ocupados. O sistema não mantém inventário de pessoas carregadas; a interface explica essa conta, sem alegar cálculo automático.
- Neste lote, o gatilho automático de +5 Defesa cobre a cura efetiva de **Paramédico** e a remoção de condição por **Equipe de Trauma**. Outras fontes de cura ou remoção ainda precisam de registro manual da mesa para conceder Resgate; não apresentá-las como integradas até haver um recibo de origem confiável.
- Aceite: movimento único por rodada controlada, alvo fora das condições, troca/encerramento de cena, defesa nas duas fichas e remoção ao turno seguinte, recarga/reconexão, v1/v2 quando aplicável.

## Preparar ação — integração pendente, sem aplicação automática

- Livro Base v1.3, p. 86: Preparar usa uma ação padrão para declarar uma ação padrão, de movimento ou livre e seu gatilho. A execução ocorre como reação ao gatilho, depois do próprio turno e antes do próximo; a iniciativa muda para imediatamente acima daquela em que a ação foi feita. Na p. 31, Resgate é livre e limitado a uma vez por rodada; Equipe de Trauma é padrão e custa 2 PE.
- O tracker compartilhado da campanha ainda não grava preparação, gatilho, consumo da ação padrão ou a nova posição na iniciativa. O painel antigo de combate mantém preparação só no estado do navegador e não prova nada ao servidor da ficha. Aceitar uma declaração de preparação no pedido de Equipe de Trauma ou Resgate permitiria execução sem ação reservada e histórico falso.
- Critério para automatizar: preparação com recibo no servidor no turno do médico, ação e gatilho declarados; execução única após gatilho confirmado e antes do próximo turno; cobrança de Equipe e remoção da condição na mesma transação, respeitando o momento de gasto definido pela mesa; Resgate não cobra PE e usa a franquia da rodada da execução, inclusive se o gatilho ocorrer no turno de outro combatente; iniciativa é atualizada atomicamente e sincronizada. Preparação não executada expira, e reenvio não duplica efeito nem gasto.
- **Regra ainda a decidir:** a p. 86 não explicita se os 2 PE de uma Equipe de Trauma preparada são debitados ao declarar a preparação ou ao executar a reação após o gatilho. A implementação não deve escolher esse momento por inferência, sobretudo porque o limite de PE depende do turno em que o gasto é registrado.
- Testes necessários: preparar no turno próprio, executar fora dele, rejeitar gatilho não confirmado, expirar no próximo turno, bloquear segundo Resgate na rodada mesmo com ator diferente, recuperar recibo após reconexão e conferir a nova iniciativa nas duas contas. Enquanto o tracker não fornecer esses fatos, o servidor e a interface **bloqueiam** execução fora do turno e orientam resolução manual pela mesa.

## Reanimação — próximo bloco

- NEX 99%, ação completa, 10 PE, uma vez por cena; alvo morto na **mesma cena**, exceto morte por dano massivo.
- Antes de cobrar, o servidor precisa de um registro confiável da morte, sua causa, cena e confirmação do mestre. A mesma operação deve proteger uso único, saldo, limite de PE e histórico nas duas fichas.
- **Decisão específica pendente:** a p. 31 não define quantos PV o personagem recupera ao voltar à vida. Não atribuir automaticamente 1 PV, PV máximos ou outro valor. O mestre deverá definir o estado de PV e condições antes de automatizar a aplicação numérica.
