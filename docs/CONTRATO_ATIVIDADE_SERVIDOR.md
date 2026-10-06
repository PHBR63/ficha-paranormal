# Histórico e aplicação confirmados no servidor

Migration: `20261006160000_character_activity.sql`. Validação: `supabase/tests/character_activity.sql`, sempre com rollback. A migration não reescreve históricos, recursos, condições ou buffs existentes.

## Armazenamento e autorização

`character_activity_events` mantém um evento por UUID de operação: ficha, autor derivado de `auth.uid()`, categoria (`roll`, `ritual`, `application`), estado (`pending`, `confirmed`), resultado JSON, contexto v1/v2 opcional e horário do servidor. `id` e `operation_id` recebem o mesmo UUID. `request_hash` identifica reutilização do UUID com conteúdo diferente. O histórico só pode ser lido pelo dono ou mestre de campanha à qual a ficha está vinculada; a identidade do participante deve coincidir com a do proprietário da ficha.

`character_activity_visibility` mantém `user_id`, `character_id` e `hidden_before`. Ocultar não apaga os eventos. O mesmo corte de horário pode ser usado pelo histórico de edição existente. Restaurar define o corte como nulo. Autoria e preferências não são aceitas do cliente.

Nenhuma escrita direta nessas tabelas foi concedida a `authenticated`. A autorização de aplicação em outra ficha fica nas RPCs; as políticas de UPDATE gerais de `characters` continuam intactas. A política adicional de leitura v2 permite consultar fichas vinculadas somente aos participantes e mestre da campanha. Eventos permanecem privados ao dono/mestre, sem expor automaticamente rolagens aos demais jogadores.

## RPCs

Todas as RPCs retornam erro PostgreSQL em falha e não anunciam aplicação. IDs devem ser criados antes da tentativa e reutilizados numa repetição após timeout.

| RPC | Entrada | Saída |
|---|---|---|
| `record_character_activity` | `p_operation_id`, `p_character_id`, `p_category='roll'`, `p_payload`, campanha/versão opcionais | Evento confirmado; não modifica recursos. |
| `cast_character_ritual` | operação/ficha, `p_expected_pe` inteiro, `p_pe_cost` inteiro >=0, payload com `ritualId` e `ritualName`, contexto opcional | Débito e evento ritual pendente na mesma transação; payload inclui `peBefore`, `peAfter`, `peCost`, `effectStatus`. |
| `apply_character_effect` | operação/ficha, `p_kind`, `p_value`, `p_expected`, `p_cast_event_id` opcional, contexto opcional | Evento confirmado com `kind`, `value`, `before`, `after`, `castEventId`; alteração da ficha na mesma transação. |
| `hide_character_activity` | ficha, `p_hidden` booleano (padrão true) | Preferência do usuário autenticado; false restaura. |
| `list_character_activity` | ficha, limite1–100 (padrão50), categoria opcional, cursor horário+ID opcionais juntos, `p_include_hidden` (padrão false) | Eventos por `(created_at,id)` decrescente, sem paginação baseada em deslocamento. |

Para cura/dano, `p_value` é um número JSON inteiro entre 0 e 1.000.000 e `p_expected` é `{ "hp_current": 5, "hp_max": 10 }`. Cura limita ao máximo e dano limita a zero. O servidor bloqueia a ficha durante a operação e rejeita valores esperados desatualizados (`40001`).

Para condições, `p_value` é um array de condições adicionais (texto ou objetos com `id` e `name`), e `p_expected` contém o array original em `conditions`. Entradas anteriores permanecem intactas, incluindo IDs não reconhecidos, duração e parâmetros. Não existe substituição arbitrária de campos da ficha.

PV temporários continuam para resolução manual, com rejeição `0A000`. Buff de arma e sustentação recebem suporte específico pela migration `20261006172000_ritual_weapon_sustain.sql`, descrita abaixo. Cancelar após uma conjuração não devolve PE nem apaga o evento pendente. Uma aplicação confirma sua própria etapa, sem presumir que todas as etapas do ritual terminaram.

## Erros e sincronização

- `42501`: sem permissão ou contexto de campanha/ficha sem vínculo.
- `22023`: payload, quantidade, cursor ou recurso insuficiente inválido.
- `23505`: UUID já usado com autor ou conteúdo diferente.
- `40001`: recurso alterado por outra operação; recarregar antes de nova tentativa.
- `0A000`: efeito exige resolução manual.

Realtime publica `character_activity_events` e `characters`, sob RLS. Consumidores atualizam leitura/cache e nunca reaplicam efeitos recebidos. Após reconexão devem consultar novamente o servidor. O cliente pode ler diretamente os eventos autorizados, mas deve aplicar a preferência de ocultação e usar cursor de horário+ID para evitar perda/duplicação durante novas inserções.

O teste usa apenas identidades existentes e fixtures exclusivas, verifica isolamento e idempotência e executa rollback. A validação com mestre e jogador reais diferentes permanece separada da simulação SQL e não deve ser alegada quando há apenas uma conta de teste disponível.

## Ações da campanha

A migration `20261006170000_character_master_actions.sql` acrescenta duas operações com a mesma autorização de dono/mestre vinculado, registro de auditoria e chave de idempotência:

- `change_character_resource(p_operation_id,p_character_id,p_resource,p_mode,p_value,p_expected_current,p_expected_max)`: aceita somente recursos `hp`, `pe`, `san`, modos `delta` ou `set` e quantidades inteiras. Confere valores atual/máximo sob bloqueio, limita o resultado a zero/máximo e registra antes/depois.
- `replace_character_conditions(p_operation_id,p_character_id,p_conditions,p_expected)`: substitui o array exclusivamente para ações explícitas de adicionar, remover ou limpar condições; exige correspondência integral com o array anterior. O cliente preserva objetos desconhecidos e seus parâmetros que não foram removidos pelo usuário.

`useMasterActions` prepara essas requisições através de `character-resource-service.ts`. A preparação consulta somente os campos necessários, captura o estado esperado e cria um UUID. O hook guarda a requisição preparada entre tentativas após timeout e só anuncia sucesso depois do evento devolvido pelo servidor. Um conflito confirmado (`40001`) encerra a requisição inválida: uma próxima ação relê os dados, sem repetir automaticamente a aplicação. A preparação compartilhada entre cliques concorrentes evita criar duas operações para a mesma ação ainda em andamento.

Os componentes da campanha continuam usando os mesmos nove métodos públicos do hook. Handouts permanecem no fluxo existente. O teste SQL `character_master_actions.sql` valida os recursos, condições, auditoria e isolamento em fixtures com duas identidades existentes e rollback.

## Buff de arma e sustentação

A migration `20261006172000_ritual_weapon_sustain.sql` estende `apply_character_effect` preservando os argumentos existentes. A implementação anterior fica privada. Um índice único por conjuração, alvo e tipo impede reaplicação mesmo que um cliente gere outro UUID após reload; nesse caso a operação é rejeitada com `23505`, sem alteração duplicada.

`weapon_buff` recebe os campos conhecidos de `WeaponBuff`, sem aceitar `id` e `appliedAt` do cliente. O servidor valida dados, duração, fórmulas, opções e aprimoramentos e exige `p_expected.active_buffs` igual ao armazenamento original. ID e horário são gerados pelo servidor. O mesmo ritual renova seu buff e mantém os demais registros, inclusive metadados desconhecidos; formatos antigos incompatíveis exigem revisão manual.

`sustain` recebe identificação/círculo do ritual, aprimoramentos e `sustainConfig` validado. Insere um registro no armazenamento já utilizado por `useSustainedRituals`, com o dono da ficha em `user_id`, preservando leitura do jogador quando o mestre aplica. A autoria da ação fica separada no evento. Uma sustentação já ativa do mesmo ritual/ficha não ganha outra entrada nem outro débito. O assistente não aplica manutenção de PE automaticamente por receber um evento: os controles de sustentação existentes continuam responsáveis pelos turnos.

`useCampaignData` acompanha UPDATEs confirmados de fichas vinculadas e recarrega após reconexão; não depende de broadcasts para confirmar recursos. A migration `20261006171000_campaign_v2_profile_read.sql` acrescenta somente leitura de perfis entre participantes/mestre v2, equivalente ao compartilhamento v1. Os guards restritivos e as permissões de escrita permanecem intactos.

## Ingresso autorizado v1/v2

A revisão das políticas encontrou autoentrada direta permitida em ambas as versões apenas por `user_id = auth.uid()`, independentemente de convite. A migration `20261006174000_campaign_invite_join.sql` mantém adição direta pelo mestre e substitui autoentrada pela RPC `join_campaign_with_invite(p_code,p_character_id?)`. O cliente deve usar essa RPC, não continuar a sequência validar no navegador + INSERT direto.

A RPC deriva usuário/papel, valida a propriedade da ficha opcional, bloqueia o convite, confere validade/limite e grava vínculo + uso atomicamente. Retorna `campaign_id`, `campaign_version`, `campaign_name` e `already_member`. Uma repetição após confirmação perdida retorna o vínculo existente sem outro uso. O código sozinho não permite elevar o papel para mestre nem vincular uma ficha alheia.

Como `campaign_invites` possui FK exclusivamente v1, `campaign_invites_v2` armazena os novos convites v2, sem mover os antigos. `create_campaign_invite_v2(p_campaign_id,p_max_uses?,p_expires_at?)` fica restrita ao mestre e gera código aleatório com prefixo `V2-`. Somente o mestre pode consultar os códigos v2. Os controles do modal precisam escolher as tabelas pela versão real da campanha.

O teste `campaign_invite_join.sql` cobre os dois ingressos, bypass direto negado, ficha alheia, expiração, último uso, repetição, criação indevida e anônimo, sempre com rollback. A mesma migration inclui `character_activity_visibility` no Realtime: ocultação/restauração são preferências privadas do usuário, sem apagar registros.

## Filtros e revisão de acesso

A migration `20261006173000_character_activity_filters.sql` acrescenta filtros de período e sessão antes da paginação. `list_character_activity_filtered` mantém autorização por ficha, corte de ocultação e cursor composto. `list_character_activity_sessions` oferece apenas os metadados de sessões às quais o usuário pertence ou das quais é mestre; receber um efeito na própria ficha não libera nome/título de outra campanha. O teste `character_activity_session_privacy.sql` cobre esse caso sem remover o evento autorizado da ficha alvo.

Os contratos de condições são compatíveis entre gerenciador da ficha e painel do mestre: ambos chamam `replace_character_conditions` com array esperado e UUID estável. O serviço exige confirmação de ficha/operação; erros de concorrência são identificáveis para a interface. Os testes de serviço também conferem preservação de parâmetros e rejeição de confirmação retornada para outra ficha. Handouts exigem uma linha devolvida em UPDATE/DELETE, de modo que uma negação de RLS não gera aviso de sucesso.

Na revisão dos privilégios do servidor, as funções internas `apply_character_effect_core`, `validate_character_activity_context` e `activity_json_integer` não concedem EXECUTE a `authenticated` ou `anon`. As RPCs públicas expõem apenas a operação autorizada; todas usam caminho de busca fixo. A leitura de perfis v2 usa `auth.uid()` e a participação/mestre verificada no banco, sem confiar no papel apresentado pelo cliente.

| Migration | Responsabilidade | Validação SQL |
|---|---|---|
| `20261006160000_character_activity` | Eventos, ocultação, conjuração/custo atômicos, aplicações de PV/condições, leitura de fichas v2, Realtime | `character_activity.sql` |
| `20261006170000_character_master_actions` | Ajustes de PV/PE/SAN e substituição explícita de condições com CAS | `character_master_actions.sql` |
| `20261006171000_campaign_v2_profile_read` | Perfis dos participantes v2 com escopo de campanha | `campaign_v2_profile_read.sql` |
| `20261006172000_ritual_weapon_sustain` | Buff/sustentação e proteção semântica contra reaplicação | `ritual_weapon_sustain.sql` |
| `20261006173000_character_activity_filters` | Período/sessão antes de LIMIT e metadados de sessões autorizadas | `character_activity_filters.sql`, `character_activity_session_privacy.sql` |
| `20261006174000_campaign_invite_join` | Ingresso v1/v2 validado e convites v2; ocultação sincronizada | `campaign_invite_join.sql` |
| `20261006175000_character_resource_bundle` | Edição conjunta de recursos e condições sem sobrescrever operações concorrentes | `character_resource_bundle.sql` |

`change_character_resources` recebe os três valores finais em `p_values`, o snapshot original completo em `p_expected` (atuais, máximos e condições) e o array final em `p_conditions`. A alteração usa bloqueio de ficha, exige correspondência de todos os campos originais e registra um evento único com antes/depois. Os valores são inteiros limitados a zero/máximo no servidor. Nenhuma regra automática nova é inferida no banco: as condições enviadas continuam sendo calculadas pelo fluxo existente da tela. O serviço `confirmResourceBundle` recebe UUID estável do chamador e só confirma após retorno para a ficha/operação corretas.

Os ensaios SQL rodam em transação com rollback. Aprovação de tipos/testes locais, aplicação das migrations, publicação do cliente e aceite autenticado no app são verificações separadas; este contrato não declara publicação nem teste com duas contas reais nos navegadores.
