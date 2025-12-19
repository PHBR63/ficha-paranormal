/**
 * Validador de Regras Oficiais - Ordem Paranormal RPG v1.3
 * 
 * Este arquivo contém testes e validações para garantir que os dados
 * do sistema correspondem às regras oficiais do livro.
 * 
 * Referências:
 * - Livro Base v1.3
 * - Suplemento Sobrevivendo ao Horror
 */

import { getMaxRitualCircle, getRitualCount, ALL_RITUALS } from './rituals-data';
import { 
  CONDITIONS, 
  CONDITION_CATEGORIES, 
  conditionRequiresParams,
  DAMAGE_TYPES,
} from './conditions';
import { CONDITION_EFFECTS } from './game-engine';

// ============== INTERFACES ==============

export interface ValidationResult {
  passed: boolean;
  category: string;
  test: string;
  expected: string;
  actual: string;
  reference?: string; // Página do livro
}

export interface ValidationReport {
  timestamp: Date;
  totalTests: number;
  passed: number;
  failed: number;
  results: ValidationResult[];
}

// ============== DADOS OFICIAIS DO LIVRO ==============

/**
 * Círculos de Ritual por NEX - Livro Base v1.3 p.117
 * Progressão oficial do Ocultista
 */
const OFFICIAL_RITUAL_CIRCLES: Record<number, number> = {
  5: 1,   // NEX 5% = 1º Círculo
  10: 1,
  15: 1,
  20: 1,
  25: 2,  // NEX 25% = 2º Círculo
  30: 2,
  35: 2,
  40: 2,
  45: 2,
  50: 2,
  55: 3,  // NEX 55% = 3º Círculo
  60: 3,
  65: 3,
  70: 3,
  75: 3,
  80: 3,
  85: 4,  // NEX 85% = 4º Círculo
  90: 4,
  95: 4,
  99: 4,
};

/**
 * Número de rituais conhecidos por NEX - Livro Base v1.3 p.117
 */
const OFFICIAL_RITUAL_COUNTS: Record<number, number> = {
  5: 3, 10: 4, 15: 5, 20: 6, 25: 7, 30: 8, 35: 9, 40: 10,
  45: 11, 50: 12, 55: 13, 60: 14, 65: 15, 70: 16, 75: 17,
  80: 18, 85: 19, 90: 20, 95: 21, 99: 22,
};

/**
 * Quantidade oficial de rituais por círculo - Livro Base v1.3
 */
const OFFICIAL_RITUAL_COUNTS_BY_CIRCLE: Record<number, number> = {
  1: 30, // ~30 rituais de 1º círculo
  2: 28, // ~28 rituais de 2º círculo
  3: 24, // ~24 rituais de 3º círculo
  4: 15, // ~15 rituais de 4º círculo
};

/**
 * Lista oficial de condições - Livro Base v1.3 p.232-235
 */
const OFFICIAL_CONDITIONS = [
  'agarrado', 'atordoado', 'caido', 'cego', 'confuso', 'debilitado',
  'desprevenido', 'doente', 'enjoado', 'enlouquecendo', 'enredado',
  'envenenado', 'esmorecido', 'exausto', 'fascinado', 'fraco',
  'fragilizado', 'frustrado', 'imobilizado', 'inconsciente', 'indefeso',
  'lento', 'machucado', 'morrendo', 'paralisado', 'pasmo', 'perturbado',
  'sangrando', 'surdo', 'surpreendido', 'vulneravel', 'apavorado',
];

/**
 * Condições que requerem parâmetros - Livro Base v1.3
 */
const OFFICIAL_PARAMS_CONDITIONS = ['fragilizado', 'machucado', 'envenenado'];

/**
 * Tipos de dano oficiais - Livro Base v1.3 p.220
 */
const OFFICIAL_DAMAGE_TYPES = [
  'balístico', 'corte', 'impacto', 'perfuração', // Físicos
  'fogo', 'frio', 'eletricidade', 'químico',      // Elementais
  'mental', 'sangue', 'morte', 'conhecimento', 'energia', 'medo', // Paranormais
];

/**
 * Modificadores de defesa por condição - Livro Base v1.3
 */
const OFFICIAL_DEFENSE_MODIFIERS: Record<string, number> = {
  agarrado: -2,
  atordoado: -2,
  desprevenido: -5,
  pasmo: -2,
  vulneravel: -2,
  // Caído é contextual: -5 melee, +5 ranged
};

/**
 * Modificadores de teste por condição - Livro Base v1.3
 */
const OFFICIAL_TEST_MODIFIERS: Record<string, number> = {
  apavorado: -2,
  debilitado: -1,
  doente: -2,
  envenenado: -2,
  esmorecido: -2, // Apenas perícias
  exausto: -2,
  perturbado: -2,
  cego: -5, // Em ataques
  enredado: -2, // Ataques e Reflexos
};

// ============== FUNÇÕES DE VALIDAÇÃO ==============

/**
 * Valida os círculos de ritual por NEX
 */
function validateRitualCircles(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const [nex, expectedCircle] of Object.entries(OFFICIAL_RITUAL_CIRCLES)) {
    const nexNum = parseInt(nex);
    const actualCircle = getMaxRitualCircle(nexNum);
    
    results.push({
      passed: actualCircle === expectedCircle,
      category: 'Rituais',
      test: `Círculo máximo em NEX ${nex}%`,
      expected: `${expectedCircle}º Círculo`,
      actual: `${actualCircle}º Círculo`,
      reference: 'Livro Base v1.3 p.117',
    });
  }
  
  return results;
}

/**
 * Valida o número de rituais conhecidos por NEX
 */
function validateRitualCounts(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const [nex, expectedCount] of Object.entries(OFFICIAL_RITUAL_COUNTS)) {
    const nexNum = parseInt(nex);
    const actualCount = getRitualCount(nexNum);
    
    results.push({
      passed: actualCount === expectedCount,
      category: 'Rituais',
      test: `Rituais conhecidos em NEX ${nex}%`,
      expected: `${expectedCount} rituais`,
      actual: `${actualCount} rituais`,
      reference: 'Livro Base v1.3 p.117',
    });
  }
  
  return results;
}

/**
 * Valida a quantidade de rituais por círculo
 */
function validateRitualCountsByCircle(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  const actualCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const ritual of ALL_RITUALS) {
    actualCounts[ritual.circle]++;
  }
  
  for (const [circle, expectedCount] of Object.entries(OFFICIAL_RITUAL_COUNTS_BY_CIRCLE)) {
    const circleNum = parseInt(circle);
    const actualCount = actualCounts[circleNum];
    // Tolerância de ±5 para variações entre edições
    const tolerance = 5;
    const passed = Math.abs(actualCount - expectedCount) <= tolerance;
    
    results.push({
      passed,
      category: 'Rituais',
      test: `Quantidade de rituais de ${circle}º Círculo`,
      expected: `~${expectedCount} rituais (±${tolerance})`,
      actual: `${actualCount} rituais`,
      reference: 'Livro Base v1.3',
    });
  }
  
  return results;
}

/**
 * Valida que todas as condições oficiais existem
 */
function validateConditionsExist(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const conditionId of OFFICIAL_CONDITIONS) {
    const exists = CONDITIONS[conditionId] !== undefined;
    
    results.push({
      passed: exists,
      category: 'Condições',
      test: `Condição "${conditionId}" existe`,
      expected: 'Definida',
      actual: exists ? 'Definida' : 'NÃO ENCONTRADA',
      reference: 'Livro Base v1.3 p.232-235',
    });
  }
  
  return results;
}

/**
 * Valida que condições estão corretamente categorizadas
 */
function validateConditionCategories(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  const allCategorized = new Set<string>();
  for (const ids of Object.values(CONDITION_CATEGORIES)) {
    ids.forEach(id => allCategorized.add(id));
  }
  
  for (const conditionId of Object.keys(CONDITIONS)) {
    const isCategorized = allCategorized.has(conditionId);
    
    results.push({
      passed: isCategorized,
      category: 'Condições',
      test: `Condição "${conditionId}" está categorizada`,
      expected: 'Categorizada',
      actual: isCategorized ? 'Categorizada' : 'SEM CATEGORIA',
      reference: 'Livro Base v1.3',
    });
  }
  
  return results;
}

/**
 * Valida que condições com parâmetros estão marcadas corretamente
 */
function validateConditionParams(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const conditionId of OFFICIAL_PARAMS_CONDITIONS) {
    const requiresParams = conditionRequiresParams(conditionId);
    
    results.push({
      passed: requiresParams,
      category: 'Condições',
      test: `Condição "${conditionId}" suporta parâmetros`,
      expected: 'hasParams = true',
      actual: requiresParams ? 'hasParams = true' : 'hasParams = false/undefined',
      reference: 'Livro Base v1.3',
    });
  }
  
  return results;
}

/**
 * Valida tipos de dano
 */
function validateDamageTypes(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  const implementedTypes = DAMAGE_TYPES.map(d => d.id as string);
  
  for (const damageType of OFFICIAL_DAMAGE_TYPES) {
    const exists = implementedTypes.includes(damageType);
    
    results.push({
      passed: exists,
      category: 'Tipos de Dano',
      test: `Tipo de dano "${damageType}" existe`,
      expected: 'Definido',
      actual: exists ? 'Definido' : 'NÃO ENCONTRADO',
      reference: 'Livro Base v1.3 p.220',
    });
  }
  
  return results;
}

/**
 * Valida modificadores de defesa
 */
function validateDefenseModifiers(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const [conditionId, expectedMod] of Object.entries(OFFICIAL_DEFENSE_MODIFIERS)) {
    const effect = CONDITION_EFFECTS[conditionId];
    const actualMod = effect?.defenseModifier ?? 0;
    
    results.push({
      passed: actualMod === expectedMod,
      category: 'Modificadores',
      test: `Modificador de defesa de "${conditionId}"`,
      expected: `${expectedMod}`,
      actual: `${actualMod}`,
      reference: 'Livro Base v1.3 p.232-235',
    });
  }
  
  return results;
}

/**
 * Valida modificadores de teste
 */
function validateTestModifiers(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const [conditionId, expectedMod] of Object.entries(OFFICIAL_TEST_MODIFIERS)) {
    const effect = CONDITION_EFFECTS[conditionId];
    const actualMod = effect?.testModifier ?? 0;
    
    results.push({
      passed: actualMod === expectedMod,
      category: 'Modificadores',
      test: `Modificador de teste de "${conditionId}"`,
      expected: `${expectedMod}`,
      actual: `${actualMod}`,
      reference: 'Livro Base v1.3 p.232-235',
    });
  }
  
  return results;
}

/**
 * Valida que rituais têm estrutura correta
 */
function validateRitualStructure(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  const requiredFields = ['id', 'name', 'circle', 'element', 'cost', 'description'];
  
  let malformedCount = 0;
  for (const ritual of ALL_RITUALS) {
    for (const field of requiredFields) {
      if (!(field in ritual)) {
        malformedCount++;
        break;
      }
    }
  }
  
  results.push({
    passed: malformedCount === 0,
    category: 'Rituais',
    test: 'Todos os rituais têm campos obrigatórios',
    expected: '0 rituais malformados',
    actual: `${malformedCount} rituais malformados`,
    reference: 'Estrutura padrão de ritual',
  });
  
  // Valida elementos
  const validElements = ['sangue', 'morte', 'conhecimento', 'energia', 'medo'];
  let invalidElementCount = 0;
  for (const ritual of ALL_RITUALS) {
    if (!validElements.includes(ritual.element)) {
      invalidElementCount++;
    }
  }
  
  results.push({
    passed: invalidElementCount === 0,
    category: 'Rituais',
    test: 'Todos os rituais têm elemento válido',
    expected: '0 rituais com elemento inválido',
    actual: `${invalidElementCount} rituais com elemento inválido`,
    reference: 'Livro Base v1.3 - Elementos paranormais',
  });
  
  return results;
}

// ============== EXECUÇÃO DE VALIDAÇÃO ==============

/**
 * Executa todas as validações e retorna relatório completo
 */
export function runFullValidation(): ValidationReport {
  const allResults: ValidationResult[] = [
    ...validateRitualCircles(),
    ...validateRitualCounts(),
    ...validateRitualCountsByCircle(),
    ...validateConditionsExist(),
    ...validateConditionCategories(),
    ...validateConditionParams(),
    ...validateDamageTypes(),
    ...validateDefenseModifiers(),
    ...validateTestModifiers(),
    ...validateRitualStructure(),
  ];
  
  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => !r.passed).length;
  
  return {
    timestamp: new Date(),
    totalTests: allResults.length,
    passed,
    failed,
    results: allResults,
  };
}

/**
 * Executa validação e retorna apenas falhas
 */
export function getValidationFailures(): ValidationResult[] {
  const report = runFullValidation();
  return report.results.filter(r => !r.passed);
}

/**
 * Executa validação de uma categoria específica
 */
export function validateCategory(category: 'rituais' | 'condições' | 'modificadores' | 'dano'): ValidationResult[] {
  switch (category) {
    case 'rituais':
      return [
        ...validateRitualCircles(),
        ...validateRitualCounts(),
        ...validateRitualCountsByCircle(),
        ...validateRitualStructure(),
      ];
    case 'condições':
      return [
        ...validateConditionsExist(),
        ...validateConditionCategories(),
        ...validateConditionParams(),
      ];
    case 'modificadores':
      return [
        ...validateDefenseModifiers(),
        ...validateTestModifiers(),
      ];
    case 'dano':
      return validateDamageTypes();
  }
}

/**
 * Formata relatório para console
 */
export function formatReportForConsole(report: ValidationReport): string {
  const lines: string[] = [
    '═══════════════════════════════════════════════════════════════',
    '  VALIDADOR DE REGRAS OFICIAIS - Ordem Paranormal RPG v1.3',
    '═══════════════════════════════════════════════════════════════',
    '',
    `📅 Data: ${report.timestamp.toLocaleString('pt-BR')}`,
    `📊 Total de testes: ${report.totalTests}`,
    `✅ Passou: ${report.passed}`,
    `❌ Falhou: ${report.failed}`,
    `📈 Taxa de sucesso: ${((report.passed / report.totalTests) * 100).toFixed(1)}%`,
    '',
  ];
  
  // Agrupa por categoria
  const byCategory: Record<string, ValidationResult[]> = {};
  for (const result of report.results) {
    if (!byCategory[result.category]) {
      byCategory[result.category] = [];
    }
    byCategory[result.category].push(result);
  }
  
  for (const [category, results] of Object.entries(byCategory)) {
    const categoryPassed = results.filter(r => r.passed).length;
    const categoryFailed = results.filter(r => !r.passed).length;
    
    lines.push(`\n┌─ ${category.toUpperCase()} (${categoryPassed}/${results.length})`);
    
    for (const result of results) {
      const icon = result.passed ? '✓' : '✗';
      const color = result.passed ? '' : ' [FALHA]';
      lines.push(`│  ${icon} ${result.test}${color}`);
      if (!result.passed) {
        lines.push(`│    Esperado: ${result.expected}`);
        lines.push(`│    Atual: ${result.actual}`);
        if (result.reference) {
          lines.push(`│    Ref: ${result.reference}`);
        }
      }
    }
    
    lines.push('└─────────────────────────────────────────');
  }
  
  return lines.join('\n');
}

/**
 * Executa validação completa e loga no console
 */
export function runAndLogValidation(): ValidationReport {
  const report = runFullValidation();
  console.log(formatReportForConsole(report));
  return report;
}
