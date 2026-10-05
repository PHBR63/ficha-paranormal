// =====================================================
// Adaptador de Bônus Condicionais para o SUE
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Converte bônus condicionais ativados pelo usuário para UnifiedEffect[]
// Esses são bônus que o jogador pode ativar/desativar manualmente,
// como Fanático, Ataque Poderoso, Combate Defensivo, etc.
//

import type { UnifiedEffect, EffectMechanics } from '../unified-effects-engine';

/**
 * Definição de um bônus condicional
 */
export interface ConditionalBonusDefinition {
  id: string;
  name: string;
  source: 'general_power' | 'ability' | 'paranormal' | 'origin';
  condition: string; // Descrição da condição de ativação
  mechanics: EffectMechanics;
  /** Requisitos para o bônus estar disponível */
  requirements?: {
    generalPower?: string;  // ID do poder geral necessário
    ability?: string;       // Nome da habilidade necessária
    minNex?: number;        // NEX mínimo
    classTrack?: string;    // Trilha necessária
  };
}

/**
 * Catálogo de todos os bônus condicionais do sistema
 * Baseado no Livro Base v1.3
 */
export const CONDITIONAL_BONUS_CATALOG: ConditionalBonusDefinition[] = [
  // ===== PODERES GERAIS =====
  {
    id: 'fanatico',
    name: 'Fanático',
    source: 'general_power',
    condition: 'HP < 50%',
    mechanics: {
      attackBonus: 2,
      damageBonus: 2,
    },
    requirements: { generalPower: 'fanatico' },
  },
  {
    id: 'ataque-poderoso',
    name: 'Ataque Poderoso',
    source: 'general_power',
    condition: 'Ação de ataque (-2 ataque)',
    mechanics: {
      attackBonus: -2, // Penalidade
      damageBonus: 5,
    },
    requirements: { generalPower: 'ataque-poderoso' },
  },
  {
    id: 'foco-arma',
    name: 'Foco em Arma',
    source: 'general_power',
    condition: 'Com arma escolhida',
    mechanics: {
      attackBonus: 2,
    },
    requirements: { generalPower: 'foco-arma' },
  },
  {
    id: 'esquiva',
    name: 'Esquiva',
    source: 'general_power',
    condition: 'Contra um inimigo escolhido (livre)',
    mechanics: {
      defenseBonus: 2,
    },
    requirements: { generalPower: 'esquiva' },
  },
  {
    id: 'mira-apurada',
    name: 'Mira Apurada',
    source: 'general_power',
    condition: 'Gasta ação de movimento antes de atacar',
    mechanics: {
      rangedAttackBonus: 2,
    },
    requirements: { generalPower: 'mira-apurada' },
  },
  {
    id: 'golpe-demolidor',
    name: 'Golpe Demolidor',
    source: 'general_power',
    condition: 'Ao atacar objeto ou construto',
    mechanics: {
      damageBonus: 10, // +10 dano vs objetos/construtos
    },
    requirements: { generalPower: 'golpe-demolidor' },
  },
  {
    id: 'reflexos-rapidos',
    name: 'Reflexos Rápidos',
    source: 'general_power',
    condition: 'Durante a primeira rodada de combate',
    mechanics: {
      initiativeBonus: 5,
    },
    requirements: { generalPower: 'reflexos-rapidos' },
  },

  // ===== HABILIDADES DE CLASSE =====
  {
    id: 'combate-defensivo',
    name: 'Combate Defensivo',
    source: 'ability',
    condition: 'Ação agredir (até próximo turno)',
    mechanics: {
      testDice: { attacks: -1 }, // Livro Base p. 25: reduz o pool, não o total.
      defenseBonus: 5,
    },
    requirements: { ability: 'combate defensivo' },
  },
  {
    id: 'combater-duas-armas',
    name: 'Combater com Duas Armas',
    source: 'ability',
    condition: 'Ação agredir com duas armas (até próximo turno)',
    mechanics: {
      testDice: { attacks: -1 },
      specialEffects: ['Permite dois ataques (um com cada arma)'],
    },
    requirements: { ability: 'combater com duas armas' },
  },
  {
    id: 'sentido-tatico',
    name: 'Sentido Tático',
    source: 'ability',
    condition: 'Gasta 2 PE + ação movimento (cena)',
    mechanics: {
      // Valores serão calculados dinamicamente baseado em INT
      specialEffects: ['+INT em Defesa', '+INT em resistências'],
    },
    requirements: { ability: 'sentido tatico' },
  },
  // REMOVIDO: inquebravel - Agora gerenciado exclusivamente pelo track-effects-adapter.ts
  // A habilidade Inquebrável (Tropa de Choque) usa whenWounded para aplicar +5 Defesa e RD 5

  // ===== HABILIDADES DE TRILHA =====
  {
    id: 'assassinar',
    name: 'Assassinar',
    source: 'ability',
    condition: '3 PE + ação movimento (próximo Ataque Furtivo)',
    mechanics: {
      // Multiplicador de dados do Ataque Furtivo (oficial v1.3)
      sneakAttackMultiplier: 2,
      specialEffects: ['Ataque Furtivo causa dano dobrado'],
    },
    requirements: { classTrack: 'infiltrador', minNex: 65 }, // NEX 65% conforme Livro Base v1.3
  },
  {
    id: 'potencia-maxima',
    name: 'Potência Máxima',
    source: 'ability',
    condition: 'Ao usar Ataque Especial corpo a corpo',
    mechanics: {
      specialAttackMultiplier: { value: 2, weaponRestriction: 'melee' },
      specialEffects: ['Bônus numéricos do Ataque Especial são dobrados'],
    },
    requirements: { classTrack: 'guerreiro', minNex: 65 },
  },
  // REMOVIDO: atirar-matar - Agora gerenciado exclusivamente pelo track-effects-adapter.ts
  // para evitar duplicação no painel de bônus condicionais
  // REMOVIDO: disparo-letal - Agora gerenciado exclusivamente pelo track-effects-adapter.ts
  // para evitar duplicação no painel de bônus condicionais
  {
    id: 'bloqueio-casca-grossa',
    name: 'Bloqueio (Casca Grossa)',
    source: 'ability',
    condition: 'Ao bloquear um ataque',
    mechanics: {
      specialEffects: ['+VIG na RD do bloqueio'],
    },
    requirements: { classTrack: 'tropa-de-choque' },
  },
  {
    id: 'mestre-combate',
    name: 'Mestre de Combate',
    source: 'ability',
    condition: '5 PE + ação livre (1 rodada)',
    mechanics: {
      attackBonus: 5,
      damageBonus: 5,
      defenseBonus: 5,
      specialEffects: ['+5 ataque, dano e Defesa por 1 rodada'],
    },
    requirements: { classTrack: 'guerreiro', minNex: 99 },
  },
  {
    id: 'olho-do-falcao',
    name: 'Olho do Falcão',
    source: 'ability',
    condition: 'Ataque à distância com mira',
    mechanics: {
      criticalMarginBonus: 2,
      specialEffects: ['+2 margem de ameaça em ataques à distância'],
    },
    requirements: { classTrack: 'atirador-de-elite' },
  },
  {
    id: 'execucao',
    name: 'Execução',
    source: 'ability',
    condition: '5 PE ao acertar crítico (Atirador de Elite)',
    mechanics: {
      specialEffects: ['Ataque causa dano adicional igual ao dano base'],
    },
    requirements: { classTrack: 'atirador-de-elite', minNex: 85 },
  },
];

/**
 * Obtém definição de um bônus condicional pelo ID
 */
export function getConditionalBonusById(id: string): ConditionalBonusDefinition | undefined {
  return CONDITIONAL_BONUS_CATALOG.find(b => b.id === id);
}

/**
 * Verifica se um personagem atende aos requisitos de um bônus condicional
 */
export function checkBonusRequirements(
  bonus: ConditionalBonusDefinition,
  context: {
    generalPowers: string[];    // IDs de poderes gerais
    abilities: string[];        // Nomes de habilidades
    classTrack: string | null;  // Trilha de classe
    nex: number;                // NEX do personagem
  }
): boolean {
  const { requirements } = bonus;
  if (!requirements) return true;

  // Verifica poder geral
  if (requirements.generalPower) {
    if (!context.generalPowers.includes(requirements.generalPower)) {
      return false;
    }
  }

  // Verifica habilidade
  if (requirements.ability) {
    const normalizedReq = requirements.ability.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const hasAbility = context.abilities.some(a => {
      const normalizedAbility = a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return normalizedAbility.includes(normalizedReq);
    });
    if (!hasAbility) return false;
  }

  // Verifica trilha
  if (requirements.classTrack) {
    if (context.classTrack !== requirements.classTrack) {
      return false;
    }
  }

  // Verifica NEX mínimo
  if (requirements.minNex && context.nex < requirements.minNex) {
    return false;
  }

  return true;
}

/**
 * Converte bônus condicionais ativos em UnifiedEffect[]
 * 
 * @param activeConditionalBonusIds - IDs dos bônus ativos (do banco de dados)
 * @param context - Contexto do personagem para verificar requisitos
 * @param intellect - Intelecto para bônus que escalam com INT
 * @param vigor - Vigor para bônus que escalam com VIG
 */
export function getConditionalBonusEffects(
  activeConditionalBonusIds: string[],
  context: {
    generalPowers: string[];
    abilities: string[];
    classTrack: string | null;
    nex: number;
  },
  intellect: number = 1,
  vigor: number = 1
): UnifiedEffect[] {
  const effects: UnifiedEffect[] = [];

  for (const bonusId of activeConditionalBonusIds) {
    const bonus = getConditionalBonusById(bonusId);
    if (!bonus) continue;

    // Verifica se o personagem atende aos requisitos
    if (!checkBonusRequirements(bonus, context)) {
      console.warn(`[ConditionalBonusAdapter] Bônus ${bonusId} ativo mas requisitos não atendidos`);
      continue;
    }

    // Aplica mecânicas dinâmicas baseadas em atributos
    let mechanics = { ...bonus.mechanics };

    // Sentido Tático: +INT em defesa e resistências
    if (bonusId === 'sentido-tatico') {
      mechanics = {
        ...mechanics,
        defenseBonus: intellect,
        fortitudeBonus: intellect,
        reflexosBonus: intellect,
        vontadeBonus: intellect,
      };
    }

    // Bloqueio Casca Grossa: +VIG na RD
    if (bonusId === 'bloqueio-casca-grossa') {
      mechanics = {
        ...mechanics,
        damageReduction: vigor,
      };
    }

    // Mapeia source para tipo de efeito
    const sourceType = mapSourceToEffectSource(bonus.source);

    const effect: UnifiedEffect = {
      id: `conditional-${bonusId}`,
      name: bonus.name,
      description: `${bonus.condition}`,
      source: sourceType,
      sourceId: bonusId,
      sourceName: bonus.name,
      mechanics,
      isActive: true, // Já está ativo (foi ativado pelo usuário)
      isToggleable: true,
      duration: { type: 'until_removed' },
    };

    effects.push(effect);
  }

  return effects;
}

/**
 * Mapeia source do bônus condicional para EffectSource
 */
function mapSourceToEffectSource(source: ConditionalBonusDefinition['source']): 'general_power' | 'class_ability' | 'paranormal_power' | 'origin' {
  switch (source) {
    case 'general_power': return 'general_power';
    case 'ability': return 'class_ability';
    case 'paranormal': return 'paranormal_power';
    case 'origin': return 'origin';
    default: return 'general_power';
  }
}

/**
 * Lista todos os bônus condicionais disponíveis para um personagem
 * Útil para exibir no painel de bônus condicionais
 */
export function getAvailableConditionalBonuses(
  context: {
    generalPowers: string[];
    abilities: string[];
    classTrack: string | null;
    nex: number;
  }
): ConditionalBonusDefinition[] {
  return CONDITIONAL_BONUS_CATALOG.filter(bonus => 
    checkBonusRequirements(bonus, context)
  );
}

/**
 * Formata os efeitos de um bônus para exibição na UI
 */
export function formatBonusEffects(bonus: ConditionalBonusDefinition): string[] {
  const effects: string[] = [];
  const { mechanics } = bonus;

  if (mechanics.attackBonus) {
    effects.push(`${mechanics.attackBonus > 0 ? '+' : ''}${mechanics.attackBonus} ataque`);
  }
  if (mechanics.damageBonus) {
    effects.push(`${mechanics.damageBonus > 0 ? '+' : ''}${mechanics.damageBonus} dano`);
  }
  if (mechanics.defenseBonus) {
    effects.push(`${mechanics.defenseBonus > 0 ? '+' : ''}${mechanics.defenseBonus} Defesa`);
  }
  if (mechanics.criticalMarginBonus) {
    effects.push(`+${mechanics.criticalMarginBonus} margem crítica`);
  }
  if (mechanics.initiativeBonus) {
    effects.push(`+${mechanics.initiativeBonus} iniciativa`);
  }
  if (mechanics.extraDamageDice) {
    effects.push(`+${mechanics.extraDamageDice} dano`);
  }
  if (mechanics.specialEffects) {
    effects.push(...mechanics.specialEffects);
  }

  return effects;
}
