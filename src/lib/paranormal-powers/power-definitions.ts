import { BASE_PARANORMAL_POWER_RULES } from '@/lib/rules/base-paranormal-powers';
import { getNexLevel } from '@/lib/rules/nex-progression';
/**
 * Ordem Paranormal RPG - Sistema de Poderes Paranormais
 * Baseado no livro oficial (páginas 114-116)
 * 
 * Poderes Paranormais são habilidades obtidas via "Transcender" (habilidade de classe).
 * Quando o personagem atinge NEX 50%, escolhe uma Afinidade Elemental.
 * O aprimoramento exige segunda aquisição do poder no elemento de afinidade.
 */

// Tipos de elementos paranormais oficiais (4 elementos, sem "medo")
export type ParanormalElement = 'sangue' | 'morte' | 'conhecimento' | 'energia';

// ==================== CONSTANTES DE ELEMENTOS (UI) ====================

export const ELEMENT_LABELS: Record<ParanormalElement, string> = {
  sangue: 'Sangue',
  morte: 'Morte',
  conhecimento: 'Conhecimento',
  energia: 'Energia',
};

export const ELEMENT_COLORS: Record<ParanormalElement, string> = {
  sangue: 'text-red-500',
  morte: 'text-purple-500',
  conhecimento: 'text-blue-500',
  energia: 'text-yellow-500',
};

export const ELEMENT_BG_COLORS: Record<ParanormalElement, string> = {
  sangue: 'bg-red-500/10',
  morte: 'bg-purple-500/10',
  conhecimento: 'bg-blue-500/10',
  energia: 'bg-yellow-500/10',
};

export const AFFINITY_DESCRIPTIONS: Record<ParanormalElement, string> = {
  sangue: 'Poderes de Sangue focam em vitalidade, regeneração e força física.',
  morte: 'Poderes de Morte focam em resistência, PE e manipulação temporal.',
  conhecimento: 'Poderes de Conhecimento focam em percepção, previsão e habilidades sociais.',
  energia: 'Poderes de Energia focam em sorte, precisão e manipulação da probabilidade.',
};

// Interface para pré-requisitos de poderes
export interface PowerPrerequisite {
  element?: ParanormalElement;
  count?: number;
}

// Interface para efeitos dos poderes
export interface PowerEffect {
  type: 'stat_bonus' | 'reroll' | 'immunity' | 'resistance' | 'damage_bonus' | 'special' | 'skill_bonus';
  target?: string;
  value?: number;
  description: string;
}

// Tipos de escolhas que um poder pode requerer
export type PowerChoiceType = 'skill_intellect' | 'ritual' | 'element_resistance';

// Interface principal do Poder Paranormal
export interface ParanormalPower {
  id: string;
  name: string;
  element: ParanormalElement | 'generic';
  description: string;
  affinityEffect?: string;
  prerequisite?: PowerPrerequisite;
  effect: PowerEffect;
  isGeneric?: boolean;
  requiresChoice?: PowerChoiceType;
}

// Interface para poder paranormal salvo no personagem (com escolhas)
export interface SavedParanormalPower {
  id: string;
  name: string;
  element: ParanormalElement | 'generic';
  description: string;
  choices?: {
    skills?: string[];
    ritualId?: string;
    resistElement?: ParanormalElement;
  };
}

// ==================== PODERES PARANORMAIS OFICIAIS (22 poderes) ====================

export const PARANORMAL_POWERS: ParanormalPower[] = BASE_PARANORMAL_POWER_RULES.map(rule => ({
  id: rule.id, name: rule.name, element: rule.element, description: rule.description,
  affinityEffect: rule.affinityDescription,
  prerequisite: rule.prerequisiteCount && rule.element !== 'generic' ? { element: rule.element, count: rule.prerequisiteCount } : undefined,
  effect: { type: 'special', description: rule.description },
  isGeneric: rule.element === 'generic', requiresChoice: rule.choice,
}));

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Retorna todos os poderes de um elemento específico
 */
export function getPowersByElement(element: ParanormalElement | 'generic'): ParanormalPower[] {
  return PARANORMAL_POWERS.filter(power => power.element === element);
}

/**
 * Retorna um poder pelo ID
 */
export function getPowerById(id: string): ParanormalPower | undefined {
  return PARANORMAL_POWERS.find(power => power.id === id);
}

/**
 * Conta quantos poderes de um elemento o personagem possui
 */
export function getElementPowerCount(element: ParanormalElement, powerIds: string[]): number {
  return powerIds.filter(id => {
    const power = getPowerById(id);
    return power && power.element === element;
  }).length;
}

/**
 * Verifica se o personagem pode escolher um poder (pré-requisitos)
 */
export function canChoosePower(power: ParanormalPower, characterPowerIds: string[],
  affinityActive = false, affinityElement?: ParanormalElement): boolean {
  if (power.element === 'generic') return Boolean(power.isGeneric) || !characterPowerIds.includes(power.id);
  const copies = characterPowerIds.filter(id => id === power.id).length;
  if (copies > 0) return copies === 1 && affinityActive && affinityElement === power.element;
  const prerequisite = power.prerequisite;
  return !prerequisite?.element || !prerequisite.count || getElementPowerCount(prerequisite.element, characterPowerIds) >= prerequisite.count;
}

/**
 * Retorna o efeito do poder (base ou com afinidade)
 */
export function getPowerEffect(power: ParanormalPower, hasAffinity: boolean, characterAffinity?: ParanormalElement): string {
  if (hasAffinity && characterAffinity && power.element === characterAffinity && power.affinityEffect) {
    return power.affinityEffect;
  }
  return power.description;
}

/**
 * Calcula modificadores de stats baseado nos poderes ativos
 */
export function calculatePowerModifiers(powerIds: string[], nex = 5, hasAffinity = false,
  affinityElement?: ParanormalElement): Record<string, number> {
  const result: Record<string, number> = {};
  for (const id of new Set(powerIds)) {
    const rule = BASE_PARANORMAL_POWER_RULES.find(entry => entry.id === id);
    if (!rule) continue;
    const upgraded = nex >= 50 && hasAffinity && affinityElement === rule.element && powerIds.filter(entry => entry === id).length >= 2;
    const mechanics = upgraded && rule.affinityMechanics ? rule.affinityMechanics : rule.mechanics;
    if (mechanics.hpBonusPerNex) result.pv_bonus = (result.pv_bonus ?? 0) + mechanics.hpBonusPerNex * getNexLevel(nex);
    if (mechanics.peBonusPerNex) result.pe_bonus = (result.pe_bonus ?? 0) + mechanics.peBonusPerNex * getNexLevel(nex);
    if (mechanics.defenseBonus) result.defense = (result.defense ?? 0) + mechanics.defenseBonus;
    if (mechanics.fortitudeBonus) result.fortitude = (result.fortitude ?? 0) + mechanics.fortitudeBonus;
    if (mechanics.criticalMarginBonus) result.threat_margin = (result.threat_margin ?? 0) + mechanics.criticalMarginBonus;
    if (mechanics.criticalMultiplierBonus) result.critical_multiplier = (result.critical_multiplier ?? 0) + mechanics.criticalMultiplierBonus;
    if (id === 'precognicao') result.resistance = (result.resistance ?? 0) + 2;
    for (const [skill, value] of Object.entries(mechanics.skillBonus ?? {})) if (typeof value === 'number') result[skill] = (result[skill] ?? 0) + value;
  }
  return result;
}

/**
 * Verifica se pode rerolar resultado 1 (poder Afortunado)
 */
export function hasRerollOne(powerIds: string[]): boolean {
  return powerIds.includes('afortunado');
}

/**
 * Verifica se pode rerolar resultado 1 e 2 (Afortunado com afinidade)
 */
export function getRerollRange(powerIds: string[], hasAffinity: boolean, affinityElement?: ParanormalElement): number {
  if (!powerIds.includes('afortunado')) return 0;
  return 1;
}

/**
 * Retorna a descrição formatada de todos os efeitos ativos
 */
export function getActivePowerEffects(
  powerIds: string[],
  hasAffinity: boolean = false,
  affinityElement?: ParanormalElement
): string[] {
  return powerIds.map(id => {
    const power = getPowerById(id);
    if (!power) return null;
    return getPowerEffect(power, hasAffinity && powerIds.filter(entry => entry === id).length >= 2, affinityElement);
  }).filter(Boolean) as string[];
}
