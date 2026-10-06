/**
 * Motor de Conjuração de Rituais - Ordem Paranormal RPG v1.3
 * 
 * Implementa o fluxo completo de conjuração conforme PDF p.129-132:
 * 1. Validações (mão livre, componentes, ação, limite PE, círculo, afinidade)
 * 2. Custo de PE (base + um aprimoramento)
 * 3. Concentração (teste de Vontade se sofrer dano durante execução)
 * 4. Custo do Paranormal:
 *    - Elementos não-Medo: teste Ocultismo DT 20+custo, falha perde SAN=custo, falha 5+ perde 1 SAN permanente
 *    - Elemento Medo: sempre perde SAN=custo + SAN permanente (1 base, +1 discente, +2 verdadeiro)
 * 5. Aplicação de efeitos via SUE
 * 6. Sustentação (registro, custo/turno, expiração)
 * 
 * @module ritual-casting-engine
 */

import { getRitualById, calculateRitualCost, getEffectiveLevel, getRitualEffect } from './ritual-registry';
import { rollAttributeDicePool } from '../attribute-dice-pool';
import type { UnifiedRitual, RitualMechanics } from './types';

// ========================================
// TIPOS DE RESULTADO
// ========================================

/**
 * Resultado de um teste no fluxo de conjuração
 */
export interface CastingTestResult {
  rolled: number;           // Valor do d20 mantido
  total: number;            // Total (rolled + bônus)
  dt: number;               // DT do teste
  success: boolean;         // Se passou no teste
  margin: number;           // Margem (total - DT, negativo se falha)
  failedBy5OrMore: boolean; // Se falhou por 5 ou mais
}

/**
 * Resultado completo da conjuração de um ritual
 */
export interface CastRitualResult {
  // Status geral
  success: boolean;
  interrupted: boolean;         // Se foi interrompido (concentração, PE insuficiente, etc.)
  
  // Informações do ritual
  ritualId: string;
  ritualName: string;
  element: string;
  circle: number;
  level: 'base' | 'discente' | 'verdadeiro';
  
  // Custos
  peSpent: number;              // PE gasto (mesmo em falha, perde o PE)
  sanityLost: number;           // Sanidade perdida (temporária)
  permanentSanityLost: number;  // Sanidade permanente perdida
  
  // Testes realizados
  concentrationTest?: CastingTestResult;  // Último teste, para consumidores antigos
  concentrationTests?: CastingTestResult[]; // Testes distintos por proteção e dano
  occultismTest?: CastingTestResult;      // Teste de Ocultismo (Custo do Paranormal)
  
  // Efeitos aplicados (se sucesso)
  appliedEffects?: RitualMechanics;
  
  // Breakdown para UI
  breakdown: string[];
  errors: string[];
}

/**
 * Parâmetros para conjuração
 */
export interface CastRitualParams {
  ritualId: string;
  selectedEnhancements: string[];
  
  // Estado do personagem
  characterState: {
    nex: number;
    peCurrent: number;
    peMax: number;
    sanCurrent: number;
    sanMax: number;
    
    // Atributos para testes
    occultism: number;        // Bônus de Ocultismo (treinamento + atributo)
    willpower: number;        // Bônus de Vontade (Presença)
    presence: number;         // Atributo Presença (para pool de dados)
    intellect: number;        // Atributo Intelecto (para pool de dados de Ocultismo)
    
    // Configurações
    isOccultist: boolean;     // Classe de conjuração; não altera o custo base
    maxCircle: number;        // Círculo máximo permitido pelo NEX
    elementalAffinity?: string; // Afinidade elemental (se houver)
    
    // Estado de combate
    hasFreeHand: boolean;     // Se tem mão livre para gestos
    hasComponents: boolean;   // Se possui componentes do ritual
    armorType?: 'none' | 'leve' | 'pesada'; // Tipo de proteção
    damageTakenDuringCast?: number; // Dano sofrido durante a conjuração
  };
  
  // Opções de rolagem
  rollOptions?: {
    // Se já rolou os dados externamente, passar os resultados
    preRolledOccultism?: { diceResult: number };
    preRolledWillpower?: { diceResult: number };
  };
}

// ========================================
// CONSTANTES DO SISTEMA
// ========================================

/**
 * DT base para Custo do Paranormal (PDF p.132)
 * DT = 20 + custo em PE do ritual
 */
const PARANORMAL_COST_BASE_DT = 20;

/**
 * DT para teste de Concentração (PDF p.129)
 * Proteção pesada adiciona +5
 */
const CONCENTRATION_BASE_DT = 15;
const CONCENTRATION_HEAVY_ARMOR_BONUS = 5;

/**
 * Perda de SAN permanente por nível do Medo (PDF p.132)
 * Base: 1, Discente: 2, Verdadeiro: 3
 */
const FEAR_PERMANENT_SAN_LOSS = {
  base: 1,
  discente: 2,
  verdadeiro: 3,
} as const;

// ========================================
// FUNÇÕES DE ROLAGEM
// ========================================

/**
 * Rola um pool de dados (sistema Ordem Paranormal)
 * @param attributeValue - Valor do atributo (número de d20s)
 * @returns O maior valor rolado (ou menor se atributo <= 0)
 */
function rollDicePool(attributeValue: number): number {
  return rollAttributeDicePool(attributeValue).kept;
}

/**
 * Executa um teste de resistência/perícia
 */
function performTest(
  attributeValue: number,
  skillBonus: number,
  dt: number,
  preRolledDice?: number
): CastingTestResult {
  const rolled = preRolledDice ?? rollDicePool(attributeValue);
  const total = rolled + skillBonus;
  const margin = total - dt;
  const success = total >= dt;
  const failedBy5OrMore = !success && margin <= -5;
  
  return {
    rolled,
    total,
    dt,
    success,
    margin,
    failedBy5OrMore,
  };
}

// ========================================
// VALIDAÇÕES
// ========================================

/**
 * Valida se o personagem pode conjurar o ritual
 */
function validateCasting(
  ritual: UnifiedRitual,
  params: CastRitualParams,
  peCost: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const { characterState, selectedEnhancements } = params;
  
  // 1. Verifica círculo
  if (ritual.circle > characterState.maxCircle) {
    errors.push(`Círculo insuficiente: requer ${ritual.circle}º, você tem ${characterState.maxCircle}º`);
  }
  
  // 2. Verifica PE
  if (peCost > characterState.peCurrent) {
    errors.push(`PE insuficiente: custo ${peCost}, você tem ${characterState.peCurrent}`);
  }
  
  // Gestos exigem mão livre, inclusive em Medo (Livro Base, p.119).
  const isFearElement = ritual.element.toLowerCase() === 'medo';
  if (!characterState.hasFreeHand) {
    errors.push('Requer uma mão livre para realizar gestos');
  }
  
  // 4. Verifica componentes (exceto Medo)
  if (!isFearElement && !characterState.hasComponents) {
    errors.push('Requer componentes ritualísticos');
  }
  
  if (selectedEnhancements.length > 1) errors.push('Selecione apenas um aprimoramento');

  // 5. Verifica requisitos de aprimoramentos
  for (const enhName of selectedEnhancements) {
    const enh = ritual.enhancements?.find(e => 
      e.name.toLowerCase() === enhName.toLowerCase()
    );
    
    if (!enh) {
      errors.push(`Aprimoramento desconhecido: ${enhName}`);
      continue;
    }
    if (enh) {
      // Verifica círculo do aprimoramento
      if (enh.circleReq && enh.circleReq > characterState.maxCircle) {
        errors.push(`Aprimoramento ${enh.name} requer ${enh.circleReq}º círculo`);
      }
      
      // Verifica afinidade
      if (enh.affinityReq) {
        if (!characterState.elementalAffinity) {
          errors.push(`Aprimoramento ${enh.name} requer afinidade elemental`);
        } else if (characterState.elementalAffinity.toLowerCase() !== ritual.element.toLowerCase()) {
          errors.push(`Aprimoramento ${enh.name} requer afinidade com ${ritual.element}`);
        }
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// ========================================
// MOTOR PRINCIPAL DE CONJURAÇÃO
// ========================================

/**
 * Executa a conjuração completa de um ritual
 * Calcula validações, concentração e custo paranormal (Livro Base, pp.119–121).
 * A integração com recursos e sustentação pertence aos consumidores.
 * 
 * @param params - Parâmetros de conjuração
 * @returns Resultado completo da conjuração
 */
export function castRitual(params: CastRitualParams): CastRitualResult {
  const { ritualId, selectedEnhancements, characterState, rollOptions } = params;
  const breakdown: string[] = [];
  const errors: string[] = [];
  
  // Busca o ritual
  const ritual = getRitualById(ritualId);
  if (!ritual) {
    return {
      success: false,
      interrupted: true,
      ritualId,
      ritualName: 'Desconhecido',
      element: 'unknown',
      circle: 0,
      level: 'base',
      peSpent: 0,
      sanityLost: 0,
      permanentSanityLost: 0,
      breakdown: [],
      errors: ['Ritual não encontrado'],
    };
  }
  
  const level = getEffectiveLevel(selectedEnhancements);
  const peCost = calculateRitualCost(ritual, selectedEnhancements);
  const isFearElement = ritual.element.toLowerCase() === 'medo';
  
  breakdown.push(`Ritual: ${ritual.name} (${ritual.element}, ${ritual.circle}º círculo)`);
  breakdown.push(`Nível: ${level === 'base' ? 'Base' : level.charAt(0).toUpperCase() + level.slice(1)}`);
  breakdown.push(`Custo: ${peCost} PE`);
  
  // ========================================
  // ETAPA 1: VALIDAÇÕES
  // ========================================
  const validation = validateCasting(ritual, params, peCost);
  if (!validation.valid) {
    return {
      success: false,
      interrupted: true,
      ritualId,
      ritualName: ritual.name,
      element: ritual.element,
      circle: ritual.circle,
      level,
      peSpent: 0,
      sanityLost: 0,
      permanentSanityLost: 0,
      breakdown,
      errors: validation.errors,
    };
  }
  
  // ========================================
  // ETAPA 2: TESTE DE CONCENTRAÇÃO (se sofreu dano)
  // ========================================
  let concentrationTest: CastingTestResult | undefined;
  
  // Cada impedimento tem seu teste: proteção (15/20 + PE) e dano (DT = dano).
  const concentrationDTs: number[] = [];
  const concentrationTests: CastingTestResult[] = [];
  if (characterState.armorType === 'leve' || characterState.armorType === 'pesada') {
    concentrationDTs.push(getConcentrationDT(characterState.armorType, peCost));
  }
  if ((characterState.damageTakenDuringCast ?? 0) > 0) {
    concentrationDTs.push(characterState.damageTakenDuringCast!);
  }
  for (const concentrationDT of concentrationDTs) {
    
    concentrationTest = performTest(
      characterState.presence,
      characterState.willpower,
      concentrationDT,
      rollOptions?.preRolledWillpower?.diceResult
    );
    
    concentrationTests.push(concentrationTest);
    breakdown.push(`Teste de Concentração (Vontade): ${concentrationTest.total} vs DT ${concentrationDT}`);
    
    if (!concentrationTest.success) {
      breakdown.push('❌ Falha na concentração - ritual interrompido');
      return {
        success: false,
        interrupted: true,
        ritualId,
        ritualName: ritual.name,
        element: ritual.element,
        circle: ritual.circle,
        level,
        peSpent: peCost, // Perde o PE mesmo em falha
        sanityLost: 0,
        permanentSanityLost: 0,
        concentrationTest,
        concentrationTests,
        breakdown,
        errors: ['Falha no teste de Vontade - ritual interrompido, PE perdido'],
      };
    }
    
    breakdown.push('✓ Concentração mantida');
  }
  
  // ========================================
  // ETAPA 3: CUSTO DO PARANORMAL (PDF p.132)
  // ========================================
  let sanityLost = 0;
  let permanentSanityLost = 0;
  let occultismTest: CastingTestResult | undefined;
  
  if (isFearElement) {
    // MEDO: Sempre perde SAN = custo + SAN permanente baseado no nível
    sanityLost = peCost;
    permanentSanityLost = FEAR_PERMANENT_SAN_LOSS[level];
    
    breakdown.push(`Elemento Medo: perde ${sanityLost} SAN`);
    breakdown.push(`Elemento Medo: perde ${permanentSanityLost} SAN permanente (${level})`);
  } else {
    // NÃO-MEDO: Teste de Ocultismo DT (20 + custo PE)
    const occultismDT = PARANORMAL_COST_BASE_DT + peCost;
    
    occultismTest = performTest(
      characterState.intellect,
      characterState.occultism,
      occultismDT,
      rollOptions?.preRolledOccultism?.diceResult
    );
    
    breakdown.push(`Teste de Ocultismo: ${occultismTest.total} vs DT ${occultismDT}`);
    
    if (occultismTest.success) {
      breakdown.push('✓ Custo do Paranormal evitado');
    } else {
      // Falha: perde SAN = custo PE
      sanityLost = peCost;
      breakdown.push(`❌ Falha no Ocultismo: perde ${sanityLost} SAN`);
      
      // Falha por 5+: perde 1 SAN permanente
      if (occultismTest.failedBy5OrMore) {
        permanentSanityLost = 1;
        breakdown.push(`❌ Falha por 5+: perde 1 SAN permanente`);
      }
    }
  }
  
  // ========================================
  // ETAPA 4: APLICAR EFEITOS DO RITUAL
  // ========================================
  // O registro já é uma dependência deste módulo; usa a mesma importação ESM.
  const appliedEffects = getRitualEffect(ritualId, selectedEnhancements);
  
  if (appliedEffects) {
    breakdown.push('✓ Efeitos do ritual aplicados');
  }
  
  // ========================================
  // RESULTADO FINAL
  // ========================================
  return {
    success: true,
    interrupted: false,
    ritualId,
    ritualName: ritual.name,
    element: ritual.element,
    circle: ritual.circle,
    level,
    peSpent: peCost,
    sanityLost,
    permanentSanityLost,
    concentrationTest,
    concentrationTests,
    occultismTest,
    appliedEffects,
    breakdown,
    errors,
  };
}

// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================

/**
 * Calcula DT de Ocultismo para Custo do Paranormal
 */
export function getOccultismDT(peCost: number): number {
  return PARANORMAL_COST_BASE_DT + peCost;
}

/**
 * Calcula DT de Concentração
 */
export function getConcentrationDT(armorType: 'none' | 'leve' | 'pesada' = 'none', peCost = 0): number {
  return CONCENTRATION_BASE_DT + peCost + (armorType === 'pesada' ? CONCENTRATION_HEAVY_ARMOR_BONUS : 0);
}

/**
 * Calcula perda de SAN permanente para rituais de Medo
 */
export function getFearPermanentSanLoss(level: 'base' | 'discente' | 'verdadeiro'): number {
  return FEAR_PERMANENT_SAN_LOSS[level];
}

/**
 * Verifica se um elemento é Medo (regras especiais aplicam)
 */
export function isFearElement(element: string): boolean {
  return element.toLowerCase() === 'medo';
}

/**
 * Gera resumo de resultado para log/histórico
 */
export function formatCastingResult(result: CastRitualResult): string {
  if (!result.success) {
    const reason = result.errors[0] || 'Falha na conjuração';
    return `${result.ritualName}: ${reason}`;
  }
  
  let summary = `${result.ritualName} (${result.level}): -${result.peSpent} PE`;
  
  if (result.sanityLost > 0) {
    summary += `, -${result.sanityLost} SAN`;
  }
  if (result.permanentSanityLost > 0) {
    summary += `, -${result.permanentSanityLost} SAN permanente`;
  }
  
  return summary;
}
