
# Plano Definitivo: Correção do React Error #185 na Campanha

## Diagnóstico Confirmado

O erro **React #185** (Maximum update depth exceeded) ocorre imediatamente ao clicar no card da campanha "TESTE 1". A causa é o **Radix UI ScrollArea** que entra em loop infinito de recalculo de layout quando:

1. O componente monta e inicia subscriptions realtime
2. Estados atualizam rapidamente (presença, mensagens, sessões)
3. ScrollArea faz medições de layout (ResizeObserver)
4. Medições disparam re-renders que disparam novas medições

## Arquivos que Precisam de Migração (Campanha)

A auditoria completa revelou que os seguintes arquivos ainda usam `ScrollArea` e são carregados na página de campanha:

### Prioridade Crítica (Carregados imediatamente)
| Arquivo | Linha do Import | Uso |
|---------|-----------------|-----|
| `src/pages/CampaignView.tsx` | 12 | Import não utilizado (remover) |
| `src/components/campaign/CampaignRitualFeed.tsx` | 10 | Lista de rituais (realtime) |
| `src/components/campaign/chat/SessionActivityLog.tsx` | 21 | Log de atividades (realtime) |
| `src/components/campaign/CharacterSelectDialog.tsx` | 5 | Dialog de seleção |
| `src/components/campaign/CharacterConditions.tsx` | 3 | Lista de condições |

### Prioridade Alta (Componentes de Combate)
| Arquivo | Linha do Import | Uso |
|---------|-----------------|-----|
| `src/components/combat/TacticalPauseModal.tsx` | 30 | 4 instâncias de ScrollArea |
| `src/components/combat/CombatBoardLinker.tsx` | 11 | Lista de combatentes |
| `src/components/combat/HookExecutionLog.tsx` | 8 | Log de hooks |
| `src/components/combat/RangeCalculator.tsx` | 14 | Lista de alvos |
| `src/components/combat/CombatStatsPanel.tsx` | 11 | Estatísticas |
| `src/components/combat/MacroBar.tsx` | 12 | Scroll horizontal |

### Prioridade Média (Handouts e Mestre)
| Arquivo | Linha do Import | Uso |
|---------|-----------------|-----|
| `src/components/campaign/handouts/PlayerHandoutsViewer.tsx` | 19 | Lista de handouts |
| `src/components/campaign/master/HandoutsManager.tsx` | 26 | Gerenciador de handouts |
| `src/components/campaign/master/MasterSheetViewer.tsx` | 16 | Mantido para popovers estáticos |

### Já Migrados (Confirmados)
- `WhisperDialog.tsx` - linha 9 tem comentário confirmando remoção
- `NPCManager.tsx` - linha 16 tem comentário confirmando remoção
- `SessionManager.tsx` - migrado anteriormente
- `NotesPanel.tsx` - migrado anteriormente
- `TacticalBoard.tsx` - migrado anteriormente

## Correções Adicionais

### Erro 406 no Listener Realtime
O `CampaignView.tsx` ainda usa `.single()` nas linhas 352 e 360:

```text
Linha 352: .single() ao buscar profile
Linha 360: .single() ao buscar character
```

Ambos devem ser substituídos por `.maybeSingle()` para evitar erros quando o perfil/personagem não existe.

---

## Plano de Implementação

### Fase 1: Limpar CampaignView.tsx
1. Remover import não utilizado de ScrollArea (linha 12)
2. Substituir `.single()` por `.maybeSingle()` nas linhas 352 e 360

### Fase 2: Migrar Componentes Críticos
Para cada arquivo, aplicar o padrão:

```tsx
// ANTES
import { ScrollArea } from '@/components/ui/scroll-area';
...
<ScrollArea className="h-[300px]">
  {children}
</ScrollArea>

// DEPOIS
// ScrollArea removido - usando overflow nativo para evitar bug #185 com React 19
...
<div className="h-[300px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
  {children}
</div>
```

#### 2.1 CampaignRitualFeed.tsx
- Remover import (linha 10)
- Substituir uso do ScrollArea

#### 2.2 SessionActivityLog.tsx
- Remover import (linha 21)
- Substituir uso do ScrollArea

#### 2.3 CharacterSelectDialog.tsx
- Remover import (linha 5)
- Substituir uso do ScrollArea

#### 2.4 CharacterConditions.tsx
- Remover import (linha 3)
- Substituir uso do ScrollArea

### Fase 3: Migrar Componentes de Combate

#### 3.1 TacticalPauseModal.tsx
- Remover import (linha 30)
- Substituir 4 instâncias de ScrollArea

#### 3.2 CombatBoardLinker.tsx
- Remover import (linha 11)
- Substituir ScrollArea

#### 3.3 HookExecutionLog.tsx
- Remover import (linha 8)
- Substituir ScrollArea

#### 3.4 RangeCalculator.tsx
- Remover import (linha 14)
- Substituir ScrollArea

#### 3.5 CombatStatsPanel.tsx
- Remover import (linha 11)
- Substituir ScrollArea

#### 3.6 MacroBar.tsx (Scroll Horizontal)
- Remover import de ScrollArea e ScrollBar (linha 12)
- Substituir por div com `overflow-x-auto`

### Fase 4: Migrar Componentes de Handouts

#### 4.1 PlayerHandoutsViewer.tsx
- Remover import (linha 19)
- Substituir ScrollArea

#### 4.2 HandoutsManager.tsx
- Remover import (linha 26)
- Substituir ScrollArea

---

## Classes CSS para Migração

```css
/* Scroll Vertical */
overflow-y-auto           /* Habilita scroll vertical */
overscroll-contain        /* Impede scroll chaining */
scrollbar-thin            /* Scrollbar fina */
scrollbar-thumb-border    /* Cor do thumb */
scrollbar-track-transparent /* Track invisível */

/* Scroll Horizontal (MacroBar) */
overflow-x-auto           /* Habilita scroll horizontal */
```

---

## Arquivos a Serem Modificados

| # | Arquivo | Alteração |
|---|---------|-----------|
| 1 | `src/pages/CampaignView.tsx` | Remover import; .single() para .maybeSingle() |
| 2 | `src/components/campaign/CampaignRitualFeed.tsx` | Substituir ScrollArea |
| 3 | `src/components/campaign/chat/SessionActivityLog.tsx` | Substituir ScrollArea |
| 4 | `src/components/campaign/CharacterSelectDialog.tsx` | Substituir ScrollArea |
| 5 | `src/components/campaign/CharacterConditions.tsx` | Substituir ScrollArea |
| 6 | `src/components/combat/TacticalPauseModal.tsx` | Substituir 4x ScrollArea |
| 7 | `src/components/combat/CombatBoardLinker.tsx` | Substituir ScrollArea |
| 8 | `src/components/combat/HookExecutionLog.tsx` | Substituir ScrollArea |
| 9 | `src/components/combat/RangeCalculator.tsx` | Substituir ScrollArea |
| 10 | `src/components/combat/CombatStatsPanel.tsx` | Substituir ScrollArea |
| 11 | `src/components/combat/MacroBar.tsx` | Substituir ScrollArea horizontal |
| 12 | `src/components/campaign/handouts/PlayerHandoutsViewer.tsx` | Substituir ScrollArea |
| 13 | `src/components/campaign/master/HandoutsManager.tsx` | Substituir ScrollArea |

**Total: 13 arquivos**

---

## Resultado Esperado

1. **Erro #185 eliminado** - Sem loops de medição de layout do Radix
2. **Erro 406 eliminado** - Queries com `.maybeSingle()` não quebram
3. **Performance melhorada** - Menos overhead de ResizeObserver
4. **Estabilidade** - Campanha carrega e funciona sem crashar

---

## Notas Importantes

### Componentes Mantidos com ScrollArea
Os seguintes componentes são de baixo risco (conteúdo estático, sem realtime) e podem manter o ScrollArea:
- `MasterSheetViewer.tsx` - Apenas popovers com listas estáticas
- Componentes de ficha de personagem (fora do fluxo da campanha)
- Componentes admin/dev

### Por que não migrar tudo?
Migrar todos os 50+ arquivos de uma vez seria arriscado e demorado. A estratégia é focar nos componentes da **campanha** que estão causando o crash. Os demais podem ser migrados incrementalmente se apresentarem problemas.
