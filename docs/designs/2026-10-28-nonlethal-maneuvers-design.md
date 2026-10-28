# Design: dano não letal e manobras de combate no v2

## Objetivo

Completar o próximo lote do núcleo de combate com duas unidades coerentes com o Livro Base v1.3:

1. registrar dano não letal separado do dano letal, aplicar inconsciência sem criar `Morrendo` e consumir esse dano antes de recuperar PV;
2. registrar e resolver manobras por teste oposto de Luta no combate v2, com ação, autorização, recibos e efeitos rastreáveis.

Campanhas v1 continuam explicitamente manuais. A política da mesa para 20 natural permanece: o resultado natural não vence por si só; os totais ainda são comparados.

## Fonte de regra e invariantes

- Livro Base v1.3, p. 85: uma manobra substitui um ataque corpo a corpo; atacante e alvo fazem testes opostos de ataque corpo a corpo/Luta; empate exige nova disputa; manobras à distância não são permitidas.
- Livro Base v1.3, pp. 85–86: Agarrar, Derrubar, Desarmar, Empurrar, Quebrar e Atropelar têm consequências distintas. Este lote cobre as cinco manobras listadas sob “Manobra de Combate”; Atropelar deve ficar em unidade própria porque ocorre durante movimento/investida.
- Livro Base v1.3, p. 88: dano não letal soma com o letal apenas para determinar inconsciência, não para determinar `Morrendo`; uma cura remove dano não letal antes de recuperar PV; converter dano de arma corpo a corpo entre letal e não letal aplica −5.
- O servidor é a fonte de verdade para ação gasta, sorteios, estado das fichas, condições e histórico.
- Geometria, adjacência, direção do empurrão, beiradas e posição de objetos continuam declarações do mestre enquanto o mapa não fornecer uma fonte verificável.
- Nenhuma operação reutiliza um UUID com outro payload. Falha de rede conserva o pedido original para recuperação idempotente.

## Estado atual reutilizável

- `campaign_combat_state_v2` fornece cena, rodada, ator e `turn_instance_id` sincronizados.
- `character_combat_actions` unifica ações padrão, movimento, completa e reação; hoje aceita fontes `attack`, `ritual` e `mirar`.
- `character_activity_events` é o histórico por ficha e já suporta dois recibos correlacionados para atacante e alvo.
- `campaign_attack_intents_v2` e `campaign_attack_target_resolutions_v2` demonstram o padrão declaração → revisão do mestre → aplicação atômica.
- `consume_temporary_resource` já consome PV temporários antes do dano real.
- `reconcile_resource_conditions` é a base para `Machucado`, `Inconsciente` e `Morrendo`, mas ainda considera apenas PV e precisa de uma variante consciente de dano não letal.

## Proposta 1 — dano não letal

### Modelo

Adicionar a `characters`:

```sql
nonlethal_damage integer NOT NULL DEFAULT 0
  CHECK (nonlethal_damage >= 0 AND nonlethal_damage <= 1000000)
```

O backfill é não destrutivo: todas as fichas existentes recebem `0`. `hp_current` continua representando PV após dano letal. O limiar de inconsciência passa a ser:

```text
(hp_max - hp_current) + nonlethal_damage >= hp_max
```

Consequências:

- dano não letal não reduz `hp_current`;
- PV temporários absorvem o dano primeiro; apenas o restante aumenta `nonlethal_damage`;
- ao atingir o limiar, o servidor acrescenta `Inconsciente`, mas não `Morrendo`;
- cura reduz `nonlethal_damage` primeiro e só o excedente aumenta `hp_current`;
- ao sair do limiar, o servidor remove somente a ocorrência de `Inconsciente` que estiver vinculada ao dano não letal; condições desconhecidas ou de outra origem são preservadas;
- dano não letal puro não cria pendência de dano massivo, pois a regra específica determina que ele não seja usado para determinar `Morrendo`. O recibo deve explicitar essa decisão.

### Declaração do ataque

Estender `CombatCostSelection` e o payload do ataque com:

```ts
damageMode: 'lethal' | 'nonlethal';
damageModePenalty: 0 | -5;
```

O cliente mostra a escolha antes da rolagem em desktop e mobile. O servidor repete as validações:

- arma corpo a corpo letal → não letal permitido com −5;
- ataque desarmado ou arma catalogada como não letal → letal permitido com −5;
- arma à distância comum não pode declarar dano não letal;
- o modificador deve estar refletido no total e no detalhamento do teste.

O valor padrão permanece letal para não alterar ataques existentes. Armas/ataques naturalmente não letais devem usar metadado explícito de catálogo; não inferir pelo nome.

### Aplicação e cura

Criar auxiliares privados no banco:

- `reconcile_nonlethal_conditions(...)`: reconcilia apenas a condição de origem não letal e delega as demais condições de recursos ao helper existente;
- `apply_character_healing_priority(...)`: recebe quantidade, estado esperado e devolve dano não letal curado, PV curado, condições e estado final;
- `apply_character_nonlethal_damage(...)`: consome PV temporários, incrementa o acumulado e devolve o recibo completo.

Todos os caminhos ativos de cura precisam usar o mesmo helper na mesma migration, para não haver uma tela correta e outra incorreta:

- `apply_character_effect_core(..., 'heal', ...)` (inclui cura de ritual);
- `change_character_resource` e `change_character_resources` quando PV aumenta;
- `confirm_character_paramedico`;
- fluxos de cura que forem encontrados pela busca de migrations durante a implementação.

`Reanimação` preserva sua decisão específica de retornar a 1 PV. Ela não deve ser silenciosamente convertida em cura comum; o recibo informa o dano não letal remanescente e o sistema reavalia se o alvo continua inconsciente.

### Resolução pelo mestre

Estender a resolução de ataque com `damageMode`. A nova RPC sucessora (sem remover a anterior) valida o evento de ataque, calcula resistência/vulnerabilidade/RD como hoje e aplica o resultado ao reservatório correto. O recibo inclui:

- `damageMode`;
- `nonlethalBefore`, `nonlethalApplied`, `nonlethalAfter`;
- `lethalDamageTotal`, `combinedDamageTotal`;
- condições antes/depois;
- `massiveDamageRequired: false` para dano não letal puro.

A RPC antiga permanece disponível durante a publicação e trata chamadas sem `damageMode` como `lethal`, preservando clientes abertos antes do deploy.

## Proposta 2 — manobras de combate

### Fluxo em duas fases

1. **Jogador declara:** ficha, alvo, tipo, arma/ataque desarmado e atributo permitido. A RPC exige campanha v2 ativa, ator no turno, fichas vinculadas e contexto de cena/rodada/turno.
2. **Mestre confirma contexto e resolve:** confirma adjacência, mão livre/item/posição quando aplicável, escolhe a resposta defensiva válida e informa apenas modificadores situacionais justificados. O servidor bloqueia as fichas, sorteia ambos os testes, repete empates, consome a ação padrão e aplica o efeito suportado na mesma transação.

Não se usa o fluxo de Bloqueio/Esquiva: uma manobra é teste oposto, não ataque contra Defesa.

### Persistência

Criar `campaign_combat_maneuvers_v2` com:

- `operation_id` da declaração como chave primária;
- campanha, cena, rodada e `turn_instance_id`;
- `actor_id`, `target_id`, `maneuver_type`, `weapon_id` opcional e atributo do atacante;
- `status` (`pending`, `resolved`, `cancelled`, `expired`);
- autor e `request_hash` da declaração;
- `resolution_operation_id`, autor mestre, hash e `result` da resolução;
- timestamps e índices por campanha/rodada/status;
- unicidade parcial para impedir duas declarações pendentes do mesmo ator no mesmo turno.

RLS continua fechada; acesso ocorre por RPCs `SECURITY DEFINER` que repetem vínculo de campanha e autorização.

### Sorteio oposto

O servidor calcula cada lado com atributo + Luta:

- Força é o padrão;
- Agilidade só é aceita com ataque desarmado ágil concedido por regra explícita ou arma corpo a corpo com propriedade `Ágil`;
- bônus de Luta vem da ficha/bônus sincronizado da campanha;
- modificador situacional fica limitado e exige justificativa do mestre;
- atributo positivo rola essa quantidade de d20 e mantém o maior; atributo zero/negativo usa o pool de desvantagem já adotado no projeto;
- empate gera nova rodada de dados até haver vencedor, com limite defensivo e falha transacional se o limite for atingido;
- 20 natural não ignora o total oposto.

O resultado conserva todos os dados, mantidos, bônus, modificadores, totais e diferença final.

### Efeitos

| Manobra | Aplicação do servidor | Parte declarada/manual |
| --- | --- | --- |
| Agarrar | Exige ataque desarmado; cria vínculo ativo ator/alvo e condição estruturada `Agarrado`; registra mão ocupada e deslocamento pela metade como efeito consultável. | Adjacência e qual mão está livre. |
| Soltar-se | Ação padrão e novo teste oposto; em sucesso encerra o vínculo e remove apenas condições da mesma origem. Soltar voluntariamente é RPC livre e idempotente. | Contexto físico excepcional. |
| Derrubar | Adiciona `Caído`; diferença ≥5 gera deslocamento adicional de 1,5 m no recibo. | Direção, beirada e eventual Reflexos DT 20. |
| Desarmar | Mestre seleciona item realmente empunhado; sucesso marca o item como não empunhado/equipado sem removê-lo do inventário; diferença ≥5 registra deslocamento de 1,5 m. | Posição final do item. |
| Empurrar | Calcula `1,5 m + 1,5 m` por cada 5 pontos de diferença e cria deslocamento pendente. | Direção e movimento do token; avançar junto consome ação de movimento por confirmação separada. |
| Quebrar | Registra sucesso do teste oposto e cria pendência vinculada ao item/objeto. | RD, PV e dano do objeto até existir modelo autoritativo de objetos. |

Criar `campaign_grapples_v2` para o ciclo de Agarrar, com uma relação ativa por alvo/origem e encerramento explícito. Não codificar “Agarrado” apenas como texto solto: o vínculo é necessário para soltar, escapar e remover a condição correta.

### Economia de ações

Estender `character_combat_actions.source` e `record_character_combat_action` para `maneuver`. A resolução bem-sucedida ou malsucedida ocupa uma ação padrão, pois a ação foi tentada. Declaração cancelada antes da resolução não gasta ação. Reenvio do mesmo UUID retorna o mesmo recibo sem outro gasto.

Habilidades que transformam manobra em ação livre ou ataque à distância (`Força Opressora`, `Disparo Impactante`) ficam fora desta primeira unidade e não podem usar a RPC básica para escapar do custo. Elas devem receber fontes e validações próprias em lote posterior.

## Interface

### Ficha do jogador

- Desktop e mobile exibem `Letal / Não letal` somente quando a arma/ataque permite conversão, com tooltip do −5 e prévia do modificador.
- O resultado de dano mostra claramente em qual reservatório será aplicado.
- Um painel compartilhado `CombatManeuverAction` permite declarar a manobra, alvo e arma, recuperar operação incerta, cancelar enquanto pendente e acompanhar a resolução.
- O resumo de recursos exibe “Dano não letal X” e “Dano combinado Y/Z”; se o limiar for atingido, informa “Inconsciente por dano não letal — não está Morrendo por esta fonte”.

### Painel do mestre

- Novo `CombatManeuverPanel` em `CombatTracker` lista pendências da cena/rodada.
- Antes de confirmar, mostra requisitos específicos, fichas/arma, ação que será consumida e campos situacionais com justificativa obrigatória.
- Depois da resposta, mostra dados dos dois lados, diferença, efeito automático e pendências manuais.
- Empurrar, Desarmar e Quebrar nunca aparecem como “totalmente aplicados” enquanto posição/objeto estiver pendente.

### Histórico

`character-activity-presentation.ts` recebe descrições para:

- dano não letal recebido/aplicado e cura prioritária;
- manobra declarada, resolvida, vencida/perdida, ação consumida e efeito;
- vínculo de agarrar criado/encerrado;
- pendência manual de deslocamento/objeto.

Ator e alvo recebem eventos correlacionados. IDs internos, hashes e detalhes de banco não aparecem no texto do jogador.

## Arquivos-alvo

## Sequência mínima recomendada

Recomendo dividir a implementação em **duas migrations e dois commits funcionais dentro do mesmo lote**, com uma única regressão/publicação ao final. Misturar os dois domínios em uma migration tornaria rollback, revisão de cura e diagnóstico de permissões desnecessariamente arriscados.

1. `20261028010000_nonlethal_damage_v2.sql` + commit `feat(combat): track nonlethal damage and healing priority`:
   coluna aditiva, helpers, sucessora da resolução de dano, integração dos caminhos de cura, contratos TypeScript, desktop/mobile, histórico e testes próprios.
2. `20261028020000_combat_maneuvers_v2.sql` + commit `feat(combat): resolve synchronized combat maneuvers`:
   tabelas/RPCs, ação padrão, vínculo de agarrar, serviços, painéis jogador/mestre, histórico e testes próprios.
3. Commit curto de fechamento, apenas se necessário, para `/rules` e documentação comprovada após ambos os blocos verdes.

A segunda migration pode depender da primeira apenas das infraestruturas já existentes (`character_activity_events`, ação/turno e condições), nunca do reservatório não letal. Assim, cada bloco permanece reversível e revisável isoladamente.

### Banco

- `supabase/migrations/20261028010000_nonlethal_damage_v2.sql`: coluna, helpers, RPCs, permissões, compatibilidade e backfill.
- `supabase/migrations/20261028020000_combat_maneuvers_v2.sql`: tabelas, testes opostos, ações, efeitos e permissões.
- `supabase/tests/nonlethal_damage_v2.sql`: CAS, idempotência, cura prioritária e condições.
- `supabase/tests/combat_maneuvers_v2.sql`: autorização, ação, empate, idempotência e efeitos.

### Serviços e tipos

- `src/services/combat-attack-service.ts`: seleção letal/não letal.
- `src/services/campaign-attack-target-service.ts`: contrato/recibo da resolução não letal.
- `src/services/campaign-combat-maneuver-service.ts`: declarar, cancelar, listar e resolver manobras.
- `src/integrations/supabase/types.ts` e tipos de personagem: nova coluna/contratos.
- `src/lib/character-activity-presentation.ts`: histórico legível.
- `src/lib/rules/base-rule-coverage.ts`: estado comprovado após os testes.

### Interface

- `src/components/character/CombatRollModal.tsx`.
- `src/components/character/mobile/MobileCombatRollModal.tsx`.
- `src/components/character/CombatManeuverAction.tsx` (novo, compartilhado quando possível).
- `src/components/campaign/v3/master/CombatManeuverPanel.tsx` (novo).
- `src/components/campaign/v3/master/AttackTargetResolutionPanel.tsx`.
- `src/components/campaign/v3/master/CombatTracker.tsx`.
- cartões de PV desktop/mobile que exibem o novo reservatório.

## Testes de aceitação

1. Arma corpo a corpo letal declarada como não letal aplica −5; arma à distância comum é recusada antes de sortear.
2. Dano não letal atravessa a mesma ordem resistência → vulnerabilidade → RD e consome PV temporários primeiro.
3. Dano combinado igual ao PV máximo adiciona apenas `Inconsciente`; `hp_current` e `Morrendo` não são alterados.
4. Cura de valor menor/igual ao dano não letal apenas reduz esse acumulado; o excedente recupera PV. Paramédico, ritual e ajuste de recurso produzem o mesmo resultado.
5. Reenvio idêntico retorna o mesmo recibo; UUID com payload diferente falha; concorrência de cura/dano não perde atualização.
6. Manobra só pode ser declarada pelo gestor da ficha no próprio turno v2 contra membro vinculado.
7. Apenas o mestre resolve; ação padrão é consumida uma vez mesmo quando o atacante perde.
8. Empate refaz os dois testes e o 20 natural não ignora a soma total.
9. Agarrar exige desarmado, cria vínculo; soltar/escapar remove apenas o efeito de sua origem.
10. Derrubar, Desarmar e Empurrar aplicam/registram seus efeitos e diferenças de 5 corretamente; Quebrar permanece explicitamente pendente de dados do objeto.
11. Desktop e mobile exibem escolha, aviso, recuperação de falha e recibo sem controles cortados.
12. Reconexão e segunda conta veem a mesma pendência/resultado; campanha v1 continua manual e não acessa as RPCs v2.

## Riscos e contenções

- **Cura distribuída:** é o maior risco. A migration deve localizar todos os `UPDATE ... hp_current` ativos e garantir que qualquer aumento autorizado respeite a prioridade não letal; teste de regressão deve cobrir os três fluxos públicos.
- **Condição `Inconsciente` com várias origens:** remover por nome apagaria efeitos legítimos. Use metadado `sourceKind/sourceOperationId` e remova apenas a origem não letal.
- **Inventário JSON:** Desarmar deve alterar somente o item selecionado e preservar chaves desconhecidas; use reconstrução ordenada e compare estado esperado.
- **Mapa não autoritativo:** não mover token por heurística. Registre distância/direção pendente e exija confirmação visual do mestre.
- **Clientes abertos:** manter RPC anterior e padrão letal durante a janela de deploy.
- **Escopo:** Atropelar, Força Opressora e Disparo Impactante recebem unidades próprias; não flexibilizar a RPC básica com flags genéricas.

---

## Contratos de execução

### Intenção

- objetivo: completar dano não letal e o fluxo básico das cinco manobras no combate v2 sem alterar o painel manual v1;
- restrições: preservar 20 natural personalizado, históricos existentes, condições desconhecidas, autorização atual e compatibilidade durante o deploy;
- sucesso: critérios 1–12 verdes em testes unitários, componentes, SQL transacional e UAT publicado com duas contas.

### Ordem sugerida

1. RED: `supabase/tests/nonlethal_damage_v2.sql` para reservatório, cura prioritária e condições.
2. GREEN: `20261028010000_nonlethal_damage_v2.sql`, serviços e interfaces desktop/mobile.
3. Commit do bloco não letal somente após seus testes focados verdes.
4. RED: `supabase/tests/combat_maneuvers_v2.sql` para declaração, resolução, idempotência e economia de ações.
5. GREEN: `20261028020000_combat_maneuvers_v2.sql`, serviços, painel do jogador, painel do mestre e histórico.
6. Commit do bloco de manobras somente após seus testes focados verdes.
7. Regressão focada, tipos, lint dos arquivos tocados, suíte geral e build.
8. Migration em transação revertida, revisão de permissões, merge, aplicação no banco, deploy e UAT autenticado.

### Handoff ao desenvolvimento

- Não iniciar pelas telas: o contrato SQL e os testes de regra definem o estado autoritativo.
- Separar a migration em duas se a implementação ultrapassar uma unidade revisável: primeiro não letal, depois manobras.
- Atualizar `/rules` somente com comportamento comprovado; efeitos físicos ainda adjudicados pelo mestre continuam marcados como parciais.
