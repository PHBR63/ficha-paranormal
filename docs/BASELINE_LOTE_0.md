# Lote 0 — baseline, fluxos e contratos

Data: 06/10/2026. Escopo: leitura do código, GitHub, Lovable Cloud e ficha QA; verificações locais. Nenhuma alteração de regras, dados da conta, políticas ou publicação.

## Versão e evidências

- Branch local `codex/regras-rituais`, HEAD `06dcc1e0fe6b3ca6758356a310010414dd6a1b63`.
- GitHub main e Lovable: `fdbf92f7b6cf3074a79f4c4d35ae71e9f22ed14b`. O diff de conteúdo entre esse merge e o HEAD local é vazio.
- Projeto confirmado pela conexão PHZF: Ordem Roll, `166ab2c8-39e3-4384-851c-154cbc88eece`; banco habilitado, stack Supabase gerenciada pelo Lovable.
- Evidências anteriores V01–V13: `../../../outputs/auditoria-visual/RELATORIO.md`, JSON e capturas na mesma pasta. O conteúdo auditado permanece igual. Não foram repetidas conjurações nem débitos para esta conferência.
- Evidências novas: `../../../outputs/lote-0/`: catálogos `schema.json`, `policies.json`, `access.json`, `functions.json`, `integrity.json`, `migrations.json`, `realtime.json`, `rpcaccess.json`, `qa.json`, `related.json`, logs e resultados dos checks, `condicoes-ui.txt` e `condicoes-ui.jpg`.

Os JSONs remotos contêm somente o catálogo e os vínculos contados das fichas QA; não contêm credenciais. A inspeção administrativa do catálogo não equivale a testar o aplicativo com duas contas reais.

## Achado novo S01 — isolamento de dados comprometido

Prioridade crítica, antes do lote 1. Confirmado no catálogo remoto e nas migrations locais.

As políticas `Block anonymous ...` são **PERMISSIVE**, com condição `auth.uid() IS NOT NULL`. Elas se somam por OR às políticas de proprietário. Portanto, não limitam o acesso à própria ficha: qualquer identidade autenticada satisfaz a alternativa ampla.

| Estrutura inspecionada | Permissão ampla confirmada | Efeito |
| --- | --- | --- |
| `characters` | SELECT, INSERT, UPDATE e DELETE com identidade autenticada | As políticas de proprietário não isolam leitura e alterações. |
| `character_change_history` | SELECT autenticado | A leitura não fica limitada ao dono. INSERT e DELETE têm regras específicas, não a mesma abertura de SELECT. |
| `campaign_ritual_casts` | SELECT autenticado | A leitura não fica limitada à campanha. INSERT exige autoria e membro/mestre v1, mas não valida propriedade do personagem nessa política. |
| `character_sustained_rituals` | SELECT autenticado | A leitura não fica limitada ao autor. INSERT/UPDATE/DELETE possuem regras por autor. |
| `campaign_combat_state_v2` | SELECT para membro/mestre; escrita direta não concedida | Contrato mais restrito preservado; gravação via RPC autorizada. |

RLS está habilitado nas cinco tabelas. Os grants das tabelas antigas incluem operações amplas; é a combinação de grants com políticas que deve ser corrigida. A regra permissiva abrangente não pode ser usada como autorização implícita para uma operação do mestre.

Origem local: migration `20251223145032_4df64fa8-373e-4df7-9660-e2fd06e1c2e7.sql`. A migration `20260602174507_de31bdb6-c9cc-4074-b752-ca388350fdc8.sql` remove regras DML amplas de outras tabelas, mas deixa as de `characters` e as leituras acima. Não foi encontrada divergência remota que explique o problema: ele também existe na definição local.

**Entrega adicional necessária S0:** revisar políticas amplas em todas as tabelas atingidas pela migration, explicitar dono/membro/mestre/admin e visibilidade, preparar migration pequena sem apagar dados, testar a matriz de identidades e negar operações fora da campanha. A política pretendida para alterações de outros jogadores ainda precisa ser definida. Não conceder ao mestre acesso irrestrito a fichas por conveniência.

Não foram consultados registros de terceiros nem efetuadas gravações para explorar a falha. O alcance acima deriva das expressões, do tipo das políticas e dos grants confirmados.

## V09 — condição omitida identificada

A ficha `TESTE CODEX QA` contém no servidor `conditions: ["Machucado", "Vulnerável"]`, PV 28/28 e PE 4/4. A ficha de rituais continua PV 26/26 e PE 18/28, sem condições. Os recursos não foram alterados neste lote.

`parseCondition` transforma a string legada apenas com minúsculas e remoção de espaços. `Vulnerável` vira `vulnerável`, enquanto a chave em `conditions-data.ts` é `vulneravel`. Os gerenciadores desktop e mobile retornam `null` quando a chave não é encontrada. O contador usa o comprimento do array, por isso mostra 2 e a lista desktop mostra somente Machucado. Reproduzido novamente no navegador e confirmado com consulta somente leitura.

Contrato do lote 3: resolver nomes legados por uma função compartilhada, preservando dados e duração/contador de objetos; nomes desconhecidos devem continuar visíveis com indicação de reconhecimento pendente. Não apagar nem converter silenciosamente uma condição desconhecida. Normalizar também antes do cálculo dos efeitos; apenas corrigir a renderização pode deixar a penalidade ausente.

## Rotas e comunicação efetiva

`App.tsx` monta `CharacterSheet` em `/character/:id` e `CampaignShell` em `/campaigns/:id`, ambas protegidas. `CampaignView` não é a página de campanha montada nessa rota. A ficha escolhe `MobileCharacterSheet` por `useIsMobile`; testar uma implementação desktop isolada não valida o mobile.

| Intenção/origem ativa | Tela, componente e hook | Serviço/armazenamento e retorno atual |
| --- | --- | --- |
| Atributo, perícia e rolador desktop | `CharacterSheet` → `DiceRollModal` → motor `dice-roller` → `handleRollComplete` | Resultado em `rollHistory` local (até 50); `DiceRollHistory` renderiza. Sem tabela de histórico de dados. |
| Iniciativa desktop | `TrackCombatBonusesBar` → `useInitiativeRollWithSUE` → `onInitiativeRoll` → mesmo callback | Resultado inclui fontes/bônus; apresentação atual omite `otherBonuses`. |
| Ataque desktop | `CombatWeaponsTable` → `CombatRollModal` → `onRollComplete` → mesmo callback | Histórico recebe ataque; não considerar esse callback um registro completo do dano/aplicação. |
| Atributo, perícia, iniciativa mobile | `MobileOverviewTab`/`MobileSkillsTab` → configuração em `MobileCharacterSheet` → `MobileDiceRollModal` | Callback adapta dados para `addRoll`; `useRollHistory` grava chave global `roll_history`, até 50, sem identidade da ficha. |
| Ataque mobile | Ficha → `MobileCombatRollModal` → `onRollComplete` → `addRoll` | Adaptação registra ataque e bônus agregado; perde detalhamento de fontes. |
| Preparação/conjuração desktop | `RitualCastModal` → `handleCastRitual` | `debitCharacterPE` confirma `characters.pe_current` com comparação de saldo; depois estado/histórico de sessão, sync de campanha quando encontrado e `logCharacterChanges`. Não há transação única de débito+log+efeito. |
| Preparação/conjuração mobile | `MobileRitualCastModal` → `handleConfirmRitualCast` | Mesmo serviço de débito; registra sessão e `character_change_history`. O modal abre seu próprio wizard com callbacks opcionais não fornecidos pela ficha. |
| Cálculo/aplicação de ritual desktop | `RitualEffectWizard`, `RitualDamageModal`, `RitualConditionModal`, `ResistanceCheckModal` | Dano/PV temporários somente feedback; cura altera estado local e cria builder Supabase sem aguardar execução; condições do wizard ignoram o erro. O modal separado de condições verifica erro. Não generalizar o defeito para todos os handlers. |
| Cálculo/aplicação de ritual mobile | Wizard interno de `MobileRitualCastModal`; resistência em `MobileResistanceCheckModal` | Conclusão pode ocorrer sem callback de aplicação. Resistência mostra resultado, não grava evento completo de aplicação. |
| Wizard mobile separado da ficha | `MobileRitualEffectWizard` montado com `handleWizardApply*` | Handlers apenas toasts. `handleOpenWizard` não tem chamada encontrada fora da própria declaração; não usar esse caminho como correção do wizard interno ativo. |
| Sustentação | Fichas → `useSustainedRituals` | `character_sustained_rituals` persiste e publica realtime. Reutilização depende de ligar a ativação real; um toast não chama o hook. |
| Buffs de armas | Wizard desktop → `addWeaponBuff`/`useWeaponBuffs` → `handleWeaponBuffsChange` nas duas fichas; `useCombatWeaponBuffs` disponível para combate | Persistência existente em `characters.active_buffs`. Reutilizar esse contrato e conferir retorno/duração antes de propor tabela paralela; montagem do wizard mobile ainda não garante ativação. |
| Histórico de edição | Ficha desktop/mobile → `CharacterHistoryPanel` | SELECT `character_change_history` por personagem, limite 100; query lança erro, mas interface usa apenas dados/loading. Helpers de gravação registram erro no console. |
| Conjurações compartilhadas | Fichas → `useCampaignRitualSync` | Busca `campaign_members`/`campaigns` v1 e sessão `in_progress`; INSERT e realtime em `campaign_ritual_casts`, até 50, sem deduplicação. Erro não altera o resultado de sucesso do débito anterior. |
| Dados e chat da campanha ativa | `CampaignShell` → `useCampaignData`/`useCampaignRealtime` → `ChatTab`; rolador v3 → `handleDiceRoll` → `sendMessage` | Contexto escolhe v2 e fallback v1. Mensagens/sessões usam `campaign_messages_v2`/`campaign_sessions_v2` ou equivalentes v1. Dados privados usam metadata `hidden`; não equivalem automaticamente ao feed antigo de rituais. |
| Ajuste de PV pelo mestre | `ChatTab` → callback `CampaignShell` → `useMasterActions.adjustHP` | Leitura de recurso atual, UPDATE `characters`, retorna boolean; restrição de mestre no cliente não substitui autorização do servidor nem controle de concorrência. |
| Combate persistente | `CampaignShell` → `useCampaignCombat` → `campaign-combat-service` → `campaign_combat_state_v2`/`save_campaign_combat_v2` | Banco valida mestre, payload e revisão; retorna estado confirmado ou conflito `40001`. Preservar. |

`useRitualCast` em `hooks/character` não tem consumidor runtime encontrado pela busca de chamadas; o exemplo do próprio arquivo não prova uso. Não centralizar correções nesse hook sem primeiro ligar as telas ativas.

## Schema remoto versus contratos locais

- `campaign_ritual_casts.campaign_id` referencia `campaigns`, e `session_id` referencia `campaign_sessions`; não aceita automaticamente uma campanha v2. `useCampaignRitualSync` confirma o mesmo contrato v1.
- `campaign_combat_state_v2.campaign_id` referencia `campaigns_v2`. A RPC remota possui validação de identidade, tamanho, formato, participantes únicos e revisão correspondente à migration local; EXECUTE para authenticated, sem grant anon/PUBLIC encontrado.
- Realtime: as três tabelas de rituais compartilhados, sustentação e combate estão na publicação consultada. `characters` e `character_change_history` não apareceram nessa publicação. O hook de broadcast de recursos não substitui persistência nem habilita publicação SQL.
- As duas fichas QA têm zero vínculos em `campaign_members` e `campaign_members_v2`. Não foi testado nesta rodada um evento de ritual originado por jogador vinculado a campanha v2.
- Foram encontradas tabelas existentes de edição, condições e sustentação, mas nenhuma tabela canônica de rolagens ou aplicações identificada na busca de tabelas relacionadas. `character_active_conditions` é uma estrutura separada de `characters.conditions`; o gerenciador ativo não deve ser migrado para ela por suposição.
- Ledger remoto: migration de combate `20261005183000` presente. Diversas migrations antigas possuem versão remota um segundo anterior ao nome local; o nome está vazio. Não classificá-las como ausentes só pela diferença numérica nem reaplicá-las. Comparação deste lote cobre tabelas/políticas/FKs/RPC envolvidas, não todos os objetos do banco.

## Matriz dos achados e reprodução

| ID | Evidência verificável e cenário de reprodução | Próximo lote |
| --- | --- | --- |
| V01 | Captura anterior `desktop-rolagem.jpg` + fonte atual do histórico; iniciativa 17 + 5 + 5 apresenta total 27 com somente um +5. | 3 |
| V02 | Captura/auditoria anterior de reload + `useState` atual; rolar, recarregar, conferir perda do histórico desktop. | 1/4 |
| V03 | Capturas mobile das duas fichas + chave global atual; trocar de ficha e conferir mesmos registros. | 1/4 |
| V04 | Capturas de sessão vazia e três registros de edição; abrir ambas as listas e comparar escopo. | 1/4 |
| V05 | Capturas 360/390 e medidas anteriores + linha de botões atual; conferir editar e subir NEX sem corte. | 2 |
| V06 | Preparações desktop/mobile anteriores + opções desabilitadas atuais; Decadência com NEX 20 deve informar requisito. | 2 |
| V07 | Captura de foco anterior + triggers atuais; testar clique/toque e teclado na ajuda de DEF/efeitos. | 2 |
| V08 | Auditoria de nomes/abas anterior + componentes atuais; verificar nomes acessíveis e foco. | 2 |
| V09 | Banco e navegador conferidos novamente; Vulnerável legada não aparece na lista com contador 2. | 3 |
| V10 | Capturas de sobreposição anteriores + montagem atual Ajuda/SUE; testar áreas de ações em 360/390. | 2 |
| V11 | Ligações atuais do modal/wizard mobile; teste futuro com callback ausente deve terminar como calculado/manual, nunca aplicado. Não foi debitado PE para explorar isso. | 1/5 |
| V12 | Handlers atuais desktop; teste de aplicação com retorno de erro deve preservar valor confirmado e não dar sucesso. Falha não foi provocada em produção. | 1/5 |
| V13 | Query e helpers atuais; teste com rejeição de leitura/gravação deve distinguir erro de vazio e permitir nova tentativa. Falha não foi provocada em produção. | 1/4 |

V01–V08 e V10 reutilizam evidência visual anterior do mesmo conteúdo e a inspeção atual; não são novos testes completos nesta rodada. V11–V13 são defeitos/risco do código, com cenários definidos para testes isolados dos respectivos lotes.

## Matriz de erros e decisões

| Operação | Contrato atual | Aceite para os lotes seguintes |
| --- | --- | --- |
| Débito de PE | Compara saldo; erro/conflito lança exceção | Não continuar wizard nem repetir débito após falha; preservar custo zero. |
| Registro depois do débito | Pode falhar silenciosamente após consumo confirmado | Mostrar débito confirmado e registro pendente; retentar só registro com identidade da operação. |
| Cura/dano/condição | Confirmação inconsistente | Atualizar interface a partir do retorno confirmado; resultado manual e falha separados. |
| Histórico sem rede/permissão | Pode parecer vazio | Carregamento, vazio, erro e nova tentativa distintos. |
| Realtime duplicado/desconectado | Ritual não deduplica por ID | Deduplicar e reconciliar com registro canônico; desconexão não apaga registros. |
| Combate em duas abas | Revisão bloqueia sobrescrita | Preservar mensagem de conflito e recarregar estado; não forçar gravação. |
| Acesso fora do dono/campanha | S01 permite alcance amplo | Corrigir servidor e provar negação com testes por identidade, além dos controles de tela. |

Decisões preservadas: regra personalizada de 20 natural; Ataque Especial; custos 1/3/6/10 e zero explícito; Deflagração 3d10 × 10; DT corrigida; combate sincronizado com revisão. Descanso permanece fora do ajuste.

Pendentes para lotes 4/5: persistência de rolagens/conjurações fora de campanha; quem confirma aplicação em outra ficha; alvo; cancelamento/estorno após débito; exclusão/retenção de histórico. As propostas do plano continuam propostas. Autorização de testes/publicação não resolve automaticamente essas regras de negócio.

## Checks de referência

| Verificação | Resultado final |
| --- | --- |
| Tipos (`tsc`, configuração app, inclui testes) | PASS, saída 0. |
| Build de produção | PASS, saída 0; avisos de tamanho de bundles e Browserslist antigo registrados no log. |
| Vitest completo | PASS, saída 0; 2.906 testes em 90 arquivos. |
| Lint completo | FAIL, saída 1; 456 erros e 161 avisos preexistentes, sem alterações runtime neste lote. |

Resultados com horários e códigos de saída em `outputs/lote-0/*-result.json`. O lint continua um débito explícito e não deve ser reportado como aprovação global.

O primeiro grupo de comandos foi interrompido pelo encerramento do executor; seus logs parciais não valem como sucesso. A execução registrada pelo runner grava início, fim e código de saída de cada verificação. Os quatro arquivos de snapshots gerados foram movidos para `outputs/lote-0/generated-snapshots`, preservando os diretórios de origem. A rodada completa escreveu 89 snapshots adicionais aos já gerados na tentativa parcial; geração não equivale a aprovação visual.

## Encerramento e próximo passo

Lote 0 concluído como diagnóstico e baseline; o sistema ainda não está corrigido nem validado integralmente. O mapa e a inspeção tornam os próximos lotes executáveis sem escolher código legado por suposição. S01 exige uma entrega de contenção de segurança antes do lote 1; sua preparação deve preservar operações legítimas e depende de matriz explícita de autorização. As decisões dos lotes 4/5 não bloqueiam correções de rótulos, ajuda, apresentação e condições. Testes de falhas simuladas de aplicação e de duas identidades, novas migrations e publicação pertencem às entregas seguintes.
