# Mira de Elite: uma contribuição de Intelecto por arma elegível

## 1. Resumo
Os modais somavam dano de Mira de Elite pelo resumo SUE e pelo adapter de trilha. Além disso, o resumo geral da ficha podia conceder esse bônus a uma pistola. O cálculo e o detalhamento agora recebem o contexto da arma selecionada.

## 2. Arquivos e responsabilidades
- `src/lib/unified-effects-engine.ts`: conserva o ID do efeito nas parcelas de dano à distância. Informação opcional; mantém consumidores anteriores compatíveis.
- `src/lib/effects/weapon-damage-effects.ts`: recebe resumo e arma; retorna o resumo apropriado sem mutar o original, retirando somente Mira de Elite de armas inelegíveis.
- `src/lib/effects/track-effects-adapter.ts`: recebe contexto opcional dos modais e IDs já representados no dano; não soma novamente esses efeitos. Chamadas anteriores sem contexto continuam compatíveis.
- `CombatRollModal.tsx` e `mobile/MobileCombatRollModal.tsx`: passam arma e IDs para os dois cálculos. Usam os mesmos dados ajustados na explicação e no resultado enviado ao histórico.
- `combat-attack-confirmation.test.tsx`: oito cenários de dano real nos dois modais, com/sem resumo e munição longa/curta.
- `weapon-damage-effects.test.ts`: preservação de origem, imutabilidade, soma única e recusa de arma inelegível.

## 3. Fluxo
Ficha → resumo SUE com identificação das parcelas → filtro para arma selecionada → adapter só acrescenta dano não representado → modal exibe fontes → rolagem envia dano ao histórico existente.

Recebe classe/trilha/NEX/atributos, arma com tipo e munição, efeitos consolidados e ativações. Retorna parcelas de dano contextualizadas. Não altera banco, recursos, seleção de Disparo Letal ou economia de ações.

## 4. Patch
O dano de Mira de Elite tem ID `track-mira-elite` (ou `versatility-mira-elite`). O resumo o conserva, e o adapter evita a segunda contribuição. Apenas tipo `Disparo` com `balas_longas` comprova elegibilidade. A versão de Versatilidade também é removida de armas inelegíveis.

Exemplo: Intelecto 3 + Militar 2 em fuzil resulta em bônus 5, sem outro Intelecto 3. Uma pistola conserva Militar 2, sem receber Intelecto de Mira.

## 5. Limites
Sem migration, dependências novas, conversão de fichas ou reescrita de históricos. Parcelas antigas do histórico permanecem como foram roladas. Armas sem munição cadastrada não recebem Mira automaticamente; conferir cadastro da arma. Não certifica soma única de todos os efeitos de trilha, dados extras ou crítico. Requisito mirar/duração de Disparo ainda precisa de contexto persistido.

## 6. Como testar
Confirmar ataque e rolar dano com fuzil/pistola em desktop/mobile; verificar fontes, valor fixo e histórico salvo após recarga. Com resumo ausente, fallback deve conceder Intelecto somente ao fuzil. Intelecto 3 em teste isolado: bônus 3 ou 0, respectivamente. Com Militar: 5 ou 2. Não confundir valor fixo com a soma aleatória dos dados da arma.
