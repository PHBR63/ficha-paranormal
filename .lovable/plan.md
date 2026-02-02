
# Plano: Integrar Componentes de UX na Ficha de Personagem

## Objetivo
Adicionar os componentes `SaveStatusIndicator`, `OfflineBanner` e `KeyboardShortcutsHelp` criados na Fase 6 à ficha de personagem desktop (`CharacterSheet.tsx`), proporcionando feedback visual de salvamento, suporte offline e atalhos de teclado.

---

## Componentes a Integrar

### 1. OfflineBanner
**Localização**: Topo fixo da página, acima do header  
**Propósito**: Notificar o usuário quando estiver offline

### 2. SaveStatusIndicator
**Localização**: Header da ficha, próximo ao nome do personagem  
**Propósito**: Mostrar estado do salvamento (salvando, salvo, erro, offline)

### 3. KeyboardShortcutsHelp
**Localização**: Header, junto aos outros botões de ação  
**Propósito**: Exibir modal de atalhos (F1 ou ?)

---

## Mudanças Planejadas

### src/pages/CharacterSheet.tsx

#### Novos Imports
```typescript
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSheetKeyboardShortcuts } from '@/hooks/useSheetKeyboardShortcuts';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SaveStatusIndicator, SaveStatus } from '@/components/ui/SaveStatusIndicator';
import { KeyboardShortcutsHelp } from '@/components/ui/KeyboardShortcutsHelp';
```

#### Novos Estados e Hooks
```typescript
// Hook de status online (já existe no projeto)
const { isOnline } = useOnlineStatus();

// Estado de status de salvamento
const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
const [lastSaved, setLastSaved] = useState<Date | null>(null);

// Modal de atalhos
const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
```

#### Hook de Atalhos de Teclado
```typescript
// Hook de atalhos de teclado
useSheetKeyboardShortcuts({
  disabled: diceModalOpen || editModalOpen || nexModalOpen, // Desativa durante modais
  onRollAttribute: (attr) => handleAttributeRoll(attributes[attr]),
  onRollInitiative: () => handleSkillRoll('Iniciativa', character.agility, 0),
  onSave: () => handleManualSave(),
  onShowHelp: () => setShortcutsHelpOpen(true),
});
```

#### Handler de Salvamento Manual
```typescript
const handleManualSave = useCallback(async () => {
  if (!character || saving) return;
  
  setSaveStatus('saving');
  try {
    // Re-salva estado atual (HP, PE, SAN)
    const { error } = await supabase
      .from('characters')
      .update({
        hp_current: hpCurrent,
        pe_current: peCurrent,
        san_current: sanCurrent,
      })
      .eq('id', character.id);

    if (error) throw error;
    
    setSaveStatus('saved');
    setLastSaved(new Date());
    
    // Volta para idle após 3 segundos
    setTimeout(() => setSaveStatus('idle'), 3000);
  } catch {
    setSaveStatus('error');
  }
}, [character, saving, hpCurrent, peCurrent, sanCurrent]);
```

#### Atualização do Status ao Salvar
Modificar funções existentes de salvamento para atualizar `saveStatus`:
- `handleCombatStatsChange`
- `handleCharacterEdit`
- Outras funções que salvam no banco

#### Layout: OfflineBanner no Topo
```tsx
<div className={cn("min-h-screen bg-background...")}>
  {/* Banner de Offline - Fixo no topo */}
  <OfflineBanner isOffline={!isOnline} />
  
  {/* Atmospheric Effects */}
  <div className="fixed inset-0...">
```

#### Layout: Header com SaveStatus e KeyboardHelp
No header desktop (linhas 2342-2388):
```tsx
<div className="hidden sm:flex items-center gap-1 flex-shrink-0">
  {/* NOVO: Indicador de Status de Salvamento */}
  <SaveStatusIndicator
    status={!isOnline ? 'offline' : saveStatus}
    lastSaved={lastSaved}
    showLabel={false}
    size="sm"
  />
  
  {/* NOVO: Botão de Atalhos de Teclado */}
  <KeyboardShortcutsHelp
    open={shortcutsHelpOpen}
    onOpenChange={setShortcutsHelpOpen}
  />
  
  <ThemeSelector />
  <DiceRollHistoryDrawer ... />
  ...
</div>
```

---

## Fluxo de Status de Salvamento

```text
┌─────────────────────────────────────────────────────────────┐
│                    Estado: idle (Cloud)                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (usuário modifica dados)
┌─────────────────────────────────────────────────────────────┐
│                 Estado: saving (Loader)                     │
└─────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
┌──────────────────┐ ┌──────────────┐ ┌───────────────────┐
│ Estado: saved    │ │ Estado: error│ │ Estado: offline   │
│ (Check verde)    │ │ (Alerta)     │ │ (CloudOff)        │
└──────────────────┘ └──────────────┘ └───────────────────┘
        │                                      │
        ▼ (após 3s)                            │
┌─────────────────────────────────────────────────────────────┐
│                    Estado: idle                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Arquivos Modificados

| Arquivo | Tipo de Mudança |
|---------|-----------------|
| `src/pages/CharacterSheet.tsx` | Adicionar imports, estados, hooks, e componentes no JSX |

---

## Detalhes Técnicos

### Integração com Hook useOnlineStatus
O hook `useOnlineStatus` já existe em `src/hooks/useOnlineStatus.ts` e retorna `{ isOnline, isChecking, checkRealConnectivity }`.

### Integração com useSheetKeyboardShortcuts
O hook aceita callbacks para:
- `onRollAttribute(attribute)` - Alt+1 a Alt+5
- `onRollSkill()` - Alt+P
- `onRollInitiative()` - Alt+I
- `onOpenCombat()` - Alt+C
- `onSave()` - Ctrl+S
- `onShowHelp()` - F1 ou ?

### Desativação Durante Modais
Os atalhos são desativados quando modais importantes estão abertas para evitar conflitos.

### Responsividade
- `OfflineBanner`: Aparece em todas as resoluções
- `SaveStatusIndicator`: Visível apenas no desktop (dentro de `hidden sm:flex`)
- `KeyboardShortcutsHelp`: Visível apenas no desktop (atalhos são para teclado)
