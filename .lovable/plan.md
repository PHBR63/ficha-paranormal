
# Plano: Reconstrução da Arquitetura de Campanha para Estabilidade

## Diagnóstico Completo

Analisei toda a estrutura da campanha e identifiquei múltiplos pontos de instabilidade que causam o erro **React #185** (Maximum update depth exceeded):

### Cadeia de Instabilidade Identificada

```text
CampaignView
  ├── fetchCampaignData (memoizado, mas passado como onMemberUpdate)
  │     └── MasterSheetViewer recebe como prop
  │           └── useMasterActions recebe como onUpdate
  │                 └── Todos os useCallback dependem de [toast, onUpdate]
  │                       └── toast muda → callbacks recriam → onUpdate chamado → fetchCampaignData
  │                             └── LOOP INFINITO
  │
  ├── useTacticalBoard (já corrigido com enabled)
  │
  ├── useCampaignPresence (parcialmente corrigido)
  │
  └── SessionManager (subscribeToSessions não memoizado)
        └── fetchSessions chamado em loop quando sessões mudam
```

### Problemas Específicos

| Arquivo | Problema |
|---------|----------|
| `useMasterActions.ts` | Todos os callbacks dependem de `toast` e `onUpdate` (instáveis) |
| `MasterSheetViewer.tsx` | Passa `onMemberUpdate` diretamente para hook sem estabilizar |
| `SessionManager.tsx` | `fetchSessions` e `subscribeToSessions` não são memoizados |
| `MemberConditionsPanel.tsx` | `onMemberUpdate?.()` chamado sem throttle após cada update |

---

## Arquitetura Proposta

### Princípio Central: Padrão "Ref-First"

Todas as funções externas (toast, navigate, callbacks de props) serão armazenadas em refs para evitar que mudanças de referência propaguem para useCallback/useEffect.

```text
┌─────────────────────────────────────────────────────────────┐
│                    CampaignView                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Refs Estáveis                                         │  │
│  │ - toastRef, navigateRef (já existem)                  │  │
│  │ - membersRef (NOVO - para evitar dep circular)        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Callbacks Estáveis (useCallback com deps mínimas)     │  │
│  │ - fetchCampaignData: [id, userId]                     │  │
│  │ - fetchActiveSession: [id]                            │  │
│  │ - subscribeToMessages: [id]                           │  │
│  │ - subscribeToSessions: [id]                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Props para Filhos:                                         │
│  - onMemberUpdate → useCallback vazio que lê membersRef     │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementação Detalhada

### 1. Refatoração do `useMasterActions.ts`

**Objetivo**: Eliminar dependência de `toast` e `onUpdate` nos callbacks.

```typescript
// ANTES (problemático):
const adjustHP = useCallback(async (...) => {
  // ...
  toast({ ... });
  onUpdate?.();
}, [checkAuth, toast, onUpdate]); // ← toast e onUpdate recriam o callback

// DEPOIS (estável):
const toastRef = useRef(toast);
const onUpdateRef = useRef(onUpdate);

useEffect(() => { toastRef.current = toast; }, [toast]);
useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

const adjustHP = useCallback(async (...) => {
  // ...
  toastRef.current?.({ ... });
  onUpdateRef.current?.();
}, [checkAuth]); // ← Apenas checkAuth (que também precisa de ref)
```

### 2. Refatoração do `SessionManager.tsx`

**Objetivo**: Memoizar funções e estabilizar subscrições.

```typescript
// ANTES:
useEffect(() => {
  fetchSessions();
  const cleanup = subscribeToSessions();
  return cleanup;
}, [campaignId]); // ← fetchSessions não está memoizado!

// DEPOIS:
const fetchSessions = useCallback(async () => {
  // ... lógica de fetch
}, [campaignId]);

const subscribeToSessions = useCallback(() => {
  // ... lógica de subscribe
  return cleanup;
}, [campaignId, fetchSessions]);

useEffect(() => {
  fetchSessions();
  const cleanup = subscribeToSessions();
  return cleanup;
}, [fetchSessions, subscribeToSessions]);
```

### 3. Estabilização do `MasterSheetViewer.tsx`

**Objetivo**: Não repassar callback instável para o hook.

```typescript
// ANTES:
const masterActions = useMasterActions({
  campaignId,
  isMaster: true,
  onUpdate: onMemberUpdate, // ← Se onMemberUpdate muda, recria tudo
});

// DEPOIS:
// O hook useMasterActions já usa refs internamente
// Apenas garante que onMemberUpdate não cause re-render do componente
const masterActions = useMasterActions({
  campaignId,
  isMaster: true,
  onUpdate: onMemberUpdate,
});
```

### 4. Throttle para Updates em Cascata

Para evitar múltiplos `fetchCampaignData` em sequência:

```typescript
// CampaignView.tsx
const fetchCampaignData = useCallback(async () => {
  // ... lógica existente
}, [id, userId]);

// Versão com throttle para passar como prop
const debouncedFetchRef = useRef(fetchCampaignData);
useEffect(() => { debouncedFetchRef.current = fetchCampaignData; }, [fetchCampaignData]);

const onMemberUpdateThrottled = useCallback(() => {
  // Debounce de 500ms para evitar múltiplas chamadas
  clearTimeout(updateTimeoutRef.current);
  updateTimeoutRef.current = setTimeout(() => {
    debouncedFetchRef.current();
  }, 500);
}, []); // ← Sem dependências = estável para sempre
```

---

## Arquivos a Modificar

| # | Arquivo | Alterações |
|---|---------|------------|
| 1 | `src/hooks/campaign/useMasterActions.ts` | Adicionar refs para `toast`, `onUpdate`, `checkAuth` |
| 2 | `src/components/campaign/SessionManager.tsx` | Memoizar `fetchSessions` e `subscribeToSessions` com useCallback |
| 3 | `src/pages/CampaignView.tsx` | Adicionar `onMemberUpdateThrottled` e passar para filhos |
| 4 | `src/components/campaign/MemberConditionsPanel.tsx` | Garantir que `onMemberUpdate` não dispare loops |

---

## Validação

### Checklist de Testes

1. Abrir a campanha via card — não deve crashar com erro #185
2. Navegar entre abas (Chat, Combate, Tabuleiro, Mestre) — sem loops
3. Editar PV/PE/SAN no MasterSheetViewer — deve atualizar sem loop
4. Aplicar/remover condição — deve funcionar sem cascata de re-renders
5. Iniciar/encerrar sessão — sem loops no SessionManager
6. Enviar mensagem no chat — realtime funcionando normalmente
7. Verificar console — nenhum warning de "Maximum update depth"

---

## Notas Técnicas

### Por que usar Refs em vez de useCallback?

- `useCallback` apenas evita recriação se as dependências não mudarem
- Se uma dependência é "instável" (como `toast` que vem de um hook), o callback é recriado
- Refs são mutáveis e não disparam re-renders quando atualizadas
- O padrão `useRef` + `useEffect` para sincronizar permite callbacks com dependências "vazias"

### Ordem de Implementação

1. **Primeiro**: `useMasterActions.ts` (mais crítico, usado por vários componentes)
2. **Segundo**: `SessionManager.tsx` (segundo mais frequente)
3. **Terceiro**: `CampaignView.tsx` (throttle de updates)
4. **Quarto**: Testar antes de prosseguir

### Risco de Stale Closures

Ao usar refs, callbacks podem ler valores "velhos". Mitigação:
- Sempre atualizar refs em `useEffect` antes de usar
- Para valores que mudam frequentemente (como `members`), usar `membersRef.current` em vez de capturar direto

---

## Conformidade com Regras do Projeto

- **Não modifica nenhuma mecânica de Ordem Paranormal RPG**
- **Comentários em PT-BR** conforme especificado
- **Segue padrão de estabilidade documentado** em `memory/architecture/campaign-view-stability-and-loop-prevention-standard`
- **Mantém ScrollArea apenas em popovers estáticos** (já implementado)
