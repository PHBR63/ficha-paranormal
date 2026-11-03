# Plano de ajustes — interface, avisos, históricos e efeitos

**Projeto:** Ordem Roll / ficha-paranormal. **Data:** 06/10/2026.
**Situação:** lote 0/S0 concluídos. Lotes 1–6 implementados e verificados no código/banco em 06/10/2026. PR #11 integrada e publicada; lote 7 passou por conferência autenticada e correções adicionais. As decisões de histórico, autorização, cancelamento e ocultação foram confirmadas pelo usuário. Contratos em [CONTRATO_ATIVIDADE_SERVIDOR.md](CONTRATO_ATIVIDADE_SERVIDOR.md) e [CLIENTE_ATIVIDADES_RITUAIS.md](CLIENTE_ATIVIDADES_RITUAIS.md).
**Base:** auditoria visual de 06/10/2026 e código `06dcc1e0fe6b3ca6758356a310010414dd6a1b63`.

## 1. Resumo e objetivo

Corrigir os 13 achados da auditoria em entregas pequenas. O usuário deve conseguir acessar as ações no celular, entender os cálculos e bloqueios, recuperar registros da própria ficha e distinguir um efeito calculado de um efeito aplicado e confirmado pelo servidor.

A correção precisa funcionar nos caminhos desktop e mobile realmente montados pelas páginas. A existência de um componente ou de um teste isolado não comprova que o fluxo ativo o utiliza.

**Ordem:** conferir contratos → corrigir isolamento de dados no servidor (S0) → conter informações incorretas → corrigir acesso e ajuda → explicar resultados e condições → persistir históricos → aplicar efeitos com confirmação → integrar campanha → validar e publicar.

### Regras já decididas que devem ser preservadas

- Regra personalizada de 20 natural: o total continua precisando alcançar DT/Defesa; margem crítica ampliada depende do acerto. Não substituir essa regra pela versão padrão do livro.
- Ataque Especial continua +5 por 2 PE na faixa inicial, com a progressão atual.
- Custos base dos rituais: 1/3/6/10 PE; custos adicionais, reduções, opções personalizadas e custo explicitamente zero seguem os contratos já corrigidos.
- Deflagração de Energia: 3d10 × 10; preservar representação dos dados e multiplicador.
- DT de resistência do conjurador: 10 + limite de PE + PRE + bônus aplicáveis; manter DT explícita do efeito quando definida.
- Combate da campanha permanece no servidor, com sincronização e proteção contra sobrescrita entre dispositivos.
- Não alterar regras de descanso durante estes ajustes. A escolha entre a regra atual e interlúdio do livro continua uma decisão separada.

### Escopo e limites

Inclui V01–V13: apresentação dos bônus; históricos; controles responsivos; tooltips e nomes acessíveis; requisitos; condições desconhecidas; confirmação e registro de efeitos; erros; integração entre os fluxos de campanha envolvidos.

Não inclui redesenho geral, troca de stack, migração completa das campanhas antigas, novas regras de classe, interpretação de todo ritual ainda não suportado, alteração de regras personalizadas ou dependências novas. Quando o motor não resolver um efeito, a interface deve identificá-lo como resolução manual, em vez de prometer automação.

### Decisões confirmadas pelo usuário (06/10/2026)

| Decisão | Proposta | Momento de definição |
| --- | --- | --- |
| Persistência de dados e rituais fora da campanha | Históricos no servidor por usuário/personagem; sessão é filtro. A autorização anterior para persistir combate não decide automaticamente todos os históricos. | Antes de criar as migrations do lote 4. |
| Quem aplica efeito em outra ficha | Confirmado: jogador aplica na própria ficha; mestre nas fichas realmente vinculadas à sua campanha. | Antes de definir permissões do lote 5. |
| Alvo e resolução manual | Alvo explícito, sem escolher automaticamente o conjurador. Fora de campanha: própria ficha ou resultado manual informado. Alvos externos não vinculados permanecem resolução manual. | Antes do contrato de aplicação do lote 5. |
| Cancelamento depois do consumo de PE | Registrar conjuração com efeito pendente; não debitar novamente ao retomar. Estorno somente como operação explícita, autorizada e registrada. Não definir uma nova regra de reembolso por acidente. | Antes do lote 5. |
| Ocultar e excluir históricos | Confirmado: ocultação por usuário no servidor, com recuperação; nenhum registro excluído canônico. A exclusão permanente e sua retenção exigem especificação própria. | Antes de alterar a ação Limpar nos históricos persistidos. |

As propostas são escolhas a validar, não mudanças já autorizadas de regra de negócio. Enquanto faltarem definições, avançam as correções de apresentação e os testes dos contratos existentes.

## 2. Arquivos e responsabilidades

Os caminhos abaixo são relativos à raiz do repositório. Os nomes dos arquivos novos são propostas, a confirmar após revisar reutilização e padrões existentes.

| Arquivos existentes | Papel no ajuste, entradas e saídas |
| --- | --- |
| `src/pages/CharacterSheet.tsx` e `src/components/character/MobileCharacterSheet.tsx` | Integrar hooks/serviços compartilhados nas telas ativas. Recebem personagem, autenticação e contexto de campanha; enviam intenções de rolagem/conjuração/aplicação; mostram estado confirmado. Remover lógica duplicada somente nas responsabilidades tocadas. |
| `src/components/character/mobile/MobileOverviewTab.tsx` | Organizar ações do resumo; recebe personagem e callbacks. Não deve fazer gravação de recursos nem calcular regras adicionais. |
| `src/components/character/CharacterSheetHelp.tsx`, `src/components/character/mobile/MobileSUEDebugPanel.tsx` | Reposicionar Ajuda/SUE e verificar onde o painel técnico é montado. Preservar acesso diagnóstico autorizado, sem obstruir ações ou NEX. |
| `src/components/campaign/v3/CampaignNavigation.tsx` e `src/components/character/mobile/MobileTabNavigation.tsx` | Rótulos visíveis/acessíveis e navegação responsiva; enviam seleção de aba. |
| `src/components/character/RitualCastModal.tsx`, `src/components/character/mobile/MobileRitualCastModal.tsx` e `src/components/character/RitualCard.tsx` | Apresentar resultado da validação, custo, modificadores, requisitos e prévia de PE. Confirmar preparação somente pelo contrato do serviço. |
| `src/hooks/useRitualValidation.ts` e `src/lib/rituals/ritual-casting-engine.ts` | Manter cálculo e validação existentes como origem dos motivos de bloqueio; evitar copiar requisitos em textos divergentes. |
| `src/lib/dice-roller.ts`, `src/hooks/sue/useInitiativeRollWithSUE.ts` e demais hooks de rolagem usados | Preservar resultados e fontes existentes. A adaptação para exibição deve incluir `skillBonus`, `otherBonuses`, fontes SUE e modificadores manuais sem duplicação. |
| `src/components/dice/DiceRollHistory.tsx` e `src/components/character/mobile/MobileRollHistory.tsx` | Mostrar o mesmo contrato de registro em desktop/mobile. Recebem entradas, filtros, estados e ações de paginação; não calculam novamente a rolagem. |
| `src/components/character/RitualCastHistory.tsx` e `src/components/character/mobile/MobileRitualCastHistory.tsx` | Mostrar conjuração, PE, aprimoramentos, resultado e situação de aplicação; sessão é contexto/filtro, não a única memória. |
| `src/components/character/CharacterHistoryPanel.tsx` | Manter leitura dos registros antigos; apresentar carregamento, vazio e erro distintos; invalidar consulta após gravação confirmada. Separar acesso a dados da renderização ao tocar essa responsabilidade. |
| `src/lib/conditions/condition-serialization.ts`, `src/components/character/ConditionManager.tsx` e `src/components/character/mobile/MobileConditionManager.tsx` | Ler formatos antigos e atuais, preservar duração/contador, tratar nomes não reconhecidos e alinhar lista/contador. Não eliminar dados desconhecidos. |
| `src/services/character-pe-service.ts` | Preservar a confirmação de débito e a comparação com saldo anterior já existentes. Evoluir por um adaptador compatível se o débito passar a integrar uma operação transacional. |
| `src/components/character/RitualEffectWizard.tsx` e `src/components/character/mobile/MobileRitualEffectWizard.tsx` | Apresentar cálculo e etapas; aplicação deve retornar uma Promise com resultado confirmado ou erro. Conclusão precisa distinguir conjuração e aplicação. |
| `src/hooks/useCampaignRitualSync.ts`, `src/hooks/campaign/useCampaignData.ts`, `src/pages/CampaignShell.tsx` e `src/components/campaign/v3/tabs/ChatTab.tsx` | Identificar contexto/schema, atualizar feeds ativos, deduplicar eventos e abrir detalhes/aplicação autorizada. Não assumir que a integração antiga atende o painel atual. |
| `src/hooks/useSustainedRituals.ts`, `src/hooks/combat/useCombatWeaponBuffs.ts` | Verificar reaproveitamento para sustentação e buffs antes de criar armazenamento paralelo. |
| `src/integrations/supabase/types.ts`, `supabase/migrations/` e `supabase/tests/` | Tipos, migrations aditivas, permissões e testes do armazenamento/operações novas. Verificar o banco remoto antes de assumir que uma migration local já está aplicada. |

**Novas unidades propostas, somente quando necessárias:**

- `src/types/character-activity.ts`: contrato versionado de registros, resultados e estados. Recebe dados brutos validados; mantém campos opcionais para compatibilidade com registros antigos.
- `src/lib/roll-history-presentation.ts`: adapta resultados dos motores para dados, fontes, modificadores e total explicável. Função pura; sem Supabase ou estado de interface.
- `src/services/character-activity-service.ts` e `src/hooks/character/useCharacterActivity.ts`: consulta paginada e registro confirmado; hook integra cache, filtro por ficha e atualizações. Nenhuma decisão de regra dentro da tela.
- `src/services/ritual-application-service.ts` e `src/hooks/character/useRitualApplication.ts`: valida pedido, chama operação autorizada, trata conflito e devolve resultado confirmado. Não recriar o cálculo do ritual.
- Ajuda compartilhada com os componentes Radix já instalados, caso o padrão de informação por clique/foco se repita. Evitar abstração para um único caso.

## 3. Fluxo e contratos propostos

### Exibição de rolagens

Motor existente → resultado preservado → adaptador de apresentação → registro → histórico desktop/mobile.

O adaptador nunca usa uma nova rolagem aleatória. Distingue dados descartados/selecionados, modificadores numéricos, penalidade de quantidade de dados e multiplicadores de dano. Um dado adicional não é exibido como bônus numérico.

Exemplos de aceite: iniciativa `17 + 5 treinamento + 5 Iniciativa Aprimorada = 27`; penalidade `17 + 5 − 2 = 20`; Deflagração deve explicar `(soma de 3d10) × 10`, sem fingir 30 dados.

Quando um registro antigo não possui detalhamento das fontes, mostrar Bônus agregado/Detalhamento indisponível. Não inventar atribuições retroativas.

### Gravação e leitura dos históricos

Tela → hook → serviço autenticado → banco → retorno confirmado → cache → histórico/feed.

Identidade do autor vem da sessão autenticada no servidor; usuário/personagem/contexto não podem ser aceitos apenas porque o cliente os enviou. Filtros de tela não substituem permissões no banco.

Campos mínimos do registro: ID, versão, personagem de origem, autor, horário do servidor, categoria, vínculo de campanha/sessão quando houver, identificador da operação, visibilidade e resultado estruturado. Conforme o tipo: dados, seleção, fontes de bônus, total, DT/Defesa, sucesso, margem/multiplicador, ritual/aprimoramentos/modificadores, PE antes/depois, alvo e referência de aplicação. Valores desconhecidos antigos permanecem ausentes, sem completar dados fictícios.

Estados de interface: carregando; vazio confirmado; registros carregados; salvando; salvo; falha de carregamento; falha de registro; resultado local sem confirmação. Filtro e paginação devem informar o alcance da lista.

**Proposta de banco a validar no lote 0:**

| Estrutura | Uso e impacto |
| --- | --- |
| `character_change_history` existente | Continuar leitura do legado. Não apagar/regravar registros existentes. Revisar políticas/índices atuais antes de estender. |
| `campaign_ritual_casts` existente | Está vinculado por FK a campanhas/sessões antigas. Não enviar IDs v2 para essas FKs. Verificar consumidor e compatibilidade antes de reaproveitar. |
| `character_activity_events` proposta | Histórico estruturado de novas rolagens/conjurações por ficha. Evita forçar eventos sem alteração de campo na tabela de edições. Índices por personagem+horário+ID; contexto de campanha com versão explícita e vínculo validado. |
| `character_effect_applications` proposta | Registra aplicações em alvos, ligadas ao evento de origem. Chave única de operação impede reaplicar o mesmo efeito. Permite diferenciar cálculo e alteração de ficha. Criar somente se os contratos existentes não atenderem esses requisitos. |

Para campanhas v1/v2, validar a combinação versão/ID no servidor. Não criar FK genérica apontando para uma só versão nem fundir registros por UUID coincidente. Escolher a representação mais simples após a inspeção, documentando integridade e consulta.

Migrations aditivas: colunas opcionais ou novas tabelas, RLS, índices e funções; nenhuma mudança destrutiva em fichas ou campanhas. Registros estruturados antigos só podem ser importados por IDs confiáveis, de forma idempotente e mantendo origem. Manter a leitura do legado até concluir a comparação de contagens e conteúdo.

### Conjuração e aplicação de efeitos

Preparar → validar custo/requisitos → confirmar conjuração e PE → registrar ID da conjuração → calcular efeito/resistência → selecionar alvo permitido → prévia da alteração → aplicar no servidor → apresentar resultado confirmado.

Separar duas operações: **conjurar** consome PE uma vez; **aplicar** usa o ID já confirmado e não cobra novamente. Fechar o assistente não equivale a desfazer uma conjuração.

Contrato de pedido: identificador de operação, conjuração de origem, alvo, tipo de efeito, resultado/dados necessários e versão/saldo esperado. Contrato de retorno: ID da aplicação, campos confirmados, antes/depois, versão/horário e estado. Erros padronizados: entrada inválida, permissão negada, pré-condição alterada, saldo insuficiente, indisponibilidade e resultado de gravação ainda desconhecido.

O servidor deve validar autorização, contexto, vínculo do alvo, limites e compatibilidade do efeito; não confiar num valor arbitrário fornecido pelo cliente. Caso a rolagem permaneça no cliente, distinguir integridade da gravação de validação contra manipulação da rolagem; autenticação sozinha não prova a origem de um total. Não prometer proteção adicional sem implementá-la.

Mudança de recurso e registro de aplicação devem ocorrer na mesma transação. Usar bloqueio/versão ou pré-condição para evitar perda de atualizações. Repetir o mesmo identificador após timeout retorna a operação original ou confirma ausência antes de tentar; não gerar outra cobrança. Dano em vários alvos precisa informar resultado individual e permitir repetir somente os alvos pendentes, sem aplicar duas vezes aos demais.

Não aplicar um resultado manual a uma ficha automaticamente. PV temporários, condições, buff de arma e sustentação precisam de destino/arma/duração claros. Reaproveitar regras vigentes de RD, acúmulo, resistência e duração; quando não implementadas, informar processamento manual. Sucesso parcial deve listar exatamente o que foi aplicado e o que está pendente.

## 4. Plano por lotes e critérios de aceite

### Lote 0 — baseline e contratos

**Prioridade:** pré-requisito. **Esforço relativo:** pequeno/médio.

- Reproduzir V01–V13 com evidências distinguindo tela, código e risco; verificar commit local/remoto antes da execução.
- Mapear rotas/componentes ativos, todos os produtores de rolagens/conjurações e callbacks dos assistentes.
- Verificar contexto retornado por `useCampaignData` e divergência v1/v2 em `useCampaignRitualSync`.
- Inspecionar schema, políticas e funções do banco em uso, somente leitura; registrar o que difere das migrations.
- Identificar a condição omitida da ficha QA sem apagar/alterar a entrada. Confirmada no lote 0: string legada `Vulnerável` é lida como `vulnerável`, mas o catálogo usa `vulneravel`.
- Definir decisões de persistência, aplicação e cancelamento; registrar claramente as pendentes.
- Registrar baseline de tipos, testes, build e lint. Falhas antigas devem ser identificadas, não absorvidas silenciosamente pelo novo lote.

**Aceite:** mapa tela→hook→serviço→tabela, política de acesso e matriz de erros; cada achado tem um teste de reprodução ou uma inspeção explícita ainda pendente. Nenhum fluxo legado é escolhido por suposição.

**Resultado:** tipos, build e 2.906 testes/90 arquivos passaram; lint com 456 erros/161 avisos preexistentes. Banco consultado somente em leitura. FK de rituais permanece v1, combate v2 possui RPC/revisão; as fichas QA atuais não têm vínculo com campanhas. Decisões dos lotes 4/5 continuam pendentes. Não confundir baseline concluído com regras/efeitos integralmente validados.

### Entrega S0 — isolamento de dados antes do lote 1

**Achado:** S01, crítico. Políticas `Block anonymous ...` permissivas aceitam qualquer identidade autenticada, somando-se por OR às políticas de proprietário. Confirmadas no catálogo remoto: `characters` em SELECT/INSERT/UPDATE/DELETE e leitura de históricos/conjurações/sustentação. O problema também está nas migrations locais.

- Inventariar as políticas abrangentes da migration de origem e preparar uma correção pequena, sem apagar registros.
- Definir matriz explícita dono/membro/mestre/admin para cada operação, incluindo fichas vinculadas v1/v2 e visibilidade. Não expandir poderes do mestre por suposição.
- Preservar o contrato de combate v2 e o débito de PE; retirar permissões abrangentes mantendo operações legítimas por regras específicas.
- Testar identidades distintas em ambiente controlado: proprietário permitido, usuário alheio negado, anônimo negado, mestre apenas no alcance aprovado. Não é necessário obter uma segunda conta pessoal para os testes SQL isolados.
- Validar leitura e gravação legítimas da ficha/campanha, aplicar a migration autorizada e conferir as políticas efetivas depois. A inspeção do lote 0 não aplicou essa correção.

**Aceite:** ausência das alternativas amplas confirmada no servidor, matriz de acesso testada e fluxos legítimos preservados; dados existentes intactos.

**Resultado S0:** guards de autenticação convertidos para RESTRICTIVE, mantendo 158 políticas específicas idênticas. Testes SQL com dono/mestre da fixture, identidade sem vínculo e anônimo passaram; nenhuma fixture permaneceu. Tipos e 11 testes novos do hook passaram. A matriz de permissões de aplicação em outra ficha e de compartilhamento v2 continua sendo uma entrega separada; não foi inventada para substituir a falha de isolamento.

### Lote 1 — informações honestas e isolamento imediato

**Achados:** V02, V03, V04, V11, V12, V13. **Depende:** lote 0. **Esforço:** médio.

- Rotular históricos atuais como sessão/navegador e apontar para registros persistentes existentes; retirar a impressão de que Nenhuma conjuração registrada significa nunca conjurou.
- Trocar a chave local global por escopo autenticado e personagem; limpar o estado carregado ao trocar ficha/conta antes de consultar a nova.
- Preservar registros antigos sem autoria/contexto em uma categoria Legado sem ficha identificada; não atribuí-los à ficha atual nem exibi-los automaticamente a outra conta. Não enviar esse legado ao servidor sem associação confiável.
- Desabilitar a ação Aplicar quando não houver implementação real; deixar cálculo/resolução manual disponíveis, com rótulo correto.
- Aguardar operação de cura/condições e verificar retorno/linha atualizada; não mostrar sucesso por uma Promise ausente ou por callback apenas de toast.
- Falha de gravação ou sincronização deve aparecer, mesmo quando PE já foi consumido. Repetir envio de histórico não deve repetir o débito.
- Históricos devem mostrar erro e ação de tentar carregar novamente; invalidar cache após gravação confirmada.

**Aceite:** duas fichas não compartilham novos registros locais; reload tem comportamento explicado; sem callback real não há aviso Efeito aplicado; erro de consulta não vira Nenhum registro. Estes ajustes são contenção: não contam como persistência completa.

### Lote 2 — acesso mobile, tooltips e requisitos

**Achados:** V05, V06, V07, V08, V10. **Depende:** lote 0. **Esforço:** médio.

- Reorganizar a linha de ações em grade/quebra de linha ou menu nomeado, sem perder Editar/Subir NEX. Não ocultar a ação como solução para corte.
- Nomear controles por `aria-label`/texto; manter nomes acessíveis mesmo quando o texto visual das abas fica oculto.
- Reservar posição/espaço para Ajuda e SUE; verificar barra inferior, NEX, teclado virtual e painéis abertos.
- Informação essencial em texto próximo ou botão Detalhes com popover/dialog. Tooltip é complemento: hover e foco no desktop; clique/foco na ajuda mobile.
- Separar o botão de ajuda de Processar efeitos do label que alterna o switch. Consultar ajuda não altera a opção.
- Mostrar círculo necessário/atual, descrição do aprimoramento, custo adicional, motivo da indisponibilidade e PE previsto. Apresentar erros usando a validação existente.
- Conteúdo longo deve caber em área rolável; fechamento deve estar visível, acessível e devolver foco ao acionador.

**Aceite:** todas as ações cabem e são alcançáveis em 320, 360 e 390 px; nenhum ícone crítico sem nome; ajuda abre por teclado/clique e fecha sem alterar recursos/opções; círculo bloqueado sempre tem motivo legível. Aplicar a mesma regra aos painéis da campanha tocados.

### Lote 3 — resultados explicáveis e condições preservadas

**Achados:** V01, V09. **Depende:** lote 0. **Esforço:** médio.

- Introduzir adaptador de apresentação compartilhado, incluindo bônus positivos/negativos, manual e SUE, sem somar treinamento duas vezes.
- Mostrar fórmula resumida e abrir detalhamento das fontes; total deve ser o resultado original do motor.
- Preservar dados descartados, empate, seleção menor/maior, DT, sucesso, acerto/crítico e multiplicador de dano; crítico não é sinônimo de sucesso na regra personalizada.
- Tratar condições desconhecidas com identificação e aviso Não reconhecida — efeito automático indisponível. O contador deve corresponder a todas as entradas visíveis.
- Normalizar aliases conhecidos somente por correspondências verificadas; preservar informação original, duração e contador de Morrendo.

**Aceite:** `17+5+5=27` explicável nas duas versões; penalidades aparecem com sinal correto; exibição não modifica o resultado; condição desconhecida não desaparece nem cria uma penalidade inventada.

### Lote 4 — histórico persistente por ficha

**Achados:** V02, V03, V04, V13. **Depende:** 0, 1 e 3; decisão de persistência. **Esforço:** grande.

- Implementar consulta/gravação centralizadas para rolagens e conjurações, mantendo histórico de edição como categoria legada.
- Criar somente as estruturas necessárias, com RLS, autoria derivada da autenticação, paginação por horário+ID, deduplicação por operação e atualização de cache.
- Registrar campos suficientes para reconstruir o que foi mostrado; preservar ritual/modificadores e horário no servidor.
- Desktop/mobile usam mesma consulta e filtros por tipo, sessão e período. Não criar feeds independentes com conteúdo divergente.
- Diferenciar registro local não confirmado e registro salvo. MVP offline: resultado local identificado, sem alteração de recursos e sem fila automática de aplicações.
- Recuperar lacunas de Realtime por nova consulta ao reconectar. Deduplicar entre resposta de gravação, assinatura e recarga.
- Manter Limpar com escopo explícito; não converter limpeza de uma sessão em remoção permanente de todos os registros.

**Aceite:** novo registro sobrevive a reload e aparece em outro dispositivo autenticado autorizado; ficha B não exibe dados da A; falha permite repetir o registro com o mesmo ID; consultas paginadas não perdem/duplicam itens com horários iguais; registros antigos continuam disponíveis com origem identificada.

### Lote 5 — aplicação real, transacional e registrada

**Achados:** V11, V12, V13. **Depende:** 0, 1 e 4; decisão sobre quem confirma e alvos. **Esforço:** grande.

- Criar serviço/hook compartilhado e substituir callbacks opcionais silenciosos por contratos de aplicação que retornam sucesso confirmado/erro.
- Integrar corretamente a preparação mobile com o assistente ativo; retirar duplicação de assistentes somente após confirmar equivalência de comportamento.
- Implementar operações autorizadas para cura, dano, PV temporários, condições, buff de arma e sustentação conforme o suporte já existente do motor e armazenamento.
- Custo e evento de conjuração devem ser consistentes; aplicação e alteração do alvo devem ser atômicas. Durante a transição, preservar proteção do serviço atual de PE.
- Garantir idempotência, conflito entre abas, entradas inválidas e recuperação após timeout. Não liberar uma ação que apenas gera toast.
- Apresentar prévia: alvo, resultado, reduções/resistência, antes/depois e duração/arma. Aplicar uma vez; conclusão mostra confirmado ou pendente.
- Registrar autor da aplicação separado do conjurador; feed e histórico da ficha alvo devem refletir apenas operações que o servidor confirmou e que o usuário pode consultar.

**Aceite:** aplicar muda o alvo correto e persiste após reload; falha não mostra check de aplicação; duplo clique/reenvio não duplica PE ou efeito; concorrência não perde dano/cura; nenhuma aplicação na ficha alheia sem regra de permissão validada; efeito manual é rotulado como manual.

### Lote 6 — campanha, Realtime e paridade

**Achados relacionados:** V04, V08, V11–V13 e dependência v1/v2. **Depende:** 2, 4 e 5. **Esforço:** médio/grande.

- Fazer contexto de campanha/schema/sessão chegar explicitamente aos serviços; confirmar vínculo de personagem e participante no servidor.
- Adaptar feeds e consumidores ativos do painel v3 sem assumir que `CampaignRitualFeed` antigo está montado nele.
- Integrar rolagens/conjurações/aplicações ao histórico de campanha com identidade, horário, alvo e estado. Mensagem não é prova de atualização de recurso.
- Preservar visibilidade de eventos privados/ocultos conforme as permissões atuais; não difundir resultados secretos por uma nova assinatura geral.
- Realtime atualiza leituras, nunca reaplica efeito recebido. Recarregar ao reconectar; evitar listeners duplicados e cache cruzado.
- Verificar limites de PE por turno, sustentação/duração e registro de rodada nos fluxos tocados, preservando o combate persistente existente.

**Aceite:** servidor, fichas e feed mostram a mesma operação por ID; duplicação de mensagem/assinatura não altera ficha de novo; v1/v2 não se confundem; membros sem permissão e espectadores não aplicam efeitos.

### Lote 7 — regressão, publicação e conferência remota

**Depende:** lotes aceitos; etapas de banco/serviços antes dos clientes que dependem delas. **Esforço:** médio.

- Entregar commits/PRs pequenos por lote, com problema, antes/depois, arquivos/fluxo, testes e limitação. Não combinar correção CSS com nova política de acesso na mesma alteração sem necessidade.
- Validar o contrato dos testes com TypeScript explicitamente, além de Vitest/build. Não aceitar snapshots gerados automaticamente como aprovação visual.
- Aplicar migrations compatíveis, verificar tipos/RLS/RPC/Realtime; depois publicar o cliente compatível. Falha de migration bloqueia ativação do fluxo dependente.
- Fazer conferência autenticada no app publicado: persistência, telas, erros e operações em fichas QA. HTTP 200/build concluído não comprova esse aceite.
- Comparar dados QA antes/depois, anexar evidências e fechar V01–V13 somente pelo critério correspondente.

**Aceite final:** todos os achados cobertos ou explicitamente classificados como resolução manual/decisão pendente, sem esconder pendências; nenhum problema de perda de dados, autorização ou sucesso falso liberado em fluxo ativo. Pendência relevante de aplicação bloqueia esse fluxo, sem impedir entrega dos lotes visuais aprovados.

### Cobertura dos achados

| Achado | Lotes | Evidência obrigatória para fechar |
| --- | --- | --- |
| V01 bônus omitido | 3, 7 | Fórmula com todas as fontes e total original. |
| V02 rolagem perdida | 1, 4, 7 | Aviso transitório e, após persistência, reload/outro dispositivo. |
| V03 fichas misturadas | 1, 4, 7 | Duas fichas e troca de conta sem contaminação. |
| V04 sessão vs histórico | 1, 4, 6 | Conjurações recuperadas e filtro de sessão claro. |
| V05 ações cortadas | 2, 7 | Capturas e operação em 320/360/390 px. |
| V06 bloqueio sem motivo | 2, 7 | Requisito e descrição visíveis sem hover. |
| V07 ajuda inacessível | 2, 7 | Clique/foco; consultar ajuda não altera opção. |
| V08 ícones sem nome | 2, 6, 7 | Nomes acessíveis de todos os controles tocados. |
| V09 condição omitida | 0, 3, 7 | Dado preservado, cartão visível e contagem coerente. |
| V10 sobreposição | 2, 7 | NEX, combate e barra inferior desobstruídos. |
| V11 mobile não aplica | 1, 5, 6 | Callback ativo → operação confirmada → leitura do alvo. |
| V12 sucesso prematuro | 1, 5, 7 | Falha controlada e sucesso somente confirmado. |
| V13 erro silencioso | 1, 4, 5 | Erro de consulta/registro/aplicação apresentado e repetição segura. |

## 5. Impactos, riscos e recuperação

**Dados antigos:** o armazenamento mobile global não tem autoria suficiente para associação automática. Preservar e identificar; não fabricar origem. Formatos legados de condições e histórico continuam legíveis. Não apagar entradas para fazer o contador coincidir.

**Permissões:** botões escondidos não protegem operações. Novas funções devem verificar ator, ficha, papel e campanha no servidor, inclusive chamadas fora da interface. Não expor chave de serviço no frontend. Qualquer SQL com privilégios elevados deve fixar contexto de busca e validar autorização antes de modificar dados.

**Concorrência:** atualizar um saldo lido anteriormente pode sobrescrever outra aba. Comparação de estado/versão e operações transacionais precisam cobrir HP, PE, condições e aplicações, não só desabilitar botão.

**Gravação parcialmente concluída:** erro de conexão depois do commit não significa que a operação falhou. Consultar pelo identificador antes de repetir; estado desconhecido deve ser apresentado como desconhecido.

**Publicação:** novas colunas/tabelas devem ser compatíveis com cliente anterior. Não alterar/desligar o backend Lovable em uso como parte deste plano. Manter versão de retorno documentada; ativar funcionalidades dependentes apenas depois da verificação do servidor.

**Retorno de versão:** CSS/texto/componentes podem voltar por commit. Banco deve manter migrations aditivas e dados produzidos. Em falha de aplicação, desativar a ação afetada, manter leitura e cálculo identificado como manual; não reverter PV/PE em massa nem remover eventos para imitar um rollback. Correção de ficha exige operação compensatória autorizada e registrada.

**Custo e manutenção:** usar React Query, Supabase, Radix, Zod e Vitest já presentes. Antes de criar tabela/hook/componente, confirmar por que os atuais não atendem. Separar UI, adaptadores puros, serviço e acesso a banco; não introduzir um framework novo de eventos.

## 6. Como testar e acompanhar

### Verificações de desenvolvimento

Rodar após cada lote relevante: testes focados no comportamento modificado, `npx tsc --noEmit -p tsconfig.app.json`, build e lint dos arquivos alterados. No fechamento integrado, executar `npm run test`, `npm run build` e lint geral, comparando com o baseline. O build e o Vitest não substituem a checagem de tipos.

Para mudanças de banco: testes SQL/RLS no ambiente controlado, rollback de fixtures quando possível, chamadas permitidas e negadas, migrations aplicadas e leitura dos registros produzidos. Mocks de frontend não comprovam transação ou autorização.

### Matriz mínima de comportamento

| Grupo | Cenários | Resultado esperado |
| --- | --- | --- |
| Responsividade | 320/360/390/768/943/1440 px; orientação; zoom; teclado virtual; drawer longo | Ações alcançáveis; nenhum corte/sobreposição crítica; fechamento e foco corretos. |
| Ajuda | Hover, Tab/Enter/Escape, clique; toque quando disponível | Mesma informação essencial; ajuda não modifica switch, PE ou seleção. |
| Validação | Círculo insuficiente, PE insuficiente, custo zero, redução, modificadores | Motivo claro e cálculo igual ao motor; confirmação indisponível quando inválida. |
| Dados | Atributo zero/negativo, menor/maior, empate, bônus positivo/negativo, manual e SUE | Histórico preserva dados e explica o total sem duplicar fontes. |
| Regra personalizada | 20 natural com total abaixo da DT/Defesa; margem 19 sem acerto | Falha/erro de ataque corretamente diferenciados de crítico. |
| Rituais corrigidos | Custos 1/3/6/10, Deflagração 3d10×10, DT do conjurador/DT explícita | Regressão não reintroduz fórmulas antigas. |
| Condições | String antiga, objeto atual, nome com alias, desconhecida, temporária, Morrendo | Entrada preservada; contagem e duração coerentes; efeito desconhecido não inventado. |
| História | Reload, nova aba, outro dispositivo, ficha A/B, troca de conta, filtros/paginação | Identidade/ordem consistentes; nenhum registro cruzado. |
| Falhas | Consulta, registro, PE, efeito, sessão expirada, permissão negada, timeout depois de commit | Erro correto, sem sucesso falso; repetição por ID não duplica operação. |
| Recursos | Cura até máximo, PV temporário, dano/resistência/RD conforme motor atual, PE insuficiente | Só campos/valores autorizados mudam; antes/depois confirmado. |
| Duração/buffs | Arma escolhida, efeito sustentado, nova rodada, término previsto | Vínculo/duração explícitos e coerentes com o estado salvo. |
| Concorrência | Duplo clique, duas abas, mestre e jogador, gasto/cura simultâneos | Uma operação por ID; sem perda de atualização ou saldo negativo indevido. |
| Campanha | v1/v2, sessão ativa/inativa, personagem sem campanha, multi-alvo, evento oculto | Contexto correto; sem reaplicação por Realtime; acesso e visibilidade respeitados. |

### Testes de permissão e limitação de contas

Automatizar autorização no banco com identidades sintéticas e fixtures: dono, outro jogador, mestre, espectador, não membro e anônimo. Exercitar chamadas diretas, não apenas o estado dos botões.

O usuário informou ter somente uma conta real. Duas abas dessa conta verificam concorrência/reconexão, mas não comprovam a experiência entre mestre e jogador distintos. O aceite manual entre papéis continua pendente até existir uma segunda sessão de teste autorizada; não criar conta externa nem compartilhar credenciais como solução implícita. Teste físico de toque/leitor de tela também deve ser marcado como feito ou pendente separadamente.

### Registro de entrega

Para cada lote manter: status, commit/PR, arquivos, fluxo e payload afetados, tabelas/migrations, critério de aceite, testes executados, capturas antes/depois, pendências e caminho de retorno. Não registrar um teste como aprovado porque foi apenas planejado.

**Definição de concluído:** comportamento reproduzível corrigido no caminho ativo, tipos/testes/build pertinentes aprovados, registro e recurso lidos do servidor quando aplicável, conferência na publicação correta e ausência de regressão nas regras preservadas. Até esses marcos, marcar como implementado/validado localmente/validado no servidor/publicado, conforme a evidência real.
