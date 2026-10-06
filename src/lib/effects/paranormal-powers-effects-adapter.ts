import { BASE_PARANORMAL_POWER_RULES } from '@/lib/rules/base-paranormal-powers';
import { getNexLevel } from '@/lib/rules/nex-progression';
// =====================================================
// Adaptador de Efeitos de Poderes Paranormais
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Converte Poderes Paranormais (22 poderes oficiais) para o formato UnifiedEffect
// Considera bônus de Afinidade Elemental quando aplicável
//

import type { UnifiedEffect, EffectMechanics } from '../unified-effects-engine';
import type { ParanormalElement, SavedParanormalPower } from '../paranormal-powers';
import { getPowerById } from '../paranormal-powers';

/**
 * Mapeamento completo de Poderes Paranormais para EffectMechanics
 * Baseado no Livro Base v1.3 (páginas 114-116)
 * 
 * Total: 22 poderes mapeados (5 por elemento + 2 genéricos)
 */
export const PARANORMAL_POWER_EFFECTS: Record<string, {
  mechanics: EffectMechanics; affinityMechanics?: EffectMechanics;
  description: string; affinityDescription?: string;
}> = Object.fromEntries(BASE_PARANORMAL_POWER_RULES.map(rule => [rule.id, rule]));

/**
 * Determina se o personagem possui bônus de afinidade para o poder
 * 
 * @param powerElement - Elemento do poder
 * @param characterAffinity - Elemento de afinidade do personagem
 * @param affinityActive - Se a afinidade está ativa (NEX >= 50%)
 */
function hasAffinityBonus(
  powerElement: ParanormalElement | 'generic',
  characterAffinity: string | null | undefined,
  affinityActive: boolean
): boolean {
  if (!affinityActive || !characterAffinity) return false;
  if (powerElement === 'generic') return false;
  return powerElement === characterAffinity;
}

/**
 * Aplica resistência elemental de Resistir a Elemento
 */
function applyElementalResistance(
  mechanics: EffectMechanics,
  resistElement: ParanormalElement | undefined, upgraded: boolean
): EffectMechanics {
  if (!resistElement) return mechanics;

  const updated = { ...mechanics };
  updated.damageResistance = {
    ...(updated.damageResistance || {}),
    [resistElement]: upgraded ? 20 : 10,
  };

  return updated;
}

/**
 * Calcula bônus dinâmicos baseados em NEX (Sangue de Ferro, Potencial Aprimorado)
 */
function applyNexBasedBonuses(
  mechanics: EffectMechanics,
  nex: number
): EffectMechanics {
  const updated = { ...mechanics };
  const nexSteps = getNexLevel(nex); // Quantos incrementos de 5% de NEX

  if (updated.hpBonusPerNex) {
    updated.hpBonus = (updated.hpBonus || 0) + (updated.hpBonusPerNex * nexSteps);
    delete updated.hpBonusPerNex;
  }

  if (updated.peBonusPerNex) {
    updated.peBonus = (updated.peBonus || 0) + (updated.peBonusPerNex * nexSteps);
    delete updated.peBonusPerNex;
  }

  return updated;
}

/**
 * Converte poderes paranormais do personagem para UnifiedEffect[]
 * 
 * @param paranormalPowers - Poderes paranormais salvos do personagem
 * @param nex - NEX do personagem
 * @param elementalAffinity - Elemento de afinidade (se houver)
 * @param affinityActive - Se a afinidade está ativa (NEX >= 50%)
 * @returns Array de efeitos unificados
 */
export function getParanormalPowerEffects(
  paranormalPowers: SavedParanormalPower[] | undefined | null,
  nex: number,
  elementalAffinity: string | null | undefined,
  affinityActive: boolean = false
): UnifiedEffect[] {
  const effects: UnifiedEffect[] = [];

  if (!paranormalPowers || paranormalPowers.length === 0) return effects;

  const processed = new Set<string>();
  for (const savedPower of paranormalPowers) {
    // Cada elemento de Resistir tem sua própria aquisição. Segunda cópia aprimora, sem duplicar o bônus.
    const key = savedPower.id === 'resistir-a-elemento' ? `${savedPower.id}:${savedPower.choices?.resistElement ?? 'pending'}` : savedPower.id;
    if (processed.has(key)) continue;
    processed.add(key);
    const powerDef = getPowerById(savedPower.id);
    const effectMapping = PARANORMAL_POWER_EFFECTS[savedPower.id];

    if (!effectMapping) {
      // Poder não mapeado ainda - adiciona como efeito especial
      effects.push({
        id: `paranormal-${key}`,
        name: savedPower.name,
        description: savedPower.description,
        source: 'paranormal_power',
        sourceId: savedPower.id,
        sourceName: `Poder Paranormal: ${savedPower.name}`,
        mechanics: {
          specialEffects: [savedPower.description],
        },
        isActive: true,
        isToggleable: false,
        priority: 50,
      });
      continue;
    }

    // Determina se tem bônus de afinidade
    const powerElement = savedPower.id === 'resistir-a-elemento' ? savedPower.choices?.resistElement ?? 'generic' : powerDef?.element || savedPower.element;
    const copies = paranormalPowers.filter(entry => entry.id === savedPower.id &&
      (savedPower.id !== 'resistir-a-elemento' || entry.choices?.resistElement === savedPower.choices?.resistElement)).length;
    const hasAffinity = nex >= 50 && copies >= 2 && hasAffinityBonus(powerElement, elementalAffinity, affinityActive);

    // Seleciona mecânicas apropriadas (com ou sem afinidade)
    let mechanics = hasAffinity && effectMapping.affinityMechanics
      ? { ...effectMapping.affinityMechanics }
      : { ...effectMapping.mechanics };

    // Aplica bônus dinâmicos baseados em NEX
    mechanics = applyNexBasedBonuses(mechanics, nex);

    // Aplica escolhas específicas do poder
    if (savedPower.id === 'expansao-de-conhecimento' && savedPower.choices?.skills?.length) {
      mechanics.specialEffects = [...(mechanics.specialEffects ?? []), 'Escolha legada de perícia preservada, sem +5 indevido; revisar o poder de outra classe com o mestre.'];
    }

    if (savedPower.id === 'resistir-a-elemento' && savedPower.choices?.resistElement) {
      mechanics = applyElementalResistance(mechanics, savedPower.choices.resistElement, hasAffinity);
    }

    // Determina descrição apropriada
    const description = hasAffinity && effectMapping.affinityDescription
      ? effectMapping.affinityDescription
      : effectMapping.description;

    const effect: UnifiedEffect = {
      id: `paranormal-${key}`,
      name: savedPower.name,
      description,
      source: 'paranormal_power',
      sourceId: savedPower.id,
      sourceName: `Poder Paranormal: ${savedPower.name}${hasAffinity ? ' (Afinidade)' : ''}`,
      mechanics,
      isActive: true,
      isToggleable: false,
      priority: hasAffinity ? 60 : 50, // Afinidade tem prioridade maior
    };

    effects.push(effect);
  }

  return effects;
}

/**
 * Obtém resumo de bônus de poderes paranormais para display
 */
export function getParanormalPowersSummary(
  paranormalPowers: SavedParanormalPower[] | undefined | null,
  nex: number,
  elementalAffinity: string | null | undefined,
  affinityActive: boolean = false
): {
  totalDefense: number;
  totalFortitude: number;
  totalReflexos: number;
  totalVontade: number;
  totalHP: number;
  totalPE: number;
  totalCriticalMargin: number;
  skillBonuses: Record<string, number>;
  specialAbilities: string[];
} {
  const summary = {
    totalDefense: 0,
    totalFortitude: 0,
    totalReflexos: 0,
    totalVontade: 0,
    totalHP: 0,
    totalPE: 0,
    totalCriticalMargin: 0,
    skillBonuses: {} as Record<string, number>,
    specialAbilities: [] as string[],
  };

  const effects = getParanormalPowerEffects(paranormalPowers, nex, elementalAffinity, affinityActive);

  for (const effect of effects) {
    const m = effect.mechanics;

    summary.totalDefense += m.defenseBonus || 0;
    summary.totalFortitude += m.fortitudeBonus || 0;
    summary.totalReflexos += m.reflexosBonus || 0;
    summary.totalVontade += m.vontadeBonus || 0;
    summary.totalHP += m.hpBonus || 0;
    summary.totalPE += m.peBonus || 0;
    summary.totalCriticalMargin += m.criticalMarginBonus || 0;

    if (m.skillBonus) {
      for (const [skill, bonus] of Object.entries(m.skillBonus)) {
        summary.skillBonuses[skill] = (summary.skillBonuses[skill] || 0) + (bonus as number);
      }
    }

    if (m.specialEffects) {
      summary.specialAbilities.push(...m.specialEffects);
    }
  }

  return summary;
}

/**
 * Lista todos os poderes paranormais mapeados
 * Útil para debug e documentação
 */
export function listAllParanormalPowerEffects(): Array<{
  id: string;
  name: string;
  element: string;
  hasMechanics: boolean;
  hasAffinityBonus: boolean;
  description: string;
}> {
  const result: Array<{
    id: string;
    name: string;
    element: string;
    hasMechanics: boolean;
    hasAffinityBonus: boolean;
    description: string;
  }> = [];

  for (const [powerId, effect] of Object.entries(PARANORMAL_POWER_EFFECTS)) {
    const power = getPowerById(powerId);
    
    result.push({
      id: powerId,
      name: power?.name || powerId,
      element: power?.element || 'unknown',
      hasMechanics: Object.keys(effect.mechanics).length > 0,
      hasAffinityBonus: !!effect.affinityMechanics,
      description: effect.description,
    });
  }

  return result;
}
