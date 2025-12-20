// Ordem Paranormal RPG v1.3 - Sistema de Inventário
// Validação de patente, sistema de carga e munição abstrata
// Inclui suporte a Inventário Otimizado (Técnico - Especialista)

import { getEffectiveCategory } from './category-reduction';

/**
 * Interface para dados do personagem usados na detecção de habilidades de inventário
 */
export interface CharacterInventoryData {
  classTrack?: string;
  abilities?: string[];
  nex?: number;
}

/**
 * Verifica se o personagem possui a habilidade Inventário Otimizado (Técnico)
 * 
 * Regra oficial: Técnico (Especialista) NEX 10%
 * "Você soma seu Intelecto à Força para calcular sua capacidade de carga.
 *  Além disso, itens ocupam 1 espaço a menos (mas nunca reduzido a 0)."
 * 
 * @param characterData - Dados do personagem
 */
export function hasInventarioOtimizado(characterData?: CharacterInventoryData): boolean {
  if (!characterData) return false;
  
  const { classTrack, abilities = [], nex = 0 } = characterData;
  
  // Verifica se é da trilha Técnico com NEX 10%+
  const trackLower = classTrack?.toLowerCase() || '';
  if (trackLower.includes('tecnico') || trackLower.includes('técnico')) {
    return nex >= 10;
  }
  
  // Verifica se tem a habilidade explicitamente
  const hasAbility = abilities.some(a => {
    const aLower = a.toLowerCase();
    return aLower.includes('inventário otimizado') || 
           aLower.includes('inventario otimizado');
  });
  
  return hasAbility;
}

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
  // Campos para redução de categoria
  favoriteAbilityId?: string;  // ID da habilidade que reduz a categoria
  effectiveCategory?: 'I' | 'II' | 'III' | 'IV' | '0';  // Categoria efetiva após redução
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

/**
 * Conta itens por categoria, considerando a categoria efetiva (após reduções)
 */
export function countItemsByCategory(
  inventory: InventoryItem[], 
  category: 'I' | 'II' | 'III' | 'IV'
): number {
  return inventory.filter(item => {
    // Usa a categoria efetiva se disponível, senão usa a categoria base
    const effectiveCat = item.effectiveCategory || item.category;
    return effectiveCat === category;
  }).length;
}

/**
 * Conta itens por categoria BASE (sem considerar reduções)
 * Útil para validação de limites de habilidades
 */
export function countItemsByBaseCategory(
  inventory: InventoryItem[], 
  category: 'I' | 'II' | 'III' | 'IV'
): number {
  return inventory.filter(item => item.category === category).length;
}

/**
 * Verifica se um item pode ser adicionado ao inventário
 * Considera a categoria efetiva do item (após reduções de habilidades)
 */
export function canAddItem(
  item: InventoryItem, 
  inventory: InventoryItem[], 
  patent: string
): { allowed: boolean; reason?: string } {
  // Usa a categoria efetiva se disponível
  const effectiveCategory = item.effectiveCategory || item.category;
  
  // Itens sem categoria sempre podem ser adicionados
  if (effectiveCategory === '0') {
    return { allowed: true };
  }

  const limits = getPatentLimits(patent);
  const currentCount = countItemsByCategory(inventory, effectiveCategory);
  
  if (currentCount >= limits[effectiveCategory]) {
    const categoryDisplay = item.effectiveCategory && item.effectiveCategory !== item.category
      ? `${effectiveCategory} (reduzida de ${item.category})`
      : effectiveCategory;
    return { 
      allowed: false, 
      reason: `Limite de itens Categoria ${categoryDisplay} atingido (${currentCount}/${limits[effectiveCategory]}) para patente ${patent}`
    };
  }

  return { allowed: true };
}

export function getAvailableSlots(patent: string): PatentLimits {
  return getPatentLimits(patent);
}

// ============== SISTEMA DE CARGA ==============

/**
 * Interface para configuração de bônus de carga (Inventário Otimizado, etc.)
 */
export interface CarryCapacityOptions {
  /** Intelecto do personagem (para Inventário Otimizado do Técnico) */
  intellect?: number;
  /** Se o personagem possui a habilidade Inventário Otimizado */
  hasInventarioOtimizado?: boolean;
}

/**
 * Calcula a capacidade de carga do personagem
 * 
 * Regra base: Capacidade = FOR × 5 espaços
 * Inventário Otimizado (Técnico): Soma INT à FOR para cálculo
 * 
 * @param strength - Força do personagem
 * @param options - Opções adicionais (intelecto, habilidades)
 */
export function calculateCarryCapacity(
  strength: number, 
  options?: CarryCapacityOptions
): number {
  let baseAttribute = strength;
  
  // Inventário Otimizado (Técnico): soma INT à FOR
  if (options?.hasInventarioOtimizado && options?.intellect) {
    baseAttribute += options.intellect;
  }
  
  // Capacidade = (FOR + bônus) × 5 espaços (mínimo 2)
  return Math.max(2, baseAttribute * 5);
}

/**
 * Calcula os espaços efetivos de um item considerando Inventário Otimizado
 * 
 * Inventário Otimizado (Técnico): Itens ocupam 1 espaço a menos (mínimo 1)
 * 
 * @param baseSlots - Espaços base do item
 * @param hasInventarioOtimizado - Se possui a habilidade
 */
export function calculateEffectiveSlots(
  baseSlots: number,
  hasInventarioOtimizado: boolean = false
): number {
  if (hasInventarioOtimizado) {
    // Regra oficial: itens ocupam 1 espaço a menos, mas nunca reduzido a 0
    return Math.max(1, baseSlots - 1);
  }
  return baseSlots;
}

/**
 * Calcula a carga atual considerando reduções de espaço
 * 
 * @param inventory - Lista de itens do inventário
 * @param hasInventarioOtimizado - Se possui a habilidade Inventário Otimizado
 */
export function calculateCurrentLoad(
  inventory: InventoryItem[],
  hasInventarioOtimizado: boolean = false
): number {
  return inventory.reduce((sum, item) => {
    const effectiveSlots = calculateEffectiveSlots(item.slots, hasInventarioOtimizado);
    return sum + (effectiveSlots * item.quantity);
  }, 0);
}

/**
 * Verifica se o personagem está sobrecarregado
 * 
 * @param inventory - Lista de itens do inventário
 * @param strength - Força do personagem
 * @param options - Opções adicionais para cálculo de capacidade
 */
export function isOverloaded(
  inventory: InventoryItem[], 
  strength: number,
  options?: CarryCapacityOptions
): boolean {
  const currentLoad = calculateCurrentLoad(inventory, options?.hasInventarioOtimizado);
  const capacity = calculateCarryCapacity(strength, options);
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
  /** Se Inventário Otimizado está ativo (para UI) */
  hasInventarioOtimizado?: boolean;
  /** Bônus de capacidade do Inventário Otimizado */
  capacityBonus?: number;
}

/**
 * Obtém o status completo de carga do personagem
 * 
 * @param inventory - Lista de itens do inventário
 * @param strength - Força do personagem
 * @param options - Opções adicionais (Inventário Otimizado)
 */
export function getLoadStatus(
  inventory: InventoryItem[], 
  strength: number,
  options?: CarryCapacityOptions
): LoadStatus {
  const hasInvOtimizado = options?.hasInventarioOtimizado ?? false;
  const currentLoad = calculateCurrentLoad(inventory, hasInvOtimizado);
  const maxCapacity = calculateCarryCapacity(strength, options);
  const overloaded = currentLoad > maxCapacity;

  // Calcula o bônus de capacidade do Inventário Otimizado
  const capacityBonus = hasInvOtimizado && options?.intellect 
    ? options.intellect * 5 
    : 0;

  return {
    currentLoad,
    maxCapacity,
    isOverloaded: overloaded,
    overloadPenalty: overloaded ? {
      testPenalty: -5,
      movementPenalty: -3,
    } : null,
    hasInventarioOtimizado: hasInvOtimizado,
    capacityBonus,
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
