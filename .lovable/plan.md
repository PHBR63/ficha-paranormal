

## Plano: Corrigir categorias de munições e garantir unicidade de modificações

### Problema 1: Categorias erradas nas munições
Munição Longa, Cartuchos e Combustível estão com `category: '0'` no catálogo (`src/lib/catalogs/items-catalog.ts`), mas deveriam ser `category: 'I'` (Categoria I).

### Problema 2: Modificações de munição (Dum Dum / Explosiva) em munições do inventário
Munições no inventário precisam poder receber as modificações Dum Dum e Explosiva (que aumentam a categoria em +1 cada). Atualmente o `WeaponModificationModal` só funciona para armas, não para itens de munição.

### Problema 3: Unicidade de modificações
A regra de que cada modificação só pode ser aplicada uma vez já está implementada no `WeaponModificationModal` (modificações aplicadas ficam bloqueadas via `alreadyAppliedMods`). Preciso verificar se o mesmo padrão existe nos modais de armadura e acessório.

### Alterações

**1. `src/lib/catalogs/items-catalog.ts`**
- Alterar `category` de `'0'` para `'I'` nos itens: `municao_longa`, `cartuchos`, `combustivel`

**2. Verificar modais de armadura e acessório**
- Confirmar que `ArmorModificationModal` e `AccessoryModificationModal` já bloqueiam modificações duplicadas (mesmo padrão do `WeaponModificationModal`)
- Se não implementam, adicionar a mesma lógica de `alreadyAppliedMods`

**3. Sistema de modificação de munições**
- Permitir que itens de munição no inventário recebam modificações Dum Dum e Explosiva
- Isso requer que o `InventoryPanel` reconheça munições como modificáveis e abra um modal adequado (pode reutilizar parte da lógica do `WeaponModificationModal` filtrada apenas para modificações de munição)
- Ao aplicar modificações, recalcular a categoria da munição (+1 por modificação)

