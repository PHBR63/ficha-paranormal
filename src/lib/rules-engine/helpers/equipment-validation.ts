/**
 * equipment-validation.ts
 * Ordem Paranormal RPG v1.3
 * 
 * Validação de equipamentos conforme regras oficiais:
 * - Proficiência em armas e armaduras
 * - Capacidade de carga
 * - Penalidades por sobrecarga
 */

import type { CharacterState, ValidationIssue, EquippedWeapon, EquippedArmor, InventoryItem } from '../types';
import { 
  collectProficiencies, 
  hasWeaponProficiency, 
  hasArmorProficiency 
} from './proficiency-collection';
import { getSUEBonusesForCharacter } from '../sue-bridge';

// =====================================================
// CONSTANTES
// =====================================================

/**
 * Penalidades por falta de proficiência (Livro Base v1.3)
 */
const PROFICIENCY_PENALTIES = {
  weapon: {
    attack: -5,  // Penalidade de ataque sem proficiência
  },
  armor: {
    skills: -5,  // Penalidade em testes de perícia
    agilityMaxBonus: 0, // Sem bônus de Agilidade na Defesa
  },
};

/**
 * Calcula capacidade de carga base
 * Fórmula: FOR × 5 (mínimo 2)
 * 
 * Com "Inventário Otimizado" (Técnico): (FOR + INT) × 5
 */
function calculateBaseCarryCapacity(
  strength: number, 
  intellect: number = 0,
  hasInventarioOtimizado: boolean = false
): number {
  if (hasInventarioOtimizado) {
    return Math.max(2, (strength + intellect) * 5);
  }
  return Math.max(2, strength * 5);
}

/**
 * Calcula espaços usados no inventário
 */
function calculateUsedSpaces(inventory: InventoryItem[], hasInventarioOtimizado: boolean = false): number {
  return inventory.reduce((total, item) => {
    let itemSpaces = item.spaces * item.quantity;
    
    // "Inventário Otimizado" reduz 1 espaço por item (mínimo 1)
    if (hasInventarioOtimizado) {
      itemSpaces = Math.max(item.quantity, itemSpaces - item.quantity);
    }
    
    return total + itemSpaces;
  }, 0);
}

// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

/**
 * Valida equipamentos do personagem contra regras oficiais
 * 
 * @param state - Estado do personagem
 * @returns Lista de problemas encontrados
 */
export function validateEquipment(state: CharacterState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Obter bônus do SUE (para saber se tem "Inventário Otimizado")
  const sueComputed = getSUEBonusesForCharacter(state);
  
  // 1. Validar proficiência em armas equipadas
  issues.push(...validateWeaponProficiencies(state, sueComputed));
  
  // 2. Validar proficiência em armadura equipada
  issues.push(...validateArmorProficiency(state, sueComputed));
  
  // 3. Validar capacidade de carga
  issues.push(...validateCarryCapacity(state, sueComputed));
  
  return issues;
}

/**
 * Valida proficiência em todas as armas equipadas
 */
function validateWeaponProficiencies(
  state: CharacterState,
  sueComputed?: ReturnType<typeof getSUEBonusesForCharacter>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  for (const weapon of state.equippedWeapons) {
    if (!weapon.isEquipped) continue; // Pula armas não equipadas
    
    const hasProficiency = hasWeaponProficiency(state, weapon.category, sueComputed);
    
    if (!hasProficiency) {
      issues.push({
        severity: 'warning',
        ruleId: 'weapon-no-proficiency',
        message: `Sem proficiência em "${weapon.name}" (${weapon.category}): -5 de penalidade em ataques`,
        path: `equippedWeapons.${weapon.id}`,
        suggestedFix: {
          action: 'recalculate',
          field: 'equippedWeapons',
          description: `Adquirir proficiência em ${getCategoryDisplayName(weapon.category)} ou desequipar arma`,
        },
      });
    }
  }
  
  return issues;
}

/**
 * Valida proficiência em armadura equipada
 */
function validateArmorProficiency(
  state: CharacterState,
  sueComputed?: ReturnType<typeof getSUEBonusesForCharacter>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  if (!state.equippedArmor) return issues;
  
  const armor = state.equippedArmor;
  const hasProficiency = hasArmorProficiency(state, armor.category, sueComputed);
  
  if (!hasProficiency) {
    const penaltyDescription = armor.category === 'pesada'
      ? '-5 em testes de perícia, sem bônus de Agilidade na Defesa'
      : '-5 em testes de perícia';
    
    issues.push({
      severity: 'warning',
      ruleId: 'armor-no-proficiency',
      message: `Sem proficiência em "${armor.name}" (${armor.category}): ${penaltyDescription}`,
      path: 'equippedArmor',
      suggestedFix: {
        action: 'recalculate',
        field: 'equippedArmor',
        description: `Adquirir proficiência em Proteções ${armor.category === 'pesada' ? 'Pesadas' : 'Leves'} ou desequipar armadura`,
      },
    });
  }
  
  return issues;
}

/**
 * Valida capacidade de carga do inventário
 */
function validateCarryCapacity(
  state: CharacterState,
  sueComputed?: ReturnType<typeof getSUEBonusesForCharacter>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Verificar se tem "Inventário Otimizado" (poder de Técnico)
  const hasInventarioOtimizado = 
    state.trackAbilities.includes('inventario-otimizado') ||
    state.classPowers.includes('inventario-otimizado');
  
  const strength = state.attributes.strength || 0;
  const intellect = state.attributes.intellect || 0;
  
  const maxCapacity = calculateBaseCarryCapacity(strength, intellect, hasInventarioOtimizado);
  const usedSpaces = calculateUsedSpaces(state.inventory, hasInventarioOtimizado);
  
  if (usedSpaces > maxCapacity) {
    const overload = usedSpaces - maxCapacity;
    issues.push({
      severity: 'warning',
      ruleId: 'inventory-overload',
      message: `Sobrecarga: ${usedSpaces}/${maxCapacity} espaços. Penalidade de -3m no deslocamento e -5 em testes físicos`,
      path: 'inventory',
      suggestedFix: {
        action: 'recalculate',
        field: 'inventory',
        description: `Remover ${overload} espaço(s) de itens para eliminar sobrecarga`,
      },
    });
  } else if (usedSpaces === maxCapacity) {
    // No limite exato - aviso informativo
    issues.push({
      severity: 'info',
      ruleId: 'inventory-at-capacity',
      message: `Inventário no limite: ${usedSpaces}/${maxCapacity} espaços`,
      path: 'inventory',
    });
  }
  
  return issues;
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

/**
 * Retorna nome de exibição da categoria de arma
 */
function getCategoryDisplayName(category: string): string {
  const categoryNames: Record<string, string> = {
    'simple-melee': 'Armas Simples (corpo a corpo)',
    'simple-ranged': 'Armas Simples (à distância)',
    'tactical-melee': 'Armas Táticas (corpo a corpo)',
    'tactical-ranged': 'Armas Táticas (à distância)',
    'firearm-short': 'Armas de Fogo Curtas',
    'firearm-long': 'Armas de Fogo Longas',
    'heavy': 'Armas Pesadas',
  };
  return categoryNames[category] || category;
}

// =====================================================
// EXPORTAÇÕES
// =====================================================

export {
  calculateBaseCarryCapacity,
  calculateUsedSpaces,
  PROFICIENCY_PENALTIES,
};
