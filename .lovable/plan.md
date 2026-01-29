

# Plano: Correção Definitiva do Erro #185 (Maximum update depth exceeded) + Erros 406/500

## Diagnóstico Confirmado

O erro **React #185** ocorre **sem interação do usuário**, ao carregar a **aba "Agentes"** (defaultValue: `"chat"` mas o erro parece estar nas abas renderizadas em memória) com o usuário logado como **Mestre**.

### Causas Raiz Identificadas

```text
┌────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DO LOOP #185                             │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  CampaignView                                                          │
│      ↓                                                                 │
│  CampaignStatusGrid (aba "status")                                     │
│      ↓                                                                 │
│  ConditionList (para cada membro com personagem)                       │
│      ↓                                                                 │
│  ConditionBadge (para cada condição)                                   │
│      ↓                                                                 │
│  TooltipProvider → Tooltip → TooltipTrigger  ← PROBLEMA!               │
│      ↓                                                                 │
│  Radix chama setRef() ao montar cada TooltipTrigger                   │
│      ↓                                                                 │
│  React detecta atualização de estado durante render                    │
│      ↓                                                                 │
│  Re-render de ConditionList → Novos TooltipTriggers                   │
│      ↓                                                                 │
│  LOOP INFINITO → Erro #185                                             │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Problema 1: Tooltip em Loop de Renderização

O componente `ConditionBadge` (`src/components/ui/condition-badge.tsx`) envolve cada badge com `TooltipProvider > Tooltip > TooltipTrigger`. Quando múltiplos badges são renderizados em sequência (dentro de `AnimatePresence`), o Radix UI dispara `setRef` internamente, causando re-renders em cascata.

**Arquivo afetado**: `src/components/ui/condition-badge.tsx:85-136`

### Problema 2: Erro 406 (Not Acceptable) em campaigns_v2

A query em `useCampaignData.ts` usa `.single()`, que dispara erro 406 quando não encontra registro (comum durante fallback v1→v2):

```typescript
// Linha 105-109
const { data, error } = await supabase
  .from('campaigns_v2')
  .select('*')
  .eq('id', campaignId)
  .single(); // ← Erro 406 quando não existe
```

**Arquivos afetados**:
- `src/hooks/campaign/useCampaignData.ts:105-109` (campaigns_v2)
- `src/hooks/campaign/useCampaignData.ts:113-117` (campaigns fallback)
- `src/hooks/campaign/useCampaignRealtime.ts:352-357` (profiles/characters)
- `src/pages/CampaignView.tsx:214-215` (campaign_invites insert)

### Problema 3: Callbacks Inline em Sliders e Selects

Diversos componentes ainda usam arrow functions inline em `onValueChange`:

- `AudioMasterPanel.tsx:201` → `onValueChange={([v]) => setMasterVolume(v)}`
- `AudioPlayerBar.tsx:73` → `onValueChange={([v]) => setMasterVolume(v)}`
- `IntegratedDiceRoller.tsx:298, 313, 328` → `onValueChange={([v]) => ...}`

---

## Fase 1: Substituir Tooltips por Atributo Nativo (Crítico)

Modificar `ConditionBadge` para usar o atributo `title` em vez de Radix Tooltip quando `showTooltip=true` (comportamento padrão):

```typescript
// ANTES: Radix Tooltip (causa loop)
if (showTooltip) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        ...
      </Tooltip>
    </TooltipProvider>
  );
}

// DEPOIS: Atributo title nativo (estável)
const tooltipText = `${condition.name}: ${condition.effect}`;

const badge = (
  <motion.div
    ref={ref}
    title={showTooltip ? tooltipText : undefined}
    // ... resto igual
  />
);

return badge; // Sem wrapper de Tooltip
```

**Arquivo**: `src/components/ui/condition-badge.tsx`

---

## Fase 2: Corrigir Queries 406 (.single() → .limit(1))

Converter todas as chamadas `.single()` e `.maybeSingle()` para `.select().limit(1)`:

### useCampaignData.ts

```typescript
// ANTES (linha 105-109):
const { data, error } = await supabase
  .from('campaigns_v2')
  .select('*')
  .eq('id', campaignId)
  .single();

// DEPOIS:
const { data, error } = await supabase
  .from('campaigns_v2')
  .select('*')
  .eq('id', campaignId)
  .limit(1);

const campaignData = data?.[0];
if (!campaignData) {
  // Fallback para v1
}
```

### useCampaignRealtime.ts

```typescript
// ANTES (linha 352-357):
const [profileRes, charRes] = await Promise.all([
  supabase.from('profiles').select('display_name').eq('user_id', newMsg.user_id).maybeSingle(),
  ...
]);

// DEPOIS:
const [profileRes, charRes] = await Promise.all([
  supabase.from('profiles').select('display_name').eq('user_id', newMsg.user_id).limit(1),
  newMsg.character_id
    ? supabase.from('characters').select('name').eq('id', newMsg.character_id).limit(1)
    : Promise.resolve({ data: [] }),
]);

const profile = profileRes.data?.[0] || { display_name: null };
const character = charRes.data?.[0] || null;
```

### CampaignView.tsx (insert de convite)

```typescript
// ANTES (linha 214-215):
const { data, error } = await supabase
  .from('campaign_invites')
  .insert({...})
  .select()
  .single();

// DEPOIS:
const { data, error } = await supabase
  .from('campaign_invites')
  .insert({...})
  .select()
  .limit(1);

const inviteData = data?.[0];
if (inviteData) setInvite(inviteData);
```

---

## Fase 3: Estabilizar Callbacks de Sliders (Média)

Converter arrow functions inline para `useCallback`:

### AudioMasterPanel.tsx

```typescript
// Adicionar no topo do componente:
const handleMasterVolumeChange = useCallback(([v]: number[]) => {
  setMasterVolume(v);
}, [setMasterVolume]);

// Usar no Slider:
<Slider
  value={[audioState?.master_volume ?? 1]}
  onValueChange={handleMasterVolumeChange}
  ...
/>
```

### AudioPlayerBar.tsx

```typescript
const handleMasterVolumeChange = useCallback(([v]: number[]) => {
  setMasterVolume(v);
}, [setMasterVolume]);
```

### IntegratedDiceRoller.tsx

```typescript
const handleSkillBonusChange = useCallback(([v]: number[]) => {
  setSkillBonus(v);
}, []);

const handleOtherBonusChange = useCallback(([v]: number[]) => {
  setOtherBonus(v);
}, []);

const handleCritThresholdChange = useCallback(([v]: number[]) => {
  setCritThreshold(v);
}, []);
```

---

## Fase 4: Memoizar ConditionList e MagicCard (Opcional)

Para evitar re-renders desnecessários quando apenas um membro muda:

```typescript
// Em CampaignStatusGrid.tsx:
import { memo } from 'react';

const MemberCard = memo(function MemberCard({ member, isMaster }: MemberCardProps) {
  // ... lógica do card
});

// Em condition-badge.tsx:
export const ConditionList = memo(function ConditionList({...}: ConditionListProps) {
  // ... lógica da lista
});
```

---

## Ordem de Execução

| Fase | Prioridade | Arquivo | Alteração |
|------|------------|---------|-----------|
| 1 | Crítica | `condition-badge.tsx` | Remover Radix Tooltip, usar `title` nativo |
| 2a | Alta | `useCampaignData.ts` | `.single()` → `.limit(1)` |
| 2b | Alta | `useCampaignRealtime.ts` | `.maybeSingle()` → `.limit(1)` |
| 2c | Alta | `CampaignView.tsx` | `.single()` → `.limit(1)` em insert |
| 3a | Média | `AudioMasterPanel.tsx` | `useCallback` para Slider |
| 3b | Média | `AudioPlayerBar.tsx` | `useCallback` para Slider |
| 3c | Média | `IntegratedDiceRoller.tsx` | `useCallback` para Sliders (3x) |
| 4 | Baixa | `CampaignStatusGrid.tsx` | Memoizar cards |

---

## Resultado Esperado

- **Erro #185 eliminado**: Tooltips não disparam mais loop de `setRef`
- **Erro 406 eliminado**: Queries retornam array vazio (HTTP 200) em vez de erro
- **Aba Agentes funcional**: Carrega corretamente sem travar o React
- **Performance melhorada**: Re-renders isolados por membro

---

## Notas Técnicas

### Por que Radix Tooltip causa loop?

O Radix `TooltipTrigger` usa um sistema de ref forwarding que chama `setRef()` internamente. Quando múltiplos triggers são montados em sequência (como em um `.map()`), cada chamada a `setRef()` pode disparar um re-render do componente pai, que remonta os triggers, criando o ciclo.

### Conformidade com Regras do Projeto

- Segue padrão Ref-First documentado na memória
- Comentários em PT-BR
- Não modifica mecânicas de Ordem Paranormal RPG
- Usa apenas termos oficiais do sistema

