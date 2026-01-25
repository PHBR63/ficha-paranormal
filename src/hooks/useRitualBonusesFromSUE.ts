// =====================================================
// useRitualBonusesFromSUE - Hook de Bônus de Rituais do SUE
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Hook especializado para extrair bônus de rituais do Sistema
// Unificado de Efeitos (SUE) e disponibilizá-los para o
// RitualCastModal e outros componentes.
//

import { useMemo } from 'react';
import type { UnifiedEffectsResult } from './useUnifiedEffects';
import type { AttributeType } from '@/lib/unified-effects-engine';

// =====================================================
// Tipos
// =====================================================

/**
 * Modificador de ritual disponível (vindo de trilhas ou poderes)
 */
export interface RitualModifier {
  id: string;
  name: string;
  type: 'range' | 'action' | 'area' | 'duration' | 'counter';
  effect: string;
  peCost: number;
  perRound?: boolean;
  isActivatable?: boolean;
  variableCost?: boolean;       // Custo igual ao ritual alvo (Anular Ritual)
  actionType?: 'reaction';      // Tipo de ação necessária
  source: string;
  isActive: boolean;
  canActivate: boolean;
}

/**
 * Breakdown de bônus para exibição na UI
 */
export interface RitualBonusBreakdown {
  source: string;
  value: number;
  element?: string;
  range?: string;
}

/**
 * Resultado completo dos bônus de rituais
 */
export interface RitualBonuses {
  // === Bônus de DT ===
  dtBonus: number;
  dtBonusByElement: Record<string, number>;
  dtBreakdown: RitualBonusBreakdown[];
  
  // === Bônus de Dano/Cura ===
  damageBonus: number;
  damageAttributeBonus: { attribute: AttributeType; value: number } | null;
  damageBreakdown: RitualBonusBreakdown[];
  
  // === Bônus de Cura de Origem (Agente de Saúde / Técnica Medicinal) ===
  healingBonusFromOrigin: number;
  healingBonusFromOriginSource: string | null;
  
  // === Reduções de PE ===
  peReduction: number;
  peReductionByElement: Record<string, number>;
  peReductionByRange: Record<string, number>;
  peBreakdown: RitualBonusBreakdown[];
  
  // === Modificadores de Trilha ===
  availableModifiers: RitualModifier[];
  
  // === Helpers ===
  getDTForRitual: (element: string) => number;
  getPEReductionForRitual: (element: string, range?: string) => number;
  getDamageBonusForRitual: (attributes: Record<AttributeType, number>) => number;
  hasModifier: (modifierId: string) => boolean;
  
  // === Flags ===
  hasAnyBonus: boolean;
  hasAnyModifier: boolean;
}

// =====================================================
// Atributo Labels para exibição
// =====================================================

const ATTRIBUTE_LABELS: Record<AttributeType, string> = {
  strength: 'Força',
  agility: 'Agilidade',
  vigor: 'Vigor',
  intellect: 'Intelecto',
  presence: 'Presença',
};

// =====================================================
// Hook Principal
// =====================================================

/**
 * Hook que extrai bônus de rituais do Sistema Unificado de Efeitos
 * 
 * @param unifiedEffects - Resultado do useUnifiedEffects
 * @param attributes - Atributos do personagem (para cálculo de bônus baseado em atributo)
 * @param activatedModifiers - IDs de modificadores ativados manualmente
 * @returns Bônus de rituais consolidados
 */
/**
 * Hook que extrai bônus de rituais do Sistema Unificado de Efeitos
 * 
 * @param unifiedEffects - Resultado do useUnifiedEffects
 * @param attributes - Atributos do personagem (para cálculo de bônus baseado em atributo)
 * @param activatedModifiers - IDs de modificadores ativados manualmente
 * @param currentPE - PE atual do personagem (para verificação de custo)
 * @returns Bônus de rituais consolidados
 */
export function useRitualBonusesFromSUE(
  unifiedEffects: UnifiedEffectsResult | null,
  attributes: Record<AttributeType, number>,
  activatedModifiers: string[] = [],
  currentPE: number = Infinity
): RitualBonuses {
  return useMemo(() => {
    // Estado inicial vazio se não houver efeitos
    if (!unifiedEffects) {
      return createEmptyRitualBonuses();
    }
    
    const { computed } = unifiedEffects;
    const rituals = computed.rituals;
    
    // === Processa DT ===
    const dtBreakdown: RitualBonusBreakdown[] = [];
    
    if (rituals.dtBonus > 0) {
      // Encontra a fonte do bônus geral no breakdown
      const generalSource = rituals.breakdown.find(b => b.effect.includes('DT em rituais'));
      dtBreakdown.push({
        source: generalSource?.source || 'Bônus geral',
        value: rituals.dtBonus,
      });
    }
    
    for (const [element, bonus] of Object.entries(rituals.dtBonusByElement)) {
      const source = rituals.breakdown.find(
        b => b.effect.includes(`DT rituais de ${element}`)
      );
      dtBreakdown.push({
        source: source?.source || 'Poder de classe',
        value: bonus,
        element,
      });
    }
    
    // === Processa Dano/Cura ===
    const damageBreakdown: RitualBonusBreakdown[] = [];
    let damageAttributeBonusResult: { attribute: AttributeType; value: number } | null = null;
    
    if (rituals.damageBonus > 0) {
      const source = rituals.breakdown.find(b => b.effect.includes('dano/cura rituais'));
      damageBreakdown.push({
        source: source?.source || 'Bônus de dano',
        value: rituals.damageBonus,
      });
    }
    
    if (rituals.damageAttributeBonus) {
      const attrValue = attributes[rituals.damageAttributeBonus];
      const source = rituals.breakdown.find(
        b => b.effect.includes(rituals.damageAttributeBonus!.toUpperCase())
      );
      damageAttributeBonusResult = {
        attribute: rituals.damageAttributeBonus,
        value: attrValue,
      };
      damageBreakdown.push({
        source: source?.source || 'Ritual Potente',
        value: attrValue,
      });
    }
    
    // === Processa PE ===
    const peBreakdown: RitualBonusBreakdown[] = [];
    
    if (rituals.peReduction > 0) {
      const source = rituals.breakdown.find(b => b.effect.includes('PE em rituais') && !b.effect.includes('de '));
      peBreakdown.push({
        source: source?.source || 'Redução geral',
        value: rituals.peReduction,
      });
    }
    
    for (const [element, reduction] of Object.entries(rituals.peReductionByElement)) {
      const source = rituals.breakdown.find(
        b => b.effect.includes(`PE rituais de ${element}`)
      );
      peBreakdown.push({
        source: source?.source || 'Mestre em Elemento',
        value: reduction,
        element,
      });
    }
    
    for (const [range, reduction] of Object.entries(rituals.peReductionByRange)) {
      const source = rituals.breakdown.find(
        b => b.effect.includes(`alcance ${range}`)
      );
      peBreakdown.push({
        source: source?.source || 'Tatuagem Ritualística',
        value: reduction,
        range,
      });
    }
    
    // === Processa Modificadores ===
    // Verifica PE disponível para cada modificador
    const availableModifiers: RitualModifier[] = rituals.availableModifiers.map(mod => ({
      ...mod,
      isActive: activatedModifiers.includes(mod.id),
      // Verificação de PE: modificador pode ser ativado se PE atual >= custo
      canActivate: currentPE >= mod.peCost,
    }));
    
    // === Helpers ===
    const getDTForRitual = (element: string): number => {
      const elementBonus = rituals.dtBonusByElement[element] || 0;
      return rituals.dtBonus + elementBonus;
    };
    
    const getPEReductionForRitual = (element: string, range?: string): number => {
      let reduction = rituals.peReduction;
      reduction += rituals.peReductionByElement[element] || 0;
      if (range) {
        reduction += rituals.peReductionByRange[range] || 0;
      }
      return reduction;
    };
    
    const getDamageBonusForRitual = (attrs: Record<AttributeType, number>): number => {
      let bonus = rituals.damageBonus;
      if (rituals.damageAttributeBonus) {
        bonus += attrs[rituals.damageAttributeBonus];
      }
      return bonus;
    };
    
    const hasModifier = (modifierId: string): boolean => {
      return availableModifiers.some(m => m.id === modifierId);
    };
    
    // === Flags ===
    const hasAnyBonus = 
      rituals.dtBonus > 0 ||
      Object.keys(rituals.dtBonusByElement).length > 0 ||
      rituals.damageBonus > 0 ||
      rituals.damageAttributeBonus !== null ||
      rituals.peReduction > 0 ||
      Object.keys(rituals.peReductionByElement).length > 0 ||
      Object.keys(rituals.peReductionByRange).length > 0;
    
    const hasAnyModifier = availableModifiers.length > 0;
    
    return {
      // DT
      dtBonus: rituals.dtBonus,
      dtBonusByElement: rituals.dtBonusByElement,
      dtBreakdown,
      
      // Dano/Cura
      damageBonus: rituals.damageBonus,
      damageAttributeBonus: damageAttributeBonusResult,
      damageBreakdown,
      
      // Bônus de Cura de Origem (Agente de Saúde / Técnica Medicinal)
      healingBonusFromOrigin: computed.healing?.bonusFromOrigin || 0,
      healingBonusFromOriginSource: computed.healing?.bonusFromOriginSource || null,
      
      // PE
      peReduction: rituals.peReduction,
      peReductionByElement: rituals.peReductionByElement,
      peReductionByRange: rituals.peReductionByRange,
      peBreakdown,
      
      // Modificadores
      availableModifiers,
      
      // Helpers
      getDTForRitual,
      getPEReductionForRitual,
      getDamageBonusForRitual,
      hasModifier,
      
      // Flags
      hasAnyBonus,
      hasAnyModifier,
    };
  }, [unifiedEffects, attributes, activatedModifiers, currentPE]);
}

// =====================================================
// Funções Auxiliares
// =====================================================

/**
 * Cria um objeto RitualBonuses vazio
 */
function createEmptyRitualBonuses(): RitualBonuses {
  return {
    dtBonus: 0,
    dtBonusByElement: {},
    dtBreakdown: [],
    damageBonus: 0,
    damageAttributeBonus: null,
    damageBreakdown: [],
    healingBonusFromOrigin: 0,
    healingBonusFromOriginSource: null,
    peReduction: 0,
    peReductionByElement: {},
    peReductionByRange: {},
    peBreakdown: [],
    availableModifiers: [],
    getDTForRitual: () => 0,
    getPEReductionForRitual: () => 0,
    getDamageBonusForRitual: () => 0,
    hasModifier: () => false,
    hasAnyBonus: false,
    hasAnyModifier: false,
  };
}

/**
 * Formata o nome de um atributo para exibição
 */
export function formatAttributeName(attribute: AttributeType): string {
  return ATTRIBUTE_LABELS[attribute] || attribute;
}
