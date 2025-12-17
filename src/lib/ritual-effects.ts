/**
 * Ordem Paranormal RPG - Sistema de Efeitos de Rituais
 * Fase 1: Estrutura de dados para efeitos mecânicos dos rituais
 * Define dano, condições aplicadas, modificadores de arma, etc.
 */

import { RitualElement } from './rituals-data';

// ==================== TIPOS DE DANO ====================
export type DamageType = 
  | 'balístico' 
  | 'corte' 
  | 'impacto' 
  | 'perfuração'
  | 'fogo'
  | 'frio'
  | 'elétrico'
  | 'ácido'
  | 'químico';

// Tipo de dano elemental (baseado no elemento do ritual)
export type ElementalDamageType = 'sangue' | 'morte' | 'conhecimento' | 'energia' | 'medo';

// Todos os tipos de dano possíveis
export type AnyDamageType = DamageType | ElementalDamageType | 'mental' | 'verdadeiro';

// ==================== TIPOS DE RESISTÊNCIA ====================
export type ResistanceType = 'fortitude' | 'reflexos' | 'vontade';
export type ResistanceEffect = 'anula' | 'parcial' | 'reduz_metade';

// ==================== INTERFACE DE FÓRMULA DE DANO ====================
export interface DamageFormula {
  diceCount: number;      // Quantidade de dados (ex: 3)
  diceType: number;       // Tipo de dado (ex: 6 para d6)
  bonus?: number;         // Bônus fixo (ex: +3)
  damageType: AnyDamageType;
  ignoresRD?: boolean;    // Dano verdadeiro
}

// ==================== INTERFACE DE EFEITO DE RITUAL ====================
export interface RitualEffect {
  // === Dano ===
  damage?: DamageFormula;

  // === Cura ===
  healing?: {
    diceCount: number;
    diceType: number;
    bonus?: number;
  };

  // === PV Temporários ===
  tempHP?: {
    diceCount: number;
    diceType: number;
    bonus?: number;
  };

  // === Condições Aplicadas ===
  appliesConditions?: {
    conditionId: string;
    duration?: 'rodada' | 'cena' | 'sustentado' | 'permanente';
    turnsCount?: number;
  }[];

  // === Modificadores de Defesa ===
  defenseModifier?: number;

  // === Modificadores de Ataque ===
  attackModifier?: number;

  // === Modificadores de Arma (para Amaldiçoar Arma, Arma Atroz, etc.) ===
  weaponEffect?: {
    bonusDamage?: DamageFormula;  // Dano adicional
    attackBonus?: number;          // Bônus no teste de ataque
    criticalBonus?: number;        // Bônus na margem de ameaça
    criticalMultiplierBonus?: number; // Bônus no multiplicador de crítico
  };

  // === Resistência ===
  resistance?: {
    type: ResistanceType;
    effect: ResistanceEffect;
    dt?: number; // Se não informado, usa DT padrão do ritual
  };

  // === Efeitos de Área ===
  areaEffect?: {
    shape: 'explosão' | 'linha' | 'cone' | 'esfera' | 'cubo';
    radius?: number;  // Em metros
    length?: number;  // Para linhas
  };

  // === Modificadores em Perícias ===
  skillModifier?: {
    skills: string[];
    bonus: number; // Pode ser negativo para penalidades
  };

  // === Proteção/RD ===
  damageReduction?: {
    types: AnyDamageType[];
    amount: number;
  };

  // === Outros efeitos especiais ===
  special?: string; // Descrição de efeitos únicos não categorizáveis
}

// ==================== INTERFACE DE EFEITO POR NÍVEL ====================
export interface RitualEffectsByLevel {
  base: RitualEffect;
  discente?: RitualEffect;
  verdadeiro?: RitualEffect;
}

// ==================== MAPEAMENTO DE RITUAIS → EFEITOS ====================
export const RITUAL_EFFECTS: Record<string, RitualEffectsByLevel> = {
  // === RITUAIS DE DANO - 1º CÍRCULO ===
  
  // Amaldiçoar Arma (todas as versões)
  'amaldicoar-arma-conhecimento': {
    base: {
      weaponEffect: {
        bonusDamage: { diceCount: 1, diceType: 6, damageType: 'conhecimento' },
      },
    },
    discente: {
      weaponEffect: {
        bonusDamage: { diceCount: 2, diceType: 6, damageType: 'conhecimento' },
      },
    },
    verdadeiro: {
      weaponEffect: {
        bonusDamage: { diceCount: 4, diceType: 6, damageType: 'conhecimento' },
      },
    },
  },
  'amaldicoar-arma-energia': {
    base: {
      weaponEffect: {
        bonusDamage: { diceCount: 1, diceType: 6, damageType: 'energia' },
      },
    },
    discente: {
      weaponEffect: {
        bonusDamage: { diceCount: 2, diceType: 6, damageType: 'energia' },
      },
    },
    verdadeiro: {
      weaponEffect: {
        bonusDamage: { diceCount: 4, diceType: 6, damageType: 'energia' },
      },
    },
  },
  'amaldicoar-arma-morte': {
    base: {
      weaponEffect: {
        bonusDamage: { diceCount: 1, diceType: 6, damageType: 'morte' },
      },
    },
    discente: {
      weaponEffect: {
        bonusDamage: { diceCount: 2, diceType: 6, damageType: 'morte' },
      },
    },
    verdadeiro: {
      weaponEffect: {
        bonusDamage: { diceCount: 4, diceType: 6, damageType: 'morte' },
      },
    },
  },
  'amaldicoar-arma-sangue': {
    base: {
      weaponEffect: {
        bonusDamage: { diceCount: 1, diceType: 6, damageType: 'sangue' },
      },
    },
    discente: {
      weaponEffect: {
        bonusDamage: { diceCount: 2, diceType: 6, damageType: 'sangue' },
      },
    },
    verdadeiro: {
      weaponEffect: {
        bonusDamage: { diceCount: 4, diceType: 6, damageType: 'sangue' },
      },
    },
  },

  // Eletrocussão
  'eletrocussao': {
    base: {
      damage: { diceCount: 3, diceType: 6, damageType: 'elétrico' },
      appliesConditions: [{ conditionId: 'vulneravel', duration: 'rodada', turnsCount: 1 }],
      resistance: { type: 'fortitude', effect: 'parcial' },
    },
    discente: {
      damage: { diceCount: 6, diceType: 6, damageType: 'elétrico' },
      areaEffect: { shape: 'linha', length: 30 },
      resistance: { type: 'fortitude', effect: 'parcial' },
    },
    verdadeiro: {
      damage: { diceCount: 8, diceType: 6, damageType: 'elétrico' },
      resistance: { type: 'fortitude', effect: 'parcial' },
    },
  },

  // Embaralhar
  'embaralhar': {
    base: {
      defenseModifier: 6,
      special: 'Cria 3 cópias ilusórias. Cada ataque errado destrói 1 cópia (-2 Defesa).',
    },
    discente: {
      defenseModifier: 10,
      special: 'Cria 5 cópias ilusórias.',
    },
    verdadeiro: {
      defenseModifier: 16,
      special: 'Cria 8 cópias. Atacante fica ofuscado quando destrói cópia.',
      appliesConditions: [{ conditionId: 'cego', duration: 'rodada', turnsCount: 1 }],
    },
  },

  // Decadência
  'decadencia': {
    base: {
      damage: { diceCount: 2, diceType: 8, bonus: 2, damageType: 'morte' },
      resistance: { type: 'fortitude', effect: 'reduz_metade' },
    },
    discente: {
      damage: { diceCount: 3, diceType: 8, bonus: 3, damageType: 'morte' },
      special: 'Combina com ataque corpo a corpo, sem resistência.',
    },
    verdadeiro: {
      damage: { diceCount: 8, diceType: 8, bonus: 8, damageType: 'morte' },
      areaEffect: { shape: 'explosão', radius: 6 },
      resistance: { type: 'fortitude', effect: 'reduz_metade' },
    },
  },

  // Definhar
  'definhar': {
    base: {
      appliesConditions: [{ conditionId: 'exausto', duration: 'cena' }],
      resistance: { type: 'fortitude', effect: 'parcial' },
      special: 'Sucesso na resistência: fica vulnerável em vez de fatigado.',
    },
    discente: {
      appliesConditions: [{ conditionId: 'exausto', duration: 'cena' }],
      resistance: { type: 'fortitude', effect: 'parcial' },
      special: 'Falha: exausto. Sucesso: fatigado.',
    },
    verdadeiro: {
      appliesConditions: [{ conditionId: 'exausto', duration: 'cena' }],
      resistance: { type: 'fortitude', effect: 'parcial' },
      special: 'Até 5 alvos. Falha: exausto. Sucesso: fatigado.',
    },
  },

  // Esfolar
  'esfolar': {
    base: {
      damage: { diceCount: 3, diceType: 4, bonus: 3, damageType: 'corte' },
      appliesConditions: [{ conditionId: 'sangrando', duration: 'permanente' }],
      resistance: { type: 'reflexos', effect: 'parcial' },
    },
    discente: {
      damage: { diceCount: 5, diceType: 4, bonus: 5, damageType: 'corte' },
      appliesConditions: [{ conditionId: 'sangrando', duration: 'permanente' }],
      areaEffect: { shape: 'explosão', radius: 6 },
      resistance: { type: 'reflexos', effect: 'parcial' },
    },
    verdadeiro: {
      damage: { diceCount: 10, diceType: 4, bonus: 10, damageType: 'corte' },
      appliesConditions: [{ conditionId: 'sangrando', duration: 'permanente' }],
      areaEffect: { shape: 'explosão', radius: 6 },
      resistance: { type: 'reflexos', effect: 'reduz_metade' },
      special: 'Passar na resistência não evita sangramento.',
    },
  },

  // Arma Atroz
  'arma-atroz': {
    base: {
      weaponEffect: {
        attackBonus: 2,
        criticalBonus: 1,
      },
    },
    discente: {
      weaponEffect: {
        attackBonus: 5,
        criticalBonus: 1,
      },
    },
    verdadeiro: {
      weaponEffect: {
        attackBonus: 5,
        criticalBonus: 2,
        criticalMultiplierBonus: 1,
      },
    },
  },

  // Armadura de Sangue
  'armadura-de-sangue': {
    base: {
      defenseModifier: 5,
    },
    discente: {
      defenseModifier: 10,
      damageReduction: {
        types: ['balístico', 'corte', 'impacto', 'perfuração'],
        amount: 5,
      },
    },
    verdadeiro: {
      defenseModifier: 15,
      damageReduction: {
        types: ['balístico', 'corte', 'impacto', 'perfuração'],
        amount: 10,
      },
    },
  },

  // Cicatrização
  'cicatrizacao': {
    base: {
      healing: { diceCount: 3, diceType: 8, bonus: 3 },
      special: 'Alvo envelhece 1 ano.',
    },
    discente: {
      healing: { diceCount: 5, diceType: 8, bonus: 5 },
      special: 'Alvo envelhece 1 ano.',
    },
    verdadeiro: {
      healing: { diceCount: 7, diceType: 8, bonus: 7 },
      special: 'Alcance curto, múltiplos alvos. Cada alvo envelhece 1 ano.',
    },
  },

  // Consumir Manancial
  'consumir-manancial': {
    base: {
      tempHP: { diceCount: 3, diceType: 6 },
      special: 'PV temporários desaparecem no fim da cena. Gera Lodo.',
    },
    discente: {
      tempHP: { diceCount: 6, diceType: 6 },
    },
    verdadeiro: {
      damage: { diceCount: 3, diceType: 6, damageType: 'morte' },
      areaEffect: { shape: 'esfera', radius: 6 },
      resistance: { type: 'fortitude', effect: 'reduz_metade' },
      special: 'Recebe PV temporários iguais ao dano total causado.',
    },
  },

  // Fortalecimento Sensorial
  'fortalecimento-sensorial': {
    base: {
      skillModifier: {
        skills: ['Investigação', 'Luta', 'Percepção', 'Pontaria'],
        bonus: 1, // +1d6, será tratado como bônus de dado
      },
    },
    discente: {
      skillModifier: {
        skills: ['Investigação', 'Luta', 'Percepção', 'Pontaria'],
        bonus: 1,
      },
      special: 'Inimigos sofrem -1d6 em ataques contra você.',
    },
    verdadeiro: {
      defenseModifier: 10,
      special: 'Imune a surpresa e desprevenido. +10 em Defesa e Reflexos.',
    },
  },

  // Coincidência Forçada
  'coincidencia-forcada': {
    base: {
      skillModifier: {
        skills: ['*'], // Todas as perícias
        bonus: 2,
      },
    },
    discente: {
      skillModifier: {
        skills: ['*'],
        bonus: 2,
      },
      special: 'Afeta múltiplos aliados.',
    },
    verdadeiro: {
      skillModifier: {
        skills: ['*'],
        bonus: 5,
      },
      special: 'Afeta múltiplos aliados.',
    },
  },

  // === RITUAIS DE 2º CÍRCULO ===

  // Âncora Temporal
  'ancora-temporal': {
    base: {
      special: 'Cria ponto de ancoragem. Pode retornar como ação livre, recuperando PV, PE e SAN do momento da ancoragem.',
    },
    discente: {
      special: 'Pode levar 1 aliado adicional.',
    },
    verdadeiro: {
      special: 'Leva aliados em alcance curto e pode atacar no destino.',
    },
  },

  // Caminhos de Sangue
  'caminhos-de-sangue': {
    base: {
      special: 'Teletransporta até 18m para espaço com sangue.',
    },
    discente: {
      areaEffect: { shape: 'esfera', radius: 3 },
      special: 'Cria área de sangue que aplica sangrando.',
      appliesConditions: [{ conditionId: 'sangrando', duration: 'permanente' }],
    },
    verdadeiro: {
      damage: { diceCount: 6, diceType: 6, damageType: 'sangue' },
      areaEffect: { shape: 'esfera', radius: 6 },
      special: 'Cria esfera de sangue que causa 6d6 em inimigos por turno.',
    },
  },

  // Velocidade Mortal
  'velocidade-mortal': {
    base: {
      special: 'Concede 1 ação de movimento extra por turno.',
    },
    discente: {
      special: 'Concede 1 ação padrão extra por turno.',
    },
    verdadeiro: {
      special: 'Afeta alvos escolhidos em alcance curto.',
    },
  },

  // === RITUAIS DE MEDO ===

  // Pânico
  'panico': {
    base: {
      appliesConditions: [{ conditionId: 'apavorado', duration: 'cena' }],
      resistance: { type: 'vontade', effect: 'anula' },
    },
    discente: {
      appliesConditions: [{ conditionId: 'apavorado', duration: 'cena' }],
      resistance: { type: 'vontade', effect: 'parcial' },
      special: 'Múltiplos alvos. Sucesso: abalado em vez de apavorado.',
    },
    verdadeiro: {
      appliesConditions: [{ conditionId: 'apavorado', duration: 'cena' }],
      resistance: { type: 'vontade', effect: 'parcial' },
      special: 'Área de 9m. Sucesso: abalado. Falha: apavorado + 3d6 dano mental.',
      damage: { diceCount: 3, diceType: 6, damageType: 'mental' },
    },
  },

  // Sussurros Insanos
  'sussurros-insanos': {
    base: {
      appliesConditions: [{ conditionId: 'confuso', duration: 'cena' }],
      resistance: { type: 'vontade', effect: 'anula' },
    },
    discente: {
      appliesConditions: [{ conditionId: 'confuso', duration: 'cena' }],
      resistance: { type: 'vontade', effect: 'parcial' },
      special: 'Falha por 5+: fica fascinado ouvindo os sussurros.',
    },
    verdadeiro: {
      appliesConditions: [{ conditionId: 'confuso', duration: 'cena' }],
      resistance: { type: 'vontade', effect: 'parcial' },
      special: 'Área de 9m. Pode comandar ações dos afetados.',
    },
  },
};

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Retorna os efeitos de um ritual pelo ID
 */
export function getRitualEffects(ritualId: string): RitualEffectsByLevel | undefined {
  return RITUAL_EFFECTS[ritualId];
}

/**
 * Retorna o efeito específico de um ritual baseado nos aprimoramentos selecionados
 */
export function getActiveRitualEffect(
  ritualId: string,
  selectedEnhancements: string[]
): RitualEffect | undefined {
  const effects = RITUAL_EFFECTS[ritualId];
  if (!effects) return undefined;

  // Começar com o efeito base
  let activeEffect = { ...effects.base };

  // Aplicar aprimoramentos selecionados (Verdadeiro tem prioridade sobre Discente)
  if (selectedEnhancements.includes('Verdadeiro') && effects.verdadeiro) {
    activeEffect = mergeEffects(activeEffect, effects.verdadeiro);
  } else if (selectedEnhancements.includes('Discente') && effects.discente) {
    activeEffect = mergeEffects(activeEffect, effects.discente);
  }

  return activeEffect;
}

/**
 * Mescla dois efeitos de ritual (aprimoramento sobrescreve base)
 */
function mergeEffects(base: RitualEffect, enhancement: RitualEffect): RitualEffect {
  return {
    ...base,
    ...enhancement,
    // Arrays devem ser mesclados ou substituídos
    appliesConditions: enhancement.appliesConditions || base.appliesConditions,
    // Efeitos de arma devem ser mesclados
    weaponEffect: enhancement.weaponEffect 
      ? { ...base.weaponEffect, ...enhancement.weaponEffect }
      : base.weaponEffect,
  };
}

/**
 * Calcula a fórmula de dano como string legível
 */
export function formatDamageFormula(formula: DamageFormula): string {
  const bonusStr = formula.bonus 
    ? (formula.bonus > 0 ? `+${formula.bonus}` : formula.bonus.toString())
    : '';
  return `${formula.diceCount}d${formula.diceType}${bonusStr}`;
}

/**
 * Verifica se um ritual causa dano direto
 */
export function ritualDealsDamage(ritualId: string): boolean {
  const effects = RITUAL_EFFECTS[ritualId];
  if (!effects) return false;
  
  return !!(
    effects.base.damage ||
    effects.discente?.damage ||
    effects.verdadeiro?.damage
  );
}

/**
 * Verifica se um ritual aplica condições
 */
export function ritualAppliesConditions(ritualId: string): boolean {
  const effects = RITUAL_EFFECTS[ritualId];
  if (!effects) return false;
  
  return !!(
    effects.base.appliesConditions?.length ||
    effects.discente?.appliesConditions?.length ||
    effects.verdadeiro?.appliesConditions?.length
  );
}
