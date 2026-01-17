/**
 * Bridge entre o sistema de poderes de classe e o sistema de ativação
 * 
 * Conecta os poderes definidos em especialista-powers.ts com o
 * PowerActivationPanel usado no DiceRollModal.
 * 
 * @module activatable-powers-bridge
 */

import type { ActivatablePower } from '@/components/dice/PowerActivationPanel';
import { ESPECIALISTA_POWERS } from './especialista-powers';
import { getPeritoExtraDice, getEcleticoLevel } from '@/components/dice/PowerActivationPanel';
import { resolveScalingValue } from './power-effects-engine';

// ========================================
// TIPOS
// ========================================

interface CharacterPowerContext {
  powers: Array<{ id?: string; name: string }> | string[];
  abilities: string[];
  nex: number;
  peCurrent: number;
  intellect: number;
  // Perícias treinadas do personagem (para verificar Perito)
  trainedSkills?: string[];
  // Perícias escolhidas para Perito
  peritoSkills?: string[];
}

// ========================================
// MAPEAMENTO DE PODERES LEGADOS
// ========================================

/**
 * Mapeia nomes de poderes/habilidades para IDs unificados
 */
const LEGACY_ABILITY_TO_POWER_ID: Record<string, string> = {
  // Especialista
  'conhecimento aplicado': 'conhecimento-aplicado',
  'mãos rápidas': 'maos-rapidas',
  'maos rapidas': 'maos-rapidas',
  'nerd': 'nerd',
  'eclético': 'ecletico',
  'ecletico': 'ecletico',
  'perito': 'perito',
  // Também pode vir como habilidade de classe
  'ninja urbano': 'ninja-urbano',
  'balística avançada': 'balistica-avancada',
  'balistica avancada': 'balistica-avancada',
};

/**
 * Normaliza string para comparação
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifica se o personagem possui um poder/habilidade
 */
function hasPowerOrAbility(
  powers: Array<{ id?: string; name: string }> | string[],
  abilities: string[],
  targetId: string,
  targetName?: string
): boolean {
  // Verifica nas habilidades (formato legado)
  const hasAbility = abilities.some(ability => {
    const normalizedAbility = normalizeString(ability);
    const mappedId = LEGACY_ABILITY_TO_POWER_ID[normalizedAbility];
    return mappedId === targetId || normalizedAbility === normalizeString(targetName || targetId);
  });
  
  if (hasAbility) return true;
  
  // Verifica nos poderes
  return powers.some(power => {
    if (typeof power === 'string') {
      const normalizedPower = normalizeString(power);
      const mappedId = LEGACY_ABILITY_TO_POWER_ID[normalizedPower];
      return mappedId === targetId || normalizedPower === normalizeString(targetName || targetId);
    }
    return power.id === targetId || 
           normalizeString(power.name) === normalizeString(targetName || targetId);
  });
}

// ========================================
// FUNÇÕES PRINCIPAIS
// ========================================

/**
 * Retorna os poderes ativáveis disponíveis para o personagem
 * baseado em seus poderes/habilidades e classe
 */
export function getActivatablePowersForCharacter(
  context: CharacterPowerContext
): ActivatablePower[] {
  const { powers, abilities, nex, peritoSkills } = context;
  const activatable: ActivatablePower[] = [];
  
  // Conhecimento Aplicado
  if (hasPowerOrAbility(powers, abilities, 'conhecimento-aplicado', 'Conhecimento Aplicado')) {
    activatable.push({
      id: 'conhecimento-aplicado',
      name: 'Conhecimento Aplicado',
      description: 'Muda o atributo-base da perícia para Intelecto.',
      peCost: 2,
      effect: 'Usar INT no teste',
      icon: 'brain',
      effectType: 'attribute_swap',
      newAttribute: 'intellect',
      excludedSkills: ['luta', 'pontaria'],
    });
  }
  
  // Mãos Rápidas
  if (hasPowerOrAbility(powers, abilities, 'maos-rapidas', 'Mãos Rápidas')) {
    activatable.push({
      id: 'maos-rapidas',
      name: 'Mãos Rápidas',
      description: 'Faz o teste de Crime como ação livre.',
      peCost: 1,
      effect: 'Ação livre',
      icon: 'hand',
      effectType: 'free_action',
      applicableSkills: ['crime'],
    });
  }
  
  // Nerd
  if (hasPowerOrAbility(powers, abilities, 'nerd', 'Nerd')) {
    activatable.push({
      id: 'nerd',
      name: 'Nerd',
      description: 'Teste de Atualidades (DT 20). Sucesso: pista extra, fraqueza ou informação útil.',
      peCost: 2,
      effect: 'Info extra (1x/cena)',
      icon: 'book',
      effectType: 'knowledge_check',
      applicableSkills: ['atualidades'],
    });
  }
  
  // Eclético (habilidade core do Especialista em NEX 5%)
  if (hasPowerOrAbility(powers, abilities, 'ecletico', 'Eclético')) {
    const ecleticoLevel = getEcleticoLevel(nex);
    const totalCost = ecleticoLevel.baseCost + ecleticoLevel.extraCost;
    
    let effectText = '+5 (treinado)';
    if (nex >= 75) effectText = '+15 (expert)';
    else if (nex >= 40) effectText = '+10 (veterano)';
    
    activatable.push({
      id: 'ecletico',
      name: 'Eclético',
      description: `Recebe os benefícios de ser ${ecleticoLevel.level} na perícia.`,
      peCost: totalCost,
      effect: effectText,
      icon: 'zap',
      effectType: 'skill_trained',
      excludedSkills: ['luta', 'pontaria'],
    });
  }
  
  // Perito (habilidade core do Especialista em NEX 5%)
  if (hasPowerOrAbility(powers, abilities, 'perito', 'Perito')) {
    const peritoData = getPeritoExtraDice(nex);
    
    activatable.push({
      id: 'perito',
      name: 'Perito',
      description: `Soma ${peritoData.dice} ao resultado do teste nas perícias escolhidas.`,
      peCost: peritoData.cost,
      effect: `+${peritoData.dice}`,
      icon: 'sparkles',
      effectType: 'extra_dice',
      extraDice: peritoData.dice,
      // Se tiver perícias escolhidas, usa elas; senão, aplica a todas exceto Luta/Pontaria
      applicableSkills: peritoSkills && peritoSkills.length > 0 ? peritoSkills : undefined,
      excludedSkills: ['luta', 'pontaria'],
    });
  }
  
  return activatable;
}

/**
 * Calcula os efeitos mecânicos de ativar um poder
 */
export function calculatePowerActivationEffects(
  powerId: string,
  nex: number,
  intellect: number
): {
  skillBonusChange: number;
  attributeSwap?: 'intellect' | 'agility' | 'strength' | 'presence' | 'vigor';
  extraDice?: string;
  isActionFree?: boolean;
  specialNote?: string;
} {
  switch (powerId) {
    case 'conhecimento-aplicado':
      return {
        skillBonusChange: 0,
        attributeSwap: 'intellect',
        specialNote: 'Atributo trocado para Intelecto',
      };
      
    case 'maos-rapidas':
      return {
        skillBonusChange: 0,
        isActionFree: true,
        specialNote: 'Este teste é uma ação livre',
      };
      
    case 'nerd':
      return {
        skillBonusChange: 0,
        specialNote: 'DT 20 para obter informação extra',
      };
      
    case 'ecletico': {
      const level = getEcleticoLevel(nex);
      const bonus = level.level === 'expert' ? 15 : level.level === 'veteran' ? 10 : 5;
      return {
        skillBonusChange: bonus,
        specialNote: `Benefícios de ${level.level}`,
      };
    }
      
    case 'perito': {
      const data = getPeritoExtraDice(nex);
      return {
        skillBonusChange: 0,
        extraDice: data.dice,
        specialNote: `Dados extras: ${data.dice}`,
      };
    }
      
    default:
      return { skillBonusChange: 0 };
  }
}

/**
 * Verifica pré-requisitos para usar um poder ativável
 */
export function checkActivatablePowerPrerequisites(
  powerId: string,
  context: CharacterPowerContext
): { canUse: boolean; reason?: string } {
  const power = ESPECIALISTA_POWERS.find(p => p.id === powerId);
  
  if (!power) {
    return { canUse: false, reason: 'Poder não encontrado' };
  }
  
  // Verifica PE - resolve o custo corretamente
  const activation = power.effects?.base?.activation;
  if (activation?.cost !== undefined) {
    const rawCost = activation.cost;
    const peCost: number = typeof rawCost === 'number' 
      ? rawCost 
      : resolveScalingValue(rawCost, context.nex);
    
    if (context.peCurrent < peCost) {
      return { canUse: false, reason: 'PE insuficiente' };
    }
  }
  
  // Verifica atributos (ex: Conhecimento Aplicado requer INT 2)
  if (power.prerequisites?.attributes) {
    const reqIntellect = power.prerequisites.attributes.intellect;
    if (typeof reqIntellect === 'number' && context.intellect < reqIntellect) {
      return { 
        canUse: false, 
        reason: `Requer Intelecto ${reqIntellect}` 
      };
    }
  }
  
  return { canUse: true };
}
