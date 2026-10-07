/**
 * Registro Central de Poderes de Classe
 * Ordem Paranormal RPG v1.3
 * 
 * Este arquivo serve como ponto central de acesso a todos os poderes
 * de classe, permitindo busca por ID, classe, NEX e outras propriedades.
 * 
 * Inclui tanto poderes de classe quanto poderes de trilha convertidos.
 */

import { UnifiedClassPower, ClassId } from './types';
import { getBasePowerReference } from './base-power-reference';
import { COMBATENTE_POWERS } from './combatente-powers';
import { ESPECIALISTA_POWERS } from './especialista-powers';
import { OCULTISTA_POWERS } from './ocultista-powers';
import { 
  ALL_TRACK_POWERS,
  COMBATENTE_TRACK_POWERS,
  ESPECIALISTA_TRACK_POWERS,
  OCULTISTA_TRACK_POWERS,
  getTrackPowers,
  getTracksForClass,
  getInitialTrackPower,
  getTrackPowerStats
} from './track-powers';

// Re-exporta funções de trilha para conveniência
export { 
  getTrackPowers, 
  getTracksForClass, 
  getInitialTrackPower, 
  getTrackPowerStats,
  ALL_TRACK_POWERS
};

// ================== REGISTRO CENTRAL ==================

/**
 * Array com todos os poderes de classe (sem trilhas)
 */
export const CLASS_ONLY_POWERS: UnifiedClassPower[] = [
  ...COMBATENTE_POWERS,
  ...ESPECIALISTA_POWERS,
  ...OCULTISTA_POWERS,
];

/**
 * Array com todos os poderes de todas as classes, incluindo trilhas
 * Total: ~90+ poderes de classe + 60 poderes de trilha
 */
export const ALL_CLASS_POWERS: UnifiedClassPower[] = [
  ...COMBATENTE_POWERS,
  ...ESPECIALISTA_POWERS,
  ...OCULTISTA_POWERS,
  ...ALL_TRACK_POWERS,
].map(power => ({ ...power, pageReference: getBasePowerReference(power.name, power.classId) }));

/**
 * Mapa para busca rápida por ID
 */
const POWER_BY_ID = new Map<string, UnifiedClassPower>(
  ALL_CLASS_POWERS.map(power => [power.id, power])
);

/**
 * Mapa para busca por classe
 */
const POWERS_BY_CLASS = new Map<ClassId, UnifiedClassPower[]>([
  ['Combatente', COMBATENTE_POWERS],
  ['Especialista', ESPECIALISTA_POWERS],
  ['Ocultista', OCULTISTA_POWERS],
]);

// ================== FUNÇÕES DE BUSCA ==================

/**
 * Busca um poder pelo seu ID único
 */
export function getPowerById(id: string): UnifiedClassPower | undefined {
  return POWER_BY_ID.get(id);
}

/**
 * Retorna todos os poderes de uma classe específica
 */
export function getPowersByClass(classId: ClassId): UnifiedClassPower[] {
  return POWERS_BY_CLASS.get(classId) || [];
}

/**
 * Retorna poderes core (automáticos) de uma classe
 */
export function getCorePowers(classId: ClassId): UnifiedClassPower[] {
  return getPowersByClass(classId).filter(p => p.isCore);
}

/**
 * Retorna poderes escolhíveis de uma classe
 */
export function getChoosablePowers(classId: ClassId): UnifiedClassPower[] {
  return getPowersByClass(classId).filter(p => !p.isCore);
}

/**
 * Retorna poderes disponíveis para uma classe em um NEX específico
 */
export function getAvailablePowers(classId: ClassId, nex: number): UnifiedClassPower[] {
  return getPowersByClass(classId).filter(p => p.minNex <= nex);
}

/**
 * Retorna poderes escolhíveis disponíveis para uma classe em um NEX específico
 */
export function getAvailableChoosablePowers(classId: ClassId, nex: number): UnifiedClassPower[] {
  return getChoosablePowers(classId).filter(p => p.minNex <= nex);
}

/**
 * Retorna poderes core desbloqueados em um NEX específico
 */
export function getCorePowersAtNex(classId: ClassId, nex: number): UnifiedClassPower[] {
  return getCorePowers(classId).filter(p => p.minNex === nex);
}

/**
 * Retorna novos poderes desbloqueados em um NEX específico (core e escolhíveis)
 */
export function getNewPowersAtNex(classId: ClassId, nex: number): UnifiedClassPower[] {
  return getPowersByClass(classId).filter(p => p.minNex === nex);
}

/**
 * Busca poderes por tag
 */
export function getPowersByTag(tag: string, classId?: ClassId): UnifiedClassPower[] {
  const powers = classId ? getPowersByClass(classId) : ALL_CLASS_POWERS;
  return powers.filter(p => p.tags?.includes(tag));
}

/**
 * Busca poderes repetíveis (que podem ser escolhidos múltiplas vezes)
 */
export function getRepeatablePowers(classId?: ClassId): UnifiedClassPower[] {
  const powers = classId ? getPowersByClass(classId) : ALL_CLASS_POWERS;
  return powers.filter(p => p.isRepeatable);
}

/**
 * Retorna poderes que concedem proficiências
 */
export function getProficiencyPowers(classId?: ClassId): UnifiedClassPower[] {
  const powers = classId ? getPowersByClass(classId) : ALL_CLASS_POWERS;
  return powers.filter(p => p.effects.base.proficiencies);
}

/**
 * Verifica se um personagem atende aos pré-requisitos de um poder
 */
export function meetsPrerequisites(
  power: UnifiedClassPower,
  characterData: {
    nex: number;
    attributes: Record<string, number>;
    skills: Record<string, string>; // skill -> training level
    powers: string[]; // IDs de poderes possuídos
    proficiencies: string[];
  }
): { meets: boolean; missing: string[] } {
  const missing: string[] = [];
  const prereqs = power.prerequisites;
  
  if (!prereqs) {
    return { meets: true, missing: [] };
  }
  
  // Verifica NEX mínimo
  if (prereqs.minNex && characterData.nex < prereqs.minNex) {
    missing.push(`NEX ${prereqs.minNex}%`);
  }
  
  // Verifica atributos
  if (prereqs.attributes) {
    for (const [attr, minValue] of Object.entries(prereqs.attributes)) {
      const attrName = {
        strength: 'Força',
        agility: 'Agilidade',
        vigor: 'Vigor',
        intellect: 'Intelecto',
        presence: 'Presença',
      }[attr] || attr;
      
      if ((characterData.attributes[attr] || 0) < minValue) {
        missing.push(`${attrName} ${minValue}`);
      }
    }
  }
  
  // Verifica perícias
  if (prereqs.skills) {
    for (const skillReq of prereqs.skills) {
      const currentLevel = characterData.skills[skillReq.skill];
      const requiredLevel = skillReq.level || 'trained';
      
      const levelOrder = ['untrained', 'trained', 'veteran', 'expert'];
      const currentIndex = levelOrder.indexOf(currentLevel || 'untrained');
      const requiredIndex = levelOrder.indexOf(requiredLevel);
      
      if (currentIndex < requiredIndex) {
        const skillName = skillReq.skill.charAt(0).toUpperCase() + skillReq.skill.slice(1);
        missing.push(`${skillName} (${requiredLevel})`);
      }
    }
  }
  
  // Verifica poderes necessários
  if (prereqs.powers) {
    for (const powerId of prereqs.powers) {
      if (!characterData.powers.includes(powerId)) {
        const power = getPowerById(powerId);
        missing.push(power?.name || powerId);
      }
    }
  }
  
  // Verifica proficiências
  if (prereqs.proficiencies) {
    for (const prof of prereqs.proficiencies) {
      if (!characterData.proficiencies.includes(prof)) {
        missing.push(`Proficiência: ${prof}`);
      }
    }
  }
  
  return {
    meets: missing.length === 0,
    missing,
  };
}

/**
 * Retorna estatísticas sobre os poderes
 */
export function getPowerStats(): {
  total: number;
  byClass: Record<ClassId, { core: number; choosable: number }>;
  repeatable: number;
  withPrerequisites: number;
} {
  const classes: ClassId[] = ['Combatente', 'Especialista', 'Ocultista'];
  const byClass = {} as Record<ClassId, { core: number; choosable: number }>;
  
  for (const classId of classes) {
    const powers = getPowersByClass(classId);
    byClass[classId] = {
      core: powers.filter(p => p.isCore).length,
      choosable: powers.filter(p => !p.isCore).length,
    };
  }
  
  return {
    total: ALL_CLASS_POWERS.length,
    byClass,
    repeatable: getRepeatablePowers().length,
    withPrerequisites: ALL_CLASS_POWERS.filter(p => p.prerequisites).length,
  };
}
