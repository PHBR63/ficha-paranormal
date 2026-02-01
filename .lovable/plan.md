
# Plano: Continuação das Funcionalidades da Campanha v3

## Visão Geral

Continuação do desenvolvimento da interface de campanha v3, implementando as funcionalidades pendentes identificadas nos placeholders das abas e integrando bibliotecas externas modernas para melhorar a experiência.

---

## Estado Atual

```text
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENTES v3 EXISTENTES                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ IMPLEMENTADOS                                                │
│  ├─ CampaignShell.tsx (container principal)                     │
│  ├─ CampaignHeader.tsx (header compacto)                        │
│  ├─ CampaignNavigation.tsx (5 abas consolidadas)                │
│  ├─ CampaignStatusBar.tsx (presença inferior)                   │
│  ├─ PanelTab.tsx (grid de agentes com status)                   │
│  ├─ ChatTab.tsx (virtualizado com auto-scroll)                  │
│  └─ MapTab.tsx (tabuleiro tático full-screen)                   │
│                                                                  │
│  🚧 PARCIALMENTE IMPLEMENTADOS (placeholders)                    │
│  ├─ ResourcesTab.tsx (notas, handouts, timeline)                │
│  └─ MasterTab.tsx (NPCs, macros, áudio, jogadores)              │
│                                                                  │
│  ❌ FUNCIONALIDADES PENDENTES NO SHELL                           │
│  ├─ Modal de rolagem de dados (handleOpenDice)                  │
│  ├─ Modal de notas rápidas (handleOpenNotes)                    │
│  └─ Modal de configurações (handleOpenSettings)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Hooks Disponíveis (Backend Pronto)

| Hook | Status | Funcionalidades |
|------|--------|-----------------|
| `useCampaignData` | ✅ | Dados da campanha, membros, isMaster |
| `useCampaignRealtime` | ✅ | Chat, sessões, mensagens em tempo real |
| `useCampaignPresence` | ✅ | Presença online, avatares |
| `useTacticalBoard` | ✅ | Mapa, tokens, fog, medição |
| `useCampaignAudio` | ✅ | Biblioteca de áudio, cenas sonoras, SFX |
| `useHandouts` | ✅ | Documentos, pistas, imagens compartilháveis |
| `useMasterActions` | ✅ | Ajuste HP/PE/SAN, condições |
| `useWhispers` | ✅ | Mensagens privadas |
| `useMacros` | ✅ | Ações rápidas do mestre |

---

## Bibliotecas Externas Recomendadas

### Já Instaladas (Usar Melhor)

| Biblioteca | Versão | Uso Proposto |
|------------|--------|--------------|
| `@tanstack/react-virtual` | ^3.13.13 | Timeline virtualizada, lista de handouts |
| `framer-motion` | ^12.23.26 | Animações de dados, transições de modal |
| `react-konva` | ^19.2.1 | Já em uso no TacticalBoard |
| `@dnd-kit/core` | ^6.3.1 | Reordenação de widgets do mestre |

### Novas Bibliotecas Sugeridas

| Biblioteca | Propósito | Justificativa |
|------------|-----------|---------------|
| `@tiptap/react` | Editor de notas rico | Headless, extensível, colaboração via Yjs |
| `react-chrono` | Timeline de campanha | Vertical/horizontal, suporte a mídia |
| `howler` | Player de áudio | Já temos lógica, falta UI robusta |

---

## Fase 1: Modal de Rolagem de Dados

### 1.1 Criar DiceRollModal.tsx

Modal para rolagem rápida de dados integrado ao sistema v1.3:

```tsx
// src/components/campaign/v3/modals/DiceRollModal.tsx

// Funcionalidades:
// - Input para expressão de dados (2d20+5, 3d6, etc.)
// - Parser de dados compatível com OP v1.3
// - Animação de rolagem usando Framer Motion
// - Histórico de últimas rolagens
// - Envio automático para o chat
// - Rolagens ocultas (mestre)
// - Suporte a vantagem/desvantagem
```

### 1.2 Integração

```tsx
// No CampaignShell.tsx
const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);

const handleOpenDice = useCallback(() => {
  setIsDiceModalOpen(true);
}, []);

// Renderização
{isDiceModalOpen && (
  <DiceRollModal
    onClose={() => setIsDiceModalOpen(false)}
    onRoll={(result) => sendMessage(result.description, 'dice_roll', result.metadata)}
  />
)}
```

---

## Fase 2: Sistema de Notas Completo (ResourcesTab)

### 2.1 Instalar Tiptap

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
```

### 2.2 Criar Editor de Notas

```tsx
// src/components/campaign/v3/resources/NoteEditor.tsx

// Funcionalidades:
// - Editor WYSIWYG minimalista
// - Formatação básica (negrito, itálico, listas)
// - Vinculação a sessões
// - Auto-save com debounce
// - Exportação para Markdown
```

### 2.3 Integrar com ResourcesTab

```tsx
// Atualizar ResourcesTab.tsx para consumir useHandouts e renderizar:
// - Lista de notas com busca
// - Editor inline ou modal
// - Indicadores de compartilhamento
```

---

## Fase 3: Sistema de Áudio (MasterTab)

### 3.1 Criar AudioControlPanel.tsx

```tsx
// src/components/campaign/v3/master/AudioControlPanel.tsx

// Funcionalidades usando useCampaignAudio:
// - Player minimalista com controles
// - Lista de cenas sonoras (cards clicáveis)
// - SFX rápidos (grid de botões)
// - Upload de áudio (mestre)
// - Volume master + mute global
// - Sincronização automática para jogadores
```

### 3.2 Estrutura Visual

```text
┌─────────────────────────────────────────┐
│ 🎵 ÁUDIO                    [🔊] [⏸️]   │
├─────────────────────────────────────────┤
│ CENAS SONORAS                           │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│ │ 🏚️   │ │ 🌧️   │ │ ⚔️   │ │ 🔮   │    │
│ │ Casa │ │ Chuva│ │ Luta │ │ Ritual│   │
│ └──────┘ └──────┘ └──────┘ └──────┘    │
├─────────────────────────────────────────┤
│ SFX RÁPIDOS                             │
│ [🚪 Porta] [👣 Passos] [🔫 Tiro] [⚡]   │
└─────────────────────────────────────────┘
```

---

## Fase 4: Controles de Personagem (MasterTab)

### 4.1 Criar PlayerControlPanel.tsx

```tsx
// src/components/campaign/v3/master/PlayerControlPanel.tsx

// Funcionalidades usando useMasterActions:
// - Cards compactos por jogador
// - Botões +/- para HP, PE, SAN
// - Dropdown para aplicar condições
// - Indicador de condições ativas
// - Ações em lote (curar todos, etc.)
```

### 4.2 Lista de Condições OP v1.3

```tsx
const CONDITIONS = [
  'Agarrado', 'Amedrontado', 'Alquebrado', 'Atordoado',
  'Caído', 'Cego', 'Confuso', 'Desprevenido',
  'Exausto', 'Fascinado', 'Imóvel', 'Inconsciente',
  'Enjoado', 'Envenenado', 'Paralisado', 'Pasmo',
  'Sangrando', 'Surdo', 'Traumatizado', 'Vulnerável'
];
```

---

## Fase 5: Timeline de Campanha (ResourcesTab)

### 5.1 Criar CampaignTimeline.tsx

```tsx
// src/components/campaign/v3/resources/CampaignTimeline.tsx

// Funcionalidades:
// - Renderização vertical de eventos
// - Agrupamento por sessão
// - Tipos: evento, descoberta, combate, morte
// - Filtragem por tipo
// - Virtualização para histórico longo
```

### 5.2 Estrutura Visual

```text
┌─────────────────────────────────────────┐
│ TIMELINE                      [Filtrar] │
├─────────────────────────────────────────┤
│ ● Sessão 15 - 28/01/2026                │
│ │                                       │
│ ├─ 🔍 Pista encontrada: Diário antigo   │
│ ├─ ⚔️ Combate: Zumbis no cemitério     │
│ └─ 💀 Morte: NPC Maria                  │
│                                         │
│ ● Sessão 14 - 21/01/2026                │
│ │                                       │
│ ├─ 📍 Chegada em Mauá                   │
│ └─ 👤 Novo NPC: Padre João              │
└─────────────────────────────────────────┘
```

---

## Fase 6: Modal de Configurações

### 6.1 Criar CampaignSettingsModal.tsx

```tsx
// src/components/campaign/v3/modals/CampaignSettingsModal.tsx

// Seções:
// - Informações da campanha (nome, descrição)
// - Gerenciamento de membros (convidar, remover)
// - Configurações de notificação
// - Importar/Exportar dados
// - Zona de perigo (arquivar, excluir)
```

---

## Resumo de Arquivos

### Novos Arquivos

| Caminho | Descrição |
|---------|-----------|
| `src/components/campaign/v3/modals/DiceRollModal.tsx` | Rolador de dados animado |
| `src/components/campaign/v3/modals/QuickNotesModal.tsx` | Notas rápidas |
| `src/components/campaign/v3/modals/CampaignSettingsModal.tsx` | Configurações |
| `src/components/campaign/v3/resources/NoteEditor.tsx` | Editor Tiptap |
| `src/components/campaign/v3/resources/NotesList.tsx` | Lista de notas |
| `src/components/campaign/v3/resources/HandoutCard.tsx` | Card de handout |
| `src/components/campaign/v3/resources/CampaignTimeline.tsx` | Timeline vertical |
| `src/components/campaign/v3/master/AudioControlPanel.tsx` | Controles de áudio |
| `src/components/campaign/v3/master/PlayerControlPanel.tsx` | Controles HP/PE/SAN |
| `src/components/campaign/v3/master/ConditionSelector.tsx` | Seletor de condições |
| `src/components/campaign/v3/master/index.ts` | Barrel export |
| `src/components/campaign/v3/modals/index.ts` | Barrel export |
| `src/components/campaign/v3/resources/index.ts` | Barrel export |

### Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/pages/CampaignShell.tsx` | Adicionar modais, integrar useMasterActions |
| `src/components/campaign/v3/tabs/ResourcesTab.tsx` | Integrar NoteEditor, Timeline, Handouts |
| `src/components/campaign/v3/tabs/MasterTab.tsx` | Integrar AudioControlPanel, PlayerControlPanel |
| `src/components/campaign/v3/index.ts` | Exportar novos componentes |

---

## Dependências a Instalar

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
```

---

## Cronograma de Implementação

| Fase | Componentes | Prioridade |
|------|-------------|------------|
| 1 | DiceRollModal | ALTA - Mais solicitado |
| 2 | NoteEditor + NotesList | ALTA - Essencial para jogo |
| 3 | AudioControlPanel | MÉDIA - Melhora imersão |
| 4 | PlayerControlPanel | ALTA - Essencial para mestre |
| 5 | CampaignTimeline | BAIXA - Enhancement |
| 6 | CampaignSettingsModal | MÉDIA - Configuração |

---

## Ordem de Implementação Sugerida

1. **Primeiro**: DiceRollModal + PlayerControlPanel (funcionalidades mais usadas)
2. **Segundo**: AudioControlPanel (hook já pronto, falta UI)
3. **Terceiro**: NoteEditor + ResourcesTab completo
4. **Quarto**: Timeline e Settings

---

## Seção Técnica

### Padrões a Seguir

1. **Ref-First Pattern**: Para callbacks estáveis (evita #185)
2. **Memoização**: `memo()` em todos os componentes de lista
3. **Virtualização**: Para listas longas (notas, timeline)
4. **Lazy Loading**: Modais carregados sob demanda

### Estrutura de Modal

```tsx
// Padrão para todos os modais
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const ExampleModal = memo(function ExampleModal({
  open,
  onOpenChange,
  // ...props
}: ExampleModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Título</DialogTitle>
        </DialogHeader>
        {/* Conteúdo */}
      </DialogContent>
    </Dialog>
  );
});
```

### Integração com Hooks Existentes

```tsx
// CampaignShell.tsx já tem os hooks configurados
// Basta passar para os novos componentes:

const masterActions = useMasterActions({
  campaignId: campaignId || '',
  isMaster,
});

const audioData = useCampaignAudio(campaignId || '', isMaster);

// E usar nos componentes:
<PlayerControlPanel
  members={members}
  adjustHP={masterActions.adjustHP}
  adjustPE={masterActions.adjustPE}
  adjustSAN={masterActions.adjustSAN}
  applyCondition={masterActions.applyCondition}
  removeCondition={masterActions.removeCondition}
/>
```
