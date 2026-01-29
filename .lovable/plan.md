

# Plano: Reconstrução Completa do Sistema de Campanha

## Diagnóstico Confirmado

O erro **React #185** (Maximum update depth exceeded) ocorre especificamente ao abrir uma campanha (`/campaigns/:id`). A análise revelou uma cascata de instabilidades em múltiplas camadas:

### Cadeia de Problemas Identificados

```text
/campaigns/:id
  └── CampaignView.tsx
        ├── useTacticalBoard (instância duplicada pai/filho → loop Realtime)
        ├── useMasterActions (toast/onUpdate instáveis → recria callbacks)
        ├── useCampaignPresence (profile refs não estabilizados)
        ├── SessionManager (fetchSessions/subscribeToSessions não memoizados)
        └── fetchCampaignData passado como prop sem throttle
```

### Decisões de Escopo
- **Reconstruir tudo dentro da Campanha** (abas, hooks, componentes internos)
- **Recriar estrutura de dados** (tabelas e relações no backend)
- **Isolar completamente** cada módulo com interfaces limpas

---

## Nova Arquitetura Proposta

### Princípios de Design

1. **Hook Singleton Pattern**: Cada hook de dados é instanciado UMA única vez no topo e passado via props
2. **Ref-First para Callbacks**: Todas as funções externas (toast, navigate, onUpdate) são capturadas em refs
3. **Canais Realtime Estáticos**: Nomes de canal NUNCA contêm valores dinâmicos como `Date.now()`
4. **Throttle de Atualizações**: Updates em cascata são limitados a 500ms
5. **Scroll Nativo**: Componentes com updates frequentes usam `overflow-y-auto` em vez de ScrollArea

### Estrutura de Componentes

```text
CampaignView (Container Principal)
│
├── Refs Estáveis
│   ├── toastRef
│   ├── navigateRef
│   ├── fetchDataRef
│   └── updateTimeoutRef
│
├── Hooks (Instância Única)
│   ├── useCampaignData({ campaignId, userId })
│   │     └── Retorna: campaign, members, loading, error, refetch
│   │
│   ├── useTacticalBoard({ campaignId, isMaster, enabled: true })
│   │     └── Retorna: maps, tokens, activeMap, actions...
│   │
│   ├── useCampaignPresence({ campaignId, userName, userAvatar })
│   │     └── Retorna: onlineMembers
│   │
│   └── useCampaignRealtime({ campaignId })
│         └── Retorna: messages, sessions, unreadCount
│
├── Abas (Recebem dados via props, SEM hooks próprios)
│   ├── CampaignChatTab (messages, sendMessage)
│   ├── CampaignCombatTab (members, masterActions)
│   ├── CampaignBoardTab (board passado, enabled: false interno)
│   └── CampaignMasterTab (members, masterActions)
│
└── Callbacks Throttled
    └── onMemberUpdate → debounce 500ms → refetch
```

---

## Fase 1: Novo Schema de Dados

### Tabelas a Recriar

Nota: Como você confirmou que podemos recriar a estrutura, vou propor um schema limpo com RLS adequado.

| Tabela | Propósito |
|--------|-----------|
| `campaigns_v2` | Campanha com master_id, settings JSON, status |
| `campaign_members_v2` | Membros com role, character_id, joined_at |
| `campaign_messages_v2` | Chat com tipo (text/roll/system), author_id |
| `campaign_sessions_v2` | Sessões com status, started_at, ended_at |
| `campaign_maps_v2` | Mapas táticos com grid_size, background_url |
| `campaign_tokens_v2` | Tokens com position, character_id ou npc_data |

### RLS Policies

- Campanhas: SELECT para membros, UPDATE/DELETE para master
- Membros: SELECT para todos da campanha, INSERT/UPDATE/DELETE para master
- Mensagens: SELECT para membros, INSERT para membros autenticados
- Mapas/Tokens: SELECT para membros, INSERT/UPDATE/DELETE para master

---

## Fase 2: Hooks Reconstruídos

### 2.1 useCampaignData

Hook único para carregar todos os dados da campanha.

```typescript
// src/hooks/campaign/useCampaignData.ts
interface UseCampaignDataReturn {
  campaign: Campaign | null;
  members: CampaignMember[];
  isMaster: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCampaignData({ 
  campaignId, 
  userId 
}: { campaignId: string; userId: string }): UseCampaignDataReturn {
  // Usa refs para toast e navigate
  const toastRef = useRef(toast);
  
  // Fetch inicial + subscribe
  const refetch = useCallback(async () => {
    // Busca campaign + members em uma única query otimizada
  }, [campaignId]); // Deps mínimas
  
  // Realtime para members (não para campaign inteira)
  useEffect(() => {
    const channel = supabase
      .channel(`campaign-${campaignId}`) // Nome estático
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'campaign_members_v2',
        filter: `campaign_id=eq.${campaignId}`
      }, () => refetch())
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }, [campaignId, refetch]);
  
  return { campaign, members, isMaster, loading, error, refetch };
}
```

### 2.2 useTacticalBoard (Refatorado)

Com flag `enabled` obrigatória e refs para estabilidade.

```typescript
// src/hooks/campaign/useTacticalBoard.ts
export function useTacticalBoard({ 
  campaignId, 
  isMaster, 
  enabled = true 
}: UseTacticalBoardProps): TacticalBoardReturn {
  // Refs para funções instáveis
  const toastRef = useRef(toast);
  const isMasterRef = useRef(isMaster);
  
  useEffect(() => { toastRef.current = toast; }, [toast]);
  useEffect(() => { isMasterRef.current = isMaster; }, [isMaster]);
  
  // Todos os useEffect verificam enabled
  useEffect(() => {
    if (!enabled || !campaignId) return;
    // Lógica de carregamento
  }, [campaignId, enabled]);
  
  // Canal Realtime com nome ESTÁTICO
  useEffect(() => {
    if (!enabled || !campaignId) return;
    
    const channel = supabase.channel(`maps-${campaignId}`) // SEM Date.now()
      .on('postgres_changes', {...}, () => loadMaps())
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }, [campaignId, enabled, loadMaps]);
  
  return { maps, tokens, activeMap, ... };
}
```

### 2.3 useCampaignRealtime

Hook unificado para chat e sessões.

```typescript
// src/hooks/campaign/useCampaignRealtime.ts
export function useCampaignRealtime({ 
  campaignId 
}: { campaignId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  
  // Busca inicial
  const fetchInitialData = useCallback(async () => {
    // Paralelo: mensagens + sessões
  }, [campaignId]);
  
  // Canal único para ambos
  useEffect(() => {
    if (!campaignId) return;
    
    const channel = supabase
      .channel(`campaign-realtime-${campaignId}`)
      .on('postgres_changes', { 
        table: 'campaign_messages_v2',
        filter: `campaign_id=eq.${campaignId}`
      }, handleNewMessage)
      .on('postgres_changes', { 
        table: 'campaign_sessions_v2',
        filter: `campaign_id=eq.${campaignId}`
      }, handleSessionChange)
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }, [campaignId]);
  
  return { messages, sessions, sendMessage, startSession, endSession };
}
```

### 2.4 useMasterActions (Estabilizado)

Todas as ações usando refs.

```typescript
// src/hooks/campaign/useMasterActions.ts
export function useMasterActions({ 
  campaignId, 
  isMaster, 
  onUpdate 
}: UseMasterActionsProps) {
  // Refs para TODAS as funções instáveis
  const toastRef = useRef(toast);
  const onUpdateRef = useRef(onUpdate);
  const isMasterRef = useRef(isMaster);
  
  // Sincroniza refs
  useEffect(() => { toastRef.current = toast; }, [toast]);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
  useEffect(() => { isMasterRef.current = isMaster; }, [isMaster]);
  
  // Ações SEM dependências instáveis
  const adjustHP = useCallback(async (characterId, delta) => {
    if (!isMasterRef.current) return;
    // Lógica...
    toastRef.current?.({ title: 'PV atualizado' });
    onUpdateRef.current?.();
  }, [campaignId]); // Apenas campaignId
  
  return { adjustHP, adjustPE, adjustSAN, applyCondition, ... };
}
```

---

## Fase 3: CampaignView Reconstruído

```typescript
// src/pages/CampaignView.tsx
export default function CampaignView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // === REFS PARA ESTABILIDADE ===
  const toastRef = useRef(toast);
  const navigateRef = useRef(navigate);
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => { toastRef.current = toast; }, [toast]);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  
  // Limpa timeout no unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    };
  }, []);
  
  // === HOOKS ÚNICOS (Singleton Pattern) ===
  const campaignData = useCampaignData({ 
    campaignId: id!, 
    userId: user?.id ?? '' 
  });
  
  const tacticalBoard = useTacticalBoard({ 
    campaignId: id!, 
    isMaster: campaignData.isMaster,
    enabled: true // Única instância ativa
  });
  
  const realtime = useCampaignRealtime({ campaignId: id! });
  
  const presence = useCampaignPresence({ 
    campaignId: id!,
    userName: user?.user_metadata?.display_name,
    userAvatar: user?.user_metadata?.avatar_url
  });
  
  // === CALLBACK THROTTLED ===
  const onMemberUpdate = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      campaignData.refetch();
    }, 500);
  }, []); // Sem deps = eternamente estável
  
  const masterActions = useMasterActions({
    campaignId: id!,
    isMaster: campaignData.isMaster,
    onUpdate: onMemberUpdate
  });
  
  // === RENDER ===
  if (campaignData.loading) return <LoadingScreen />;
  if (campaignData.error) return <ErrorScreen error={campaignData.error} />;
  if (!campaignData.campaign) return <NotFoundScreen />;
  
  return (
    <div className="campaign-view">
      <CampaignHeader 
        campaign={campaignData.campaign} 
        onlineMembers={presence.onlineMembers} 
      />
      
      <Tabs defaultValue="chat">
        <TabsList>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="combat">Combate</TabsTrigger>
          <TabsTrigger value="board">Tabuleiro</TabsTrigger>
          {campaignData.isMaster && (
            <TabsTrigger value="master">Mestre</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="chat">
          <CampaignChatTab 
            messages={realtime.messages}
            sendMessage={realtime.sendMessage}
          />
        </TabsContent>
        
        <TabsContent value="combat">
          <CampaignCombatTab 
            members={campaignData.members}
            masterActions={masterActions}
            isMaster={campaignData.isMaster}
          />
        </TabsContent>
        
        <TabsContent value="board">
          {/* PASSA O BOARD EXTERNO - interno fica disabled */}
          <TacticalBoard 
            campaignId={id!}
            isMaster={campaignData.isMaster}
            externalBoard={tacticalBoard}
          />
        </TabsContent>
        
        {campaignData.isMaster && (
          <TabsContent value="master">
            <CampaignMasterTab 
              members={campaignData.members}
              masterActions={masterActions}
              onMemberUpdate={onMemberUpdate}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
```

---

## Fase 4: Componentes Internos

### 4.1 TacticalBoard (Ajustado)

```typescript
// src/components/campaign/tactical/TacticalBoard.tsx
export function TacticalBoard({ 
  campaignId, 
  isMaster, 
  externalBoard 
}: TacticalBoardProps) {
  // Hook interno DESATIVADO se recebeu externalBoard
  const internalBoard = useTacticalBoard({ 
    campaignId, 
    isMaster, 
    enabled: !externalBoard // CRÍTICO: evita dupla subscrição
  });
  
  const board = externalBoard || internalBoard;
  
  // Resto do componente usa `board`...
}
```

### 4.2 SessionManager (Memoizado)

```typescript
// src/components/campaign/SessionManager.tsx
export function SessionManager({ campaignId, isMaster, onSessionUpdate }) {
  const toastRef = useRef(toast);
  const onUpdateRef = useRef(onSessionUpdate);
  
  // Fetch memoizado
  const fetchSessions = useCallback(async () => {
    // Lógica
  }, [campaignId]);
  
  // Subscribe memoizado
  const subscribeToSessions = useCallback(() => {
    const channel = supabase
      .channel(`sessions-${campaignId}`) // Estático
      .on('postgres_changes', {...}, fetchSessions)
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }, [campaignId, fetchSessions]);
  
  // Efeito com deps corretas
  useEffect(() => {
    fetchSessions();
    const cleanup = subscribeToSessions();
    return cleanup;
  }, [fetchSessions, subscribeToSessions]);
  
  // ...
}
```

---

## Fase 5: Correções Adicionais

### 5.1 PWA Screenshots (404)

Remover referências a screenshots inexistentes do manifesto:

```typescript
// vite.config.ts - Remover bloco screenshots
screenshots: [
  // REMOVER ESTE BLOCO INTEIRO
]
```

### 5.2 Navigation Preload Warning

Desativar `navigationPreload` já que o SW customizado não trata:

```typescript
// vite.config.ts
workbox: {
  // ...
  navigationPreload: false, // Desativar
  // ...
}
```

---

## Arquivos a Criar/Modificar

### Novos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/campaign/useCampaignData.ts` | Hook único para dados da campanha |
| `src/hooks/campaign/useCampaignRealtime.ts` | Hook unificado para chat/sessões |
| `src/components/campaign/tabs/CampaignChatTab.tsx` | Aba de chat (stateless) |
| `src/components/campaign/tabs/CampaignCombatTab.tsx` | Aba de combate (stateless) |
| `src/components/campaign/tabs/CampaignBoardTab.tsx` | Aba de tabuleiro (wrapper) |
| `src/components/campaign/tabs/CampaignMasterTab.tsx` | Aba do mestre (stateless) |

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/CampaignView.tsx` | Reescrita completa com nova arquitetura |
| `src/hooks/campaign/useTacticalBoard.ts` | Adicionar `enabled`, refs, canais estáticos |
| `src/hooks/campaign/useMasterActions.ts` | Refs para toast/onUpdate |
| `src/hooks/campaign/useCampaignPresence.ts` | Refs para userData |
| `src/components/campaign/SessionManager.tsx` | Memoização de funções |
| `src/components/campaign/tactical/TacticalBoard.tsx` | Respeitar `enabled: !externalBoard` |
| `vite.config.ts` | Remover screenshots, desativar navigationPreload |

### Migrações de Banco

- Criar tabelas `*_v2` com estrutura limpa
- Configurar RLS correto desde o início
- Habilitar Realtime nas tabelas necessárias

---

## Ordem de Implementação

1. **Fase 1**: Criar schema v2 no banco (migration SQL)
2. **Fase 2**: Criar hooks novos (`useCampaignData`, `useCampaignRealtime`)
3. **Fase 3**: Refatorar hooks existentes (`useTacticalBoard`, `useMasterActions`, `useCampaignPresence`)
4. **Fase 4**: Reescrever `CampaignView.tsx` com nova arquitetura
5. **Fase 5**: Criar componentes de abas stateless
6. **Fase 6**: Corrigir `vite.config.ts` (PWA)
7. **Fase 7**: Testar fluxo completo

---

## Resultado Esperado

- **Erro #185 eliminado**: Nenhum loop de re-render
- **Performance melhorada**: Menos listeners Realtime ativos
- **Manutenibilidade**: Componentes isolados e testáveis
- **Dados limpos**: Schema v2 com RLS adequado desde o início

