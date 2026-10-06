# Cliente de atividades e aplicação de rituais

## Responsabilidades e comunicação

- `src/types/character-activity.ts`: contratos dos eventos, filtros, cursor e pedidos de aplicação. Payload JSON preserva os dados recebidos sem atribuir origem a registros legados.
- `src/services/character-activity-service.ts`: cliente tipado das RPCs de listagem, registro, ocultação/restauração e preferências. Valida UUIDs e confirmação de ficha/operação, serializa datas ISO e traduz erros sem expor detalhes do banco.
- `src/services/ritual-application-service.ts`: envia débito+registro e aplicações para transações do servidor. Recebe valores JSON, saldo/estado esperado e identificador idempotente; só retorna com confirmação do evento.
- `src/hooks/character/useCharacterActivity.ts`: consulta paginada por cursor, filtro por categoria, fila de rolagens autenticada por usuário/ficha, reconexão e eventos em tempo real. A fila mantém os dados sorteados e a operação original. Não atribui o histórico global antigo à ficha atual. Ocultação invalida também o painel antigo.
- `src/hooks/character/useRitualApplication.ts`: mantém o pedido completo da conjuração e de cada efeito entre tentativas. Consulta o estado autorizado do alvo antes do primeiro efeito; repetir um pedido conserva o snapshot inicial. Bloqueia operações simultâneas. Falha na atualização da tela depois do commit é aviso, não falha de gravação.
- `src/lib/character-activity-presentation.ts`: apresenta dados, valor mantido, bônus de perícia, outros bônus e penalidades sem inventar campos ausentes.
- `src/components/character/CharacterActivityPanel.tsx`: painel compartilhado responsivo, com filtro, carregar mais, atualizar, ocultar/restaurar e recuperar fila. Recebe somente ID/nome da ficha e opção compacta; o hook autentica e consulta o servidor.

Fluxo: páginas desktop/mobile → hook → serviço → RPC autenticada → políticas/transação PostgreSQL → evento confirmado → cache/painel. Atualizações das tabelas de eventos, preferências e ficha invalidam as consultas. A ficha publica também `character-server-updated` com o ID para seus consumidores recarregarem o estado persistido.

## Verificação

- Serviço/presentação: 10 cenários (ficha errada, confirmação ausente, cursor, ocultação sem exclusão, data ISO, bônus negativos, custo zero, PE insuficiente, aplicação negada).
- Histórico: 6 cenários (fila isolada ao trocar ficha ou conta, recuperar mesma operação após reconectar, preservar histórico global sem atribuição).
- Ritual: 4 cenários (repetir pedido original após perder confirmação, conservar snapshot do primeiro efeito, tratar falha de atualização depois do commit como aviso).
- Os 20 testes iniciais passaram. Checagem de tipos passou e lint dos arquivos deste cliente passou sem avisos na execução de 06/10/2026.

## Limites deliberados

A fila offline armazena somente rolagens. Efeitos e débitos exigem confirmação online e não são repetidos automaticamente em outro contexto. Aplicações não suportadas pelo servidor exigem conferência manual. Um conflito de snapshot não gera automaticamente uma nova operação nem sobrescreve uma alteração concorrente. Eventos antigos globais continuam preservados no navegador até existir atribuição explícita de origem.

## Integração com campanhas (lote 6)

`src/hooks/useCampaignRitualSync.ts` resolve vínculo real da ficha/usuário nas campanhas v2 e, se ausente, v1. Expõe `campaignId`/`campaignVersion` para o quarto argumento de `useRitualApplication.cast`. Usa `active` na sessão v2 e `in_progress` na v1. Carrega eventos canônicos por versão e conserva leitura dos registros antigos v1. A assinatura `syncRitualCast` permanece como recarregamento, sem criar uma segunda escrita após o débito transacional. Reconexão e alterações em tempo real recarregam o feed; respostas antigas não sobrescrevem a ficha atual.

`src/components/campaign/v3/master/PlayerControlCard.tsx` oferece o painel de atividades da ficha no fluxo ativo `CampaignShell → MasterTab → PlayerControlCard`. `ConditionSelector.tsx` usa o catálogo central para descrições, reconhece IDs acentuados e mantém desconhecidos visíveis com orientação manual.

Verificações adicionais: 5 novos testes de vínculo v1/v2, erro explícito, evento em tempo real sem duplicação e resposta atrasada após troca de ficha; 4 testes existentes de sessão legada continuam passando. Lint destes arquivos sem erros; o aviso existente de Fast Refresh do export de catálogo no seletor permanece.


`src/lib/campaign-condition-presentation.ts` extrai somente os rótulos para `useCampaignData` e suas telas. Objetos nunca são passados como texto React; condições desconhecidas continuam visíveis. O JSON original não é modificado: duração, parâmetros e identificadores permanecem no banco, consultados pelas ações transacionais. Dois testes adicionais verificam essa preservação. Total deste cliente: 26 novos cenários, além dos 4 de regressão de sessão legada.


A recuperação offline também funciona se o armazenamento estiver cheio: a fila fica em memória, compartilhada entre a tela e o painel e separada por usuário/ficha. Os registros confirmados são retirados desse snapshot mesmo se o navegador não puder limpar o armazenamento; a proteção idempotente reconhece eventual retry após recarregar. O aviso explica quando manter a ficha aberta é necessário. A primeira renderização após trocar de ficha já mascara a fila antiga. Falhas de atualização da visualização depois da confirmação não transformam o salvamento confirmado em erro.

## Bônus de arma e sustentação transacionais

`src/lib/ritual-application-payload.ts` fornece builders puros para `weapon_buff` e `sustain`. `buildWeaponBuff` usa o efeito ativo do catálogo e converte `bonusDamage`, `extraDice` ou fórmula textual para o formato lido pelo motor existente. Preserva ataque/crítico/multiplicador, opções e duração; ID/data são definidos pelo servidor. O motor atual associa esses bônus à ficha, sem escolher uma arma específica. `buildSustainPayload` preserva metadados/configuração e normaliza `movement` para `move`, a mesma ação no painel legado. Não debita manutenção nesta ativação.

Fluxo de aplicação: wizard → builder puro → `activityJson` → `useRitualApplication.apply` → RPC transacional → `characters.active_buffs` ou `character_sustained_rituals` → painel/motor existentes. Antes do primeiro bônus de arma, o hook consulta `active_buffs` e conserva esse snapshot no pedido idempotente. Nenhum builder dispara callback, gravação ou alteração de estado.

Oito testes verificam Amaldiçoar Arma normal/discente/verdadeiro, bônus e duração de Arma Atroz, cópia de opções, rejeição de ritual sem efeito de arma, sustentação/configuração, custo inválido e compatibilidade de ação. Todos passaram; lint passou sem avisos. Total do cliente: 35 novos cenários.


## Filtros de período e sessão

O painel agora oferece todo o histórico/últimos 7 dias/últimos 30 dias e sessões com campanha, número, título e data. As opções são consultadas sobre o histórico completo, não só a primeira página. A sessão é identificada pelo trio sessão/campanha/versão para manter namespaces v1/v2 separados. Os novos casts gravam `sessionId`; as aplicações conservam a referência à conjuração original.

`20261006173000_character_activity_filters.sql` adiciona RPCs de leitura distintas, sem sobrecarga ambígua nem alteração de dados antigos. `list_character_activity_filtered` aplica período/sessão antes do limite e preserva cursor, autorização e ocultação. `list_character_activity_sessions` junta somente sessões do contexto registrado e autorizado. Sessões também são recarregadas após alterações em tempo real e reconexão, para que futuras conjurações usem a sessão atual.

`supabase/tests/character_activity_filters.sql` usa fixtures com rollback para validar período, cursor, sessões com IDs iguais em v1/v2, aplicações ligadas ao cast, filtros incompletos, ocultação e acesso de estranho/anônimo. A execução SQL é responsabilidade da tarefa principal antes de aplicar a migration. Três novos testes de cliente verificam filtros/período inválido/opções completas e um teste verifica atualização de sessão em tempo real. Total do cliente: 39 novos cenários.

## Confirmação conjunta de recursos da própria ficha

`src/hooks/character/useCharacterResourceUpdate.ts` recebe HP, PE, SAN desejados, condições JSON completas e snapshot esperado. Chama `confirmResourceBundle` em `character-resource-service.ts`, que valida os dados e encaminha a RPC transacional `change_character_resources`. As Sheets recebem evento confirmado ou `false`; só o evento autoriza atualizar o estado local e apresentar sucesso. O hook expõe `busy` e `error`, sem executar atualização visual ou estorno.

A primeira tentativa conserva UUID, condições e estado esperado por ficha e valores de recursos. Uma resposta perdida repete o pedido integral mesmo que condições automáticas recebam novo horário. Conflito, permissão negada ou entrada inválida libera novo pedido, exigindo que a tela recarregue o estado adequado. Um clique concorrente é bloqueado antes de enviar outra operação. A resposta de uma ficha anteriormente aberta não confirma alteração na nova ficha.

`src/hooks/character/__tests__/useCharacterResourceUpdate.test.tsx`: três cenários passaram — clique duplicado pendente, retry com mesmo UUID/snapshot/condições, e conflito sem sucesso local com novo pedido após atualização. Total de cenários novos do cliente: 42.

## Conferência final do modal compartilhado de perícias

`src/components/dice/DiceRollModal.tsx` separa treinamento de outros modificadores no DTO enviado ao histórico, mantendo o total já calculado e os dados extras. Quando há origem numérica `skill`, a mesma soma determina o requisito de treinamento; sem origem explícita, mantém o agregado legado. O nível explícito continua prioritário. A fórmula visual apresenta ambos os valores.

Poderes `combat_bonus`, como Ataque Especial, não entram na interface, nos efeitos ativados nem no custo de PE deste modal de perícias. O modal de combate permanece responsável por esses poderes.

A implementação existente de Eclético no catálogo/bridge estabelece substituição do treinamento por 5/10/15; o executor ignorava esse valor. Agora troca somente o treinamento, conserva bônus externos conhecidos e mostra o treinamento efetivamente utilizado. O custo de PE continua o da opção selecionada, sem cobrança adicional criada por esta correção.

`src/components/dice/__tests__/DiceRollModalBonusOrigins.test.tsx` cobre nove cenários com modal montado: origens 5+5, penalidades/dados extras, agregado legado, exclusão de Ataque Especial em Iniciativa/Luta, requisitos do Eclético e substituição real com preservação de poder externo e cobrança única de PE. Não altera a política personalizada de sucesso crítico.
