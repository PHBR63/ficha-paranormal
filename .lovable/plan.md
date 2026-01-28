
# Plano: Correção da Habilidade Preparado para Tudo (NEX 99%)

## Resumo do Problema

Atualmente, a habilidade **Preparado para Tudo** (Técnico, NEX 99%) permite apenas selecionar uma categoria (I, II, III, IV) e exibe uma mensagem genérica. O correto seria funcionar como **Improvisar** (NEX 65%), permitindo selecionar um item específico do catálogo, mas com as diferenças:

| Aspecto | Improvisar (65%) | Preparado para Tudo (99%) |
|---------|------------------|---------------------------|
| Custo PE | 2 + (2 × categoria) | 2 × categoria |
| Duração | Temporário (1 cena) | Permanente |
| Itens | Apenas equipamentos gerais | Qualquer item (exceto armas) |

## Arquivos a Criar

### 1. `src/components/character/tracks/especialista/PreparadoParaTudoItemSelector.tsx`

Novo componente baseado no `ImprovisarItemSelector.tsx`, com as seguintes diferenças:

**Funcionalidades:**
- Lista todos os itens do catálogo (não só equipamentos gerais)
- Exclui munições e armas (se houver armas no catálogo)
- Custo: 2 PE × categoria (sem custo base)
- Aviso indicando que o item é permanente

**Estrutura:**

```text
┌─────────────────────────────────────────────────────────────┐
│  🎒 Preparado para Tudo              Custo: 2 PE/categoria │
│  Encontre qualquer item no fundo da sua bolsa!             │
├─────────────────────────────────────────────────────────────┤
│  🔍 [Buscar item...                                     ]  │
├─────────────────────────────────────────────────────────────┤
│  ▼ Categoria I                                      2 PE   │
│    ├─ Kit de Primeiros Socorros    Operacional     2 PE   │
│    ├─ Lanterna Tática              Operacional     2 PE   │
│    └─ ...                                                  │
│                                                             │
│  ▼ Categoria II                                     4 PE   │
│    ├─ Colete Balístico Leve        Operacional     4 PE   │
│    └─ ...                                                  │
├─────────────────────────────────────────────────────────────┤
│  ✅ Item selecionado: Lanterna Tática                       │
│     Categoria I • 1 espaço                                  │
│     Ilumina área de 6m em cone...                          │
├─────────────────────────────────────────────────────────────┤
│  ℹ️ O item é adicionado permanentemente ao inventário.     │
│                                                             │
│  [Cancelar]              [Encontrar Item (2 PE)]           │
└─────────────────────────────────────────────────────────────┘
```

## Arquivos a Modificar

### 2. `src/components/character/tracks/especialista/useTecnicoTrack.ts`

**Alterações:**
- Modificar `handlePreparadoParaTudo` para receber um `CatalogItem` ao invés de `number` (categoria)
- Calcular custo: `2 × categoryToNumber(item.category)`
- Adicionar o item ao inventário como **permanente** (sem `isTemporary` ou com `isTemporary: false`)
- Adicionar callback `onAddPermanentItem` se necessário, ou reutilizar `onAddTemporaryItem` com flag diferente

```typescript
// Antes:
handlePreparadoParaTudo(categoria: number)

// Depois:
handlePreparadoParaTudo(item: CatalogItem, cost: number)
```

### 3. `src/components/character/tracks/especialista/TecnicoPanel.tsx`

**Alterações:**
- Importar `PreparadoParaTudoItemSelector`
- Substituir o `PreparadoCategoryGrid` pelo novo seletor de itens
- Atualizar o Drawer/MobileDrawer para usar o novo componente

## Detalhes Técnicos

### Cálculo de Custo para Preparado para Tudo

```typescript
// Nova função em PreparadoParaTudoItemSelector.tsx
export function calculatePreparadoCost(item: CatalogItem): number {
  return 2 * categoryToNumber(item.category);
}
```

### Item Permanente vs Temporário

```typescript
// Improvisar (temporário)
const temporaryItem: InventoryItem = {
  ...itemData,
  isTemporary: true,
  temporarySource: 'Improvisar (Técnico NEX 65%)',
};

// Preparado para Tudo (permanente)
const permanentItem: InventoryItem = {
  ...itemData,
  isTemporary: false,
  // Opcional: adicionar fonte para rastreamento
  notes: 'Obtido via Preparado para Tudo',
};
```

### Itens Excluídos

- Munições (não faz sentido encontrar munição sozinha)
- Armas (regra oficial exclui armas)

## Fluxo de Uso Atualizado

```text
1. Jogador clica "Encontrar Item" em Preparado para Tudo
       ↓
2. Abre Drawer com seletor de itens (similar ao Improvisar)
       ↓
3. Jogador busca/filtra e seleciona um item específico
       ↓
4. Sistema calcula custo: 2 PE × categoria
       ↓
5. Jogador confirma
       ↓
6. Sistema:
   - Deduz PE
   - Adiciona item PERMANENTE ao inventário
   - Mostra toast: "Você lembrou que tinha um(a) [item]!"
```

## Resultado Esperado

- Jogador pode selecionar qualquer item do catálogo (exceto armas/munições)
- Custo correto: 2 PE por categoria (sem base)
- Item adicionado permanentemente ao inventário
- Interface similar ao Improvisar, facilitando o uso
