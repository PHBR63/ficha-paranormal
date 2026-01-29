
# Plano: Correção Definitiva do React Error #185 no TacticalBoard

## Diagnóstico Confirmado

O stack trace mostra claramente que o erro #185 vem do **`@radix-ui/react-compose-refs`** sendo chamado dentro do componente `Select` no `TacticalBoard.tsx`. 

A **causa raiz** é que o hook `useTacticalBoard` está sendo instanciado **duas vezes**:

1. **CampaignView.tsx (linha 171-174)**: Cria instância do hook e passa como `externalBoard`
2. **TacticalBoard.tsx (linha 121)**: Cria **outra instância** do mesmo hook **incondicionalmente**

Ambas as instâncias:
- Subscrevem ao mesmo canal Realtime (`maps-${campaignId}` e `tokens-${mapId}`)
- Recebem os mesmos eventos de atualização
- Disparam `loadMaps()` e `loadTokens()` simultaneamente
- Causam cascata de re-renders que estoura o limite do React

---

## Solução

### 1. Chamada Condicional do Hook no TacticalBoard

Alterar a lógica para só instanciar o hook interno quando não houver `externalBoard`:

```typescript
// Linha 120-122 do TacticalBoard.tsx
// ANTES (PROBLEMÁTICO):
const internalBoard = useTacticalBoard({ campaignId, isMaster });
const board = externalBoard || internalBoard;

// DEPOIS (CORRETO):
// Hook condicional: só cria instância interna se não houver board externo
// Isso evita dupla subscrição ao Realtime que causa loop #185
const shouldUseInternal = !externalBoard;
const internalBoard = useTacticalBoard({ 
  campaignId, 
  isMaster,
  enabled: shouldUseInternal  // <-- Nova prop para desativar o hook
});
const board = externalBoard || internalBoard;
```

### 2. Adicionar Prop `enabled` no useTacticalBoard

Modificar o hook para aceitar uma flag `enabled` que desativa todas as subscrições:

```typescript
// useTacticalBoard.ts
export interface UseTacticalBoardProps {
  campaignId: string;
  isMaster: boolean;
  enabled?: boolean; // Nova prop - default true
}

export function useTacticalBoard({
  campaignId,
  isMaster,
  enabled = true, // <-- Default true para não quebrar outros usos
}: UseTacticalBoardProps): TacticalBoardReturn {
  // ... estados existentes ...

  // Carregamento inicial - só se enabled
  useEffect(() => {
    if (!campaignId || !enabled) return;  // <-- Verifica enabled
    loadMaps();
    // ...
  }, [campaignId, loadMaps, enabled]);

  // Subscribe para mapas - só se enabled
  useEffect(() => {
    if (!campaignId || !enabled) return;  // <-- Verifica enabled
    const mapsChannel = supabase.channel(`maps-${campaignId}`)...
    // ...
  }, [campaignId, loadMaps, enabled]);

  // Subscribe para tokens - só se enabled
  useEffect(() => {
    if (!activeMap || !enabled) return;  // <-- Verifica enabled
    const tokensChannel = supabase.channel(`tokens-${activeMap.id}`)...
    // ...
  }, [activeMap, loadTokens, enabled]);
  
  // ...
}
```

---

## Arquivos a Modificar

| # | Arquivo | Alteração |
|---|---------|-----------|
| 1 | `src/hooks/campaign/useTacticalBoard.ts` | Adicionar prop `enabled` e verificar em todos os `useEffect` |
| 2 | `src/components/campaign/tactical/TacticalBoard.tsx` | Passar `enabled: !externalBoard` ao chamar o hook |

---

## Lógica de Funcionamento

```text
CampaignView
  └── useTacticalBoard({ enabled: true })  ← Única instância ativa
        └── Subscribe Realtime: maps-${id}, tokens-${mapId}
  └── <TacticalBoard externalBoard={board} />
        └── useTacticalBoard({ enabled: false })  ← Hook "desligado"
              └── NÃO subscribe Realtime
              └── Retorna estado vazio/inativo
        └── Usa externalBoard (recebido do pai)
```

---

## Resultado Esperado

1. **Erro #185 eliminado** — Apenas uma instância do hook subscreve ao Realtime
2. **Sem duplicação de eventos** — Cada evento é processado uma única vez
3. **Performance melhorada** — Menos listeners ativos
4. **Compatibilidade mantida** — Componentes que não passam `externalBoard` continuam funcionando normalmente

---

## Alternativa Simplificada (Se a Prop enabled for muito invasiva)

Outra opção é simplesmente **não chamar o hook** quando há `externalBoard`:

```typescript
// TacticalBoard.tsx - Alternativa mais direta
// Usa um hook vazio como fallback quando não há externalBoard
const internalBoard = externalBoard ? null : useTacticalBoard({ campaignId, isMaster });
const board = externalBoard || internalBoard!;
```

**Problema**: Hooks não podem ser chamados condicionalmente em React. A solução com `enabled` é a correta.

---

## Notas Técnicas

### Por que o Select/Radix aparece no stack trace?
O Radix UI Select usa refs internos para posicionamento. Quando há muitos re-renders em sequência, a lógica de `setRef` do `@radix-ui/react-compose-refs` é chamada repetidamente, e o React detecta o loop nesse ponto — mas a **causa** é a subscrição duplicada do Realtime, não o Select em si.

### Ordem de Implementação
1. Primeiro adicionar `enabled` no `useTacticalBoard.ts`
2. Depois ajustar o `TacticalBoard.tsx` para passar `enabled: !externalBoard`
3. Testar abrindo a campanha
