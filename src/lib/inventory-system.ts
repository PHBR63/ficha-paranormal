// Ordem Paranormal RPG v1.3 - Sistema de Inventário
// Validação de patente, sistema de carga e munição abstrata

export interface InventoryItem {
  id: string;
  name: string;
  category: 'I' | 'II' | 'III' | 'IV' | '0'; // 0 = sem categoria
  slots: number;
  quantity: number;
  isEquipped?: boolean;
  ammoType?: string;
  ammoCurrent?: number;
  ammoMax?: number;
  description?: string;
  // Campos para itens consumíveis
  consumable?: boolean;
  uses?: number;
  maxUses?: number;
  effect?: string;
}

export interface PatentLimits {
  I: number;
  II: number;
  III: number;
  IV: number;
}

// Limites de itens por patente (conforme livro de regras)
export const PATENT_LIMITS: Record<string, PatentLimits> = {
  'Recruta': { I: 2, II: 0, III: 0, IV: 0 },           // 0 PP
  'Operador': { I: 3, II: 1, III: 0, IV: 0 },          // 20 PP
  'Agente Especial': { I: 3, II: 2, III: 1, IV: 0 },   // 50 PP
  'Oficial de Operações': { I: 3, II: 3, III: 2, IV: 1 }, // 100 PP
  'Agente de Elite': { I: 3, II: 3, III: 3, IV: 2 },   // 200 PP
};

// Créditos por patente (por missão)
export const PATENT_CREDITS: Record<string, string> = {
  'Recruta': 'Baixo',
  'Operador': 'Médio',
  'Agente Especial': 'Alto',
  'Oficial de Operações': 'Ilimitado',
  'Agente de Elite': 'Ilimitado',
};

// ============== VALIDAÇÃO DE PATENTE ==============

export function getPatentLimits(patent: string): PatentLimits {
  return PATENT_LIMITS[patent] || PATENT_LIMITS['Recruta'];
}

export function countItemsByCategory(
  inventory: InventoryItem[], 
  category: 'I' | 'II' | 'III' | 'IV'
): number {
  return inventory.filter(item => item.category === category).length;
}

export function canAddItem(
  item: InventoryItem, 
  inventory: InventoryItem[], 
  patent: string
): { allowed: boolean; reason?: string } {
  // Itens sem categoria sempre podem ser adicionados
  if (item.category === '0') {
    return { allowed: true };
  }

  const limits = getPatentLimits(patent);
  const currentCount = countItemsByCategory(inventory, item.category);
  
  if (currentCount >= limits[item.category]) {
    return { 
      allowed: false, 
      reason: `Limite de itens Categoria ${item.category} atingido (${currentCount}/${limits[item.category]}) para patente ${patent}`
    };
  }

  return { allowed: true };
}

export function getAvailableSlots(patent: string): PatentLimits {
  return getPatentLimits(patent);
}

// ============== SISTEMA DE CARGA ==============

export function calculateCarryCapacity(strength: number): number {
  // Capacidade = FOR × 5 espaços (mínimo 2)
  return Math.max(2, strength * 5);
}

export function calculateCurrentLoad(inventory: InventoryItem[]): number {
  return inventory.reduce((sum, item) => sum + (item.slots * item.quantity), 0);
}

export function isOverloaded(inventory: InventoryItem[], strength: number): boolean {
  const currentLoad = calculateCurrentLoad(inventory);
  const capacity = calculateCarryCapacity(strength);
  return currentLoad > capacity;
}

export interface LoadStatus {
  currentLoad: number;
  maxCapacity: number;
  isOverloaded: boolean;
  overloadPenalty: {
    testPenalty: number; // -5 em FOR/AGI/VIG
    movementPenalty: number; // -3m deslocamento
  } | null;
}

export function getLoadStatus(inventory: InventoryItem[], strength: number): LoadStatus {
  const currentLoad = calculateCurrentLoad(inventory);
  const maxCapacity = calculateCarryCapacity(strength);
  const overloaded = currentLoad > maxCapacity;

  return {
    currentLoad,
    maxCapacity,
    isOverloaded: overloaded,
    overloadPenalty: overloaded ? {
      testPenalty: -5,
      movementPenalty: -3,
    } : null
  };
}

// ============== MUNIÇÃO ABSTRATA ==============

export interface AmmoStatus {
  type: string;
  packs: number;
  description: string;
}

// Pacotes de munição por tipo
export const AMMO_TYPES: Record<string, { name: string; perPack: string }> = {
  'leve': { name: 'Munição Leve', perPack: '1 cena de combate' },
  'pesada': { name: 'Munição Pesada', perPack: '1 cena de combate' },
  'escopeta': { name: 'Cartuchos', perPack: '1 cena de combate' },
  'especial': { name: 'Munição Especial', perPack: '6 tiros' },
  'flechas': { name: 'Flechas', perPack: '20 flechas' },
};

export function consumeAmmo(
  ammoType: string, 
  currentPacks: number
): { newPacks: number; isEmpty: boolean; message: string } {
  if (currentPacks <= 0) {
    return { 
      newPacks: 0, 
      isEmpty: true, 
      message: `Sem munição ${AMMO_TYPES[ammoType]?.name || ammoType}!` 
    };
  }

  const newPacks = currentPacks - 1;
  return {
    newPacks,
    isEmpty: newPacks <= 0,
    message: newPacks <= 0 
      ? `Última munição ${AMMO_TYPES[ammoType]?.name || ammoType} usada!`
      : `Munição consumida. Restam ${newPacks} pacotes.`
  };
}

// ============== GESTÃO DE INVENTÁRIO ==============

export function addToInventory(
  inventory: InventoryItem[],
  item: InventoryItem,
  patent: string
): { success: boolean; newInventory: InventoryItem[]; error?: string } {
  // Verificar limite de patente
  const canAdd = canAddItem(item, inventory, patent);
  if (!canAdd.allowed) {
    return { success: false, newInventory: inventory, error: canAdd.reason };
  }

  // Verificar se já existe item empilhável
  const existingIndex = inventory.findIndex(i => 
    i.id === item.id && i.category === '0'
  );

  if (existingIndex >= 0 && item.category === '0') {
    // Empilhar
    const newInventory = [...inventory];
    newInventory[existingIndex] = {
      ...newInventory[existingIndex],
      quantity: newInventory[existingIndex].quantity + item.quantity
    };
    return { success: true, newInventory };
  }

  // Adicionar novo
  return { 
    success: true, 
    newInventory: [...inventory, item] 
  };
}

export function removeFromInventory(
  inventory: InventoryItem[],
  itemId: string,
  quantity: number = 1
): InventoryItem[] {
  const index = inventory.findIndex(i => i.id === itemId);
  if (index < 0) return inventory;

  const item = inventory[index];
  if (item.quantity <= quantity) {
    // Remover completamente
    return inventory.filter((_, i) => i !== index);
  }

  // Reduzir quantidade
  const newInventory = [...inventory];
  newInventory[index] = {
    ...item,
    quantity: item.quantity - quantity
  };
  return newInventory;
}

export function equipItem(
  inventory: InventoryItem[],
  itemId: string
): InventoryItem[] {
  return inventory.map(item => ({
    ...item,
    isEquipped: item.id === itemId ? true : item.isEquipped
  }));
}

export function unequipItem(
  inventory: InventoryItem[],
  itemId: string
): InventoryItem[] {
  return inventory.map(item => ({
    ...item,
    isEquipped: item.id === itemId ? false : item.isEquipped
  }));
}

// ============== SISTEMA DE CONSUMO DE ITENS ==============

export interface UseItemResult {
  success: boolean;
  newInventory: InventoryItem[];
  message: string;
  itemRemoved: boolean;
  remainingUses?: number;
}

/**
 * Usa um item consumível do inventário
 * - Decrementa os usos restantes
 * - Remove o item se não tiver mais usos
 * - Retorna informações sobre o resultado
 */
export function useConsumableItem(
  inventory: InventoryItem[],
  itemId: string
): UseItemResult {
  const itemIndex = inventory.findIndex(i => i.id === itemId);
  
  if (itemIndex < 0) {
    return {
      success: false,
      newInventory: inventory,
      message: 'Item não encontrado no inventário.',
      itemRemoved: false,
    };
  }

  const item = inventory[itemIndex];

  // Verifica se o item é consumível
  if (!item.consumable) {
    return {
      success: false,
      newInventory: inventory,
      message: `${item.name} não é um item consumível.`,
      itemRemoved: false,
    };
  }

  // Verifica se tem usos restantes
  const currentUses = item.uses ?? 0;
  if (currentUses <= 0) {
    return {
      success: false,
      newInventory: inventory,
      message: `${item.name} não tem mais usos disponíveis.`,
      itemRemoved: false,
    };
  }

  // Decrementa o uso
  const newUses = currentUses - 1;
  
  if (newUses <= 0) {
    // Remove o item completamente
    const newInventory = inventory.filter((_, i) => i !== itemIndex);
    return {
      success: true,
      newInventory,
      message: `${item.name} usado! (último uso - item consumido)`,
      itemRemoved: true,
      remainingUses: 0,
    };
  }

  // Atualiza os usos restantes
  const newInventory = [...inventory];
  newInventory[itemIndex] = {
    ...item,
    uses: newUses,
  };

  return {
    success: true,
    newInventory,
    message: `${item.name} usado! (${newUses}/${item.maxUses ?? currentUses} usos restantes)`,
    itemRemoved: false,
    remainingUses: newUses,
  };
}

/**
 * Verifica se um item pode ser usado
 */
export function canUseItem(item: InventoryItem): boolean {
  if (!item.consumable) return false;
  return (item.uses ?? 0) > 0;
}
