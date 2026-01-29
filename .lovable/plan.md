
# Plano: Correção Definitiva do Loop Infinito #185 no TacticalBoard

## Diagnóstico Confirmado

A análise dos links do Stack Overflow e Reddit confirmou o padrão exato que causa o loop:

> "When `useEffect` dependencies include objects or functions that are recreated every render, it causes an infinite loop because React sees a 'new' value each time."

### Cadeia do Loop
```
1. CampaignView renderiza
2. useTacticalBoard() retorna NOVO objeto {maps, setActiveMap, ...}
3. TacticalBoard recebe novo `board` prop
4. Select recebe `onValueChange={board.setActiveMap}` (NOVA referência)
5. Radix Select tenta atualizar refs internas
6. Isso dispara setState dentro do Select
7. Re-render → volta para (1) = LOOP INFINITO
```

### Solução Baseada nos Links

O Stack Overflow sugere: **"Use `useMemo` to return a memorized value"** - exatamente o que precisamos aplicar ao retorno do hook.

---

## Correções a Implementar

### 1. useTacticalBoard.ts - Memoizar Retorno do Hook

**Problema**: O hook retorna um objeto literal que é recriado a cada render.

**Solução**: Envolver o retorno em `useMemo` para garantir referência estável.

```typescript
// ANTES (linha 709-749):
return {
  maps,
  activeMap,
  // ... 30+ propriedades
};

// DEPOIS:
return useMemo(() => ({
  maps,
  activeMap,
  tokens,
  selectedTokenId,
  isLoading,
  pings,
  zoom,
  panOffset,
  activeTool,
  measureStart,
  measureEnd,
  highlightedCells,
  loadMaps,
  createMap,
  updateMap,
  deleteMap,
  setActiveMap,
  uploadMapImage,
  removeMapImage,
  createToken,
  updateToken,
  moveToken,
  deleteToken,
  selectToken,
  setZoom,
  setPanOffset,
  fitToScreen,
  setActiveTool,
  startMeasure,
  endMeasure,
  clearMeasure,
  sendPing,
  revealFog,
  hideFog,
  setHighlightedCells: setHighlightedCellsState,
  clearHighlightedCells: () => setHighlightedCellsState([]),
  pixelToCell,
  cellToPixel,
  calculateDistance,
}), [
  // Estados que mudam
  maps,
  activeMap,
  tokens,
  selectedTokenId,
  isLoading,
  pings,
  zoom,
  panOffset,
  activeTool,
  measureStart,
  measureEnd,
  highlightedCells,
  // Callbacks (estáveis via useCallback)
  loadMaps,
  createMap,
  updateMap,
  deleteMap,
  setActiveMap,
  uploadMapImage,
  removeMapImage,
  createToken,
  updateToken,
  moveToken,
  deleteToken,
  selectToken,
  setZoom,
  setPanOffset,
  fitToScreen,
  setActiveTool,
  startMeasure,
  endMeasure,
  clearMeasure,
  sendPing,
  revealFog,
  hideFog,
  setHighlightedCellsState,
  pixelToCell,
  cellToPixel,
  calculateDistance,
]);
```

### 2. TacticalBoard.tsx - Estabilizar Handlers de Componentes Radix

Mesmo com o hook memoizado, é uma boa prática estabilizar callbacks passados para componentes Radix:

```typescript
// Após a linha 123 (const board = externalBoard || internalBoard;)

// Refs para callbacks do board (proteção adicional contra loops)
const setActiveMapRef = useRef(board.setActiveMap);
const setActiveToolRef = useRef(board.setActiveTool);
const setZoomRef = useRef(board.setZoom);

useEffect(() => { setActiveMapRef.current = board.setActiveMap; }, [board.setActiveMap]);
useEffect(() => { setActiveToolRef.current = board.setActiveTool; }, [board.setActiveTool]);
useEffect(() => { setZoomRef.current = board.setZoom; }, [board.setZoom]);

// Handlers estáveis
const handleSetActiveMap = useCallback((id: string) => {
  setActiveMapRef.current?.(id);
}, []);

const handleSetActiveTool = useCallback((tool: string) => {
  setActiveToolRef.current?.(tool as any);
}, []);

const handleSetZoom = useCallback((newZoom: number) => {
  setZoomRef.current?.(newZoom);
}, []);
```

E no JSX (linha 859):
```tsx
// ANTES:
<Select 
  key="map-selector-stable"
  value={board.activeMap.id} 
  onValueChange={board.setActiveMap}  // ← Instável
>

// DEPOIS:
<Select 
  value={board.activeMap?.id || ''} 
  onValueChange={handleSetActiveMap}  // ← Estável via ref
>
```

### 3. useCampaignPresence.ts - Remover Deps Desnecessárias

**Problema** (linha 241):
```typescript
}, [enabled, userId, userName, userAvatar]);
```

Os valores `userName` e `userAvatar` já são lidos via `userNameRef` e `userAvatarRef` dentro da função `updateActivity`. Incluí-los nas deps é redundante e pode causar re-execuções desnecessárias.

**Solução**:
```typescript
}, [enabled, userId]); // userName e userAvatar usam refs (linhas 96-102)
```

---

## Arquivos a Modificar

| Arquivo | Linha(s) | Alteração |
|---------|----------|-----------|
| `src/hooks/campaign/useTacticalBoard.ts` | 709-749 | Envolver retorno em `useMemo` |
| `src/components/campaign/tactical/TacticalBoard.tsx` | 123+ | Adicionar refs e handlers estáveis |
| `src/components/campaign/tactical/TacticalBoard.tsx` | 856-872 | Usar `handleSetActiveMap` no Select |
| `src/components/campaign/tactical/TacticalBoard.tsx` | 889-891 | Usar `handleSetActiveTool` nos botões |
| `src/hooks/campaign/useCampaignPresence.ts` | 241 | Remover `userName, userAvatar` das deps |

---

## Ordem de Implementação

1. **Primeiro**: Corrigir `useCampaignPresence.ts` (mais simples, 1 linha)
2. **Segundo**: Adicionar `useMemo` no retorno de `useTacticalBoard.ts`
3. **Terceiro**: Adicionar refs e handlers estáveis no `TacticalBoard.tsx`
4. **Quarto**: Testar abertura da campanha

---

## Resultado Esperado

- O `Select` do mapa não causará mais loop de `setRef`
- O componente `TacticalBoard` renderizará de forma estável
- O erro #185 será eliminado ao abrir `/campaigns/:id`
- Todas as funcionalidades do tabuleiro continuarão funcionando normalmente

---

## Notas Técnicas

### Por que useMemo no Retorno?

Sem `useMemo`, cada render do hook cria um novo objeto:
```typescript
return { a: 1, b: fn } // Novo objeto, nova referência
```

Com `useMemo`, o mesmo objeto é retornado se as deps não mudarem:
```typescript
return useMemo(() => ({ a: 1, b: fn }), [a, fn]) // Mesma referência
```

### Por que Refs para Callbacks?

Mesmo com `useMemo`, se qualquer dep mudar, o objeto inteiro é recriado. Usando refs:
1. O handler (`handleSetActiveMap`) NUNCA muda (deps vazias no useCallback)
2. A função real (`board.setActiveMap`) é atualizada via ref
3. O componente Radix vê sempre a mesma referência

### Conformidade com Regras do Projeto

- Segue o padrão Ref-First documentado em `memory/architecture/campaign-view-stability-and-loop-prevention-standard`
- Comentários em PT-BR conforme especificado
- Não modifica nenhuma mecânica de Ordem Paranormal RPG
