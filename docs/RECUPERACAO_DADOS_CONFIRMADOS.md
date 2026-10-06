# Recuperação de recursos e dados confirmados

## Problema e resultado

A assinatura de atividade recuperava o histórico ao reconectar, mas não solicitava novamente os recursos e condições da ficha aberta. O painel da campanha aceitava respostas concorrentes sem ordenação: uma consulta antiga podia reverter uma atualização recente ou expor um erro já superado. Falhas de atualização da campanha não apareciam no container principal.

Ao reconectar ou retomar a aba visível, os dados são buscados novamente no servidor. Apenas a consulta mais recente publica dados, erro e conclusão do carregamento da campanha, nos schemas v1/v2. A tela mostra erro explícito e botão de recuperação; controles sobre o estado desatualizado ficam indisponíveis até a consulta ter sucesso. Não há regra nova, migration, biblioteca ou mudança de permissões.

## Arquivos, entradas e saídas

| Arquivo | Responsabilidade e dependências |
| --- | --- |
| `src/hooks/campaign/useCampaignData.ts` | Recebe ID da campanha e usuário. Consulta `campaigns_v2`/`campaigns`, membros e perfis via Supabase; converte condições apenas para exibição. Retorna campanha, membros, loading, isRefreshing e erro. Uma sequência invalida respostas anteriores, inclusive erros e callbacks após desmontagem. Escutado por `CampaignShell`. |
| `src/hooks/character/useCharacterActivity.ts` | Recebe ID da ficha, autenticação e filtros. Continua consultando atividades pelo serviço existente. Assinatura, retorno de conexão e retorno à aba invalidam cache da ficha e disparam `character-server-updated` com seu ID; a página ativa busca recursos/condições completos. Remove ouvintes ao sair e não notifica a ficha anterior. Fila/UUID de operações permanecem intactos. |
| `src/pages/CampaignShell.tsx` | Consome os hooks e componentes v3. Se a consulta falhar, apresenta mensagem acessível e chama `refetch` pelo botão de recuperação; desabilita o botão durante a leitura. Nenhum payload de escrita sai deste botão. |
| `src/hooks/campaign/__tests__/useCampaignDataRealtime.test.ts` | Testa eventos de atualização, retomada, desmontagem e ordenação de dados/erros com respostas controladas para v1/v2. |
| `src/hooks/character/__tests__/useCharacterActivity.test.tsx` | Testa invalidação de recursos e notificação da ficha atual na reconexão/retomada, além de preservar testes de fila, contas e históricos. |
| `src/pages/__tests__/campaign-load-recovery.test.tsx` | Renderiza `CampaignShell` com seus hooks controlados e botão real. Verifica erro, indisponibilidade de painel desatualizado, nova tentativa e retorno após sucesso. |
| `docs/RECUPERACAO_DADOS_CONFIRMADOS.md` | Documenta fluxo, impacto e critérios de aceitação. |

## Comunicação e impacto

Recursos confirmados no servidor → assinatura Realtime (ou retomada após lacuna) → `useCharacterActivity` → invalidação + evento por ID → `CharacterSheet.refetchCharacter` → ficha desktop/mobile. Feed de atividades e recuperação da fila continuam usando `character-activity-service`; o fluxo não cria gravações de recursos.

Campanha → `useCampaignData.refetch` → consultas autenticadas existentes → validação do contexto/ordem da consulta → membros adaptados → `CampaignShell` e abas. Erro → mensagem → nova leitura → controles liberados após sucesso. Uma falha antiga não substitui dados nem erro da consulta mais recente.

Nenhum registro existente é regravado. RLS continua responsável pela autorização; filtro de interface não amplia acesso. Um botão de recuperar apenas lê. Dados desconhecidos de condições permanecem armazenados e são tratados pela serialização existente.

## Como testar

1. Abrir ficha QA e campanha em duas abas; ajustar SAN na campanha e conferir a ficha sem recarregar. Voltar ao painel e conferir recurso, condição e histórico.
2. Interromper somente a rede da aba da ficha, alterar SAN em outra aba, restaurar rede e conferir recurso/condição/histórico após reassinatura.
3. Simular duas consultas de membros: a segunda retorna primeiro. A primeira não deve reverter PV/SAN/PE ou restaurar um erro antigo; executar para v1 e v2.
4. Simular falha de leitura da campanha já carregada. Conferir aviso e botão; uma nova tentativa bem-sucedida reabre o painel, sem apresentar sucesso de gravação.
5. Trocar ficha/desmontar durante consulta e depois entregar callbacks antigos. Não atualizar contexto anterior. Repor a ficha QA e manter o histórico.

Uma sessão em duas abas comprova sincronização entre superfícies; não substitui UAT com mestre e jogador de contas diferentes. Cenas, durações e consequências narrativas continuam no escopo manual vigente.
