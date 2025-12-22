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
  mechanics: EffectMechanics;
  affinityMechanics?: EffectMechanics;
  description: string;
  affinityDescription?: string;
}> = {
  // =====================================================
  // PODERES DE SANGUE (5 poderes)
  // =====================================================

  // === Anatomia Insana ===
  'anatomia-insana': {
    mechanics: {
      fortitudeBonus: 2,
    },
    affinityMechanics: {
      fortitudeBonus: 5,
    },
    description: '+2 em testes de Fortitude',
    affinityDescription: '+5 em testes de Fortitude (com afinidade)',
  },

  // === Arma de Sangue ===
  'arma-de-sangue': {
    mechanics: {
      specialEffects: ['Arma de sangue: 1d10, ameaça 19 (custo: 2 PV)'],
    },
    affinityMechanics: {
      specialEffects: ['Arma de sangue: 1d10+2, ameaça 19 (custo: 2 PV)'],
    },
    description: 'Cria arma corpo a corpo de sangue cristalizado',
    affinityDescription: 'Arma de sangue causa +2 de dano (com afinidade)',
  },

  // === Sangue de Ferro ===
  'sangue-de-ferro': {
    mechanics: {
      hpBonusPerNex: 2, // +2 PV por cada 5% de NEX
    },
    affinityMechanics: {
      hpBonusPerNex: 4, // +4 PV por cada 5% de NEX
    },
    description: '+2 PV por NEX',
    affinityDescription: '+4 PV por NEX (com afinidade)',
  },

  // === Sangue Fervente ===
  'sangue-fervente': {
    mechanics: {
      extraDamageDice: '1d6',
      specialEffects: ['+1d6 em rituais de Sangue'],
    },
    affinityMechanics: {
      extraDamageDice: '2d6',
      specialEffects: ['+2d6 em rituais de Sangue'],
    },
    description: '+1d6 de dano em rituais de Sangue',
    affinityDescription: '+2d6 de dano em rituais de Sangue (com afinidade)',
  },

  // === Sangue Vivo ===
  'sangue-vivo': {
    mechanics: {
      specialEffects: ['Regenera 1d6 PV no início do turno'],
    },
    affinityMechanics: {
      specialEffects: ['Regenera 2d6 PV no início do turno'],
    },
    description: 'Regenera 1d6 PV por turno',
    affinityDescription: 'Regenera 2d6 PV por turno (com afinidade)',
  },

  // =====================================================
  // PODERES DE MORTE (5 poderes)
  // =====================================================

  // === Encarar a Morte ===
  'encarar-a-morte': {
    mechanics: {
      specialEffects: ['Morre apenas em -10 PV (ao invés de -5)'],
    },
    affinityMechanics: {
      specialEffects: ['Morre apenas em -20 PV (ao invés de -5)'],
    },
    description: 'Morre em -10 PV (ao invés de -5)',
    affinityDescription: 'Morre em -20 PV (com afinidade)',
  },

  // === Escapar da Morte ===
  'escapar-da-morte': {
    mechanics: {
      specialEffects: ['1x/sessão: ao cair a 0 PV ou menos, fica com 1 PV'],
    },
    affinityMechanics: {
      specialEffects: ['2x/sessão: ao cair a 0 PV ou menos, fica com 1 PV'],
    },
    description: '1x/sessão: sobrevive a golpe letal',
    affinityDescription: '2x/sessão: sobrevive a golpe letal (com afinidade)',
  },

  // === Potencial Aprimorado ===
  'potencial-aprimorado': {
    mechanics: {
      peBonusPerNex: 1, // +1 PE por cada 5% de NEX
    },
    affinityMechanics: {
      peBonusPerNex: 2, // +2 PE por cada 5% de NEX
    },
    description: '+1 PE por NEX',
    affinityDescription: '+2 PE por NEX (com afinidade)',
  },

  // === Potencial Reaproveitado ===
  'potencial-reaproveitado': {
    mechanics: {
      specialEffects: ['Ao matar criatura: recupera PE = círculo máximo de ritual dela (mínimo 1)'],
    },
    affinityMechanics: {
      specialEffects: ['Ao matar criatura: recupera 2x PE = círculo máximo de ritual dela'],
    },
    description: 'Recupera PE ao matar criaturas',
    affinityDescription: 'Recupera dobro de PE ao matar criaturas (com afinidade)',
  },

  // === Surto Temporal ===
  'surto-temporal': {
    mechanics: {
      extraAction: 'standard',
      specialEffects: ['1x/cena: ação padrão adicional'],
    },
    affinityMechanics: {
      extraAction: 'standard',
      specialEffects: ['2x/cena: ação padrão adicional'],
    },
    description: '1x/cena: ação padrão extra',
    affinityDescription: '2x/cena: ação padrão extra (com afinidade)',
  },

  // =====================================================
  // PODERES DE CONHECIMENTO (5 poderes)
  // =====================================================

  // === Expansão de Conhecimento ===
  'expansao-de-conhecimento': {
    mechanics: {
      specialEffects: ['+5 em 1 perícia de Intelecto (escolhida)'],
    },
    affinityMechanics: {
      specialEffects: ['+5 em 2 perícias de Intelecto (escolhidas)'],
    },
    description: '+5 em 1 perícia de Intelecto',
    affinityDescription: '+5 em 2 perícias de Intelecto (com afinidade)',
  },

  // === Percepção Paranormal ===
  'percepcao-paranormal': {
    mechanics: {
      specialEffects: ['Detecta presenças paranormais em alcance médio (direção e distância)'],
    },
    affinityMechanics: {
      specialEffects: ['Detecta presenças paranormais: direção, distância, elemento e círculo'],
    },
    description: 'Sente presenças paranormais',
    affinityDescription: 'Sente detalhes de presenças paranormais (com afinidade)',
  },

  // === Precognição ===
  'precognicao': {
    mechanics: {
      defenseBonus: 2,
      fortitudeBonus: 2,
      reflexosBonus: 2,
      vontadeBonus: 2,
    },
    affinityMechanics: {
      defenseBonus: 5,
      fortitudeBonus: 5,
      reflexosBonus: 5,
      vontadeBonus: 5,
    },
    description: '+2 Defesa e resistências',
    affinityDescription: '+5 Defesa e resistências (com afinidade)',
  },

  // === Sensitivo ===
  'sensitivo': {
    mechanics: {
      skillBonus: {
        diplomacia: 5,
        intimidacao: 5,
        intuicao: 5,
      },
    },
    affinityMechanics: {
      skillBonus: {
        diplomacia: 10,
        intimidacao: 10,
        intuicao: 10,
      },
    },
    description: '+5 Diplomacia, Intimidação e Intuição',
    affinityDescription: '+10 Diplomacia, Intimidação e Intuição (com afinidade)',
  },

  // === Visão do Oculto ===
  'visao-do-oculto': {
    mechanics: {
      skillBonus: { percepcao: 5 },
      specialEffects: ['Enxerga criaturas e objetos invisíveis'],
    },
    affinityMechanics: {
      skillBonus: { percepcao: 10 },
      specialEffects: ['Enxerga invisíveis com +10 Percepção'],
    },
    description: '+5 Percepção, vê invisíveis',
    affinityDescription: '+10 Percepção, vê invisíveis (com afinidade)',
  },

  // =====================================================
  // PODERES DE ENERGIA (5 poderes)
  // =====================================================

  // === Afortunado ===
  'afortunado': {
    mechanics: {
      specialEffects: ['Rerola d20 com resultado 1'],
    },
    affinityMechanics: {
      specialEffects: ['Rerola d20 com resultado 1 ou 2'],
    },
    description: 'Rerola resultado 1 em d20',
    affinityDescription: 'Rerola resultado 1 ou 2 em d20 (com afinidade)',
  },

  // === Campo Protetor ===
  'campo-protetor': {
    mechanics: {
      defenseBonus: 5,
      specialEffects: ['+5 Defesa ao usar ação Esquivar (condicional)'],
    },
    affinityMechanics: {
      defenseBonus: 10,
      specialEffects: ['+10 Defesa ao usar ação Esquivar (condicional)'],
    },
    description: '+5 Defesa ao esquivar',
    affinityDescription: '+10 Defesa ao esquivar (com afinidade)',
  },

  // === Causalidade Fortuita ===
  'causalidade-fortuita': {
    mechanics: {
      specialEffects: ['Crítico causa condição aleatória por 1 rodada'],
    },
    affinityMechanics: {
      specialEffects: ['Crítico causa condição aleatória por 1d4 rodadas'],
    },
    description: 'Críticos causam condição',
    affinityDescription: 'Críticos causam condição por mais tempo (com afinidade)',
  },

  // === Golpe de Sorte ===
  'golpe-de-sorte': {
    mechanics: {
      criticalMarginBonus: 1,
    },
    affinityMechanics: {
      criticalMarginBonus: 2,
    },
    description: '+1 margem de ameaça',
    affinityDescription: '+2 margem de ameaça (com afinidade)',
  },

  // === Manipular Entropia ===
  'manipular-entropia': {
    mechanics: {
      specialEffects: ['1x/cena: rola 2d20 e escolhe o melhor resultado'],
    },
    affinityMechanics: {
      specialEffects: ['1x/cena: rola 3d20 e escolhe o melhor resultado'],
    },
    description: '1x/cena: vantagem em teste',
    affinityDescription: '1x/cena: super vantagem (3d20) (com afinidade)',
  },

  // =====================================================
  // PODERES GENÉRICOS (2 poderes)
  // =====================================================

  // === Aprender Ritual ===
  'aprender-ritual': {
    mechanics: {
      specialEffects: ['Aprende 1 ritual adicional de qualquer círculo disponível'],
    },
    description: '+1 ritual conhecido',
  },

  // === Resistir a Elemento ===
  'resistir-a-elemento': {
    mechanics: {
      specialEffects: ['Resistência 5 a elemento escolhido'],
    },
    description: 'Resistência 5 a um elemento',
  },
};

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
 * Aplica bônus de perícias de Expansão de Conhecimento
 */
function applyExpansionSkillBonus(
  mechanics: EffectMechanics,
  chosenSkills: string[] | undefined,
  hasAffinity: boolean
): EffectMechanics {
  if (!chosenSkills || chosenSkills.length === 0) return mechanics;

  const updated = { ...mechanics };
  updated.skillBonus = { ...(updated.skillBonus || {}) };

  // Com afinidade: 2 perícias, sem: 1 perícia
  const maxSkills = hasAffinity ? 2 : 1;
  const skillsToApply = chosenSkills.slice(0, maxSkills);

  for (const skill of skillsToApply) {
    updated.skillBonus[skill] = 5;
  }

  return updated;
}

/**
 * Aplica resistência elemental de Resistir a Elemento
 */
function applyElementalResistance(
  mechanics: EffectMechanics,
  resistElement: ParanormalElement | undefined
): EffectMechanics {
  if (!resistElement) return mechanics;

  const updated = { ...mechanics };
  updated.damageResistance = {
    ...(updated.damageResistance || {}),
    [resistElement]: 5,
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
  const nexSteps = Math.floor(nex / 5); // Quantos incrementos de 5% de NEX

  if (updated.hpBonusPerNex) {
    updated.hpBonus = (updated.hpBonus || 0) + (updated.hpBonusPerNex * nexSteps);
  }

  if (updated.peBonusPerNex) {
    updated.peBonus = (updated.peBonus || 0) + (updated.peBonusPerNex * nexSteps);
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

  for (const savedPower of paranormalPowers) {
    const powerDef = getPowerById(savedPower.id);
    const effectMapping = PARANORMAL_POWER_EFFECTS[savedPower.id];

    if (!effectMapping) {
      // Poder não mapeado ainda - adiciona como efeito especial
      effects.push({
        id: `paranormal-${savedPower.id}`,
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
    const powerElement = powerDef?.element || savedPower.element;
    const hasAffinity = hasAffinityBonus(powerElement, elementalAffinity, affinityActive);

    // Seleciona mecânicas apropriadas (com ou sem afinidade)
    let mechanics = hasAffinity && effectMapping.affinityMechanics
      ? { ...effectMapping.affinityMechanics }
      : { ...effectMapping.mechanics };

    // Aplica bônus dinâmicos baseados em NEX
    mechanics = applyNexBasedBonuses(mechanics, nex);

    // Aplica escolhas específicas do poder
    if (savedPower.id === 'expansao-de-conhecimento' && savedPower.choices?.skills) {
      mechanics = applyExpansionSkillBonus(mechanics, savedPower.choices.skills, hasAffinity);
    }

    if (savedPower.id === 'resistir-a-elemento' && savedPower.choices?.resistElement) {
      mechanics = applyElementalResistance(mechanics, savedPower.choices.resistElement);
    }

    // Determina descrição apropriada
    const description = hasAffinity && effectMapping.affinityDescription
      ? effectMapping.affinityDescription
      : effectMapping.description;

    const effect: UnifiedEffect = {
      id: `paranormal-${savedPower.id}`,
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
