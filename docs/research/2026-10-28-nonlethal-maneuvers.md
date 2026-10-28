# Livro Base v1.3 — dano não letal e manobras de combate

## Escopo e fonte

Esta conferência usa exclusivamente o **Livro Base de Ordem Paranormal RPG v1.3** fornecido no workspace. As páginas abaixo são as páginas impressas do livro; entre parênteses consta a página do arquivo PDF.

- Ações padrão e manobras: p. 85–86 (PDF 95–96).
- Dano não letal: p. 88 (PDF 98).
- Quebrando objetos: p. 90 (PDF 100).
- Categorias de tamanho: p. 179 (PDF 189).
- Condições: p. 310–311 (PDF 320–321).

## Regras oficiais consolidadas

### Dano não letal

1. O dano não letal é registrado separadamente do dano letal.
2. Para decidir quando o personagem fica **inconsciente**, somam-se dano letal e não letal.
3. Para decidir quando o personagem fica **morrendo**, considera-se apenas o dano letal.
4. Uma cura remove primeiro o dano não letal; somente o restante recupera o dano letal/PV.
5. O padrão de qualquer dano é letal.
6. Uma arma corpo a corpo pode causar dano não letal se isso for declarado, com **–5 no teste de ataque**.
7. Ataques desarmados e armas que já causam dano não letal podem causar dano letal mediante declaração, também com **–5 no teste de ataque**.
8. O livro não autoriza converter ataques à distância comuns em dano não letal por essa regra.

O texto de dano massivo não esclarece expressamente se uma única fonte de dano não letal pode disparar seu teste. Isso deve permanecer como adjudicação da mesa até haver decisão explícita; não convém inferir automaticamente.

### Regra comum das manobras

1. Uma manobra substitui um ataque corpo a corpo e faz algo diferente de causar dano.
2. Ataques à distância não realizam manobras, salvo habilidade específica, como **Disparo Impactante**.
3. Atacante e alvo fazem testes opostos de ataque corpo a corpo. O alvo usa seu bônus de **Luta**, mesmo que esteja com arma à distância.
4. Empate exige uma nova disputa; empate não produz efeito.
5. Em geral, qualquer arma corpo a corpo pode ser usada, exceto quando a própria manobra restringe o meio.
6. O teste recebe o modificador de tamanho do ser: Minúsculo –5, Pequeno –2, Médio 0, Grande +2, Enorme +5 e Colossal +10 (p. 179).

### Agarrar

- Só pode ser iniciada com ataque desarmado e ocupa uma mão do atacante.
- No sucesso, o alvo fica **agarrado**: desprevenido e imóvel, sofre uma penalidade de um dado em ataques e só pode atacar com armas leves.
- O alvo pode se soltar usando uma ação padrão e vencendo novo teste oposto de manobra.
- Enquanto mantém o alvo, o atacante se move com metade do deslocamento e o arrasta.
- O atacante pode soltar o alvo como ação livre.
- Com a mão livre, pode atacar o alvo agarrado.
- Em vez de atacar, pode vencer novo teste de manobra para causar dano de impacto igual a um ataque desarmado, representando esmagar ou sufocar.
- Ataque à distância contra alguém envolvido na manobra tem 50% de chance de acertar o alvo errado.
- O vínculo termina quando o alvo escapa, o atacante solta ou a situação deixa de permitir a manutenção; não deve depender apenas da duração genérica de condições.

### Derrubar

- No sucesso, o alvo fica **caído**; a queda normalmente não causa dano.
- Se a margem de vitória for 5 ou mais, além de cair o alvo é empurrado 1,5 m em direção escolhida pelo atacante.
- Se esse deslocamento o lançar de parapeito ou precipício, o alvo pode fazer Reflexos DT 20 para agarrar a beirada.
- Caído reduz o deslocamento a 1,5 m, impõe penalidade de dois dados em ataques, –5 na Defesa contra ataques corpo a corpo e +5 contra ataques à distância.
- Levantar-se exige uma ação de movimento.

### Desarmar

- No sucesso, o alvo deixa cair um item que segura, normalmente no próprio espaço.
- Se a margem de vitória for 5 ou mais, o item também é deslocado 1,5 m em direção escolhida pelo atacante.
- A mesa precisa escolher qual item empunhado é o alvo da manobra antes da rolagem.

### Empurrar

- No sucesso, o alvo é deslocado 1,5 m.
- Para cada 5 pontos de diferença entre os testes, é deslocado mais 1,5 m.
- O atacante pode gastar uma ação de movimento para avançar junto, limitado ao próprio deslocamento.
- Direção, espaço válido e riscos do terreno continuam dependendo do mapa/mesa.

### Quebrar

- Tem como alvo um item que o oponente esteja segurando.
- A disputa determina se o golpe alcança o item; no sucesso, aplicam-se as regras de quebrar objetos.
- O ataque causa dano normal ao objeto, descontando a RD do material; em 0 PV o objeto fica quebrado e inutilizável até ser consertado.
- Para itens soltos não há disputa: usa-se a Defesa do objeto por tamanho, com +5 se estiver em movimento (p. 90).
- A automação exige identificar o item, seus PV, RD e material. Sem esses dados, a resolução deve continuar confirmada pelo mestre.

### Atropelar

- É uma ação padrão realizada durante o movimento para atravessar o espaço de outro ser.
- O alvo pode dar passagem, sem teste, ou resistir.
- Se resistir, há teste oposto de manobra: o atacante vence, deixa o alvo caído e continua; o alvo vence, permanece de pé e bloqueia o avanço.
- Durante uma investida, atropelar é ação livre, mas não se pode atropelar e atacar o mesmo alvo.

## Estado encontrado no Ordem Roll

### Cobertura existente

- A página de regras já classifica dano não letal como **manual** e as manobras como **parciais** em `src/lib/rules/base-rule-coverage.ts`.
- O fluxo v2 já declara atacante, alvo e arma antes do dado e grava ataque, defesa e dano no servidor.
- A resolução de alvo já é idempotente, exige mestre, confere cena/rodada/PV e registra recibos para atacante e alvo.
- Há interfaces especializadas para **Força Opressora** (derrubar/empurrar) e **Disparo Impactante** (derrubar/desarmar/empurrar/quebrar).
- O catálogo de condições já conhece agarrado, caído, desprevenido e imóvel.

### Lacunas confirmadas

- `characters` só possui `hp_current`/`hp_max`; não existe reserva persistente de dano não letal.
- A cura atual não tem como remover dano não letal antes do dano letal.
- A seleção enviada por `combat-attack-service.ts` não registra intenção letal/não letal nem a penalidade de –5.
- `AttackIntentGate.tsx` não diferencia ataque causador de dano de manobra e não registra o tipo da manobra antes do dado.
- `AttackTargetResolutionPanel.tsx` e a RPC de resolução só aceitam Defesa e dano; não executam disputa de Luta, desempate, modificador de tamanho nem efeito de manobra.
- As telas de Força Opressora e Disparo Impactante apresentam escolhas e efeitos, mas não comprovam no servidor o teste oposto, o alvo, a margem ou a aplicação das condições/deslocamentos.
- O modelo de condições não representa a relação agarrador–agarrado, a mão ocupada, a fuga, o arrasto ou a chance de atingir o alvo errado.
- O inventário não fornece de modo uniforme PV/RD por instância de item, requisito para quebrar itens de forma autoritativa.

## Critérios verificáveis para implementação

### Entrega A — dano não letal

1. O ataque exige declaração prévia de letalidade; o servidor rejeita conversão inválida.
2. A penalidade –5 é aplicada exatamente uma vez e aparece no detalhamento desktop/mobile e no histórico.
3. O servidor persiste uma reserva não negativa de dano não letal por ficha.
4. Dano não letal não reduz, sozinho, os PV letais nem aplica Morrendo; ao alcançar o limiar combinado, aplica Inconsciente.
5. Dano letal posterior usa o limiar combinado para Inconsciente e apenas o componente letal para Morrendo.
6. Cura confirmada remove primeiro a reserva não letal e só então aumenta PV, com recibo contendo valores antes/depois.
7. Reenvio idempotente não duplica dano, cura, condições ou histórico.
8. Campanha v1 continua explicitamente manual; v2 permanece sincronizada.

### Entrega B — núcleo de manobras

1. O jogador escolhe tipo, alvo, arma/meio e item-alvo quando aplicável antes da rolagem.
2. O servidor valida corpo a corpo, exceções de habilidade, ação disponível, alvo vinculado e modificador de tamanho.
3. Atacante e defensor têm resultados confirmados no servidor; empate gera pendência de nova disputa, sem efeito.
4. O mestre confirma somente os dados situacionais que o sistema não possui (direção, borda, espaço, item/material).
5. Cada manobra produz recibo idempotente para ambos os participantes e histórico compreensível.
6. Agarrar cria vínculo persistente e só encerra por fuga, soltura ou confirmação válida; fuga consome ação padrão.
7. Derrubar aplica caído e trata a margem de 5; levantar consome movimento.
8. Desarmar exige item selecionado e registra queda/deslocamento.
9. Empurrar calcula 1,5 m + 1,5 m por cada 5 de margem e registra se o atacante avançou junto.
10. Quebrar só automatiza dano quando a instância do item tiver PV/RD; caso contrário cria resolução pendente para o mestre.
11. Atropelar distingue passagem, resistência e uso durante investida, impedindo atacar o mesmo alvo.
12. Desktop e mobile mostram requisito, custo de ação, cálculo, estado pendente, resultado e como encerrar o efeito.

## Ordem de implementação recomendada

1. Persistência e cura de dano não letal.
2. Declaração e penalidade de ataque não letal em desktop/mobile.
3. Contrato genérico de disputa de manobra e recibos.
4. Derrubar e empurrar, por exigirem menos estado relacional.
5. Agarrar e fuga, por exigirem vínculo persistente.
6. Desarmar e quebrar, após contrato de item por instância.
7. Atropelar, integrado ao movimento/investida do combate v2.

Essa sequência evita adaptar seis fluxos diferentes antes de existir um núcleo de disputa, idempotência e efeitos compartilhado.
