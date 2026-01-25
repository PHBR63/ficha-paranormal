/**
 * Helpers de cálculo de ataques
 * Ordem Paranormal RPG v1.3
 */

import type { 
  CharacterState, 
  DerivedAttack, 
  StatBreakdown, 
  BreakdownSource, 
  CalculationContext 
} from '../types';

/**
 * Calcula todos os ataques disponíveis
 */
export function calculateAttacks(
  state: CharacterState,
  context: CalculationContext
): DerivedAttack[] {
  const attacks: DerivedAttack[] = [];
  
  for (const weapon of state.equippedWeapons) {
    if (!weapon.isEquipped) continue;
    
    const attackBreakdown = calculateAttackBonus(weapon, state, context);
    const damageBreakdown = calculateDamageBonus(weapon, state, context);
    
    attacks.push({
      weaponId: weapon.id,
      weaponName: weapon.name,
      attackBonus: attackBreakdown.total,
      damageFormula: weapon.damage,
      damageBonus: damageBreakdown.total,
      criticalMargin: calculateCriticalMargin(weapon, state),
      criticalMultiplier: calculateCriticalMultiplier(weapon, state),
      range: weapon.range,
      breakdown: {
        attack: attackBreakdown,
        damage: damageBreakdown,
      },
    });
  }
  
  return attacks;
}

/**
 * Calcula bônus de ataque para uma arma
 */
function calculateAttackBonus(
  weapon: CharacterState['equippedWeapons'][0],
  state: CharacterState,
  context: CalculationContext
): StatBreakdown {
  const sources: BreakdownSource[] = [];
  
  // Atributo de ataque
  const attributeValue = context.attributes[weapon.attackAttribute];
  sources.push({
    name: weapon.attackAttribute === 'strength' ? 'Força' : 'Agilidade',
    sourceType: 'attribute',
    value: attributeValue,
  });
  
  // Treinamento na perícia
  const skillLevel = state.skills[weapon.attackSkill];
  if (skillLevel) {
    const trainingBonus = getTrainingBonus(skillLevel);
    if (trainingBonus > 0) {
      sources.push({
        name: `Treinamento em ${weapon.attackSkill === 'luta' ? 'Luta' : 'Pontaria'}`,
        sourceType: 'skill',
        value: trainingBonus,
      });
    }
  }
  
  // Buffs temporários da arma
  if (weapon.temporaryBuffs) {
    for (const buff of weapon.temporaryBuffs) {
      if (buff.bonusAttack) {
        sources.push({
          name: buff.sourceName,
          sourceType: 'ritual',
          value: buff.bonusAttack,
        });
      }
    }
  }
  
  // TODO: Bônus de poderes de classe
  // TODO: Bônus de trilha
  // TODO: Penalidades de condições
  
  const total = sources.reduce((sum, s) => sum + s.value, 0);
  const base = attributeValue;
  
  return { total, base, sources };
}

/**
 * Calcula bônus de dano para uma arma
 */
function calculateDamageBonus(
  weapon: CharacterState['equippedWeapons'][0],
  state: CharacterState,
  context: CalculationContext
): StatBreakdown {
  const sources: BreakdownSource[] = [];
  
  // Força para armas corpo a corpo
  if (weapon.attackSkill === 'luta') {
    sources.push({
      name: 'Força',
      sourceType: 'attribute',
      value: context.attributes.strength,
    });
  }
  
  // Buffs temporários da arma
  if (weapon.temporaryBuffs) {
    for (const buff of weapon.temporaryBuffs) {
      if (buff.bonusDamage) {
        // bonusDamage pode ser um dado (1d6) ou um número
        // Para breakdown, mostramos como fonte
        sources.push({
          name: buff.sourceName,
          sourceType: 'ritual',
          value: 0, // Dano de dado é calculado separadamente
          description: `+${buff.bonusDamage} ${buff.element || ''}`.trim(),
        });
      }
    }
  }
  
  // TODO: Bônus de poderes de classe
  // TODO: Bônus de trilha
  // TODO: Bônus de origem (Militar: +2 ranged)
  
  const total = sources.reduce((sum, s) => sum + s.value, 0);
  const base = weapon.attackSkill === 'luta' ? context.attributes.strength : 0;
  
  return { total, base, sources };
}

/**
 * Calcula margem de crítico efetiva
 */
function calculateCriticalMargin(
  weapon: CharacterState['equippedWeapons'][0],
  state: CharacterState
): number {
  let margin = weapon.criticalMargin;
  
  // TODO: Bônus de poderes (Aniquilador: margem -2)
  // TODO: Bônus de trilha
  
  return Math.max(1, margin);
}

/**
 * Calcula multiplicador de crítico efetivo
 */
function calculateCriticalMultiplier(
  weapon: CharacterState['equippedWeapons'][0],
  state: CharacterState
): number {
  let multiplier = weapon.criticalMultiplier;
  
  // TODO: Bônus de poderes (Aniquilador: +1 mult)
  // TODO: Bônus de trilha
  
  return multiplier;
}

function getTrainingBonus(level: string): number {
  switch (level) {
    case 'treinado':
      return 5;
    case 'veterano':
      return 10;
    case 'expert':
      return 15;
    default:
      return 0;
  }
}
