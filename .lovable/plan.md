
# Plano: Reestruturação Visual Completa da CampaignView

## Visão Geral

Após análise detalhada do código atual e pesquisa de bibliotecas compatíveis com React 19 + TypeScript + Tailwind, proponho uma reestruturação completa utilizando as bibliotecas já instaladas de forma mais eficiente, além da adição de duas novas bibliotecas para resolver problemas estruturais.

---

## Bibliotecas Envolvidas

### Já Instaladas (usar melhor)
| Biblioteca | Versão | Uso Atual | Uso Proposto |
|------------|--------|-----------|--------------|
| `react-resizable-panels` | ^2.1.9 | Não utilizada | Layout principal com painéis redimensionáveis |
| `@tanstack/react-virtual` | ^3.13.13 | Não utilizada | Virtualização de listas longas (chat, diário) |
| `framer-motion` | ^12.23.26 | Animações básicas | Transições de layout e feedback visual |
| `react-konva` | ^19.2.1 | TacticalBoard | Manter, mas otimizar camadas |

### Novas Bibliotecas Sugeridas
| Biblioteca | Propósito | Justificativa |
|------------|-----------|---------------|
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag-and-drop modular | Reordenação de tokens, ordem de iniciativa, widgets do mestre |

---

## Arquitetura Visual Proposta

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ HEADER (shrink-0)                                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────┐ ┌─────────┐  │
│  │                                                               │ │         │  │
│  │                    PAINEL PRINCIPAL                           │ │ SIDEBAR │  │
│  │                    (ResizablePanel)                           │ │COLAPSÁVEL│ │
│  │                                                               │ │         │  │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │ Avatar  │  │
│  │  │ TABS (NavigationTabs component)                          │ │ │ Cards   │  │
│  │  └──────────────────────────────────────────────────────────┘ │ │         │  │
│  │                                                               │ │ Status  │  │
│  │  ┌─────────────────────────┐ ┌────────────────────────────┐  │ │ Online  │  │
│  │  │                         │ │                            │  │ │         │  │
│  │  │  CONTEÚDO PRIMÁRIO      │ │  PAINEL SECUNDÁRIO        │  │ │         │  │
│  │  │  (Chat, Mapa, Status)   │ │  (Mestre: NPCs, Macros)   │  │ │         │  │
│  │  │                         │ │  (Jogador: Inventário)    │  │ │         │  │
│  │  │  ResizablePanel         │ │  ResizablePanel           │  │ │         │  │
│  │  │  (virtualizado)         │ │  (redimensionável)        │  │ │         │  │
│  │  │                         │ │                            │  │ │         │  │
│  │  └─────────────────────────┘ └────────────────────────────┘  │ │         │  │
│  │                                                               │ │         │  │
│  └───────────────────────────────────────────────────────────────┘ └─────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Layout Base com Painéis Redimensionáveis

### 1.1 Criar CampaignLayout.tsx

Novo componente de layout principal usando `react-resizable-panels`:

```tsx
// src/components/campaign/layout/CampaignLayout.tsx
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

interface CampaignLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  secondaryPanel?: React.ReactNode;
  showSecondary?: boolean;
}

export function CampaignLayout({ 
  children, 
  sidebar, 
  secondaryPanel,
  showSecondary = false 
}: CampaignLayoutProps) {
  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      {/* Painel principal */}
      <ResizablePanel defaultSize={showSecondary ? 60 : 80} minSize={40}>
        {children}
      </ResizablePanel>
      
      {/* Painel secundário opcional (mestre) */}
      {showSecondary && secondaryPanel && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
            {secondaryPanel}
          </ResizablePanel>
        </>
      )}
      
      {/* Sidebar de jogadores */}
      <ResizableHandle />
      <ResizablePanel defaultSize={20} minSize={5} maxSize={30} collapsible>
        {sidebar}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
```

### 1.2 Arquivos a Criar

| Arquivo | Propósito |
|---------|-----------|
| `src/components/campaign/layout/CampaignLayout.tsx` | Container principal com painéis |
| `src/components/campaign/layout/NavigationTabs.tsx` | Tabs otimizadas com ícones e badges |
| `src/components/campaign/layout/index.ts` | Barrel export |

---

## Fase 2: Chat Virtualizado

### 2.1 Criar VirtualizedChatList.tsx

Usando `@tanstack/react-virtual` para listas de mensagens:

```tsx
// src/components/campaign/chat/VirtualizedChatList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedChatListProps {
  messages: CampaignMessage[];
  currentUserId: string;
  masterId: string;
}

export function VirtualizedChatList({ messages, currentUserId, masterId }: VirtualizedChatListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Altura estimada de cada mensagem
    overscan: 5,
  });
  
  // Auto-scroll para novas mensagens
  useEffect(() => {
    virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
  }, [messages.length]);
  
  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto">
      <div
        style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ChatMessage
              message={messages[virtualRow.index]}
              currentUserId={currentUserId}
              masterId={masterId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2.2 Benefícios

- Suporte a milhares de mensagens sem perda de performance
- Scroll suave mesmo com histórico longo
- Reduz DOM nodes de 1000+ para ~20 visíveis

---

## Fase 3: Sidebar Melhorada

### 3.1 Atualizar PlayersSidebar.tsx

Melhorias com animações e virtualização:

```tsx
// Alterações principais:
// 1. Usar useVirtualizer para listas longas de membros
// 2. Adicionar animações de entrada/saída com AnimatePresence
// 3. Implementar colapso animado com LayoutGroup
// 4. Adicionar indicadores de atividade em tempo real

// Exemplo de animação de colapso:
<motion.aside
  layout
  initial={false}
  animate={{ width: isCollapsed ? 64 : 320 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
  {/* Conteúdo */}
</motion.aside>
```

---

## Fase 4: Tabuleiro Tático Otimizado

### 4.1 Corrigir TacticalBoard.tsx

Problemas identificados e soluções:

| Problema | Solução |
|----------|---------|
| Canvas não preenche espaço | ResizeObserver (já planejado) |
| Overlay bloqueia interações | `pointer-events-none` (já aplicado) |
| Re-renders desnecessários | Memoização de camadas Konva |
| Zoom em mobile bugado | Implementar pinch-to-zoom nativo |

### 4.2 Estrutura de Camadas Konva

```tsx
// Otimizar TacticalBoardKonva.tsx com camadas separadas:
<Stage ref={stageRef} width={canvasSize.width} height={canvasSize.height}>
  {/* Camada de background - raramente atualiza */}
  <Layer listening={false}>
    <BackgroundImage />
  </Layer>
  
  {/* Camada de grid - atualiza com zoom */}
  <Layer listening={false}>
    <GridLines />
  </Layer>
  
  {/* Camada de fog - atualiza com edição do mestre */}
  <Layer>
    <FogOfWar />
  </Layer>
  
  {/* Camada de tokens - atualiza frequentemente */}
  <Layer>
    {tokens.map(token => (
      <TokenRenderer key={token.id} token={token} />
    ))}
  </Layer>
  
  {/* Camada de UI - sempre no topo */}
  <Layer listening={false}>
    <MeasurementRuler />
    <SelectionBox />
  </Layer>
</Stage>
```

---

## Fase 5: Status Grid Responsivo

### 5.1 Atualizar CampaignStatusGrid.tsx

```tsx
// Usar CSS Grid com auto-fill para responsividade perfeita:
<div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
  {members.map(member => (
    <MagicCard key={member.id}>
      {/* Conteúdo do card */}
    </MagicCard>
  ))}
</div>
```

### 5.2 Cards com Micro-interações

```tsx
// Adicionar feedback visual com Framer Motion:
<motion.div
  whileHover={{ scale: 1.02, y: -4 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 400 }}
>
  <MagicCard>
    {/* Conteúdo */}
  </MagicCard>
</motion.div>
```

---

## Fase 6: Aba do Mestre com Widgets Arrastáveis (Opcional)

### 6.1 Instalar dnd-kit

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 6.2 Criar MasterDashboard.tsx

```tsx
// src/components/campaign/master/MasterDashboard.tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';

// Widgets que o mestre pode reorganizar:
const MASTER_WIDGETS = [
  { id: 'npcs', title: 'NPCs Ativos', component: NPCWidget },
  { id: 'macros', title: 'Macros Rápidas', component: MacrosWidget },
  { id: 'audio', title: 'Controle de Áudio', component: AudioWidget },
  { id: 'initiative', title: 'Iniciativa', component: InitiativeWidget },
];
```

---

## Resumo de Arquivos

### Novos Arquivos

| Caminho | Descrição |
|---------|-----------|
| `src/components/campaign/layout/CampaignLayout.tsx` | Layout principal com painéis redimensionáveis |
| `src/components/campaign/layout/NavigationTabs.tsx` | Tabs otimizadas |
| `src/components/campaign/layout/index.ts` | Barrel export |
| `src/components/campaign/chat/VirtualizedChatList.tsx` | Chat virtualizado |
| `src/components/campaign/master/MasterDashboard.tsx` | Dashboard com widgets arrastáveis |
| `src/components/campaign/master/widgets/` | Componentes de widget individuais |

### Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/pages/CampaignView.tsx` | Usar novo CampaignLayout, simplificar estrutura |
| `src/components/campaign/PlayersSidebar.tsx` | Animações, virtualização, colapso animado |
| `src/components/campaign/CampaignStatusGrid.tsx` | CSS Grid responsivo, micro-interações |
| `src/components/campaign/tabs/CampaignChatTab.tsx` | Usar VirtualizedChatList |
| `src/components/campaign/tactical/TacticalBoard.tsx` | ResizeObserver, otimização de camadas |
| `src/components/campaign/tabs/CampaignMasterTab.tsx` | Integrar MasterDashboard |

---

## Dependências a Instalar

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Cronograma de Implementação

| Fase | Duração Estimada | Prioridade |
|------|------------------|------------|
| 1. Layout com Painéis | Alta complexidade | CRÍTICA |
| 2. Chat Virtualizado | Média complexidade | ALTA |
| 3. Sidebar Melhorada | Baixa complexidade | MÉDIA |
| 4. Tabuleiro Otimizado | Alta complexidade | ALTA |
| 5. Status Grid | Baixa complexidade | MÉDIA |
| 6. Widgets do Mestre | Média complexidade | BAIXA |

---

## Resultado Visual Esperado

```text
ANTES:
┌────────────────────────────────────┐
│ [Tabs fixas no topo]               │
├────────────────────────────────────┤
│                                    │
│   Conteúdo cortado ou com         │
│   espaços em branco               │
│                                    │
│   Sem redimensionamento           │
│                                    │
└────────────────────────────────────┘

DEPOIS:
┌────────────────────────────────────────────────────────────┐
│ [Tabs com badges de notificação]                           │
├───────────────────────────────────┬────────────────────────┤
│                                   │                        │
│   PAINEL REDIMENSIONÁVEL          │   SIDEBAR COLAPSÁVEL   │
│                                   │                        │
│   ├─ Chat virtualizado           │   ├─ Avatares         │
│   ├─ Mapa full-height            │   ├─ Status bars      │
│   └─ Widgets arrastáveis         │   └─ Presença online  │
│                                   │                        │
│   ◀─────── Handle ──────▶        │                        │
│                                   │                        │
└───────────────────────────────────┴────────────────────────┘
```

---

## Observações Técnicas

1. **Compatibilidade React 19**: Todas as bibliotecas foram verificadas para compatibilidade
2. **Performance**: Virtualização reduz DOM nodes de milhares para dezenas
3. **Acessibilidade**: dnd-kit tem suporte nativo a keyboard navigation
4. **Persistência**: Estado dos painéis pode ser salvo em localStorage
5. **Mobile**: Painéis redimensionáveis desabilitados em telas pequenas (layout stack)

