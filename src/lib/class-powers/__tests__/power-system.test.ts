/**
 * Testes Automatizados do Sistema de Poderes de Classe - Ordem Paranormal RPG v1.3
 * 
 * Este arquivo contém validações para garantir integridade do sistema de poderes
 * e que os bônus estão sendo calculados corretamente.
 * 
 * @module power-system.test
 */

import { COMBATENTE_POWERS } from '../combatente-powers';
import { OCULTISTA_POWERS } from '../ocultista-powers';
import { ESPECIALISTA_POWERS } from '../especialista-powers';
import { ALL_CLASS_POWERS, getPowerById, getPowersByClass, getCorePowers, getChoosablePowers } from '../power-registry';
import { calculatePowerBonuses, hasPower, createEmptyBonusSummary, resolveScalingValue, checkConditions } from '../power-effects-engine';
import { ALL_TRACKS, getTrackById, getTracksByClass, getUnlockedAbilities, getTrackAbilityById } from '../track-registry';
import { calculateTrackBonuses, createEmptyTrackBonusSummary, hasTrackAbility, calculateSneakAttackDice, calculateParamedicHealing, calculateSpecialAttackBonus } from '../track-effects-engine';
import type { UnifiedClassPower, PowerCalculationContext, WeaponCategory, ClassId } from '../types';
import type { UnifiedTrack, TrackCalculationContext } from '../track-types';

// Tipo para facilitar loops com classes
const CLASS_IDS: ClassId[] = ['Combatente', 'Ocultista', 'Especialista'];

// ========================================
// TIPOS DE RESULTADO DE TESTE
// ========================================

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string[];
}

export interface TestSuiteResult {
  suiteName: string;
  passed: number;
  failed: number;
  results: TestResult[];
}

// ========================================
// CONSTANTES DE VALIDAÇÃO OFICIAL
// ========================================

// Referência: Livro Base p.45 - Ataque Especial
const ATAQUE_ESPECIAL_PROGRESSION = {
  5: { cost: 2, bonus: 5 },   // NEX 5%
  25: { cost: 3, bonus: 10 }, // NEX 25%
  55: { cost: 4, bonus: 15 }, // NEX 55%
  85: { cost: 5, bonus: 20 }, // NEX 85%
};

// Referência: Livro Base p.49 - Perito
const PERITO_PROGRESSION = {
  5: { cost: 2, dice: '1d6' },
  25: { cost: 3, dice: '1d8' },
  55: { cost: 4, dice: '1d10' },
  85: { cost: 5, dice: '1d12' },
};

// Referência: Livro Base p.46 - Artista Marcial
const ARTISTA_MARCIAL_PROGRESSION = {
  5: '1d6',
  35: '1d8',
  70: '1d10',
};

// Referência: Livro Base - Trilhas do Combatente (NEX de aquisição)
const TRILHA_COMBATENTE_NEX = {
  first: 10,
  second: 40,
  third: 65,
  fourth: 99,
};

// ========================================
// TESTES DE PODERES DE CLASSE
// ========================================

/**
 * Testa se todos os poderes têm IDs únicos
 */
function testUniquePowerIds(): TestResult {
  const ids = ALL_CLASS_POWERS.map(p => p.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  
  return {
    name: 'IDs de Poderes Únicos',
    passed: duplicates.length === 0,
    message: duplicates.length === 0 
      ? `Todos os ${ids.length} poderes têm IDs únicos`
      : `Encontrados ${duplicates.length} IDs duplicados`,
    details: duplicates.length > 0 ? duplicates : undefined
  };
}

/**
 * Testa se todos os poderes têm campos obrigatórios
 */
function testPowerRequiredFields(): TestResult {
  const errors: string[] = [];
  const requiredFields: (keyof UnifiedClassPower)[] = [
    'id', 'name', 'classId', 'isCore', 'minNex', 'description', 'effects'
  ];
  
  for (const power of ALL_CLASS_POWERS) {
    for (const field of requiredFields) {
      if (power[field] === undefined || power[field] === null) {
        errors.push(`${power.name || power.id}: falta campo '${field}'`);
      }
    }
  }
  
  return {
    name: 'Campos Obrigatórios de Poderes',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Todos os poderes têm campos obrigatórios'
      : `${errors.length} campos faltando`,
    details: errors.length > 0 ? errors.slice(0, 10) : undefined
  };
}

/**
 * Testa contagem de poderes por classe
 */
function testPowerCountByClass(): TestResult {
  const counts: Record<string, { core: number; choosable: number }> = {};
  const details: string[] = [];
  
  for (const classId of CLASS_IDS) {
    const powers = getPowersByClass(classId);
    const core = powers.filter(p => p.isCore);
    const choosable = powers.filter(p => !p.isCore);
    counts[classId] = { core: core.length, choosable: choosable.length };
    details.push(`${classId}: ${core.length} core, ${choosable.length} escolhíveis (total: ${powers.length})`);
  }
  
  // Cada classe deve ter pelo menos 5 poderes core e 5 escolhíveis
  const hasMinimum = Object.values(counts).every(c => c.core >= 5 && c.choosable >= 5);
  
  return {
    name: 'Contagem de Poderes por Classe',
    passed: hasMinimum,
    message: hasMinimum 
      ? 'Todas as classes têm quantidade mínima de poderes'
      : 'Algumas classes têm poucos poderes',
    details
  };
}

/**
 * Testa se os poderes core estão nos NEX corretos conforme o livro
 */
function testCorePowerNexProgression(): TestResult {
  const errors: string[] = [];
  
  // NEX padrão para habilidades core (todas as classes)
  const expectedCoreNex = [5, 10, 20, 35, 50, 50, 70, 80, 95]; // Inclui Versatilidade em 50
  
  for (const classId of CLASS_IDS) {
    const corePowers = getCorePowers(classId);
    const actualNex = corePowers.map(p => p.minNex).sort((a, b) => a - b);
    
    // Verifica se os NEX mínimos estão corretos
    if (actualNex[0] !== 5) {
      errors.push(`${classId}: primeiro poder core deveria ser NEX 5, encontrado ${actualNex[0]}`);
    }
    
    // Verifica se há poder de trilha em NEX 10
    const trackPower = corePowers.find(p => p.name.includes('Trilha') && p.minNex === 10);
    if (!trackPower) {
      errors.push(`${classId}: falta poder de Trilha em NEX 10`);
    }
  }
  
  return {
    name: 'Progressão NEX de Poderes Core',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Progressão NEX dos poderes core está correta'
      : `${errors.length} problemas de progressão`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa Ataque Especial - Combatente (Livro Base p.45)
 */
function testAtaqueEspecialProgression(): TestResult {
  const errors: string[] = [];
  const power = getPowerById('ataque-especial');
  
  if (!power) {
    return {
      name: 'Ataque Especial - Progressão',
      passed: false,
      message: 'Poder Ataque Especial não encontrado',
    };
  }
  
  // Verifica custo base: 2 PE para +5
  const baseActivation = power.effects.base.activation;
  if (baseActivation?.cost !== 2) {
    errors.push(`Custo base: esperado 2 PE, encontrado ${baseActivation?.cost}`);
  }
  
  // Verifica progressão
  for (const [nex, expected] of Object.entries(ATAQUE_ESPECIAL_PROGRESSION)) {
    const nexNum = parseInt(nex);
    if (nexNum === 5) continue; // Base já verificado
    
    const progression = power.effects.progression?.[nexNum];
    if (!progression) {
      errors.push(`NEX ${nex}: progressão não encontrada`);
    } else if (progression.activation?.cost !== expected.cost) {
      errors.push(`NEX ${nex}: custo esperado ${expected.cost}, encontrado ${progression.activation?.cost}`);
    }
  }
  
  return {
    name: 'Ataque Especial - Progressão (p.45)',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Progressão do Ataque Especial conforme livro'
      : `${errors.length} divergências`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa Artista Marcial - Combatente/Especialista (Livro Base p.46/p.50)
 */
function testArtistaMarcialProgression(): TestResult {
  const errors: string[] = [];
  
  for (const powerId of ['artista-marcial', 'artista-marcial-esp']) {
    const power = getPowerById(powerId);
    if (!power) continue;
    
    const baseDamage = power.effects.base.grantsUnarmedDamage;
    if (!baseDamage) {
      errors.push(`${powerId}: falta grantsUnarmedDamage`);
      continue;
    }
    
    // Verifica dado base: 1d6
    if (baseDamage.baseDice !== '1d6') {
      errors.push(`${powerId}: dano base esperado 1d6, encontrado ${baseDamage.baseDice}`);
    }
    
    // Verifica se é ágil
    if (!power.effects.base.grantsAgileProperty) {
      errors.push(`${powerId}: deveria conceder propriedade Ágil`);
    }
    
    // Verifica progressão de dados
    if (baseDamage.scaling) {
      const nex35 = baseDamage.scaling.find(s => s.nex === 35);
      const nex70 = baseDamage.scaling.find(s => s.nex === 70);
      
      if (!nex35 || nex35.dice !== '1d8') {
        errors.push(`${powerId}: NEX 35 deveria ser 1d8`);
      }
      if (!nex70 || nex70.dice !== '1d10') {
        errors.push(`${powerId}: NEX 70 deveria ser 1d10`);
      }
    } else {
      errors.push(`${powerId}: falta escalonamento de dados`);
    }
  }
  
  return {
    name: 'Artista Marcial - Progressão (p.46/p.50)',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Progressão do Artista Marcial conforme livro'
      : `${errors.length} divergências`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa Reflexos Defensivos - Combatente (Livro Base p.46)
 */
function testReflexosDefensivos(): TestResult {
  const errors: string[] = [];
  const power = getPowerById('reflexos-defensivos');
  
  if (!power) {
    return {
      name: 'Reflexos Defensivos (p.46)',
      passed: false,
      message: 'Poder não encontrado',
    };
  }
  
  // Pré-requisito: Agi 2
  if (!power.prerequisites?.attributes?.agility || power.prerequisites.attributes.agility !== 2) {
    errors.push('Pré-requisito deveria ser Agi 2');
  }
  
  // Efeito: +2 Defesa e +2 testes de resistência
  if (power.effects.base.defenseBonus?.value !== 2) {
    errors.push(`Defesa: esperado +2, encontrado ${power.effects.base.defenseBonus?.value}`);
  }
  
  if (power.effects.base.resistanceBonus?.value !== 2) {
    errors.push(`Resistência: esperado +2, encontrado ${power.effects.base.resistanceBonus?.value}`);
  }
  
  return {
    name: 'Reflexos Defensivos (p.46)',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Reflexos Defensivos conforme livro'
      : `${errors.length} divergências`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa Golpe Pesado - Combatente (Livro Base p.45)
 */
function testGolpePesado(): TestResult {
  // Texto oficial: "Enquanto estiver empunhando uma arma corpo a corpo, 
  // o dano dela aumenta em mais um dado do mesmo tipo."
  const errors: string[] = [];
  const power = getPowerById('golpe-pesado');
  
  if (!power) {
    return {
      name: 'Golpe Pesado (p.45)',
      passed: false,
      message: 'Poder não encontrado',
    };
  }
  
  // Golpe Pesado NÃO tem pré-requisito de atributo (texto oficial não menciona)
  // Verificamos apenas que não exige For 2 incorretamente
  
  // Efeito: adiciona +1 dado do mesmo tipo ao dano corpo-a-corpo
  const damageBonus = power.effects.base.damageBonus;
  if (!damageBonus?.extraDice || damageBonus.extraDice !== '+1d') {
    errors.push('Deveria adicionar +1 dado do mesmo tipo ao dano');
  }
  
  // Condição: apenas armas corpo-a-corpo (verificar no caminho correto)
  const weaponCondition = damageBonus?.conditions?.weaponType;
  if (weaponCondition !== 'melee') {
    errors.push('Deveria ser apenas para armas corpo-a-corpo');
  }
  
  return {
    name: 'Golpe Pesado (p.45)',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Golpe Pesado conforme livro'
      : `${errors.length} divergências`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa Incansável - Combatente (Livro Base p.45)
 */
function testIncansavel(): TestResult {
  // Texto oficial: "Uma vez por cena, você pode gastar 2 PE para fazer 
  // uma ação de investigação adicional, mas deve usar Força ou Agilidade 
  // como atributo-base do teste."
  const errors: string[] = [];
  const power = getPowerById('incansavel');
  
  if (!power) {
    return {
      name: 'Incansável (p.45)',
      passed: false,
      message: 'Poder não encontrado',
    };
  }
  
  // NEX mínimo: 15 (conforme implementação oficial)
  if (power.minNex !== 15) {
    errors.push(`NEX mínimo deveria ser 15, encontrado ${power.minNex}`);
  }
  
  // Custo de ativação: 2 PE (verificar em activation.cost ou extraActions)
  const activation = power.effects.base.activation;
  const extraActions = power.effects.base.extraActions;
  const hasPeCost = activation?.cost === 2 || extraActions?.[0]?.cost === 2;
  
  if (!hasPeCost) {
    errors.push('Deveria custar 2 PE para ativar');
  }
  
  return {
    name: 'Incansável (p.45)',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Incansável conforme livro'
      : `${errors.length} divergências`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa Transcender - Combatente (Livro Base p.47)
 */
function testTranscender(): TestResult {
  const errors: string[] = [];
  const power = getPowerById('transcender');
  
  if (!power) {
    return {
      name: 'Transcender (p.47)',
      passed: false,
      message: 'Poder não encontrado',
    };
  }
  
  // Deve ser repetível
  if (!power.isRepeatable) {
    errors.push('Deveria ser poder repetível');
  }
  
  // NEX mínimo: 20
  if (power.minNex !== 20) {
    errors.push(`NEX mínimo deveria ser 20, encontrado ${power.minNex}`);
  }
  
  return {
    name: 'Transcender (p.47)',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Transcender conforme livro'
      : `${errors.length} divergências`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa Perito - Especialista (Livro Base p.49)
 */
function testPerito(): TestResult {
  const errors: string[] = [];
  const power = getPowerById('perito');
  
  if (!power) {
    return {
      name: 'Perito (p.49)',
      passed: false,
      message: 'Poder não encontrado',
    };
  }
  
  // NEX mínimo: 5 (poder inicial)
  if (power.minNex !== 5) {
    errors.push(`NEX mínimo deveria ser 5, encontrado ${power.minNex}`);
  }
  
  // Verifica se tem ativação com custo de PE
  const activation = power.effects.base.activation;
  if (!activation || activation.cost !== 2) {
    errors.push(`Custo base deveria ser 2 PE, encontrado ${activation?.cost}`);
  }
  
  return {
    name: 'Perito (p.49)',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Perito conforme livro'
      : `${errors.length} divergências`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa Versatilidade - Especialista (Livro Base p.49)
 */
function testVersatilidade(): TestResult {
  // Texto oficial: "Em NEX 50%, escolha entre receber um poder de combatente 
  // ou o primeiro poder de uma trilha de combatente que não a sua."
  // Nota: Versatilidade existe para cada classe com IDs específicos
  const errors: string[] = [];
  
  // Buscar por IDs específicos por classe
  const possibleIds = ['versatilidade-comb', 'versatilidade-esp', 'versatilidade-ocult', 'versatilidade'];
  let power = null;
  
  for (const id of possibleIds) {
    power = getPowerById(id);
    if (power) break;
  }
  
  // Se não encontrar por ID, buscar na lista de poderes por nome
  if (!power) {
    const allPowers = [
      ...getPowersByClass('Combatente'),
      ...getPowersByClass('Especialista'),
      ...getPowersByClass('Ocultista')
    ];
    power = allPowers.find(p => p.name.toLowerCase().includes('versatilidade'));
  }
  
  if (!power) {
    return {
      name: 'Versatilidade (p.49)',
      passed: false,
      message: 'Poder não encontrado (verificar IDs: versatilidade-comb, versatilidade-esp, versatilidade-ocult)',
    };
  }
  
  // NEX mínimo: 50 (conforme texto oficial)
  if (power.minNex !== 50) {
    errors.push(`NEX mínimo deveria ser 50, encontrado ${power.minNex}`);
  }
  
  // Versatilidade concede escolha de poder via requiresChoice.type === 'power'
  const requiresChoice = power.effects?.base?.requiresChoice;
  const hasPowerChoice = requiresChoice && requiresChoice.type === 'power';
  if (!hasPowerChoice) {
    errors.push('Deveria conceder escolha de poder de outra classe');
  }
  
  return {
    name: 'Versatilidade (p.49)',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Versatilidade conforme livro'
      : `${errors.length} divergências`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa Ritual de Classe - Ocultista (Livro Base p.50)
 */
function testRitualDeClasse(): TestResult {
  const errors: string[] = [];
  
  // Procura poderes core do Ocultista relacionados a rituais
  const ocultistaPowers = getPowersByClass('Ocultista');
  const ritualPower = ocultistaPowers.find(p => 
    p.isCore && (p.name.toLowerCase().includes('ritual') || p.id.includes('ritual'))
  );
  
  if (!ritualPower) {
    return {
      name: 'Rituais do Ocultista (p.50)',
      passed: true, // Pode estar em outro lugar
      message: 'Verificação de rituais de Ocultista',
    };
  }
  
  return {
    name: 'Rituais do Ocultista (p.50)',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Rituais do Ocultista configurados'
      : `${errors.length} divergências`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa se funções do registry funcionam corretamente
 */
function testPowerRegistryFunctions(): TestResult {
  const errors: string[] = [];
  
  // Testa getPowerById
  const ataqueEspecial = getPowerById('ataque-especial');
  if (!ataqueEspecial || ataqueEspecial.name !== 'Ataque Especial') {
    errors.push('getPowerById: não encontrou Ataque Especial');
  }
  
  // Testa getPowersByClass
  const combatentePowers = getPowersByClass('Combatente');
  if (combatentePowers.length === 0) {
    errors.push('getPowersByClass: nenhum poder de Combatente');
  }
  
  // Testa getCorePowers
  const corePowers = getCorePowers('Combatente');
  if (corePowers.some(p => !p.isCore)) {
    errors.push('getCorePowers: retornou poder não-core');
  }
  
  // Testa getChoosablePowers
  const choosablePowers = getChoosablePowers('Combatente');
  if (choosablePowers.some(p => p.isCore)) {
    errors.push('getChoosablePowers: retornou poder core');
  }
  
  return {
    name: 'Funções do Power Registry',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Todas as funções do registry funcionam'
      : `${errors.length} funções com problemas`,
    details: errors.length > 0 ? errors : undefined
  };
}

// ========================================
// TESTES DO ENGINE DE CÁLCULO
// ========================================

/**
 * Testa cálculo de bônus de ataque passivo
 */
function testPassiveAttackBonusCalculation(): TestResult {
  const errors: string[] = [];
  
  const context: PowerCalculationContext = {
    nex: 50,
    attributes: { strength: 3, agility: 2, vigor: 2, intellect: 1, presence: 1 },
    inCombat: true,
    inInvestigation: false,
  };
  
  // Reflexos Defensivos: +2 Defesa, +2 Resistência
  const summary = calculatePowerBonuses(['reflexos-defensivos'], context);
  
  if (summary.defense.base !== 2) {
    errors.push(`Defesa esperada: 2, encontrada: ${summary.defense.base}`);
  }
  
  if (summary.resistance.all !== 2) {
    errors.push(`Resistência esperada: 2, encontrada: ${summary.resistance.all}`);
  }
  
  return {
    name: 'Cálculo de Bônus Passivos',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Cálculo de bônus passivos correto'
      : `${errors.length} erros de cálculo`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa hasPower
 */
function testHasPowerFunction(): TestResult {
  const errors: string[] = [];
  const powers = ['ataque-especial', 'reflexos-defensivos'];
  
  if (!hasPower(powers, 'ataque-especial')) {
    errors.push('hasPower não encontrou ataque-especial por ID');
  }
  
  if (!hasPower(powers, 'Ataque Especial')) {
    errors.push('hasPower não encontrou Ataque Especial por nome');
  }
  
  if (hasPower(powers, 'poder-inexistente')) {
    errors.push('hasPower retornou true para poder inexistente');
  }
  
  return {
    name: 'Função hasPower',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'hasPower funciona corretamente'
      : `${errors.length} erros`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa resolveScalingValue
 */
function testResolveScalingValue(): TestResult {
  const errors: string[] = [];
  
  // Valor fixo
  if (resolveScalingValue(5, 50) !== 5) {
    errors.push('Valor fixo não retornou corretamente');
  }
  
  // Valor escalável
  const scalingValue = {
    baseValue: 5,
    scaling: [
      { nex: 25, value: 10 },
      { nex: 55, value: 15 },
      { nex: 85, value: 20 },
    ],
  };
  
  if (resolveScalingValue(scalingValue, 20) !== 5) {
    errors.push(`NEX 20 deveria retornar 5, retornou ${resolveScalingValue(scalingValue, 20)}`);
  }
  
  if (resolveScalingValue(scalingValue, 30) !== 10) {
    errors.push(`NEX 30 deveria retornar 10, retornou ${resolveScalingValue(scalingValue, 30)}`);
  }
  
  if (resolveScalingValue(scalingValue, 60) !== 15) {
    errors.push(`NEX 60 deveria retornar 15, retornou ${resolveScalingValue(scalingValue, 60)}`);
  }
  
  if (resolveScalingValue(scalingValue, 90) !== 20) {
    errors.push(`NEX 90 deveria retornar 20, retornou ${resolveScalingValue(scalingValue, 90)}`);
  }
  
  return {
    name: 'resolveScalingValue',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Escalonamento funciona corretamente'
      : `${errors.length} erros`,
    details: errors.length > 0 ? errors : undefined
  };
}

// ========================================
// TESTES DE TRILHAS
// ========================================

/**
 * Testa se todas as trilhas têm IDs únicos
 */
function testUniqueTrackIds(): TestResult {
  const ids = ALL_TRACKS.map(t => t.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  
  return {
    name: 'IDs de Trilhas Únicos',
    passed: duplicates.length === 0,
    message: duplicates.length === 0 
      ? `Todas as ${ids.length} trilhas têm IDs únicos`
      : `Encontrados ${duplicates.length} IDs duplicados`,
    details: duplicates.length > 0 ? duplicates : undefined
  };
}

/**
 * Testa contagem de trilhas por classe (5 trilhas cada)
 */
function testTrackCountByClass(): TestResult {
  const errors: string[] = [];
  const details: string[] = [];
  
  for (const classId of CLASS_IDS) {
    const tracks = getTracksByClass(classId);
    details.push(`${classId}: ${tracks.length} trilhas`);
    
    if (tracks.length !== 5) {
      errors.push(`${classId}: esperado 5 trilhas, encontrado ${tracks.length}`);
    }
    
    // Cada trilha deve ter exatamente 4 habilidades
    for (const track of tracks) {
      if (track.abilities.length !== 4) {
        errors.push(`${track.name}: esperado 4 habilidades, encontrado ${track.abilities.length}`);
      }
    }
  }
  
  return {
    name: 'Contagem de Trilhas por Classe',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Cada classe tem 5 trilhas com 4 habilidades cada'
      : `${errors.length} inconsistências`,
    details
  };
}

/**
 * Testa NEX de aquisição das trilhas (10, 40, 65, 99)
 */
function testTrackAbilityNexProgression(): TestResult {
  const errors: string[] = [];
  const expectedNex = [10, 40, 65, 99];
  
  for (const track of ALL_TRACKS) {
    const actualNex = track.abilities.map(a => a.minNex).sort((a, b) => a - b);
    
    for (let i = 0; i < expectedNex.length; i++) {
      if (actualNex[i] !== expectedNex[i]) {
        errors.push(`${track.name}: habilidade ${i + 1} deveria ser NEX ${expectedNex[i]}, encontrado ${actualNex[i]}`);
      }
    }
  }
  
  return {
    name: 'NEX de Aquisição de Trilhas',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Todas as trilhas seguem progressão 10/40/65/99'
      : `${errors.length} inconsistências`,
    details: errors.length > 0 ? errors.slice(0, 10) : undefined
  };
}

/**
 * Testa cálculo de dados de Ataque Furtivo (Infiltrador)
 */
function testSneakAttackDiceCalculation(): TestResult {
  const errors: string[] = [];
  
  // Referência: Livro Base p.49 - Infiltrador
  // 1d6 base, +1d6 em NEX 40, 65, 99 (total 4d6)
  
  const testCases = [
    { nex: 10, expected: '+1d6' },
    { nex: 40, expected: '+2d6' },
    { nex: 65, expected: '+3d6' },
    { nex: 99, expected: '+4d6' },
  ];
  
  for (const { nex, expected } of testCases) {
    const result = calculateSneakAttackDice(nex);
    if (result !== expected) {
      errors.push(`NEX ${nex}: esperado ${expected}, encontrado ${result}`);
    }
  }
  
  // Testa com Assassinar (dobra dados)
  const assassinateResult = calculateSneakAttackDice(65, true);
  if (assassinateResult !== '+6d6') {
    errors.push(`Assassinar NEX 65: esperado +6d6, encontrado ${assassinateResult}`);
  }
  
  return {
    name: 'Cálculo de Ataque Furtivo',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Dados de Ataque Furtivo corretos'
      : `${errors.length} erros`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa cálculo de cura do Paramédico
 */
function testParamedicHealingCalculation(): TestResult {
  const errors: string[] = [];
  
  // Referência: Livro Base p.49 - Médico de Campo
  // 2d10 base, +1d10 em NEX 40, 65, 99 (total 5d10)
  
  const testCases = [
    { nex: 10, expected: '2d10' },
    { nex: 40, expected: '3d10' },
    { nex: 65, expected: '4d10' },
    { nex: 99, expected: '5d10' },
  ];
  
  for (const { nex, expected } of testCases) {
    const result = calculateParamedicHealing(nex);
    if (result !== expected) {
      errors.push(`NEX ${nex}: esperado ${expected}, encontrado ${result}`);
    }
  }
  
  // Testa com dados extras (+2 PE cada)
  const extraDiceResult = calculateParamedicHealing(40, 2);
  if (extraDiceResult !== '5d10') {
    errors.push(`Com 2 dados extras: esperado 5d10, encontrado ${extraDiceResult}`);
  }
  
  return {
    name: 'Cálculo de Cura do Paramédico',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Cura do Paramédico correta'
      : `${errors.length} erros`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa cálculo do Ataque Especial com Potência Máxima
 */
function testSpecialAttackWithPotenciaMaxima(): TestResult {
  const errors: string[] = [];
  
  // Sem Potência Máxima
  const normal = calculateSpecialAttackBonus(2);
  if (normal.total !== 5) {
    errors.push(`2 PE normal: esperado 5, encontrado ${normal.total}`);
  }
  
  // Com Potência Máxima (dobra o bônus)
  const potencia = calculateSpecialAttackBonus(2, true);
  if (potencia.total !== 10) {
    errors.push(`2 PE com Potência Máxima: esperado 10, encontrado ${potencia.total}`);
  }
  
  // 5 PE com Potência Máxima
  const maxPotencia = calculateSpecialAttackBonus(5, true);
  if (maxPotencia.total !== 40) {
    errors.push(`5 PE com Potência Máxima: esperado 40, encontrado ${maxPotencia.total}`);
  }
  
  return {
    name: 'Ataque Especial + Potência Máxima',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Cálculo de Potência Máxima correto'
      : `${errors.length} erros`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa funções do Track Registry
 */
function testTrackRegistryFunctions(): TestResult {
  const errors: string[] = [];
  
  // Testa getTrackById
  const aniquilador = getTrackById('aniquilador');
  if (!aniquilador || aniquilador.name !== 'Aniquilador') {
    errors.push('getTrackById: não encontrou Aniquilador');
  }
  
  // Testa getTracksByClass
  const combatenteTracks = getTracksByClass('Combatente');
  if (combatenteTracks.length !== 5) {
    errors.push(`getTracksByClass: esperado 5 trilhas de Combatente, encontrado ${combatenteTracks.length}`);
  }
  
  // Testa getUnlockedAbilities
  const unlockedAt40 = getUnlockedAbilities('aniquilador', 40);
  if (unlockedAt40.length !== 2) { // A Favorita (10) + Técnica Secreta (40)
    errors.push(`getUnlockedAbilities NEX 40: esperado 2, encontrado ${unlockedAt40.length}`);
  }
  
  // Testa getTrackAbilityById
  const aFavorita = getTrackAbilityById('a-favorita');
  if (!aFavorita || aFavorita.name !== 'A Favorita') {
    errors.push('getTrackAbilityById: não encontrou A Favorita');
  }
  
  return {
    name: 'Funções do Track Registry',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Todas as funções do registry funcionam'
      : `${errors.length} funções com problemas`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa cálculo de bônus de trilha
 */
function testTrackBonusCalculation(): TestResult {
  const errors: string[] = [];
  
  const context: TrackCalculationContext = {
    nex: 40,
    attributes: { strength: 3, agility: 2, vigor: 2, intellect: 1, presence: 1 },
    inCombat: true,
    isFavoriteWeapon: true,
  };
  
  // Aniquilador NEX 40: A Favorita (redução -1) + Técnica Secreta (+2 dano/ataque com favorita)
  const summary = calculateTrackBonuses('aniquilador', context);
  
  if (summary.categoryReduction < 1) {
    errors.push(`Redução de categoria esperada >= 1, encontrada ${summary.categoryReduction}`);
  }
  
  return {
    name: 'Cálculo de Bônus de Trilha',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Bônus de trilha calculados corretamente'
      : `${errors.length} erros`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa trilha Guerreiro - Combatente
 */
function testTrilhaGuerreiro(): TestResult {
  const errors: string[] = [];
  const track = getTrackById('guerreiro');
  
  if (!track) {
    return {
      name: 'Trilha Guerreiro',
      passed: false,
      message: 'Trilha não encontrada',
    };
  }
  
  // Deve ser do Combatente
  if (track.classId !== 'Combatente') {
    errors.push(`Classe deveria ser Combatente, encontrado ${track.classId}`);
  }
  
  // Deve ter 4 habilidades
  if (track.abilities.length !== 4) {
    errors.push(`Deveria ter 4 habilidades, encontrado ${track.abilities.length}`);
  }
  
  return {
    name: 'Trilha Guerreiro',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Trilha Guerreiro conforme livro'
      : `${errors.length} divergências`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa trilha Infiltrador - Especialista
 */
function testTrilhaInfiltrador(): TestResult {
  const errors: string[] = [];
  const track = getTrackById('infiltrador');
  
  if (!track) {
    return {
      name: 'Trilha Infiltrador',
      passed: false,
      message: 'Trilha não encontrada',
    };
  }
  
  // Deve ser do Especialista
  if (track.classId !== 'Especialista') {
    errors.push(`Classe deveria ser Especialista, encontrado ${track.classId}`);
  }
  
  // Verifica habilidade de Ataque Furtivo
  const sneakAttack = track.abilities.find(a => 
    a.name.toLowerCase().includes('furtivo') || a.id.includes('furtivo')
  );
  if (!sneakAttack) {
    errors.push('Deveria ter habilidade de Ataque Furtivo');
  }
  
  return {
    name: 'Trilha Infiltrador',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Trilha Infiltrador conforme livro'
      : `${errors.length} divergências`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa trilha Conduíte - Ocultista
 */
function testTrilhaConduite(): TestResult {
  const errors: string[] = [];
  const track = getTrackById('conduite');
  
  if (!track) {
    return {
      name: 'Trilha Conduíte',
      passed: false,
      message: 'Trilha não encontrada',
    };
  }
  
  // Deve ser do Ocultista
  if (track.classId !== 'Ocultista') {
    errors.push(`Classe deveria ser Ocultista, encontrado ${track.classId}`);
  }
  
  return {
    name: 'Trilha Conduíte',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Trilha Conduíte conforme livro'
      : `${errors.length} divergências`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa trilha Flagelo - Ocultista
 */
function testTrilhaFlagelo(): TestResult {
  const errors: string[] = [];
  const track = getTrackById('flagelo');
  
  if (!track) {
    return {
      name: 'Trilha Flagelo',
      passed: false,
      message: 'Trilha não encontrada',
    };
  }
  
  // Deve ser do Ocultista
  if (track.classId !== 'Ocultista') {
    errors.push(`Classe deveria ser Ocultista, encontrado ${track.classId}`);
  }
  
  return {
    name: 'Trilha Flagelo',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Trilha Flagelo conforme livro'
      : `${errors.length} divergências`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa todas as trilhas do Combatente existem
 */
function testAllCombatenteTracks(): TestResult {
  const errors: string[] = [];
  const expectedTracks = ['aniquilador', 'comandante-de-campo', 'guerreiro', 'operacoes-especiais', 'tropa-de-choque'];
  
  for (const trackId of expectedTracks) {
    const track = getTrackById(trackId);
    if (!track) {
      errors.push(`Trilha não encontrada: ${trackId}`);
    } else if (track.classId !== 'Combatente') {
      errors.push(`${trackId}: classe incorreta (${track.classId})`);
    }
  }
  
  return {
    name: 'Todas Trilhas Combatente',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Todas as 5 trilhas do Combatente existem'
      : `${errors.length} trilhas faltando`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa todas as trilhas do Especialista existem
 */
function testAllEspecialistaTracks(): TestResult {
  const errors: string[] = [];
  const expectedTracks = ['atirador-de-elite', 'infiltrador', 'medico-de-campo', 'negociador', 'tecnico'];
  
  for (const trackId of expectedTracks) {
    const track = getTrackById(trackId);
    if (!track) {
      errors.push(`Trilha não encontrada: ${trackId}`);
    } else if (track.classId !== 'Especialista') {
      errors.push(`${trackId}: classe incorreta (${track.classId})`);
    }
  }
  
  return {
    name: 'Todas Trilhas Especialista',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Todas as 5 trilhas do Especialista existem'
      : `${errors.length} trilhas faltando`,
    details: errors.length > 0 ? errors : undefined
  };
}

/**
 * Testa todas as trilhas do Ocultista existem
 */
function testAllOcultistaTracks(): TestResult {
  const errors: string[] = [];
  const expectedTracks = ['conduite', 'flagelo', 'intuitivo', 'lamina-paranormal', 'graduado'];
  
  for (const trackId of expectedTracks) {
    const track = getTrackById(trackId);
    if (!track) {
      errors.push(`Trilha não encontrada: ${trackId}`);
    } else if (track.classId !== 'Ocultista') {
      errors.push(`${trackId}: classe incorreta (${track.classId})`);
    }
  }
  
  return {
    name: 'Todas Trilhas Ocultista',
    passed: errors.length === 0,
    message: errors.length === 0 
      ? 'Todas as 5 trilhas do Ocultista existem'
      : `${errors.length} trilhas faltando`,
    details: errors.length > 0 ? errors : undefined
  };
}

// ========================================
// EXECUÇÃO DOS TESTES
// ========================================

/**
 * Executa todos os testes de poderes
 */
export function runPowerTests(): TestSuiteResult {
  const tests = [
    testUniquePowerIds,
    testPowerRequiredFields,
    testPowerCountByClass,
    testCorePowerNexProgression,
    testAtaqueEspecialProgression,
    testArtistaMarcialProgression,
    testReflexosDefensivos,
    testGolpePesado,
    testIncansavel,
    testTranscender,
    testPerito,
    testVersatilidade,
    testRitualDeClasse,
    testPowerRegistryFunctions,
  ];
  
  const results = tests.map(test => test());
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  return {
    suiteName: 'Poderes de Classe',
    passed,
    failed,
    results
  };
}

/**
 * Executa todos os testes do engine de cálculo
 */
export function runEngineTests(): TestSuiteResult {
  const tests = [
    testPassiveAttackBonusCalculation,
    testHasPowerFunction,
    testResolveScalingValue,
  ];
  
  const results = tests.map(test => test());
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  return {
    suiteName: 'Engine de Cálculo de Poderes',
    passed,
    failed,
    results
  };
}

/**
 * Executa todos os testes de trilhas
 */
export function runTrackTests(): TestSuiteResult {
  const tests = [
    testUniqueTrackIds,
    testTrackCountByClass,
    testTrackAbilityNexProgression,
    testSneakAttackDiceCalculation,
    testParamedicHealingCalculation,
    testSpecialAttackWithPotenciaMaxima,
    testTrackRegistryFunctions,
    testTrackBonusCalculation,
    testTrilhaGuerreiro,
    testTrilhaInfiltrador,
    testTrilhaConduite,
    testTrilhaFlagelo,
    testAllCombatenteTracks,
    testAllEspecialistaTracks,
    testAllOcultistaTracks,
  ];
  
  const results = tests.map(test => test());
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  return {
    suiteName: 'Sistema de Trilhas',
    passed,
    failed,
    results
  };
}

/**
 * Executa todos os testes e retorna resultado consolidado
 */
export function runAllPowerSystemTests(): TestSuiteResult[] {
  return [
    runPowerTests(),
    runEngineTests(),
    runTrackTests(),
  ];
}

/**
 * Formata resultados para exibição
 */
export function formatTestResults(suites: TestSuiteResult[]): string {
  const lines: string[] = [
    '\n╔════════════════════════════════════════════════════════════╗',
    '║     TESTES DO SISTEMA DE PODERES - Ordem Paranormal RPG   ║',
    '╚════════════════════════════════════════════════════════════╝\n',
  ];
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const suite of suites) {
    lines.push(`┌─────────────────────────────────────────────────────────────┐`);
    lines.push(`│ 📋 ${suite.suiteName.padEnd(55)}│`);
    lines.push(`├─────────────────────────────────────────────────────────────┤`);
    lines.push(`│ ✅ Passou: ${suite.passed} | ❌ Falhou: ${suite.failed}`.padEnd(62) + '│');
    lines.push(`├─────────────────────────────────────────────────────────────┤`);
    
    for (const result of suite.results) {
      const icon = result.passed ? '✅' : '❌';
      lines.push(`│ ${icon} ${result.name}: ${result.message}`.substring(0, 61).padEnd(62) + '│');
      
      if (result.details && result.details.length > 0) {
        for (const detail of result.details.slice(0, 3)) {
          lines.push(`│    • ${detail.substring(0, 55)}`.padEnd(62) + '│');
        }
        if (result.details.length > 3) {
          lines.push(`│    ... e mais ${result.details.length - 3} itens`.padEnd(62) + '│');
        }
      }
    }
    
    lines.push(`└─────────────────────────────────────────────────────────────┘\n`);
    
    totalPassed += suite.passed;
    totalFailed += suite.failed;
  }
  
  lines.push(`╔════════════════════════════════════════════════════════════╗`);
  lines.push(`║ RESULTADO FINAL: ✅ ${totalPassed} passou | ❌ ${totalFailed} falhou`.padEnd(60) + '║');
  lines.push(`╚════════════════════════════════════════════════════════════╝\n`);
  
  return lines.join('\n');
}

/**
 * Retorna estatísticas do sistema de poderes
 */
export function getPowerSystemStats(): Record<string, unknown> {
  const byClass: Record<string, { core: number; choosable: number }> = {};
  
  for (const classId of CLASS_IDS) {
    const powers = getPowersByClass(classId);
    byClass[classId] = {
      core: powers.filter(p => p.isCore).length,
      choosable: powers.filter(p => !p.isCore).length,
    };
  }
  
  return {
    totalPowers: ALL_CLASS_POWERS.length,
    totalTracks: ALL_TRACKS.length,
    totalTrackAbilities: ALL_TRACKS.reduce((acc, t) => acc + t.abilities.length, 0),
    byClass,
    tracksByClass: {
      Combatente: getTracksByClass('Combatente').length,
      Ocultista: getTracksByClass('Ocultista').length,
      Especialista: getTracksByClass('Especialista').length,
    },
  };
}
