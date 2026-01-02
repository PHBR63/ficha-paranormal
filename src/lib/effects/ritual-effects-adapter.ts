// =====================================================
// Adaptador de Efeitos de Ritual
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Converte rituais do sistema unificado para o formato UnifiedEffect.
// Integração completa com UNIFIED_RITUALS e ritual-registry.
//
// FUNCIONALIDADES:
// - Converte RitualMechanics → EffectMechanics
// - Suporta aprimoramentos (Discente, Verdadeiro)
// - Suporta rituais sustentados e de duração cena
// - Calcula bônus de arma, defesa, perícias, etc.
//

import type { UnifiedEffect, EffectMechanics, DamageType } from '../unified-effects-engine';
import { UNIFIED_RITUALS } from '../rituals/unified-rituals';
import { getRitualById, getEffectiveLevel, calculateRitualCost } from '../rituals/ritual-registry';
import type { 
  RitualMechanics, 
  UnifiedRitual, 
  WeaponEffectConfig, 
  RitualEnhancement,
} from '../rituals/types';

// =====================================================
// Tipos de Input
// =====================================================

/**
 * Interface para ritual sustentado/ativo (input para o adapter)
 */
export interface SustainedRitualInput {
  ritualId: string;
  ritualName: string;
  element: string;
  circle: number;
  selectedEnhancements?: string[];
  turnsActive?: number;
  isConcentrating?: boolean;
}

/**
 * Interface para ritual a ser conjurado (para cálculo de custos)
 */
export interface RitualCastInput {
  ritualId: string;
  selectedEnhancements?: string[];
  isNonOccultist?: boolean;
}

// =====================================================
// Funções de Conversão
// =====================================================

/**
 * Obtém as mecânicas corretas baseado nos aprimoramentos selecionados
 */
function getMechanicsForLevel(
  ritual: UnifiedRitual,
  selectedEnhancements: string[] = []
): RitualMechanics {
  const level = getEffectiveLevel(selectedEnhancements);
  
  // Pega as mecânicas do nível apropriado
  if (level === 'verdadeiro' && ritual.effects.verdadeiro) {
    return { ...ritual.effects.base, ...ritual.effects.verdadeiro };
  }
  if (level === 'discente' && ritual.effects.discente) {
    return { ...ritual.effects.base, ...ritual.effects.discente };
  }
  
  return ritual.effects.base;
}

/**
 * Converte WeaponEffectConfig para campos do EffectMechanics
 */
function convertWeaponEffect(we: WeaponEffectConfig, effects: EffectMechanics): void {
  // Bônus de dano
  if (we.damageBonus) {
    if (typeof we.damageBonus === 'number') {
      effects.damageBonus = (effects.damageBonus || 0) + we.damageBonus;
    } else {
      // É uma fórmula de dado como "1d6"
      effects.extraDamageDice = we.damageBonus;
    }
  }
  
  // Bônus de ataque
  if (we.attackBonus) {
    effects.attackBonus = (effects.attackBonus || 0) + we.attackBonus;
  }
  
  // Bônus de crítico (margem de ameaça)
  if (we.criticalBonus) {
    effects.criticalMarginBonus = (effects.criticalMarginBonus || 0) + we.criticalBonus;
  }
  
  // Bônus de multiplicador de crítico
  if (we.criticalMultiplierBonus) {
    effects.criticalMultiplierBonus = (effects.criticalMultiplierBonus || 0) + we.criticalMultiplierBonus;
  }
  
  // Dados extras de dano
  if (we.extraDice) {
    const diceStr = `${we.extraDice.diceCount}d${we.extraDice.diceType}`;
    if (effects.extraDamageDice) {
      effects.extraDamageDice += ` + ${diceStr}`;
    } else {
      effects.extraDamageDice = diceStr;
    }
  }
  
  // Tipo de dano (para efeitos especiais)
  if (we.damageType) {
    if (!effects.specialEffects) effects.specialEffects = [];
    effects.specialEffects.push(`Dano se torna ${we.damageType}`);
  }
  
  // Efeito especial textual
  if (we.special) {
    if (!effects.specialEffects) effects.specialEffects = [];
    effects.specialEffects.push(we.special);
  }
}

/**
 * Converte mecânicas de ritual para EffectMechanics unificado
 * Esta é a função central de mapeamento
 */
function convertRitualMechanicsToEffects(
  ritual: UnifiedRitual | undefined,
  mechanics: RitualMechanics | undefined,
  ritualName: string
): EffectMechanics {
  const effects: EffectMechanics = {};
  
  if (!mechanics) return effects;
  
  // === MODIFICADORES DE COMBATE DIRETOS ===
  if (mechanics.attackBonus) {
    effects.attackBonus = mechanics.attackBonus;
  }
  if (mechanics.damageBonus) {
    if (typeof mechanics.damageBonus === 'number') {
      effects.damageBonus = mechanics.damageBonus;
    } else {
      // É uma fórmula de dado
      effects.extraDamageDice = mechanics.damageBonus;
    }
  }
  if (mechanics.defenseBonus) {
    effects.defenseBonus = mechanics.defenseBonus;
  }
  
  // === REDUÇÃO DE DANO ===
  if (mechanics.damageReduction) {
    const dr = mechanics.damageReduction;
    effects.damageReduction = dr.amount;
    
    // Se tem tipos específicos, adiciona ao byType também
    if (dr.types && dr.types.length > 0) {
      if (!effects.damageReductionByType) effects.damageReductionByType = {};
      for (const dtype of dr.types) {
        effects.damageReductionByType[dtype as DamageType] = dr.amount;
      }
    }
  }
  
  // === BÔNUS DE PERÍCIA ===
  if (mechanics.skillBonus) {
    const sb = mechanics.skillBonus;
    if (sb.skills && sb.bonus !== undefined) {
      effects.skillBonus = {};
      const bonusValue = typeof sb.bonus === 'number' ? sb.bonus : 0;
      
      for (const skill of sb.skills) {
        effects.skillBonus[skill] = bonusValue;
      }
      
      // Se tem contexto, adiciona nota
      if (sb.isContextual && sb.context) {
        effects.conditionalNote = sb.context;
      }
    }
  }
  
  // === PV TEMPORÁRIOS ===
  if (mechanics.tempHP) {
    const thp = mechanics.tempHP;
    // Calcula valor médio dos dados
    if (thp.diceCount && thp.diceType) {
      const avgRoll = Math.floor(thp.diceCount * (thp.diceType / 2 + 0.5)) + (thp.bonus || 0);
      effects.tempHP = avgRoll;
    }
  }
  
  // === EFEITOS DE ARMA ===
  if (mechanics.weaponEffect) {
    convertWeaponEffect(mechanics.weaponEffect, effects);
  }
  
  // === BÔNUS DE RESISTÊNCIA ===
  if (mechanics.resistanceBonus) {
    effects.allResistancesBonus = mechanics.resistanceBonus;
  }
  
  // === CONDIÇÕES APLICADAS ===
  if (mechanics.conditions) {
    if (!effects.specialEffects) effects.specialEffects = [];
    for (const cond of mechanics.conditions) {
      effects.specialEffects.push(`Aplica ${cond.id} ao alvo`);
    }
  }
  
  // === RESTRIÇÕES DE AÇÃO ===
  if (mechanics.actionRestrictions) {
    if (!effects.specialEffects) effects.specialEffects = [];
    const restrictionNames: Record<string, string> = {
      mustAttack: 'deve atacar',
      mustAttackNearest: 'deve atacar o mais próximo',
      cannotSpeak: 'não pode falar',
      cannotCast: 'não pode conjurar',
      cannotMove: 'não pode se mover',
      cannotUseItems: 'não pode usar itens',
      mustFlee: 'deve fugir',
      mustObey: 'deve obedecer',
      cannotHarm: 'não pode causar dano',
      cannotConcentrate: 'não pode concentrar',
      cannotStealth: 'não pode se esconder',
    };
    
    for (const restriction of mechanics.actionRestrictions) {
      effects.specialEffects.push(restrictionNames[restriction] || restriction);
    }
  }
  
  // === EFEITOS DE ÁREA ===
  if (mechanics.areaEffect) {
    if (!effects.specialEffects) effects.specialEffects = [];
    const area = mechanics.areaEffect;
    const size = area.radius || area.length || 0;
    effects.specialEffects.push(`Área: ${area.shape} ${size}m`);
  }
  
  // === CONTROLE MENTAL ===
  if (mechanics.mentalControl) {
    if (!effects.specialEffects) effects.specialEffects = [];
    const mc = mechanics.mentalControl;
    const typeNames: Record<string, string> = {
      charm: 'encantamento',
      dominate: 'dominação',
      suggestion: 'sugestão',
      fear: 'medo',
      possession: 'possessão',
    };
    effects.specialEffects.push(`Controle mental: ${typeNames[mc.type] || mc.type}`);
  }
  
  // === EFEITOS SENSORIAIS ===
  if (mechanics.senseEffect) {
    if (!effects.specialEffects) effects.specialEffects = [];
    const se = mechanics.senseEffect;
    const typeNames: Record<string, string> = {
      detect: 'detecção',
      locate: 'localização',
      scry: 'vidência',
      commune: 'comunhão',
    };
    let effectText = typeNames[se.type] || se.type;
    if (se.range) effectText += ` (${se.range}m)`;
    if (se.information) effectText += `: ${se.information}`;
    effects.specialEffects.push(effectText);
  }
  
  // === DETECÇÃO DE AÇÃO EXTRA (ex: Velocidade Mortal) ===
  if (ritual?.name?.toLowerCase().includes('velocidade')) {
    effects.extraAction = 'movement';
    if (!effects.specialEffects) effects.specialEffects = [];
    effects.specialEffects.push('Ação de movimento adicional por turno');
  }
  
  // === FALLBACK: RESUMO DO RITUAL ===
  if (Object.keys(effects).length === 0 && mechanics.summary) {
    effects.specialEffects = [mechanics.summary];
  }
  
  return effects;
}

// =====================================================
// Funções Principais
// =====================================================

/**
 * Converte rituais sustentados de um personagem para UnifiedEffect[]
 * 
 * @param sustainedRituals - Array de rituais sustentados
 * @returns Array de efeitos unificados
 */
export function getRitualEffects(
  sustainedRituals: SustainedRitualInput[]
): UnifiedEffect[] {
  const effects: UnifiedEffect[] = [];
  
  for (const sustained of sustainedRituals) {
    const ritual = getRitualById(sustained.ritualId);
    if (!ritual) continue;
    
    // Obtém mecânicas no nível apropriado
    const mechanics = getMechanicsForLevel(ritual, sustained.selectedEnhancements);
    
    // Converte para formato unificado
    const effectMechanics = convertRitualMechanicsToEffects(
      ritual, 
      mechanics, 
      sustained.ritualName
    );
    
    // Verifica se tem mecânicas relevantes
    const hasMechanics = Object.keys(effectMechanics).length > 0;
    if (!hasMechanics) {
      // Ritual sem mecânicas mapeadas - cria efeito com descrição
      effectMechanics.specialEffects = [ritual.description || 'Ritual ativo'];
    }
    
    // Determina o nível efetivo para nome
    const level = getEffectiveLevel(sustained.selectedEnhancements || []);
    const levelSuffix = level === 'verdadeiro' ? ' (Verdadeiro)' : 
                        level === 'discente' ? ' (Discente)' : '';
    
    const effect: UnifiedEffect = {
      id: `ritual-${sustained.ritualId}-${Date.now()}`,
      name: sustained.ritualName + levelSuffix,
      description: ritual.description,
      source: 'ritual',
      sourceId: sustained.ritualId,
      sourceName: `Ritual: ${sustained.ritualName}`,
      mechanics: effectMechanics,
      isActive: true,
      isToggleable: false, // Rituais sustentados são sempre ativos enquanto sustentados
      duration: {
        type: 'until_removed',
        sustainCost: sustained.circle, // PE por turno para sustentar
      },
      priority: sustained.circle * 10, // Círculos maiores = maior prioridade
    };
    
    effects.push(effect);
  }
  
  return effects;
}

/**
 * Calcula efeitos imediatos de um ritual (não sustentado)
 * Útil para rituais de duração "Cena" ou "Instantânea"
 */
export function getImmediateRitualEffects(
  ritualId: string,
  selectedEnhancements: string[] = []
): EffectMechanics | null {
  const ritual = getRitualById(ritualId);
  if (!ritual) return null;
  
  const mechanics = getMechanicsForLevel(ritual, selectedEnhancements);
  return convertRitualMechanicsToEffects(ritual, mechanics, ritual.name);
}

/**
 * Calcula bônus totais de rituais sustentados
 * Aplica regra de não-acúmulo (maior valor prevalece)
 */
export function calculateRitualBonusTotals(
  sustainedRituals: SustainedRitualInput[]
): {
  attackBonus: number;
  damageBonus: number;
  defenseBonus: number;
  damageReduction: number;
  tempHP: number;
  criticalMarginBonus: number;
  skillBonuses: Record<string, number>;
  specialEffects: string[];
} {
  const totals = {
    attackBonus: 0,
    damageBonus: 0,
    defenseBonus: 0,
    damageReduction: 0,
    tempHP: 0,
    criticalMarginBonus: 0,
    skillBonuses: {} as Record<string, number>,
    specialEffects: [] as string[],
  };
  
  const effects = getRitualEffects(sustainedRituals);
  
  for (const effect of effects) {
    const m = effect.mechanics;
    
    // Aplica regra de maior valor (não acumula de mesma fonte)
    if (m.attackBonus) totals.attackBonus = Math.max(totals.attackBonus, m.attackBonus);
    if (m.damageBonus) totals.damageBonus = Math.max(totals.damageBonus, m.damageBonus);
    if (m.defenseBonus) totals.defenseBonus = Math.max(totals.defenseBonus, m.defenseBonus);
    if (m.damageReduction) totals.damageReduction = Math.max(totals.damageReduction, m.damageReduction);
    if (m.tempHP) totals.tempHP = Math.max(totals.tempHP, m.tempHP);
    if (m.criticalMarginBonus) totals.criticalMarginBonus = Math.max(totals.criticalMarginBonus, m.criticalMarginBonus);
    
    // Perícias - maior valor por perícia
    if (m.skillBonus) {
      for (const [skill, bonus] of Object.entries(m.skillBonus)) {
        totals.skillBonuses[skill] = Math.max(totals.skillBonuses[skill] || 0, bonus!);
      }
    }
    
    // Efeitos especiais - acumula todos
    if (m.specialEffects) {
      totals.specialEffects.push(...m.specialEffects);
    }
  }
  
  return totals;
}

/**
 * Lista rituais que podem ser sustentados
 * Consulta UNIFIED_RITUALS e filtra por isSustainable
 */
export function getSustainableRituals(): Array<{
  id: string;
  name: string;
  circle: number;
  element: string;
  hasCombatEffects: boolean;
  description: string;
  cost: number;
  hasEnhancements: boolean;
}> {
  const sustainableRituals = UNIFIED_RITUALS.filter(
    ritual => ritual.isSustainable || ritual.duration === 'Sustentada'
  );
  
  return sustainableRituals.map(ritual => {
    const mechanics = ritual.effects?.base;
    const hasCombatEffects = Boolean(
      mechanics?.attackBonus ||
      mechanics?.damageBonus ||
      mechanics?.defenseBonus ||
      mechanics?.weaponEffect ||
      mechanics?.damage ||
      mechanics?.damagePerTurn ||
      mechanics?.damageReduction ||
      mechanics?.tempHP
    );
    
    return {
      id: ritual.id,
      name: ritual.name,
      circle: ritual.circle,
      element: ritual.element,
      hasCombatEffects,
      description: ritual.description,
      cost: ritual.cost,
      hasEnhancements: (ritual.enhancements?.length || 0) > 0,
    };
  });
}

/**
 * Lista rituais que afetam armas (weapon buffs)
 */
export function getWeaponBuffRituals(): Array<{
  id: string;
  name: string;
  circle: number;
  element: string;
  cost: number;
  effectSummary: string;
}> {
  const weaponRituals = UNIFIED_RITUALS.filter(ritual => ritual.isWeaponBuff);
  
  return weaponRituals.map(ritual => ({
    id: ritual.id,
    name: ritual.name,
    circle: ritual.circle,
    element: ritual.element,
    cost: ritual.cost,
    effectSummary: ritual.effects.base.summary,
  }));
}

/**
 * Obtém resumo de efeitos de rituais para display
 */
export function getRitualEffectsSummary(
  sustainedRituals: SustainedRitualInput[]
): Array<{
  ritualName: string;
  element: string;
  circle: number;
  level: 'base' | 'discente' | 'verdadeiro';
  effects: string[];
  isConcentrating: boolean;
}> {
  return sustainedRituals.map(sr => {
    const ritual = getRitualById(sr.ritualId);
    const level = getEffectiveLevel(sr.selectedEnhancements || []);
    const mechanics = ritual ? getMechanicsForLevel(ritual, sr.selectedEnhancements) : null;
    
    const effectStrings: string[] = [];
    
    if (mechanics) {
      if (mechanics.attackBonus) effectStrings.push(`+${mechanics.attackBonus} ataque`);
      if (mechanics.damageBonus) {
        if (typeof mechanics.damageBonus === 'number') {
          effectStrings.push(`+${mechanics.damageBonus} dano`);
        } else {
          effectStrings.push(`+${mechanics.damageBonus} dano`);
        }
      }
      if (mechanics.defenseBonus) effectStrings.push(`+${mechanics.defenseBonus} Defesa`);
      if (mechanics.damageReduction) effectStrings.push(`RD ${mechanics.damageReduction.amount}`);
      if (mechanics.tempHP) {
        const thp = mechanics.tempHP;
        effectStrings.push(`+${thp.diceCount}d${thp.diceType}${thp.bonus ? `+${thp.bonus}` : ''} PV temp`);
      }
      if (mechanics.weaponEffect) {
        const we = mechanics.weaponEffect;
        if (we.attackBonus) effectStrings.push(`+${we.attackBonus} ataque`);
        if (we.damageBonus) effectStrings.push(`+${we.damageBonus} dano`);
        if (we.criticalBonus) effectStrings.push(`+${we.criticalBonus} margem crítico`);
      }
      if (mechanics.summary && effectStrings.length === 0) {
        effectStrings.push(mechanics.summary);
      }
    }
    
    return {
      ritualName: sr.ritualName,
      element: sr.element,
      circle: sr.circle,
      level,
      effects: effectStrings.length > 0 ? effectStrings : ['Efeito ativo'],
      isConcentrating: sr.isConcentrating ?? false,
    };
  });
}

/**
 * Obtém informações de aprimoramentos disponíveis para um ritual
 */
export function getRitualEnhancements(ritualId: string): {
  hasEnhancements: boolean;
  enhancements: Array<{
    name: 'Discente' | 'Verdadeiro';
    cost: number;
    description: string;
    circleRequired: number;
    requiresAffinity: boolean;
  }>;
} {
  const ritual = getRitualById(ritualId);
  if (!ritual || !ritual.enhancements) {
    return { hasEnhancements: false, enhancements: [] };
  }
  
  return {
    hasEnhancements: true,
    enhancements: ritual.enhancements.map(enh => ({
      name: enh.name,
      cost: enh.cost,
      description: enh.description,
      circleRequired: enh.circleReq || ritual.circle,
      requiresAffinity: enh.affinityReq || false,
    })),
  };
}

/**
 * Estatísticas do adapter para debug
 */
export function getRitualAdapterStats(): {
  totalRituals: number;
  sustainableRituals: number;
  weaponBuffRituals: number;
  ritualsWithEnhancements: number;
  ritualsWithCombatEffects: number;
} {
  const sustainable = UNIFIED_RITUALS.filter(r => r.isSustainable || r.duration === 'Sustentada');
  const weaponBuffs = UNIFIED_RITUALS.filter(r => r.isWeaponBuff);
  const withEnhancements = UNIFIED_RITUALS.filter(r => (r.enhancements?.length || 0) > 0);
  const withCombat = UNIFIED_RITUALS.filter(r => {
    const m = r.effects.base;
    return !!(m.attackBonus || m.damageBonus || m.defenseBonus || m.weaponEffect || m.damage);
  });
  
  return {
    totalRituals: UNIFIED_RITUALS.length,
    sustainableRituals: sustainable.length,
    weaponBuffRituals: weaponBuffs.length,
    ritualsWithEnhancements: withEnhancements.length,
    ritualsWithCombatEffects: withCombat.length,
  };
}
