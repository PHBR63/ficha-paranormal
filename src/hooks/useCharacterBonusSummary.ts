/**
 * useCharacterBonusSummary - Hook que consolida todos os bônus ativos do personagem
 * 
 * Integra múltiplas fontes:
 * - useDefenseBonuses (defesa e resistências)
 * - useParanormalEffects (poderes paranormais)
 * - Poderes gerais (combate, perícias, etc.)
 * - Habilidades de classe
 */

import { useMemo } from 'react';
import { useDefenseBonuses, DefenseBonusBreakdown, ResistanceBonusBreakdown } from './useDefenseBonuses';
import { useParanormalEffects, ParanormalEffects } from './useParanormalEffects';

// Interface para breakdown genérico de bônus
export interface BonusBreakdown {
  source: string;        // Nome da fonte
  value: number | string; // Valor do bônus (número ou dado)
  type: 'origin' | 'ability' | 'general_power' | 'paranormal' | 'equipment';
  conditional?: string;  // Condição se houver
  active: boolean;       // Se está ativo
}

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
  // Stats calculados
  hpBonus: number;
  peBonus: number;
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
}: UseCharacterBonusSummaryProps): BonusSummary {
  // Usa hooks existentes
  const defenseBonuses = useDefenseBonuses({ origin, abilities, generalPowers, inventory });
  const paranormalEffects = useParanormalEffects({ 
    powers: paranormalPowers, 
    nex, 
    elementalAffinity: elementalAffinity as any, 
    affinityActive 
  });

  return useMemo(() => {
    // Inicializa estruturas
    const combat: CombatBonuses = {
      attack: { total: 0, breakdown: [] },
      damage: { total: 0, extraDice: [], breakdown: [] },
      criticalMargin: { total: 0, breakdown: [] },
      initiative: { total: 0, breakdown: [] },
    };

    const damageReduction: DamageReduction = {
      physical: { total: 0, breakdown: [] },
      paranormal: { total: 0, breakdown: [] },
    };

    const effectResistances: EffectResistances = {
      poison: 0,
      disease: 0,
      mental: 0,
      breakdown: [],
    };

    const skills: SkillBonuses = {};
    const special: BonusBreakdown[] = [];

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

    // === PROCESSA PODERES GERAIS ===

    // Foco em Arma: +2 ataque com tipo de arma
    if (hasPower('foco-arma')) {
      combat.attack.breakdown.push({
        source: 'Foco em Arma',
        value: 2,
        type: 'general_power',
        conditional: 'com arma escolhida',
        active: true,
      });
      combat.attack.total += 2;
    }

    // Ataque Poderoso: +5 dano (-2 ataque)
    if (hasPower('ataque-poderoso')) {
      combat.damage.breakdown.push({
        source: 'Ataque Poderoso',
        value: 5,
        type: 'general_power',
        conditional: 'por -2 no ataque',
        active: true,
      });
      // Não soma ao total pois é opcional
      special.push({
        source: 'Ataque Poderoso',
        value: '+5 dano por -2 ataque',
        type: 'general_power',
        active: true,
      });
    }

    // Fanático: +2 ataque e dano (PV < 50%)
    if (hasPower('fanatico')) {
      combat.attack.breakdown.push({
        source: 'Fanático',
        value: 2,
        type: 'general_power',
        conditional: 'com menos de 50% PV',
        active: false, // Condicional
      });
      combat.damage.breakdown.push({
        source: 'Fanático',
        value: 2,
        type: 'general_power',
        conditional: 'com menos de 50% PV',
        active: false,
      });
    }

    // Iniciativa Melhorada: +5 Iniciativa
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

    // Balística Avançada: +2 dano armas de fogo
    if (hasAbility('balística avançada') || hasAbility('balistica avancada')) {
      combat.damage.breakdown.push({
        source: 'Balística Avançada',
        value: 2,
        type: 'ability',
        conditional: 'armas de fogo',
        active: true,
      });
    }

    // Ninja Urbano: +2 dano armas táticas corpo a corpo/disparo
    if (hasAbility('ninja urbano')) {
      combat.damage.breakdown.push({
        source: 'Ninja Urbano',
        value: 2,
        type: 'ability',
        conditional: 'armas táticas',
        active: true,
      });
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

    // Adiciona bônus de defesa paranormal
    if (paranormalEffects.defenseBonus > 0) {
      // Já incluído no defenseBonuses via fonte paranormal
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
        total: defenseBonuses.totalBonus,
        breakdown: defenseBonuses.breakdown,
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
      hpBonus: paranormalEffects.hpBonus,
      peBonus: paranormalEffects.peBonus,
    };
  }, [defenseBonuses, paranormalEffects, abilities, generalPowers]);
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
