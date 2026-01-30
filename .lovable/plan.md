
# Plano: Correção de Sobreposição e Scroll no Chat da CampaignView

## Problemas Identificados

### 1. Espaço em Branco no Topo (Todas as Abas)
As screenshots mostram que o conteúdo está sendo empurrado para baixo, criando espaço vazio no topo. Isso ocorre porque:
- Os containers `TabsContent` usam `overflow-auto` mas o conteúdo interno não expande para preencher
- Componentes como `TacticalBoard` têm altura fixa (`height: '500px'`) em vez de dinâmica
- Falta `h-full` ou alturas calculadas nos containers de conteúdo

### 2. Chat Sem Scroll
O componente `CampaignChatTab` está correto na estrutura (`flex-1 overflow-y-auto`), mas precisa de `min-h-0` no container pai para que o overflow funcione em flex containers.

### 3. Altura Fixa do Tabuleiro
O `TacticalBoard` usa altura fixa de 500px, causando:
- Espaço vazio acima do mapa
- Não aproveitamento da tela completa

---

## Correções Propostas

### Fase 1: Corrigir Layout do Chat (CRÍTICO)

**Arquivo:** `src/pages/CampaignView.tsx` (linha 565)

```tsx
// ANTES:
<TabsContent value="chat" className="flex-1 flex flex-col m-0 min-h-0">

// DEPOIS - Adicionar overflow-hidden no TabsContent:
<TabsContent value="chat" className="flex-1 flex flex-col m-0 min-h-0 overflow-hidden">
```

O `overflow-hidden` força o container a respeitar os limites e permite que o filho com `overflow-y-auto` funcione.

---

### Fase 2: Corrigir Altura do Tabuleiro (CRÍTICO)

**Arquivo:** `src/components/campaign/tactical/TacticalBoard.tsx` (linha 1039-1043)

```tsx
// ANTES:
<div 
  ref={containerRef}
  className="relative ordo-panel overflow-hidden"
  style={{ height: '500px' }}
>

// DEPOIS - Usar altura dinâmica:
<div 
  ref={containerRef}
  className="relative ordo-panel overflow-hidden h-[calc(100vh-280px)] min-h-[400px] max-h-[800px]"
>
```

Remove a altura fixa inline e usa classe Tailwind que:
- Calcula altura baseada no viewport
- Garante mínimo de 400px
- Limita máximo de 800px para não ficar excessivo

---

### Fase 3: Ajustar TabsContent do Tabuleiro

**Arquivo:** `src/pages/CampaignView.tsx` (linha 589)

```tsx
// ANTES:
<TabsContent value="tactical" className="flex-1 p-4 sm:p-6 m-0 overflow-auto">

// DEPOIS - Garantir preenchimento de altura:
<TabsContent value="tactical" className="flex-1 flex flex-col p-4 sm:p-6 m-0 overflow-hidden">
```

---

### Fase 4: Ajustar Outras Abas com Espaço Vazio

Todas as abas precisam de ajustes para que o conteúdo preencha o espaço:

**Aba Combate (linha 578):**
```tsx
// ANTES:
<TabsContent value="combat" className="flex-1 p-6 sm:p-8 m-0 overflow-auto">

// DEPOIS:
<TabsContent value="combat" className="flex-1 flex flex-col p-6 sm:p-8 m-0 overflow-hidden">
```

**Aba Status (linha 545):**
```tsx
// ANTES:
<TabsContent value="status" className="flex-1 p-4 sm:p-6 lg:p-8 m-0 overflow-auto">

// DEPOIS:
<TabsContent value="status" className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 m-0 overflow-auto">
```

**Aba Condições (linha 599):**
```tsx
// ANTES:
<TabsContent value="conditions" className="flex-1 p-4 sm:p-6 lg:p-8 m-0 overflow-auto">

// DEPOIS:
<TabsContent value="conditions" className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 m-0 overflow-auto">
```

(E assim por diante para Notas, Handouts, Sessões, Diário, Mestre)

---

### Fase 5: Ajustar CampaignBoardTab

**Arquivo:** `src/components/campaign/tabs/CampaignBoardTab.tsx`

```tsx
// ANTES:
export function CampaignBoardTab({ ... }) {
  return (
    <TacticalBoard ... />
  );
}

// DEPOIS - Adicionar wrapper com altura completa:
export function CampaignBoardTab({ ... }) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TacticalBoard ... />
    </div>
  );
}
```

---

## Resumo das Alterações

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `CampaignView.tsx` | 565 | Adicionar `overflow-hidden` no chat |
| `CampaignView.tsx` | 545, 578, 589, 599, 621, 630, 648, 661, 695 | Adicionar `flex flex-col` e ajustar overflow |
| `TacticalBoard.tsx` | 1039-1043 | Substituir `style={{ height: '500px' }}` por classes Tailwind dinâmicas |
| `CampaignBoardTab.tsx` | 27-34 | Adicionar wrapper com `flex-1 min-h-0` |

---

## Resultado Esperado

- **Chat**: Scroll funcionando, mensagens ocupando espaço disponível
- **Tabuleiro**: Mapa ocupa altura dinâmica, sem espaço em branco acima
- **Todas as abas**: Conteúdo alinhado ao topo, preenchendo o espaço
- **Responsividade**: Funciona em diferentes tamanhos de tela

---

## Conformidade

- Comentários em PT-BR
- Segue padrão de memória para layouts responsivos
- Não modifica mecânicas de Ordem Paranormal RPG
