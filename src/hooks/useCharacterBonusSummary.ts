/**
 * useCharacterBonusSummary - Hook que consolida todos os bônus ativos do personagem
 * 
 * Integra múltiplas fontes:
 * - useDefenseBonuses (defesa e resistências)
 * - useParanormalEffects (poderes paranormais)
 * - Poderes gerais (combate, perícias, etc.)
 * - Habilidades de classe
 * 
 * Suporta bônus condicionais que podem ser ativados/desativados manualmente
 */

import { useMemo } from 'react';
import { useDefenseBonuses, DefenseBonusBreakdown, ResistanceBonusBreakdown, ActiveRitualForDefense } from './useDefenseBonuses';
import { useParanormalEffects, ParanormalEffects } from './useParanormalEffects';
import { useClassPowerBonuses } from './useClassPowerBonuses';
import type { ActiveClassPower, WeaponCategory, ProtectionCategory } from '@/lib/class-powers/types';

// Interface para breakdown genérico de bônus
export interface BonusBreakdown {
  source: string;        // Nome da fonte
  value: number | string; // Valor do bônus (número ou dado)
  type: 'origin' | 'ability' | 'general_power' | 'paranormal' | 'equipment' | 'ritual' | 'skill_training';
  conditional?: string;  // Condição se houver
  active: boolean;       // Se está ativo
  toggleable?: boolean;  // Se pode ser ativado/desativado manualmente
  toggleId?: string;     // ID único para toggle
  excluded?: boolean;    // Se foi excluído por regra de não acúmulo
  excludedReason?: string; // Motivo da exclusão
}

// Interface para bônus condicional toggleável
export interface ConditionalBonus {
  id: string;           // ID único do bônus
  name: string;         // Nome do bônus (ex: "Fanático")
  condition: string;    // Condição (ex: "HP < 50%")
  active: boolean;      // Se está ativado manualmente
  effects: string[];    // Lista de efeitos (ex: ["+2 ataque", "+2 dano"])
  source: 'general_power' | 'ability' | 'paranormal' | 'origin';
}

// Lista de bônus condicionais conhecidos
export const CONDITIONAL_BONUSES: Omit<ConditionalBonus, 'active'>[] = [
  {
    id: 'fanatico',
    name: 'Fanático',
    condition: 'HP < 50%',
    effects: ['+2 ataque', '+2 dano'],
    source: 'general_power',
  },
  {
    id: 'ataque-poderoso',
    name: 'Ataque Poderoso',
    condition: 'Ação de ataque (-2 ataque)',
    effects: ['+5 dano'],
    source: 'general_power',
  },
  {
    id: 'foco-arma',
    name: 'Foco em Arma',
    condition: 'Com arma escolhida',
    effects: ['+2 ataque'],
    source: 'general_power',
  },
  // === HABILIDADES ATIVAS DE COMBATE ===
  {
    id: 'combate-defensivo',
    name: 'Combate Defensivo',
    condition: 'Ação agredir (até próximo turno)',
    effects: ['-5 ataque', '+5 Defesa'],
    source: 'ability',
  },
  {
    id: 'sentido-tatico',
    name: 'Sentido Tático',
    condition: 'Gasta 2 PE + ação movimento (cena)',
    effects: ['+INT Defesa', '+INT resistências'],
    source: 'ability',
  },
  // === HABILIDADES DE TRILHA ===
  {
    id: 'bloqueio-casca-grossa',
    name: 'Bloqueio (Casca Grossa)',
    condition: 'Ao bloquear um ataque',
    effects: ['+VIG na RD do bloqueio'],
    source: 'ability',
  },
  // === BÔNUS CONDICIONAIS AVANÇADOS (Fase 4) ===
  {
    id: 'assassinar',
    name: 'Assassinar',
    condition: '3 PE + ação movimento (próximo Ataque Furtivo)',
    effects: ['Dados do Ataque Furtivo são somados 2x', 'Dano dobrado'],
    source: 'ability',
  },
  {
    id: 'potencia-maxima',
    name: 'Potência Máxima',
    condition: 'Ao usar Ataque Especial corpo a corpo',
    effects: ['Bônus numéricos do Ataque Especial são 2x'],
    source: 'ability',
  },
  {
    id: 'atirar-matar',
    name: 'Atirar para Matar',
    condition: 'Acerto crítico com arma de fogo',
    effects: ['Dano máximo (não rola dados)'],
    source: 'ability',
  },
];

// Interface para bônus de combate
export interface CombatBonuses {
  attack: { total: number; breakdown: BonusBreakdown[] };
  damage: { total: number; extraDice: string[]; breakdown: BonusBreakdown[] };
  criticalMargin: { total: number; breakdown: BonusBreakdown[] };
  initiative: { total: number; breakdown: BonusBreakdown[] };
}

// Interface para redução de dano
export interface DamageReduction {
  physical: { total: number; breakdown: BonusBreakdown[] };
  paranormal: { total: number; breakdown: BonusBreakdown[] };
}

// Interface para resistências a elementos/efeitos
export interface EffectResistances {
  poison: number;
  disease: number;
  mental: number;
  breakdown: BonusBreakdown[];
}

// Interface para bônus de perícias
export interface SkillBonuses {
  [skillName: string]: { total: number; breakdown: BonusBreakdown[] };
}

// Interface principal do resumo de bônus
export interface BonusSummary {
  defense: { total: number; breakdown: DefenseBonusBreakdown[] };
  resistances: {
    fortitude: { total: number; breakdown: ResistanceBonusBreakdown[] };
    reflexos: { total: number; breakdown: ResistanceBonusBreakdown[] };
    vontade: { total: number; breakdown: ResistanceBonusBreakdown[] };
  };
  combat: CombatBonuses;
  damageReduction: DamageReduction;
  effectResistances: EffectResistances;
  skills: SkillBonuses;
  special: BonusBreakdown[]; // Efeitos especiais não numéricos
  paranormalEffects: ParanormalEffects;
  conditionalBonuses: ConditionalBonus[]; // Bônus condicionais disponíveis
  // Stats calculados
  hpBonus: number;
  peBonus: number;
  // Hooks internos expostos para evitar chamadas duplicadas
  defenseBonuses: import('./useDefenseBonuses').DefenseBonuses;
  // Novo: Bônus do sistema unificado de poderes de classe (Fase 5)
  classPowerBonuses?: import('./useClassPowerBonuses').ClassPowerBonusResult;
}

// Props do hook
interface UseCharacterBonusSummaryProps {
  origin: string;
  abilities: string[];
  generalPowers?: Array<{ id: string; name: string; description?: string; category?: string }>;
  paranormalPowers?: Array<{ id: string; name: string; element: string; description: string }>;
  inventory?: Array<{ id?: string; name: string; isEquipped?: boolean; itemType?: string; armorType?: string }>;
  nex: number;
  elementalAffinity?: string | null;
  affinityActive?: boolean;
  activeConditionalBonuses?: string[]; // IDs dos bônus condicionais ativos
  activeRituals?: ActiveRitualForDefense[]; // Rituais ativos para cálculo de defesa
  skills?: Record<string, number>; // Perícias com nível de treinamento (0-3)
  intellect?: number; // Intelecto do personagem (para Sentido Tático)
  vigor?: number; // Vigor do personagem (para Casca Grossa no bloqueio)
  // Novos campos para sistema de poderes de classe unificado (Fase 5)
  classId?: string; // Classe do personagem
  classTrack?: string | null; // Trilha ativa
  classPowers?: (string | ActiveClassPower)[]; // Poderes de classe (IDs)
  strength?: number; // Força
  agility?: number; // Agilidade
  presence?: number; // Presença
  equippedWeaponType?: WeaponCategory; // Tipo de arma equipada
  equippedProtectionType?: ProtectionCategory; // Tipo de proteção
  inCombat?: boolean; // Se está em combate
}

/**
 * Hook que consolida todos os bônus do personagem em uma única estrutura
 */
export function useCharacterBonusSummary({
  origin,
  abilities,
  generalPowers = [],
  paranormalPowers = [],
  inventory = [],
  nex,
  elementalAffinity,
  affinityActive = false,
  activeConditionalBonuses = [],
  activeRituals = [],
  skills = {},
  intellect = 1,
  vigor = 1,
  // Novos campos para sistema unificado
  classId,
  classTrack,
  classPowers = [],
  strength = 1,
  agility = 1,
  presence = 1,
  equippedWeaponType,
  equippedProtectionType,
  inCombat = false,
}: UseCharacterBonusSummaryProps): BonusSummary {
  // Usa hooks existentes
  const defenseBonuses = useDefenseBonuses({ 
    origin, 
    abilities, 
    generalPowers, 
    inventory, 
    activeRituals, 
    skills, 
    activeConditionalBonuses,
    intellect,
  });
  const paranormalEffects = useParanormalEffects({ 
    powers: paranormalPowers, 
    nex, 
    elementalAffinity: elementalAffinity as any, 
    affinityActive 
  });
  
  // Novo: Usa hook de poderes de classe unificado
  const classPowerBonuses = useClassPowerBonuses({
    nex,
    classId: classId || '',
    classTrack,
    attributes: { strength, agility, vigor, intellect, presence },
    classPowers,
    abilities,
    equippedWeaponType,
    equippedProtectionType,
    inCombat,
    inInvestigation: false,
    isFavoriteWeapon: false, // TODO: detectar arma favorita do inventário
  });

  // Helper para verificar se um bônus condicional está ativo
  const isConditionalActive = (id: string) => activeConditionalBonuses.includes(id);

  return useMemo(() => {
    // Inicializa estruturas com bônus base do sistema unificado de poderes de classe
    const combat: CombatBonuses = {
      attack: { 
        total: classPowerBonuses.totals.attack.general + classPowerBonuses.totals.attack.melee, 
        breakdown: [] 
      },
      damage: { 
        total: classPowerBonuses.totals.damage.general, 
        extraDice: [...classPowerBonuses.extraDamageDice], 
        breakdown: [] 
      },
      criticalMargin: { 
        total: classPowerBonuses.totals.criticalMargin, 
        breakdown: [] 
      },
      initiative: { 
        total: classPowerBonuses.totals.initiative, 
        breakdown: [] 
      },
    };

    const damageReduction: DamageReduction = {
      physical: { 
        total: classPowerBonuses.totals.damageResistance, 
        breakdown: [] 
      },
      paranormal: { 
        total: classPowerBonuses.totals.paranormalResistance, 
        breakdown: [] 
      },
    };

    const effectResistances: EffectResistances = {
      poison: 0,
      disease: 0,
      mental: classPowerBonuses.trackBonuses.mentalDamageResistance,
      breakdown: [],
    };

    // Inicializa perícias com bônus do sistema unificado
    const skills: SkillBonuses = {};
    for (const [skill, bonus] of Object.entries(classPowerBonuses.skillBonuses)) {
      if (bonus > 0) {
        skills[skill] = { 
          total: bonus, 
          breakdown: [{
            source: 'Poderes de Classe',
            value: bonus,
            type: 'ability' as const,
            active: true,
          }]
        };
      }
    }
    
    const special: BonusBreakdown[] = [];
    
    // Adiciona breakdown de trilha aos efeitos especiais
    for (const item of classPowerBonuses.breakdown.track) {
      special.push({
        source: item.source,
        value: item.effects.join(', '),
        type: 'ability' as const,
        active: true,
      });
    }
    
    // Adiciona flags especiais do sistema unificado
    if (classPowerBonuses.unarmedDamage) {
      special.push({
        source: 'Artista Marcial',
        value: `Dano desarmado: ${classPowerBonuses.unarmedDamage}`,
        type: 'ability' as const,
        active: true,
      });
    }
    
    if (classPowerBonuses.canUseHPAsPE) {
      special.push({
        source: 'Poder do Flagelo',
        value: 'Pode usar PV como PE para rituais',
        type: 'ability' as const,
        active: true,
      });
    }
    
    if (classPowerBonuses.canUseOccultismAsAttack) {
      special.push({
        source: 'Lâmina Maldita',
        value: 'Pode usar Ocultismo em ataques corpo a corpo',
        type: 'ability' as const,
        active: true,
      });
    }
    
    // Adiciona bônus de iniciativa ao breakdown
    if (classPowerBonuses.totals.initiative > 0) {
      combat.initiative.breakdown.push({
        source: 'Trilha de Classe',
        value: classPowerBonuses.totals.initiative,
        type: 'ability' as const,
        active: true,
      });
    }
    
    // Adiciona bônus de margem crítica ao breakdown  
    if (classPowerBonuses.totals.criticalMargin > 0) {
      combat.criticalMargin.breakdown.push({
        source: 'Trilha de Classe',
        value: classPowerBonuses.totals.criticalMargin,
        type: 'ability' as const,
        active: true,
      });
    }

    // Normaliza abilities para comparação
    const normalizedAbilities = abilities.map(a => 
      typeof a === 'string' ? a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : ''
    );

    const hasAbility = (name: string) => {
      const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return normalizedAbilities.some(a => a.includes(normalized)) || 
             abilities.some(a => a.toLowerCase().includes(name.toLowerCase()));
    };

    const hasPower = (id: string) => generalPowers.some(p => p.id === id);

    // === CONSTRÓI LISTA DE BÔNUS CONDICIONAIS DISPONÍVEIS ===
    const conditionalBonuses: ConditionalBonus[] = [];
    
    // Foco em Arma (condicional - só com arma escolhida)
    if (hasPower('foco-arma')) {
      const isActive = isConditionalActive('foco-arma');
      conditionalBonuses.push({
        id: 'foco-arma',
        name: 'Foco em Arma',
        condition: 'Com arma escolhida',
        active: isActive,
        effects: ['+2 ataque'],
        source: 'general_power',
      });
      combat.attack.breakdown.push({
        source: 'Foco em Arma',
        value: 2,
        type: 'general_power',
        conditional: 'com arma escolhida',
        active: isActive,
        toggleable: true,
        toggleId: 'foco-arma',
      });
      if (isActive) {
        combat.attack.total += 2;
      }
    }

    // Ataque Poderoso (condicional - escolha por ação)
    if (hasPower('ataque-poderoso')) {
      const isActive = isConditionalActive('ataque-poderoso');
      conditionalBonuses.push({
        id: 'ataque-poderoso',
        name: 'Ataque Poderoso',
        condition: 'Ação de ataque (-2 ataque)',
        active: isActive,
        effects: ['+5 dano', '-2 ataque'],
        source: 'general_power',
      });
      combat.damage.breakdown.push({
        source: 'Ataque Poderoso',
        value: 5,
        type: 'general_power',
        conditional: 'por -2 no ataque',
        active: isActive,
        toggleable: true,
        toggleId: 'ataque-poderoso',
      });
      if (isActive) {
        combat.damage.total += 5;
        combat.attack.total -= 2; // Penalidade
      }
    }

    // Fanático: +2 ataque e dano (PV < 50%)
    if (hasPower('fanatico')) {
      const isActive = isConditionalActive('fanatico');
      conditionalBonuses.push({
        id: 'fanatico',
        name: 'Fanático',
        condition: 'HP < 50%',
        active: isActive,
        effects: ['+2 ataque', '+2 dano'],
        source: 'general_power',
      });
      combat.attack.breakdown.push({
        source: 'Fanático',
        value: 2,
        type: 'general_power',
        conditional: 'com menos de 50% PV',
        active: isActive,
        toggleable: true,
        toggleId: 'fanatico',
      });
      combat.damage.breakdown.push({
        source: 'Fanático',
        value: 2,
        type: 'general_power',
        conditional: 'com menos de 50% PV',
        active: isActive,
        toggleable: true,
        toggleId: 'fanatico',
      });
      if (isActive) {
        combat.attack.total += 2;
        combat.damage.total += 2;
      }
    }

    // === HABILIDADES ATIVAS DE COMBATE (toggleáveis) ===
    
    // Combate Defensivo: +5 Defesa, -5 ataque (habilidade de classe)
    if (hasAbility('combate defensivo')) {
      const isActive = isConditionalActive('combate-defensivo');
      conditionalBonuses.push({
        id: 'combate-defensivo',
        name: 'Combate Defensivo',
        condition: 'Ação agredir (até próximo turno)',
        active: isActive,
        effects: ['+5 Defesa', '-5 ataque'],
        source: 'ability',
      });
      // Penalidade de ataque quando ativo
      if (isActive) {
        combat.attack.breakdown.push({
          source: 'Combate Defensivo',
          value: -5,
          type: 'ability',
          conditional: 'modo defensivo ativo',
          active: true,
          toggleable: true,
          toggleId: 'combate-defensivo',
        });
        combat.attack.total -= 5;
      }
    }

    // Sentido Tático: +INT Defesa e resistências (habilidade de classe)
    if (hasAbility('sentido tatico')) {
      const isActive = isConditionalActive('sentido-tatico');
      conditionalBonuses.push({
        id: 'sentido-tatico',
        name: 'Sentido Tático',
        condition: '2 PE + ação movimento (cena)',
        active: isActive,
        effects: [`+${intellect} Defesa`, `+${intellect} resistências`],
        source: 'ability',
      });
    }

    // === HABILIDADES DE TRILHA - BÔNUS PASSIVOS ===

    // Iniciativa Aprimorada (Operações Especiais): +5 Iniciativa
    if (hasAbility('iniciativa aprimorada')) {
      combat.initiative.breakdown.push({
        source: 'Iniciativa Aprimorada',
        value: 5,
        type: 'ability',
        active: true,
      });
      combat.initiative.total += 5;
    }

    // Técnica Letal (Guerreiro): +2 margem de ameaça corpo a corpo
    if (hasAbility('tecnica letal')) {
      combat.criticalMargin.breakdown.push({
        source: 'Técnica Letal',
        value: 2,
        type: 'ability',
        conditional: 'corpo a corpo',
        active: true,
      });
      combat.criticalMargin.total += 2;
    }

    // Mira de Elite (Atirador de Elite): +INT dano com armas de fogo (balas longas)
    if (hasAbility('mira de elite')) {
      combat.damage.breakdown.push({
        source: 'Mira de Elite',
        value: `+${intellect}`,
        type: 'ability',
        conditional: 'armas de fogo (balas longas)',
        active: true,
      });
    }

    // Gatuno (Infiltrador): +5 Atletismo e Crime
    if (hasAbility('gatuno')) {
      ['atletismo', 'crime'].forEach(skill => {
        if (!skills[skill]) skills[skill] = { total: 0, breakdown: [] };
        skills[skill].breakdown.push({
          source: 'Gatuno',
          value: 5,
          type: 'ability',
          active: true,
        });
        skills[skill].total += 5;
      });
    }

    // Mente Sã (Intuitivo): +5 resistência paranormal (em testes)
    if (hasAbility('mente sa')) {
      effectResistances.breakdown.push({
        source: 'Mente Sã',
        value: 5,
        type: 'ability',
        conditional: 'efeitos paranormais',
        active: true,
      });
    }

    // Inabalável (Intuitivo): resistência a dano mental 10
    if (hasAbility('inabalavel')) {
      effectResistances.mental = Math.max(effectResistances.mental, 10);
      effectResistances.breakdown.push({
        source: 'Inabalável',
        value: 10,
        type: 'ability',
        conditional: 'dano mental',
        active: true,
      });
    }

    // Casca Grossa (Tropa de Choque): +VIG na RD ao bloquear
    // Regra oficial: "quando faz um bloqueio, soma seu Vigor na resistência a dano recebida"
    if (hasAbility('casca grossa') || hasAbility('casca-grossa')) {
      const isActive = isConditionalActive('bloqueio-casca-grossa');
      conditionalBonuses.push({
        id: 'bloqueio-casca-grossa',
        name: 'Bloqueio (Casca Grossa)',
        condition: 'Ao bloquear um ataque',
        active: isActive,
        effects: [`+${vigor} RD no bloqueio`],
        source: 'ability',
      });
      if (isActive) {
        damageReduction.physical.breakdown.push({
          source: 'Casca Grossa (Bloqueio)',
          value: vigor,
          type: 'ability',
          conditional: 'durante bloqueio',
          active: true,
        });
        damageReduction.physical.total += vigor;
      }
      
      // Também registra como efeito especial para exibição
      special.push({
        source: 'Casca Grossa',
        value: `+1 PV por 5% NEX, +${vigor} RD ao bloquear`,
        type: 'ability',
        active: true,
      });
    }

    // Inquebrável (Tropa de Choque): +5 Defesa, RD 5 quando machucado
    if (hasAbility('inquebravel')) {
      const isActive = isConditionalActive('inquebravel');
      conditionalBonuses.push({
        id: 'inquebravel',
        name: 'Inquebrável',
        condition: 'PV < 50% (machucado)',
        active: isActive,
        effects: ['+5 Defesa', 'RD 5'],
        source: 'ability',
      });
      if (isActive) {
        damageReduction.physical.breakdown.push({
          source: 'Inquebrável',
          value: 5,
          type: 'ability',
          conditional: 'quando machucado',
          active: true,
        });
        damageReduction.physical.total += 5;
      }
    }

    // Disparo Letal (Atirador de Elite): +2 margem de ameaça após mirar
    if (hasAbility('disparo letal')) {
      const isActive = isConditionalActive('disparo-letal');
      conditionalBonuses.push({
        id: 'disparo-letal',
        name: 'Disparo Letal',
        condition: 'Após ação mirar (1 PE)',
        active: isActive,
        effects: ['+2 margem de ameaça'],
        source: 'ability',
      });
      if (isActive) {
        combat.criticalMargin.breakdown.push({
          source: 'Disparo Letal',
          value: 2,
          type: 'ability',
          conditional: 'após mirar',
          active: true,
        });
        combat.criticalMargin.total += 2;
      }
    }

    // Ataque Furtivo (Infiltrador): dados extras de dano que escalam com NEX
    // Regra oficial: +1d6 (NEX 10%), +2d6 (NEX 40%), +3d6 (NEX 65%), +4d6 (NEX 99%)
    if (hasAbility('ataque furtivo') || hasAbility('ataque-furtivo-trilha')) {
      const isActive = isConditionalActive('ataque-furtivo');
      
      // Calcula quantidade de dados baseado no NEX (regra oficial do Infiltrador)
      const calculateSneakAttackDice = (characterNex: number): number => {
        if (characterNex >= 99) return 4; // NEX 99%: +4d6
        if (characterNex >= 65) return 3; // NEX 65%: +3d6
        if (characterNex >= 40) return 2; // NEX 40%: +2d6
        return 1; // NEX 10%: +1d6
      };
      
      const sneakAttackDice = calculateSneakAttackDice(nex);
      const extraDice = `+${sneakAttackDice}d6`;
      
      conditionalBonuses.push({
        id: 'ataque-furtivo',
        name: 'Ataque Furtivo',
        condition: 'Alvo desprevenido/flanqueado',
        active: isActive,
        effects: [`${extraDice} dano`],
        source: 'ability',
      });
      if (isActive) {
        combat.damage.extraDice.push(extraDice);
        combat.damage.breakdown.push({
          source: 'Ataque Furtivo',
          value: extraDice,
          type: 'ability',
          conditional: 'alvo desprevenido/flanqueado',
          active: true,
        });
      }
    }

    // === BÔNUS CONDICIONAIS AVANÇADOS (Fase 4) ===

    // Assassinar (Infiltrador, NEX 65%): Dobra dados do Ataque Furtivo
    // Regra oficial: Gasta 3 PE + ação movimento. Próximo Ataque Furtivo tem dados somados 2x
    if (hasAbility('assassinar')) {
      const isActive = isConditionalActive('assassinar');
      
      // Calcula dados do Ataque Furtivo para dobrar
      const calculateSneakAttackDiceForAssassinate = (characterNex: number): number => {
        if (characterNex >= 99) return 4;
        if (characterNex >= 65) return 3;
        if (characterNex >= 40) return 2;
        return 1;
      };
      
      const baseDice = calculateSneakAttackDiceForAssassinate(nex);
      const doubleDice = baseDice * 2; // Dobra os dados
      const assassinateDice = `+${doubleDice}d6`;
      
      conditionalBonuses.push({
        id: 'assassinar',
        name: 'Assassinar',
        condition: '3 PE + ação movimento (próximo Ataque Furtivo)',
        active: isActive,
        effects: [`${assassinateDice} dano (2x)`, 'Dano dobrado'],
        source: 'ability',
      });
      
      // Se Assassinar está ativo, adiciona dados extras (além dos do Ataque Furtivo base)
      if (isActive) {
        // Adiciona dados EXTRAS (a segunda metade do dobro)
        const extraFromAssassinate = `+${baseDice}d6`;
        combat.damage.extraDice.push(extraFromAssassinate);
        combat.damage.breakdown.push({
          source: 'Assassinar',
          value: extraFromAssassinate,
          type: 'ability',
          conditional: 'dados extras (dobrado)',
          active: true,
        });
        
        // Registra o multiplicador de dano
        special.push({
          source: 'Assassinar',
          value: 'Dano do Ataque Furtivo dobrado',
          type: 'ability',
          active: true,
        });
      }
    }

    // Potência Máxima (Guerreiro, NEX 99%): Dobra bônus do Ataque Especial corpo a corpo
    // Regra oficial: Todos os bônus numéricos do Ataque Especial são dobrados
    if (hasAbility('potência máxima') || hasAbility('potencia maxima') || hasAbility('potencia-maxima')) {
      const isActive = isConditionalActive('potencia-maxima');
      
      conditionalBonuses.push({
        id: 'potencia-maxima',
        name: 'Potência Máxima',
        condition: 'Ao usar Ataque Especial corpo a corpo',
        active: isActive,
        effects: ['Bônus numéricos 2x', 'Exemplo: +5/+15 → +10/+30'],
        source: 'ability',
      });
      
      if (isActive) {
        // Marca como ativo - o multiplicador será aplicado no sistema de ataque
        special.push({
          source: 'Potência Máxima',
          value: 'Bônus do Ataque Especial corpo a corpo são DOBRADOS',
          type: 'ability',
          active: true,
        });
        
        // Registra o multiplicador no breakdown de dano
        combat.damage.breakdown.push({
          source: 'Potência Máxima',
          value: 'x2 bônus',
          type: 'ability',
          conditional: 'Ataque Especial corpo a corpo',
          active: true,
        });
      }
    }

    // Atirar para Matar (Atirador de Elite, NEX 99%): Dano máximo em críticos
    // Regra oficial: Acerto crítico com arma de fogo = dano máximo (não rola dados)
    if (hasAbility('atirar para matar') || hasAbility('atirar-matar')) {
      const isActive = isConditionalActive('atirar-matar');
      
      conditionalBonuses.push({
        id: 'atirar-matar',
        name: 'Atirar para Matar',
        condition: 'Acerto crítico com arma de fogo',
        active: isActive,
        effects: ['Dano máximo (não rola dados)'],
        source: 'ability',
      });
      
      if (isActive) {
        // Marca como ativo - o sistema de dano deve usar valor máximo
        special.push({
          source: 'Atirar para Matar',
          value: 'Dano MÁXIMO em crítico (arma de fogo)',
          type: 'ability',
          active: true,
        });
        
        combat.damage.breakdown.push({
          source: 'Atirar para Matar',
          value: 'MAX',
          type: 'ability',
          conditional: 'crítico com arma de fogo',
          active: true,
        });
      }
    }

    if (hasPower('iniciativa-melhorada')) {
      combat.initiative.breakdown.push({
        source: 'Iniciativa Melhorada',
        value: 5,
        type: 'general_power',
        active: true,
      });
      combat.initiative.total += 5;
    }

    // Dureza Natural: RD 2 (não paranormal)
    if (hasPower('dureza-natural')) {
      damageReduction.physical.breakdown.push({
        source: 'Dureza Natural',
        value: 2,
        type: 'general_power',
        active: true,
      });
      damageReduction.physical.total += 2;
    }

    // Sangue Resistente: RD 5 paranormal
    if (hasPower('sangue-resistente')) {
      damageReduction.paranormal.breakdown.push({
        source: 'Sangue Resistente',
        value: 5,
        type: 'general_power',
        active: true,
      });
      damageReduction.paranormal.total += 5;
    }

    // Constituição Forte: +2 Fortitude, Res. veneno/doença 5
    if (hasPower('constituicao-forte')) {
      effectResistances.poison = 5;
      effectResistances.disease = 5;
      effectResistances.breakdown.push({
        source: 'Constituição Forte',
        value: 5,
        type: 'general_power',
        conditional: 'veneno e doença',
        active: true,
      });
    }

    // Resistência Mental: +2 Vontade, Res. dano mental 5
    if (hasPower('resistencia-mental')) {
      effectResistances.mental = 5;
      effectResistances.breakdown.push({
        source: 'Resistência Mental',
        value: 5,
        type: 'general_power',
        conditional: 'dano mental',
        active: true,
      });
    }

    // === BÔNUS DE PERÍCIAS ===

    // Carismático: +2 perícias PRE
    if (hasPower('carismatico')) {
      const preSkills = ['diplomacia', 'enganação', 'intimidação', 'intuição', 'vontade'];
      preSkills.forEach(skill => {
        if (!skills[skill]) skills[skill] = { total: 0, breakdown: [] };
        skills[skill].breakdown.push({
          source: 'Carismático',
          value: 2,
          type: 'general_power',
          active: true,
        });
        skills[skill].total += 2;
      });
    }

    // Furtivo: +2 Furtividade
    if (hasPower('furtivo')) {
      if (!skills['furtividade']) skills['furtividade'] = { total: 0, breakdown: [] };
      skills['furtividade'].breakdown.push({
        source: 'Furtivo',
        value: 2,
        type: 'general_power',
        active: true,
      });
      skills['furtividade'].total += 2;
    }

    // Investigador Nato: +2 Investigação e Percepção
    if (hasPower('investigador-nato')) {
      ['investigação', 'percepção'].forEach(skill => {
        if (!skills[skill]) skills[skill] = { total: 0, breakdown: [] };
        skills[skill].breakdown.push({
          source: 'Investigador Nato',
          value: 2,
          type: 'general_power',
          active: true,
        });
        skills[skill].total += 2;
      });
    }

    // Negociador: +2 Diplomacia e Enganação
    if (hasPower('negociador')) {
      ['diplomacia', 'enganação'].forEach(skill => {
        if (!skills[skill]) skills[skill] = { total: 0, breakdown: [] };
        skills[skill].breakdown.push({
          source: 'Negociador',
          value: 2,
          type: 'general_power',
          active: true,
        });
        skills[skill].total += 2;
      });
    }

    // Intimidador: +5 Intimidação
    if (hasPower('intimidador')) {
      if (!skills['intimidação']) skills['intimidação'] = { total: 0, breakdown: [] };
      skills['intimidação'].breakdown.push({
        source: 'Intimidador',
        value: 5,
        type: 'general_power',
        active: true,
      });
      skills['intimidação'].total += 5;
    }

    // === HABILIDADES DE CLASSE ===

    // Golpe Pesado: +1 dado de dano corpo a corpo
    if (hasAbility('golpe pesado')) {
      combat.damage.extraDice.push('+1d');
      combat.damage.breakdown.push({
        source: 'Golpe Pesado',
        value: '+1d',
        type: 'ability',
        conditional: 'corpo a corpo',
        active: true,
      });
    }

    // Tiro Certeiro: +AGI em dano à distância
    if (hasAbility('tiro certeiro')) {
      combat.damage.breakdown.push({
        source: 'Tiro Certeiro',
        value: '+AGI',
        type: 'ability',
        conditional: 'à distância',
        active: true,
      });
    }

    // =====================================================
    // BÔNUS PASSIVOS DO ESPECIALISTA (via Sistema Unificado)
    // =====================================================
    // Estes bônus agora são calculados pelo power-effects-engine
    // através do hook useClassPowerBonuses.
    // Os valores são automaticamente incluídos nos totais iniciais
    // de combat.damage e skills.
    
    // Adiciona breakdown visual para Balística Avançada (se ativo via sistema unificado)
    if (classPowerBonuses.totals.damage.firearm > 0) {
      combat.damage.breakdown.push({
        source: 'Balística Avançada',
        value: classPowerBonuses.totals.damage.firearm,
        type: 'ability',
        conditional: 'armas de fogo',
        active: true,
      });
    }

    // Adiciona breakdown visual para Ninja Urbano (se ativo via sistema unificado)
    if (classPowerBonuses.totals.damage.melee > 0 || classPowerBonuses.totals.damage.ranged > 0) {
      const ninjaBonus = classPowerBonuses.totals.damage.melee || classPowerBonuses.totals.damage.ranged;
      if (classPowerBonuses.hasPower('ninja-urbano')) {
        combat.damage.breakdown.push({
          source: 'Ninja Urbano',
          value: ninjaBonus,
          type: 'ability',
          conditional: 'armas táticas (exceto armas de fogo)',
          active: true,
        });
      }
    }
    
    // Adiciona breakdown visual para Hacker (se ativo via sistema unificado)
    if (classPowerBonuses.skillBonuses['tecnologia'] && classPowerBonuses.skillBonuses['tecnologia'] > 0) {
      if (!skills['tecnologia']) {
        skills['tecnologia'] = { total: 0, breakdown: [] };
      }
      // Verifica se já não foi adicionado pelo sistema unificado
      const alreadyAdded = skills['tecnologia'].breakdown.some(b => b.source === 'Hacker');
      if (!alreadyAdded && classPowerBonuses.hasPower('hacker')) {
        skills['tecnologia'].breakdown.push({
          source: 'Hacker',
          value: classPowerBonuses.skillBonuses['tecnologia'],
          type: 'ability',
          conditional: 'invadir sistemas',
          active: true,
        });
        skills['tecnologia'].total += classPowerBonuses.skillBonuses['tecnologia'];
      }
    }

    // === EFEITOS PARANORMAIS ===

    // Golpe de Sorte: margem de crítico
    if (paranormalEffects.threatMarginBonus > 0) {
      combat.criticalMargin.breakdown.push({
        source: 'Golpe de Sorte',
        value: paranormalEffects.threatMarginBonus,
        type: 'paranormal',
        active: true,
      });
      combat.criticalMargin.total += paranormalEffects.threatMarginBonus;
    }

    // Adiciona bônus de defesa paranormal ao breakdown se existir
    if (paranormalEffects.defenseBonus > 0) {
      // Será somado ao total na estrutura defense abaixo
    }

    // Adiciona perícias paranormais
    Object.entries(paranormalEffects.skillBonuses).forEach(([skill, bonus]) => {
      if (!skills[skill]) skills[skill] = { total: 0, breakdown: [] };
      skills[skill].breakdown.push({
        source: 'Poder Paranormal',
        value: bonus,
        type: 'paranormal',
        active: true,
      });
      skills[skill].total += bonus;
    });

    // Efeitos especiais paranormais
    paranormalEffects.activeEffects.forEach(effect => {
      // Evita duplicar efeitos já processados
      if (!effect.includes('Defesa') && !effect.includes('Fortitude') && 
          !effect.includes('PV') && !effect.includes('PE')) {
        special.push({
          source: effect.split(':')[0] || 'Paranormal',
          value: effect.split(':')[1]?.trim() || effect,
          type: 'paranormal',
          active: true,
        });
      }
    });

    // Monta o resumo final
    return {
      defense: {
        total: defenseBonuses.totalBonus + paranormalEffects.defenseBonus,
        breakdown: [
          ...defenseBonuses.breakdown,
          ...(paranormalEffects.defenseBonus > 0 ? [{
            source: 'Poderes Paranormais',
            type: 'paranormal' as const,
            bonus: paranormalEffects.defenseBonus,
            active: true,
          }] : []),
        ],
      },
      resistances: {
        fortitude: {
          total: defenseBonuses.resistances.fortitude + paranormalEffects.fortitudeBonus,
          breakdown: defenseBonuses.resistances.breakdown.filter(b => b.fortitude > 0),
        },
        reflexos: {
          total: defenseBonuses.resistances.reflexos + paranormalEffects.reflexBonus,
          breakdown: defenseBonuses.resistances.breakdown.filter(b => b.reflexos > 0),
        },
        vontade: {
          total: defenseBonuses.resistances.vontade + paranormalEffects.willpowerBonus,
          breakdown: defenseBonuses.resistances.breakdown.filter(b => b.vontade > 0),
        },
      },
      combat,
      damageReduction,
      effectResistances,
      skills,
      special,
      paranormalEffects,
      conditionalBonuses,
      hpBonus: paranormalEffects.hpBonus + classPowerBonuses.totals.bonusHP,
      peBonus: paranormalEffects.peBonus,
      // Expõe hooks internos para evitar chamadas duplicadas
      defenseBonuses,
      // Novo: Expõe bônus do sistema unificado de poderes de classe
      classPowerBonuses,
    };
  }, [defenseBonuses, paranormalEffects, abilities, generalPowers, activeConditionalBonuses, isConditionalActive, classPowerBonuses]);
}

/**
 * Função auxiliar para verificar se há bônus ativos em uma categoria
 */
export function hasBonusesInCategory(summary: BonusSummary, category: keyof BonusSummary): boolean {
  switch (category) {
    case 'defense':
      return summary.defense.total > 0;
    case 'resistances':
      return summary.resistances.fortitude.total > 0 || 
             summary.resistances.reflexos.total > 0 || 
             summary.resistances.vontade.total > 0;
    case 'combat':
      return summary.combat.attack.total > 0 || 
             summary.combat.damage.total > 0 || 
             summary.combat.damage.extraDice.length > 0 ||
             summary.combat.criticalMargin.total > 0 ||
             summary.combat.initiative.total > 0;
    case 'damageReduction':
      return summary.damageReduction.physical.total > 0 || 
             summary.damageReduction.paranormal.total > 0;
    case 'skills':
      return Object.keys(summary.skills).length > 0;
    case 'special':
      return summary.special.length > 0;
    default:
      return false;
  }
}
