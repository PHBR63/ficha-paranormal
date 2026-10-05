# Sessões e combate compartilhado

## 1. Resumo da alteração

A decisão do usuário é persistir o combate no servidor e sincronizar entre dispositivos e jogadores. O rastreador deixa de guardar turno, rodada e participantes apenas em estado local. O servidor confirma as alterações do mestre e rejeita gravações com revisão antiga. Jogadores acompanham em modo de leitura.

Sessões e mensagens passam a ler, gravar e assinar a mesma versão de campanha. Campanhas v1 preservam o contrato legado; campanhas v2 usam tabelas v2. O início da sessão atualiza a tela após confirmação, sem depender de um evento Realtime.

## 2. Arquivos alterados/criados

| Arquivo | Responsabilidade, dependências e dados |
|---|---|
| `src/lib/campaign-combat.ts` (novo) | Usa Zod existente; recebe estado e participantes, valida integridade e retorna estado vazio, avanço, ordenação ou remoção. Compartilhado pelo serviço, hook e rastreador. |
| `src/services/campaign-combat-service.ts` (novo) | Usa cliente Supabase autenticado e schema Zod. Recebe campanha/revisão/estado; consulta tabela ou chama RPC; retorna estado e revisão confirmados ou lança erro. Contrato tipado isolado da migration nova. |
| `src/hooks/campaign/useCampaignCombat.ts` (novo) | Recebe campanha, usuário, autorização de mestre e habilitação. Usa serviço e Realtime; retorna estado, carregamento, gravação, conexão, erro, recarga e atualização. Descarta respostas de outra campanha e revisões antigas. |
| `src/hooks/campaign/useCampaignData.ts` | Retorna `schemaVersion` junto da campanha/membros; `CampaignShell` e `TacticalMapFullscreen` usam essa versão para escolher contratos. |
| `src/hooks/campaign/useCampaignRealtime.ts` | Recebe campanha/usuário/versão; acessa sessões e mensagens da mesma versão. Retorna histórico, sessão ativa, envio, início/fim e presença do canal. Normaliza `in_progress` legado; eventos usam `system` + `metadata.eventType`. Leituras antigas não apagam escritas novas e mensagens não invalidam leituras de sessões. |
| `src/pages/CampaignShell.tsx` | Cria um controlador por campanha, passa leitura ao `PanelTab` e escrita do mestre ao `MasterTab`; habilita após carregar a campanha correspondente. |
| `src/pages/TacticalMapFullscreen.tsx` | Instância própria do mesmo hook/servidor no mapa completo; passa controlador ao painel do mestre e versão ao chat. |
| `src/components/campaign/v3/master/CombatTracker.tsx` | Recebe membros e controlador; mostra participantes/rodada/turno, inicia/encerra, edita iniciativa, adiciona NPC e remove participantes. Usa helpers puros; só confirma mudança após resposta do hook. Valida iniciativa e descarta rascunhos de participantes removidos. |
| `src/components/campaign/v3/tabs/MasterTab.tsx` | Recebe controlador e disponibilidade v2; encaminha ao rastreador. Campanha legada recebe mensagem explícita, sem salvamento local oculto. |
| `src/components/campaign/v3/map/MasterMapPanel.tsx` | Recebe controlador opcional do mapa; encaminha ao rastreador ou mostra indisponibilidade. |
| `src/components/campaign/v3/tabs/PanelTab.tsx` | Recebe controlador opcional e dados dos agentes; mostra ordem, iniciativa, rodada e participante atual para jogadores, sem controles de escrita. |
| `supabase/migrations/20261005183000_campaign_combat_state_v2.sql` (novo) | Cria tabela, RLS de leitura, RPC autorizada e publicação Realtime. Usa `campaigns_v2`, `auth.uid`, `is_campaign_member_v2` e `is_campaign_master_v2` já existentes. |
| `supabase/tests/campaign_combat_state_v2.sql` (novo) | Transação sintética com rollback; verifica revisões, mestre, jogador, externo, anônimo, turno e duplicatas em PostgreSQL. |
| `src/lib/__tests__/campaign-combat-state.vitest.ts` (novo) | 9 testes de avanço, preservação de participante, remoção e estados inconsistentes. |
| `src/hooks/__tests__/campaign-combat-sync.vitest.ts` (novo) | 5 testes do hook com serviço/canal simulados: recuperação, leitura do jogador, gravação confirmada, conflito e resposta de outra campanha. |
| `src/hooks/__tests__/campaign-session-contract.vitest.ts` (novo) | 6 testes de contratos v1/v2, normalização, eventos, erros e concorrência entre carregamento e envio. |
| `docs/CAMPAIGN_COMBAT_SYNC.md` (novo) | Este contrato e critérios de aceite; não contém credenciais nem é executado pela aplicação. |

## 3. Fluxo de comunicação

`useCampaignData` → versão carregada → páginas → `useCampaignRealtime` → tabelas da mesma versão. Status v1 `in_progress` vira `active` na interface; gravação v1 preserva `in_progress`. Em v2, `active` permanece `active`. Endpoints Supabase usam autenticação atual do cliente; nenhuma chave privilegiada é adicionada ao navegador.

`CombatTracker` → `combat.update(transformação)` → schema/serviço → RPC `save_campaign_combat_v2` → autorização de mestre → atualização condicional pela revisão → estado confirmado → hook → rastreador/painel. Realtime provoca nova leitura autorizada; retornar à aba ou ficar online também recarrega. O mapa completo e outra aba leem a mesma linha no servidor.

### Banco e API

Tabela `campaign_combat_state_v2`: `campaign_id` UUID/PK/FK para `campaigns_v2`; `revision` inteiro crescente; `state` JSONB; `updated_at` horário. Uma linha por campanha, criada na primeira escrita. Ao encerrar, salva estado vazio; não exclui a linha. A exclusão da campanha remove essa linha por cascade. Nenhuma ficha, campanha ou sessão existente é reescrita pela migration.

RPC recebe:

```json
{
  "p_campaign_id": "uuid-da-campanha-v2",
  "p_expected_revision": 3,
  "p_state": {
    "active": true,
    "round": 2,
    "currentTurnIndex": 0,
    "combatants": [{ "id": "npc-id", "name": "NPC", "initiative": 12, "isNPC": true }]
  }
}
```

Retorna uma linha com campanha, revisão incrementada, estado confirmado e horário. SQL rejeita formato inválido, mais de 100 participantes, JSON acima de 64 KiB, rodada inválida, turno fora da lista, IDs duplicados ou iniciativa não inteira/fora de -1000 a 1000. O cliente também valida campos opcionais, como foto e PV.

Leitura: `GET /rest/v1/campaign_combat_state_v2?campaign_id=eq.<uuid>` com JWT atual e RLS. Escrita: `POST /rest/v1/rpc/save_campaign_combat_v2`, JSON acima, mesma autenticação. Apenas mestre pode gravar; membro/mestre pode ler. Escrita direta e acesso anônimo são revogados. `42501` indica falta de autorização, `22023` estado inválido, `40001` revisão desatualizada. A interface informa falha, mantém apenas estado confirmado e oferece recarga; conflito exige conferir o turno antes de repetir.

## 4. Código ou patch

```sql
UPDATE public.campaign_combat_state_v2 AS combat
SET state = p_state, revision = combat.revision + 1, updated_at = now()
WHERE combat.campaign_id = p_campaign_id
  AND combat.revision = p_expected_revision
RETURNING combat.*;
```

A autorização e validação precedem esse trecho na RPC completa. O diff do PR inclui migration, interface, serviço, hook e testes. A revisão de campanhas depende da revisão de regras quando empilhada sobre `codex/rules-foundation`.

## 5. Observações importantes

A migration foi validada em PostgreSQL 18.4 local e descartável, com tabelas/funções de autorização existentes do repositório, papéis `authenticated`/`anon` e `auth.uid` simulado pelas claims da sessão SQL. Isso confirma o comportamento SQL exercitado, mas não autenticação Supabase, entrega real de Realtime nem duas contas no projeto remoto.

O projeto Supabase correto é `rctbxgpjtgkinwzdymbt`. Ele não estava acessível pelo conector desta sessão. A migration NÃO foi aplicada remotamente; não houve publicação, merge, alteração de permissões existentes ou escrita em fichas reais. Nenhum projeto de outra aplicação deve ser usado como substituto.

Ativar a migration antes de publicar o frontend que depende dela. Sem a tabela/RPC, o painel informa erro de carregamento; não finge persistência. Conferir histórico remoto de migrations e backup antes da aplicação. Campanhas v1 mantêm chat/sessões, mas este combate compartilhado está disponível apenas em v2.

A revisão protege o combate. O início de sessão evita duplicação na mesma instância; não implementa uma nova transação de exclusividade entre abas. PV dos participantes é uma fotografia inicial, sem sincronizar automaticamente mudanças de ficha. Perda de conexão pode atrasar a visão do jogador; a tela do mestre indica reconexão e recarrega ao voltar online.

## 6. Como testar

```powershell
npm test -- src/lib/__tests__/campaign-combat-state.vitest.ts src/hooks/__tests__/campaign-combat-sync.vitest.ts src/hooks/__tests__/campaign-session-contract.vitest.ts
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json
npm run build
```

Em banco de homologação com as dependências da migration, aplicar a migration e executar `supabase/tests/campaign_combat_state_v2.sql` com `psql` e `ON_ERROR_STOP=1`. Os registros sintéticos do teste são revertidos. Executar exclusivamente em homologação.

Aceite após ativação no projeto correto:

1. Mestre inicia combate sintético, inclui NPC, salva iniciativa, avança rodada e recarrega: estado idêntico.
2. Jogador membro acompanha as mesmas mudanças em outra conta/dispositivo e não recebe controles de escrita.
3. Duas abas do mestre tentam gravar a mesma revisão: primeira confirma; segunda recebe conflito, recarrega e não sobrescreve.
4. Remover participante anterior ao atual preserva quem age; remover o atual segue para o próximo sobrevivente. Combate vazio mostra espera e não avança.
5. Iniciativa inválida bloqueia salvar; erro de rede não confirma alteração; reconectar recarrega estado.
6. Usuário externo e anônimo não leem; jogador não grava mesmo chamando API diretamente.
7. Sessão v2 inicia/encerra na tabela v2; legado usa v1/`in_progress`; evento `event_damage` grava como `system`, preserva subtipo e reaparece corretamente.
