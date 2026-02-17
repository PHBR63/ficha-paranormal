
# Corrigir Modificações para Equipamentos Gerais (Acessórios)

## Problema Identificado

O botão "Modificar" **nunca aparece** para acessórios no inventário. A causa raiz:

1. Quando um acessório é adicionado do catálogo, seu tipo original (`'acessorio'`) é convertido para `'misc'` pelo `ITEM_TYPE_MIGRATION_MAP` (linha 127).
2. O campo `catalogType` nunca é salvo no item.
3. A condição que exibe o botão "Modificar" verifica `(item.itemType as string) === 'acessorio'` ou `(item as any).catalogType === 'acessorio'` -- ambas falham porque o tipo virou `'misc'` e `catalogType` não existe.

## Solucao

### 1. Preservar o tipo original do catalogo no item

No `handleAddItemFromCatalog` (linha ~777), adicionar a propriedade `catalogType` ao `baseItem` com o valor original de `catalogItem.type`. Isso permite identificar acessorios mesmo apos a normalizacao.

```typescript
const baseItem = {
  // ... campos existentes ...
  catalogType: catalogItem.type, // Preserva tipo original do catalogo
};
```

### 2. Atualizar ExtendedInventoryItem

Adicionar `catalogType?: string` a interface `ExtendedInventoryItem` para tipar corretamente o campo (eliminando os `(item as any).catalogType`).

### 3. Garantir persistencia do catalogType

Nos mapeamentos de `onInventoryChange` (linhas ~804, 639, 699, etc.), incluir `catalogType` junto com `itemType` e `equipSlot` para que o campo seja preservado ao salvar.

### 4. Atualizar condicoes do botao Modificar

Nas 4 ocorrencias onde a condicao de `onModify` e definida (linhas ~1694, 1710, 1732, 1748), usar a propriedade tipada:

```typescript
item.itemType === 'weapon' || item.itemType === 'armor' || item.catalogType === 'acessorio'
```

---

### Detalhes Tecnicos

**Arquivos a modificar:**
- `src/components/inventory/InventoryPanel.tsx`
  - Interface `ExtendedInventoryItem`: adicionar `catalogType?: string`
  - `handleAddItemFromCatalog`: salvar `catalogType: catalogItem.type`
  - Todos os mapeamentos de `onInventoryChange`: propagar `catalogType`
  - 4 condicoes de `onModify`: usar `item.catalogType` tipado
  - `handleOpenModification`: remover cast `(item as any)`

**Nenhum arquivo novo necessario** -- o `AccessoryModificationModal.tsx` ja existe e esta correto com as 4 modificacoes da Tabela 3.9.
