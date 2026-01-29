
Contexto (o que a gente já sabe e o que o código confirma)
- O erro “Minified React error #185 (Maximum update depth exceeded)” está acontecendo ao clicar no card da campanha e tentar abrir a CampaignView.
- No estado atual do código, a CampaignView tem um useEffect “principal” que:
  - chama fetchCampaignData()
  - chama fetchActiveSession()
  - cria canais de realtime (subscribeToMessages/subscribeToSessions)
  - depende de [id, user]
- O AuthContext recria a referência do objeto user com frequência (ex.: onAuthStateChange e getSession), mesmo quando o user.id é o mesmo. Isso torna o dependency array [user] instável e pode disparar novas execuções do effect (com novas subscrições e novos setState) repetidamente.
- Além disso, várias funções importantes em CampaignView são declaradas inline (não memoizadas) e são passadas para filhos como props (onMemberUpdate, onSessionUpdate, onRemoveMember, etc.). Mesmo quando um filho “parece” inocente, basta existir qualquer useEffect em algum nível que dependa dessas callbacks para virar um loop: render -> nova referência -> effect -> setState -> render…

Objetivo do patch (correção “definitiva” e consistente)
1) Estabilizar as dependências do effect principal da CampaignView (usar userId em vez do objeto user).
2) Memoizar com useCallback TODAS as funções que:
   - entram em dependency arrays de useEffect
   - são passadas como props para componentes filhos
   - são usadas em handlers de realtime que podem ser recriados
3) Garantir que canais realtime não sejam recriados por mudanças irrelevantes de referência (user objeto) e que sejam sempre limpos corretamente.
4) Fazer um “limpa-imports” de ScrollArea que ficaram sobrando (principalmente onde já foi migrado para overflow nativo), para reduzir ruído e evitar carregar código desnecessário.
5) Ajustar o hook de presença para depender de userId (string estável) e não de user inteiro.

Arquivos que vamos revisar/ajustar (escopo “campanha completa”, sem inventar regra/mecânica)
- src/pages/CampaignView.tsx
  - Introduzir const userId = user?.id
  - Trocar enabled do presence para !!id && !!userId
  - Memoizar:
    - fetchCampaignData
    - fetchActiveSession
    - subscribeToMessages
    - subscribeToSessions
    - removeMember
    - handleCharacterSelect
    - quaisquer outras callbacks passadas a filhos (ex.: handlers de UI que vão para modais/painéis)
  - Atualizar o useEffect principal para depender de:
    [id, userId, fetchCampaignData, fetchActiveSession, subscribeToMessages, subscribeToSessions]
  - Garantir que fetchCampaignData use userId (em vez de user) nos guards internos.
  - Verificar se há outros useEffect que dependem de “user” ou de funções não memoizadas.
- src/components/combat/HookExecutionLog.tsx
  - Remover import de ScrollArea (está importado, mas o JSX já usa div com overflow nativo).
  - Conferir que não existe nenhum uso residual de ScrollArea no componente.
- (Revisão rápida de risco) src/components/campaign/master/MasterSheetViewer.tsx
  - Confirmar que o ScrollArea só aparece em PopoverContent estático e não é montado automaticamente no carregamento (sem abrir popover).
  - Se houver algum ScrollArea que monte sempre (ex.: lista principal), migrar para overflow nativo também.
  - Importante: aqui o maior risco é o onMemberUpdate instável alimentando useMasterActions. Com onMemberUpdate memoizado no pai, esse risco cai bastante.

Detalhamento técnico (o que exatamente muda em CampaignView.tsx)
1) Estabilizar userId e presença
- Criar:
  - const userId = user?.id;
- Ajustar useCampaignPresence:
  - enabled: !!id && !!userId
  - userId: userId || ''
  - (manter userName/userAvatar como estão; eles podem mudar, mas não devem disparar o effect principal de subscrições)

2) Memoização das funções (useCallback)
- Alterar import React:
  - de: import { useState, useEffect, useRef } from 'react';
  - para: import { useState, useEffect, useRef, useCallback } from 'react';
- Envolver as funções principais com useCallback:
  - fetchCampaignData: depender de [id, userId, toast, navigate]
  - fetchActiveSession: depender de [id]
  - subscribeToMessages: depender de [id]
  - subscribeToSessions: depender de [id, fetchActiveSession]
  - removeMember: depender do que ela usa internamente (ex.: id, toast, etc.)
  - handleCharacterSelect: depender de [id, userId, currentMember, toast] (e qualquer outro state usado)
- Observação importante: callbacks usadas dentro de outras callbacks (ex.: subscribeToSessions chama fetchActiveSession) precisam ter fetchActiveSession memoizada, senão a assinatura do canal pode “capturar” closures inconsistentes.

3) Atualizar o useEffect principal para não depender de user objeto
- Trocar:
  useEffect(() => { ... }, [id, user]);
- Por:
  useEffect(() => {
    if (!id || !userId) return;

    fetchCampaignData();
    fetchActiveSession();

    const cleanupMessages = subscribeToMessages();
    const cleanupSessions = subscribeToSessions();

    return () => {
      cleanupMessages?.();
      cleanupSessions?.();
    };
  }, [id, userId, fetchCampaignData, fetchActiveSession, subscribeToMessages, subscribeToSessions]);

4) Garantir que não há “import fantasma” / comentários desatualizados
- Na CampaignView, hoje existe um comentário “ScrollArea removido…” mas não existe import de ScrollArea no arquivo (pelo snapshot atual).
- Mesmo assim, vamos revisar o topo do arquivo e remover qualquer import realmente não utilizado (mantendo comentários em pt-br, conforme sua regra do projeto).

Como vamos confirmar que resolveu (checklist de validação)
1) Fluxo de entrada
- Ir em /campaigns (lista), clicar em “TESTE 1” e verificar se abre a rota /campaigns/:id sem crash.
2) Console
- Confirmar que não aparece mais “Minified React error #185”.
3) Realtime
- Confirmar que mensagens e sessões continuam atualizando (subscribeToMessages/subscribeToSessions funcionando).
4) Presença
- Confirmar que o indicador de conexão/online no PlayersSidebar não entra em “reconectando” sem parar.
5) Regressão de mestre
- Como você é mestre: abrir abas principais (Chat, Sessões, Mestre, Combate) e confirmar que a tela não “pisca”/reinicia e não volta para “/”.

Riscos / pontos de atenção (para não cair em outro loop)
- useCallback com dependências erradas pode congelar valores antigos (stale closure). Por isso:
  - quando a função usa id/userId/currentMember, esses valores precisam estar no dependency array do useCallback.
  - quando uma função é usada por outra (subscribeToSessions -> fetchActiveSession), a função chamada também precisa ser memoizada.
- Algumas funções do CampaignView fazem setState (setMembers, setCampaign, setMessages). Isso é esperado, mas a execução delas precisa ser “controlada” (não por re-renders infinitos causados por dependências instáveis).

Se ainda persistir depois desse patch (plano de isolamento)
- Se o #185 continuar, a próxima etapa é comentar temporariamente (apenas para diagnóstico) blocos inteiros do JSX na CampaignView para isolar qual árvore causa loop, nesta ordem:
  1) MasterSheetViewer
  2) SessionManager
  3) PlayersSidebar
  4) Componentes de combate (CombatTracker / IntegratedCombatBoard)
- Com isso, a gente identifica o filho específico que tem useEffect sensível a callback instável ou um observer/realtime que está re-subscrevendo.

Observação sobre regras Ordem Paranormal RPG
- Estas alterações são exclusivamente de estabilidade/arquitetura de React (memoização e dependências). Não mudam nenhuma mecânica, regra, valor, DT, custo de PE, Sanidade, Medo, combate, investigação, rituais ou progressão.

Entrega (o que você vai ver quando eu implementar)
- A campanha deve abrir normalmente ao clicar no card.
- O console deve ficar limpo do #185.
- O comportamento de realtime deve permanecer, mas sem re-subscrições em loop.

Arquivos-alvo finais (mínimo necessário)
- src/pages/CampaignView.tsx (principal)
- src/components/combat/HookExecutionLog.tsx (limpeza de import não usado)
- (opcional, se necessário após validação) src/components/campaign/master/MasterSheetViewer.tsx (apenas se houver ScrollArea montando automaticamente fora de popovers)

