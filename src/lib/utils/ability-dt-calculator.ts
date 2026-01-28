/**
 * Calculador de DT para Habilidades de Trilha
 * Ordem Paranormal RPG v1.3
 * 
 * Fórmula oficial: DT = 10 + Limite de PE (por NEX) + Atributo
 * 
 * @module utils/ability-dt-calculator
 */

import { getPELimitByNex } from '@/lib/dice-roller';

// =====================================================
// Tipos
// =====================================================

/**
 * Tipo de atributo usado no cálculo de DT
 */
export type DTAttributeType = 'vigor' | 'agility' | 'strength' | 'intellect' | 'presence';

/**
 * Mapa de nomes de atributos em português
 */
export const ATTRIBUTE_NAMES: Record<DTAttributeType, string> = {
  vigor: 'Vigor',
  agility: 'Agilidade',
  strength: 'Força',
  intellect: 'Intelecto',
  presence: 'Presença',
};

/**
 * Abreviações de atributos
 */
export const ATTRIBUTE_ABBREVIATIONS: Record<DTAttributeType, string> = {
  vigor: 'Vig',
  agility: 'Agi',
  strength: 'For',
  intellect: 'Int',
  presence: 'Pre',
};

/**
 * Resultado do cálculo de DT com breakdown detalhado
 */
export interface DTCalculationResult {
  /** Valor total da DT */
  total: number;
  
  /** Breakdown do cálculo */
  breakdown: {
    /** Base fixa (sempre 10) */
    base: 10;
    /** Limite de PE baseado no NEX */
    peLimit: number;
    /** Valor do atributo */
    attributeValue: number;
    /** Nome do atributo */
    attributeName: string;
    /** Abreviação do atributo */
    attributeAbbr: string;
  };
  
  /** String formatada para exibição: "10 + X (Limite PE) + Y (Atributo) = Z" */
  displayString: string;
  
  /** String curta para exibição compacta: "DT Z" */
  shortString: string;
}

// =====================================================
// Função Principal
// =====================================================

/**
 * Calcula a DT de uma habilidade de trilha conforme regras oficiais v1.3
 * 
 * Fórmula: DT = 10 + Limite de PE (por NEX) + Atributo
 * 
 * @param nex - NEX do personagem (determina o Limite de PE)
 * @param attributeValue - Valor do atributo usado na DT
 * @param attributeType - Tipo do atributo (para nome/abreviação)
 * @returns Resultado com DT total e breakdown detalhado
 * 
 * @example
 * // Cai Dentro (Tropa de Choque): DT Vigor
 * const dt = calculateAbilityDT(50, 3, 'vigor');
 * // dt.total = 10 + 6 + 3 = 19
 * // dt.displayString = "10 + 6 (Limite PE) + 3 (Vigor) = 19"
 * 
 * @example
 * // Assassinar (Infiltrador): DT Agilidade
 * const dt = calculateAbilityDT(65, 4, 'agility');
 * // dt.total = 10 + 8 + 4 = 22
 */
export function calculateAbilityDT(
  nex: number,
  attributeValue: number,
  attributeType: DTAttributeType
): DTCalculationResult {
  const peLimit = getPELimitByNex(nex);
  const base = 10;
  const total = base + peLimit + attributeValue;
  
  const attributeName = ATTRIBUTE_NAMES[attributeType];
  const attributeAbbr = ATTRIBUTE_ABBREVIATIONS[attributeType];
  
  return {
    total,
    breakdown: {
      base,
      peLimit,
      attributeValue,
      attributeName,
      attributeAbbr,
    },
    displayString: `10 + ${peLimit} (Limite PE) + ${attributeValue} (${attributeName}) = ${total}`,
    shortString: `DT ${total}`,
  };
}

/**
 * Versão simplificada que retorna apenas o valor total da DT
 * 
 * @param nex - NEX do personagem
 * @param attributeValue - Valor do atributo
 * @returns Valor total da DT
 */
export function getAbilityDT(nex: number, attributeValue: number): number {
  return 10 + getPELimitByNex(nex) + attributeValue;
}

// =====================================================
// Funções Específicas por Habilidade
// =====================================================

/**
 * Calcula a DT da habilidade "Cai Dentro" (Tropa de Choque, NEX 40%)
 * Teste de Vontade, DT baseada em Vigor
 */
export function calculateCaiDentroDT(nex: number, vigor: number): DTCalculationResult {
  return calculateAbilityDT(nex, vigor, 'vigor');
}

/**
 * Calcula a DT da habilidade "Assassinar" (Infiltrador, NEX 65%)
 * Teste de Fortitude, DT baseada em Agilidade
 */
export function calculateAssassinarDT(nex: number, agility: number): DTCalculationResult {
  return calculateAbilityDT(nex, agility, 'agility');
}

/**
 * Calcula a DT de habilidades sociais (Negociador - Eloquência, etc.)
 * Teste de Vontade, DT baseada em Presença
 */
export function calculateSocialDT(nex: number, presence: number): DTCalculationResult {
  return calculateAbilityDT(nex, presence, 'presence');
}
