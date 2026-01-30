

# Plano: Correção Completa de Camadas Sobrepostas e Cortadas na CampaignView

## Diagnóstico Profundo

Após análise detalhada do código e das screenshots, identifiquei múltiplos problemas estruturais de layout:

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│                      PROBLEMAS IDENTIFICADOS                                    │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. CONTAINER PRINCIPAL (CampaignView)                                          │
│     ├─ flex-1 flex overflow-hidden ✓ (correto no main)                         │
│     └─ Tabs não respeita altura do pai → conteúdo "vaza"                       │
│                                                                                 │
│  2. TABS COMPONENT                                                              │
│     ├─ className="flex-1 flex flex-col overflow-hidden" ✓ (correto)            │
│     └─ TabsContent internos têm problemas de altura                            │
│                                                                                 │
│  3. TABS CONTENT INDIVIDUAIS                                                    │
│     ├─ Status: flex-1 flex flex-col ... overflow-auto → conteúdo OK            │
│     ├─ Chat: overflow-hidden OK, mas CampaignChatTab precisa min-h-0           │
│     ├─ Combat: overflow-auto → scroll funciona, mas conteúdo não preenche      │
│     ├─ Tactical: overflow-hidden OK, mas TacticalBoard usa flex-1 sem pai      │
│     ├─ Conditions/Notes/Handouts/Sessions/Diary: h-[calc()] fixo → corte       │
│     └─ Master: overflow-auto sem flex-col → espaço desperdiçado                │
│                                                                                 │
│  4. COMPONENTES INTERNOS COM ALTURA FIXA                                        │
│     ├─ SessionManager: h-[calc(100vh-350px)] → conflita com container          │
│     ├─ SessionDiary: h-[calc(100vh-400px)] → conflita com container            │
│     ├─ NotesPanel: h-[calc(100vh-450px)] → conflita com container              │
│     └─ TacticalBoard: flex-1 min-h-[300px] → OK, mas wrapper não tem altura    │
│                                                                                 │
│  5. PROBLEMA CRÍTICO: HIERARQUIA FLEX QUEBRADA                                  │
│     ┌─ TabsContent (flex-1)                                                     │
│     │  └─ div wrapper (sem flex-col/flex-1)                                     │
│     │     └─ Componente interno (h-[calc(100vh-X)])                             │
│     │                                                                           │
│     Resultado: calc() ignora padding do pai, causando corte/sobreposição       │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Solução: Hierarquia Flex Consistente

O padrão correto para layouts com scroll interno em containers flexíveis:

```text
┌─ TabsContent: flex-1 flex flex-col min-h-0 overflow-hidden p-4
│  └─ div wrapper: flex-1 flex flex-col min-h-0 (SEM alturas calc!)
│     ├─ Header fixo (shrink-0)
│     └─ Conteúdo scrollável: flex-1 min-h-0 overflow-y-auto
```

---

## Fase 1: Corrigir CampaignView.tsx (Crítico)

### 1.1 Padronizar TODOS os TabsContent

Cada aba deve seguir o mesmo padrão flex:

| Aba | Linha | Alteração Necessária |
|-----|-------|----------------------|
| status | 545 | Manter como está (já OK com flex flex-col) |
| chat | 565 | Adicionar `min-h-0` explícito |
| combat | 578 | Mudar para `flex flex-col min-h-0 overflow-hidden` |
| tactical | 589 | Manter como está (já OK com flex flex-col overflow-hidden) |
| conditions | 599 | Mudar para `flex flex-col min-h-0 overflow-hidden` + ajustar wrapper |
| notes | 621 | Mudar para `flex flex-col min-h-0 overflow-hidden` + ajustar wrapper |
| handouts | 630 | Mudar para `flex flex-col min-h-0 overflow-hidden` + ajustar wrapper |
| sessions | 648 | Mudar para `flex flex-col min-h-0 overflow-hidden` + ajustar wrapper |
| diary | 661 | Mudar para `flex flex-col min-h-0 overflow-hidden` + ajustar wrapper |
| master | 695 | Mudar para `flex flex-col min-h-0 overflow-hidden` |

### 1.2 Ajustar Wrappers Internos

Cada aba com wrapper `<div>` interno precisa de classes flex adequadas:

**Aba Condições (linha 599-617):**
```tsx
// ANTES:
<TabsContent value="conditions" className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 m-0 overflow-auto">
  <div className="max-w-4xl lg:max-w-6xl xl:max-w-full mx-auto">

// DEPOIS:
<TabsContent value="conditions" className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 lg:p-8 m-0 overflow-hidden">
  <div className="flex-1 flex flex-col min-h-0 max-w-4xl lg:max-w-6xl xl:max-w-full mx-auto">
```

**Aba Notas (linha 621-627):**
```tsx
// ANTES:
<TabsContent value="notes" className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 m-0 overflow-auto">
  <div className="w-full">
    <div className="ordo-panel p-4 sm:p-6 lg:p-8 h-full">

// DEPOIS:
<TabsContent value="notes" className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 lg:p-8 m-0 overflow-hidden">
  <div className="flex-1 flex flex-col min-h-0 w-full">
    <div className="ordo-panel p-4 sm:p-6 lg:p-8 flex-1 flex flex-col min-h-0">
```

**Aba Sessões (linha 648-657):**
```tsx
// ANTES:
<TabsContent value="sessions" className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 m-0 overflow-auto">
  <div className="max-w-4xl lg:max-w-5xl xl:max-w-full mx-auto">

// DEPOIS:
<TabsContent value="sessions" className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 lg:p-8 m-0 overflow-hidden">
  <div className="flex-1 flex flex-col min-h-0 max-w-4xl lg:max-w-5xl xl:max-w-full mx-auto">
```

**Aba Diário (linha 661-690):**
```tsx
// ANTES:
<TabsContent value="diary" className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 m-0 overflow-auto">
  <div className="max-w-5xl lg:max-w-6xl xl:max-w-full mx-auto">

// DEPOIS:
<TabsContent value="diary" className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 lg:p-8 m-0 overflow-hidden">
  <div className="flex-1 flex flex-col min-h-0 max-w-5xl lg:max-w-6xl xl:max-w-full mx-auto">
```

---

## Fase 2: Corrigir Componentes com Alturas Fixas

### 2.1 SessionManager.tsx (linha 350)

**Problema:** `h-[calc(100vh-350px)]` conflita com container pai

```tsx
// ANTES:
<div className="h-[calc(100vh-350px)] min-h-[250px] max-h-[500px] overflow-y-auto ...">

// DEPOIS - Remove calc() e usa flex-1:
<div className="flex-1 min-h-[200px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
```

**Também adicionar flex wrapper no container root (linha 310):**
```tsx
// ANTES:
<div className="space-y-6">

// DEPOIS:
<div className="flex-1 flex flex-col min-h-0 space-y-6">
```

### 2.2 SessionDiary.tsx (linhas 364 e 399)

**Problema:** `h-[calc(100vh-400px)]` conflita com container pai

```tsx
// ANTES (linha 364):
<div className="h-[calc(100vh-400px)] min-h-[300px] max-h-[700px] overflow-y-auto ...">

// DEPOIS:
<div className="flex-1 min-h-[200px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pr-4">
```

**Também ajustar container root (linha 273):**
```tsx
// ANTES:
<div className="space-y-6">

// DEPOIS:
<div className="flex-1 flex flex-col min-h-0 space-y-6">
```

**E as Tabs internas (linha 350):**
```tsx
// ANTES:
<Tabs defaultValue="timeline" className="w-full">

// DEPOIS:
<Tabs defaultValue="timeline" className="flex-1 flex flex-col min-h-0 w-full">
```

**E TabsContent (linhas 363 e 398):**
```tsx
// ANTES:
<TabsContent value="timeline" className="mt-4">

// DEPOIS:
<TabsContent value="timeline" className="flex-1 flex flex-col min-h-0 mt-4">
```

### 2.3 NotesPanel.tsx (linhas 254 e 276)

**Problema:** `h-[calc(100vh-450px)]` conflita com container pai

```tsx
// ANTES:
<div className="h-[calc(100vh-450px)] min-h-[200px] max-h-[500px] overflow-y-auto ...">

// DEPOIS:
<div className="flex-1 min-h-[150px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
```

**Também ajustar container root (linha 212):**
```tsx
// ANTES:
<div className="flex h-full gap-4">

// DEPOIS:
<div className="flex-1 flex min-h-0 gap-4">
```

**E a coluna esquerda (linha 214):**
```tsx
// ANTES:
<div className="w-80 flex flex-col border-r border-border pr-4">

// DEPOIS:
<div className="w-80 flex flex-col min-h-0 border-r border-border pr-4">
```

---

## Fase 3: Corrigir CampaignChatTab.tsx

### 3.1 Adicionar min-h-0 no container root (linha 157)

```tsx
// ANTES:
<div className="flex-1 flex flex-col min-h-0">

// DEPOIS (manter, já está correto):
<div className="flex-1 flex flex-col min-h-0">
```

Verificar se o problema persiste - se sim, o pai (TabsContent) precisa de `overflow-hidden`.

---

## Fase 4: Corrigir CampaignCombatTab.tsx

### 4.1 Ajustar container principal (linha 33)

```tsx
// ANTES:
<div className="space-y-8 w-full">

// DEPOIS:
<div className="flex-1 flex flex-col min-h-0 gap-8 w-full overflow-y-auto">
```

---

## Fase 5: Garantir Integridade do TacticalBoard

### 5.1 Verificar CampaignBoardTab.tsx

O wrapper já foi adicionado anteriormente:
```tsx
<div className="flex-1 flex flex-col min-h-0">
  <TacticalBoard ... />
</div>
```

### 5.2 TacticalBoard.tsx (linha 897)

Já corrigido anteriormente:
```tsx
<div className="flex flex-col flex-1 min-h-0 gap-4">
```

---

## Resumo das Alterações

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `CampaignView.tsx` | 565, 578, 599-617, 621-627, 630-644, 648-657, 661-690, 695 | Padronizar TabsContent e wrappers |
| `SessionManager.tsx` | 310, 350 | Remover h-[calc()] e usar flex-1 |
| `SessionDiary.tsx` | 273, 350, 363-364, 398-399 | Remover h-[calc()] e usar flex-1 |
| `NotesPanel.tsx` | 212, 214, 254, 276 | Remover h-[calc()] e usar flex-1 |
| `CampaignCombatTab.tsx` | 33 | Adicionar flex-1 e overflow-y-auto |

---

## Resultado Esperado

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│                      LAYOUT CORRIGIDO                                           │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  ┌──────────────┐  │
│  │ HEADER (sticky)                                         │  │  SIDEBAR     │  │
│  ├─────────────────────────────────────────────────────────┤  │  (flex-col)  │  │
│  │ TABS (shrink-0)                                         │  │              │  │
│  ├─────────────────────────────────────────────────────────┤  │  Jogadores   │  │
│  │                                                         │  │  com scroll  │  │
│  │                  CONTEÚDO DA ABA                        │  │  interno     │  │
│  │                  (flex-1 min-h-0)                       │  │              │  │
│  │                                                         │  │              │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │              │  │
│  │  │ Header fixo (shrink-0)                          │   │  │              │  │
│  │  ├─────────────────────────────────────────────────┤   │  │              │  │
│  │  │                                                 │   │  │              │  │
│  │  │ Conteúdo scrollável                             │   │  │              │  │
│  │  │ (flex-1 overflow-y-auto)                        │   │  │              │  │
│  │  │                                                 │   │  │              │  │
│  │  └─────────────────────────────────────────────────┘   │  │              │  │
│  └─────────────────────────────────────────────────────────┘  └──────────────┘  │
│                                                                                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Benefícios

- **Sem sobreposição**: Cada camada respeita os limites do pai
- **Scroll funcionando**: Conteúdo longo faz scroll sem cortar elementos
- **Responsivo**: Funciona em todas as resoluções de tela
- **Manutenível**: Padrão consistente facilita futuros ajustes

---

## Conformidade com Regras do Projeto

- Todos os comentários em PT-BR
- Segue padrão de memória `architecture/campaign-view-scroll-and-flex-hierarchy`
- Não modifica mecânicas de Ordem Paranormal RPG
- Usa padrão flex-1 min-h-0 conforme documentado

