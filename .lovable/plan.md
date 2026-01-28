

# Plano: Correção Definitiva do React Error #185 na Campanha

## Resumo Executivo

O erro **React #185** (Maximum update depth exceeded) persiste na página de campanha (`/campaigns/:id`). A análise do stack trace confirma que o problema está no componente `scroll-area-*.js` do Radix UI, que entra em loop infinito de recalculo de layout quando há atualizações rápidas de estado (via Realtime ou animações).

Adicionalmente, corrigiremos o erro **HTTP 406** no `push_subscriptions` para que retorne silenciosamente quando não houver assinatura registrada.

---

## Diagnóstico Completo

### Causa Raiz do #185
O **Radix UI ScrollArea** faz medições de layout (`getBoundingClientRect`, `ResizeObserver`) para calcular a posição e tamanho da barra de rolagem customizada. No React 19, quando o conteúdo dentro do ScrollArea é atualizado rapidamente (mensagens em tempo real, presença de usuários, etc.), essas medições disparam re-renders que, por sua vez, disparam novas medições, criando um loop infinito.

### Componentes Afetados
Os seguintes componentes ainda usam `ScrollArea` e são renderizados na página de campanha:

| Componente | Arquivo | Risco |
|------------|---------|-------|
| SessionManager | `src/components/campaign/SessionManager.tsx:11` | Alto (realtime) |
| NotesPanel | `src/components/campaign/NotesPanel.tsx:11` | Médio |
| SessionDiary | `src/components/campaign/diary/SessionDiary.tsx:11` | Médio |
| CampaignTimeline | `src/components/campaign/diary/CampaignTimeline.tsx:15` | Médio |
| NPCManager | `src/components/campaign/master/NPCManager.tsx:16` | Baixo |
| MasterSheetViewer | `src/components/campaign/master/MasterSheetViewer.tsx:16` | Baixo |
| TacticalBoard | `src/components/campaign/tactical/TacticalBoard.tsx:23` | Médio |
| WhisperDialog | `src/components/campaign/chat/WhisperDialog.tsx:9` | Alto (realtime) |
| MacrosPanel | `src/components/campaign/chat/MacrosPanel.tsx:14` | Baixo |
| AudioMasterPanel | `src/components/campaign/audio/AudioMasterPanel.tsx:28` | Baixo |
| SoundSceneManager | `src/components/campaign/audio/SoundSceneManager.tsx:15` | Baixo |

### Padrão Já Aplicado com Sucesso
O chat principal e a sidebar de jogadores já foram migrados para **overflow nativo**:
- `CampaignView.tsx:927` - Chat usa `div` com `overflow-y-auto`
- `PlayersSidebar.tsx:176` - Sidebar usa `div` com `overflow-y-auto`

---

## Plano de Correção

### Fase 1: Migrar Componentes de Alto Risco (Realtime)

#### 1.1 SessionManager.tsx
Substituir `ScrollArea` por container nativo:
```text
Linha 11: Remover import de ScrollArea
Linhas onde usa ScrollArea: Substituir por <div className="overflow-y-auto">
```

#### 1.2 WhisperDialog.tsx
Substituir `ScrollArea` na lista de sussurros:
```text
Linha 9: Remover import de ScrollArea
Linhas onde usa ScrollArea: Substituir por <div className="overflow-y-auto max-h-[400px]">
```

#### 1.3 NotesPanel.tsx
Substituir `ScrollArea` na lista de notas:
```text
Linha 11: Remover import de ScrollArea
Linhas onde usa ScrollArea: Substituir por <div className="overflow-y-auto">
```

### Fase 2: Migrar Componentes de Médio Risco

#### 2.1 SessionDiary.tsx
```text
Linha 11: Remover import de ScrollArea
Linhas onde usa ScrollArea: Substituir por <div className="overflow-y-auto">
```

#### 2.2 CampaignTimeline.tsx
```text
Linha 15: Remover import de ScrollArea
Linhas onde usa ScrollArea: Substituir por <div className="overflow-y-auto">
```

#### 2.3 TacticalBoard.tsx
```text
Linha 23: Remover import de ScrollArea
Linhas onde usa ScrollArea: Substituir por <div className="overflow-y-auto">
```

### Fase 3: Migrar Componentes de Baixo Risco (Mestre)

Os componentes usados apenas pelo mestre têm menor frequência de atualização, mas devem ser migrados para consistência:

- NPCManager.tsx
- MasterSheetViewer.tsx
- MacrosPanel.tsx
- AudioMasterPanel.tsx
- SoundSceneManager.tsx

### Fase 4: Corrigir Erro 406 do push_subscriptions

#### 4.1 Usar `.maybeSingle()` em todas as queries de assinatura
O hook `usePushNotifications.ts` já foi corrigido, mas verificar se há outros pontos do código que fazem queries em `push_subscriptions` com `.single()`.

#### 4.2 Verificar hook `useWhispers.ts`
O arquivo `src/hooks/campaign/useWhispers.ts:52-54` ainda usa `.single()` para buscar perfis, o que pode gerar 406 se um usuário for deletado:
```text
Linhas 52-54: Substituir .single() por .maybeSingle()
```

---

## Padrão de Código para Migração

Para cada componente, o padrão de substituição é:

```text
ANTES:
import { ScrollArea } from '@/components/ui/scroll-area';
...
<ScrollArea className="h-[400px]">
  <div className="space-y-2">
    {items.map(...)}
  </div>
</ScrollArea>

DEPOIS:
// ScrollArea removido - usando overflow nativo para evitar bug #185 com React 19
...
<div 
  className="h-[400px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
>
  <div className="space-y-2">
    {items.map(...)}
  </div>
</div>
```

---

## Arquivos a Serem Modificados

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `src/components/campaign/SessionManager.tsx` | Remover ScrollArea, usar div nativo |
| `src/components/campaign/NotesPanel.tsx` | Remover ScrollArea, usar div nativo |
| `src/components/campaign/diary/SessionDiary.tsx` | Remover ScrollArea, usar div nativo |
| `src/components/campaign/diary/CampaignTimeline.tsx` | Remover ScrollArea, usar div nativo |
| `src/components/campaign/chat/WhisperDialog.tsx` | Remover ScrollArea, usar div nativo |
| `src/components/campaign/tactical/TacticalBoard.tsx` | Remover ScrollArea, usar div nativo |
| `src/components/campaign/master/NPCManager.tsx` | Remover ScrollArea, usar div nativo |
| `src/components/campaign/master/MasterSheetViewer.tsx` | Remover ScrollArea, usar div nativo |
| `src/components/campaign/chat/MacrosPanel.tsx` | Remover ScrollArea, usar div nativo |
| `src/components/campaign/audio/AudioMasterPanel.tsx` | Remover ScrollArea, usar div nativo |
| `src/components/campaign/audio/SoundSceneManager.tsx` | Remover ScrollArea, usar div nativo |
| `src/hooks/campaign/useWhispers.ts` | Substituir .single() por .maybeSingle() |

---

## Resultado Esperado

1. **Erro #185 eliminado** - Sem loops de medição de layout
2. **Erro 406 eliminado** - Queries retornam null em vez de erro
3. **Performance melhorada** - Menos overhead de ResizeObserver
4. **Consistência** - Todos os componentes de campanha seguem o mesmo padrão

---

## Detalhes Técnicos

### Por que overflow nativo funciona?
O CSS `overflow-y: auto` usa a scrollbar nativa do navegador, que não precisa de medições JavaScript para calcular sua posição. Isso elimina a fonte do loop infinito.

### Classes CSS utilizadas
```text
overflow-y-auto       → Habilita scroll vertical quando necessário
overscroll-contain    → Impede scroll chaining (propagação para elementos pai)
scrollbar-thin        → Tailwind: scrollbar fina (via plugin)
scrollbar-thumb-border → Tailwind: cor do thumb da scrollbar
scrollbar-track-transparent → Tailwind: track invisível
```

### Compatibilidade
- Chrome/Edge: Suporte nativo
- Firefox: Suporte via `scrollbar-width: thin`
- Safari: Scrollbar nativa (sem customização)

---

## Ordem de Implementação

1. Componentes de alto risco (SessionManager, WhisperDialog, NotesPanel)
2. Componentes de médio risco (SessionDiary, CampaignTimeline, TacticalBoard)
3. Componentes de baixo risco (NPCManager, MasterSheetViewer, etc.)
4. Hook useWhispers (correção do 406)

