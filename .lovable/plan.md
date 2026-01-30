
# Plano: Correção de Responsividade e Espaços em Branco na CampaignView

## Diagnóstico Confirmado

Analisando a screenshot e o código, identifiquei os seguintes problemas de responsividade:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                         LAYOUT ATUAL                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────┐  ┌────────────────┐                  │
│  │                                     │  │                │                  │
│  │       ESPAÇO EM BRANCO              │  │   SIDEBAR      │                  │
│  │       (max-w-* + mx-auto)           │  │   w-80/w-96    │                  │
│  │                                     │  │                │                  │
│  │   ┌───────────────────────┐         │  │  (fixa, não    │                  │
│  │   │                       │         │  │   redimensiona)│                  │
│  │   │   CONTEÚDO LIMITADO   │         │  │                │                  │
│  │   │   (ex: max-w-5xl)     │         │  │                │                  │
│  │   │                       │         │  │                │                  │
│  │   └───────────────────────┘         │  └────────────────┘                  │
│  │                                     │                                      │
│  │       ESPAÇO EM BRANCO              │  <-- hidden lg:flex                  │
│  │                                     │      (invisível em mobile)           │
│  └─────────────────────────────────────┘                                      │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Problemas Identificados

| Problema | Arquivo | Linhas | Impacto |
|----------|---------|--------|---------|
| `max-w-6xl mx-auto` na aba Status | `CampaignView.tsx` | 545 | ~600px de espaço vazio em telas 1920px |
| `max-w-3xl mx-auto` na aba Condições | `CampaignView.tsx` | 599 | ~800px de espaço vazio |
| `max-w-4xl mx-auto` na aba Notas | `CampaignView.tsx` | 621 | ~700px de espaço vazio |
| `max-w-5xl mx-auto` na aba Diário | `CampaignView.tsx` | 661 | ~500px de espaço vazio |
| `max-w-4xl mx-auto` na aba Sessões | `CampaignView.tsx` | 648 | ~700px de espaço vazio |
| `max-w-5xl mx-auto` na aba Handouts | `CampaignView.tsx` | 630 | ~500px de espaço vazio |
| `max-w-4xl mx-auto` no Chat | `CampaignChatTab.tsx` | 160, 175 | ~700px de espaço vazio |
| `max-w-7xl mx-auto` no Combate | `CampaignCombatTab.tsx` | 33 | ~300px de espaço vazio |
| `h-[400px]` e `h-[500px]` fixos | Vários | - | Não preenche altura disponível |
| Sidebar `hidden lg:flex` | `PlayersSidebar.tsx` | 138 | Invisível abaixo de 1024px |

---

## Solução Proposta

### Fase 1: Responsividade das Abas (Crítico)

Substituir os contêineres com largura máxima estática por layouts flexíveis que ocupam todo o espaço disponível:

#### 1.1 CampaignView.tsx - Remover Limitações de Largura

**Antes:**
```tsx
<TabsContent value="status" className="flex-1 p-6 sm:p-8 m-0 overflow-auto">
  <div className="max-w-6xl mx-auto">
    ...
  </div>
</TabsContent>
```

**Depois:**
```tsx
<TabsContent value="status" className="flex-1 p-4 sm:p-6 lg:p-8 m-0 overflow-auto">
  <div className="w-full">
    ...
  </div>
</TabsContent>
```

Alterações específicas por aba:

| Aba | Alteração |
|-----|-----------|
| Status | `max-w-6xl mx-auto` → `w-full` |
| Condições | `max-w-3xl mx-auto` → `max-w-4xl lg:max-w-6xl xl:max-w-full mx-auto` |
| Notas | `max-w-4xl mx-auto` → `w-full` |
| Sessões | `max-w-4xl mx-auto` → `max-w-5xl lg:max-w-6xl xl:max-w-full mx-auto` |
| Diário | `max-w-5xl mx-auto` → `max-w-6xl lg:max-w-7xl xl:max-w-full mx-auto` |
| Handouts | `max-w-5xl mx-auto` → `max-w-6xl lg:max-w-full mx-auto` |

#### 1.2 CampaignChatTab.tsx - Expandir Mensagens

**Antes:**
```tsx
<div className="space-y-4 max-w-4xl mx-auto">
```

**Depois:**
```tsx
<div className="space-y-4 max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
```

#### 1.3 CampaignCombatTab.tsx - Usar Largura Total

**Antes:**
```tsx
<div className="space-y-8 max-w-7xl mx-auto">
```

**Depois:**
```tsx
<div className="space-y-8 w-full">
```

---

### Fase 2: Sidebar Responsiva com Toggle (Média)

Criar um sistema onde a sidebar pode ser colapsada/expandida e visível em mobile via botão:

#### 2.1 PlayersSidebar.tsx - Adicionar Toggle

**Modificações:**
- Adicionar prop `isCollapsed` e `onToggle`
- Criar modo compacto para largura reduzida (w-16)
- Exibir apenas avatares no modo compacto
- Adicionar botão flutuante para mobile

```tsx
interface PlayersSidebarProps {
  // ... props existentes
  isCollapsed?: boolean;
  onToggle?: () => void;
}

// Modo compacto
<aside className={cn(
  'border-l border-border bg-gradient-to-b from-card/50 to-card/30 backdrop-blur-sm flex flex-col transition-all duration-300',
  isCollapsed ? 'w-16' : 'w-80 xl:w-96',
  'hidden md:flex' // Visível a partir de md (768px)
)}>
```

#### 2.2 CampaignView.tsx - Adicionar Estado de Collapse

```tsx
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

// Na sidebar
<PlayersSidebar
  // ... outras props
  isCollapsed={sidebarCollapsed}
  onToggle={() => setSidebarCollapsed(prev => !prev)}
/>

// Botão flutuante para mobile (abaixo de md)
{!sidebarCollapsed && (
  <div className="fixed bottom-4 right-4 md:hidden z-50">
    <Button onClick={() => setSidebarCollapsed(false)}>
      <Users className="w-4 h-4" />
    </Button>
  </div>
)}
```

---

### Fase 3: Alturas Dinâmicas (Alta)

Substituir alturas fixas por cálculos baseados no viewport:

#### 3.1 SessionDiary.tsx

**Antes:**
```tsx
<div className="h-[500px] overflow-y-auto ...">
```

**Depois:**
```tsx
<div className="h-[calc(100vh-400px)] min-h-[300px] max-h-[600px] overflow-y-auto ...">
```

#### 3.2 SessionManager.tsx

**Antes:**
```tsx
<div className="h-[400px] overflow-y-auto ...">
```

**Depois:**
```tsx
<div className="h-[calc(100vh-350px)] min-h-[250px] max-h-[500px] overflow-y-auto ...">
```

#### 3.3 NotesPanel.tsx

**Antes:**
```tsx
<div className="h-[400px] overflow-y-auto ...">
```

**Depois:**
```tsx
<div className="flex-1 min-h-[200px] overflow-y-auto ...">
```

---

### Fase 4: Grid Responsivo do CampaignStatusGrid (Média)

Melhorar o grid para usar mais espaço:

**Antes:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
```

**Depois:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
```

---

### Fase 5: MasterTab com Grid Expandido (Baixa)

O `CampaignMasterTab` pode ter um layout mais eficiente:

**Antes:**
```tsx
<div className="grid md:grid-cols-2 gap-4">
```

**Depois:**
```tsx
<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
```

---

## Ordem de Execução

| Fase | Prioridade | Arquivos | Descrição |
|------|------------|----------|-----------|
| 1.1 | **Crítica** | `CampaignView.tsx` | Expandir larguras das abas |
| 1.2 | **Crítica** | `CampaignChatTab.tsx` | Expandir área de mensagens |
| 1.3 | **Crítica** | `CampaignCombatTab.tsx` | Usar largura total |
| 2.1 | Alta | `PlayersSidebar.tsx` | Adicionar modo collapse |
| 2.2 | Alta | `CampaignView.tsx` | Estado de sidebar |
| 3.1 | Média | `SessionDiary.tsx` | Alturas dinâmicas |
| 3.2 | Média | `SessionManager.tsx` | Alturas dinâmicas |
| 3.3 | Média | `NotesPanel.tsx` | Alturas dinâmicas |
| 4 | Média | `CampaignStatusGrid.tsx` | Grid mais colunas |
| 5 | Baixa | `CampaignMasterTab.tsx` | Grid expandido |

---

## Resultado Esperado

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                         LAYOUT CORRIGIDO                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────────────────────────────────┐  ┌─────────────────┐  │
│  │                                                    │  │    SIDEBAR      │  │
│  │           CONTEÚDO EXPANDIDO                       │  │    COLAPSÁVEL   │  │
│  │           (ocupa todo o espaço)                    │  │                 │  │
│  │                                                    │◄─┤  [=] toggle     │  │
│  │   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐         │  │                 │  │
│  │   │Card │ │Card │ │Card │ │Card │ │Card │         │  │ Modo compacto   │  │
│  │   └─────┘ └─────┘ └─────┘ └─────┘ └─────┘         │  │ em telas médias │  │
│  │                                                    │  │                 │  │
│  │   Grid responsivo: 1→2→3→4→5 colunas              │  │ Drawer mobile   │  │
│  │                                                    │  │ em telas < md   │  │
│  └────────────────────────────────────────────────────┘  └─────────────────┘  │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Benefícios

- **Espaços em branco eliminados**: Conteúdo ocupa toda largura disponível
- **Melhor uso de telas grandes**: 4K e ultrawide mostram mais dados simultaneamente
- **Mobile melhorado**: Sidebar acessível via drawer
- **Flexibilidade para o mestre**: Pode colapsar sidebar para ter mais espaço

---

## Detalhes Técnicos

### Classes Tailwind Responsivas Usadas

| Breakpoint | Largura | Uso |
|------------|---------|-----|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablets, sidebar visível |
| `lg` | 1024px | Laptops, grid expandido |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Monitores grandes, 5 colunas |

### Notas de Implementação

1. As alterações são **retrocompatíveis** - não quebram layouts existentes
2. Uso de `min-h` e `max-h` garante que conteúdo não quebre em telas extremas
3. Transições `transition-all duration-300` mantêm experiência suave
4. Sidebar com toggle usa estado local, sem impacto em hooks globais

---

## Conformidade com Regras do Projeto

- Todos os comentários em PT-BR
- Segue padrão de memória para lazy loading de tabs
- Não modifica mecânicas de Ordem Paranormal RPG
- Usa componentes UI existentes (Button, cn, etc.)
