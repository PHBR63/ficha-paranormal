# Encerramento de cenas — opção 2

Atualização: a etapa de [origem e expiração de efeitos](EFEITOS_ORIGEM_E_EXPIRACAO_CENA.md)
agora cobre novas condições e bônus de ritual com origem comprovada em v2.
As limitações descritas abaixo referem-se à entrega inicial do limite de cena.

Decisão confirmada pelo usuário em 06/10/2026: encerrar combate também encerra
a cena; cenas sem combate são encerradas manualmente pelo mestre. Uma cena
é um limite de regras independente da sessão de jogo e da cena sonora.

## Comportamento entregue

- Campanhas v2 começam na cena 1. Iniciar combate, avançar/reiniciar rodada e
  editar iniciativa não alteram a cena.
- O mestre confirma “Encerrar combate e cena” ou, fora de combate,
  “Encerrar cena”. O servidor abre a próxima cena e salva um recibo imutável.
- Jogadores acompanham a cena/histórico; não recebem controles de encerramento.
- A confirmação aberta conserva a cena escolhida. Se outra aba encerrar a cena
  ou mudar a atividade do combate, a confirmação fica bloqueada para revisão.
- Enquanto a operação local está salvando/conferindo, o retorno Realtime não é
  atribuído a outra aba. A tela aguarda a confirmação ou informa o erro real.
- O diálogo também conserva a autoria local durante o fechamento/animação,
  mesmo quando o hook já recebeu a nova cena e liberou o indicador de gravação.
- Nenhum sucesso é anunciado antes da resposta do servidor. Resposta de rede
  incerta conserva UUID/argumentos durante a montagem do hook, bloqueia outras
  gravações e oferece conferir a mesma operação. Reabrir a página consulta o
  estado/histórico; a pendência local não é uma fila persistente de encerramentos.
- Históricos têm páginas de dez entradas, cursor por número da cena, erro
  explícito e recuperação. Atualizações da linha de combate usam o canal Realtime
  existente; online/visibilidade/subscrição recuperam o estado confirmado.
- Campanhas v1 continuam com o aviso de indisponibilidade do combate compartilhado;
  esta entrega não migra campanhas antigas automaticamente.

## Limites explícitos

Esta entrega cria o limite persistente de cena. Ainda não expira condições/bônus,
não zera contadores críticos/usos de poderes e não decreta morte ou perda da ficha
para NPC. A interface informa essas conferências manuais.

Efeitos legados podem não indicar campanha/cena de origem. A próxima etapa deve
registrar essa origem e a duração de cada nova aplicação antes de expirar efeitos
automaticamente. Não é seguro apagar todos os efeitos de uma ficha ao encerrar
uma campanha: a mesma ficha pode ter vínculos diferentes. Condições desconhecidas,
metadados, PV/PE/SAN e sustentação permanecem íntegros nesta entrega.

## Arquivos, dados e dependências

| Arquivo | Papel / recebe | Usa / retorna ou salva / consumidores |
|---|---|---|
| `supabase/migrations/20261006220000_campaign_scene_boundary.sql` | Estrutura e RPCs; UUID, campanha, revisão e indicação de combate | Helpers reais de autorização v2, estado de combate e `auth.uid()`; salva cena/recibo atomicamente; chamado pelo serviço |
| `src/services/campaign-combat-service.ts` | Acesso a dados tipado; campanha, revisão, estado, UUID/cursor | Cliente Supabase e schema de combate; consulta estado/recibos e chama RPCs; retorna snapshot/página ao hook e painel |
| `src/hooks/campaign/useCampaignCombat.ts` | Controlador único; campanha, usuário, papel e habilitação | Serviço, React e Realtime; confirma estado, conserva operação pendente e recupera conexão; usado pelo CampaignShell |
| `src/components/campaign/v3/CampaignScenePanel.tsx` | Exibe cena, confirmação e histórico; campanha/controlador/papel | Dialog/Button e QueryClient da aplicação; hook envia encerramento; serviço consulta recibos; usado por tracker/PanelTab |
| `src/components/campaign/v3/master/CombatTracker.tsx` | Combate do mestre; membros, campanha/controlador | ScenePanel e helpers de iniciativa; ações mantêm salvamento existente; usado por MasterTab e MasterMapPanel |
| `src/components/campaign/v3/tabs/MasterTab.tsx` | Encaminha campanha para tracker; recebe props do CampaignShell | Mantém controles de fichas/áudio existentes; não grava dados de cena diretamente |
| `src/components/campaign/v3/tabs/PanelTab.tsx` | Visão dos membros; campanha/controlador opcionais | ScenePanel sem permissão de encerramento; mantém dossiê e ordem de combate |
| `src/components/campaign/v3/map/MasterMapPanel.tsx` | Adaptador do tracker no painel lateral | Encaminha campanha ao tracker; usado pelo TacticalMapFullscreen |
| `src/pages/TacticalMapFullscreen.tsx` | Composição do mapa autenticado | Encaminha campanha ao MasterMapPanel para reutilizar cena/histórico no mapa |
| `src/pages/CampaignShell.tsx` | Composição autenticada, v1/v2 | Envia ID ao PanelTab; mantém uma instância de useCampaignCombat e separação por schema |
| `src/hooks/__tests__/campaign-combat-sync.vitest.ts` | Integração do controlador | Respostas adiadas, confirmação, UUID repetido, conflito, leitor/jogador e Realtime; nenhuma gravação real |
| `src/components/campaign/__tests__/campaign-scene-panel.test.tsx` | Fluxo com componentes reais | Confirmação/cancelamento, atualização concorrente, pendência e histórico paginado/com falha; serviço externo simulado |
| `supabase/tests/campaign_scene_boundary.sql` | Contratos e permissões em PostgreSQL de testes | RPCs/políticas reais, mestre/jogador/estranho/anônimo, revisão, UUID e cliente antigo; transação revertida |
| Este documento | Decisão, mapa e critérios | Referência para manutenção e próximos ajustes; não é fonte executável |

## Banco, API e segurança

`campaign_combat_state_v2` recebe `scene_number` (padrão 1) e
`last_scene_ended_at` (nulo até encerrar). A migration não encerra cenas existentes
nem altera o JSON do combate, fichas ou recursos.

`campaign_scene_events_v2` armazena operação, campanha, autor, número encerrado,
tipo de encerramento, revisão esperada e data. A combinação campanha/cena é única.
Mestre/membros têm SELECT sob RLS; escrita direta e exclusão são negadas. Não há
exclusão de histórico pela interface. Excluir a campanha mantém o comportamento
de cascata já adotado para o estado do combate.

POST `/rest/v1/rpc/end_campaign_scene_v2`: payload `p_operation_id`,
`p_campaign_id`, `p_expected_revision`, `p_end_combat`. O cliente autenticado existente
fornece headers da sessão; nenhuma credencial é registrada em código/documentação.
Retorna linha confirmada de combate, revisão e metadados da cena. Somente mestre;
revisão desatualizada recebe `40001`, UUID reutilizado com outros argumentos `23505`,
entrada/atividade incompatível `22023` e ausência de permissão `42501`.

O UUID tem bloqueio de transação e recibo imutável. Retry correto retorna o estado
atual sem encerrar outra cena. Estado/cena/recibo são gravados juntos. O salvamento
legado mantém a mesma assinatura: transição ativo → inativo também registra cena.
O auxiliar renomeado conserva validações originais e tem execução pública revogada.

## Como validar

1. Mestre inicia combate e modifica rodada: cena permanece igual.
2. Abre confirmação e cancela: combate/cena/recibo permanecem iguais.
3. Confirma encerrar combate: fica inativo, cena avança uma vez, recibo aparece.
4. Sem combate, confirma encerrar cena: avança uma vez com recibo manual.
5. Dois clientes com a mesma revisão: um confirma; o outro recebe conflito e
   atualiza o estado. Não há encerramento automático de uma segunda cena.
6. Perde a resposta e confere a operação: mesmo UUID, sem recibo/cena duplicados.
7. Outra aba encerra com confirmação aberta: botão bloqueado, exige revisar.
8. Jogador lê; jogador/estranho/anônimo não podem encerrar. Estranho não lê recibos.
9. Histórico com mais de dez cenas: carrega página anterior sem repetir registros;
   erro mostra recuperação, nunca sucesso/lista vazia falsa.
10. Conferir mobile, recarregamento, preservação de recursos/condições e aviso manual.

## Decisões do usuário

Nenhuma decisão adicional pendente para esta entrega. Livro Base v1.3, 20 natural
personalizado, descanso atual e encerramento conjunto permanecem definidos.
Ao final de cada entrega, informar explicitamente decisões pendentes ou sua ausência.
