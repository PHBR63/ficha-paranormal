# Correção S0 — isolamento e confirmação de gravação

Data: 06/10/2026. Problema S01 identificado no baseline: autenticação por si só satisfazia políticas permissivas e contornava o isolamento por dono/campanha. Correção aplicada no Lovable Cloud e registrada como migration `20261006130000`.

## Arquivos e fluxo

- `supabase/migrations/20261006130000_restrict_anonymous_guards.sql`: converte somente os guards conhecidos de autenticação para RESTRICTIVE. Inspeciona `pg_policies`, valida expressões/comandos/roles e preserva políticas específicas. Não recebe payload de jogo, não altera colunas/registros e não cria API. A versão fica no ledger de migrations.
- `supabase/tests/restrict_anonymous_guards.sql`: lê apenas o dono da ficha QA e cria fixtures exclusivas de ficha, campanha, histórico, sustentação e conjuração. Simula identidades SQL, verifica acessos permitidos/negados e encerra com ROLLBACK. Não cria contas ou altera a ficha existente. A trigger que adiciona o mestre na campanha é respeitada pelo upsert do vínculo sintético.
- `src/hooks/campaign/useMasterActions.ts`: recebe `campaignId`, `isMaster`, `onUpdate`; métodos recebem personagem e valor/condição. `CampaignShell`, painel/chat e demais consumidores recebem boolean de sucesso. Agora exige linha retornada após UPDATE antes do aviso de sucesso e de `onUpdate`. Sem linha autorizada, usa o tratamento de erro já existente.
- `src/hooks/campaign/__tests__/useMasterActions.test.ts`: cobre as nove alterações de recursos/condições com gravação rejeitada, confirmação positiva de PV e bloqueio no cliente quando não é mestre.

Tela → método do hook → leitura de recurso → UPDATE filtrado pelo ID → RLS específica + guard restritivo → retorno de uma linha → aviso/atualização do painel. O guard exige autenticação e a política específica exige o vínculo; uma condição não substitui a outra.

## Resultado no banco

22 guards em 19 tabelas convertidos; zero guards `Block anonymous ...` permissivos remanescentes. As 158 outras políticas permanecem idênticas (mesmo hash antes/depois). As fixtures de personagem/campanha ficaram com contagem zero após rollback. A migration foi registrada uma vez.

Os testes SQL passaram em simulação da migration revertida e depois da aplicação. Cobrem leitura, criação, alteração e remoção pelo dono; leitura de histórico/sustentação/conjuração pelo dono/mestre da fixture; negação de leitura/UPDATE/DELETE/INSERT indevido por identidade sem vínculo; e negação de leitura anônima. A primeira tentativa com campanha detectou o vínculo automático do mestre; o teste foi ajustado e executado novamente com sucesso, sem resíduos.

A conta atual continuou abrindo a ficha QA no app publicado após a alteração do banco, com PV 28/28, PE 4/4 e SAN 15/15.

## Patch essencial

```sql
CREATE POLICY "Block anonymous access to characters"
ON public.characters AS RESTRICTIVE FOR SELECT TO PUBLIC
USING (auth.uid() IS NOT NULL);
```

```ts
.update({ hp_current: newHP })
.eq('id', characterId)
.select('id')
.single();
```

O SQL acima ilustra o guard; o arquivo de migration contém a transformação completa e aborta se uma definição tiver mudado. O código usa o tratamento de erro existente: RLS pode impedir um UPDATE atingindo zero linhas; `.single()` torna esse resultado uma falha visível.

## Limites e impacto

- Permissões específicas existentes foram preservadas. Nenhuma autorização ampla de editar outra ficha foi criada. Um mestre que não é dono continua dependendo de uma regra explícita no servidor; a definição de aplicação em outra ficha permanece pendente.
- Compartilhamento v2 de fichas/perfis e o vínculo das conjurações antigas continuam no lote de integração. Esta entrega não comprova operação com dois jogadores reais nem fecha todos os problemas de autorização do produto.
- Não desfazer a correção restaurando um guard permissivo para fazer uma tela funcionar. Se faltar acesso legítimo, definir uma política específica e testá-la.
- Nenhuma alteração nas regras personalizadas de 20 natural, Ataque Especial, custos, DT, descanso ou combate com revisão.
- Tipos, build de produção e os 11 testes novos passaram. O arquivo novo de teste passou no lint; o hook tem os mesmos 13 erros preexistentes de lint (comparados com HEAD, sem aumento). O lint global já falhava antes desta entrega (456 erros/161 avisos). O build mantém os avisos antigos de bundles/Browserslist. Esta rodada rodou os testes específicos; os 2.906 testes da suíte completa pertencem ao baseline anterior.

## Como testar

1. Aplicar migrations em ambiente de testes e executar o SQL de teste com a ficha QA disponível; verificar que o rollback não deixa fixtures.
2. Executar o teste do hook: as nove operações devem retornar false e mostrar erro quando o servidor não confirma a linha.
3. Abrir a própria ficha e histórico; verificar recursos e acesso. Testar vínculos de campanha por identidade em ambiente controlado antes de ampliar autorização.
4. Consultar `pg_policies`: guards RESTRICTIVE e políticas específicas preservadas. Não usar apenas o estado da tela para validar isolamento.
