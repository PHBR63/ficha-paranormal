# Estratégia do lote: dano não letal e manobras de combate

## Objetivo

Entregar, no combate v2 sincronizado, um fluxo único e recuperável para declarar dano não letal e resolver manobras de combate, sem alterar a regra personalizada do 20 natural e sem transformar o painel legado v1 em um segundo sistema servidor.

O lote só é publicável quando banco, serviços, desktop, mobile, histórico e reconexão representam a mesma operação. Um controle apenas visual, uma condição aplicada localmente ou uma rolagem sem recibo não atende ao objetivo.

## Fonte e limites

- Livro Base v1.3, p. 85: manobra substitui um ataque corpo a corpo, usa teste de ataque corpo a corpo oposto à Luta do alvo e repete o teste em caso de empate.
- Livro Base v1.3, p. 85: Agarrar, Derrubar, Desarmar, Empurrar e Quebrar e suas consequências.
- Livro Base v1.3, p. 88: dano não letal soma com o letal apenas para inconsciência; não causa Morrendo; cura remove dano não letal antes do letal; conversão entre letal e não letal com arma corpo a corpo ou ataque naturalmente não letal aplica -5.
- Campanhas v1 continuam explícita e integralmente manuais.
- Campanhas v2 usam servidor, recibos e sincronização em tempo real.
- O 20 natural continua seguindo a decisão da mesa: não garante sucesso se o total não vencer o resultado oposto ou a Defesa.
- Posição no mapa, beirada, alvo errado de disparo contra Agarrar e descrição física de um objeto continuam confirmações da mesa; o sistema deve exibir e registrar a pendência, não inventar geometria.

## Menor escopo completo e publicável

### 1. Núcleo de dano não letal

1. Persistir um contador separado de dano não letal por ficha, iniciado em zero para fichas existentes.
2. Declarar o modo `letal` ou `não letal` antes da rolagem. A escolha deve integrar a mesma intenção de ataque já usada no v2.
3. O servidor valida a arma e calcula a penalidade de -5 quando o atacante converte o modo natural do ataque. Ataques à distância comuns não podem ser convertidos para não letais por esse controle.
4. A resolução de dano consome PV temporários primeiro e grava o restante no contador correto, sem aplicar duas vezes redução, vulnerabilidade, imunidade ou RD.
5. O servidor determina inconsciência pela soma do dano letal e não letal. Morrendo só pode decorrer do dano letal.
6. Toda cura automática suportada pelo produto reduz primeiro o dano não letal e usa apenas o restante para recuperar dano letal. Reanimação permanece fluxo específico e não apaga dano não letal sem regra explícita.
7. Ficha, painel do mestre e histórico mostram: dano final, parcela temporária, parcela não letal, estado de inconsciência e eventual dano letal restante.

**Barreira de publicação:** não basta corrigir a cura do modal de ataque. Devem ser auditadas as rotas servidoras que curam ou definem PV: efeito genérico, edição do mestre, Paramédico, rituais/efeitos suportados, controles de campanha e Reanimação. Qualquer rota que possa deixar o contador incoerente bloqueia a publicação ou deve ficar explicitamente manual, sem alterar PV automaticamente.

### 2. Contrato servidor de manobra

1. A intenção informa atacante, alvo, manobra, arma/ataque desarmado, turno, cena e campanha.
2. O servidor exige combate v2 ativo, turno do atacante, ação padrão disponível, fichas na campanha e arma corpo a corpo equipada. Agarrar exige ataque desarmado.
3. Atacante e defensor rolam Luta pelo servidor, com os bônus e penalidades atuais das fichas. O alvo usa Luta mesmo que esteja com arma à distância.
4. Empate não produz vencedor nem efeito: cria uma nova rodada oposta vinculada à mesma intenção, sem cobrar outra ação padrão.
5. A confirmação final consome uma única ação padrão e gera recibo único para as duas fichas. Reenvio idêntico retorna o recibo; UUID reutilizado com payload diferente falha.
6. Resultado, margens, efeitos e revisões do mestre ficam visíveis após reconexão e em tempo real.

### 3. Efeitos por manobra

| Manobra | Automação exigida neste lote | Confirmação que permanece com a mesa |
| --- | --- | --- |
| Agarrar | Aplicar vínculo atacante-alvo e condição Agarrado; mostrar Desprevenido, Imóvel, -1d20 em ataques, armas leves, mão ocupada e deslocamento pela metade; oferecer Soltar (livre), Escapar (padrão e novo teste oposto) e Esmagar/Sufocar (substitui ataque e usa dano desarmado de impacto). Encerrar o vínculo ao soltar, escapar, invalidar a cena ou deixar de existir o participante. | Disponibilidade física da mão, arrastar no mapa e 50% de atingir o alvo errado em disparo externo. |
| Derrubar | Aplicar Caído ao vencer. Se a margem for pelo menos 5, registrar também deslocamento pendente de 1,5 m. | Direção, beirada e eventual Reflexos DT 20. |
| Desarmar | Exigir item empunhado/equipado escolhido e, ao vencer, desequipá-lo na mesma transação. Com margem de pelo menos 5, registrar deslocamento pendente de 1,5 m do item. | Posição final do item e situações especiais como voo/ponte. |
| Empurrar | Calcular e registrar `1,5 m + 1,5 m por cada 5 pontos completos de margem`; oferecer ao atacante acompanhar usando ação de movimento, limitado ao seu deslocamento disponível. | Aplicar a nova posição no mapa e validar obstáculos. |
| Quebrar | Exigir item empunhado escolhido; registrar acerto da manobra e abrir resolução de dano de objeto com RD/PV declarados e recibo próprio. Nunca reduzir PV da ficha. | RD/PV/material quando o catálogo não possuir dados e consequências narrativas da quebra. |

Atropelar, Algemas, Força Opressora e Disparo Impactante devem consumir o mesmo contrato em lotes próprios de integração. Eles não podem continuar simulando sucesso local depois que o contrato base existir, mas não precisam ganhar automação especial para este lote ser publicado.

## Matriz de situação após o lote

| Regra | Situação-alvo | Motivo |
| --- | --- | --- |
| Dano não letal em ataque v2 suportado | Automática | Declaração, penalidade, aplicação, condição, cura e recibo confirmados pelo servidor. |
| Cura das fontes já automatizadas | Automática | Todas respeitam a prioridade não letal antes da letal. |
| Dano não letal em campanha v1 | Manual | Decisão já aprovada: v1 não ganha persistência de combate. |
| Teste oposto e empate de manobra v2 | Automática | Dados e repetição vivem no servidor e não duplicam ação/histórico. |
| Agarrar, Derrubar, Desarmar e Empurrar | Automática com confirmação espacial | Efeito mecânico e recibo automáticos; geometria continua com a mesa. |
| Quebrar | Parcial controlada | O sistema garante alvo e fluxo; RD/PV do objeto podem exigir declaração do mestre. |
| Atropelar e usos de poderes/trilhas | Manual/Parcial | Integrações posteriores, explicitamente indicadas na página de regras. |

## Critérios de aceitação

### Regra e cálculo

- Ataque corpo a corpo letal marcado como não letal recebe exatamente -5; o histórico mostra a origem da penalidade.
- Ataque desarmado padrão é não letal; torná-lo letal aplica -5, salvo efeito que o torne letal (por exemplo, Soqueira/Artista Marcial conforme dados da ficha).
- Arma à distância comum não oferece conversão para não letal.
- Dano não letal suficiente deixa Inconsciente, mas nunca adiciona Morrendo sozinho.
- Dano letal que zera PV continua adicionando Inconsciente e Morrendo pelo fluxo atual.
- Cura de valor menor ou igual ao dano não letal reduz somente esse contador. Cura excedente reduz o contador a zero e aplica o restante ao dano letal.
- Dano massivo considera o dano sofrido da instância conforme o Livro Base, mas a falha não pode transformar dano exclusivamente não letal em Morrendo sem uma regra específica; o comportamento deve ter teste explícito.
- Empate em manobra exige nova rolagem e não consome outra ação.
- Margens de 4 e 5 cobrem o limite de Derrubar/Desarmar; Empurrar cobre margens 0, 4, 5, 9 e 10.

### Banco, permissão e idempotência

- Jogador só declara ação da própria ficha vinculada e no próprio turno.
- Mestre confirma pendências espaciais/objetos e pode revisar resultados, sem rolar em nome do jogador de forma silenciosa.
- Ficha fora da campanha, alvo igual ao atacante quando inválido, arma não equipada, item não empunhado, cena/turno antigo e ação indisponível falham sem alterar estado.
- Repetição simultânea da mesma operação gera um recibo e uma alteração; payload divergente com o mesmo ID falha.
- Avançar turno/cena expira intenção pendente, mas preserva histórico e não remove efeito já confirmado sem regra de encerramento.
- Políticas de leitura permitem somente membros e mestre da campanha; RPCs de escrita não ficam expostas a `anon`.
- Migração adiciona apenas dados compatíveis, com `DEFAULT 0`, restrição não negativa e nenhum recálculo inventado de fichas antigas.

### Interface desktop e mobile

- Antes da rolagem, ambos mostram modo de dano/manobra, penalidade, ação consumida e consequência esperada.
- Opções impossíveis ficam indisponíveis com motivo legível, não apenas ocultas.
- Depois da rolagem, ambos mostram os dois totais, vencedor, margem, efeito automático e qualquer passo que depende do mestre.
- Botão de confirmação bloqueia duplo clique e exibe erro do servidor sem mensagem de sucesso falsa.
- A ficha mostra dano não letal próximo aos PV e explica por tooltip que ele conta para Inconsciente, mas não para Morrendo.
- Controles cabem em 320 px, têm rótulos acessíveis, foco de teclado e contraste equivalente ao restante da ficha.

### Histórico, tempo real e reconexão

- Histórico do atacante e do alvo referencia o mesmo recibo e não mistura fichas.
- Reabrir a ficha durante intenção, empate, pendência espacial ou efeito Agarrado recupera o estado correto.
- Duas sessões autenticadas veem declaração, resultado, condição, item desequipado e dano não letal sem recarregar manualmente.
- Perda temporária de conexão não autoriza repetir custo, ação, rolagem ou efeito; o cliente consulta o recibo antes de oferecer nova tentativa.

### Regressão obrigatória

- Ataque letal comum, crítico e dano adicional permanecem iguais.
- Regra personalizada do 20 natural continua exigindo resultado vencedor.
- Bloqueio, Esquiva, Contra-ataque, vulnerabilidade, RD, imunidade, PV temporários e dano massivo mantêm seus testes.
- Condições personalizadas permanecem preservadas ao adicionar/remover Agarrado, Caído, Inconsciente ou Morrendo.
- Cura de Paramédico, Reanimação e edição de recurso não duplicam histórico nem apagam dano não letal indevidamente.
- Campanha v1 não cria tabelas/intenções v2 nem promete sincronização.

## Plano de testes

1. **Unidade (RED antes de GREEN):** modo natural do ataque, penalidade -5, cálculo combinado de inconsciência, prioridade de cura, margem e efeitos por manobra.
2. **SQL transacional:** permissões, turno, empate, idempotência, dano/cura, condição, item, expiração e rollback integral.
3. **Serviços:** payloads tipados, tradução de erros, recuperação de recibo e assinatura em tempo real.
4. **Componentes:** desktop e mobile nos estados inicial, bloqueado, pendente, empate, confirmado e erro.
5. **Regressão completa:** testes, tipos, build e lint dos arquivos tocados.
6. **Publicado:** mestre e jogador em contas diferentes, desktop amplo e mobile; rolar ao menos um dano não letal e uma manobra; reconectar antes e depois da confirmação; conferir histórico e `/rules`.

## Sequência recomendada

1. Criar o modelo de dano não letal e testes de cura/condições.
2. Integrar declaração e resolução do dano ao ataque v2.
3. Criar o contrato de intenção/teste/recibo de manobra.
4. Implementar os cinco efeitos, começando por Derrubar e Empurrar, depois Agarrar, Desarmar e Quebrar.
5. Integrar desktop/mobile e página de regras.
6. Rodar regressão, aplicar migration, publicar e executar UAT com duas contas.

## Critério de encerramento do lote

O lote está concluído somente quando código, migration, testes e site publicado passam. Se Quebrar depender de RD/PV não cadastrados, a interface deve registrar a pendência e a confirmação do mestre; não pode alegar quebra automática. Qualquer falha em cura prioritária, idempotência, permissão, reconexão ou distinção entre Inconsciente e Morrendo mantém o lote como parcial.
