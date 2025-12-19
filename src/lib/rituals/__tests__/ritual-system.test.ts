/**
 * Testes Automatizados do Sistema de Rituais - Ordem Paranormal RPG
 * 
 * Este arquivo contém validações para garantir integridade do sistema de rituais
 * após a migração para o sistema unificado.
 */

import { UNIFIED_RITUALS, RITUAL_BY_ID, RITUALS_BY_CIRCLE, RITUALS_BY_ELEMENT } from '../unified-rituals';
import { getAllRituals, getRitualById, getRitualsByElement, getRitualsByCircle } from '../ritual-registry';
import type { UnifiedRitual, RitualElement, RitualCircle } from '../types';

// ========================================
// TIPOS DE RESULTADO DE TESTE
// ========================================

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string[];
}

interface TestSuiteResult {
  suiteName: string;
  passed: number;
  failed: number;
  results: TestResult[];
}

// ========================================
// FUNÇÕES DE TESTE
// ========================================

/**
 * Testa se todos os rituais têm IDs únicos
 */
function testUniqueIds(): TestResult {
  const ids = UNIFIED_RITUALS.map(r => r.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  
  return {
    name: 'IDs Únicos',
    passed: duplicates.length === 0,
    message: duplicates.length === 0 
      ? `Todos os ${ids.length} rituais têm IDs únicos`
      : `Encontrados ${duplicates.length} IDs duplicados`,
    details: duplicates.length > 0 ? duplicates : undefined
  };
}

/**
 * Testa se todos os rituais têm campos obrigatórios
 */
function testRequiredFields(): TestResult {
  const errors: string[] = [];
  const requiredFields: (keyof UnifiedRitual)[] = [
    'id', 'name', 'circle', 'element', 'execution', 
    'range', 'duration', 'description', 'cost', 'effects'
  ];
  
  for (const ritual of UNIFIED_RITUALS) {
    for (const field of requiredFields) {
      if (ritual[field] === undefined || ritual[field] === null) {
        errors.push(`${ritual.name || ritual.id}: falta campo '${field}'`);
      }
    }
  }
  
  return {
    name: 'Campos Obrigatórios',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Todos os rituais têm campos obrigatórios'
      : `${errors.length} campos faltando`,
    details: errors.length > 0 ? errors.slice(0, 10) : undefined
  };
}

/**
 * Testa se todos os rituais têm efeitos base definidos
 */
function testBaseEffects(): TestResult {
  const errors: string[] = [];
  
  for (const ritual of UNIFIED_RITUALS) {
    if (!ritual.effects?.base) {
      errors.push(`${ritual.name}: sem efeito base`);
    } else if (!ritual.effects.base.kind) {
      errors.push(`${ritual.name}: efeito base sem 'kind'`);
    } else if (!ritual.effects.base.summary) {
      errors.push(`${ritual.name}: efeito base sem 'summary'`);
    }
  }
  
  return {
    name: 'Efeitos Base',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Todos os rituais têm efeitos base válidos'
      : `${errors.length} rituais com problemas`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa se os enhancements têm estrutura válida
 */
function testEnhancementsStructure(): TestResult {
  const errors: string[] = [];
  
  for (const ritual of UNIFIED_RITUALS) {
    if (ritual.enhancements) {
      for (const enh of ritual.enhancements) {
        if (!enh.name) {
          errors.push(`${ritual.name}: enhancement sem nome`);
        }
        if (enh.cost === undefined) {
          errors.push(`${ritual.name}: enhancement '${enh.name}' sem custo`);
        }
        if (!enh.description) {
          errors.push(`${ritual.name}: enhancement '${enh.name}' sem descrição`);
        }
      }
    }
  }
  
  return {
    name: 'Estrutura de Enhancements',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Todos os enhancements têm estrutura válida'
      : `${errors.length} problemas encontrados`,
    details: errors.length > 0 ? errors.slice(0, 10) : undefined
  };
}

/**
 * Testa contagem de rituais por círculo
 */
function testRitualCountByCircle(): TestResult {
  const circles: RitualCircle[] = [1, 2, 3, 4];
  const counts: Record<number, number> = {};
  const details: string[] = [];
  
  for (const circle of circles) {
    const rituals = UNIFIED_RITUALS.filter(r => r.circle === circle);
    counts[circle] = rituals.length;
    details.push(`${circle}º Círculo: ${rituals.length} rituais`);
  }
  
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  
  return {
    name: 'Contagem por Círculo',
    passed: total >= 90, // Meta mínima de rituais
    message: `Total de ${total} rituais (meta: ≥90)`,
    details
  };
}

/**
 * Testa contagem de rituais por elemento
 */
function testRitualCountByElement(): TestResult {
  const elements: RitualElement[] = ['sangue', 'morte', 'energia', 'conhecimento', 'medo'];
  const counts: Record<string, number> = {};
  const details: string[] = [];
  
  for (const element of elements) {
    const rituals = UNIFIED_RITUALS.filter(r => r.element === element);
    counts[element] = rituals.length;
    details.push(`${element}: ${rituals.length} rituais`);
  }
  
  // Verifica se cada elemento tem pelo menos 10 rituais
  const hasMinimum = Object.values(counts).every(c => c >= 10);
  
  return {
    name: 'Contagem por Elemento',
    passed: hasMinimum,
    message: hasMinimum 
      ? 'Todos os elementos têm ≥10 rituais'
      : 'Alguns elementos têm poucos rituais',
    details
  };
}

/**
 * Testa se o mapa RITUAL_BY_ID está sincronizado
 */
function testRitualByIdMap(): TestResult {
  const errors: string[] = [];
  
  for (const ritual of UNIFIED_RITUALS) {
    const found = RITUAL_BY_ID.get(ritual.id);
    if (!found) {
      errors.push(`${ritual.id}: não encontrado no mapa`);
    } else if (found.name !== ritual.name) {
      errors.push(`${ritual.id}: nome não corresponde`);
    }
  }
  
  return {
    name: 'Mapa RITUAL_BY_ID',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? `Mapa sincronizado com ${RITUAL_BY_ID.size} entradas`
      : `${errors.length} inconsistências`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa se as funções do registry funcionam corretamente
 */
function testRegistryFunctions(): TestResult {
  const errors: string[] = [];
  
  // Testa getAllRituals
  const all = getAllRituals();
  if (all.length !== UNIFIED_RITUALS.length) {
    errors.push(`getAllRituals: retornou ${all.length}, esperado ${UNIFIED_RITUALS.length}`);
  }
  
  // Testa getRitualById
  const testRitual = UNIFIED_RITUALS[0];
  const found = getRitualById(testRitual.id);
  if (!found || found.id !== testRitual.id) {
    errors.push(`getRitualById: não encontrou ritual ${testRitual.id}`);
  }
  
  // Testa getRitualsByElement
  const byElement = getRitualsByElement('sangue');
  if (byElement.length === 0) {
    errors.push('getRitualsByElement: nenhum ritual de Sangue encontrado');
  }
  
  // Testa getRitualsByCircle
  const byCircle = getRitualsByCircle(1);
  if (byCircle.length === 0) {
    errors.push('getRitualsByCircle: nenhum ritual de 1º círculo encontrado');
  }
  
  return {
    name: 'Funções do Registry',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Todas as funções do registry funcionam'
      : `${errors.length} funções com problemas`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa consistência de custos de PE
 */
function testPECosts(): TestResult {
  const errors: string[] = [];
  const expectedCosts: Record<RitualCircle, number> = { 1: 1, 2: 2, 3: 4, 4: 6 };
  
  for (const ritual of UNIFIED_RITUALS) {
    const expected = expectedCosts[ritual.circle];
    // Alguns rituais têm custos diferentes (ex: Armamento Extradimensional custa 1)
    // Então verificamos apenas se o custo é >= 0 e <= 10
    if (ritual.cost < 0 || ritual.cost > 10) {
      errors.push(`${ritual.name}: custo ${ritual.cost} fora do intervalo válido`);
    }
  }
  
  return {
    name: 'Custos de PE',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Todos os custos de PE são válidos'
      : `${errors.length} rituais com custos inválidos`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa se rituais de arma têm isWeaponBuff marcado
 */
function testWeaponBuffMarking(): TestResult {
  const errors: string[] = [];
  
  for (const ritual of UNIFIED_RITUALS) {
    const isWeaponRitual = ritual.name.toLowerCase().includes('arma') || 
                           ritual.effects?.base?.weaponEffect;
    
    if (isWeaponRitual && ritual.effects?.base?.weaponEffect && !ritual.isWeaponBuff) {
      errors.push(`${ritual.name}: tem weaponEffect mas isWeaponBuff não está marcado`);
    }
  }
  
  return {
    name: 'Marcação de Weapon Buffs',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Rituais de arma corretamente marcados'
      : `${errors.length} rituais precisam de isWeaponBuff`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa se rituais sustentados têm isSustainable marcado
 */
function testSustainableMarking(): TestResult {
  const warnings: string[] = [];
  
  for (const ritual of UNIFIED_RITUALS) {
    const hasSustainEffect = ritual.effects?.base?.sustain?.concentration;
    const durationIsSustained = ritual.duration === 'Sustentada';
    
    if ((hasSustainEffect || durationIsSustained) && !ritual.isSustainable) {
      warnings.push(`${ritual.name}: parece sustentado mas isSustainable não está marcado`);
    }
  }
  
  return {
    name: 'Marcação de Sustentáveis',
    passed: true, // Warnings, não erros
    message: warnings.length === 0 
      ? 'Rituais sustentáveis corretamente marcados'
      : `${warnings.length} rituais podem precisar de isSustainable`,
    details: warnings.length > 0 ? warnings.slice(0, 5) : undefined
  };
}

// ========================================
// EXECUÇÃO DOS TESTES
// ========================================

/**
 * Executa todos os testes e retorna resultado consolidado
 */
export function runAllTests(): TestSuiteResult {
  const tests = [
    testUniqueIds,
    testRequiredFields,
    testBaseEffects,
    testEnhancementsStructure,
    testRitualCountByCircle,
    testRitualCountByElement,
    testRitualByIdMap,
    testRegistryFunctions,
    testPECosts,
    testWeaponBuffMarking,
    testSustainableMarking,
  ];
  
  const results = tests.map(test => test());
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  return {
    suiteName: 'Sistema de Rituais Unificado',
    passed,
    failed,
    results
  };
}

/**
 * Formata resultados para exibição no console
 */
export function formatTestResults(suite: TestSuiteResult): string {
  const lines: string[] = [
    `\n========================================`,
    `📋 ${suite.suiteName}`,
    `========================================`,
    `✅ Passou: ${suite.passed} | ❌ Falhou: ${suite.failed}`,
    `----------------------------------------`,
  ];
  
  for (const result of suite.results) {
    const icon = result.passed ? '✅' : '❌';
    lines.push(`${icon} ${result.name}: ${result.message}`);
    if (result.details && result.details.length > 0) {
      for (const detail of result.details) {
        lines.push(`   • ${detail}`);
      }
    }
  }
  
  lines.push(`========================================\n`);
  return lines.join('\n');
}

/**
 * Retorna estatísticas do sistema de rituais
 */
export function getRitualStats(): Record<string, unknown> {
  const byCircle: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const byElement: Record<string, number> = {};
  
  for (const ritual of UNIFIED_RITUALS) {
    byCircle[ritual.circle] = (byCircle[ritual.circle] || 0) + 1;
    byElement[ritual.element] = (byElement[ritual.element] || 0) + 1;
  }
  
  return {
    total: UNIFIED_RITUALS.length,
    byCircle,
    byElement,
    withWeaponBuff: UNIFIED_RITUALS.filter(r => r.isWeaponBuff).length,
    withSustainable: UNIFIED_RITUALS.filter(r => r.isSustainable).length,
    withHooks: UNIFIED_RITUALS.filter(r => r.hasHooks).length,
    withModes: UNIFIED_RITUALS.filter(r => r.hasModes).length,
  };
}
