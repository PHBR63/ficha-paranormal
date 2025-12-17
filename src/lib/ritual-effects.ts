/**
 * Ordem Paranormal RPG - Sistema de Efeitos de Rituais v2
 * Refatorado para suportar hooks, modos, sustentação e tipos semânticos
 */

// ========================================
// TIPOS DE RITUAL (RitualKind)
// ========================================

export type RitualKind = 
  | 'damage'           // Dano direto padrão
  | 'buff'             // Modificadores numéricos temporários
  | 'debuff'           // Penalidades ao alvo
  | 'healing'          // Cura/restauração
  | 'stateOverride'    // Altera regras do jogo (Medo Tangível, Alterar Destino)
  | 'narrativeOverride' // Encerra personagem/história (Martírio de Sangue)
  | 'sense'            // Divinação/detecção (Detecção de Ameaças, Localização)
  | 'interceptor'      // Reage a eventos (Desacelerar Impacto, Tela de Ruído)
  | 'summon'           // Invocação de entidades
  | 'control'          // Controle mental/físico
  | 'transformation'   // Transformação física
  | 'utility';         // Efeitos utilitários diversos

// ========================================
// SISTEMA DE HOOKS (Gatilhos de Evento)
// ========================================

export type HookTrigger = 
  | 'onRoll'           // Quando um dado é rolado (Alterar Destino)
  | 'onPreDamage'      // Antes do dano ser aplicado (Tela de Ruído)
  | 'onPostDamage'     // Depois do dano ser aplicado
  | 'onFallDamage'     // Quando sofre dano de queda (Desacelerar Impacto)
  | 'onProjectileHit'  // Quando atingido por projétil (Desacelerar Impacto)
  | 'onReduceHP'       // Quando PV seria reduzido (Medo Tangível)
  | 'onTurnStart'      // No início do turno
  | 'onTurnEnd'        // No fim do turno
  | 'onDeath'          // Quando morreria (Vínculo de Sangue)
  | 'onCast'           // Quando conjura ritual
  | 'onConcentrationBreak'; // Quando concentração é quebrada

export interface Hook {
  trigger: HookTrigger;
  effect: string;
  condition?: string;
  priority?: number;
}

// ========================================
// SISTEMA DE SUSTENTAÇÃO
// ========================================

export interface SustainConfig {
  costPerTurn?: number;
  action?: 'free' | 'move' | 'standard' | 'full';
  concentration?: boolean;
  maxDuration?: number;
  endTriggers?: string[];
}

// ========================================
// SISTEMA DE MODOS
// ========================================

export interface RitualMode {
  name: string;
  kind: RitualKind;
  description: string;
  effect: Partial<RitualEffect>;
}

// ========================================
// TIPOS DE DANO
// ========================================

export type PhysicalDamageType = 'corte' | 'perfuração' | 'impacto' | 'balístico';
export type ElementalDamageType = 'fogo' | 'frio' | 'eletricidade' | 'ácido' | 'químico';
export type ParanormalDamageType = 'energia' | 'sangue' | 'morte' | 'conhecimento' | 'medo';
export type SpecialDamageType = 'mental' | 'sanidade' | 'verdadeiro';

export type AnyDamageType = PhysicalDamageType | ElementalDamageType | ParanormalDamageType | SpecialDamageType;

// ========================================
// TIPOS DE RESISTÊNCIA
// ========================================

export type ResistanceType = 'fortitude' | 'reflexos' | 'vontade';
export type ResistanceEffect = 'anula' | 'parcial' | 'reduz_metade';

// ========================================
// FÓRMULA DE DANO
// ========================================

export interface DamageFormula {
  diceCount: number;
  diceType: number;
  bonus?: number;
  damageType: AnyDamageType;
  ignoresResistance?: boolean;
  ignoresRD?: boolean; // Compatibilidade legada
  isAbsolute?: boolean;
}

// ========================================
// MODIFICADORES DE RECURSOS
// ========================================

export interface ResourceModifier {
  peMax?: number;
  hpMax?: number;
  sanMax?: number;
  movementMax?: number;
}

// ========================================
// RESTRIÇÕES DE AÇÃO
// ========================================

export type ActionRestriction = 
  | 'mustAttack'
  | 'mustAttackNearest'
  | 'cannotSpeak'
  | 'cannotCast'
  | 'cannotMove'
  | 'cannotUseItems'
  | 'mustFlee'
  | 'mustObey'
  | 'cannotHarm';

// ========================================
// EFEITO DE RITUAL (Interface Principal)
// ========================================

export interface RitualEffect {
  kind?: RitualKind;
  hooks?: Hook[];
  sustain?: SustainConfig;
  modes?: RitualMode[];
  actionRestrictions?: ActionRestriction[];
  resourceModifier?: ResourceModifier;
  
  damage?: DamageFormula;
  damagePerTurn?: DamageFormula;
  
  healing?: {
    diceCount: number;
    diceType: number;
    bonus?: number;
  };
  
  tempHP?: {
    diceCount: number;
    diceType: number;
    bonus?: number;
  };
  
  appliesConditions?: {
    id?: string;
    conditionId?: string; // Compatibilidade legada
    duration?: number | 'rodada' | 'cena' | 'sustentado' | 'permanente';
    turnsCount?: number; // Compatibilidade legada
    savingThrow?: ResistanceType;
    isPermanent?: boolean;
  }[];
  
  defenseModifier?: number;
  attackModifier?: number;
  damageModifier?: number;
  
  weaponEffect?: {
    damageBonus?: number;
    damageType?: AnyDamageType;
    extraDice?: { count: number; type: number };
    bonusDamage?: DamageFormula; // Compatibilidade legada
    attackBonus?: number; // Compatibilidade legada
    criticalBonus?: number; // Compatibilidade legada
    criticalMultiplierBonus?: number; // Compatibilidade legada
    special?: string;
    isPermanentWound?: boolean;
  };
  
  resistance?: {
    type: ResistanceType;
    effect: ResistanceEffect;
    dt?: number;
  };
  
  areaEffect?: {
    shape: 'esfera' | 'cone' | 'linha' | 'cubo' | 'cilindro' | 'emanação';
    radius?: number;
    length?: number;
    width?: number;
  };
  
  skillModifier?: {
    skills: string[];
    bonus: number;
    isContextual?: boolean;
    context?: string;
  };
  
  damageReduction?: {
    types: AnyDamageType[];
    amount: number;
  };
  
  senseEffect?: {
    type: 'detect' | 'locate' | 'scry' | 'commune';
    range?: number;
    targets?: string[];
    information?: string;
  };
  
  mentalControl?: {
    type: 'charm' | 'dominate' | 'suggestion' | 'fear';
    canForceHarm?: boolean;
    canForceSuicide?: boolean;
    breakConditions?: string[];
  };
  
  special?: string;
}

// ========================================
// ESTRUTURA DE NÍVEIS DO RITUAL
// ========================================

export interface RitualEffectsByLevel {
  base: RitualEffect;
  discente?: RitualEffect;
  verdadeiro?: RitualEffect;
}

// ========================================
// MAPEAMENTO DE EFEITOS POR RITUAL
// ========================================

export const RITUAL_EFFECTS: Record<string, RitualEffectsByLevel> = {
  // ========================================
  // SANGUE - 1º Círculo
  // ========================================
  
  'arma-atroz': {
    base: {
      kind: 'buff',
      weaponEffect: {
        damageType: 'sangue',
        extraDice: { count: 1, type: 6 },
        special: '+1d6 dano de Sangue',
      },
      special: 'Arma corpo a corpo causa +1d6 de dano de Sangue.',
    },
    discente: {
      weaponEffect: {
        damageType: 'sangue',
        extraDice: { count: 2, type: 6 },
      },
      special: '+2d6 de dano de Sangue.',
    },
    verdadeiro: {
      weaponEffect: {
        damageType: 'sangue',
        extraDice: { count: 3, type: 6 },
        special: '+3d6 dano de Sangue, crítico 19-20',
      },
      special: '+3d6 de dano de Sangue e margem de ameaça +1.',
    },
  },

  'batismo-de-sangue': {
    base: {
      kind: 'buff',
      tempHP: { diceCount: 2, diceType: 8, bonus: 0 },
      special: 'Recebe 2d8 PV temporários.',
    },
    discente: {
      tempHP: { diceCount: 4, diceType: 8, bonus: 0 },
      special: '4d8 PV temporários.',
    },
    verdadeiro: {
      tempHP: { diceCount: 6, diceType: 8, bonus: 0 },
      attackModifier: 2,
      damageModifier: 2,
      special: '6d8 PV temporários e +2 em ataques e dano.',
    },
  },

  'hemofilia': {
    base: {
      kind: 'debuff',
      appliesConditions: [{ id: 'sangrando', duration: 0 }],
      resistance: { type: 'fortitude', effect: 'anula' },
      special: 'Alvo sangrando não pode curar naturalmente.',
    },
    discente: {
      special: 'Dano de sangramento dobrado.',
    },
    verdadeiro: {
      special: 'Dano triplo. Cura mágica pela metade.',
    },
  },

  'limiar-vital': {
    base: {
      kind: 'sense',
      senseEffect: {
        type: 'detect',
        range: 18,
        targets: ['criaturas vivas'],
        information: 'PV atual e máximo',
      },
      special: 'Detecta PV de criaturas em 18m.',
    },
    discente: {
      senseEffect: {
        type: 'detect',
        range: 36,
        targets: ['criaturas vivas', 'mortos-vivos'],
        information: 'PV, condições, venenos',
      },
      special: 'Alcance 36m. Detecta condições e venenos.',
    },
    verdadeiro: {
      senseEffect: {
        type: 'detect',
        range: 54,
        targets: ['criaturas vivas', 'mortos-vivos'],
        information: 'PV, condições, resistências, vulnerabilidades',
      },
      special: 'Alcance 54m. Detecta resistências e vulnerabilidades.',
    },
  },

  'sangue-derramado': {
    base: {
      kind: 'damage',
      damage: { diceCount: 2, diceType: 6, damageType: 'sangue' },
      resistance: { type: 'fortitude', effect: 'reduz_metade' },
      special: 'Explode sangue causando 2d6.',
    },
    discente: {
      damage: { diceCount: 4, diceType: 6, damageType: 'sangue' },
      special: '4d6 de dano.',
    },
    verdadeiro: {
      damage: { diceCount: 6, diceType: 6, damageType: 'sangue' },
      appliesConditions: [{ id: 'sangrando', duration: 0 }],
      special: '6d6 e alvos ficam sangrando.',
    },
  },

  'sangue-fervente': {
    base: {
      kind: 'damage',
      damage: { diceCount: 2, diceType: 8, damageType: 'sangue' },
      damagePerTurn: { diceCount: 1, diceType: 8, damageType: 'sangue' },
      resistance: { type: 'fortitude', effect: 'reduz_metade' },
      sustain: {
        concentration: true,
        endTriggers: ['concentração quebrada', 'alvo morre'],
      },
      special: '2d8 inicial + 1d8/rodada.',
    },
    discente: {
      damage: { diceCount: 4, diceType: 8, damageType: 'sangue' },
      damagePerTurn: { diceCount: 2, diceType: 8, damageType: 'sangue' },
      special: '4d8 + 2d8/rodada.',
    },
    verdadeiro: {
      damage: { diceCount: 6, diceType: 8, damageType: 'sangue' },
      damagePerTurn: { diceCount: 3, diceType: 8, damageType: 'sangue' },
      appliesConditions: [{ id: 'vulneravel', duration: 0 }],
      special: '6d8 + 3d8/rodada. Alvo fica vulnerável.',
    },
  },

  'transfusao': {
    base: {
      kind: 'healing',
      healing: { diceCount: 2, diceType: 6, bonus: 0 },
      special: 'Transfere PV. Cura 2d6.',
    },
    discente: {
      healing: { diceCount: 4, diceType: 6, bonus: 0 },
      special: 'Cura 4d6.',
    },
    verdadeiro: {
      healing: { diceCount: 6, diceType: 6, bonus: 0 },
      special: 'Cura 6d6 e remove uma condição.',
    },
  },

  // ========================================
  // SANGUE - 2º Círculo
  // ========================================

  'amputar': {
    base: {
      kind: 'damage',
      damage: { diceCount: 4, diceType: 8, damageType: 'sangue' },
      appliesConditions: [{ id: 'sangrando', duration: 0 }],
      resistance: { type: 'fortitude', effect: 'parcial' },
      special: '4d8 + amputação. Fortitude parcial evita amputação.',
    },
    discente: {
      damage: { diceCount: 6, diceType: 8, damageType: 'sangue' },
      special: '6d8. Amputação causa penalidade permanente.',
    },
    verdadeiro: {
      damage: { diceCount: 8, diceType: 8, damageType: 'sangue' },
      special: '8d8. Pode escolher qual membro amputar.',
    },
  },

  'armadura-de-sangue': {
    base: {
      kind: 'buff',
      defenseModifier: 4,
      damageReduction: { types: ['corte', 'perfuração', 'impacto'], amount: 5 },
      special: '+4 Defesa, RD 5 física.',
    },
    discente: {
      defenseModifier: 6,
      damageReduction: { types: ['corte', 'perfuração', 'impacto'], amount: 10 },
      special: '+6 Defesa, RD 10 física.',
    },
    verdadeiro: {
      defenseModifier: 8,
      damageReduction: { types: ['corte', 'perfuração', 'impacto', 'balístico'], amount: 15 },
      tempHP: { diceCount: 0, diceType: 0, bonus: 20 },
      special: '+8 Defesa, RD 15 física/balística, +20 PV temp.',
    },
  },

  'chicote-sanguineo': {
    base: {
      kind: 'damage',
      damage: { diceCount: 2, diceType: 10, damageType: 'sangue' },
      special: 'Chicote de sangue. 2d10, alcance 6m.',
    },
    discente: {
      damage: { diceCount: 4, diceType: 10, damageType: 'sangue' },
      special: '4d10. Pode puxar alvos Médios ou menores.',
    },
    verdadeiro: {
      damage: { diceCount: 6, diceType: 10, damageType: 'sangue' },
      special: '6d10. Puxar alvos Grandes. Atravessa RD.',
    },
  },

  'coagular': {
    base: {
      kind: 'healing',
      special: 'Remove sangramento de até 3 alvos.',
    },
    discente: {
      healing: { diceCount: 2, diceType: 8, bonus: 0 },
      special: 'Remove sangramento + cura 2d8.',
    },
    verdadeiro: {
      healing: { diceCount: 4, diceType: 8, bonus: 0 },
      special: 'Remove sangramento + cura 4d8. Até 6 alvos.',
    },
  },

  'corpo-aberrante': {
    base: {
      kind: 'transformation',
      tempHP: { diceCount: 0, diceType: 0, bonus: 10 },
      attackModifier: 2,
      damageModifier: 2,
      special: 'Corpo grotesco. +10 PV temp, +2 ataque/dano.',
    },
    discente: {
      tempHP: { diceCount: 0, diceType: 0, bonus: 20 },
      attackModifier: 4,
      damageModifier: 4,
      special: '+20 PV temp, +4 ataque/dano.',
    },
    verdadeiro: {
      tempHP: { diceCount: 0, diceType: 0, bonus: 30 },
      attackModifier: 6,
      damageModifier: 6,
      damageReduction: { types: ['corte', 'perfuração', 'impacto'], amount: 5 },
      special: '+30 PV temp, +6 ataque/dano, RD 5 física.',
    },
  },

  'heranca-vermelha': {
    base: {
      kind: 'buff',
      special: 'Ao derrotar inimigo, absorve força vital.',
    },
    discente: {
      special: 'Bônus maior ao absorver.',
    },
    verdadeiro: {
      special: 'Absorção máxima. Pode acumular.',
    },
  },

  'odio-incontrolavel': {
    base: {
      kind: 'buff',
      attackModifier: 2,
      damageModifier: 2,
      damageReduction: { types: ['corte', 'perfuração', 'impacto', 'balístico'], amount: 5 },
      actionRestrictions: ['mustAttack'],
      sustain: {
        concentration: false,
        endTriggers: ['não há inimigos visíveis', 'cai inconsciente'],
      },
      special: '+2 ataque/dano, RD 5. DEVE atacar o mais próximo.',
    },
    discente: {
      attackModifier: 4,
      damageModifier: 4,
      damageReduction: { types: ['corte', 'perfuração', 'impacto', 'balístico'], amount: 10 },
      actionRestrictions: ['mustAttack'],
      special: '+4 ataque/dano, RD 10.',
    },
    verdadeiro: {
      attackModifier: 6,
      damageModifier: 6,
      damageReduction: { types: ['corte', 'perfuração', 'impacto', 'balístico'], amount: 15 },
      tempHP: { diceCount: 0, diceType: 0, bonus: 20 },
      actionRestrictions: ['mustAttack'],
      special: '+6 ataque/dano, RD 15, +20 PV temp.',
    },
  },

  'possessao-sanguinea': {
    base: {
      kind: 'control',
      mentalControl: {
        type: 'dominate',
        canForceHarm: false,
        canForceSuicide: false,
        breakConditions: ['sofre dano', 'ordem contra natureza'],
      },
      resistance: { type: 'vontade', effect: 'anula' },
      sustain: {
        concentration: true,
        maxDuration: 10,
      },
      special: 'Controla criatura de Sangue. Vontade anula.',
    },
    discente: {
      special: 'Alcance 9m. Duração maior.',
    },
    verdadeiro: {
      special: 'Alcance 18m. Controle completo.',
    },
  },

  // ========================================
  // SANGUE - 3º Círculo
  // ========================================

  'caminhos-de-sangue': {
    base: {
      kind: 'utility',
      modes: [
        {
          name: 'Teleporte',
          kind: 'utility',
          description: 'Teleporta através de sangue',
          effect: { special: 'Teleporta até 30m.' },
        },
      ],
      special: 'Teleporta através de sangue. Alcance 30m.',
    },
    discente: {
      modes: [
        {
          name: 'Teleporte Ampliado',
          kind: 'utility',
          description: 'Teleporte maior',
          effect: { special: 'Teleporta até 90m.' },
        },
        {
          name: 'Área de Sangramento',
          kind: 'damage',
          description: 'Área que sangra',
          effect: {
            areaEffect: { shape: 'esfera', radius: 6 },
            appliesConditions: [{ id: 'sangrando', duration: 0 }],
          },
        },
      ],
      special: 'Teleporte 90m OU criar área de sangramento 6m.',
    },
    verdadeiro: {
      modes: [
        {
          name: 'Portal de Sangue',
          kind: 'utility',
          description: 'Portal permanente',
          effect: { special: 'Portal permanente.' },
        },
        {
          name: 'Esfera de Destruição',
          kind: 'damage',
          description: 'Dano massivo',
          effect: {
            damage: { diceCount: 10, diceType: 10, damageType: 'sangue' },
            areaEffect: { shape: 'esfera', radius: 9 },
          },
        },
      ],
      special: 'Portal permanente OU esfera 10d10 em 9m.',
    },
  },

  'crisalida-rubra': {
    base: {
      kind: 'healing',
      special: 'Casulo de sangue. Descanso em 1 hora.',
    },
    discente: {
      special: 'Também regenera membros.',
    },
    verdadeiro: {
      special: 'Pode envolver outros. Remove condições permanentes.',
    },
  },

  'escudo-sanguineo': {
    base: {
      kind: 'interceptor',
      hooks: [
        {
          trigger: 'onPreDamage',
          effect: 'Absorve dano no escudo',
          condition: 'escudo ativo',
        },
      ],
      tempHP: { diceCount: 0, diceType: 0, bonus: 30 },
      special: 'Escudo com 30 PV. Absorve dano.',
    },
    discente: {
      tempHP: { diceCount: 0, diceType: 0, bonus: 50 },
      special: 'Escudo com 50 PV.',
    },
    verdadeiro: {
      tempHP: { diceCount: 0, diceType: 0, bonus: 70 },
      special: 'Escudo 70 PV. Reflete 50% ao atacante.',
    },
  },

  'elo-sanguineo': {
    base: {
      kind: 'utility',
      special: 'Liga até 5 criaturas. Telepatia.',
    },
    discente: {
      special: 'Podem transferir PV entre si.',
    },
    verdadeiro: {
      special: 'Podem emprestar habilidades.',
    },
  },

  'aura-rubra': {
    base: {
      kind: 'damage',
      damagePerTurn: { diceCount: 2, diceType: 6, damageType: 'sangue' },
      areaEffect: { shape: 'emanação', radius: 3 },
      sustain: {
        concentration: false,
        costPerTurn: 1,
        endTriggers: ['PE zerado', 'escolhe encerrar'],
      },
      special: 'Aura 3m. 2d6/turno. Custa 1 PE/turno.',
    },
    discente: {
      damagePerTurn: { diceCount: 4, diceType: 6, damageType: 'sangue' },
      areaEffect: { shape: 'emanação', radius: 6 },
      special: 'Aura 6m. 4d6/turno.',
    },
    verdadeiro: {
      damagePerTurn: { diceCount: 6, diceType: 6, damageType: 'sangue' },
      areaEffect: { shape: 'emanação', radius: 9 },
      healing: { diceCount: 2, diceType: 6, bonus: 0 },
      special: 'Aura 9m. 6d6/turno. Cura 2d6/turno.',
    },
  },

  // ========================================
  // SANGUE - 4º Círculo
  // ========================================

  'involucro-de-carne': {
    base: {
      kind: 'summon',
      sustain: {
        action: 'move',
        endTriggers: ['invólucro destruído', 'conjurador morre'],
      },
      special: 'Cria construto de carne. Ordem (movimento) ou transe (controle total).',
    },
    discente: {
      special: 'Invólucro maior. Ordens complexas.',
    },
    verdadeiro: {
      special: 'Invólucro colossal. Múltiplos invólucros.',
    },
  },

  'martirio-de-sangue': {
    base: {
      kind: 'narrativeOverride',
      tempHP: { diceCount: 0, diceType: 0, bonus: 100 },
      attackModifier: 10,
      damageModifier: 10,
      damageReduction: { types: ['corte', 'perfuração', 'impacto', 'balístico', 'fogo', 'frio', 'eletricidade', 'ácido'], amount: 20 },
      actionRestrictions: ['mustAttack'],
      special: 'IRREVERSÍVEL. +100 PV, +10 ataque/dano, RD 20. Ao fim, MORRE permanentemente.',
    },
  },

  'vinculo-de-sangue': {
    base: {
      kind: 'interceptor',
      hooks: [
        {
          trigger: 'onPostDamage',
          effect: 'Divide dano entre vinculados',
        },
        {
          trigger: 'onDeath',
          effect: 'Pode transferir morte para outro vinculado',
        },
      ],
      sustain: {
        concentration: true,
        endTriggers: ['concentração quebrada', 'uma criatura morre', 'distância > 30m'],
      },
      special: 'Liga duas criaturas. Dano dividido. Bidirecional.',
    },
    discente: {
      special: 'Até 3 criaturas. Alcance 60m.',
    },
    verdadeiro: {
      special: 'Até 5 criaturas. Escolhe qual morre.',
    },
  },

  // ========================================
  // MORTE - 1º Círculo
  // ========================================

  'decadencia': {
    base: {
      kind: 'debuff',
      appliesConditions: [{ id: 'debilitado', duration: 0 }],
      resistance: { type: 'fortitude', effect: 'anula' },
      special: 'Envelhece alvo. Debilitado.',
    },
    discente: {
      appliesConditions: [{ id: 'debilitado', duration: 0 }, { id: 'lento', duration: 0 }],
      special: 'Debilitado e lento.',
    },
    verdadeiro: {
      appliesConditions: [{ id: 'debilitado', duration: 0 }, { id: 'lento', duration: 0 }, { id: 'exausto', duration: 0 }],
      special: 'Debilitado, lento e exausto.',
    },
  },

  'toque-da-morte': {
    base: {
      kind: 'damage',
      damage: { diceCount: 2, diceType: 8, damageType: 'morte' },
      special: '2d8 Morte. Ignora armadura.',
    },
    discente: {
      damage: { diceCount: 4, diceType: 8, damageType: 'morte' },
      special: '4d8 Morte.',
    },
    verdadeiro: {
      damage: { diceCount: 6, diceType: 8, damageType: 'morte' },
      appliesConditions: [{ id: 'debilitado', duration: 2 }],
      special: '6d8 Morte + debilitado 2 rodadas.',
    },
  },

  'espiritos-famintos': {
    base: {
      kind: 'damage',
      damage: { diceCount: 2, diceType: 6, damageType: 'morte' },
      areaEffect: { shape: 'esfera', radius: 6 },
      resistance: { type: 'vontade', effect: 'reduz_metade' },
      special: 'Espíritos em 6m. 2d6 Morte.',
    },
    discente: {
      damage: { diceCount: 4, diceType: 6, damageType: 'morte' },
      areaEffect: { shape: 'esfera', radius: 9 },
      special: '4d6 em 9m.',
    },
    verdadeiro: {
      damage: { diceCount: 6, diceType: 6, damageType: 'morte' },
      areaEffect: { shape: 'esfera', radius: 12 },
      healing: { diceCount: 2, diceType: 6, bonus: 0 },
      special: '6d6 em 12m. Cura 2d6 por alvo.',
    },
  },

  'raio-necrotico': {
    base: {
      kind: 'damage',
      damage: { diceCount: 3, diceType: 8, damageType: 'morte' },
      resistance: { type: 'fortitude', effect: 'reduz_metade' },
      special: '3d8 Morte.',
    },
    discente: {
      damage: { diceCount: 5, diceType: 8, damageType: 'morte' },
      special: '5d8 Morte.',
    },
    verdadeiro: {
      damage: { diceCount: 7, diceType: 8, damageType: 'morte' },
      special: '7d8 Morte. Se matar, vira morto-vivo aliado.',
    },
  },

  'amortalha': {
    base: {
      kind: 'buff',
      defenseModifier: 2,
      special: '+2 Defesa, camuflagem leve.',
    },
    discente: {
      defenseModifier: 4,
      special: '+4 Defesa, camuflagem.',
    },
    verdadeiro: {
      defenseModifier: 6,
      special: '+6 Defesa, camuflagem total.',
    },
  },

  'sentir-a-morte': {
    base: {
      kind: 'sense',
      senseEffect: {
        type: 'detect',
        range: 30,
        targets: ['mortos-vivos', 'cadáveres'],
        information: 'localização e tipo',
      },
      special: 'Detecta mortos-vivos em 30m.',
    },
    discente: {
      senseEffect: {
        type: 'detect',
        range: 60,
        targets: ['mortos-vivos', 'cadáveres', 'moribundos'],
        information: 'localização, tipo e força',
      },
      special: 'Alcance 60m. Detecta moribundos.',
    },
    verdadeiro: {
      senseEffect: {
        type: 'detect',
        range: 120,
        targets: ['mortos-vivos', 'cadáveres', 'fantasmas'],
        information: 'localização, tipo, causa da morte',
      },
      special: 'Alcance 120m. Vê causa da morte.',
    },
  },

  'medo-mortal': {
    base: {
      kind: 'debuff',
      appliesConditions: [{ id: 'amedrontado', duration: 0 }],
      resistance: { type: 'vontade', effect: 'anula' },
      special: 'Alvo amedrontado.',
    },
    discente: {
      appliesConditions: [{ id: 'amedrontado', duration: 0 }, { id: 'apavorado', duration: 0 }],
      special: 'Amedrontado. Falha 5+ = apavorado.',
    },
    verdadeiro: {
      appliesConditions: [{ id: 'apavorado', duration: 0 }],
      areaEffect: { shape: 'cone', length: 9, width: 9 },
      special: 'Cone 9m. Todos apavorados.',
    },
  },

  // ========================================
  // MORTE - 2º Círculo
  // ========================================

  'desidratar': {
    base: {
      kind: 'damage',
      damage: { diceCount: 4, diceType: 8, damageType: 'morte' },
      appliesConditions: [{ id: 'fatigado', duration: 0 }],
      resistance: { type: 'fortitude', effect: 'parcial' },
      special: '4d8 Morte + fatigado.',
    },
    discente: {
      damage: { diceCount: 6, diceType: 8, damageType: 'morte' },
      appliesConditions: [{ id: 'exausto', duration: 0 }],
      special: '6d8 Morte + exausto.',
    },
    verdadeiro: {
      damage: { diceCount: 8, diceType: 8, damageType: 'morte' },
      special: '8d8 Morte. Se matar, corpo resseca.',
    },
  },

  'praga-necrotica': {
    base: {
      kind: 'damage',
      damagePerTurn: { diceCount: 2, diceType: 6, damageType: 'morte' },
      resistance: { type: 'fortitude', effect: 'anula' },
      sustain: {
        maxDuration: 10,
        endTriggers: ['alvo passa em Fortitude'],
      },
      special: 'Doença. 2d6/turno. Pode espalhar.',
    },
    discente: {
      damagePerTurn: { diceCount: 4, diceType: 6, damageType: 'morte' },
      special: '4d6/turno. Espalha automaticamente.',
    },
    verdadeiro: {
      damagePerTurn: { diceCount: 6, diceType: 6, damageType: 'morte' },
      special: '6d6/turno. Corpo explode ao morrer.',
    },
  },

  'animar-mortos': {
    base: {
      kind: 'summon',
      sustain: {
        endTriggers: ['sol nasce', 'conjurador morre', 'morto-vivo destruído'],
      },
      special: 'Anima 1 esqueleto ou zumbi.',
    },
    discente: {
      special: 'Até 3 mortos-vivos.',
    },
    verdadeiro: {
      special: 'Até 6 mortos-vivos mais poderosos.',
    },
  },

  'descanso-eterno': {
    base: {
      kind: 'healing',
      special: 'Impede animação. Descanso do espírito.',
    },
    discente: {
      special: 'Expulsa espíritos do corpo.',
    },
    verdadeiro: {
      damage: { diceCount: 10, diceType: 10, damageType: 'energia' },
      special: 'Destrói mortos-vivos menores. Maiores: 10d10.',
    },
  },

  'desacelerar-impacto': {
    base: {
      kind: 'interceptor',
      hooks: [
        {
          trigger: 'onFallDamage',
          effect: 'Reduz dano de queda para 0',
        },
        {
          trigger: 'onProjectileHit',
          effect: 'Reduz dano de projéteis pela metade',
        },
      ],
      damageReduction: { types: ['impacto', 'balístico'], amount: 20 },
      special: 'Imunidade queda. RD 20 balístico/impacto.',
    },
    discente: {
      damageReduction: { types: ['impacto', 'balístico'], amount: 40 },
      special: 'RD 40. Afeta aliados em 3m.',
    },
    verdadeiro: {
      damageReduction: { types: ['impacto', 'balístico'], amount: 1000 },
      special: 'Imunidade total. Afeta aliados em 6m.',
    },
  },

  'nuvem-mortifera': {
    base: {
      kind: 'damage',
      damagePerTurn: { diceCount: 2, diceType: 8, damageType: 'morte' },
      areaEffect: { shape: 'esfera', radius: 6 },
      resistance: { type: 'fortitude', effect: 'reduz_metade' },
      sustain: {
        concentration: true,
        maxDuration: 10,
        endTriggers: ['concentração quebrada', 'vento forte'],
      },
      special: 'Nuvem 6m. 2d8/turno.',
    },
    discente: {
      damagePerTurn: { diceCount: 4, diceType: 8, damageType: 'morte' },
      areaEffect: { shape: 'esfera', radius: 9 },
      special: 'Nuvem 9m. 4d8/turno.',
    },
    verdadeiro: {
      damagePerTurn: { diceCount: 6, diceType: 8, damageType: 'morte' },
      areaEffect: { shape: 'esfera', radius: 12 },
      appliesConditions: [{ id: 'envenenado', duration: 0 }],
      special: 'Nuvem 12m. 6d8/turno + envenenado.',
    },
  },

  // ========================================
  // MORTE - 3º Círculo
  // ========================================

  'paradoxo': {
    base: {
      kind: 'damage',
      damage: { diceCount: 6, diceType: 6, damageType: 'morte' },
      resistance: { type: 'vontade', effect: 'reduz_metade' },
      special: 'Ataque temporal. 6d6 Morte.',
    },
    discente: {
      modes: [
        {
          name: 'Esfera Persistente',
          kind: 'damage',
          description: 'Esfera de dano por rodada',
          effect: {
            damagePerTurn: { diceCount: 4, diceType: 6, damageType: 'morte' },
            areaEffect: { shape: 'esfera', radius: 3 },
            sustain: { concentration: true },
          },
        },
      ],
      special: 'MODO ALTERNATIVO: Esfera 4d6/rodada.',
    },
    verdadeiro: {
      damage: { diceCount: 13, diceType: 6, damageType: 'morte' },
      special: '13d6 Morte. Se matar, apaga da linha do tempo.',
    },
  },

  'eco-espiral': {
    base: {
      kind: 'damage',
      damage: { diceCount: 6, diceType: 8, damageType: 'morte' },
      resistance: { type: 'vontade', effect: 'parcial' },
      special: 'Concentra eco de dano. 6d8 se alvo já levou dano.',
    },
    discente: {
      modes: [
        {
          name: 'Eco em Cadeia',
          kind: 'damage',
          description: 'Afeta múltiplos',
          effect: {
            damage: { diceCount: 4, diceType: 8, damageType: 'morte' },
            areaEffect: { shape: 'esfera', radius: 6 },
          },
        },
      ],
      special: 'MODO ALTERNATIVO: 4d8 em área 6m.',
    },
    verdadeiro: {
      damage: { diceCount: 10, diceType: 8, damageType: 'morte' },
      special: '10d8. Se matar, explode em eco.',
    },
  },

  'purgatorio': {
    base: {
      kind: 'stateOverride',
      sustain: {
        concentration: true,
        endTriggers: ['concentração quebrada', 'alvo escapa'],
      },
      resistance: { type: 'vontade', effect: 'anula' },
      special: 'Loop temporal. Revive 6 segundos infinitamente.',
    },
    discente: {
      special: 'Loop 1 minuto. Trauma psicológico.',
    },
    verdadeiro: {
      special: 'Loop permanente. Múltiplos alvos.',
    },
  },

  'olhos-do-relogio': {
    base: {
      kind: 'sense',
      senseEffect: {
        type: 'scry',
        targets: ['passado'],
        information: 'últimas 24 horas',
      },
      special: 'Vê passado de um local. 24 horas.',
    },
    discente: {
      senseEffect: {
        type: 'scry',
        targets: ['passado', 'futuro'],
        information: 'até 1 semana',
      },
      special: 'Até 1 semana. Vê futuro provável.',
    },
    verdadeiro: {
      senseEffect: {
        type: 'scry',
        targets: ['passado', 'futuro', 'linhas alternativas'],
        information: 'qualquer momento',
      },
      special: 'Qualquer momento. Linhas alternativas.',
    },
  },

  // ========================================
  // MORTE - 4º Círculo
  // ========================================

  'convocar-o-algoz': {
    base: {
      kind: 'summon',
      resistance: { type: 'vontade', effect: 'parcial' },
      special: 'Invoca entidade da Morte. Testes Vontade/Fortitude.',
    },
    discente: {
      special: 'Algoz mais poderoso. DT maior.',
    },
    verdadeiro: {
      special: 'Algoz supremo. Múltiplos alvos.',
    },
  },

  'distorcao-temporal': {
    base: {
      kind: 'stateOverride',
      areaEffect: { shape: 'esfera', radius: 9 },
      sustain: {
        concentration: true,
        endTriggers: ['concentração quebrada'],
      },
      special: 'Bolha de tempo alterado. Sem interação externa.',
    },
    discente: {
      areaEffect: { shape: 'esfera', radius: 18 },
      special: 'Bolha 18m. Zonas diferentes de tempo.',
    },
    verdadeiro: {
      areaEffect: { shape: 'esfera', radius: 30 },
      special: 'Bolha 30m. Pode parar tempo.',
    },
  },

  'fim-inevitavel': {
    base: {
      kind: 'stateOverride',
      damage: { 
        diceCount: 0, 
        diceType: 0, 
        bonus: 100, 
        damageType: 'morte',
        isAbsolute: true,
      },
      resistance: { type: 'fortitude', effect: 'parcial' },
      special: 'DANO ABSOLUTO: 100 Morte. Ignora TODA mitigação. Fortitude = 50.',
    },
    discente: {
      special: 'Se matar, não pode ressuscitar normalmente.',
    },
    verdadeiro: {
      special: 'Se matar, aniquilação total.',
    },
  },

  'singularidade-temporal': {
    base: {
      kind: 'stateOverride',
      areaEffect: { shape: 'esfera', radius: 3 },
      special: 'Colapso temporal. APENAS OBJETOS. Destrói objetos.',
    },
    discente: {
      areaEffect: { shape: 'esfera', radius: 6 },
      special: 'Área 6m. Afeta estruturas.',
    },
    verdadeiro: {
      areaEffect: { shape: 'esfera', radius: 12 },
      special: 'Área 12m. Colapsa prédios.',
    },
  },

  // ========================================
  // ENERGIA - 1º Círculo
  // ========================================

  'adrenalina': {
    base: {
      kind: 'buff',
      attackModifier: 2,
      special: '+2 em ataques.',
    },
    discente: {
      attackModifier: 4,
      special: '+4 em ataques.',
    },
    verdadeiro: {
      attackModifier: 6,
      defenseModifier: 2,
      special: '+6 ataques, +2 Defesa.',
    },
  },

  'arma-relampejante': {
    base: {
      kind: 'buff',
      weaponEffect: {
        damageType: 'eletricidade',
        extraDice: { count: 1, type: 6 },
      },
      special: '+1d6 eletricidade.',
    },
    discente: {
      weaponEffect: {
        damageType: 'eletricidade',
        extraDice: { count: 2, type: 6 },
      },
      special: '+2d6 eletricidade.',
    },
    verdadeiro: {
      weaponEffect: {
        damageType: 'eletricidade',
        extraDice: { count: 3, type: 6 },
      },
      appliesConditions: [{ id: 'paralisado', duration: 1 }],
      special: '+3d6 eletricidade. Crítico paralisa.',
    },
  },

  'choque': {
    base: {
      kind: 'damage',
      damage: { diceCount: 2, diceType: 6, damageType: 'eletricidade' },
      resistance: { type: 'reflexos', effect: 'reduz_metade' },
      special: '2d6 eletricidade.',
    },
    discente: {
      damage: { diceCount: 4, diceType: 6, damageType: 'eletricidade' },
      special: '4d6 eletricidade.',
    },
    verdadeiro: {
      damage: { diceCount: 6, diceType: 6, damageType: 'eletricidade' },
      areaEffect: { shape: 'linha', length: 9 },
      special: '6d6 em linha 9m. Salta para adjacentes.',
    },
  },

  'energia-espectral': {
    base: {
      kind: 'damage',
      damage: { diceCount: 2, diceType: 8, damageType: 'energia' },
      special: '2d8 Energia.',
    },
    discente: {
      damage: { diceCount: 4, diceType: 8, damageType: 'energia' },
      special: '4d8 Energia.',
    },
    verdadeiro: {
      damage: { diceCount: 6, diceType: 8, damageType: 'energia' },
      special: '6d8 Energia. Atravessa cobertura.',
    },
  },

  'tela-de-ruido': {
    base: {
      kind: 'interceptor',
      hooks: [
        {
          trigger: 'onPreDamage',
          effect: 'Converte dano elemental em energia reduzido',
          condition: 'dano de fogo, frio, eletricidade ou ácido',
        },
      ],
      damageReduction: { types: ['fogo', 'frio', 'eletricidade', 'ácido'], amount: 10 },
      special: 'RD 10 elemental. Reação para converter.',
    },
    discente: {
      damageReduction: { types: ['fogo', 'frio', 'eletricidade', 'ácido', 'energia'], amount: 20 },
      special: 'RD 20 elemental/energia.',
    },
    verdadeiro: {
      damageReduction: { types: ['fogo', 'frio', 'eletricidade', 'ácido', 'energia'], amount: 1000 },
      special: 'Imunidade elemental. Absorve para curar.',
    },
  },

  'detectar-ameacas': {
    base: {
      kind: 'sense',
      senseEffect: {
        type: 'detect',
        range: 18,
        targets: ['ameaças', 'hostilidade'],
        information: 'presença e direção',
      },
      special: 'Detecta hostilidade em 18m.',
    },
    discente: {
      senseEffect: {
        type: 'detect',
        range: 36,
        targets: ['ameaças', 'emboscadas', 'armadilhas'],
        information: 'presença, direção, nível de perigo',
      },
      special: 'Alcance 36m. Detecta emboscadas.',
    },
    verdadeiro: {
      senseEffect: {
        type: 'detect',
        range: 60,
        targets: ['ameaças', 'emboscadas', 'ataques futuros'],
        information: 'completo, tipo de ataque',
      },
      defenseModifier: 2,
      special: 'Alcance 60m. +2 Defesa. Prevê ataques.',
    },
  },

  'embaralhar': {
    base: {
      kind: 'buff',
      defenseModifier: 6,
      sustain: {
        concentration: false,
        endTriggers: ['todas cópias destruídas'],
      },
      special: 'Cria 3 cópias ilusórias. +6 na Defesa. Se um ataque errar, uma cópia some e o bônus diminui em 2.',
    },
    discente: {
      defenseModifier: 10,
      special: '5 cópias ilusórias. +10 na Defesa.',
    },
    verdadeiro: {
      defenseModifier: 16,
      appliesConditions: [{ id: 'ofuscado', duration: 1 }],
      special: '8 cópias. +16 na Defesa. Atacante fica ofuscado ao destruir cópia.',
    },
  },

  'velocidade': {
    base: {
      kind: 'buff',
      special: '+6m deslocamento. Movimento extra.',
    },
    discente: {
      defenseModifier: 2,
      special: '+9m, +2 Defesa. Dois movimentos extras.',
    },
    verdadeiro: {
      defenseModifier: 4,
      attackModifier: 2,
      special: '+12m, +4 Defesa, +2 ataques. Age duas vezes.',
    },
  },

  // ========================================
  // ENERGIA - 2º Círculo
  // ========================================

  'bola-de-fogo': {
    base: {
      kind: 'damage',
      damage: { diceCount: 6, diceType: 6, damageType: 'fogo' },
      areaEffect: { shape: 'esfera', radius: 6 },
      resistance: { type: 'reflexos', effect: 'reduz_metade' },
      special: '6d6 fogo em 6m.',
    },
    discente: {
      damage: { diceCount: 10, diceType: 6, damageType: 'fogo' },
      areaEffect: { shape: 'esfera', radius: 9 },
      special: '10d6 em 9m.',
    },
    verdadeiro: {
      damage: { diceCount: 14, diceType: 6, damageType: 'fogo' },
      areaEffect: { shape: 'esfera', radius: 12 },
      appliesConditions: [{ id: 'pegando_fogo', duration: 0 }],
      special: '14d6 em 12m. Alvos pegam fogo.',
    },
  },

  'relampago': {
    base: {
      kind: 'damage',
      damage: { diceCount: 6, diceType: 6, damageType: 'eletricidade' },
      areaEffect: { shape: 'linha', length: 30 },
      resistance: { type: 'reflexos', effect: 'reduz_metade' },
      special: '6d6 eletricidade em linha 30m.',
    },
    discente: {
      damage: { diceCount: 10, diceType: 6, damageType: 'eletricidade' },
      special: '10d6 eletricidade.',
    },
    verdadeiro: {
      damage: { diceCount: 14, diceType: 6, damageType: 'eletricidade' },
      appliesConditions: [{ id: 'atordoado', duration: 1 }],
      special: '14d6 eletricidade. Atordoa 1 rodada.',
    },
  },

  'luz-cegante': {
    base: {
      kind: 'debuff',
      appliesConditions: [{ id: 'cego', duration: 1 }],
      areaEffect: { shape: 'cone', length: 6, width: 6 },
      resistance: { type: 'reflexos', effect: 'anula' },
      special: 'Flash. Cone 6m. Cega 1 rodada.',
    },
    discente: {
      appliesConditions: [{ id: 'cego', duration: 3 }],
      areaEffect: { shape: 'cone', length: 9, width: 9 },
      special: 'Cone 9m. Cega 3 rodadas.',
    },
    verdadeiro: {
      appliesConditions: [{ id: 'cego', duration: 0, isPermanent: true }],
      areaEffect: { shape: 'esfera', radius: 12 },
      resistance: { type: 'fortitude', effect: 'parcial' },
      special: 'Esfera 12m. Cegueira permanente.',
    },
  },

  'voo': {
    base: {
      kind: 'buff',
      special: 'Voo igual ao deslocamento.',
    },
    discente: {
      special: 'Voo x1,5. Pode pairar.',
    },
    verdadeiro: {
      special: 'Voo x2. Pode carregar outros.',
    },
  },

  'localizacao': {
    base: {
      kind: 'sense',
      senseEffect: {
        type: 'locate',
        range: 1000,
        targets: ['criatura ou objeto'],
        information: 'direção e distância',
      },
      special: 'Localiza algo conhecido. 1km.',
    },
    discente: {
      senseEffect: {
        type: 'locate',
        range: 10000,
        targets: ['criatura ou objeto', 'tipo'],
        information: 'direção, distância, caminho',
      },
      special: 'Alcance 10km. Localiza tipo.',
    },
    verdadeiro: {
      senseEffect: {
        type: 'locate',
        targets: ['qualquer coisa já vista'],
        information: 'localização exata',
      },
      special: 'Alcance ilimitado. Entre planos.',
    },
  },

  'campo-de-forca': {
    base: {
      kind: 'buff',
      tempHP: { diceCount: 0, diceType: 0, bonus: 20 },
      defenseModifier: 2,
      special: '+20 PV temp, +2 Defesa.',
    },
    discente: {
      tempHP: { diceCount: 0, diceType: 0, bonus: 40 },
      defenseModifier: 4,
      special: '+40 PV temp, +4 Defesa.',
    },
    verdadeiro: {
      tempHP: { diceCount: 0, diceType: 0, bonus: 60 },
      defenseModifier: 6,
      damageReduction: { types: ['energia'], amount: 10 },
      special: '+60 PV temp, +6 Defesa, RD 10 energia.',
    },
  },

  // ========================================
  // ENERGIA - 3º Círculo
  // ========================================

  'controlar-eletricidade': {
    base: {
      kind: 'utility',
      special: 'Controla eletricidade. Liga/desliga aparelhos.',
    },
    discente: {
      damage: { diceCount: 6, diceType: 8, damageType: 'eletricidade' },
      special: 'Ataque com eletricidade ambiente. 6d8.',
    },
    verdadeiro: {
      special: 'Controle total. Teleporte por fios.',
    },
  },

  'forma-elemental': {
    base: {
      kind: 'transformation',
      tempHP: { diceCount: 0, diceType: 0, bonus: 20 },
      damageReduction: { types: ['corte', 'perfuração', 'impacto'], amount: 10 },
      special: 'Vira elemental. +20 PV, RD 10 física.',
    },
    discente: {
      tempHP: { diceCount: 0, diceType: 0, bonus: 40 },
      damageReduction: { types: ['corte', 'perfuração', 'impacto', 'balístico'], amount: 20 },
      special: '+40 PV, RD 20. Imunidade ao elemento.',
    },
    verdadeiro: {
      tempHP: { diceCount: 0, diceType: 0, bonus: 60 },
      special: '+60 PV. Muda elemento. Aura de dano.',
    },
  },

  'teleporte': {
    base: {
      kind: 'utility',
      special: 'Teleporta até 30m.',
    },
    discente: {
      special: 'Teleporta até 100m. Leva 1 pessoa.',
    },
    verdadeiro: {
      special: 'Qualquer distância. Leva grupo.',
    },
  },

  'tempestade': {
    base: {
      kind: 'damage',
      damage: { diceCount: 8, diceType: 6, damageType: 'eletricidade' },
      areaEffect: { shape: 'cilindro', radius: 12 },
      resistance: { type: 'reflexos', effect: 'reduz_metade' },
      sustain: {
        concentration: true,
        maxDuration: 10,
      },
      special: 'Tempestade 12m. 8d6/turno.',
    },
    discente: {
      damage: { diceCount: 12, diceType: 6, damageType: 'eletricidade' },
      areaEffect: { shape: 'cilindro', radius: 18 },
      special: '12d6 em 18m. Direciona raios.',
    },
    verdadeiro: {
      damage: { diceCount: 16, diceType: 6, damageType: 'eletricidade' },
      areaEffect: { shape: 'cilindro', radius: 30 },
      special: '16d6 em 30m. Permanente.',
    },
  },

  'zerar-entropia': {
    base: {
      kind: 'debuff',
      appliesConditions: [{ id: 'paralisado', duration: 0 }],
      resistance: { type: 'fortitude', effect: 'anula' },
      special: 'Congela movimento. Paralisado.',
    },
    discente: {
      kind: 'buff',
      modes: [
        {
          name: 'Proteção Aliada',
          kind: 'buff',
          description: 'Protege aliados',
          effect: {
            special: 'Imunidade a empurrão/agarramento/queda.',
          },
        },
      ],
      special: 'MODO ALTERNATIVO: Protege aliados.',
    },
    verdadeiro: {
      kind: 'stateOverride',
      areaEffect: { shape: 'esfera', radius: 6 },
      special: 'Área 6m. Tudo para. Objetos flutuam.',
    },
  },

  // ========================================
  // ENERGIA - 4º Círculo
  // ========================================

  'deflagracao-de-energia': {
    base: {
      kind: 'damage',
      damage: { diceCount: 20, diceType: 10, damageType: 'energia' },
      areaEffect: { shape: 'esfera', radius: 12 },
      resistance: { type: 'reflexos', effect: 'reduz_metade' },
      special: '20d10 Energia em 12m.',
    },
    discente: {
      damage: { diceCount: 30, diceType: 10, damageType: 'energia' },
      special: '30d10.',
    },
    verdadeiro: {
      damage: { diceCount: 40, diceType: 10, damageType: 'energia', ignoresResistance: true },
      special: '40d10, ignora RD.',
    },
  },

  // ========================================
  // CONHECIMENTO - 1º Círculo
  // ========================================

  'aprisionamento': {
    base: {
      kind: 'control',
      appliesConditions: [{ id: 'imobilizado', duration: 0 }],
      resistance: { type: 'vontade', effect: 'anula' },
      sustain: {
        concentration: true,
        endTriggers: ['concentração quebrada', 'alvo passa no teste'],
      },
      special: 'Telecinesia. Imobilizado.',
    },
    discente: {
      appliesConditions: [{ id: 'imobilizado', duration: 0 }, { id: 'indefeso', duration: 0 }],
      special: 'Imobilizado e indefeso.',
    },
    verdadeiro: {
      special: 'Até 3 alvos. Controle preciso.',
    },
  },

  'compreensao': {
    base: {
      kind: 'sense',
      senseEffect: {
        type: 'commune',
        targets: ['idiomas'],
        information: 'entende línguas faladas',
      },
      special: 'Compreende qualquer idioma.',
    },
    discente: {
      senseEffect: {
        type: 'commune',
        targets: ['idiomas', 'escrita'],
        information: 'entende e pode falar/escrever',
      },
      special: 'Pode falar e escrever.',
    },
    verdadeiro: {
      special: 'Telepatia com qualquer criatura.',
    },
  },

  'concentracao-de-combate': {
    base: {
      kind: 'buff',
      attackModifier: 2,
      special: '+2 ataques.',
    },
    discente: {
      attackModifier: 4,
      defenseModifier: 2,
      special: '+4 ataques, +2 Defesa.',
    },
    verdadeiro: {
      attackModifier: 6,
      defenseModifier: 4,
      special: '+6 ataques, +4 Defesa. Imune a mental.',
    },
  },

  'enfeiticar': {
    base: {
      kind: 'control',
      mentalControl: {
        type: 'charm',
        canForceHarm: false,
        canForceSuicide: false,
        breakConditions: ['ataque ao alvo', 'ordem perigosa'],
      },
      resistance: { type: 'vontade', effect: 'anula' },
      skillModifier: {
        skills: ['Diplomacia', 'Enganação', 'Intimidação'],
        bonus: 5,
        isContextual: true,
        context: 'Apenas contra o alvo',
      },
      actionRestrictions: ['cannotHarm'],
      special: 'Alvo amigável. +5 testes sociais CONTRA ESTE ALVO.',
    },
    discente: {
      skillModifier: {
        skills: ['Diplomacia', 'Enganação', 'Intimidação'],
        bonus: 10,
        isContextual: true,
        context: 'Apenas contra o alvo',
      },
      special: '+10 testes sociais. Ordens simples.',
    },
    verdadeiro: {
      special: 'Controle quase total. Memórias falsas.',
    },
  },

  'ilusao': {
    base: {
      kind: 'utility',
      resistance: { type: 'vontade', effect: 'anula' },
      special: 'Ilusão visual/sonora. Até 3m³.',
    },
    discente: {
      special: 'Até 9m³. Inclui tato e cheiro.',
    },
    verdadeiro: {
      special: 'Até 27m³. Dano psicossomático 1d6/rodada.',
    },
  },

  'leitura-superficial': {
    base: {
      kind: 'sense',
      senseEffect: {
        type: 'detect',
        range: 9,
        targets: ['pensamentos'],
        information: 'emoções e pensamentos imediatos',
      },
      resistance: { type: 'vontade', effect: 'anula' },
      special: 'Lê pensamentos superficiais.',
    },
    discente: {
      senseEffect: {
        type: 'detect',
        range: 18,
        targets: ['pensamentos', 'memórias recentes'],
        information: 'memórias 24h',
      },
      special: 'Lê memórias recentes.',
    },
    verdadeiro: {
      senseEffect: {
        type: 'detect',
        range: 30,
        targets: ['pensamentos', 'memórias profundas'],
        information: 'qualquer memória',
      },
      special: 'Acessa qualquer memória.',
    },
  },

  'toque-debilitante': {
    base: {
      kind: 'debuff',
      appliesConditions: [{ id: 'debilitado', duration: 0 }],
      resistance: { type: 'fortitude', effect: 'anula' },
      special: 'Toque enfraquece. Debilitado.',
    },
    discente: {
      appliesConditions: [{ id: 'debilitado', duration: 0 }, { id: 'vulneravel', duration: 0 }],
      special: 'Debilitado e vulnerável.',
    },
    verdadeiro: {
      appliesConditions: [{ id: 'debilitado', duration: 0 }, { id: 'vulneravel', duration: 0 }, { id: 'lento', duration: 0 }],
      special: 'Debilitado, vulnerável e lento.',
    },
  },

  // ========================================
  // CONHECIMENTO - 2º Círculo
  // ========================================

  'alterar-memoria': {
    base: {
      kind: 'control',
      resistance: { type: 'vontade', effect: 'anula' },
      special: 'Modifica 5 minutos de memória.',
    },
    discente: {
      special: 'Modifica 1 hora.',
    },
    verdadeiro: {
      special: 'Qualquer quantidade. Personalidade alternativa.',
    },
  },

  'aprimoramento-fisico': {
    base: {
      kind: 'buff',
      attackModifier: 2,
      defenseModifier: 2,
      special: '+2 em 1 atributo físico.',
    },
    discente: {
      attackModifier: 4,
      defenseModifier: 4,
      special: '+4 em 2 atributos físicos.',
    },
    verdadeiro: {
      attackModifier: 6,
      defenseModifier: 6,
      special: '+6 em todos os 3 físicos.',
    },
  },

  'barreira-mental': {
    base: {
      kind: 'buff',
      damageReduction: { types: ['mental'], amount: 10 },
      special: 'RD 10 mental. +5 Vontade.',
    },
    discente: {
      damageReduction: { types: ['mental'], amount: 20 },
      special: 'RD 20 mental. +10 Vontade.',
    },
    verdadeiro: {
      damageReduction: { types: ['mental'], amount: 1000 },
      special: 'Imunidade mental. Reflete leitura.',
    },
  },

  'manipular-objeto': {
    base: {
      kind: 'utility',
      special: 'Telecinesia. Move até 25kg.',
    },
    discente: {
      damage: { diceCount: 2, diceType: 8, damageType: 'impacto' },
      special: 'Até 100kg. Ataque 2d8.',
    },
    verdadeiro: {
      special: 'Até 500kg. Desmonta objetos.',
    },
  },

  'projecao-psiquica': {
    base: {
      kind: 'damage',
      damage: { diceCount: 4, diceType: 8, damageType: 'mental' },
      resistance: { type: 'vontade', effect: 'reduz_metade' },
      special: '4d8 mental.',
    },
    discente: {
      damage: { diceCount: 6, diceType: 8, damageType: 'mental' },
      appliesConditions: [{ id: 'atordoado', duration: 1 }],
      special: '6d8 mental + atordoado.',
    },
    verdadeiro: {
      damage: { diceCount: 8, diceType: 8, damageType: 'mental' },
      appliesConditions: [{ id: 'inconsciente', duration: 0 }],
      special: '8d8 mental. Se zerar PV, coma.',
    },
  },

  'sono': {
    base: {
      kind: 'control',
      appliesConditions: [{ id: 'inconsciente', duration: 0 }],
      resistance: { type: 'vontade', effect: 'anula' },
      special: 'Sono. Inconsciente até acordar.',
    },
    discente: {
      areaEffect: { shape: 'esfera', radius: 6 },
      special: 'Até 3 alvos em 6m.',
    },
    verdadeiro: {
      areaEffect: { shape: 'esfera', radius: 9 },
      special: 'Área 9m. Sono profundo. Pesadelos.',
    },
  },

  // ========================================
  // CONHECIMENTO - 3º Círculo
  // ========================================

  'dissipar-ritual': {
    base: {
      kind: 'utility',
      modes: [
        {
          name: 'Dissipação Simples',
          kind: 'utility',
          description: 'Dissipa círculo igual ou menor',
          effect: { special: 'Dissipa 3º círculo ou menor.' },
        },
      ],
      special: 'Dissipa ritual ativo.',
    },
    discente: {
      modes: [
        {
          name: 'Dissipação Ampla',
          kind: 'utility',
          description: 'Dissipa múltiplos',
          effect: {
            areaEffect: { shape: 'esfera', radius: 6 },
            special: 'Dissipa TODOS em 6m.',
          },
        },
        {
          name: 'Dissipação Forçada',
          kind: 'utility',
          description: 'Tenta 4º círculo',
          effect: { special: 'Teste para 4º círculo.' },
        },
      ],
      special: 'Todos em área OU tenta círculo maior.',
    },
    verdadeiro: {
      special: 'Qualquer ritual, incluindo permanentes.',
    },
  },

  'forma-monstruosa': {
    base: {
      kind: 'transformation',
      tempHP: { diceCount: 0, diceType: 0, bonus: 30 },
      attackModifier: 5,
      damageModifier: 5,
      actionRestrictions: ['mustAttack', 'cannotSpeak', 'cannotCast'],
      special: 'Monstro Grande. +5 ataque/dano, 30 PV. FÚRIA.',
    },
    discente: {
      tempHP: { diceCount: 0, diceType: 0, bonus: 50 },
      attackModifier: 7,
      damageModifier: 7,
      actionRestrictions: ['mustAttack', 'cannotSpeak', 'cannotCast'],
      special: '+7 ataque/dano, 50 PV. Enorme.',
    },
    verdadeiro: {
      tempHP: { diceCount: 0, diceType: 0, bonus: 70 },
      attackModifier: 10,
      damageModifier: 10,
      damageReduction: { types: ['corte', 'perfuração', 'impacto', 'balístico'], amount: 10 },
      actionRestrictions: ['mustAttack', 'cannotSpeak', 'cannotCast'],
      special: '+10 ataque/dano, 70 PV, RD 10. Colossal.',
    },
  },

  'possessao-mental': {
    base: {
      kind: 'control',
      mentalControl: {
        type: 'dominate',
        canForceHarm: true,
        canForceSuicide: false,
        breakConditions: ['distância > 30m', 'ordem suicídio'],
      },
      resistance: { type: 'vontade', effect: 'anula' },
      sustain: {
        concentration: true,
        endTriggers: ['concentração quebrada', 'corpo atacado'],
      },
      special: 'Controla corpo do alvo. Seu corpo indefeso.',
    },
    discente: {
      special: 'Alcance 100m. Controle estável.',
    },
    verdadeiro: {
      special: 'Mesmo plano. Múltiplos corpos em sequência.',
    },
  },

  'previsao': {
    base: {
      kind: 'sense',
      defenseModifier: 2,
      senseEffect: {
        type: 'scry',
        targets: ['futuro imediato'],
        information: 'próximos 6 segundos',
      },
      special: '+2 Defesa. Não surpreendido.',
    },
    discente: {
      defenseModifier: 4,
      attackModifier: 2,
      special: '+4 Defesa, +2 ataques. Prevê ataques.',
    },
    verdadeiro: {
      defenseModifier: 6,
      attackModifier: 4,
      special: '+6 Defesa, +4 ataques. Muda dado 1x/cena.',
    },
  },

  // ========================================
  // CONHECIMENTO - 4º Círculo
  // ========================================

  'controle-mental': {
    base: {
      kind: 'control',
      mentalControl: {
        type: 'dominate',
        canForceHarm: true,
        canForceSuicide: false,
        breakConditions: ['ordem suicídio', 'novo teste por ordem abusiva'],
      },
      resistance: { type: 'vontade', effect: 'anula' },
      sustain: {
        concentration: false,
        endTriggers: ['alvo passa em novo teste'],
      },
      special: 'Dominação total. NUNCA suicídio. Novo teste por ordem contra natureza.',
    },
    discente: {
      special: 'Controle profundo. Menos chances de resistir.',
    },
    verdadeiro: {
      special: 'Permanente. Múltiplos alvos.',
    },
  },

  'inexistir': {
    base: {
      kind: 'stateOverride',
      damage: { diceCount: 10, diceType: 8, damageType: 'mental' },
      resistance: { type: 'vontade', effect: 'parcial' },
      special: '10d8 mental. Se matar, APAGADO - ninguém lembra.',
    },
    discente: {
      damage: { diceCount: 15, diceType: 8, damageType: 'mental' },
      special: '15d8. Apagamento mais completo.',
    },
    verdadeiro: {
      special: 'Apagamento retroativo - nunca existiu.',
    },
  },

  'possessao': {
    base: {
      kind: 'control',
      mentalControl: {
        type: 'dominate',
        canForceHarm: true,
        canForceSuicide: false,
        breakConditions: ['hospedeiro morre'],
      },
      hooks: [
        {
          trigger: 'onDeath',
          effect: 'Se hospedeiro morre, conjurador morre',
        },
      ],
      resistance: { type: 'vontade', effect: 'anula' },
      special: 'Transfere consciência. SEU CORPO MORRE. Hospedeiro morre = você morre.',
    },
    discente: {
      special: 'Corpo original em animação suspensa.',
    },
    verdadeiro: {
      special: 'Salta entre corpos. Consciência persiste.',
    },
  },

  'pronunciar-sigilo': {
    base: {
      kind: 'stateOverride',
      resistance: { type: 'vontade', effect: 'parcial' },
      special: 'Nome verdadeiro. VANTAGEM CATEGÓRICA (não numérica).',
    },
    discente: {
      special: 'Vantagem ampliada.',
    },
    verdadeiro: {
      special: 'Alvo NÃO PODE mentir ou atacá-lo.',
    },
  },

  'alterar-destino': {
    base: {
      kind: 'stateOverride',
      hooks: [
        {
          trigger: 'onRoll',
          effect: 'Substitui resultado de dado',
          condition: '1x/cena',
        },
      ],
      special: 'QUEBRA REGRA DE DADOS: Substitui resultado de dado 1x/cena.',
    },
    discente: {
      special: '2x/cena. Afeta dados de outros.',
    },
    verdadeiro: {
      special: '3x/cena. Escolhe resultado exato.',
    },
  },

  // ========================================
  // MEDO - 1º Círculo
  // ========================================

  'amedrontar': {
    base: {
      kind: 'debuff',
      appliesConditions: [{ id: 'amedrontado', duration: 0 }],
      resistance: { type: 'vontade', effect: 'anula' },
      special: 'Alvo amedrontado.',
    },
    discente: {
      appliesConditions: [{ id: 'apavorado', duration: 0 }],
      special: 'Apavorado.',
    },
    verdadeiro: {
      appliesConditions: [{ id: 'apavorado', duration: 0 }],
      areaEffect: { shape: 'esfera', radius: 9 },
      special: 'Apavorado em 9m.',
    },
  },

  'escuridao': {
    base: {
      kind: 'utility',
      areaEffect: { shape: 'esfera', radius: 6 },
      special: 'Escuridão total 6m.',
    },
    discente: {
      areaEffect: { shape: 'esfera', radius: 9 },
      special: 'Escuridão 9m. Nega visão no escuro.',
    },
    verdadeiro: {
      areaEffect: { shape: 'esfera', radius: 12 },
      special: 'Escuridão 12m. Nega TODA visão.',
    },
  },

  'sombra-assustadora': {
    base: {
      kind: 'damage',
      damage: { diceCount: 2, diceType: 6, damageType: 'medo' },
      appliesConditions: [{ id: 'amedrontado', duration: 1 }],
      resistance: { type: 'vontade', effect: 'parcial' },
      special: '2d6 Medo + amedrontado 1 rodada.',
    },
    discente: {
      damage: { diceCount: 4, diceType: 6, damageType: 'medo' },
      special: '4d6 Medo + amedrontado.',
    },
    verdadeiro: {
      damage: { diceCount: 6, diceType: 6, damageType: 'medo' },
      appliesConditions: [{ id: 'apavorado', duration: 0 }],
      special: '6d6 Medo + apavorado.',
    },
  },

  'sussurros-insanos': {
    base: {
      kind: 'damage',
      damage: { diceCount: 1, diceType: 6, damageType: 'sanidade' },
      resistance: { type: 'vontade', effect: 'anula' },
      special: '1d6 Sanidade.',
    },
    discente: {
      damage: { diceCount: 2, diceType: 6, damageType: 'sanidade' },
      appliesConditions: [{ id: 'confuso', duration: 1 }],
      special: '2d6 Sanidade + confuso 1 rodada.',
    },
    verdadeiro: {
      damage: { diceCount: 3, diceType: 6, damageType: 'sanidade' },
      appliesConditions: [{ id: 'confuso', duration: 0 }],
      special: '3d6 Sanidade + confuso permanente.',
    },
  },

  'visao-do-medo': {
    base: {
      kind: 'sense',
      senseEffect: {
        type: 'detect',
        range: 18,
        targets: ['medos', 'fobias'],
        information: 'maior medo do alvo',
      },
      special: 'Descobre maior medo do alvo.',
    },
    discente: {
      skillModifier: {
        skills: ['Intimidação'],
        bonus: 5,
        isContextual: true,
        context: 'Contra alvo cujo medo conhece',
      },
      special: '+5 Intimidação contra alvos cujos medos conhece.',
    },
    verdadeiro: {
      skillModifier: {
        skills: ['Intimidação'],
        bonus: 10,
        isContextual: true,
        context: 'Contra alvo cujo medo conhece',
      },
      special: '+10 Intimidação. DT +5 rituais de Medo.',
    },
  },

  // ========================================
  // MEDO - 2º Círculo
  // ========================================

  'aparicao': {
    base: {
      kind: 'summon',
      sustain: {
        concentration: true,
        maxDuration: 10,
        endTriggers: ['concentração quebrada', 'aparição destruída'],
      },
      special: 'Aparição assustadora. Causa medo, não dano.',
    },
    discente: {
      damage: { diceCount: 2, diceType: 8, damageType: 'medo' },
      special: '2d8 Medo ao tocar.',
    },
    verdadeiro: {
      damage: { diceCount: 4, diceType: 8, damageType: 'medo' },
      special: '4d8 Medo. Parcialmente real.',
    },
  },

  'pesadelo': {
    base: {
      kind: 'damage',
      damage: { diceCount: 4, diceType: 6, damageType: 'sanidade' },
      resistance: { type: 'vontade', effect: 'reduz_metade' },
      special: 'Invade sonhos. 4d6 Sanidade. Sem descanso.',
    },
    discente: {
      damage: { diceCount: 6, diceType: 6, damageType: 'sanidade' },
      appliesConditions: [{ id: 'fatigado', duration: 0 }],
      special: '6d6 Sanidade + fatigado.',
    },
    verdadeiro: {
      damage: { diceCount: 8, diceType: 6, damageType: 'sanidade' },
      appliesConditions: [{ id: 'exausto', duration: 0 }],
      special: '8d6 Sanidade + exausto. Loucura.',
    },
  },

  'tentaculos-de-lodo': {
    base: {
      kind: 'damage',
      damage: { diceCount: 2, diceType: 8, damageType: 'impacto' },
      appliesConditions: [{ id: 'agarrado', duration: 0 }],
      areaEffect: { shape: 'esfera', radius: 6 },
      sustain: {
        concentration: true,
        endTriggers: ['concentração quebrada'],
      },
      special: 'Tentáculos 6m. 2d8 + agarrado.',
    },
    discente: {
      damage: { diceCount: 4, diceType: 8, damageType: 'impacto' },
      areaEffect: { shape: 'esfera', radius: 9 },
      special: '4d8 em 9m.',
    },
    verdadeiro: {
      damage: { diceCount: 6, diceType: 8, damageType: 'impacto' },
      areaEffect: { shape: 'esfera', radius: 12 },
      appliesConditions: [{ id: 'agarrado', duration: 0 }, { id: 'amedrontado', duration: 0 }],
      special: '6d8 em 12m. Causam medo.',
    },
  },

  'poeira-da-podridao': {
    base: {
      kind: 'damage',
      damagePerTurn: { diceCount: 2, diceType: 6, damageType: 'ácido' },
      areaEffect: { shape: 'cone', length: 6, width: 6 },
      resistance: { type: 'fortitude', effect: 'reduz_metade' },
      sustain: {
        maxDuration: 5,
        endTriggers: ['vento forte'],
      },
      special: 'Cone de esporos. 2d6 ácido/turno por 5 rodadas.',
    },
    discente: {
      damagePerTurn: { diceCount: 4, diceType: 6, damageType: 'ácido' },
      areaEffect: { shape: 'cone', length: 9, width: 9 },
      special: '4d6/turno em cone 9m.',
    },
    verdadeiro: {
      damagePerTurn: { diceCount: 6, diceType: 6, damageType: 'ácido' },
      areaEffect: { shape: 'cone', length: 12, width: 12 },
      appliesConditions: [{ id: 'envenenado', duration: 0 }],
      special: '6d6/turno em cone 12m + envenenado.',
    },
  },

  // ========================================
  // MEDO - 3º Círculo
  // ========================================

  'corpo-vulneravel': {
    base: {
      kind: 'debuff',
      resistance: { type: 'fortitude', effect: 'anula' },
      special: 'Alvo vulnerável. Dano dobrado.',
    },
    discente: {
      areaEffect: { shape: 'esfera', radius: 6 },
      special: 'Até 3 alvos em 6m.',
    },
    verdadeiro: {
      special: 'Dano triplicado.',
    },
  },

  'fobia': {
    base: {
      kind: 'debuff',
      appliesConditions: [{ id: 'amedrontado', duration: 0 }],
      resistance: { type: 'vontade', effect: 'anula' },
      special: 'Fobia permanente. Amedrontado no gatilho.',
    },
    discente: {
      appliesConditions: [{ id: 'apavorado', duration: 0 }],
      special: 'Fobia severa. Apavorado.',
    },
    verdadeiro: {
      damage: { diceCount: 4, diceType: 6, damageType: 'sanidade' },
      special: 'Fobia traumática. 4d6 Sanidade.',
    },
  },

  'possuir-criatura': {
    base: {
      kind: 'control',
      mentalControl: {
        type: 'dominate',
        canForceHarm: false,
        canForceSuicide: false,
        breakConditions: ['criatura sofre dano', 'distância > 100m'],
      },
      resistance: { type: 'vontade', effect: 'anula' },
      sustain: {
        concentration: true,
        endTriggers: ['concentração quebrada', 'alvo passa no teste'],
      },
      special: 'Controla criatura de Medo.',
    },
    discente: {
      special: 'Criaturas mais poderosas.',
    },
    verdadeiro: {
      special: 'Múltiplas criaturas.',
    },
  },

  // ========================================
  // MEDO - 4º Círculo
  // ========================================

  'canalizar-o-medo': {
    base: {
      kind: 'stateOverride',
      resourceModifier: {
        peMax: -10,
      },
      hooks: [
        {
          trigger: 'onCast',
          effect: 'Transfere ritual para outro conjurador',
        },
      ],
      special: 'TRANSFERE RITUAL. REDUZ PE MÁXIMO do alvo.',
    },
    discente: {
      resourceModifier: {
        peMax: -20,
      },
      special: 'Transferência completa. PE máximo -20.',
    },
    verdadeiro: {
      special: 'Múltiplos rituais. Redução permanente.',
    },
  },

  'conhecendo-o-medo': {
    base: {
      kind: 'damage',
      damage: { diceCount: 8, diceType: 6, damageType: 'sanidade' },
      resistance: { type: 'vontade', effect: 'reduz_metade' },
      special: 'Ataque à SANIDADE (não PV). 8d6.',
    },
    discente: {
      damage: { diceCount: 12, diceType: 6, damageType: 'sanidade' },
      special: '12d6 Sanidade.',
    },
    verdadeiro: {
      damage: { diceCount: 16, diceType: 6, damageType: 'sanidade' },
      special: '16d6 Sanidade. Zerar = loucura permanente.',
    },
  },

  'lamina-do-medo': {
    base: {
      kind: 'stateOverride',
      weaponEffect: {
        damageType: 'medo',
        extraDice: { count: 2, type: 8 },
        isPermanentWound: true,
      },
      hooks: [
        {
          trigger: 'onPostDamage',
          effect: 'Ferida não cicatriza naturalmente',
        },
      ],
      special: 'Arma de medo. +2d8. FERIDA PERMANENTE.',
    },
    discente: {
      weaponEffect: {
        damageType: 'medo',
        extraDice: { count: 4, type: 8 },
        isPermanentWound: true,
      },
      special: '+4d8. Ferida se espalha.',
    },
    verdadeiro: {
      weaponEffect: {
        damageType: 'medo',
        extraDice: { count: 6, type: 8 },
        isPermanentWound: true,
      },
      special: '+6d8. Só cura com 4º círculo+.',
    },
  },

  'medo-tangivel': {
    base: {
      kind: 'stateOverride',
      hooks: [
        {
          trigger: 'onReduceHP',
          effect: 'Não reduz abaixo de 1 PV por dano não-Medo',
          condition: 'Dano não é de Medo',
        },
      ],
      damage: { diceCount: 6, diceType: 8, damageType: 'medo' },
      resistance: { type: 'vontade', effect: 'anula' },
      special: 'QUEBRA REGRA DE PV: Só morre por dano de MEDO. 6d8.',
    },
    discente: {
      damage: { diceCount: 10, diceType: 8, damageType: 'medo' },
      special: '10d8. Imunidades não funcionam.',
    },
    verdadeiro: {
      damage: { diceCount: 14, diceType: 8, damageType: 'medo' },
      special: '14d8. Resistências não funcionam. Morte permanente.',
    },
  },

  'presenca-do-medo': {
    base: {
      kind: 'damage',
      damagePerTurn: { diceCount: 2, diceType: 6, damageType: 'medo' },
      areaEffect: { shape: 'emanação', radius: 6 },
      appliesConditions: [{ id: 'amedrontado', duration: 0 }],
      sustain: {
        costPerTurn: 2,
        endTriggers: ['PE zerado', 'escolhe encerrar'],
      },
      special: 'Aura 6m. 2d6/turno + amedrontado. 2 PE/turno.',
    },
    discente: {
      damagePerTurn: { diceCount: 4, diceType: 6, damageType: 'medo' },
      areaEffect: { shape: 'emanação', radius: 9 },
      appliesConditions: [{ id: 'apavorado', duration: 0 }],
      special: 'Aura 9m. 4d6/turno + apavorado.',
    },
    verdadeiro: {
      damagePerTurn: { diceCount: 6, diceType: 6, damageType: 'medo' },
      areaEffect: { shape: 'emanação', radius: 12 },
      damage: { diceCount: 2, diceType: 6, damageType: 'sanidade' },
      special: 'Aura 12m. 6d6 Medo + 2d6 Sanidade/turno.',
    },
  },
};

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

export function getRitualEffects(ritualId: string): RitualEffectsByLevel | undefined {
  return RITUAL_EFFECTS[ritualId];
}

export function getActiveRitualEffect(
  ritualId: string, 
  selectedEnhancements: string[]
): RitualEffect | undefined {
  const effects = RITUAL_EFFECTS[ritualId];
  if (!effects) return undefined;

  let activeEffect: RitualEffect = { ...effects.base };

  if (selectedEnhancements.includes('Discente') && effects.discente) {
    activeEffect = mergeEffects(activeEffect, effects.discente);
  }

  if (selectedEnhancements.includes('Verdadeiro') && effects.verdadeiro) {
    activeEffect = mergeEffects(activeEffect, effects.verdadeiro);
  }

  return activeEffect;
}

function mergeEffects(base: RitualEffect, enhancement: RitualEffect): RitualEffect {
  return {
    ...base,
    ...enhancement,
    appliesConditions: [
      ...(base.appliesConditions || []),
      ...(enhancement.appliesConditions || []),
    ],
    hooks: [
      ...(base.hooks || []),
      ...(enhancement.hooks || []),
    ],
    actionRestrictions: [
      ...(base.actionRestrictions || []),
      ...(enhancement.actionRestrictions || []),
    ],
    modes: enhancement.modes || base.modes,
  };
}

export function formatDamageFormula(formula: DamageFormula): string {
  let result = '';
  
  if (formula.diceCount > 0 && formula.diceType > 0) {
    result = `${formula.diceCount}d${formula.diceType}`;
  }
  
  if (formula.bonus && formula.bonus > 0) {
    result += result ? `+${formula.bonus}` : `${formula.bonus}`;
  }
  
  if (formula.isAbsolute) {
    result = `${formula.bonus || 0} (absoluto)`;
  }
  
  return result || '0';
}

export function ritualDealsDamage(ritualId: string): boolean {
  const effects = RITUAL_EFFECTS[ritualId];
  if (!effects) return false;
  
  return !!(
    effects.base.damage || 
    effects.base.damagePerTurn ||
    effects.discente?.damage || 
    effects.discente?.damagePerTurn ||
    effects.verdadeiro?.damage ||
    effects.verdadeiro?.damagePerTurn
  );
}

export function ritualAppliesConditions(ritualId: string): boolean {
  const effects = RITUAL_EFFECTS[ritualId];
  if (!effects) return false;
  
  return !!(
    effects.base.appliesConditions?.length ||
    effects.discente?.appliesConditions?.length ||
    effects.verdadeiro?.appliesConditions?.length
  );
}

export function getRitualKind(ritualId: string): RitualKind | undefined {
  const effects = RITUAL_EFFECTS[ritualId];
  return effects?.base.kind;
}

export function ritualHasHooks(ritualId: string): boolean {
  const effects = RITUAL_EFFECTS[ritualId];
  if (!effects) return false;
  
  return !!(
    effects.base.hooks?.length ||
    effects.discente?.hooks?.length ||
    effects.verdadeiro?.hooks?.length
  );
}

export function getRitualHooks(ritualId: string): Hook[] {
  const effects = RITUAL_EFFECTS[ritualId];
  if (!effects) return [];
  
  return [
    ...(effects.base.hooks || []),
    ...(effects.discente?.hooks || []),
    ...(effects.verdadeiro?.hooks || []),
  ];
}

export function ritualRequiresSustain(ritualId: string): boolean {
  const effects = RITUAL_EFFECTS[ritualId];
  return !!effects?.base.sustain;
}

export function getRitualActionRestrictions(ritualId: string): ActionRestriction[] {
  const effects = RITUAL_EFFECTS[ritualId];
  if (!effects) return [];
  
  return effects.base.actionRestrictions || [];
}
