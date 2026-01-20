/**
 * Bridge entre o sistema de poderes de classe e o sistema de ativação
 * 
 * Conecta os poderes de Especialista e Combatente com o
 * PowerActivationPanel usado no DiceRollModal.
 * 
 * @module activatable-powers-bridge
 */

import type { ActivatablePower } from '@/components/dice/PowerActivationPanel';
import { ESPECIALISTA_POWERS } from './especialista-powers';
import { COMBATENTE_POWERS } from './combatente-powers';
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
  // Classe do personagem
  characterClass?: string;
  // Origem do personagem (para poderes de origem ativáveis como "Saber é Poder")
  origin?: string;
  // Atributo sendo testado (para filtrar poderes aplicáveis por atributo)
  testedAttribute?: 'strength' | 'agility' | 'vigor' | 'intellect' | 'presence';
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
  'ninja urbano': 'ninja-urbano',
  'balística avançada': 'balistica-avancada',
  'balistica avancada': 'balistica-avancada',
  // Combatente
  'ataque especial': 'ataque-especial',
  'incansável': 'incansavel',
  'incansavel': 'incansavel',
  'sentido tático': 'sentido-tatico',
  'sentido tatico': 'sentido-tatico',
  'avanço tático': 'avanco-tatico',
  'avanco tatico': 'avanco-tatico',
  'ímpeto': 'impeto',
  'impeto': 'impeto',
  'tiro de cobertura': 'tiro-de-cobertura',
  'pancada revigorante': 'pancada-revigorante',
  'ataque de oportunidade': 'ataque-de-oportunidade',
  // Novos poderes de Combatente (Fase 5B)
  'combate defensivo': 'combate-defensivo',
  'combater com duas armas': 'combater-duas-armas',
  'golpe pesado': 'golpe-pesado',
  'golpe demolidor': 'golpe-demolidor',
  'segurar o gatilho': 'segurar-gatilho',
  'segurar gatilho': 'segurar-gatilho',
  'artista marcial': 'artista-marcial',
  'reflexos defensivos': 'reflexos-defensivos',
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
export function hasPowerOrAbility(
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
// HELPERS DO COMBATENTE
// ========================================

/**
 * Calcula o tier de Ataque Especial baseado no NEX
 * Retorna o custo de PE e o bônus concedido
 */
export function getAtaqueEspecialTier(nex: number): { cost: number; bonus: number } {
  if (nex >= 85) return { cost: 5, bonus: 20 };
  if (nex >= 55) return { cost: 4, bonus: 15 };
  if (nex >= 25) return { cost: 3, bonus: 10 };
  return { cost: 2, bonus: 5 };
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
  const { powers, abilities, nex, peritoSkills, characterClass, origin, testedAttribute } = context;
  const activatable: ActivatablePower[] = [];
  
  // ==================== ORIGENS ====================
  
  // Saber é Poder (Acadêmico) - só aparece em testes de Intelecto
  const normalizedOrigin = origin?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() || '';
  const isAcademico = normalizedOrigin === 'academico' || normalizedOrigin === 'acadêmico';
  const isIntellectTest = testedAttribute === 'intellect';
  
  if (isAcademico && isIntellectTest) {
    activatable.push({
      id: 'saber-e-poder',
      name: 'Saber é Poder',
      description: 'Quando faz um teste usando Intelecto, você pode gastar 2 PE para receber +5 nesse teste.',
      peCost: 2,
      effect: '+5 no teste',
      icon: 'book', // Usa 'book' que mapeia para BookOpen no painel
      effectType: 'skill_bonus',
      skillBonus: 5,
    });
  }
  
  // ==================== ESPECIALISTA ====================
  
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
      applicableSkills: peritoSkills && peritoSkills.length > 0 ? peritoSkills : undefined,
      excludedSkills: ['luta', 'pontaria'],
    });
  }
  
  // ==================== COMBATENTE ====================
  
  // Ataque Especial (habilidade core do Combatente)
  if (hasPowerOrAbility(powers, abilities, 'ataque-especial', 'Ataque Especial') ||
      characterClass === 'Combatente') {
    const tier = getAtaqueEspecialTier(nex);
    
    activatable.push({
      id: 'ataque-especial',
      name: 'Ataque Especial',
      description: `Gaste ${tier.cost} PE para +${tier.bonus} em ataque OU dano (ou divida entre ambos).`,
      peCost: tier.cost,
      effect: `+${tier.bonus} ataque/dano`,
      icon: 'sword',
      effectType: 'combat_bonus',
      applicableSkills: ['luta', 'pontaria'],
    });
  }
  
  // Incansável
  if (hasPowerOrAbility(powers, abilities, 'incansavel', 'Incansável')) {
    activatable.push({
      id: 'incansavel',
      name: 'Incansável',
      description: 'Ação de investigação adicional usando For ou Agi. +5 no teste.',
      peCost: 2,
      effect: '+5 (1x/cena)',
      icon: 'search',
      effectType: 'skill_bonus',
      skillBonus: 5,
      // Perícias de investigação física
      applicableSkills: ['atletismo', 'acrobacia', 'furtividade', 'percepcao', 'sobrevivencia'],
    });
  }
  
  // Sentido Tático
  if (hasPowerOrAbility(powers, abilities, 'sentido-tatico', 'Sentido Tático')) {
    activatable.push({
      id: 'sentido-tatico',
      name: 'Sentido Tático',
      description: 'Analisa o ambiente. +INT em Defesa e resistências até fim da cena.',
      peCost: 2,
      effect: '+INT Defesa/Resist',
      icon: 'eye',
      effectType: 'defense_bonus',
      applicableSkills: ['percepcao', 'tatica'],
    });
  }
  
  // Avanço Tático
  if (hasPowerOrAbility(powers, abilities, 'avanco-tatico', 'Avanço Tático')) {
    activatable.push({
      id: 'avanco-tatico',
      name: 'Avanço Tático',
      description: 'Ignora a penalidade de -5 na Defesa ao fazer investida.',
      peCost: 1,
      effect: 'Investida segura',
      icon: 'move',
      effectType: 'defense_bonus',
    });
  }
  
  // Ímpeto
  if (hasPowerOrAbility(powers, abilities, 'impeto', 'Ímpeto')) {
    activatable.push({
      id: 'impeto',
      name: 'Ímpeto',
      description: 'Aumenta seu deslocamento em +3m por uma rodada.',
      peCost: 1,
      effect: '+3m movimento',
      icon: 'zap',
      effectType: 'movement_bonus',
    });
  }
  
  // Tiro de Cobertura
  if (hasPowerOrAbility(powers, abilities, 'tiro-de-cobertura', 'Tiro de Cobertura')) {
    activatable.push({
      id: 'tiro-de-cobertura',
      name: 'Tiro de Cobertura',
      description: 'Força alvo a se proteger. Teste de Pontaria vs Vontade. Efeito de medo.',
      peCost: 1,
      effect: 'Supressão',
      icon: 'target',
      effectType: 'control',
      applicableSkills: ['pontaria'],
    });
  }
  
  // Pancada Revigorante
  if (hasPowerOrAbility(powers, abilities, 'pancada-revigorante', 'Pancada Revigorante')) {
    activatable.push({
      id: 'pancada-revigorante',
      name: 'Pancada Revigorante',
      description: 'Ao acertar corpo a corpo, recebe PV temporários = metade do dano.',
      peCost: 1,
      effect: 'PV temporário',
      icon: 'heart',
      effectType: 'healing',
      applicableSkills: ['luta'],
    });
  }
  
  // Ataque de Oportunidade
  if (hasPowerOrAbility(powers, abilities, 'ataque-de-oportunidade', 'Ataque de Oportunidade')) {
    activatable.push({
      id: 'ataque-de-oportunidade',
      name: 'Ataque de Oportunidade',
      description: 'Ataque corpo a corpo quando inimigo sai de adjacência.',
      peCost: 1,
      effect: 'Reação',
      icon: 'sword',
      effectType: 'reaction',
      applicableSkills: ['luta'],
    });
  }
  
  // Combate Defensivo
  if (hasPowerOrAbility(powers, abilities, 'combate-defensivo', 'Combate Defensivo')) {
    activatable.push({
      id: 'combate-defensivo',
      name: 'Combate Defensivo',
      description: 'Sofre -2 em ataques, mas recebe +5 em Defesa até seu próximo turno.',
      peCost: 0,
      effect: '-2 ataque / +5 Defesa',
      icon: 'shield',
      effectType: 'defense_tradeoff',
      applicableSkills: ['luta', 'pontaria'],
    });
  }
  
  // Combater com Duas Armas
  if (hasPowerOrAbility(powers, abilities, 'combater-duas-armas', 'Combater com Duas Armas')) {
    activatable.push({
      id: 'combater-duas-armas',
      name: 'Combater com Duas Armas',
      description: 'Dois ataques (um com cada arma), -2 em todos os ataques até próximo turno.',
      peCost: 0,
      effect: '2 ataques (-2 cada)',
      icon: 'swords',
      effectType: 'extra_attack',
      applicableSkills: ['luta', 'pontaria'],
    });
  }
  
  // Golpe Pesado (passivo, mas importante destacar)
  if (hasPowerOrAbility(powers, abilities, 'golpe-pesado', 'Golpe Pesado')) {
    activatable.push({
      id: 'golpe-pesado',
      name: 'Golpe Pesado',
      description: 'Dano de arma corpo a corpo aumenta em +1 dado do mesmo tipo.',
      peCost: 0,
      effect: '+1 dado de dano',
      icon: 'anvil',
      effectType: 'damage_bonus',
      applicableSkills: ['luta'],
    });
  }
  
  // Golpe Demolidor
  if (hasPowerOrAbility(powers, abilities, 'golpe-demolidor', 'Golpe Demolidor')) {
    activatable.push({
      id: 'golpe-demolidor',
      name: 'Golpe Demolidor',
      description: 'Dobra o dano ao usar manobra quebrar ou atacar um objeto.',
      peCost: 1,
      effect: 'Dano x2 (objetos)',
      icon: 'hammer',
      effectType: 'damage_multiplier',
      applicableSkills: ['luta'],
    });
  }
  
  // Segurar o Gatilho
  if (hasPowerOrAbility(powers, abilities, 'segurar-gatilho', 'Segurar o Gatilho')) {
    activatable.push({
      id: 'segurar-gatilho',
      name: 'Segurar o Gatilho',
      description: 'Ao acertar, pode pagar 2 PE para atacar novamente. Pode repetir se acertar.',
      peCost: 2,
      effect: 'Ataque extra (2 PE)',
      icon: 'crosshair',
      effectType: 'triggered_attack',
      applicableSkills: ['pontaria'],
    });
  }
  
  // Artista Marcial (informativo para dano desarmado)
  if (hasPowerOrAbility(powers, abilities, 'artista-marcial', 'Artista Marcial')) {
    let damageDice = '1d6';
    if (nex >= 70) damageDice = '1d10';
    else if (nex >= 35) damageDice = '1d8';
    
    activatable.push({
      id: 'artista-marcial',
      name: 'Artista Marcial',
      description: `Ataques desarmados causam ${damageDice} de dano e são Ágeis.`,
      peCost: 0,
      effect: `${damageDice} (Ágil)`,
      icon: 'hand-metal',
      effectType: 'damage_bonus',
      applicableSkills: ['luta'],
    });
  }
  
  // Reflexos Defensivos (passivo, mas útil lembrar)
  if (hasPowerOrAbility(powers, abilities, 'reflexos-defensivos', 'Reflexos Defensivos')) {
    activatable.push({
      id: 'reflexos-defensivos',
      name: 'Reflexos Defensivos',
      description: '+2 permanente em Defesa e testes de resistência.',
      peCost: 0,
      effect: '+2 Def/Resist',
      icon: 'shield-check',
      effectType: 'passive_reminder',
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
  attackBonus?: number;
  damageBonus?: number;
  defenseBonus?: number;
  movementBonus?: number;
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
    
    // Combatente
    case 'ataque-especial': {
      const tier = getAtaqueEspecialTier(nex);
      return {
        skillBonusChange: 0,
        attackBonus: tier.bonus,
        damageBonus: tier.bonus,
        specialNote: `+${tier.bonus} para dividir entre ataque e dano`,
      };
    }
    
    case 'incansavel':
      return {
        skillBonusChange: 5,
        specialNote: 'Ação de investigação com For ou Agi',
      };
    
    case 'sentido-tatico':
      return {
        skillBonusChange: 0,
        defenseBonus: intellect,
        specialNote: `+${intellect} em Defesa e resistências (Int) até fim da cena`,
      };
    
    case 'avanco-tatico':
      return {
        skillBonusChange: 0,
        defenseBonus: 5, // Anula a penalidade de -5
        specialNote: 'Ignora penalidade de investida',
      };
    
    case 'impeto':
      return {
        skillBonusChange: 0,
        movementBonus: 3,
        specialNote: '+3m de deslocamento por 1 rodada',
      };
    
    case 'tiro-de-cobertura':
      return {
        skillBonusChange: 0,
        specialNote: 'Pontaria vs Vontade do alvo',
      };
    
    case 'pancada-revigorante':
      return {
        skillBonusChange: 0,
        specialNote: 'PV temporários = metade do dano causado',
      };
    
    case 'ataque-de-oportunidade':
      return {
        skillBonusChange: 0,
        specialNote: 'Reação quando inimigo sai de adjacência',
      };
    
    case 'combate-defensivo':
      return {
        skillBonusChange: 0,
        attackBonus: -2,
        defenseBonus: 5,
        specialNote: '-2 em ataques, +5 em Defesa até próximo turno',
      };
    
    case 'combater-duas-armas':
      return {
        skillBonusChange: 0,
        attackBonus: -2,
        specialNote: 'Dois ataques com -2 cada (arma leve)',
      };
    
    case 'golpe-pesado':
      return {
        skillBonusChange: 0,
        specialNote: '+1 dado de dano (corpo a corpo)',
      };
    
    case 'golpe-demolidor':
      return {
        skillBonusChange: 0,
        specialNote: 'Dobra dano vs objetos/manobra quebrar',
      };
    
    case 'segurar-gatilho':
      return {
        skillBonusChange: 0,
        specialNote: 'Ataque extra ao acertar (2 PE cada)',
      };
    
    case 'artista-marcial': {
      let dice = '1d6';
      if (nex >= 70) dice = '1d10';
      else if (nex >= 35) dice = '1d8';
      return {
        skillBonusChange: 0,
        specialNote: `Desarmado: ${dice} dano (Ágil)`,
      };
    }
    
    case 'reflexos-defensivos':
      return {
        skillBonusChange: 0,
        defenseBonus: 2,
        specialNote: '+2 Defesa e resistências (passivo)',
      };
    
    // ==================== ORIGENS ====================
    
    case 'saber-e-poder':
      // Acadêmico: +5 em testes de Intelecto por 2 PE
      return {
        skillBonusChange: 5,
        specialNote: '+5 no teste de Intelecto (Saber é Poder)',
      };
      
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
  // Primeiro tenta achar em Especialista
  let power = ESPECIALISTA_POWERS.find(p => p.id === powerId);
  
  // Se não achou, tenta em Combatente
  if (!power) {
    power = COMBATENTE_POWERS.find(p => p.id === powerId);
  }
  
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
  
  // Verifica atributos
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
