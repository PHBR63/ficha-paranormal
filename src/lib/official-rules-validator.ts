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
import { PARANORMAL_POWERS } from './paranormal-powers';
import { 
  COMBATENTE_ABILITIES, 
  ESPECIALISTA_ABILITIES, 
  OCULTISTA_ABILITIES 
} from './class-abilities';
import { ORIGINS, CLASSES, CLASS_TRACKS } from './character-data';

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

// ============== DADOS OFICIAIS - PODERES PARANORMAIS ==============

/**
 * Poderes Paranormais oficiais - Livro Base v1.3 p.114-116
 * 22 poderes: 5 Sangue, 5 Morte, 5 Conhecimento, 5 Energia, 2 Genéricos
 */
const OFFICIAL_PARANORMAL_POWERS = {
  sangue: ['anatomia-insana', 'arma-de-sangue', 'sangue-de-ferro', 'sangue-fervente', 'sangue-vivo'],
  morte: ['encarar-a-morte', 'escapar-da-morte', 'potencial-aprimorado', 'potencial-reaproveitado', 'surto-temporal'],
  conhecimento: ['expansao-de-conhecimento', 'percepcao-paranormal', 'precognicao', 'sensitivo', 'visao-do-oculto'],
  energia: ['afortunado', 'campo-protetor', 'causalidade-fortuita', 'golpe-de-sorte', 'manipular-entropia'],
  generic: ['aprender-ritual', 'resistir-a-elemento'],
};

/**
 * Poderes que exigem pré-requisitos de outros poderes
 */
const OFFICIAL_POWER_PREREQUISITES: Record<string, { element: string; count: number }> = {
  'sangue-fervente': { element: 'sangue', count: 1 },
  'sangue-vivo': { element: 'sangue', count: 2 },
  'escapar-da-morte': { element: 'morte', count: 1 },
  'potencial-reaproveitado': { element: 'morte', count: 1 },
  'surto-temporal': { element: 'morte', count: 2 },
  'precognicao': { element: 'conhecimento', count: 1 },
  'visao-do-oculto': { element: 'conhecimento', count: 2 },
  'campo-protetor': { element: 'energia', count: 1 },
  'golpe-de-sorte': { element: 'energia', count: 1 },
  'manipular-entropia': { element: 'energia', count: 2 },
};

// ============== DADOS OFICIAIS - ORIGENS ==============

/**
 * 26 origens oficiais do Livro Base v1.3
 */
const OFFICIAL_ORIGINS = [
  'academico', 'agente-de-saude', 'amnesico', 'artista', 'atleta', 'chef',
  'criminoso', 'cultista-arrependido', 'desgarrado', 'engenheiro', 'executivo',
  'investigador', 'lutador', 'magnata', 'mercenario', 'militar', 'operario',
  'policial', 'religioso', 'servidor-publico', 'ti', 'teorico-da-conspiracao',
  'trabalhador-rural', 'trambiqueiro', 'universitario', 'vitima',
];

/**
 * Origens que concedem perícias específicas
 */
const OFFICIAL_ORIGIN_SKILLS: Record<string, string[]> = {
  'academico': ['ciencias', 'investigacao'],
  'agente-de-saude': ['intuicao', 'medicina'],
  'artista': ['artes', 'enganacao'],
  'atleta': ['acrobacia', 'atletismo'],
  'chef': ['fortitude', 'profissao'],
  'criminoso': ['crime', 'furtividade'],
  'cultista-arrependido': ['ocultismo', 'religiao'],
  'desgarrado': ['fortitude', 'sobrevivencia'],
  'engenheiro': ['profissao', 'tecnologia'],
  'executivo': ['diplomacia', 'profissao'],
  'investigador': ['investigacao', 'percepcao'],
  'lutador': ['luta', 'reflexos'],
  'magnata': ['diplomacia', 'pilotagem'],
  'mercenario': ['iniciativa', 'intimidacao'],
  'militar': ['pontaria', 'tatica'],
  'operario': ['fortitude', 'profissao'],
  'policial': ['percepcao', 'pontaria'],
  'religioso': ['religiao', 'vontade'],
  'servidor-publico': ['intuicao', 'vontade'],
  'ti': ['investigacao', 'tecnologia'],
  'teorico-da-conspiracao': ['investigacao', 'ocultismo'],
  'trabalhador-rural': ['adestramento', 'sobrevivencia'],
  'trambiqueiro': ['crime', 'enganacao'],
  'universitario': ['atualidades', 'investigacao'],
  'vitima': ['reflexos', 'vontade'],
  // Amnésico não tem perícias fixas
};

// ============== DADOS OFICIAIS - CLASSES ==============

/**
 * Classes oficiais e suas estatísticas base
 */
const OFFICIAL_CLASS_STATS: Record<string, { pvBase: number; peBase: number; sanBase: number }> = {
  'Combatente': { pvBase: 20, peBase: 2, sanBase: 12 },
  'Especialista': { pvBase: 16, peBase: 3, sanBase: 16 },
  'Ocultista': { pvBase: 12, peBase: 4, sanBase: 20 },
};

/**
 * NEX em que cada classe recebe poderes de classe
 */
const OFFICIAL_POWER_NEX = [15, 30, 45, 60, 75, 90];

/**
 * NEX em que cada classe recebe poderes de trilha
 */
const OFFICIAL_TRACK_NEX = [10, 40, 65, 99];

// ============== DADOS OFICIAIS - TRILHAS ==============

/**
 * 15 trilhas oficiais do Livro Base v1.3
 * 5 por classe: Combatente, Especialista, Ocultista
 */
const OFFICIAL_TRACKS: Record<string, string[]> = {
  'Combatente': ['aniquilador', 'comandante-campo', 'guerreiro', 'operacoes-especiais', 'tropa-choque'],
  'Especialista': ['atirador-elite', 'infiltrador', 'medico-campo', 'negociador', 'tecnico'],
  'Ocultista': ['condutor', 'flagelador', 'graduado', 'intuitivo', 'lamina-paranormal'],
};

/**
 * Habilidades de trilha e seus NEX corretos
 * Cada trilha tem 4 habilidades: NEX 10%, 40%, 65%, 99%
 */
const OFFICIAL_TRACK_ABILITIES: Record<string, { name: string; minNex: number }[]> = {
  // === COMBATENTE ===
  'aniquilador': [
    { name: 'A Favorita', minNex: 10 },
    { name: 'Técnica Secreta', minNex: 40 },
    { name: 'Técnica Sublime', minNex: 65 },
    { name: 'Máquina de Matar', minNex: 99 },
  ],
  'comandante-campo': [
    { name: 'Inspirar Confiança', minNex: 10 },
    { name: 'Estrategista', minNex: 40 },
    { name: 'Brecha na Guarda', minNex: 65 },
    { name: 'Oficial Comandante', minNex: 99 },
  ],
  'guerreiro': [
    { name: 'Técnica Letal', minNex: 10 },
    { name: 'Revidar', minNex: 40 },
    { name: 'Força Opressora', minNex: 65 },
    { name: 'Potência Máxima', minNex: 99 },
  ],
  'operacoes-especiais': [
    { name: 'Iniciativa Aprimorada', minNex: 10 },
    { name: 'Ataque Extra', minNex: 40 },
    { name: 'Surto de Adrenalina', minNex: 65 },
    { name: 'Sempre Alerta', minNex: 99 },
  ],
  'tropa-choque': [
    { name: 'Casca Grossa', minNex: 10 },
    { name: 'Cai Dentro', minNex: 40 },
    { name: 'Duro de Matar', minNex: 65 },
    { name: 'Inquebrável', minNex: 99 },
  ],
  // === ESPECIALISTA ===
  'atirador-elite': [
    { name: 'Mira de Elite', minNex: 10 },
    { name: 'Disparo Letal', minNex: 40 },
    { name: 'Disparo Impactante', minNex: 65 },
    { name: 'Atirar para Matar', minNex: 99 },
  ],
  'infiltrador': [
    { name: 'Ataque Furtivo', minNex: 10 },
    { name: 'Gatuno', minNex: 40 },
    { name: 'Assassinar', minNex: 65 },
    { name: 'Sombra Fugaz', minNex: 99 },
  ],
  'medico-campo': [
    { name: 'Paramédico', minNex: 10 },
    { name: 'Equipe de Trauma', minNex: 40 },
    { name: 'Resgate', minNex: 65 },
    { name: 'Reanimação', minNex: 99 },
  ],
  'negociador': [
    { name: 'Eloquência', minNex: 10 },
    { name: 'Discurso Motivador', minNex: 40 },
    { name: 'Eu Conheço um Cara', minNex: 65 },
    { name: 'Truque de Mestre', minNex: 99 },
  ],
  'tecnico': [
    { name: 'Inventário Otimizado', minNex: 10 },
    { name: 'Remendo', minNex: 40 },
    { name: 'Improvisar', minNex: 65 },
    { name: 'Preparado para Tudo', minNex: 99 },
  ],
  // === OCULTISTA ===
  'condutor': [
    { name: 'Ampliar Ritual', minNex: 10 },
    { name: 'Acelerar Ritual', minNex: 40 },
    { name: 'Anular Ritual', minNex: 65 },
    { name: 'Canalizar o Medo', minNex: 99 },
  ],
  'flagelador': [
    { name: 'Poder do Flagelo', minNex: 10 },
    { name: 'Abraçar a Dor', minNex: 40 },
    { name: 'Absorver Angústia', minNex: 65 },
    { name: 'Medo Tangível', minNex: 99 },
  ],
  'graduado': [
    { name: 'Saber Ampliado', minNex: 10 },
    { name: 'Grimório Ritualístico', minNex: 40 },
    { name: 'Rituais Eficientes', minNex: 65 },
    { name: 'Conhecendo o Medo', minNex: 99 },
  ],
  'intuitivo': [
    { name: 'Mente Sã', minNex: 10 },
    { name: 'Presença Poderosa', minNex: 40 },
    { name: 'Inabalável', minNex: 65 },
    { name: 'Presença do Medo', minNex: 99 },
  ],
  'lamina-paranormal': [
    { name: 'Lâmina Maldita', minNex: 10 },
    { name: 'Gladiador Paranormal', minNex: 40 },
    { name: 'Conjuração Marcial', minNex: 65 },
    { name: 'Lâmina do Medo', minNex: 99 },
  ],
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

// ============== VALIDAÇÃO DE PODERES PARANORMAIS ==============

/**
 * Valida que todos os 22 poderes paranormais oficiais existem
 */
function validateParanormalPowersExist(): ValidationResult[] {
  const results: ValidationResult[] = [];
  const implementedIds = PARANORMAL_POWERS.map(p => p.id);
  
  const allOfficialPowers = [
    ...OFFICIAL_PARANORMAL_POWERS.sangue,
    ...OFFICIAL_PARANORMAL_POWERS.morte,
    ...OFFICIAL_PARANORMAL_POWERS.conhecimento,
    ...OFFICIAL_PARANORMAL_POWERS.energia,
    ...OFFICIAL_PARANORMAL_POWERS.generic,
  ];
  
  for (const powerId of allOfficialPowers) {
    const exists = implementedIds.includes(powerId);
    
    results.push({
      passed: exists,
      category: 'Poderes Paranormais',
      test: `Poder "${powerId}" existe`,
      expected: 'Implementado',
      actual: exists ? 'Implementado' : 'NÃO ENCONTRADO',
      reference: 'Livro Base v1.3 p.114-116',
    });
  }
  
  return results;
}

/**
 * Valida que poderes estão corretamente associados aos elementos
 */
function validateParanormalPowerElements(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const [element, powerIds] of Object.entries(OFFICIAL_PARANORMAL_POWERS)) {
    for (const powerId of powerIds) {
      const power = PARANORMAL_POWERS.find(p => p.id === powerId);
      if (!power) continue;
      
      const expectedElement = element === 'generic' ? 'generic' : element;
      const passed = power.element === expectedElement;
      
      results.push({
        passed,
        category: 'Poderes Paranormais',
        test: `Elemento do poder "${powerId}"`,
        expected: expectedElement,
        actual: power.element,
        reference: 'Livro Base v1.3 p.114-116',
      });
    }
  }
  
  return results;
}

/**
 * Valida os pré-requisitos dos poderes paranormais
 */
function validateParanormalPowerPrereqs(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const [powerId, prereq] of Object.entries(OFFICIAL_POWER_PREREQUISITES)) {
    const power = PARANORMAL_POWERS.find(p => p.id === powerId);
    if (!power) continue;
    
    const hasCorrectPrereq = power.prerequisite && 
      power.prerequisite.element === prereq.element &&
      power.prerequisite.count === prereq.count;
    
    results.push({
      passed: !!hasCorrectPrereq,
      category: 'Poderes Paranormais',
      test: `Pré-requisito de "${powerId}"`,
      expected: `${prereq.element} ${prereq.count}`,
      actual: power.prerequisite 
        ? `${power.prerequisite.element} ${power.prerequisite.count}` 
        : 'Nenhum',
      reference: 'Livro Base v1.3 p.114-116',
    });
  }
  
  return results;
}

/**
 * Valida contagem de poderes por elemento
 */
function validateParanormalPowerCounts(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  const countByElement: Record<string, number> = {};
  for (const power of PARANORMAL_POWERS) {
    countByElement[power.element] = (countByElement[power.element] || 0) + 1;
  }
  
  const expectedCounts = {
    sangue: 5,
    morte: 5,
    conhecimento: 5,
    energia: 5,
    generic: 2,
  };
  
  for (const [element, expectedCount] of Object.entries(expectedCounts)) {
    const actualCount = countByElement[element] || 0;
    
    results.push({
      passed: actualCount === expectedCount,
      category: 'Poderes Paranormais',
      test: `Quantidade de poderes de ${element}`,
      expected: `${expectedCount} poderes`,
      actual: `${actualCount} poderes`,
      reference: 'Livro Base v1.3 p.114-116',
    });
  }
  
  return results;
}

// ============== VALIDAÇÃO DE ORIGENS ==============

/**
 * Valida que todas as 26 origens oficiais existem
 */
function validateOriginsExist(): ValidationResult[] {
  const results: ValidationResult[] = [];
  const implementedIds = ORIGINS.map(o => o.id);
  
  for (const originId of OFFICIAL_ORIGINS) {
    const exists = implementedIds.includes(originId);
    
    results.push({
      passed: exists,
      category: 'Origens',
      test: `Origem "${originId}" existe`,
      expected: 'Implementada',
      actual: exists ? 'Implementada' : 'NÃO ENCONTRADA',
      reference: 'Livro Base v1.3 p.22-27',
    });
  }
  
  return results;
}

/**
 * Valida as perícias concedidas por cada origem
 */
function validateOriginSkills(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const [originId, expectedSkills] of Object.entries(OFFICIAL_ORIGIN_SKILLS)) {
    const origin = ORIGINS.find(o => o.id === originId);
    if (!origin) continue;
    
    const actualSkills = origin.skills || [];
    const skillsMatch = expectedSkills.length === actualSkills.length &&
      expectedSkills.every(s => actualSkills.includes(s));
    
    results.push({
      passed: skillsMatch,
      category: 'Origens',
      test: `Perícias de "${originId}"`,
      expected: expectedSkills.join(', '),
      actual: actualSkills.join(', ') || 'Nenhuma',
      reference: 'Livro Base v1.3 p.22-27',
    });
  }
  
  return results;
}

/**
 * Valida que todas as origens têm poder de origem
 */
function validateOriginPowers(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const originId of OFFICIAL_ORIGINS) {
    const origin = ORIGINS.find(o => o.id === originId);
    if (!origin) continue;
    
    const hasPower = origin.powers && origin.powers.length > 0;
    const hasPowerDesc = origin.powerDescription && origin.powerDescription.length > 0;
    
    results.push({
      passed: hasPower && hasPowerDesc,
      category: 'Origens',
      test: `Poder de origem de "${originId}"`,
      expected: 'Nome e descrição do poder',
      actual: hasPower && hasPowerDesc 
        ? `${origin.powers?.[0]}` 
        : 'Incompleto',
      reference: 'Livro Base v1.3 p.22-27',
    });
  }
  
  return results;
}

// ============== VALIDAÇÃO DE CLASSES ==============

/**
 * Valida as estatísticas base das classes
 */
function validateClassBaseStats(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const [classId, stats] of Object.entries(OFFICIAL_CLASS_STATS)) {
    const classData = CLASSES.find(c => c.id === classId);
    if (!classData) {
      results.push({
        passed: false,
        category: 'Classes',
        test: `Classe "${classId}" existe`,
        expected: 'Implementada',
        actual: 'NÃO ENCONTRADA',
        reference: 'Livro Base v1.3',
      });
      continue;
    }
    
    results.push({
      passed: classData.pvBase === stats.pvBase,
      category: 'Classes',
      test: `PV base de ${classId}`,
      expected: `${stats.pvBase}`,
      actual: `${classData.pvBase}`,
      reference: 'Livro Base v1.3',
    });
    
    results.push({
      passed: classData.peBase === stats.peBase,
      category: 'Classes',
      test: `PE base de ${classId}`,
      expected: `${stats.peBase}`,
      actual: `${classData.peBase}`,
      reference: 'Livro Base v1.3',
    });
    
    results.push({
      passed: classData.sanBase === stats.sanBase,
      category: 'Classes',
      test: `SAN base de ${classId}`,
      expected: `${stats.sanBase}`,
      actual: `${classData.sanBase}`,
      reference: 'Livro Base v1.3',
    });
  }
  
  return results;
}

/**
 * Valida quantidade de habilidades por classe
 */
function validateClassAbilitiesCount(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  const classCounts = {
    Combatente: COMBATENTE_ABILITIES.length,
    Especialista: ESPECIALISTA_ABILITIES.length,
    Ocultista: OCULTISTA_ABILITIES.length,
  };
  
  for (const [className, count] of Object.entries(classCounts)) {
    // Cada classe deve ter pelo menos 15+ habilidades (core + escolhas)
    const passed = count >= 15;
    
    results.push({
      passed,
      category: 'Classes',
      test: `Habilidades de ${className}`,
      expected: '≥15 habilidades',
      actual: `${count} habilidades`,
      reference: 'Livro Base v1.3',
    });
  }
  
  return results;
}

/**
 * Valida que habilidades core existem para cada classe
 */
function validateCoreAbilities(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  const coreAbilities = {
    Combatente: ['ataque-especial'],
    Especialista: ['ecletico', 'perito'],
    Ocultista: ['afinidade', 'escolhido'],
  };
  
  for (const [className, requiredIds] of Object.entries(coreAbilities)) {
    const abilities = className === 'Combatente' 
      ? COMBATENTE_ABILITIES 
      : className === 'Especialista' 
        ? ESPECIALISTA_ABILITIES 
        : OCULTISTA_ABILITIES;
    
    for (const abilityId of requiredIds) {
      const exists = abilities.some(a => a.id === abilityId && a.isCore);
      
      results.push({
        passed: exists,
        category: 'Classes',
        test: `Habilidade core "${abilityId}" de ${className}`,
        expected: 'Existe e isCore=true',
        actual: exists ? 'Implementada' : 'NÃO ENCONTRADA',
        reference: 'Livro Base v1.3',
      });
    }
  }
  
  return results;
}

/**
 * Valida estrutura das habilidades de classe
 */
function validateAbilityStructure(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  const allAbilities = [
    ...COMBATENTE_ABILITIES,
    ...ESPECIALISTA_ABILITIES,
    ...OCULTISTA_ABILITIES,
  ];
  
  const requiredFields = ['id', 'name', 'description', 'minNex', 'classId'];
  let malformedCount = 0;
  
  for (const ability of allAbilities) {
    for (const field of requiredFields) {
      if (!(field in ability)) {
        malformedCount++;
        break;
      }
    }
  }
  
  results.push({
    passed: malformedCount === 0,
    category: 'Classes',
    test: 'Estrutura das habilidades',
    expected: '0 habilidades malformadas',
    actual: `${malformedCount} habilidades malformadas`,
    reference: 'Estrutura padrão de habilidade',
  });
  
  // Valida que minNex está em valores válidos
  const validNex = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99];
  let invalidNexCount = 0;
  
  for (const ability of allAbilities) {
    if (!validNex.includes(ability.minNex)) {
      invalidNexCount++;
    }
  }
  
  results.push({
    passed: invalidNexCount === 0,
    category: 'Classes',
    test: 'Valores de NEX das habilidades',
    expected: '0 com NEX inválido',
    actual: `${invalidNexCount} com NEX inválido`,
    reference: 'Livro Base v1.3',
  });
  
  return results;
}

// ============== VALIDAÇÃO DE TRILHAS ==============

/**
 * Valida que todas as 15 trilhas oficiais existem
 */
function validateTracksExist(): ValidationResult[] {
  const results: ValidationResult[] = [];
  const implementedIds = CLASS_TRACKS.map(t => t.id);
  
  for (const [className, trackIds] of Object.entries(OFFICIAL_TRACKS)) {
    for (const trackId of trackIds) {
      const exists = implementedIds.includes(trackId);
      
      results.push({
        passed: exists,
        category: 'Trilhas',
        test: `Trilha "${trackId}" de ${className}`,
        expected: 'Implementada',
        actual: exists ? 'Implementada' : 'NÃO ENCONTRADA',
        reference: 'Livro Base v1.3 p.46-61',
      });
    }
  }
  
  return results;
}

/**
 * Valida que cada trilha pertence à classe correta
 */
function validateTrackClasses(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const [className, trackIds] of Object.entries(OFFICIAL_TRACKS)) {
    for (const trackId of trackIds) {
      const track = CLASS_TRACKS.find(t => t.id === trackId);
      if (!track) continue;
      
      const passed = track.classId === className;
      
      results.push({
        passed,
        category: 'Trilhas',
        test: `Classe da trilha "${trackId}"`,
        expected: className,
        actual: track.classId,
        reference: 'Livro Base v1.3',
      });
    }
  }
  
  return results;
}

/**
 * Valida que cada trilha tem exatamente 4 habilidades
 */
function validateTrackAbilityCount(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const trackId of Object.keys(OFFICIAL_TRACK_ABILITIES)) {
    const track = CLASS_TRACKS.find(t => t.id === trackId);
    if (!track) continue;
    
    const expected = 4;
    const actual = track.abilities?.length || 0;
    
    results.push({
      passed: actual === expected,
      category: 'Trilhas',
      test: `Quantidade de habilidades de "${trackId}"`,
      expected: `${expected} habilidades`,
      actual: `${actual} habilidades`,
      reference: 'Livro Base v1.3',
    });
  }
  
  return results;
}

/**
 * Valida os NEX corretos das habilidades de trilha (10%, 40%, 65%, 99%)
 */
function validateTrackAbilityNex(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const [trackId, officialAbilities] of Object.entries(OFFICIAL_TRACK_ABILITIES)) {
    const track = CLASS_TRACKS.find(t => t.id === trackId);
    if (!track || !track.abilities) continue;
    
    for (const officialAbility of officialAbilities) {
      const implemented = track.abilities.find(a => 
        a.name.toLowerCase() === officialAbility.name.toLowerCase()
      );
      
      if (!implemented) {
        results.push({
          passed: false,
          category: 'Trilhas',
          test: `Habilidade "${officialAbility.name}" de ${trackId}`,
          expected: `Existe em NEX ${officialAbility.minNex}%`,
          actual: 'NÃO ENCONTRADA',
          reference: 'Livro Base v1.3',
        });
        continue;
      }
      
      const passed = implemented.minNex === officialAbility.minNex;
      
      results.push({
        passed,
        category: 'Trilhas',
        test: `NEX de "${officialAbility.name}" (${trackId})`,
        expected: `${officialAbility.minNex}%`,
        actual: `${implemented.minNex}%`,
        reference: 'Livro Base v1.3',
      });
    }
  }
  
  return results;
}

/**
 * Valida que a primeira habilidade de cada trilha está marcada como inicial
 */
function validateTrackInitialAbilities(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const track of CLASS_TRACKS) {
    if (!track.abilities || track.abilities.length === 0) continue;
    
    // A primeira habilidade (NEX 10%) deve ser isInitial: true
    const firstAbility = track.abilities.find(a => a.minNex === 10);
    if (!firstAbility) continue;
    
    const passed = firstAbility.isInitial === true;
    
    results.push({
      passed,
      category: 'Trilhas',
      test: `Habilidade inicial de "${track.id}"`,
      expected: 'isInitial = true',
      actual: firstAbility.isInitial ? 'isInitial = true' : 'isInitial = false/undefined',
      reference: 'Livro Base v1.3',
    });
  }
  
  return results;
}

/**
 * Valida contagem de trilhas por classe (5 por classe)
 */
function validateTrackCountsByClass(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  const countByClass: Record<string, number> = {};
  for (const track of CLASS_TRACKS) {
    countByClass[track.classId] = (countByClass[track.classId] || 0) + 1;
  }
  
  for (const className of ['Combatente', 'Especialista', 'Ocultista']) {
    const expected = 5;
    const actual = countByClass[className] || 0;
    
    results.push({
      passed: actual === expected,
      category: 'Trilhas',
      test: `Quantidade de trilhas de ${className}`,
      expected: `${expected} trilhas`,
      actual: `${actual} trilhas`,
      reference: 'Livro Base v1.3',
    });
  }
  
  return results;
}

// ============== EXECUÇÃO DE VALIDAÇÃO ==============

/**
 * Executa todas as validações e retorna relatório completo
 */
export function runFullValidation(): ValidationReport {
  const allResults: ValidationResult[] = [
    // Rituais
    ...validateRitualCircles(),
    ...validateRitualCounts(),
    ...validateRitualCountsByCircle(),
    ...validateRitualStructure(),
    // Condições
    ...validateConditionsExist(),
    ...validateConditionCategories(),
    ...validateConditionParams(),
    // Dano e Modificadores
    ...validateDamageTypes(),
    ...validateDefenseModifiers(),
    ...validateTestModifiers(),
    // Poderes Paranormais
    ...validateParanormalPowersExist(),
    ...validateParanormalPowerElements(),
    ...validateParanormalPowerPrereqs(),
    ...validateParanormalPowerCounts(),
    // Origens
    ...validateOriginsExist(),
    ...validateOriginSkills(),
    ...validateOriginPowers(),
    // Classes
    ...validateClassBaseStats(),
    ...validateClassAbilitiesCount(),
    ...validateCoreAbilities(),
    ...validateAbilityStructure(),
    // Trilhas
    ...validateTracksExist(),
    ...validateTrackClasses(),
    ...validateTrackAbilityCount(),
    ...validateTrackAbilityNex(),
    ...validateTrackInitialAbilities(),
    ...validateTrackCountsByClass(),
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
export function validateCategory(
  category: 'rituais' | 'condições' | 'modificadores' | 'dano' | 'poderes' | 'origens' | 'classes' | 'trilhas'
): ValidationResult[] {
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
    case 'poderes':
      return [
        ...validateParanormalPowersExist(),
        ...validateParanormalPowerElements(),
        ...validateParanormalPowerPrereqs(),
        ...validateParanormalPowerCounts(),
      ];
    case 'origens':
      return [
        ...validateOriginsExist(),
        ...validateOriginSkills(),
        ...validateOriginPowers(),
      ];
    case 'classes':
      return [
        ...validateClassBaseStats(),
        ...validateClassAbilitiesCount(),
        ...validateCoreAbilities(),
        ...validateAbilityStructure(),
      ];
    case 'trilhas':
      return [
        ...validateTracksExist(),
        ...validateTrackClasses(),
        ...validateTrackAbilityCount(),
        ...validateTrackAbilityNex(),
        ...validateTrackInitialAbilities(),
        ...validateTrackCountsByClass(),
      ];
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
